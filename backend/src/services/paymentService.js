/**
 * 支付网关服务
 * 支持：mock（本地测试）、wechat（微信支付）、alipay（支付宝）
 * 当前阶段：mock 模式可用，微信/支付宝为占位实现，待 ICP 备案号及商户号开通后接入 SDK
 */

const pool = require('../db/pool');
const logger = require('../utils/logger');

/**
 * 生成唯一订单号
 * 格式：RO{YYYYMMDD}{6位随机数}
 */
function generateOrderNo() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(100000 + Math.random() * 900000);
  return `RO${y}${m}${d}${random}`;
}

/**
 * 格式化金额（分/元）
 */
function toYuan(amount) {
  return parseFloat(amount).toFixed(2);
}

function toFen(amount) {
  return Math.round(parseFloat(amount) * 100);
}

/**
 * 创建充值订单
 */
async function createRechargeOrder({ userId, amount, gateway = 'mock', clientIp, description, metadata = {} }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 获取或创建钱包
    let walletResult = await client.query(
      'SELECT id FROM wallets WHERE user_id = $1',
      [userId]
    );

    let walletId = walletResult.rows[0]?.id;
    if (!walletId) {
      const newWallet = await client.query(
        'INSERT INTO wallets (user_id, balance, frozen) VALUES ($1, 0, 0) RETURNING id',
        [userId]
      );
      walletId = newWallet.rows[0].id;
    }

    const orderNo = generateOrderNo();
    const expireAt = new Date(Date.now() + 30 * 60 * 1000); // 30 分钟有效

    const orderResult = await client.query(
      `INSERT INTO recharge_orders
       (user_id, wallet_id, amount, currency, payment_method, gateway, status,
        third_party_order_id, description, client_ip, notify_url, expire_at, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        userId,
        walletId,
        toYuan(amount),
        'CNY',
        gateway,
        gateway,
        'pending',
        orderNo,
        description || `充值 ${toYuan(amount)} CNY`,
        clientIp || null,
        null,
        expireAt,
        JSON.stringify(metadata)
      ]
    );

    await client.query('COMMIT');
    return orderResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('创建充值订单失败:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 调起支付（统一下单）
 * 返回支付参数供前端使用
 */
async function initiatePayment(order) {
  const { gateway, id: orderId, third_party_order_id: orderNo, amount } = order;
  const amountYuan = toYuan(amount);

  switch (gateway) {
    case 'mock':
      return {
        gateway: 'mock',
        orderId,
        orderNo,
        amount: amountYuan,
        payUrl: `/api/payment/mock/pay?order_no=${orderNo}`,
        autoPayUrl: `/api/payment/mock/auto-pay?order_no=${orderNo}`,
        // 前端调用 autoPayUrl 可立即模拟支付成功
        message: '模拟支付：调用 autoPayUrl 即可视为支付成功'
      };

    case 'wechat':
      // TODO: 接入微信支付 Native/JSAPI SDK
      // 需要：mch_id, app_id, API v3 密钥, 证书
      logger.info('微信支付下单占位，订单号:', orderNo);
      return {
        gateway: 'wechat',
        orderId,
        orderNo,
        amount: amountYuan,
        codeUrl: null, // 微信支付二维码内容
        message: '微信支付 SDK 待接入，请使用 mock 模式测试'
      };

    case 'alipay':
      // TODO: 接入支付宝 SDK
      // 需要：APPID, 应用私钥, 支付宝公钥
      logger.info('支付宝下单占位，订单号:', orderNo);
      return {
        gateway: 'alipay',
        orderId,
        orderNo,
        amount: amountYuan,
        orderString: null, // 支付宝 order string
        message: '支付宝 SDK 待接入，请使用 mock 模式测试'
      };

    default:
      throw new Error(`不支持的支付方式: ${gateway}`);
  }
}

/**
 * 根据订单号查询订单
 */
async function getOrderByNo(orderNo) {
  const result = await pool.query(
    'SELECT * FROM recharge_orders WHERE third_party_order_id = $1',
    [orderNo]
  );
  return result.rows[0] || null;
}

/**
 * 根据订单 ID 查询订单
 */
async function getOrderById(orderId) {
  const result = await pool.query(
    'SELECT * FROM recharge_orders WHERE id = $1',
    [orderId]
  );
  return result.rows[0] || null;
}

/**
 * 验证支付通知签名（mock 简单通过，真实接入时实现）
 */
function verifyNotifySignature(gateway, body, headers) {
  if (gateway === 'mock') {
    return true;
  }
  // TODO: 微信支付：验证 Wechatpay-Signature
  // TODO: 支付宝：验证 sign
  logger.warn('真实支付签名验证未实现，gateway:', gateway);
  return false;
}

/**
 * 处理支付成功回调
 * 幂等设计：只有 pending 订单才会更新
 */
async function handlePaymentSuccess(orderNo, thirdPartyTransactionId, gatewayRawResponse = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 锁定订单行
    const orderResult = await client.query(
      'SELECT * FROM recharge_orders WHERE third_party_order_id = $1 FOR UPDATE',
      [orderNo]
    );

    if (orderResult.rows.length === 0) {
      throw new Error('订单不存在');
    }

    const order = orderResult.rows[0];

    if (order.status === 'paid' || order.status === 'completed') {
      await client.query('COMMIT');
      return { alreadyProcessed: true, order };
    }

    if (order.status !== 'pending') {
      throw new Error(`订单状态异常: ${order.status}`);
    }

    const userId = order.user_id;
    const walletId = order.wallet_id;
    const amount = parseFloat(order.amount);

    // 更新订单状态
    const updatedOrderResult = await client.query(
      `UPDATE recharge_orders
       SET status = $1, paid_at = CURRENT_TIMESTAMP, completed_at = CURRENT_TIMESTAMP,
           third_party_transaction_id = $2, gateway_raw_response = $3
       WHERE id = $4
       RETURNING *`,
      ['completed', thirdPartyTransactionId || null, JSON.stringify(gatewayRawResponse), order.id]
    );

    // 获取钱包当前余额
    const walletResult = await client.query(
      'SELECT * FROM wallets WHERE id = $1',
      [walletId]
    );

    if (walletResult.rows.length === 0) {
      throw new Error('钱包不存在');
    }

    const wallet = walletResult.rows[0];
    const newBalance = parseFloat(wallet.balance) + amount;

    // 更新钱包余额
    await client.query(
      'UPDATE wallets SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newBalance, walletId]
    );

    // 创建钱包交易记录
    await client.query(
      `INSERT INTO wallet_transactions
       (user_id, wallet_id, related_recharge_order_id, transaction_type, direction,
        amount, currency, description, status, balance_after, frozen_after)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        userId,
        walletId,
        order.id,
        'recharge',
        'in',
        amount,
        'CNY',
        `充值 ${amount.toFixed(2)} CNY（${order.gateway}）`,
        'completed',
        newBalance,
        wallet.frozen || 0
      ]
    );

    await client.query('COMMIT');
    logger.info('支付成功回调处理完成，订单号:', orderNo, '金额:', amount);

    return { alreadyProcessed: false, order: updatedOrderResult.rows[0], newBalance };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('处理支付回调失败:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 处理支付失败/取消回调
 */
async function handlePaymentFailure(orderNo, reason = '') {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const orderResult = await client.query(
      'SELECT * FROM recharge_orders WHERE third_party_order_id = $1 FOR UPDATE',
      [orderNo]
    );

    if (orderResult.rows.length === 0) {
      throw new Error('订单不存在');
    }

    const order = orderResult.rows[0];

    if (order.status !== 'pending') {
      await client.query('COMMIT');
      return { alreadyProcessed: true, order };
    }

    const updatedOrderResult = await client.query(
      `UPDATE recharge_orders
       SET status = $1, cancelled_at = CURRENT_TIMESTAMP, description = CONCAT(description, ' [失败: ', $2, ']')
       WHERE id = $3
       RETURNING *`,
      ['failed', reason || 'unknown', order.id]
    );

    await client.query('COMMIT');
    return { alreadyProcessed: false, order: updatedOrderResult.rows[0] };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('处理支付失败回调失败:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 列出用户的充值订单
 */
async function listUserOrders(userId, { status, limit = 20, offset = 0 } = {}) {
  let query = 'SELECT * FROM recharge_orders WHERE user_id = $1';
  const params = [userId];

  if (status) {
    query += ` AND status = $${params.length + 1}`;
    params.push(status);
  }

  query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);
  return result.rows;
}

module.exports = {
  generateOrderNo,
  toYuan,
  toFen,
  createRechargeOrder,
  initiatePayment,
  getOrderByNo,
  getOrderById,
  verifyNotifySignature,
  handlePaymentSuccess,
  handlePaymentFailure,
  listUserOrders
};
