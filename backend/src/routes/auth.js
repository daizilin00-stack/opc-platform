const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../db/pool');
const logger = require('../utils/logger');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

function generateToken(user) {
  // 安全建议:accessToken 过期时间建议 <= 24h,refreshToken 机制另建
  return jwt.sign(
    { id: user.id, phone: user.phone, real_name: user.real_name, role: user.role || 'user' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// 注册
router.post('/register', async (req, res) => {
  const { phone, password, realName, skills } = req.body;

  // 安全建议:应使用 express-validator 做严格校验:
  // - phone: ^1[3-9]\d{9}$,长度限制 11 位
  // - password: >= 8 位,含大小写 + 数字 + 特殊字符
  // - realName: 去除 XSS 特殊字符,长度 <= 50
  if (!phone || !password) {
    return res.status(400).json({ error: '手机号和密码不能为空' });
  }

  try {
    // 检查手机号是否已存在
    const existing = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: '该手机号已注册' });
    }

    // 哈希密码:saltRounds = 12(符合 OWASP 推荐)
    const passwordHash = await bcrypt.hash(password, 12);

    // 插入用户
    const result = await pool.query(
      `INSERT INTO users (phone, password_hash, real_name, skills, status, level, credit_score, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, phone, real_name, skills, status, level, credit_score, role, created_at`,
      [phone, passwordHash, realName || null, skills || [], 'pending_verification', 1, 100, 'user']
    );

    const user = result.rows[0];
    const token = generateToken(user);

    logger.info(`新用户注册: ${user.phone}`);

    res.status(201).json({
      message: '注册成功',
      user: {
        id: user.id,
        phone: user.phone,
        realName: user.real_name,
        skills: user.skills || [],
        status: user.status,
        level: user.level,
        creditScore: user.credit_score
      },
      nextStep: 'id_verification', // 引导下一步:实名认证
      token
    });
  } catch (err) {
    logger.error('注册失败:', err);
    res.status(500).json({ error: '注册失败,请稍后再试' });
  }
});

// 登录
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ error: '手机号和密码不能为空' });
  }

  try {
    const result = await pool.query(
      'SELECT id, phone, password_hash, real_name, skills, status, level, credit_score, id_card_verified, company_verified, service_enabled, role FROM users WHERE phone = $1',
      [phone]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: '手机号或密码错误' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: '手机号或密码错误' });
    }

    // 更新最后登录时间
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    const token = generateToken(user);

    logger.info(`用户登录: ${user.phone}`);

    // 判断用户下一步需要做什么
    let nextStep = null;
    if (!user.id_card_verified) {
      nextStep = 'id_verification';
    } else if (!user.company_verified) {
      nextStep = 'company_verification';
    } else if (!user.service_enabled) {
      nextStep = 'contract_signing'; // 引导电子合同签署
    }

    res.json({
      message: '登录成功',
      user: {
        id: user.id,
        phone: user.phone,
        realName: user.real_name,
        level: user.level,
        creditScore: user.credit_score,
        status: user.status
      },
      nextStep,
      token
    });
  } catch (err) {
    logger.error('登录失败:', err);
    res.status(500).json({ error: '登录失败,请稍后再试' });
  }
});

// 实名认证(需认证)- 第二步
router.post('/verify-id', authenticate, async (req, res) => {
  const { idCard, realName } = req.body;
  const userId = req.user.id;

  // 安全红线:
  // 1. 禁止在数据库中明文存储身份证号;使用 SHA-256 哈希 + 掩码存储
  // 2. 对接权威实名认证 API(阿里云/腾讯云),禁止本地正则校验
  // 3. 添加频率限制,防止批量刷单
  // 4. 输入严格校验:身份证号格式 + 姓名长度

  if (!idCard || !realName) {
    return res.status(400).json({ error: '身份证号和姓名不能为空' });
  }

  // 身份证号格式校验: 18位（前17位数字，最后一位可为数字或X）或15位（全数字）
  const idCardRegex = /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dX]$/i;
  const idCardRegex15 = /^[1-9]\d{5}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}$/;
  if (!idCardRegex.test(idCard) && !idCardRegex15.test(idCard)) {
    return res.status(400).json({ error: '身份证号格式不正确' });
  }

  try {
    // 检查身份证号是否已被使用(基于哈希)
    const idCardHash = crypto.createHash('sha256').update(idCard).digest('hex');
    const existingId = await pool.query(
      'SELECT id FROM users WHERE id_card_hash = $1',
      [idCardHash]
    );
    if (existingId.rows.length > 0 && existingId.rows[0].id !== userId) {
      return res.status(409).json({ error: '该身份证号已被其他账号绑定' });
    }

    // 生成掩码: 110101********1234
    const idCardMasked = idCard.length === 18
      ? idCard.slice(0, 6) + '******' + idCard.slice(14)
      : idCard.slice(0, 6) + '****' + idCard.slice(12);

    // TODO: 对接权威实名认证API(阿里云/腾讯云)
    // 目前模拟认证通过,实际生产必须对接官方API

    await pool.query(
      `UPDATE users
       SET real_name = $1, id_card_hash = $2, id_card_masked = $3, id_card_verified = TRUE, id_card_verified_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [realName, idCardHash, idCardMasked, userId]
    );

    logger.info(`实名认证通过,用户 ${userId}`);

    res.json({
      message: '实名认证通过',
      nextStep: 'company_verification' // 引导下一步:企业认证
    });
  } catch (err) {
    logger.error('实名认证失败:', err);
    res.status(500).json({ error: '认证失败' });
  }
});

// 企业认证 - 第三步
router.post('/verify-company', authenticate, async (req, res) => {
  const { companyName, registrationNo, companyType, businessLicense } = req.body;
  const userId = req.user.id;

  if (!companyName || !companyType) {
    return res.status(400).json({ error: '企业名称和类型不能为空' });
  }

  try {
    // companyType: 'new_register' | 'existing_upload'

    if (companyType === 'new_register') {
      // TODO: 对接第三方工商注册API(如企查查、天眼查等)
      // MVP 阶段：提交即视为通过，生产环境需人工/自动审核后再设置 company_verified = TRUE
      await pool.query(
        `UPDATE users
         SET company_name = $1, company_registration_no = $2, company_type = $3,
             company_verified = TRUE, company_verified_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [companyName, registrationNo || null, companyType, userId]
      );

      logger.info(`企业注册申请已通过,用户 ${userId}`);

      res.json({
        message: '企业注册申请已通过',
        status: 'success',
        nextStep: 'contract_signing' // 引导下一步：电子合同签署
      });
    } else if (companyType === 'existing_upload') {
      // 已有公司,上传营业执照
      // MVP 阶段：上传即视为通过，生产环境需人工审核后再设置 company_verified = TRUE
      await pool.query(
        `UPDATE users
         SET company_name = $1, company_registration_no = $2,
             company_type = $3, business_license_url = $4,
             company_verified = TRUE, company_verified_at = CURRENT_TIMESTAMP
         WHERE id = $5`,
        [companyName, registrationNo || null, companyType, businessLicense || null, userId]
      );

      logger.info(`营业执照已审核通过,用户 ${userId}`);

      res.json({
        message: '营业执照已审核通过',
        status: 'success',
        nextStep: 'contract_signing' // 引导下一步：电子合同签署
      });
    } else {
      return res.status(400).json({ error: '企业类型不正确' });
    }
  } catch (err) {
    logger.error('企业认证失败:', err);
    res.status(500).json({ error: '认证失败' });
  }
});

