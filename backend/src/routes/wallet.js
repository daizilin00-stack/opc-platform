const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

/**
 * 钱包系统
 * 核心功能：充值、查询余额、交易记录、新用户奖励
 */

// 获取钱包信息
router.get('/info', authenticate, async (req, res) => {
  try {
    const user_id = req.user.id;
    
    const result = await pool.query(
      'SELECT * FROM wallets WHERE user_id = $1',
      [user_id]
    );
    
    if (result.rows.length === 0) {
      // 创建新钱包
      const newWallet = await pool.query(
        'INSERT INTO wallets (user_id, balance, frozen) VALUES ($1, 0, 0) RETURNING *',
        [user_id]
      );
      
      return res.json({
        success: true,
        wallet: newWallet.rows[0],
        is_new: true
      });
    }
    
    res.json({
      success: true,
      wallet: result.rows[0],
      is_new: false
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 充值（创建充值订单）
router.post('/recharge', authenticate, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { amount, payment_method } = req.body;
    const user_id = req.user.id;
    
    // 验证金额
    if (!amount || amount < 1) {
      throw new Error('充值金额不能小于1元');
    }
    
    // 获取钱包ID
    const walletResult = await client.query(
      'SELECT id FROM wallets WHERE user_id = $1',
      [user_id]
    );
    
    const wallet_id = walletResult.rows.length > 0 ? walletResult.rows[0].id : null;
    
    // 创建充值订单
    const orderResult = await client.query(
      `INSERT INTO recharge_orders 
       (user_id, wallet_id, amount, payment_method, status, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user_id, wallet_id, amount, payment_method || 'manual', 'pending', 
       `充值 ${amount} CNY`]
    );
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      order: orderResult.rows[0],
      message: '充值订单已创建',
      payment_instruction: '请通过微信支付/支付宝完成付款，付款后联系客服确认'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
});

// 确认充值（管理员/系统自动确认）
router.post('/recharge/confirm', authenticate, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { order_id, third_party_transaction_id } = req.body;
    
    // 查询订单
    const orderCheck = await client.query(
      'SELECT * FROM recharge_orders WHERE id = $1 AND status = $2',
      [order_id, 'pending']
    );
    
    if (orderCheck.rows.length === 0) {
      throw new Error('充值订单不存在或已处理');
    }
    
    const order = orderCheck.rows[0];
    const user_id = order.user_id;
    const amount = parseFloat(order.amount);
    
    // 获取或创建钱包
    const walletResult = await client.query(
      'SELECT * FROM wallets WHERE user_id = $1',
      [user_id]
    );
    
    let wallet;
    if (walletResult.rows.length > 0) {
      wallet = walletResult.rows[0];
      const newBalance = parseFloat(wallet.balance) + amount;
      await client.query(
        'UPDATE wallets SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
        [newBalance, user_id]
      );
    } else {
      const newWallet = await client.query(
        'INSERT INTO wallets (user_id, balance) VALUES ($1, $2) RETURNING *',
        [user_id, amount]
      );
      wallet = newWallet.rows[0];
    }
    
    // 更新订单状态
    await client.query(
      `UPDATE recharge_orders 
       SET status = $1, paid_at = CURRENT_TIMESTAMP, completed_at = CURRENT_TIMESTAMP, 
           third_party_transaction_id = $2
       WHERE id = $3`,
      ['paid', third_party_transaction_id || null, order_id]
    );
    
    // 创建钱包交易记录
    await client.query(
      `INSERT INTO wallet_transactions 
       (user_id, wallet_id, transaction_type, direction, amount, currency, 
        related_billing_item_id, description, status, balance_after, frozen_after)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [user_id, wallet.id, 'recharge', 'in', amount, 'CNY', 
       null, `充值 ${amount} CNY`, 'completed', 
       parseFloat(wallet.balance) + amount, wallet.frozen || 0]
    );
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: '充值成功',
      amount: amount,
      new_balance: parseFloat(wallet.balance) + amount
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
});

// 交易记录
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { type, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT t.*, e.task_id as related_task
      FROM wallet_transactions t
      LEFT JOIN escrow_payments e ON t.related_escrow_id = e.id
      WHERE t.user_id = $1
    `;
    
    const params = [user_id];
    
    if (type) {
      query += ` AND t.transaction_type = $${params.length + 1}`;
      params.push(type);
    }
    
    query += ` ORDER BY t.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // 统计
    const stats = await pool.query(
      `SELECT 
        COUNT(*) as total_count,
        SUM(CASE WHEN direction = 'in' THEN amount ELSE 0 END) as total_in,
        SUM(CASE WHEN direction = 'out' THEN amount ELSE 0 END) as total_out
       FROM wallet_transactions
       WHERE user_id = $1`,
      [user_id]
    );
    
    res.json({
      success: true,
      transactions: result.rows,
      stats: stats.rows[0],
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: result.rows.length === parseInt(limit)
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 旧提现入口已迁移至 /api/withdrawal/* 路由
// 完整风控 + 审批流程请使用 POST /api/withdrawal/withdraw

// 新用户注册奖励（15元Token）
router.post('/new-user-bonus', authenticate, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const user_id = req.user.id;
    
    // 检查是否已领取
    const bonusCheck = await client.query(
      'SELECT * FROM new_user_credits WHERE user_id = $1 AND credit_type = $2',
      [user_id, 'registration_bonus']
    );
    
    if (bonusCheck.rows.length > 0) {
      throw new Error('新用户奖励已领取');
    }
    
    const bonusAmount = 15.00; // 15元
    
    // 创建奖励记录
    await client.query(
      `INSERT INTO new_user_credits 
       (user_id, credit_type, amount, remaining_amount, valid_until, applicable_for, status)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP + INTERVAL '90 days', $5, $6)`,
      [user_id, 'registration_bonus', bonusAmount, bonusAmount, 'all', 'active']
    );
    
    // 获取或创建钱包
    const walletResult = await client.query(
      'SELECT * FROM wallets WHERE user_id = $1',
      [user_id]
    );
    
    let wallet;
    if (walletResult.rows.length > 0) {
      wallet = walletResult.rows[0];
      const newBalance = parseFloat(wallet.balance) + bonusAmount;
      await client.query(
        'UPDATE wallets SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
        [newBalance, user_id]
      );
    } else {
      const newWallet = await client.query(
        'INSERT INTO wallets (user_id, balance) VALUES ($1, $2) RETURNING *',
        [user_id, bonusAmount]
      );
      wallet = newWallet.rows[0];
    }
    
    // 创建钱包交易记录
    await client.query(
      `INSERT INTO wallet_transactions 
       (user_id, wallet_id, transaction_type, direction, amount, currency, 
        description, status, balance_after, frozen_after)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [user_id, wallet.id, 'bonus', 'in', bonusAmount, 'CNY', 
       '新用户注册奖励：¥15', 'completed', 
       parseFloat(wallet.balance) + bonusAmount, wallet.frozen || 0]
    );
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: '新用户奖励已发放',
      bonus_amount: bonusAmount,
      bonus_description: '¥15 等值Token（可用于Token调用和任务支付）',
      valid_until: '90天内有效'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
});

module.exports = router;
