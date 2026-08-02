const express = require('express');
const { pool } = require('../db/pool');
const logger = require('../utils/logger');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// 创建团队
router.post('/', authenticate, async (req, res) => {
  const userId = req.user.id;
  const { name, description, companyName, businessLicense, legalPerson } = req.body;

  try {
    // 检查用户是否已有团队
    const existingTeam = await pool.query(
      'SELECT id FROM teams WHERE owner_id = $1 AND status = $2',
      [userId, 'active']
    );

    if (existingTeam.rows.length > 0) {
      return res.status(400).json({ error: '您已拥有一个活跃团队，无法重复创建' });
    }

    // 创建团队
    const teamResult = await pool.query(
      `INSERT INTO teams (name, description, company_name, business_license, legal_person, owner_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, description, companyName, businessLicense, legalPerson, userId]
    );

    const team = teamResult.rows[0];

    // 将创建者添加为 owner
    await pool.query(
      `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [team.id, userId]
    );

    // 更新用户 account_type
    await pool.query(
      `UPDATE users SET account_type = 'team_owner' WHERE id = $1`,
      [userId]
    );

    // 记录审计日志
    await pool.query(
      `INSERT INTO audit_logs (user_id, team_id, action, resource_type, resource_id, details)
       VALUES ($1, $2, 'team_created', 'team', $2, $3)`,
      [userId, team.id, JSON.stringify({ name, companyName })]
    );

    res.status(201).json({
      success: true,
      message: '团队创建成功',
      team: {
        id: team.id,
        name: team.name,
        description: team.description,
        ownerId: team.owner_id,
        balance: team.balance,
        tokenQuota: team.token_quota,
        createdAt: team.created_at
      }
    });
  } catch (err) {
    logger.error('创建团队失败:', err);
    res.status(500).json({ error: '创建团队失败' });
  }
});

// 获取我的团队信息
router.get('/my', authenticate, async (req, res) => {
  const userId = req.user.id;

  try {
    // 查找用户所属的团队
    const memberResult = await pool.query(
      `SELECT tm.*, t.* 
       FROM team_members tm
       JOIN teams t ON tm.team_id = t.id
       WHERE tm.user_id = $1 AND tm.status = 'active' AND t.status = 'active'`,
      [userId]
    );

    if (memberResult.rows.length === 0) {
      return res.json({ team: null, role: null });
    }

    const row = memberResult.rows[0];
    const team = {
      id: row.team_id,
      name: row.name,
      description: row.description,
      companyName: row.company_name,
      balance: row.balance,
      totalSpent: row.total_spent,
      monthlyBudget: row.monthly_budget,
      alertThreshold: row.alert_threshold,
      tokenQuota: row.token_quota,
      tokenUsed: row.token_used,
      tier: row.tier,
      permissions: row.permissions,
      role: row.role,
      status: row.status,
      createdAt: row.created_at
    };

    res.json({ team, role: row.role });
  } catch (err) {
    logger.error('获取团队信息失败:', err);
    res.status(500).json({ error: '获取团队信息失败' });
  }
});

// 获取团队成员列表
router.get('/:teamId/members', authenticate, async (req, res) => {
  const userId = req.user.id;
  const { teamId } = req.params;

  try {
    // 检查用户是否属于该团队
    const memberCheck = await pool.query(
      'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2 AND status = $3',
      [teamId, userId, 'active']
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: '您不是该团队成员' });
    }

    const userRole = memberCheck.rows[0].role;

    // 获取成员列表
    const membersResult = await pool.query(
      `SELECT tm.*, u.phone, u.real_name, u.avatar
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = $1 AND tm.status = 'active'
       ORDER BY 
         CASE tm.role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END,
         tm.joined_at`,
      [teamId]
    );

    const members = membersResult.rows.map(m => ({
      id: m.id,
      userId: m.user_id,
      name: m.real_name || '未命名用户',
      phone: m.phone ? m.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '',
      avatar: m.avatar,
      role: m.role,
      monthlyQuota: m.monthly_quota,
      totalSpent: m.total_spent,
      joinedAt: m.joined_at
    }));

    res.json({ members, myRole: userRole });
  } catch (err) {
    logger.error('获取成员列表失败:', err);
    res.status(500).json({ error: '获取成员列表失败' });
  }
});