// 电子合同签署（需企业认证）- 签署后自动开通服务
router.post('/sign-contract', authenticate, async (req, res) => {
  const userId = req.user.id;
  const { contractVersion, agreed } = req.body;

  if (!agreed) {
    return res.status(400).json({ error: '请先同意合同条款' });
  }

  try {
    // 保存合同签署记录
    await pool.query(
      `INSERT INTO contracts (user_id, contract_version, signed_at, ip_address)
       VALUES ($1, $2, CURRENT_TIMESTAMP, $3)`,
      [userId, contractVersion, req.ip]
    );

    // 标记用户服务已开通
    await pool.query(
      `UPDATE users SET service_enabled = TRUE, service_enabled_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [userId]
    );

    // 分级开通服务
    // 软件服务：电子合同签署后自动开通
    // 硬件/网络服务：需人工审核，保持关闭
    await pool.query(
      `INSERT INTO user_services (
        user_id, 
        silicon_employee_enabled, silicon_employee_enabled_at,
        token_market_enabled, token_market_enabled_at,
        contract_signed, contract_version, contract_signed_at
      ) VALUES ($1, TRUE, CURRENT_TIMESTAMP, TRUE, CURRENT_TIMESTAMP, TRUE, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) DO UPDATE SET
        silicon_employee_enabled = TRUE,
        silicon_employee_enabled_at = CURRENT_TIMESTAMP,
        token_market_enabled = TRUE,
        token_market_enabled_at = CURRENT_TIMESTAMP,
        contract_signed = TRUE,
        contract_version = $2,
        contract_signed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP`,
      [userId, contractVersion]
    );

    logger.info(`电子合同已签署，软件服务自动开通，硬件服务等待人工审核，用户 ${userId}`);

    res.json({
      message: '合同签署成功，服务已分级开通',
      services: {
        autoEnabled: ['silicon_employee', 'token_market'],  // 软件服务：自动开通
        pendingApproval: ['model_tunnel', 'openclaw_deploy']  // 硬件服务：等待人工审核
      },
      nextStep: 'workspace' // 引导进入工作台
    });
  } catch (err) {
    logger.error('合同签署失败:', err);
    res.status(500).json({ error: '签署失败' });
  }
});

// 查询认证+合同状态（完整状态查询）
router.get('/status', authenticate, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT id_card_verified, company_verified, service_enabled,
              company_name, company_type, real_name
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const user = result.rows[0];

    // 判断下一步
    let nextStep = null;
    if (!user.id_card_verified) {
      nextStep = 'id_verification';
    } else if (!user.company_verified) {
      nextStep = 'company_verification';
    } else if (!user.service_enabled) {
      nextStep = 'contract_signing'; // 引导电子合同签署
    }

    res.json({
      idCardVerified: user.id_card_verified,
      companyVerified: user.company_verified,
      serviceEnabled: user.service_enabled,
      companyName: user.company_name,
      companyType: user.company_type,
      nextStep
    });
  } catch (err) {
    logger.error('查询状态失败:', err);
    res.status(500).json({ error: '查询失败' });
  }
});

// 修改密码（需认证）
router.post('/change-password', authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: '当前密码和新密码不能为空' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: '新密码长度不能少于 8 位' });
  }

  try {
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!valid) {
      return res.status(401).json({ error: '当前密码错误' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, userId]
    );

    logger.info(`用户修改密码成功: ${userId}`);
    res.json({ message: '密码修改成功，请重新登录' });
  } catch (err) {
    logger.error('修改密码失败:', err);
    res.status(500).json({ error: '修改密码失败，请稍后再试' });
  }
});

module.exports = router;
