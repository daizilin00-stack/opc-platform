const jwt = require('jsonwebtoken');
const { pool } = require('../db/pool');
const logger = require('../utils/logger');

// 解析并验证 JWT
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    logger.warn('JWT 验证失败:', err.message);
    return res.status(401).json({ error: '令牌无效或已过期' });
  }
}

// 企业认证中间件：确保用户已完成企业认证才能使用网络服务
async function requireCompanyAuth(req, res, next) {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: '未认证' });
  }

  try {
    const result = await pool.query(
      'SELECT id_card_verified, company_verified, service_enabled FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const user = result.rows[0];

    // 检查认证状态
    if (!user.id_card_verified) {
      return res.status(403).json({
        error: '请先完成实名认证',
        code: 'ID_VERIFICATION_REQUIRED',
        nextStep: 'id_verification'
      });
    }

    if (!user.company_verified) {
      return res.status(403).json({
        error: '请先完成企业认证',
        code: 'COMPANY_VERIFICATION_REQUIRED',
        nextStep: 'company_verification'
      });
    }

    if (!user.service_enabled) {
      return res.status(403).json({
        error: '企业认证审核中，请等待平台审核',
        code: 'SERVICE_PENDING',
        nextStep: 'waiting_audit'
      });
    }

    next();
  } catch (err) {
    logger.error('企业认证检查失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
}

module.exports = { authenticate, requireCompanyAuth };
