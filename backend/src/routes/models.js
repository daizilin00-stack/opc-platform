const express = require('express');
const router = express.Router();
const { authenticate, requireVerifiedUser } = require('../middleware/auth');
const { chatCompletion, chatCompletionStream, MODEL_CONFIGS, estimateTokens } = require('../services/modelProxy');
const { calculateTokenCost } = require('../config/pricing');
const pool = require('../db/pool');
const logger = require('../utils/logger');

// ============================================================
// 模型代理路由 /api/models
// ============================================================
// 统一封装国内大模型（Kimi / DeepSeek / 通义千问）
// 鉴权：JWT + 企业认证（只有完成企业认证的用户才能调用模型）

// --- 1. 获取可用模型列表 ------------------------------------------------

/**
 * GET /api/models
 * 返回所有可用的国内模型列表（含能力说明、定价）
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const models = [];

    for (const [providerKey, config] of Object.entries(MODEL_CONFIGS)) {
      for (const m of config.models) {
        // 从定价配置中获取价格
        let pricing = null;
        try {
          pricing = calculateTokenCost(m.id, 1000, 1000); // 示例：1000 in + 1000 out
        } catch (e) {
          // 如果 pricing.js 中没有该模型，用 providerKey 兜底
          try {
            pricing = calculateTokenCost(providerKey, 1000, 1000);
          } catch (e2) {
            pricing = { inputCost: 0, outputCost: 0, totalCost: 0, markup: 0 };
          }
        }

        models.push({
          id: m.id,
          name: m.desc,
          provider: config.provider,
          providerName: providerName(config.provider),
          contextWindow: m.context,
          pricing: {
            inputPer1k: pricing.inputCost,
            outputPer1k: pricing.outputCost,
            markup: pricing.markup,
          },
          features: modelFeatures(config.provider, m.id),
        });
      }
    }

    res.json({
      success: true,
      models,
      count: models.length,
    });
  } catch (err) {
    logger.error('[模型列表] 获取失败:', err);
    res.status(500).json({ error: '获取模型列表失败' });
  }
});

// --- 2. 非流式聊天接口 --------------------------------------------------

/**
 * POST /api/models/chat
 * 请求体:
 *   {
 *     "model": "moonshot-v1-8k",
 *     "messages": [{"role":"system","content":"你是助手"},{"role":"user","content":"你好"}],
 *     "temperature": 0.7,
 *     "maxTokens": 2048
 *   }
 */
router.post('/chat', authenticate, requireVerifiedUser, async (req, res) => {
  const userId = req.user.id;
  const { model, messages, temperature = 0.7, maxTokens = 2048 } = req.body;

  if (!model || !messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: '缺少必要参数: model, messages' });
  }

  try {
    // 1. 估算并检查钱包余额
    const estimatedCost = estimateMaxCost(model, messages, maxTokens);
    const balanceCheck = await ensureSufficientBalance(userId, estimatedCost);
    if (!balanceCheck.sufficient) {
      return res.status(402).json({
        error: '余额不足',
        message: `钱包余额不足，请先充值。当前余额: ¥${balanceCheck.balance}，预计需要: ¥${estimatedCost}`,
        currentBalance: balanceCheck.balance,
        estimatedCost,
      });
    }

    // 2. 调用模型
    const result = await chatCompletion({
      model,
      messages,
      temperature,
      maxTokens,
    });

    // 3. 计算费用、扣款并记录用量
    const cost = await recordTokenUsage(userId, model, result.usage, result.provider);

    res.json({
      success: true,
      content: result.content,
      usage: result.usage,
      cost,
      model: result.model,
      provider: result.provider,
      latency: result.latency,
    });
  } catch (err) {
    logger.error(`[模型聊天] 用户 ${userId} 调用失败:`, err.message);
    res.status(502).json({
      error: '模型调用失败',
      message: err.message,
    });
  }
});

// --- 3. 流式聊天接口（SSE） ---------------------------------------------

/**
 * POST /api/models/chat/stream
 * 请求体: 同 /chat
 * 响应: Server-Sent Events 流
 */
router.post('/chat/stream', authenticate, requireVerifiedUser, async (req, res) => {
  const userId = req.user.id;
  const { model, messages, temperature = 0.7, maxTokens = 2048 } = req.body;

  if (!model || !messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: '缺少必要参数: model, messages' });
  }

  // 1. 估算并检查钱包余额（在设置 SSE 头之前返回 JSON 错误）
  const estimatedCost = estimateMaxCost(model, messages, maxTokens);
  let balanceCheck;
  try {
    balanceCheck = await ensureSufficientBalance(userId, estimatedCost);
  } catch (err) {
    logger.error(`[流式模型聊天] 余额检查失败 用户 ${userId}:`, err.message);
    return res.status(500).json({ error: '余额检查失败', message: err.message });
  }
  if (!balanceCheck.sufficient) {
    return res.status(402).json({
      error: '余额不足',
      message: `钱包余额不足，请先充值。当前余额: ¥${balanceCheck.balance}，预计需要: ¥${estimatedCost}`,
      currentBalance: balanceCheck.balance,
      estimatedCost,
    });
  }

  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // 禁用 Nginx 缓冲

  try {
    const stream = chatCompletionStream({
      model,
      messages,
      temperature,
      maxTokens,
    });

    let fullContent = '';
    let usage = null;

    for await (const chunk of stream) {
      if (chunk.done) {
        usage = chunk.usage;
        fullContent = chunk.fullContent;
        break;
      }

      fullContent += chunk.content;

      // 发送 SSE 数据
      res.write(`data: ${JSON.stringify({
        content: chunk.content,
        done: false,
      })}\n\n`);
    }

    // 计算费用、扣款并记录用量
    const cost = await recordTokenUsage(userId, model, usage, getProviderFromModel(model));

    // 发送结束标记
    res.write(`data: ${JSON.stringify({
      done: true,
      usage,
      cost,
    })}\n\n`);

    res.end();
  } catch (err) {
    logger.error(`[流式模型聊天] 用户 ${userId} 调用失败:`, err.message);

    // 如果已经发送了 SSE 头，用 SSE 格式发送错误
    res.write(`data: ${JSON.stringify({
      error: true,
      message: err.message,
    })}\n\n`);
    res.end();
  }
});

