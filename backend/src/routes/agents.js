const express = require('express');
const { authenticate, requireCompanyAuth } = require('../middleware/auth');
const router = express.Router();

// 召唤数字员工（需认证 + 企业认证）
router.post('/invoke', authenticate, requireCompanyAuth, async (req, res) => {
  const { agentType, context, taskId, message } = req.body;
  const userId = req.user.id;

  // 安全建议：应对 message 做输入长度限制（<= 2000 字符）和敏感词过滤
  // 安全建议：应对 agentType 做白名单校验，防止注入非预期 Agent
  // 安全建议：添加调用频率限制，防止 API 滥用和费用失控

  const agentNames = {
    'agent-ceo': 'CEO (团坐009)',
    'agent-sales': '销售总监',
    'agent-support': '客服主管',
    'agent-solution': '技术方案官',
    'agent-compliance': '合规风控官',
    'agent-assistant': '行政助理'
  };

  // TODO: 实际调用 OpenClaw Agent，传入 userId 做审计追踪
  res.json({
    message: 'Agent 已召唤',
    agentType,
    agentName: agentNames[agentType] || agentType,
    sessionId: 'session_' + Date.now(),
    status: 'active',
    response: {
      text: `您好，我是 ${agentNames[agentType] || agentType}，已收到您的请求，正在处理...`,
      actions: []
    }
  });
});

// 获取 Agent 会话历史（需认证）
router.get('/sessions/:sessionId', authenticate, async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user.id;

  // TODO: 验证 sessionId 属于当前用户，防止水平越权

  res.json({
    sessionId,
    history: [],
    status: 'active'
  });
});

// 预设模板（公开）
router.get('/', async (req, res) => {
  res.json({
    agents: [
      { id: 'agent-ceo', name: 'CEO (团坐009)', role: '全局调度', status: 'active' },
      { id: 'agent-sales', name: '销售总监', role: '客户开发', status: 'active' },
      { id: 'agent-support', name: '客服主管', role: '7×24 答疑', status: 'active' },
      { id: 'agent-solution', name: '技术方案官', role: '方案设计', status: 'active' },
      { id: 'agent-compliance', name: '合规风控官', role: '法规审查', status: 'active' },
      { id: 'agent-assistant', name: '行政助理', role: '日程/提醒', status: 'active' }
    ]
  });
});

router.get('/templates', async (req, res) => {
  res.json({
    templates: [
      {
        id: 'tpl_001',
        name: '客户开发话术生成',
        agentType: 'agent-sales',
        description: '输入客户行业和地区，自动生成开发话术'
      },
      {
        id: 'tpl_002',
        name: '技术方案快速生成',
        agentType: 'agent-solution',
        description: '输入客户需求，生成标准技术方案书'
      },
      {
        id: 'tpl_003',
        name: '合规风险初筛',
        agentType: 'agent-compliance',
        description: '上传合同或客户资料，自动标注风险点'
      },
      {
        id: 'tpl_004',
        name: '客户工单自动应答',
        agentType: 'agent-support',
        description: '输入客户问题，自动匹配最佳答案'
      }
    ]
  });
});

module.exports = router;