// 邀请成员
router.post('/:teamId/invite', authenticate, async (req, res) => {
  const userId = req.user.id;
  const { teamId } = req.params;
  const { phone, role = 'member' } = req.body;

  try {
    // 检查权限（只有 owner 和 admin 可以邀请）
    const memberCheck = await pool.query(
      'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2 AND status = $3',
      [teamId, userId, 'active']
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: '您不是该团队成员' });
    }

    const userRole = memberCheck.rows[0].role;
    if (userRole === 'member') {
      return res.status(403).json({ error: '只有团队管理员可以邀请成员' });
    }

    // 查找被邀请用户
    const userResult = await pool.query(
      'SELECT id, real_name FROM users WHERE phone = $1',
      [phone]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: '该手机号未注册OPC平台' });
    }

    const inviteeId = userResult.rows[0].id;
    const inviteeName = userResult.rows[0].real_name;

    // 检查是否已在团队中
    const existingMember = await pool.query(
      'SELECT id, status FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, inviteeId]
    );

    if (existingMember.rows.length > 0) {
      if (existingMember.rows[0].status === 'active') {
        return res.status(400).json({ error: '该用户已是团队成员' });
      }
      // 如果之前被移除，重新激活
      await pool.query(
        `UPDATE team_members SET status = 'active', role = $1, joined_at = NOW() 
         WHERE id = $2`,
        [role, existingMember.rows[0].id]
      );
    } else {
      // 添加新成员
      await pool.query(
        `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)`,
        [teamId, inviteeId, role]
      );
    }

    // 更新用户 account_type
    await pool.query(
      `UPDATE users SET account_type = 'team_member' WHERE id = $1`,
      [inviteeId]
    );

    // 记录审计日志
    await pool.query(
      `INSERT INTO audit_logs (user_id, team_id, action, resource_type, resource_id, details)
       VALUES ($1, $2, 'member_invited', 'member', $3, $4)`,
      [userId, teamId, inviteeId, JSON.stringify({ invitedBy: userId, role })]
    );

    res.json({
      success: true,
      message: '邀请成功',
      member: {
        userId: inviteeId,
        name: inviteeName,
        role
      }
    });
  } catch (err) {
    logger.error('邀请成员失败:', err);
    res.status(500).json({ error: '邀请成员失败' });
  }
});

// 移除成员
router.delete('/:teamId/members/:memberUserId', authenticate, async (req, res) => {
  const userId = req.user.id;
  const { teamId, memberUserId } = req.params;

  try {
    // 检查权限
    const memberCheck = await pool.query(
      'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2 AND status = $3',
      [teamId, userId, 'active']
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: '您不是该团队成员' });
    }

    const userRole = memberCheck.rows[0].role;
    const isOwner = userRole === 'owner';
    const isAdmin = userRole === 'admin';

    // 检查被移除成员的角色
    const targetMember = await pool.query(
      'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2 AND status = $3',
      [teamId, memberUserId, 'active']
    );

    if (targetMember.rows.length === 0) {
      return res.status(404).json({ error: '成员不存在' });
    }

    const targetRole = targetMember.rows[0].role;

    // 权限检查
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: '只有管理员可以移除成员' });
    }

    if (targetRole === 'owner') {
      return res.status(403).json({ error: '不能移除团队所有者' });
    }

    if (isAdmin && targetRole === 'admin') {
      return res.status(403).json({ error: '管理员不能移除其他管理员' });
    }

    // 移除成员
    await pool.query(
      `UPDATE team_members SET status = 'removed', removed_at = NOW()
       WHERE team_id = $1 AND user_id = $2`,
      [teamId, memberUserId]
    );

    // 更新用户 account_type
    await pool.query(
      `UPDATE users SET account_type = 'individual' WHERE id = $1`,
      [memberUserId]
    );

    // 记录审计日志
    await pool.query(
      `INSERT INTO audit_logs (user_id, team_id, action, resource_type, resource_id, details)
       VALUES ($1, $2, 'member_removed', 'member', $3, $4)`,
      [userId, teamId, memberUserId, JSON.stringify({ removedBy: userId })]
    );

    res.json({ success: true, message: '成员已移除' });
  } catch (err) {
    logger.error('移除成员失败:', err);
    res.status(500).json({ error: '移除成员失败' });
  }
});

// 更新成员角色
router.put('/:teamId/members/:memberUserId/role', authenticate, async (req, res) => {
  const userId = req.user.id;
  const { teamId, memberUserId } = req.params;
  const { role } = req.body;

  if (!['admin', 'member'].includes(role)) {
    return res.status(400).json({ error: '无效的角色' });
  }

  try {
    // 只有 owner 可以修改角色
    const memberCheck = await pool.query(
      'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2 AND status = $3',
      [teamId, userId, 'active']
    );

    if (memberCheck.rows.length === 0 || memberCheck.rows[0].role !== 'owner') {
      return res.status(403).json({ error: '只有团队所有者可以修改角色' });
    }

    await pool.query(
      `UPDATE team_members SET role = $1 WHERE team_id = $2 AND user_id = $3`,
      [role, teamId, memberUserId]
    );

    res.json({ success: true, message: '角色已更新' });
  } catch (err) {
    logger.error('更新角色失败:', err);
    res.status(500).json({ error: '更新角色失败' });
  }
});

