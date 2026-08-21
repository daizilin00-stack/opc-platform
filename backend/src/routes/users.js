const express = require('express');
const pool = require('../db/pool');
const logger = require('../utils/logger');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// 用户信息（需认证）
router.get('/me', authenticate, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT id, phone, real_name, avatar, status, level, credit_score, account_type,
              skills, certifications, earnings_total, earnings_pending,
              created_at, last_login, verified_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      phone: user.phone,
      realName: user.real_name,
      avatar: user.avatar,
      accountType: user.account_type || 'individual',
      level: user.level,
      creditScore: user.credit_score,
      skills: user.skills || [],
      certifications: user.certifications || [],
      status: user.status,
      earningsTotal: user.earnings_total,
      earningsPending: user.earnings_pending,
      registeredAt: user.created_at,
      lastLogin: user.last_login,
      verifiedAt: user.verified_at
    });
  } catch (err) {
    logger.error('获取用户信息失败:', err);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

// 更新用户信息（需认证）
router.patch('/me', authenticate, async (req, res) => {
  const userId = req.user.id;
  const { realName, avatar, skills } = req.body;

  const updates = [];
  const values = [];
  let paramIdx = 1;

  if (realName !== undefined) {
    updates.push(`real_name = $${paramIdx++}`);
    values.push(realName);
  }
  if (avatar !== undefined) {
    updates.push(`avatar = $${paramIdx++}`);
    values.push(avatar);
  }
  if (skills !== undefined) {
    updates.push(`skills = $${paramIdx++}`);
    values.push(skills);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: '没有要更新的字段' });
  }

  values.push(userId);

  try {
    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIdx}`,
      values
    );

    logger.info(`用户 ${userId} 更新信息`);
    res.json({ message: '更新成功' });
  } catch (err) {
    logger.error('更新用户信息失败:', err);
    res.status(500).json({ error: '更新失败' });
  }
});

module.exports = router;
