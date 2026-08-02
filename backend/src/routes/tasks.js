const express = require('express');
const pool = require('../db/pool');
const logger = require('../utils/logger');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// 任务列表（公开）
router.get('/', async (req, res) => {
  const { type, status, region, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const conditions = [];
  const values = [];
  let paramIdx = 1;

  if (type) {
    conditions.push(`type = $${paramIdx++}`);
    values.push(type);
  }
  if (status) {
    conditions.push(`status = $${paramIdx++}`);
    values.push(status);
  }
  if (region) {
    conditions.push(`region = $${paramIdx++}`);
    values.push(region);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const countResult = await pool.query(`SELECT COUNT(*) FROM tasks ${whereClause}`, values);
    const total = parseInt(countResult.rows[0].count);

    const queryValues = [...values, parseInt(limit), offset];
    const result = await pool.query(
      `SELECT * FROM tasks ${whereClause} ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      queryValues
    );

    res.json({
      tasks: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      }
    });
  } catch (err) {
    logger.error('获取任务列表失败:', err);
    res.status(500).json({ error: '获取任务列表失败' });
  }
});

// 任务详情（公开）
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '任务不存在' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    logger.error('获取任务详情失败:', err);
    res.status(500).json({ error: '获取任务详情失败' });
  }
});

// 接单（需认证）
router.post('/:id/claim', authenticate, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    await pool.query('BEGIN');

    const taskResult = await pool.query('SELECT status, assignee_id FROM tasks WHERE id = $1 FOR UPDATE', [id]);
    if (taskResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: '任务不存在' });
    }

    const task = taskResult.rows[0];
    if (task.status !== 'open') {
      await pool.query('ROLLBACK');
      return res.status(400).json({ error: '该任务不可接单' });
    }
    if (task.assignee_id) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ error: '该任务已被接取' });
    }

    await pool.query(
      'UPDATE tasks SET status = $1, assignee_id = $2, assigned_at = CURRENT_TIMESTAMP WHERE id = $3',
      ['in_progress', userId, id]
    );

    const execResult = await pool.query(
      `INSERT INTO executions (task_id, partner_id, status)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [id, userId, 'in_progress']
    );

    await pool.query('COMMIT');

    logger.info(`用户 ${userId} 接单成功: ${id}`);

    res.json({
      message: '接单成功',
      taskId: id,
      executionId: execResult.rows[0].id,
      status: 'in_progress'
    });
  } catch (err) {
    await pool.query('ROLLBACK');
    logger.error('接单失败:', err);
    res.status(500).json({ error: '接单失败，请稍后再试' });
  }
});

// 提交交付物（需认证）
router.post('/:id/submit', authenticate, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { deliverables, notes } = req.body;

  try {
    const execResult = await pool.query(
      'SELECT id, status FROM executions WHERE task_id = $1 AND partner_id = $2',
      [id, userId]
    );

    if (execResult.rows.length === 0) {
      return res.status(404).json({ error: '未找到该任务执行记录' });
    }

    const execution = execResult.rows[0];
    if (execution.status !== 'in_progress') {
      return res.status(400).json({ error: '该任务当前状态不可提交' });
    }

    await pool.query(
      `UPDATE executions
       SET status = $1, deliverables = $2, submitted_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      ['submitted', JSON.stringify(deliverables || {}), execution.id]
    );

    await pool.query(
      'UPDATE tasks SET status = $1, completed_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['pending_review', id]
    );

    logger.info(`用户 ${userId} 提交任务: ${id}`);

    res.json({
      message: '提交成功，等待审核',
      taskId: id,
      submittedAt: new Date().toISOString(),
      status: 'pending_review'
    });
  } catch (err) {
    logger.error('提交任务失败:', err);
    res.status(500).json({ error: '提交失败，请稍后再试' });
  }
});

// 我的任务（需认证）
router.get('/my/list', authenticate, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT t.*, e.status as execution_status, e.deliverables, e.submitted_at, e.started_at
       FROM tasks t
       LEFT JOIN executions e ON e.task_id = t.id AND e.partner_id = $1
       WHERE t.assignee_id = $1
       ORDER BY t.assigned_at DESC`,
      [userId]
    );

    const active = result.rows.filter(r => ['in_progress', 'pending_review'].includes(r.status));
    const completed = result.rows.filter(r => r.status === 'completed');
    const pending = result.rows.filter(r => r.status === 'pending');

    res.json({ active, completed, pending });
  } catch (err) {
    logger.error('获取我的任务失败:', err);
    res.status(500).json({ error: '获取我的任务失败' });
  }
});

module.exports = router;
