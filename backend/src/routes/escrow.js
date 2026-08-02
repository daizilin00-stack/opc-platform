const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

/**
 * Escrow 托管系统
 * 核心流程：发布方付款 → 资金冻结 → 接单方交付 → 发布方验收 → 释放资金
 * 佣金：15%固定（开园期）
 */

// 创建 escrow（发布方支付任务款）
router.post('/create', authenticate, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { task_id, total_amount, milestones = [] } = req.body;
    const publisher_id = req.user.id;
    
    // 验证任务
    const taskCheck = await client.query(
      'SELECT * FROM tasks WHERE id = $1 AND publisher_id = $2 AND status = $3',
      [task_id, publisher_id, 'open']
    );
    
    if (taskCheck.rows.length === 0) {
      throw new Error('任务不存在或您无权操作');
    }
    
    // 检查钱包余额
    const walletCheck = await client.query(
      'SELECT balance, frozen FROM wallets WHERE user_id = $1',
      [publisher_id]
    );
    
    if (walletCheck.rows.length === 0 || walletCheck.rows[0].balance < total_amount) {
      throw new Error('钱包余额不足，请先充值');
    }
    
    const wallet = walletCheck.rows[0];
    const balance = parseFloat(wallet.balance);
    const frozen = parseFloat(wallet.frozen);
    
    // 计算佣金（15%固定）
    const commission_rate = 0.15;
    const commission_amount = Math.round(total_amount * commission_rate * 100) / 100;
    const assignee_amount = total_amount - commission_amount;
    
    // 冻结发布方资金
    await client.query(
      'UPDATE wallets SET balance = $1, frozen = $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $3',
      [balance - total_amount, frozen + total_amount, publisher_id]
    );
    
    // 创建 escrow 记录
    const escrowResult = await client.query(
      `INSERT INTO escrow_payments 
       (task_id, total_amount, commission_rate, commission_amount, assignee_amount, 
        publisher_id, status, milestones, auto_release_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP + INTERVAL '3 days')
       RETURNING *`,
      [task_id, total_amount, commission_rate, commission_amount, assignee_amount, 
       publisher_id, 'funded', JSON.stringify(milestones)]
    );
    
    const escrow = escrowResult.rows[0];
    
    // 创建钱包交易记录（冻结资金）
    await client.query(
      `INSERT INTO wallet_transactions 
       (user_id, wallet_id, transaction_type, direction, amount, currency, 
        related_escrow_id, description, status, balance_after, frozen_after)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [publisher_id, null, 'task_escrow', 'out', total_amount, 'CNY', 
       escrow.id, `任务托管资金冻结：${task_id}`, 'completed', 
       balance - total_amount, frozen + total_amount]
    );
    
    // 更新任务状态
    await client.query(
      'UPDATE tasks SET status = $1 WHERE id = $2',
      ['escrowed', task_id]
    );
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      escrow: escrow,
      message: '资金托管成功',
      deducted: total_amount,
      remaining_balance: balance - total_amount
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
});

// 接单方确认接单（资金已托管）
router.post('/accept', authenticate, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { task_id } = req.body;
    const assignee_id = req.user.id;
    
    // 验证任务和 escrow
    const taskCheck = await client.query(
      `SELECT t.*, e.id as escrow_id, e.status as escrow_status, e.total_amount FROM tasks t
       JOIN escrow_payments e ON t.id = e.task_id
       WHERE t.id = $1 AND t.status = $2 AND e.status = $3`,
      [task_id, 'escrowed', 'funded']
    );
    
    if (taskCheck.rows.length === 0) {
      throw new Error('任务不存在或资金未托管');
    }
    
    const task = taskCheck.rows[0];
    
    // 更新任务接单方
    await client.query(
      'UPDATE tasks SET assignee_id = $1, status = $2, assigned_at = CURRENT_TIMESTAMP WHERE id = $3',
      [assignee_id, 'in_progress', task_id]
    );
    
    // 更新 escrow 接单方
    await client.query(
      'UPDATE escrow_payments SET assignee_id = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [assignee_id, 'in_progress', task.escrow_id]
    );
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: '接单成功，资金已托管',
      escrow_id: task.escrow_id,
      total_amount: task.total_amount,
      your_earnings: Math.round(task.total_amount * 0.85 * 100) / 100
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
});

// 接单方提交交付物
router.post('/submit', authenticate, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { escrow_id, deliverables, milestone_id } = req.body;
    const assignee_id = req.user.id;
    
    // 验证 escrow
    const escrowCheck = await client.query(
      'SELECT * FROM escrow_payments WHERE id = $1 AND assignee_id = $2 AND status = $3',
      [escrow_id, assignee_id, 'in_progress']
    );
    
    if (escrowCheck.rows.length === 0) {
      throw new Error('托管订单不存在或您无权操作');
    }
    
    const escrow = escrowCheck.rows[0];
    
    // 更新任务状态
    await client.query(
      'UPDATE tasks SET status = $1, completed_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['submitted', escrow.task_id]
    );
    
    // 更新 escrow 状态
    await client.query(
      'UPDATE escrow_payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['submitted', escrow_id]
    );
    
    // 如果有里程碑，更新里程碑
    if (milestone_id) {
      await client.query(
        `UPDATE task_milestones 
         SET status = $1, submitted_at = CURRENT_TIMESTAMP, submitted_content = $2 
         WHERE id = $3`,
        ['submitted', JSON.stringify(deliverables), milestone_id]
      );
    }
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: '交付物提交成功，等待发布方验收',
      escrow_id: escrow_id,
      auto_release_at: escrow.auto_release_at,
      notice: '发布方3天内未验收，系统将自动确认'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
});

// 发布方验收（通过/拒绝）
router.post('/review', authenticate, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { escrow_id, action, feedback } = req.body; // action: 'approve' | 'reject'
    const publisher_id = req.user.id;
    
    // 验证 escrow
    const escrowCheck = await client.query(
      'SELECT * FROM escrow_payments WHERE id = $1 AND publisher_id = $2 AND status = $3',
      [escrow_id, publisher_id, 'submitted']
    );
    
    if (escrowCheck.rows.length === 0) {
      throw new Error('托管订单不存在或您无权操作');
    }
    
    const escrow = escrowCheck.rows[0];
    
    if (action === 'approve') {
      // 验收通过：释放资金给接单方
      
      // 1. 更新 escrow 状态
      await client.query(
        'UPDATE escrow_payments SET status = $1, released_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['completed', escrow_id]
      );
      
      // 2. 更新发布方钱包（解冻资金）
      const pubWallet = await client.query(
        'SELECT balance, frozen FROM wallets WHERE user_id = $1',
        [publisher_id]
      );
      const pubBalance = parseFloat(pubWallet.rows[0].balance);
      const pubFrozen = parseFloat(pubWallet.rows[0].frozen);
      
      await client.query(
        'UPDATE wallets SET frozen = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
        [pubFrozen - escrow.total_amount, publisher_id]
      );
      
      // 3. 更新接单方钱包（增加余额）
      const assigneeWallet = await client.query(
        'SELECT balance, frozen FROM wallets WHERE user_id = $1',
        [escrow.assignee_id]
      );
      
      let assigneeBalance = 0;
      let assigneeFrozen = 0;
      
      if (assigneeWallet.rows.length > 0) {
        assigneeBalance = parseFloat(assigneeWallet.rows[0].balance);
        assigneeFrozen = parseFloat(assigneeWallet.rows[0].frozen);
        await client.query(
          'UPDATE wallets SET balance = $1, earnings_total = earnings_total + $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $3',
          [assigneeBalance + escrow.assignee_amount, escrow.assignee_amount, escrow.assignee_id]
        );
      } else {
        await client.query(
          'INSERT INTO wallets (user_id, balance, earnings_total) VALUES ($1, $2, $2)',
          [escrow.assignee_id, escrow.assignee_amount]
        );
      }
      
      // 4. 创建接单方钱包交易记录
      await client.query(
        `INSERT INTO wallet_transactions 
         (user_id, wallet_id, transaction_type, direction, amount, currency, 
          related_escrow_id, description, status, balance_after, frozen_after)
         VALUES ($1, (SELECT id FROM wallets WHERE user_id = $1), $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [escrow.assignee_id, 'task_release', 'in', escrow.assignee_amount, 'CNY', 
         escrow_id, `任务完成收入：${escrow.task_id}`, 'completed', 
         assigneeBalance + escrow.assignee_amount, assigneeFrozen]
      );
      
      // 5. 创建佣金记录
      await client.query(
        `INSERT INTO commissions 
         (task_id, escrow_id, base_amount, commission_rate, commission_amount, 
          assignee_amount, final_commission, status, transaction_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 
          (SELECT id FROM wallet_transactions WHERE related_escrow_id = $2 AND transaction_type = 'task_release'))`,
        [escrow.task_id, escrow_id, escrow.total_amount, escrow.commission_rate, 
         escrow.commission_amount, escrow.assignee_amount, escrow.commission_amount, 'collected']
      );
      
      // 6. 更新任务状态
      await client.query(
        'UPDATE tasks SET status = $1, completed_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['completed', escrow.task_id]
      );
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: '验收通过，资金已释放给接单方',
        escrow_id: escrow_id,
        assignee_amount: escrow.assignee_amount,
        commission_amount: escrow.commission_amount,
        commission_rate: escrow.commission_rate
      });
      
    } else if (action === 'reject') {
      // 验收拒绝：进入纠纷处理
      await client.query(
        'UPDATE escrow_payments SET status = $1, dispute_reason = $2, disputed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        ['disputed', feedback, escrow_id]
      );
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: '已拒绝交付，进入纠纷处理流程',
        escrow_id: escrow_id,
        status: 'disputed',
        next_step: '平台将在3个工作日内介入仲裁'
      });
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
});

