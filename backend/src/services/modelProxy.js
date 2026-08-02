const axios = require('axios');
const logger = require('../utils/logger');

// ============================================================
// 模型代理服务 — 统一封装国内大模型（Kimi / DeepSeek / 通义千问）
// ============================================================
// 统一对外暴露 OpenAI-compatible 接口格式，内部路由到不同供应商
// 支持：chat.completions (流式 / 非流式)

// --- 1. 模型配置映射 --------------------------------------------------

const MODEL_CONFIGS = {
  // Kimi（Moonshot AI）
  'kimi': {
    provider: 'kimi',
    baseUrl: 'https://api.moonshot.cn/v1',
    apiKeyEnv: 'KIMI_API_KEY',
    defaultModel: 'moonshot-v1-8k',       // 默认用 8k 上下文
    models: [
      { id: 'moonshot-v1-8k',  context: 8192,  desc: 'Kimi 8K 上下文' },
      { id: 'moonshot-v1-32k', context: 32768, desc: 'Kimi 32K 上下文' },
      { id: 'moonshot-v1-128k',context: 131072,desc: 'Kimi 128K 上下文' },
    ],
  },

  // DeepSeek
  'deepseek': {
    provider: 'deepseek',
    baseUrl: 'https://api.deepseek.com/v1',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    defaultModel: 'deepseek-chat',
    models: [
      { id: 'deepseek-chat',      context: 65536, desc: 'DeepSeek-V3 通用对话' },
      { id: 'deepseek-reasoner',  context: 65536, desc: 'DeepSeek-R1 推理模型' },
    ],
  },

  // 通义千问（阿里云百炼）
  'tongyi': {
    provider: 'tongyi',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKeyEnv: 'TONGYI_API_KEY',
    defaultModel: 'qwen-turbo',
    models: [
      { id: 'qwen-turbo',    context: 8192,  desc: '通义千问 Turbo 快速版' },
      { id: 'qwen-plus',    context: 32768, desc: '通义千问 Plus 平衡版' },
      { id: 'qwen-max',     context: 32768, desc: '通义千问 Max 最强版' },
    ],
  },

  // LingAPI — 海外模型统一渠道（OpenAI-compatible）
  'lingapi': {
    provider: 'lingapi',
    baseUrl: process.env.LINGAPI_BASE_URL || 'http://118.196.5.14:5208/v1',
    apiKeyEnv: 'LINGAPI_API_KEY',
    defaultModel: 'gpt-5.4',
    models: [
      { id: 'gpt-5.5',           context: 200000, desc: 'GPT-5.5 旗舰模型' },
      { id: 'gpt-5.4',           context: 200000, desc: 'GPT-5.4 标准模型' },
      { id: 'gpt-5.4-mini',      context: 200000, desc: 'GPT-5.4-mini 轻量模型' },
      { id: 'claude-sonnet-5',   context: 200000, desc: 'Claude Sonnet 5' },
      { id: 'claude-sonnet-4-6', context: 200000, desc: 'Claude Sonnet 4.6' },
      { id: 'deepseek-v4-flash', context: 65536,  desc: 'DeepSeek-V4 Flash' },
      { id: 'deepseek-v4-pro',   context: 65536,  desc: 'DeepSeek-V4 Pro' },
      { id: 'kimi-k2.5',         context: 131072, desc: 'Kimi K2.5' },
      { id: 'gemini-3.5-flash',  context: 131072, desc: 'Gemini 3.5 Flash' },
    ],
  },

  // OpenAI（海外模型）— 已弃用，统一改用 LingAPI
  // 'openai': { ... },

  // Anthropic（海外模型）— 已弃用，统一改用 LingAPI
  // 'anthropic': { ... },
};

// 反向映射：模型 ID → 供应商
const MODEL_ID_TO_PROVIDER = {};
for (const [providerKey, config] of Object.entries(MODEL_CONFIGS)) {
  for (const m of config.models) {
    MODEL_ID_TO_PROVIDER[m.id] = providerKey;
  }
}

// --- 2. 辅助函数 ------------------------------------------------------

function getApiKey(config) {
  const key = process.env[config.apiKeyEnv];
  if (!key) {
    throw new Error(`缺少 API Key：请在 .env 中设置 ${config.apiKeyEnv}`);
  }
  return key;
}

function getProviderByModel(modelId) {
  const providerKey = MODEL_ID_TO_PROVIDER[modelId];
  if (!providerKey) return null;
  return MODEL_CONFIGS[providerKey];
}

// 估算 Token 数（简单方案：中文 ≈ 1 char ≈ 1 token，英文 ≈ 1 word ≈ 1.3 token）
function estimateTokens(text) {
  if (!text) return 0;
  let tokens = 0;
  for (const char of text) {
    tokens += (char.charCodeAt(0) > 127) ? 1 : 0.6; // 粗略估算
  }
  return Math.ceil(tokens);
}

/**
 * 修正上游网关可能注入系统提示导致的 prompt_tokens 虚高问题
 * 规则：
 *  1. 如果上游返回了 prompt_tokens_details.cached_tokens，优先减去缓存部分；
 *  2. 如果修正后的 prompt_tokens 仍明显超过本地估算的 3 倍（且差值 > 500），
 *     使用本地估算值作为计费上限；
 *  3. 始终保留原始 usage，便于审计和对账。
 */
