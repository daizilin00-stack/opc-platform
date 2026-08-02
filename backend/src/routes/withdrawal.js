const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

/**
 * 提现风控检查器
 * 在提现申请时执行全面的风控校验
 */
class WithdrawRiskChecker {
  constructor(userId, amount) {
    this.userId = userId;
    this.amount = parseFloat(amount);
    this.riskLevel = 'low';
    this.flags = [];
    this.blocked = false;
  }

  async checkAll() {
    await this.loadConfig();
    await this.checkBasicRequirements();
    await this.checkAmountLimits();
    await this.checkFrequencyLimits();
    await this.checkTimeWindow();
    await this.checkAccountRisk();
    
    return {
      riskLevel: this.riskLevel,
      flags: this.flags,
      blocked: this.blocked,
      requiresManualReview: this.riskLevel === 'high' || this.riskLevel === 'critical'
    };
  }

  async loadConfig() {
    const result = await pool.query(
      'SELECT config_value FROM risk_config WHERE config_key = $1 AND enabled = TRUE',
      ['withdraw_limits']
    );
    this.limits = result.rows[0]?.config_value || { min_amount: 100, max_amount: 50000, daily_limit: 100000, monthly_limit: 500000 };
    
    const freqResult = await pool.query(
      'SELECT config_value FROM risk_config WHERE config_key = $1 AND enabled = TRUE',
      ['withdraw_frequency']
    );
    this.frequency = freqResult.rows[0]?.config_value || { daily_max_count: 3, weekly_max_count: 10, monthly_max_count: 30 };
    
    const reqResult = await pool.query(
      'SELECT config_value FROM risk_config WHERE config_key = $1 AND enabled = TRUE',
      ['withdraw_requirements']
    );
    this.requirements = reqResult.rows[0]?.config_value || { require_real_name: true, require_company_verify: true, require_phone_bind: true };
    
    const riskResult = await pool.query(
      'SELECT config_value FROM risk_config WHERE config_key = $1 AND enabled = TRUE',
      ['risk_rules']
    );
    this.riskRules = riskResult.rows[0]?.config_value || { large_amount_threshold: 10000, suspicious_daily_amount: 50000, new_user_limit: 500 };
  }

  async checkBasicRequirements() {
    // 检查用户状态
    const userResult = await pool.query(
      'SELECT id_card_verified, company_verified, created_at, status, credit_score FROM users WHERE id = $1',
      [this.userId]
    );
    
    if (userResult.rows.length === 0) {
      this.blocked = true;
      this.flags.push('用户不存在');
      return;
    }
    
    const user = userResult.rows[0];
    
    // 实名认证检查
    if (this.requirements.require_real_name && !user.id_card_verified) {
      this.blocked = true;
      this.flags.push('未实名认证：请先完成实名认证');
    }
    
    // 企业认证检查
    if (this.requirements.require_company_verify && !user.company_verified) {
      this.blocked = true;
      this.flags.push('未企业认证：请先完成企业认证（上传营业执照或平台内注册）');
    }
    
    // 账户状态检查
    if (user.status === 'suspended' || user.status === 'banned') {
      this.blocked = true;
      this.flags.push('账户状态异常：已被限制提现');
    }
    
    // 信用分检查
    if (user.credit_score < 60) {
      this.riskLevel = 'high';
      this.flags.push(`信用分过低：${user.credit_score}分（需≥60分）`);
    }
    
    // 新用户限制（注册7天内）
    const accountAge = Math.floor((Date.now() - new Date(user.created_at)) / (1000 * 60 * 60 * 24));
    if (accountAge < 7 && this.amount > this.riskRules.new_user_limit) {
      this.riskLevel = 'high';
      this.flags.push(`新用户限制：注册${accountAge}天，单笔限额¥${this.riskRules.new_user_limit}`);
    }
  }

