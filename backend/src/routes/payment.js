/**
 * 支付网关路由
 * 提供：下单、调起支付、回调、查询
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const paymentService = require('../services/paymentService');
const logger = require('../utils/logger');
const wechatPay = require('../services/wechatPay');
const alipay = require('../services/alipay');

// 支持的充值金额档位
const RECHARGE_AMOUNT_OPTIONS = [100, 500, 2000, 10000];

// 支持的支付方式（根据环境变量/证书动态判断是否可用）
function getGatewayOptions() {
  return [
    { value: 'mock', label: '模拟支付（测试）', available: true },
    { value: 'wechat', label: '微信支付', available: wechatPay.isConfigured(), reason: wechatPay.isConfigured() ? '微信 Native 支付可用' : '微信 API 凭证未配置完整' },
    { value: 'alipay', label: '支付宝', available: alipay.isConfigured(), reason: alipay.isConfigured() ? '支付宝电脑网站支付可用' : '支付宝 API 凭证未配置完整' }
  ];
}

/**
 * 获取支付配置（金额档位、支付方式）
 * GET /api/payment/config
 */
router.get('/config', (req, res) => {
  res.json({
    success: true,
    data: {
      amountOptions: RECHARGE_AMOUNT_OPTIONS,
      gateways: getGatewayOptions()
    }
  });
});

/**
 * 创建充值订单
 * POST /api/payment/create
 * Body: { amount: number, gateway: 'mock' | 'wechat' | 'alipay' }
 */
router.post('/create', authenticate, async (req, res) => {
  try {
    const { amount, gateway = 'mock' } = req.body;
    const userId = req.user.id;

    if (!amount || amount < 1) {
      return res.status(400).json({ success: false, message: '充值金额不能小于 1 元' });
    }

    const supportedGateways = getGatewayOptions().map(g => g.value);
    if (!supportedGateways.includes(gateway)) {
      return res.status(400).json({ success: false, message: `不支持的支付方式: ${gateway}` });
    }

    if (gateway === 'wechat' && !process.env.WECHAT_PAY_MCHID) {
      return res.status(400).json({
        success: false,
        message: '微信支付待 API 凭证配置后启用，当前请使用 mock 模式测试'
      });
    }

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const order = await paymentService.createRechargeOrder({
      userId,
      amount,
      gateway,
      clientIp,
      description: `充值 ${amount.toFixed(2)} CNY`
    });

    res.json({
      success: true,
      order: {
        id: order.id,
        orderNo: order.third_party_order_id,
        amount: parseFloat(order.amount),
        gateway: order.gateway,
        status: order.status,
        createdAt: order.created_at,
        expireAt: order.expire_at
      }
    });
  } catch (error) {
    logger.error('创建充值订单失败:', error);
    res.status(500).json({ success: false, message: error.message || '创建订单失败' });
  }
});

/**
 * 调起支付
 * POST /api/payment/:orderId/pay
 */
router.post('/:orderId/pay', authenticate, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await paymentService.getOrderById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }

    if (order.user_id !== userId) {
      return res.status(403).json({ success: false, message: '无权访问该订单' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ success: false, message: `订单状态为 ${order.status}，无法支付` });
    }

    const payParams = await paymentService.initiatePayment(order);

    res.json({
      success: true,
      payParams
    });
  } catch (error) {
    logger.error('调起支付失败:', error);
    res.status(500).json({ success: false, message: error.message || '调起支付失败' });
  }
});

/**
 * 查询订单列表
 * GET /api/payment/orders?status=&limit=20&offset=0
 */
router.get('/orders', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 20, offset = 0 } = req.query;

    const orders = await paymentService.listUserOrders(userId, {
      status,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    res.json({
      success: true,
      orders: orders.map(order => ({
        id: order.id,
        orderNo: order.third_party_order_id,
        amount: parseFloat(order.amount),
        gateway: order.gateway,
        status: order.status,
        createdAt: order.created_at,
        paidAt: order.paid_at,
        completedAt: order.completed_at
      }))
    });
  } catch (error) {
    logger.error('查询订单列表失败:', error);
    res.status(500).json({ success: false, message: error.message || '查询失败' });
  }
});

/**
 * 查询单个订单
 * GET /api/payment/orders/:orderId
 */
router.get('/orders/:orderId', authenticate, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await paymentService.getOrderById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }

    if (order.user_id !== userId) {
      return res.status(403).json({ success: false, message: '无权访问该订单' });
    }

    res.json({
      success: true,
      order: {
        id: order.id,
        orderNo: order.third_party_order_id,
        amount: parseFloat(order.amount),
        gateway: order.gateway,
        status: order.status,
        createdAt: order.created_at,
        paidAt: order.paid_at,
        completedAt: order.completed_at,
        expireAt: order.expire_at
      }
    });
  } catch (error) {
    logger.error('查询订单失败:', error);
    res.status(500).json({ success: false, message: error.message || '查询失败' });
  }
});

