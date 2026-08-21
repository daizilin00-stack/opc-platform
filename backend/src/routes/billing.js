const express = require('express');
const pool = require('../db/pool');
const logger = require('../utils/logger');
const { authenticate, requireVerifiedUser } = require('../middleware/auth');
const { TOKEN_PACKAGES, PROMOTION_PACKAGES, NETWORK_SERVICES, IP_SERVICES, TRAFFIC_PACKAGES, calculateTokenCost } = require('../config/pricing');
const router = express.Router();

// 获取用户钱包余额
router.get('/wallet', authenticate, requireVerifiedUser, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      'SELECT balance, frozen, currency FROM wallets WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      // 初始化钱包
      await pool.query(
        'INSERT INTO wallets (user_id, balance, currency) VALUES ($1, 0, $2)',
        [userId, 'CNY']
      );
      return res.json({ balance: 0, frozen: 0, currency: 'CNY' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    logger.error('查询钱包失败:', err);
    res.status(500).json({ error: '查询失败' });
  }
});

// 充值钱包
router.post('/wallet/recharge', authenticate, requireVerifiedUser, async (req, res) => {
  const userId = req.user.id;
  const { amount, paymentMethod } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: '充值金额必须大于0' });
  }

  try {
    // TODO: 对接支付网关（微信/支付宝/对公转账）
    // 目前模拟充值成功
    await pool.query(
      'UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      [amount, userId]
    );

    // 记录充值流水
    await pool.query(
      `INSERT INTO billing_items (user_id, item_type, item_name, amount, quantity, unit, status)
       VALUES ($1, 'recharge', '钱包充值', $2, $2, 'CNY', 'paid')`,
      [userId, amount]
    );

    logger.info(`钱包充值: 用户 ${userId}, 金额 ${amount}`);

    res.json({ message: '充值成功', amount });
  } catch (err) {
    logger.error('充值失败:', err);
    res.status(500).json({ error: '充值失败' });
  }
});

// 获取Token用量统计
router.get('/token/usage', authenticate, requireVerifiedUser, async (req, res) => {
  const userId = req.user.id;
  const { period = 'current_month' } = req.query;

  try {
    let dateFilter;
    if (period === 'current_month') {
      dateFilter = "DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)";
    } else if (period === 'last_month') {
      dateFilter = "DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')";
    } else {
      dateFilter = "created_at >= CURRENT_DATE - INTERVAL '7 days'";
    }

    const result = await pool.query(
      `SELECT 
        model_name,
        SUM(prompt_tokens) as prompt_tokens,
        SUM(completion_tokens) as completion_tokens,
        SUM(total_tokens) as total_tokens,
        SUM(cost_cny) as total_cost
      FROM token_usage
      WHERE user_id = $1 AND ${dateFilter}
      GROUP BY model_name
      ORDER BY total_cost DESC`,
      [userId]
    );

    const summary = await pool.query(
      `SELECT 
        SUM(total_tokens) as total_tokens,
        SUM(cost_cny) as total_cost,
        COUNT(*) as total_calls
      FROM token_usage
      WHERE user_id = $1 AND ${dateFilter}`,
      [userId]
    );

    res.json({
      period,
      summary: summary.rows[0],
      details: result.rows
    });
  } catch (err) {
    logger.error('查询Token用量失败:', err);
    res.status(500).json({ error: '查询失败' });
  }
});

// 获取Token明细
router.get('/token/details', authenticate, requireVerifiedUser, async (req, res) => {
  const userId = req.user.id;
  const { limit = 50, offset = 0 } = req.query;

  try {
    const result = await pool.query(
      `SELECT 
        created_at,
        agent_type,
        model_name,
        prompt_tokens,
        completion_tokens,
        total_tokens,
        cost_cny
      FROM token_usage
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({
      items: result.rows,
      pagination: { limit, offset }
    });
  } catch (err) {
    logger.error('查询Token明细失败:', err);
    res.status(500).json({ error: '查询失败' });
  }
});

// 记录Token用量（内部API，由AI员工调用时触发）
router.post('/token/record', authenticate, requireVerifiedUser, async (req, res) => {
  const userId = req.user.id;
  const { agentType, modelName, promptTokens, completionTokens, costCny } = req.body;

  try {
    // 检查余额
    const walletResult = await pool.query(
      'SELECT balance FROM wallets WHERE user_id = $1',
      [userId]
    );

    const balance = walletResult.rows[0]?.balance || 0;
    if (balance < costCny) {
      return res.status(402).json({ error: '余额不足，请充值' });
    }

    // 记录Token用量
    await pool.query(
      `INSERT INTO token_usage (user_id, agent_type, model_name, prompt_tokens, completion_tokens, total_tokens, cost_cny)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, agentType, modelName, promptTokens, completionTokens, promptTokens + completionTokens, costCny]
    );

    // 实时扣费
    await pool.query(
      'UPDATE wallets SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      [costCny, userId]
    );

    res.json({ success: true, deducted: costCny, remainingBalance: balance - costCny });
  } catch (err) {
    logger.error('记录Token用量失败:', err);
    res.status(500).json({ error: '记录失败' });
  }
});

// 获取计费套餐
router.get('/packages', authenticate, requireVerifiedUser, async (req, res) => {
  try {
    res.json({ 
      tokenPackages: TOKEN_PACKAGES,
      promotionPackages: PROMOTION_PACKAGES,
      networkServices: NETWORK_SERVICES,
      ipServices: IP_SERVICES,
      trafficPackages: TRAFFIC_PACKAGES,
      note: 'Token预充值实时扣费，用多少扣多少。购买专线可获赠Token额度。'
    });
  } catch (err) {
    logger.error('查询套餐失败:', err);
    res.status(500).json({ error: '查询失败' });
  }
});

module.exports = router;
