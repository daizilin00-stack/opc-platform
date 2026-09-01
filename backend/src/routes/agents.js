const express = require('express');
const { authenticate, requireVerifiedUser } = require('../middleware/auth');
const { chatCompletion } = require('../services/modelProxy');
const { calculateTokenCost } = require('../config/pricing');
const pool = require('../db/pool');
const logger = require('../utils/logger');

const router = express.Router();

const agentNames = {
  'agent-ceo': 'CEO (团坐009)',
  'agent-sales': '销售总监',
  'agent-support': '客服主管',
  'agent-solution': '技术方案官',
  'agent-compliance': '合规风控官',
  'agent-assistant': '行政助理'
};

const agentSystemPrompts = {
  'agent-ceo': `你是 CSDP AgentWork 平台的 CEO（代号：团坐009）。
你的职责是全局调度、跨部门协调、向董事长汇报。
请用专业、简洁、有战略高度的语气回答创业者的问题，必要时给出可执行建议。`,
  'agent-sales': `你是 CSDP AgentWork 平台的销售总监。
你的职责是客户开发、方案报价、CRM 管理。
请帮助创业者制定销售策略、撰写客户开发话术、分析竞品、生成报价建议。
语气要积极、专业、有说服力。`,
  'agent-support': `你是 CSDP AgentWork 平台的客服主管。
你的职责是 7×24 答疑、工单分级、满意度回访。
请耐心、准确地回答创业者关于平台使用、产品功能、计费规则的问题。
如果无法确定，请引导用户联系人工客服。`,
  'agent-solution': `你是 CSDP AgentWork 平台的技术方案官。
你的职责是方案设计、POC 管理、技术文档。
请帮助创业者理解技术架构、生成方案书大纲、制定 POC 清单、解答 API 接入问题。`,
  'agent-compliance': `你是 CSDP AgentWork 平台的合规风控官。
你的职责是法规跟踪、资质审核、合同审查。
请帮助创业者识别跨境数据业务中的合规风险，提供法规参考和风险提示。
注意：你不是执业律师，涉及具体法律决策时请建议咨询专业律师。`,
  'agent-assistant': `你是 CSDP AgentWork 平台的行政助理。
你的职责是日程提醒、统计报表、催办通知。
请帮助创业者整理待办事项、生成日报/周报模板、安排优先级。`
};

const DEFAULT_MODEL = process.env.AGENT_DEFAULT_MODEL || 'deepseek-chat';

/**
 * 检查用户钱包余额
 */
async function ensureSufficientBalance(userId, estimatedCost) {
  const result = await pool.query(
    'SELECT balance FROM wallets WHERE user_id = $1',
    [userId]
  );
  const balance = result.rows.length > 0 ? parseFloat(result.rows[0].balance) : 0;
  return {
    sufficient: balance >= estimatedCost,
    balance: Math.round(balance * 100) / 100,
  };
}

/**
 * 记录 Token 用量并扣费
 */
async function recordAgentTokenUsage(userId, model, usage, agentType) {
  if (!usage) return { costCny: 0, balanceAfter: 0, model };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let costInfo;
    try {
      costInfo = calculateTokenCost(model, usage.prompt_tokens, usage.completion_tokens);
    } catch (e) {
      costInfo = { totalCost: 0, markup: 0 };
    }

    const costCny = costInfo.totalCost;

    const walletResult = await client.query(
      `UPDATE wallets
       SET balance = balance - $1, updated_at = NOW()
       WHERE user_id = $2
       RETURNING balance`,
      [costCny, userId]
    );

    if (walletResult.rows.length === 0) {
      throw new Error(`用户 ${userId} 钱包不存在，无法扣费`);
    }

    const balanceAfter = parseFloat(walletResult.rows[0].balance);

    const tokenUsageResult = await client.query(
      `INSERT INTO token_usage
       (user_id, agent_type, model_name, prompt_tokens, completion_tokens, total_tokens, cost_cny)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        userId,
        agentType,
        model,
        usage.prompt_tokens,
        usage.completion_tokens,
        usage.total_tokens,
        costCny,
      ]
    );

    await client.query(
      `INSERT INTO wallet_transactions
       (user_id, wallet_id, transaction_type, direction, amount, currency,
        balance_after, frozen_after, description, status)
       SELECT w.id, w.id, 'token_usage', 'out', $1, 'CNY',
              $2, w.frozen, $3, 'completed'
       FROM wallets w
       WHERE w.user_id = $4`,
      [costCny, balanceAfter, `数字员工调用: ${agentType} (${model}, token_usage_id=${tokenUsageResult.rows[0].id})`, userId]
    );

    await client.query('COMMIT');

    logger.info(`[数字员工] 用户 ${userId} | ${agentType} | ${model} | ${usage.total_tokens} tokens | ¥${costCny} | 余额 ¥${balanceAfter}`);

    return { costCny, balanceAfter: Math.round(balanceAfter * 100) / 100, model };
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('[数字员工] 扣费失败:', err);
    return { costCny: 0, balanceAfter: 0, model, error: true, message: err.message };
  } finally {
    client.release();
  }
}

// 召唤数字员工（需认证 + 企业认证）
router.post('/invoke', authenticate, requireVerifiedUser, async (req, res) => {
  const { agentType, message, context = '' } = req.body;
  const userId = req.user.id;

  if (!agentType || !message) {
    return res.status(400).json({ error: '缺少必要参数: agentType, message' });
  }

  if (!agentSystemPrompts[agentType]) {
    return res.status(400).json({ error: '未知数字员工类型' });
  }

  try {
    // 估算费用上限：默认按 1000 prompt + max 2048 completion 估算
    const estimatedCost = 0.05;
    const balanceCheck = await ensureSufficientBalance(userId, estimatedCost);
    if (!balanceCheck.sufficient) {
      return res.status(402).json({
        error: '余额不足',
        message: `钱包余额不足，请先充值。当前余额: ¥${balanceCheck.balance}`,
        currentBalance: balanceCheck.balance,
      });
    }

    const systemPrompt = agentSystemPrompts[agentType];
    const messages = [
      { role: 'system', content: systemPrompt + (context ? `\n\n上下文：${context}` : '') },
      { role: 'user', content: message }
    ];

    const result = await chatCompletion({
      model: DEFAULT_MODEL,
      messages,
      temperature: 0.7,
      maxTokens: 2048,
    });

    const cost = await recordAgentTokenUsage(userId, result.model || DEFAULT_MODEL, result.usage, agentType);

    res.json({
      success: true,
      agentType,
      agentName: agentNames[agentType],
      sessionId: 'session_' + Date.now(),
      status: 'active',
      response: {
        text: result.content,
        actions: []
      },
      usage: result.usage,
      cost,
      model: result.model || DEFAULT_MODEL,
    });
  } catch (err) {
    logger.error(`[数字员工] 用户 ${userId} 调用 ${agentType} 失败:`, err.message);
    res.status(502).json({
      error: '数字员工调用失败',
      message: err.message,
    });
  }
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
