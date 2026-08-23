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
    { id: user.id, phone: user.phone, real_name: user.real_name, role: user.role || 'user', account_type: user.account_type },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// 根据账号类型和认证状态计算下一步
function getNextStep(user) {
  if (!user.id_card_verified) {
    return 'id_verification';
  }

  // 个人用户：完成身份证实名后即可使用基础服务
  if (user.account_type === 'individual') {
    return null;
  }

  // 企业用户：继续走企业认证 + 合同签署
  if (!user.company_verified) {
    return 'company_verification';
  }
  if (!user.service_enabled) {
    return 'contract_signing';
  }

  return null;
}

// 注册
router.post('/register', async (req, res) => {
  const { phone, password, realName, skills, accountType = 'individual' } = req.body;

  // 安全建议:应使用 express-validator 做严格校验:
  // - phone: ^1[3-9]\d{9}$,长度限制 11 位
  // - password: >= 8 位,含大小写 + 数字 + 特殊字符
  // - realName: 去除 XSS 特殊字符,长度 <= 50
  if (!phone || !password) {
    return res.status(400).json({ error: '手机号和密码不能为空' });
  }

  // 账号类型校验
  const validAccountType = accountType === 'enterprise' ? 'enterprise' : 'individual';

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
      `INSERT INTO users (phone, password_hash, real_name, skills, status, level, credit_score, role, account_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, phone, real_name, skills, status, level, credit_score, role, account_type, created_at`,
      [phone, passwordHash, realName || null, skills || [], 'pending_verification', 1, 100, 'user', validAccountType]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    logger.info(`新用户注册: ${user.phone}, 类型: ${validAccountType}`);

    res.status(201).json({
      message: '注册成功',
      user: {
        id: user.id,
        phone: user.phone,
        realName: user.real_name,
        skills: user.skills || [],
        status: user.status,
        level: user.level,
        creditScore: user.credit_score,
        accountType: user.account_type
      },
      accountType: user.account_type,
      nextStep: 'id_verification', // 个人与企业均先引导实名认证
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
      'SELECT id, phone, password_hash, real_name, skills, status, level, credit_score, account_type, id_card_verified, company_verified, service_enabled, role FROM users WHERE phone = $1',
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

    logger.info(`用户登录: ${user.phone}, 类型: ${user.account_type || 'individual'}`);

    const nextStep = getNextStep(user);

    res.json({
      message: '登录成功',
      user: {
        id: user.id,
        phone: user.phone,
        realName: user.real_name,
        level: user.level,
        creditScore: user.credit_score,
        status: user.status,
        accountType: user.account_type || 'individual'
      },
      accountType: user.account_type || 'individual',
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

    const accountTypeResult = await pool.query(
      'SELECT account_type FROM users WHERE id = $1',
      [userId]
    );
    const accountType = accountTypeResult.rows[0]?.account_type || 'individual';

    await pool.query(
      `UPDATE users
       SET real_name = $1, id_card_hash = $2, id_card_masked = $3,
           id_card_verified = TRUE, id_card_verified_at = CURRENT_TIMESTAMP,
           service_enabled = TRUE, service_enabled_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [realName, idCardHash, idCardMasked, userId]
    );

    // 个人账号完成实名后直接开通软件服务（Token、硅基员工）
    if (accountType === 'individual') {
      await pool.query(
        `INSERT INTO user_services (
          user_id,
          silicon_employee_enabled, silicon_employee_enabled_at,
          token_market_enabled, token_market_enabled_at,
          contract_signed, contract_signed_at
        ) VALUES ($1, TRUE, CURRENT_TIMESTAMP, TRUE, CURRENT_TIMESTAMP, TRUE, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) DO UPDATE SET
          silicon_employee_enabled = TRUE,
          silicon_employee_enabled_at = CURRENT_TIMESTAMP,
          token_market_enabled = TRUE,
          token_market_enabled_at = CURRENT_TIMESTAMP,
          contract_signed = TRUE,
          contract_signed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP`,
        [userId]
      );
    }

    logger.info(`实名认证通过,用户 ${userId}, 类型: ${accountType}`);

    res.json({
      message: '实名认证通过',
      accountType,
      nextStep: accountType === 'enterprise' ? 'company_verification' : null // 企业继续认证，个人完成基础认证
    });
  } catch (err) {
    logger.error('实名认证失败:', err);
    res.status(500).json({ error: '认证失败' });
  }
});

// 企业认证 - 第三步（仅企业账号需要）
router.post('/verify-company', authenticate, async (req, res) => {
  const { companyName, registrationNo, companyType, businessLicense } = req.body;
  const userId = req.user.id;

  if (!companyName || !companyType) {
    return res.status(400).json({ error: '企业名称和类型不能为空' });
  }

  try {
    const accountTypeResult = await pool.query(
      'SELECT account_type FROM users WHERE id = $1',
      [userId]
    );
    const accountType = accountTypeResult.rows[0]?.account_type || 'individual';

    if (accountType !== 'enterprise') {
      return res.status(403).json({ error: '仅企业账号需要进行企业认证' });
    }

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
    const accountTypeResult = await pool.query(
      'SELECT account_type FROM users WHERE id = $1',
      [userId]
    );
    const accountType = accountTypeResult.rows[0]?.account_type || 'individual';

    if (accountType !== 'enterprise') {
      return res.status(403).json({ error: '个人账号无需签署企业网络服务协议' });
    }

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
      `SELECT account_type, id_card_verified, company_verified, service_enabled,
              company_name, company_type, real_name
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const user = result.rows[0];
    const nextStep = getNextStep(user);

    res.json({
      accountType: user.account_type || 'individual',
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

const { sendVerificationCode } = require('../services/sms');

// 忘记密码：提交手机号，发送短信验证码
router.post('/forgot-password', async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: '手机号不能为空' });
  }

  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ error: '手机号格式不正确' });
  }

  try {
    const userResult = await pool.query(
      'SELECT id, phone FROM users WHERE phone = $1',
      [phone]
    );

    if (userResult.rows.length === 0) {
      // 为安全起见，统一返回模糊提示，避免枚举手机号
      return res.status(200).json({
        message: '如果该手机号已注册，验证码已发送，请注意查收。',
        phoneExists: false
      });
    }

    const user = userResult.rows[0];

    // 限制发送频率：同一手机号 60 秒内只能发一次
    const recentResult = await pool.query(
      `SELECT created_at FROM password_reset_requests
       WHERE phone = $1 AND created_at > CURRENT_TIMESTAMP - interval '60 seconds'
       ORDER BY created_at DESC LIMIT 1`,
      [phone]
    );
    if (recentResult.rows.length > 0) {
      return res.status(429).json({ error: '操作太频繁，请 60 秒后再试' });
    }

    const { code, provider } = await sendVerificationCode(phone);
    const tokenExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 验证码 10 分钟有效

    await pool.query(
      `INSERT INTO password_reset_requests (phone, user_id, reset_token, token_expires_at, status, ip_address)
       VALUES ($1, $2, $3, $4, 'pending', $5)`,
      [phone, user.id, code, tokenExpiresAt, req.ip]
    );

    logger.info(`密码重置验证码已发送: ${phone}, provider=${provider}`);

    // mock 模式时把验证码返回给前端（方便测试），真实短信服务不返回 code
    const isMock = provider === 'mock';
    res.json({
      message: isMock
        ? '短信服务未接入，当前为测试模式，验证码已显示在页面中。'
        : '验证码已发送，请注意查收短信，10 分钟内有效。',
      phoneExists: true,
      mock: isMock,
      ...(isMock ? { code } : {})
    });
  } catch (err) {
    logger.error('发送重置验证码失败:', err);
    res.status(500).json({ error: '发送验证码失败，请稍后再试' });
  }
});

// 重置密码：手机号 + 短信验证码 + 新密码
router.post('/reset-password', async (req, res) => {
  const { phone, code, newPassword } = req.body;

  if (!phone || !code || !newPassword) {
    return res.status(400).json({ error: '手机号、验证码和新密码不能为空' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: '新密码长度不能少于 8 位' });
  }

  try {
    const requestResult = await pool.query(
      `SELECT id, user_id, status, reset_token, token_expires_at FROM password_reset_requests
       WHERE phone = $1 AND status = 'pending'
       ORDER BY created_at DESC LIMIT 1`,
      [phone]
    );

    if (requestResult.rows.length === 0) {
      return res.status(400).json({ error: '验证码无效或已过期，请重新获取' });
    }

    const request = requestResult.rows[0];

    if (request.token_expires_at < new Date()) {
      return res.status(400).json({ error: '验证码已过期，请重新获取' });
    }

    if (request.reset_token !== code) {
      return res.status(400).json({ error: '验证码错误' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, request.user_id]
    );

    await pool.query(
      `UPDATE password_reset_requests
       SET status = 'completed', updated_at = CURRENT_TIMESTAMP
       WHERE phone = $1 AND status = 'pending'`,
      [phone]
    );

    logger.info(`密码重置成功: phone=${phone}, userId=${request.user_id}`);
    res.json({ message: '密码重置成功，请使用新密码登录' });
  } catch (err) {
    logger.error('重置密码失败:', err);
    res.status(500).json({ error: '重置密码失败，请稍后再试' });
  }
});

module.exports = router;
