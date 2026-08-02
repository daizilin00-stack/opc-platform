const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

/**
 * 佣金系统
 * 核心规则：任务大厅佣金 15% 固定（开园期）
 * 未来：阶梯佣金（小单20% → 大单10%）
 */

// 计算佣金（开园固定15%）
router.post('/calculate', authenticate, async (req, res) => {
  try {
    const { amount, user_id } = req.body;
    
    // 开园固定15%佣金
    const commission_rate = 0.15;
    const commission_amount = Math.round(amount * commission_rate * 100) / 100;
    const assignee_amount = amount - commission_amount;
    
    // TODO: 未来加入阶梯佣金和信用优惠
    // 阶梯佣金示例：
    // 100-500: 20%
    // 500-2000: 15%
    // 2000-10000: 12%
    // 10000+: 10%
    
    // TODO: 信用优惠示例：
    // 铜牌: 18%
    // 银牌: 12%
    // 金牌: 8%
    // 钻石: 5%
    
    res.json({
      success: true,
      commission_rate: commission_rate,
      commission_rate_percent: '15%',
      commission_amount: commission_amount,
      assignee_amount: assignee_amount,
      total_amount: amount,
      note: '开园期间佣金固定15%，未来将根据阶梯佣金和信用等级调整',
      future_tiers: {
        '100-500': '20%',
        '500-2000': '15%',
        '2000-10000': '12%',
        '10000+': '10%'
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取佣金记录
router.get('/my', authenticate, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { role = 'assignee', limit = 50, offset = 0 } = req.query;
    
    let query;
    let params;
    
    if (role === 'assignee') {
      // 作为接单方：查看被扣除的佣金
      query = `
        SELECT c.*, t.title as task_title
        FROM commissions c
        LEFT JOIN tasks t ON c.task_id = t.id
        LEFT JOIN escrow_payments e ON c.escrow_id = e.id
        WHERE e.assignee_id = $1
        ORDER BY c.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      params = [user_id, limit, offset];
    } else {
      // 作为发布方：查看支付的总金额（含佣金）
      query = `
        SELECT c.*, t.title as task_title
        FROM commissions c
        LEFT JOIN tasks t ON c.task_id = t.id
        LEFT JOIN escrow_payments e ON c.escrow_id = e.id
        WHERE e.publisher_id = $1
        ORDER BY c.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      params = [user_id, limit, offset];
    }
    
    const result = await pool.query(query, params);
    
    // 统计
    const stats = await pool.query(
      `SELECT 
        COUNT(*) as total_count,
        SUM(commission_amount) as total_commission,
        SUM(assignee_amount) as total_assignee_earnings
       FROM commissions c
       LEFT JOIN escrow_payments e ON c.escrow_id = e.id
       WHERE ${role === 'assignee' ? 'e.assignee_id' : 'e.publisher_id'} = $1`,
      [user_id]
    );
    
    res.json({
      success: true,
      commissions: result.rows,
      stats: stats.rows[0],
      role: role,
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

// 平台佣金统计（管理员用）
router.get('/stats', authenticate, async (req, res) => {
  try {
    // 验证管理员权限（简化：检查是否为管理员）
    const adminCheck = await pool.query(
      'SELECT level FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (adminCheck.rows.length === 0 || adminCheck.rows[0].level < 100) {
      return res.status(403).json({ success: false, message: '无权访问' });
    }
    
    // 今日佣金
    const today = await pool.query(
      `SELECT 
        COUNT(*) as count,
        SUM(commission_amount) as total
       FROM commissions
       WHERE DATE(created_at) = CURRENT_DATE
       AND status = 'collected'`
    );
    
    // 本月佣金
    const month = await pool.query(
      `SELECT 
        COUNT(*) as count,
        SUM(commission_amount) as total
       FROM commissions
       WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
       AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
       AND status = 'collected'`
    );
    
    // 累计佣金
    const total = await pool.query(
      `SELECT 
        COUNT(*) as count,
        SUM(commission_amount) as total,
        SUM(assignee_amount) as assignee_total
       FROM commissions
       WHERE status = 'collected'`
    );
    
    // 按佣金率分组
    const byRate = await pool.query(
      `SELECT 
        commission_rate,
        COUNT(*) as count,
        SUM(commission_amount) as total
       FROM commissions
       WHERE status = 'collected'
       GROUP BY commission_rate
       ORDER BY commission_rate`
    );
    
    res.json({
      success: true,
      today: today.rows[0],
      month: month.rows[0],
      total: total.rows[0],
      by_rate: byRate.rows
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