  async checkAmountLimits() {
    // 最小金额检查
    if (this.amount < this.limits.min_amount) {
      this.blocked = true;
      this.flags.push(`金额过低：最低提现¥${this.limits.min_amount}`);
    }
    
    // 单笔最大金额
    if (this.amount > this.limits.max_amount) {
      this.blocked = true;
      this.flags.push(`金额超限：单笔最高¥${this.limits.max_amount}`);
    }
    
    // 今日累计提现
    const todayResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM withdraw_requests 
       WHERE user_id = $1 
       AND status IN ('approved', 'processing', 'completed')
       AND DATE(created_at) = CURRENT_DATE`,
      [this.userId]
    );
    const todayTotal = parseFloat(todayResult.rows[0].total);
    if (todayTotal + this.amount > this.limits.daily_limit) {
      this.blocked = true;
      this.flags.push(`日限额超限：今日已提¥${todayTotal}，日限额¥${this.limits.daily_limit}`);
    }
    
    // 本月累计提现
    const monthResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM withdraw_requests 
       WHERE user_id = $1 
       AND status IN ('approved', 'processing', 'completed')
       AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)`,
      [this.userId]
    );
    const monthTotal = parseFloat(monthResult.rows[0].total);
    if (monthTotal + this.amount > this.limits.monthly_limit) {
      this.blocked = true;
      this.flags.push(`月限额超限：本月已提¥${monthTotal}，月限额¥${this.limits.monthly_limit}`);
    }
    
    // 大额预警
    if (this.amount >= this.riskRules.large_amount_threshold) {
      this.riskLevel = Math.max(['low', 'medium', 'high', 'critical'].indexOf(this.riskLevel), 1) >= 2 ? this.riskLevel : 'medium';
      this.flags.push(`大额提现：¥${this.amount} ≥ 预警阈值¥${this.riskRules.large_amount_threshold}`);
    }
  }

  async checkFrequencyLimits() {
    // 今日提现次数
    const todayCount = await pool.query(
      `SELECT COUNT(*) as count FROM withdraw_requests 
       WHERE user_id = $1 AND DATE(created_at) = CURRENT_DATE`,
      [this.userId]
    );
    if (parseInt(todayCount.rows[0].count) >= this.frequency.daily_max_count) {
      this.blocked = true;
      this.flags.push(`日频次超限：今日已申请${todayCount.rows[0].count}次，日限${this.frequency.daily_max_count}次`);
    }
    
    // 本周提现次数
    const weekCount = await pool.query(
      `SELECT COUNT(*) as count FROM withdraw_requests 
       WHERE user_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '7 days'`,
      [this.userId]
    );
    if (parseInt(weekCount.rows[0].count) >= this.frequency.weekly_max_count) {
      this.riskLevel = 'high';
      this.flags.push(`周频次预警：本周已申请${weekCount.rows[0].count}次`);
    }
    
    // 本月提现次数
    const monthCount = await pool.query(
      `SELECT COUNT(*) as count FROM withdraw_requests 
       WHERE user_id = $1 AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)`,
      [this.userId]
    );
    if (parseInt(monthCount.rows[0].count) >= this.frequency.monthly_max_count) {
      this.riskLevel = 'high';
      this.flags.push(`月频次预警：本月已申请${monthCount.rows[0].count}次`);
    }
  }

  async checkTimeWindow() {
    // 提现时间窗口检查（如果有配置）
    const windowResult = await pool.query(
      'SELECT config_value FROM risk_config WHERE config_key = $1 AND enabled = TRUE',
      ['withdraw_window']
    );
    const window = windowResult.rows[0]?.config_value;
    if (window && window.allowed_days) {
      const now = new Date();
      const dayOfWeek = now.getDay() || 7; // 周日=7
      if (!window.allowed_days.includes(dayOfWeek)) {
        this.blocked = true;
        this.flags.push('非提现开放日：请在工作日（周一至周五）9:00-18:00申请');
        return;
      }
      // 检查小时
      if (window.allowed_hours_start !== undefined && window.allowed_hours_end !== undefined) {
        const hour = now.getHours();
        if (hour < window.allowed_hours_start || hour >= window.allowed_hours_end) {
          this.blocked = true;
          this.flags.push(`非提现开放时间：请在工作日 ${window.allowed_hours_start}:00-${window.allowed_hours_end}:00 申请`);
        }
      }
    }
  }

  async checkAccountRisk() {
    // 检查是否有未处理的提现申请
    const pendingResult = await pool.query(
      'SELECT COUNT(*) as count FROM withdraw_requests WHERE user_id = $1 AND status = $2',
      [this.userId, 'pending']
    );
    if (parseInt(pendingResult.rows[0].count) > 0) {
      this.blocked = true;
      this.flags.push('有未处理提现：请先等待上一笔提现完成');
    }
    
    // 检查是否有异常交易模式（最近3笔提现间隔过短）
    const recentResult = await pool.query(
      `SELECT created_at FROM withdraw_requests 
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT 3`,
      [this.userId]
    );
    if (recentResult.rows.length >= 2) {
      const last1 = new Date(recentResult.rows[0].created_at);
      const last2 = new Date(recentResult.rows[1].created_at);
      const hoursDiff = (last1 - last2) / (1000 * 60 * 60);
      if (hoursDiff < 1) {
        this.riskLevel = 'high';
        this.flags.push('高频提现：最近两笔间隔过短');
      }
    }
    
    // 可疑金额检查（每日累计达到阈值）
    const dailyTotal = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM withdraw_requests 
       WHERE user_id = $1 AND DATE(created_at) = CURRENT_DATE AND status IN ('approved', 'processing', 'completed')`,
      [this.userId]
    );
    if (parseFloat(dailyTotal.rows[0].total) + this.amount > this.riskRules.suspicious_daily_amount) {
      this.riskLevel = 'high';
      this.flags.push(`日累计可疑金额：今日累计将超过¥${this.riskRules.suspicious_daily_amount}`);
    }
  }

  async logRisk(withdrawRequestId) {
    for (const flag of this.flags) {
      let ruleName = 'general';
      if (flag.includes('实名')) ruleName = 'unverified_user';
      else if (flag.includes('限额')) ruleName = 'amount_limit';
      else if (flag.includes('频次')) ruleName = 'frequency_limit';
      else if (flag.includes('时间')) ruleName = 'time_window';
      else if (flag.includes('大额')) ruleName = 'large_amount';
      else if (flag.includes('高频')) ruleName = 'high_frequency';
      else if (flag.includes('可疑')) ruleName = 'suspicious_amount';
      
      await pool.query(
        `INSERT INTO withdraw_risk_logs 
         (withdraw_request_id, user_id, rule_name, rule_description, risk_level, action_taken, details)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          withdrawRequestId,
          this.userId,
          ruleName,
          flag,
          this.riskLevel,
          this.blocked ? 'blocked' : (this.riskLevel === 'high' ? 'manual_review' : 'allowed'),
          JSON.stringify({ amount: this.amount, user_id: this.userId })
        ]
      );
    }
  }
}