// 更新团队设置
router.put('/:teamId/settings', authenticate, async (req, res) => {
  const userId = req.user.id;
  const { teamId } = req.params;
  const { monthlyBudget, alertThreshold, permissions } = req.body;

  try {
    // 检查权限
    const memberCheck = await pool.query(
      'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2 AND status = $3',
      [teamId, userId, 'active']
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: '您不是该团队成员' });
    }

    const userRole = memberCheck.rows[0].role;
    if (userRole === 'member') {
      return res.status(403).json({ error: '只有管理员可以修改设置' });
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (monthlyBudget !== undefined) {
      updates.push(`monthly_budget = $${paramIndex++}`);
      values.push(monthlyBudget);
    }

    if (alertThreshold !== undefined) {
      updates.push(`alert_threshold = $${paramIndex++}`);
      values.push(alertThreshold);
    }

    if (permissions !== undefined) {
      updates.push(`permissions = $${paramIndex++}`);
      values.push(JSON.stringify(permissions));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: '没有可更新的字段' });
    }

    values.push(teamId);
    await pool.query(
      `UPDATE teams SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      values
    );

    res.json({ success: true, message: '设置已更新' });
  } catch (err) {
    logger.error('更新设置失败:', err);
    res.status(500).json({ error: '更新设置失败' });
  }
});

// 获取团队消费统计
router.get('/:teamId/consumption', authenticate, async (req, res) => {
  const userId = req.user.id;
  const { teamId } = req.params;
  const { startDate, endDate, groupBy = 'day' } = req.query;

  try {
    // 检查用户是否属于该团队
    const memberCheck = await pool.query(
      'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2 AND status = $3',
      [teamId, userId, 'active']
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: '您不是该团队成员' });
    }

    const userRole = memberCheck.rows[0].role;
    const isAdmin = userRole === 'owner' || userRole === 'admin';

    // 构建查询条件
    let dateFilter = '';
    const params = [teamId];
    let paramIndex = 2;

    if (startDate) {
      dateFilter += ` AND created_at >= $${paramIndex++}`;
      params.push(startDate);
    }
    if (endDate) {
      dateFilter += ` AND created_at <= $${paramIndex++}`;
      params.push(endDate);
    }

    // 查询团队总消费
    const totalResult = await pool.query(
      `SELECT 
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(original_amount), 0) as original_amount,
        COUNT(*) as call_count,
        COALESCE(SUM(total_tokens), 0) as total_tokens
       FROM consumptions
       WHERE team_id = $1${dateFilter}`,
      params
    );

    // 查询各成员消费（仅管理员可见）
    let memberStats = [];
    if (isAdmin) {
      const memberResult = await pool.query(
        `SELECT 
          user_id,
          user_name,
          COALESCE(SUM(amount), 0) as total_amount,
          COUNT(*) as call_count,
          COALESCE(SUM(total_tokens), 0) as total_tokens
         FROM consumptions
         WHERE team_id = $1${dateFilter}
         GROUP BY user_id, user_name
         ORDER BY total_amount DESC`,
        params
      );
      memberStats = memberResult.rows;
    } else {
      // 普通成员只能看自己的
      const memberResult = await pool.query(
        `SELECT 
          user_id,
          user_name,
          COALESCE(SUM(amount), 0) as total_amount,
          COUNT(*) as call_count,
          COALESCE(SUM(total_tokens), 0) as total_tokens
         FROM consumptions
         WHERE team_id = $1 AND user_id = $2${dateFilter}
         GROUP BY user_id, user_name`,
        [...params, userId]
      );
      memberStats = memberResult.rows;
    }

    // 查询按服务类型统计
    const serviceResult = await pool.query(
      `SELECT 
        service_type,
        service_name,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(*) as call_count
       FROM consumptions
       WHERE team_id = $1${dateFilter}
       GROUP BY service_type, service_name
       ORDER BY total_amount DESC`,
      params
    );

    // 查询按天统计
    const dailyResult = await pool.query(
      `SELECT 
        DATE_TRUNC('day', created_at) as date,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(*) as call_count
       FROM consumptions
       WHERE team_id = $1${dateFilter}
       GROUP BY DATE_TRUNC('day', created_at)
       ORDER BY date DESC
       LIMIT 30`,
      params
    );

    res.json({
      summary: totalResult.rows[0],
      memberStats,
      serviceStats: serviceResult.rows,
      dailyStats: dailyResult.rows,
      myRole: userRole
    });
  } catch (err) {
    logger.error('获取消费统计失败:', err);
    res.status(500).json({ error: '获取消费统计失败' });
  }
});

module.exports = router;