// 获取 escrow 详情
router.get('/:escrow_id', authenticate, async (req, res) => {
  try {
    const { escrow_id } = req.params;
    const user_id = req.user.id;
    
    const result = await pool.query(
      `SELECT e.*, 
        t.title as task_title, t.description as task_description,
        pub.real_name as publisher_name, pub.phone as publisher_phone,
        assign.real_name as assignee_name, assign.phone as assignee_phone
       FROM escrow_payments e
       LEFT JOIN tasks t ON e.task_id = t.id
       LEFT JOIN users pub ON e.publisher_id = pub.id
       LEFT JOIN users assign ON e.assignee_id = assign.id
       WHERE e.id = $1 AND (e.publisher_id = $2 OR e.assignee_id = $2)`,
      [escrow_id, user_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '托管订单不存在' });
    }
    
    res.json({ success: true, escrow: result.rows[0] });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 我的 escrow 列表
router.get('/my/list', authenticate, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { status, role } = req.query; // role: 'publisher' | 'assignee'
    
    let query = `
      SELECT e.*, t.title as task_title, t.description as task_description
      FROM escrow_payments e
      LEFT JOIN tasks t ON e.task_id = t.id
      WHERE (e.publisher_id = $1 OR e.assignee_id = $1)
    `;
    
    const params = [user_id];
    
    if (role === 'publisher') {
      query += ' AND e.publisher_id = $1';
    } else if (role === 'assignee') {
      query += ' AND e.assignee_id = $1';
    }
    
    if (status) {
      query += ` AND e.status = $${params.length + 1}`;
      params.push(status);
    }
    
    query += ' ORDER BY e.created_at DESC';
    
    const result = await pool.query(query, params);
    
    res.json({ success: true, escrows: result.rows });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 自动释放（系统定时任务调用）
router.post('/auto-release', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 查找超过3天未验收的已提交订单
    const expired = await client.query(
      `SELECT * FROM escrow_payments 
       WHERE status = 'submitted' 
       AND auto_release_at <= CURRENT_TIMESTAMP
       AND released_at IS NULL`
    );
    
    let released = 0;
    
    for (const escrow of expired.rows) {
      // 自动释放资金（同验收通过逻辑）
      await client.query(
        'UPDATE escrow_payments SET status = $1, released_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['completed', escrow.id]
      );
      
      // 更新接单方钱包
      await client.query(
        `UPDATE wallets 
         SET balance = balance + $1, earnings_total = earnings_total + $1, updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = $2`,
        [escrow.assignee_amount, escrow.assignee_id]
      );
      
      // 创建佣金记录
      await client.query(
        `INSERT INTO commissions 
         (task_id, escrow_id, base_amount, commission_rate, commission_amount, 
          assignee_amount, final_commission, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [escrow.task_id, escrow.id, escrow.total_amount, escrow.commission_rate, 
         escrow.commission_amount, escrow.assignee_amount, escrow.commission_amount, 'collected']
      );
      
      // 更新任务状态
      await client.query(
        'UPDATE tasks SET status = $1, completed_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['completed', escrow.task_id]
      );
      
      released++;
    }
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: `自动释放完成：${released} 个订单`,
      released_count: released
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
});

module.exports = router;