/**
 * 用户提现路由（增强版）
 */

// 用户发起提现申请
router.post('/withdraw', authenticate, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { amount, method, account_info, user_note } = req.body;
    const user_id = req.user.id;
    
    if (!amount || !method || !account_info) {
      throw new Error('缺少必要参数：amount, method, account_info');
    }
    
    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      throw new Error('提现金额无效');
    }
    
    // 执行风控检查
    const riskChecker = new WithdrawRiskChecker(user_id, withdrawAmount);
    const riskResult = await riskChecker.checkAll();
    
    if (riskResult.blocked) {
      // 记录风控日志（不创建提现申请）
      await client.query('COMMIT');
      return res.status(400).json({
        success: false,
        message: '提现申请被拒绝',
        risk_level: riskResult.riskLevel,
        flags: riskResult.flags,
        blocked: true
      });
    }
    
    // 检查余额
    const walletCheck = await client.query(
      'SELECT id, balance, frozen FROM wallets WHERE user_id = $1',
      [user_id]
    );
    
    if (walletCheck.rows.length === 0) {
      throw new Error('钱包不存在');
    }
    
    const wallet = walletCheck.rows[0];
    const balance = parseFloat(wallet.balance);
    const frozen = parseFloat(wallet.frozen);
    
    if (balance < withdrawAmount) {
      throw new Error('钱包余额不足');
    }
    
    // 创建提现申请
    const withdrawResult = await client.query(
      `INSERT INTO withdraw_requests 
       (user_id, wallet_id, amount, net_amount, method, account_info, 
        risk_level, risk_flags, status, user_note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        user_id, wallet.id, withdrawAmount, withdrawAmount - 0, // 平台承担手续费，net_amount = amount
        method, JSON.stringify(account_info),
        riskResult.riskLevel, riskResult.flags,
        riskResult.requiresManualReview ? 'pending' : 'approved', // 低风险自动通过，高风险需人工审核
        user_note || null
      ]
    );
    
    const withdrawRequest = withdrawResult.rows[0];
    
    // 记录风控日志
    await riskChecker.logRisk(withdrawRequest.id);
    
    // 冻结金额
    await client.query(
      'UPDATE wallets SET balance = $1, frozen = $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $3',
      [balance - withdrawAmount, frozen + withdrawAmount, user_id]
    );
    
    // 创建钱包交易记录（pending状态）
    const txResult = await client.query(
      `INSERT INTO wallet_transactions 
       (user_id, wallet_id, transaction_type, direction, amount, currency, 
        description, status, balance_after, frozen_after)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [
        user_id, wallet.id, 'withdrawal', 'out', withdrawAmount, 'CNY',
        `提现申请：${method} ¥${withdrawAmount} ${riskResult.requiresManualReview ? '（待审核）' : ''}`,
        riskResult.requiresManualReview ? 'pending' : 'completed',
        balance - withdrawAmount, frozen + withdrawAmount
      ]
    );
    
    // 更新提现申请关联的交易记录ID
    await client.query(
      'UPDATE withdraw_requests SET wallet_transaction_id = $1 WHERE id = $2',
      [txResult.rows[0].id, withdrawRequest.id]
    );
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: riskResult.requiresManualReview 
        ? '提现申请已提交，需等待人工审核（1-3工作日）'
        : '提现申请已自动通过，预计1-3工作日到账',
      withdraw_id: withdrawRequest.id,
      amount: withdrawAmount,
      status: riskResult.requiresManualReview ? 'pending_review' : 'approved',
      risk_level: riskResult.riskLevel,
      remaining_balance: balance - withdrawAmount,
      pending_amount: frozen + withdrawAmount
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
});

