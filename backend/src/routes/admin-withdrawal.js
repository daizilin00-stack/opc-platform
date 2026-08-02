const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

/**
 * 管理员提现审批路由
 * 权限要求：admin/super_admin
 */

// 管理员权限检查中间件
const requireAdmin = async (req, res, next) => {
  if (!req.user || req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ success: false, message: '权限不足，需要管理员权限' });
  }
  next();
};

// 获取提现申请列表（管理员）
router.get('/admin/withdrawals', authenticate, requireAdmin, async (req, res) => {
  try {
    const { 
      status = 'pending', 
      risk_level,
      start_date, 
      end_date, 
      limit = 20, 
      offset = 0,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;
    
    let query = `
      SELECT w.*, 
        u.phone as user_phone,
        u.real_name as user_real_name,
        u.id_card_verified,
        u.company_verified,
        u.credit_score,
        u.created_at as user_created_at
      FROM withdraw_requests w
      JOIN users u ON w.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      query += ` AND w.status = $${params.length + 1}`;
      params.push(status);
    }
    
    if (risk_level) {
      query += ` AND w.risk_level = $${params.length + 1}`;
      params.push(risk_level);
    }
    
    if (start_date) {
      query += ` AND w.created_at >= $${params.length + 1}`;
      params.push(start_date);
    }
    
    if (end_date) {
      query += ` AND w.created_at <= $${params.length + 1}`;
      params.push(end_date);
    }
    
    // 排序
    const allowedSortColumns = ['created_at', 'amount', 'updated_at', 'risk_level'];
    const sortColumn = allowedSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const order = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY w.${sortColumn} ${order}`;
    
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // 统计
    let statsQuery = `
      SELECT 
        COUNT(*) as total_count,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
        SUM(CASE WHEN status = 'processing' THEN amount ELSE 0 END) as processing_amount,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as completed_amount
      FROM withdraw_requests
    `;
    
    // 如果有过滤条件，统计也加上
    if (status || risk_level || start_date || end_date) {
      statsQuery += ' WHERE 1=1';
      if (status) statsQuery += ` AND status = '${status}'`;
      if (risk_level) statsQuery += ` AND risk_level = '${risk_level}'`;
      if (start_date) statsQuery += ` AND created_at >= '${start_date}'`;
      if (end_date) statsQuery += ` AND created_at <= '${end_date}'`;
    }
    
    const statsResult = await pool.query(statsQuery);
    
    res.json({
      success: true,
      withdrawals: result.rows,
      stats: statsResult.rows[0],
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

// 获取单条提现详情（管理员）
router.get('/admin/withdrawals/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const withdraw_id = req.params.id;
    
    const result = await pool.query(
      `SELECT w.*, 
        u.phone as user_phone,
        u.real_name as user_real_name,
        u.id_card_verified,
        u.company_verified,
        u.credit_score,
        u.created_at as user_created_at,
        u.avatar as user_avatar,
        t.status as tx_status,
        t.balance_after,
        t.frozen_after
       FROM withdraw_requests w
       JOIN users u ON w.user_id = u.id
       LEFT JOIN wallet_transactions t ON w.wallet_transaction_id = t.id
       WHERE w.id = $1`,
      [withdraw_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '提现记录不存在' });
    }
    
    // 查询风控日志
    const riskLogs = await pool.query(
      'SELECT * FROM withdraw_risk_logs WHERE withdraw_request_id = $1 ORDER BY created_at DESC',
      [withdraw_id]
    );
    
    // 查询用户历史提现记录
    const userHistory = await pool.query(
      `SELECT id, amount, status, created_at, paid_at 
       FROM withdraw_requests 
       WHERE user_id = $1 AND id != $2
       ORDER BY created_at DESC LIMIT 5`,
      [result.rows[0].user_id, withdraw_id]
    );
    
    // 查询用户钱包信息
    const walletInfo = await pool.query(
      'SELECT balance, frozen FROM wallets WHERE user_id = $1',
      [result.rows[0].user_id]
    );
    
    res.json({
      success: true,
      withdraw: result.rows[0],
      risk_logs: riskLogs.rows,
      user_history: userHistory.rows,
      wallet_info: walletInfo.rows[0] || { balance: 0, frozen: 0 }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 审批提现申请（管理员）
router.post('/admin/withdrawals/:id/approve', authenticate, requireAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const withdraw_id = req.params.id;
    const admin_id = req.user.id;
    const { note, payment_ref } = req.body;
    
    // 查询提现申请
    const withdrawCheck = await client.query(
      'SELECT * FROM withdraw_requests WHERE id = $1 AND status = $2',
      [withdraw_id, 'pending']
    );
    
    if (withdrawCheck.rows.length === 0) {
      throw new Error('提现申请不存在或已处理');
    }
    
    const withdraw = withdrawCheck.rows[0];
    
    // 更新提现状态为 approved
    await client.query(
      `UPDATE withdraw_requests 
       SET status = 'approved', 
           reviewed_by = $1, 
           reviewed_at = CURRENT_TIMESTAMP,
           review_note = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [admin_id, note || '审批通过', withdraw_id]
    );
    
    // 更新交易记录状态
    await client.query(
      "UPDATE wallet_transactions SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = $1",
      [withdraw.wallet_transaction_id]
    );
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: '提现申请已审批通过',
      withdraw_id: withdraw_id,
      status: 'approved',
      next_step: '请进入财务系统打款'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
});

// 拒绝提现申请（管理员）
router.post('/admin/withdrawals/:id/reject', authenticate, requireAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const withdraw_id = req.params.id;
    const admin_id = req.user.id;
    const { reason } = req.body;
    
    if (!reason) {
      throw new Error('请填写拒绝原因');
    }
    
    // 查询提现申请
    const withdrawCheck = await client.query(
      'SELECT * FROM withdraw_requests WHERE id = $1 AND status = $2',
      [withdraw_id, 'pending']
    );
    
    if (withdrawCheck.rows.length === 0) {
      throw new Error('提现申请不存在或已处理');
    }
    
    const withdraw = withdrawCheck.rows[0];
    const amount = parseFloat(withdraw.amount);
    const user_id = withdraw.user_id;
    
    // 更新提现状态为 rejected
    await client.query(
      `UPDATE withdraw_requests 
       SET status = 'rejected', 
           reviewed_by = $1, 
           reviewed_at = CURRENT_TIMESTAMP,
           review_note = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [admin_id, reason, withdraw_id]
    );
    
    // 解冻金额并返还钱包
    const walletResult = await client.query(
      'SELECT balance, frozen FROM wallets WHERE user_id = $1',
      [user_id]
    );
    
    const balance = parseFloat(walletResult.rows[0].balance);
    const frozen = parseFloat(walletResult.rows[0].frozen);
    
    await client.query(
      'UPDATE wallets SET balance = $1, frozen = $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $3',
      [balance + amount, frozen - amount, user_id]
    );
    
    // 更新交易记录为失败
    await client.query(
      "UPDATE wallet_transactions SET status = 'failed', description = description || ' - 已拒绝' WHERE id = $1",
      [withdraw.wallet_transaction_id]
    );
    
    // 创建返还记录
    await client.query(
      `INSERT INTO wallet_transactions 
       (user_id, wallet_id, transaction_type, direction, amount, currency, 
        description, status, balance_after, frozen_after)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        user_id, withdraw.wallet_id, 'withdrawal_reject', 'in', amount, 'CNY',
        `提现被拒绝返还：${reason}`,
        'completed',
        balance + amount, frozen - amount
      ]
    );
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: '提现申请已拒绝，金额已返还用户钱包',
      withdraw_id: withdraw_id,
      status: 'rejected',
      refunded_amount: amount
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
});

// 标记打款完成（管理员）
router.post('/admin/withdrawals/:id/complete', authenticate, requireAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const withdraw_id = req.params.id;
    const admin_id = req.user.id;
    const { payment_ref, note } = req.body;
    
    // 查询提现申请
    const withdrawCheck = await client.query(
      'SELECT * FROM withdraw_requests WHERE id = $1 AND status = $2',
      [withdraw_id, 'approved']
    );
    
    if (withdrawCheck.rows.length === 0) {
      throw new Error('提现申请不存在或状态不是已审批');
    }
    
    const withdraw = withdrawCheck.rows[0];
    const amount = parseFloat(withdraw.amount);
    const user_id = withdraw.user_id;
    
    // 更新状态为 completed
    await client.query(
      `UPDATE withdraw_requests 
       SET status = 'completed', 
           payment_ref = $1,
           paid_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [payment_ref || null, withdraw_id]
    );
    
    // 解冻金额（从冻结中扣除）
    const walletResult = await client.query(
      'SELECT balance, frozen FROM wallets WHERE user_id = $1',
      [user_id]
    );
    
    const frozen = parseFloat(walletResult.rows[0].frozen);
    
    await client.query(
      'UPDATE wallets SET frozen = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      [frozen - amount, user_id]
    );
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: '提现已标记为打款完成',
      withdraw_id: withdraw_id,
      status: 'completed',
      payment_ref: payment_ref
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
});

// 批量审批（管理员）
router.post('/admin/withdrawals/batch-approve', authenticate, requireAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const admin_id = req.user.id;
    const { ids, note } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('请提供提现ID列表');
    }
    
    // 限制批量数量
    if (ids.length > 50) {
      throw new Error('批量审批最多50条');
    }
    
    const approved = [];
    const failed = [];
    
    for (const id of ids) {
      try {
        const withdrawCheck = await client.query(
          'SELECT * FROM withdraw_requests WHERE id = $1 AND status = $2',
          [id, 'pending']
        );
        
        if (withdrawCheck.rows.length === 0) {
          failed.push({ id, reason: '不存在或已处理' });
          continue;
        }
        
        await client.query(
          `UPDATE withdraw_requests 
           SET status = 'approved', 
               reviewed_by = $1, 
               reviewed_at = CURRENT_TIMESTAMP,
               review_note = $2,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [admin_id, note || '批量审批通过', id]
        );
        
        approved.push(id);
      } catch (err) {
        failed.push({ id, reason: err.message });
      }
    }
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: `批量审批完成：成功${approved.length}条，失败${failed.length}条`,
      approved_count: approved.length,
      failed_count: failed.length,
      approved,
      failed
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
});

// 获取提现统计数据（管理员仪表盘）
router.get('/admin/withdrawals/stats/dashboard', authenticate, requireAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    // 今日统计
    const todayStats = await pool.query(
      `SELECT 
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as amount
       FROM withdraw_requests 
       WHERE DATE(created_at) = CURRENT_DATE`
    );
    
    // 待审核统计
    const pendingStats = await pool.query(
      `SELECT 
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as amount
       FROM withdraw_requests 
       WHERE status = 'pending'`
    );
    
    // 近N天趋势
    const trend = await pool.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        COALESCE(SUM(CASE WHEN status IN ('approved', 'completed') THEN amount ELSE 0 END), 0) as approved_amount,
        COALESCE(SUM(CASE WHEN status = 'rejected' THEN amount ELSE 0 END), 0) as rejected_amount
       FROM withdraw_requests 
       WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`
    );
    
    // 风险分布
    const riskDist = await pool.query(
      `SELECT 
        risk_level,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as amount
       FROM withdraw_requests 
       WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
       GROUP BY risk_level`
    );
    
    // 本月总额
    const monthStats = await pool.query(
      `SELECT 
        COUNT(*) as total_count,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as completed_amount,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_amount,
        COALESCE(SUM(CASE WHEN status = 'rejected' THEN amount ELSE 0 END), 0) as rejected_amount
       FROM withdraw_requests 
       WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)`
    );
    
    res.json({
      success: true,
      dashboard: {
        today: todayStats.rows[0],
        pending: pendingStats.rows[0],
        month: monthStats.rows[0],
        trend: trend.rows,
        risk_distribution: riskDist.rows
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 更新风控配置（超级管理员）
router.put('/admin/risk-config/:key', authenticate, requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { config_value, description, enabled } = req.body;
    
    const allowedKeys = ['withdraw_limits', 'withdraw_frequency', 'withdraw_window', 'withdraw_requirements', 'risk_rules'];
    if (!allowedKeys.includes(key)) {
      return res.status(400).json({ success: false, message: '无效的配置键' });
    }
    
    const result = await pool.query(
      `UPDATE risk_config 
       SET config_value = $1, description = COALESCE($2, description), enabled = COALESCE($3, enabled), updated_at = CURRENT_TIMESTAMP
       WHERE config_key = $4
       RETURNING *`,
      [config_value, description, enabled, key]
    );
    
    res.json({
      success: true,
      message: '风控配置已更新',
      config: result.rows[0]
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取风控配置
router.get('/admin/risk-config', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM risk_config ORDER BY config_key'
    );
    
    res.json({
      success: true,
      configs: result.rows
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
