const express = require('express');
const { authenticate, requireVerifiedUser } = require('../middleware/auth');
const router = express.Router();

// 收益总览（需认证 + 实名认证）
router.get('/summary', authenticate, requireVerifiedUser, async (req, res) => {
  const userId = req.user.id;

  res.json({
    totalEarned: 0,
    pendingSettlement: 0,
    availableWithdraw: 0,
    thisMonth: 0,
    currency: 'CNY'
  });
});

// 结算历史（需认证 + 实名认证）
router.get('/history', authenticate, requireVerifiedUser, async (req, res) => {
  const userId = req.user.id;

  res.json({
    records: [],
    pagination: {
      page: 1,
      limit: 20,
      total: 0
    }
  });
});

// 提现申请（需认证 + 实名认证）
router.post('/withdraw', authenticate, requireVerifiedUser, async (req, res) => {
  const userId = req.user.id;
  const { amount, method, account } = req.body;

  // 安全建议：应校验 amount > 0、method 为白名单值、account 格式正确
  // 安全建议：添加提现频率限制（如每日最多 3 次）和金额上限
  // 安全建议：提现需二次验证（短信验证码 / 支付密码）

  res.json({
    message: '提现申请已提交',
    withdrawId: 'wd_' + Date.now(),
    amount,
    status: 'pending_review',
    estimatedProcessTime: '1-3 工作日'
  });
});

module.exports = router;