// 用户查询提现记录
router.get('/withdraw/history', authenticate, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { status, limit = 20, offset = 0 } = req.query;
    
    let query = `
      SELECT w.*, 
        u.phone as user_phone,
        u.real_name as user_real_name
      FROM withdraw_requests w
      JOIN users u ON w.user_id = u.id
      WHERE w.user_id = $1
    `;
    const params = [user_id];
    
    if (status) {
      query += ` AND w.status = $${params.length + 1}`;
      params.push(status);
    }
    
    query += ` ORDER BY w.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // 统计
    const stats = await pool.query(
      `SELECT 
        COUNT(*) as total_count,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status IN ('approved', 'processing', 'completed') THEN amount ELSE 0 END) as completed_amount,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount
       FROM withdraw_requests WHERE user_id = $1`,
      [user_id]
    );
    
    res.json({
      success: true,
      withdraws: result.rows,
      stats: stats.rows[0],
      pagination: { limit: parseInt(limit), offset: parseInt(offset), has_more: result.rows.length === parseInt(limit) }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 用户查询单条提现详情
router.get('/withdraw/:id', authenticate, async (req, res) => {
  try {
    const user_id = req.user.id;
    const withdraw_id = req.params.id;
    
    const result = await pool.query(
      `SELECT w.*, 
        u.phone as user_phone,
        u.real_name as user_real_name,
        t.status as tx_status,
        t.balance_after,
        t.created_at as tx_created_at
       FROM withdraw_requests w
       JOIN users u ON w.user_id = u.id
       LEFT JOIN wallet_transactions t ON w.wallet_transaction_id = t.id
       WHERE w.id = $1 AND w.user_id = $2`,
      [withdraw_id, user_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '提现记录不存在' });
    }
    
    // 查询风控日志
    const riskLogs = await pool.query(
      'SELECT * FROM withdraw_risk_logs WHERE withdraw_request_id = $1 ORDER BY created_at DESC',
      [withdraw_id]
    );
    
    res.json({
      success: true,
      withdraw: result.rows[0],
      risk_logs: riskLogs.rows
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 用户取消待审核提现
router.post('/withdraw/:id/cancel', authenticate, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const user_id = req.user.id;
    const withdraw_id = req.params.id;
    
    // 查询提现申请
    const withdrawCheck = await client.query(
      'SELECT * FROM withdraw_requests WHERE id = $1 AND user_id = $2 AND status = $3',
      [withdraw_id, user_id, 'pending']
    );
    
    if (withdrawCheck.rows.length === 0) {
      throw new Error('提现申请不存在或已处理，无法取消');
    }
    
    const withdraw = withdrawCheck.rows[0];
    const amount = parseFloat(withdraw.amount);
    
    // 更新状态为取消
    await client.query(
      "UPDATE withdraw_requests SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [withdraw_id]
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
    
    // 更新交易记录为取消
    await client.query(
      "UPDATE wallet_transactions SET status = 'cancelled' WHERE id = $1",
      [withdraw.wallet_transaction_id]
    );
    
    // 创建取消返还记录
    await client.query(
      `INSERT INTO wallet_transactions 
       (user_id, wallet_id, transaction_type, direction, amount, currency, 
        description, status, balance_after, frozen_after)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        user_id, withdraw.wallet_id, 'withdrawal_cancel', 'in', amount, 'CNY',
        '提现取消返还',
        'completed',
        balance + amount, frozen - amount
      ]
    );
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: '提现申请已取消，金额已返还钱包',
      refunded_amount: amount
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
});

module.exports = { router, WithdrawRiskChecker };