// --- 4. 辅助函数 --------------------------------------------------------

function providerName(provider) {
  const map = {
    'kimi': 'Moonshot AI（Kimi）',
    'deepseek': 'DeepSeek',
    'tongyi': '阿里云（通义千问）',
    'lingapi': 'LingAPI（海外模型统一渠道）',
  };
  return map[provider] || provider;
}

function modelFeatures(provider, modelId) {
  const base = [];
  if (provider === 'kimi') {
    base.push('超长上下文', '中文理解强', '联网搜索');
    if (modelId.includes('128k')) base.push('128K 超长上下文');
  } else if (provider === 'deepseek') {
    base.push('高性价比', '中文写作强');
    if (modelId.includes('reasoner')) base.push('推理能力强', '数学/代码');
  } else if (provider === 'tongyi') {
    base.push('阿里云生态', '中文理解强', '多模态');
    if (modelId.includes('max')) base.push('最强推理能力');
  } else if (provider === 'lingapi') {
    base.push('海外模型统一渠道', 'OpenAI-compatible');
    if (modelId.startsWith('gpt')) base.push('OpenAI 官方模型', '英文/代码强');
    if (modelId.startsWith('claude')) base.push('Claude 模型', '安全对齐', '推理强');
    if (modelId.startsWith('deepseek')) base.push('DeepSeek 模型', '高性价比');
    if (modelId.startsWith('kimi')) base.push('Kimi 模型', '中文理解强');
  }
  return base;
}

function getProviderFromModel(modelId) {
  const { getProviderByModel } = require('../services/modelProxy');
  const config = getProviderByModel(modelId);
  return config?.provider || 'unknown';
}

/**
 * 估算一次模型调用的最大可能费用（用于调用前余额检查）
 */
function estimateMaxCost(model, messages, maxTokens = 2048) {
  try {
    // 按 model ID 定价；如果是按次计费模型，直接取 perCall 价格
    const pricing = calculateTokenCost(model, 0, 0);
    if (pricing.perCallCost) {
      return pricing.totalCost;
    }
    // 按量模型：prompt 按消息估算，output 按 maxTokens 估算上限
    const promptText = messages.map(m => m.content).join('\n');
    const estimatedPrompt = estimateTokens(promptText);
    return calculateTokenCost(model, estimatedPrompt, maxTokens).totalCost;
  } catch (err) {
    // 如果找不到定价，按一个安全上限估算，避免余额检查误判
    return 0.1;
  }
}

/**
 * 检查用户钱包余额是否足够
 * @returns {Object} { sufficient: boolean, balance: number }
 */
async function ensureSufficientBalance(userId, amount) {
  const result = await pool.query(
    'SELECT balance FROM wallets WHERE user_id = $1',
    [userId]
  );
  const balance = result.rows.length > 0 ? parseFloat(result.rows[0].balance) : 0;
  return {
    sufficient: balance >= amount,
    balance: Math.round(balance * 100) / 100,
  };
}

/**
 * 记录 Token 用量到数据库，并实际扣减用户钱包余额
 * @returns {Object} { costCny, balanceAfter, model }
 */
async function recordTokenUsage(userId, model, usage, provider) {
  if (!usage) return { costCny: 0, balanceAfter: 0, model };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 计算费用（优先用 model ID 作为 pricing key）
    let costInfo;
    try {
      costInfo = calculateTokenCost(model, usage.prompt_tokens, usage.completion_tokens);
    } catch (e) {
      try {
        costInfo = calculateTokenCost(provider, usage.prompt_tokens, usage.completion_tokens);
      } catch (e2) {
        costInfo = { totalCost: 0, markup: 0 };
      }
    }

    const costCny = costInfo.totalCost;

    // 1. 扣减钱包余额
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

    // 2. 写入 token_usage 表
    const tokenUsageResult = await client.query(
      `INSERT INTO token_usage
       (user_id, agent_type, model_name, prompt_tokens, completion_tokens, total_tokens, cost_cny)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        userId,
        'model_proxy',
        model,
        usage.prompt_tokens,
        usage.completion_tokens,
        usage.total_tokens,
        costCny,
      ]
    );

    // 3. 写入钱包交易流水
    await client.query(
      `INSERT INTO wallet_transactions
       (user_id, wallet_id, transaction_type, direction, amount, currency,
        balance_after, frozen_after, description, status)
       SELECT w.id, w.id, 'token_usage', 'out', $1, 'CNY',
              $2, w.frozen, $3, 'completed'
       FROM wallets w
       WHERE w.user_id = $4`,
      [costCny, balanceAfter, `模型调用: ${model} (token_usage_id=${tokenUsageResult.rows[0].id})`, userId]
    );

    await client.query('COMMIT');

    logger.info(`[用量记录] 用户 ${userId} | ${model} | ${usage.total_tokens} tokens | ¥${costCny} | 余额 ¥${balanceAfter}`);

    return { costCny, balanceAfter: Math.round(balanceAfter * 100) / 100, model, provider };
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('[用量记录] 扣费失败:', err);
    return { costCny: 0, balanceAfter: 0, model, provider, error: true, message: err.message };
  } finally {
    client.release();
  }
}

module.exports = router;