function sanitizeUsage(usage, messages) {
  if (!usage) return null;

  const originalPrompt = usage.prompt_tokens || 0;
  const originalCompletion = usage.completion_tokens || 0;
  const originalTotal = usage.total_tokens || (originalPrompt + originalCompletion);

  // 本地估算用户实际发送的 prompt tokens
  const promptText = messages.map(m => m.content).join('\n');
  const estimatedPrompt = estimateTokens(promptText);

  // 减去上游缓存的 tokens（通常是网关注入的提示模板）
  const cachedTokens = usage.prompt_tokens_details?.cached_tokens || 0;
  let adjustedPrompt = Math.max(0, originalPrompt - cachedTokens);

  // 如果修正后仍然显著偏高（超过估算 3 倍且差值 > 500），降级使用本地估算值
  const varianceThreshold = Math.max(estimatedPrompt * 3, estimatedPrompt + 500);
  if (adjustedPrompt > varianceThreshold && estimatedPrompt > 0) {
    adjustedPrompt = estimatedPrompt;
  }

  const adjustedTotal = adjustedPrompt + originalCompletion;

  if (adjustedPrompt !== originalPrompt) {
    logger.info(
      `[用量修正] prompt_tokens ${originalPrompt} -> ${adjustedPrompt} ` +
      `(cached=${cachedTokens}, estimated=${estimatedPrompt})`
    );
  }

  return {
    prompt_tokens: adjustedPrompt,
    completion_tokens: originalCompletion,
    total_tokens: adjustedTotal,
    original_prompt_tokens: originalPrompt,
    original_total_tokens: originalTotal,
    cached_tokens: cachedTokens,
    estimated_prompt_tokens: estimatedPrompt,
  };
}

// --- 3. 核心调用方法 --------------------------------------------------

/**
 * 非流式聊天调用
 * @param {Object} params
 *   - model        模型 ID（如 'moonshot-v1-8k'）
 *   - messages     OpenAI 格式的消息数组 [{role, content}, ...]
 *   - temperature  可选，默认 0.7
 *   - maxTokens    可选，默认 2048
 * @returns {Object}  { content, usage: { prompt_tokens, completion_tokens, total_tokens } }
 */
async function chatCompletion(params) {
  const { model, messages, temperature = 0.7, maxTokens = 2048 } = params;

  const config = getProviderByModel(model);
  if (!config) {
    throw new Error(`不支持的模型: ${model}`);
  }

  const apiKey = getApiKey(config);
  const url = `${config.baseUrl}/chat/completions`;

  const body = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  try {
    const startTime = Date.now();
    const response = await axios.post(url, body, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60 秒超时
    });
    const latency = Date.now() - startTime;

    const choice = response.data.choices?.[0];
    const content = choice?.message?.content || '';

    // 优先使用供应商返回的 usage，否则估算；对异常偏高的 prompt_tokens 进行修正
    let usage = response.data.usage ? sanitizeUsage(response.data.usage, messages) : null;
    if (!usage) {
      const promptText = messages.map(m => m.content).join('\n');
      const promptTokens = estimateTokens(promptText);
      const completionTokens = estimateTokens(content);
      usage = {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
      };
    }

    logger.info(`[模型调用] ${config.provider}/${model} | 耗时 ${latency}ms | tokens=${usage.total_tokens}`);

    return {
      content,
      usage,
      model,
      provider: config.provider,
      latency,
    };
  } catch (err) {
    logger.error(`[模型调用失败] ${config.provider}/${model}:`, err.message);
    if (err.response?.data) {
      // 只记录 message，避免上游品牌/内部错误类型写入日志
      const safeError = err.response.data.error || err.response.data;
      logger.error('供应商响应:', JSON.stringify({
        message: safeError?.message || safeError,
        status: err.response.status,
      }));
    }
    // 包装错误，不暴露上游内部错误类型（如 new_api_error）
    throw new Error(`模型调用失败: ${err.response?.data?.error?.message || err.message}`);
  }
}

/**
 * 流式聊天调用（SSE Server-Sent Events）
 * @param {Object} params   同 chatCompletion
 * @returns {AsyncGenerator}  每次 yield 一个 chunk 对象
 */
async function* chatCompletionStream(params) {
  const { model, messages, temperature = 0.7, maxTokens = 2048 } = params;

  const config = getProviderByModel(model);
  if (!config) {
    throw new Error(`不支持的模型: ${model}`);
  }

  const apiKey = getApiKey(config);
  const url = `${config.baseUrl}/chat/completions`;

  const body = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: true,
  };

  try {
    const response = await axios.post(url, body, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      responseType: 'stream',
      timeout: 120000,
    });

    const stream = response.data;
    let buffer = '';
    let fullContent = '';

    for await (const chunk of stream) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop(); // 保留未完整行

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (!trimmed.startsWith('data: ')) continue;

        const jsonStr = trimmed.slice(6);
        try {
          const data = JSON.parse(jsonStr);
          const delta = data.choices?.[0]?.delta?.content || '';
          if (delta) {
            fullContent += delta;
            yield { content: delta, done: false };
          }
        } catch (parseErr) {
          // 忽略解析失败的行
        }
      }
    }

    // 流式请求上游通常不会返回 usage，使用本地估算；保留统一修正逻辑入口
    const promptText = messages.map(m => m.content).join('\n');
    const promptTokens = estimateTokens(promptText);
    const completionTokens = estimateTokens(fullContent);

    yield {
      done: true,
      fullContent,
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
        estimated_prompt_tokens: promptTokens,
      },
    };
  } catch (err) {
    logger.error(`[流式模型调用失败] ${config.provider}/${model}:`, err.message);
    throw new Error(`流式模型调用失败: ${err.message}`);
  }
}

// --- 4. 对外暴露接口 --------------------------------------------------

module.exports = {
  chatCompletion,
  chatCompletionStream,
  MODEL_CONFIGS,
  MODEL_ID_TO_PROVIDER,
  getProviderByModel,
  estimateTokens,
};
