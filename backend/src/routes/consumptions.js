const express = require('express');
const pool = require('../db/pool');
const logger = require('../utils/logger');
const { authenticate, requireVerifiedUser } = require('../middleware/auth');
const router = express.Router();

// 记录消费（内部API，由网关调用）
router.post('/', async (req, res) => {
  const {
    userId,
    teamId,
    accountId,
    accountType,
    serviceType,
    serviceId,
    serviceName,
    promptTokens,
    completionTokens,
    unitPrice,
    quantity,
    amount,
    discountRate,
    originalAmount,
    tierApplied,
    requestDetails
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO consumptions 
       (user_id, team_id, account_id, account_type, service_type, service_id, service_name,
        prompt_tokens, completion_tokens, total_tokens, unit_price, quantity, amount,
        currency, discount_rate, original_amount, tier_applied, request_details, billed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'CNY', $14, $15, $16, $17, NOW())
       RETURNING *`,
      [
        userId, teamId, accountId, accountType, serviceType, serviceId, serviceName,
        promptTokens || 0, completionTokens || 0, (promptTokens || 0) + (completionTokens || 0),
        unitPrice, quantity, amount,
        discountRate || 1.0, originalAmount || amount, tierApplied, 
        requestDetails ? JSON.stringify(requestDetails) : null
      ]
    );

    res.status(201).json({
      success: true,
      consumption: result.rows[0]
    });
  } catch (err) {
    logger.error('记录消费失败:', err);
    res.status(500).json({ error: '记录消费失败' });
  }
});

// 获取当前用户的消费记录
router.get('/my', authenticate, requireVerifiedUser, async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20, serviceType, startDate, endDate } = req.query;

  try {
    const offset = (page - 1) * limit;
    const params = [userId];
    let paramIndex = 2;
    let conditions = 'WHERE user_id = $1';

    if (serviceType) {
      conditions += ` AND service_type = $${paramIndex++}`;
      params.push(serviceType);
    }

    if (startDate) {
      conditions += ` AND created_at >= $${paramIndex++}`;
      params.push(startDate);
    }

    if (endDate) {
      conditions += ` AND created_at <= $${paramIndex++}`;
      params.push(endDate);
    }

    const result = await pool.query(
      `SELECT * FROM consumptions ${conditions} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM consumptions ${conditions}`,
      params
    );

    res.json({
      consumptions: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count)
      }
    });
  } catch (err) {
    logger.error('获取消费记录失败:', err);
    res.status(500).json({ error: '获取消费记录失败' });
  }
});

// 获取消费汇总（日/周/月）
router.get('/summary', authenticate, requireVerifiedUser, async (req, res) => {
  const userId = req.user.id;
  const { period = 'month' } = req.query; // day, week, month

  try {
    let groupBy;
    let limit;
    
    switch (period) {
      case 'day':
        groupBy = "DATE_TRUNC('day', created_at)";
        limit = 30;
        break;
      case 'week':
        groupBy = "DATE_TRUNC('week', created_at)";
        limit = 12;
        break;
      case 'month':
      default:
        groupBy = "DATE_TRUNC('month', created_at)";
        limit = 12;
        break;
    }

    const result = await pool.query(
      `SELECT 
        ${groupBy} as period,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(original_amount), 0) as original_amount,
        COUNT(*) as call_count,
        COALESCE(SUM(total_tokens), 0) as total_tokens
       FROM consumptions
       WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '${limit} ${period}s'
       GROUP BY ${groupBy}
       ORDER BY period DESC`,
      [userId]
    );

    res.json({ summary: result.rows, period });
  } catch (err) {
    logger.error('获取消费汇总失败:', err);
    res.status(500).json({ error: '获取消费汇总失败' });
  }
});

// 导出消费记录
router.get('/export', authenticate, requireVerifiedUser, async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate, format = 'csv' } = req.query;

  try {
    let conditions = 'WHERE user_id = $1';
    const params = [userId];

    if (startDate) {
      conditions += ` AND created_at >= $${params.length + 1}`;
      params.push(startDate);
    }

    if (endDate) {
      conditions += ` AND created_at <= $${params.length + 1}`;
      params.push(endDate);
    }

    const result = await pool.query(
      `SELECT 
        created_at,
        service_type,
        service_name,
        prompt_tokens,
        completion_tokens,
        total_tokens,
        unit_price,
        amount,
        discount_rate,
        original_amount,
        tier_applied
       FROM consumptions ${conditions} ORDER BY created_at DESC`,
      params
    );

    if (format === 'csv') {
      const headers = ['时间', '服务类型', '服务名称', '输入Token', '输出Token', '总Token', '单价', '实际费用', '折扣率', '原价', '层级'];
      const rows = result.rows.map(r => [
        r.created_at,
        r.service_type,
        r.service_name,
        r.prompt_tokens,
        r.completion_tokens,
        r.total_tokens,
        r.unit_price,
        r.amount,
        r.discount_rate,
        r.original_amount,
        r.tier_applied
      ].join(','));

      const csv = [headers.join(','), ...rows].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="consumption_${Date.now()}.csv"`);
      res.send(csv);
    } else {
      res.json({ consumptions: result.rows });
    }
  } catch (err) {
    logger.error('导出消费记录失败:', err);
    res.status(500).json({ error: '导出消费记录失败' });
  }
});

module.exports = router;