/**
 * 模拟支付自动成功（仅用于开发测试）
 * POST /api/payment/mock/auto-pay
 * Body: { orderNo: string }
 */
router.post('/mock/auto-pay', authenticate, async (req, res) => {
  try {
    const { orderNo } = req.body;

    if (!orderNo) {
      return res.status(400).json({ success: false, message: '缺少订单号' });
    }

    const order = await paymentService.getOrderByNo(orderNo);

    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }

    if (order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: '无权访问该订单' });
    }

    const result = await paymentService.handlePaymentSuccess(
      orderNo,
      `MOCK_${Date.now()}`,
      { mock: true, autoPay: true }
    );

    res.json({
      success: true,
      message: '模拟支付成功',
      alreadyProcessed: result.alreadyProcessed,
      order: {
        id: result.order.id,
        orderNo: result.order.third_party_order_id,
        status: result.order.status,
        amount: parseFloat(result.order.amount)
      },
      newBalance: result.newBalance
    });
  } catch (error) {
    logger.error('模拟支付失败:', error);
    res.status(500).json({ success: false, message: error.message || '模拟支付失败' });
  }
});

/**
 * 模拟支付回调（仅用于开发测试）
 * POST /api/payment/mock/callback
 * Body: { orderNo: string, status: 'success' | 'fail' }
 */
router.post('/mock/callback', async (req, res) => {
  try {
    const { orderNo, status = 'success' } = req.body;

    if (!orderNo) {
      return res.status(400).json({ success: false, message: '缺少订单号' });
    }

    if (status === 'success') {
      const result = await paymentService.handlePaymentSuccess(orderNo, `MOCK_${Date.now()}`);
      res.json({ success: true, message: '回调处理成功', alreadyProcessed: result.alreadyProcessed });
    } else {
      const result = await paymentService.handlePaymentFailure(orderNo, 'mock callback failed');
      res.json({ success: true, message: '回调处理成功', status: result.order.status });
    }
  } catch (error) {
    logger.error('模拟回调处理失败:', error);
    res.status(500).json({ success: false, message: error.message || '回调处理失败' });
  }
});

/**
 * 微信支付回调
 * POST /api/payment/wechat/callback
 */
router.post('/wechat/callback', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const rawBody = req.body ? req.body.toString('utf8') : '';

    if (!rawBody) {
      logger.warn('微信支付回调请求体为空');
      return res.status(400).send('FAIL');
    }

    // 1. 验证签名
    const verified = wechatPay.verifyCallbackSignature(req.headers, rawBody);
    if (!verified) {
      logger.error('微信支付回调签名验证失败');
      return res.status(400).send('FAIL');
    }

    // 2. 解密回调数据
    const body = JSON.parse(rawBody);
    const decrypted = wechatPay.decryptCallbackResource(body);
    const { out_trade_no, transaction_id, trade_state } = decrypted;

    logger.info('微信支付回调解密成功，订单号:', out_trade_no, '状态:', trade_state);

    // 3. 处理订单状态
    if (trade_state === 'SUCCESS') {
      await paymentService.handlePaymentSuccess(out_trade_no, transaction_id, decrypted);
    } else if (['CLOSED', 'REVOKED', 'PAYERROR'].includes(trade_state)) {
      await paymentService.handlePaymentFailure(out_trade_no, `trade_state: ${trade_state}`);
    }

    res.status(200).send('SUCCESS');
  } catch (error) {
    logger.error('微信支付回调处理失败:', error);
    // 返回 500 让微信重试
    res.status(500).send('FAIL');
  }
});

/**
 * 支付宝回调
 * POST /api/payment/alipay/callback
 */
router.post('/alipay/callback', async (req, res) => {
  try {
    const alipay = require('../services/alipay');

    if (!alipay.isConfigured()) {
      logger.warn('收到支付宝回调，但未配置 ALIPAY_* 环境变量');
      return res.status(200).send('success');
    }

    const params = req.body;
    const verified = alipay.verifyCallback(params);

    if (!verified) {
      logger.error('支付宝回调签名验证失败');
      return res.status(400).send('fail');
    }

    const { out_trade_no, trade_status, trade_no } = params;

    if (trade_status === 'TRADE_SUCCESS' || trade_status === 'TRADE_FINISHED') {
      await paymentService.handlePaymentSuccess(out_trade_no, trade_no, params);
    } else if (trade_status === 'TRADE_CLOSED') {
      await paymentService.handlePaymentFailure(out_trade_no, `trade_status: ${trade_status}`);
    }

    res.status(200).send('success');
  } catch (error) {
    logger.error('支付宝回调处理失败:', error);
    res.status(500).send('fail');
  }
});

module.exports = router;
