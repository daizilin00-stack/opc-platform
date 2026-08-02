# DeepSeek 技术接入方案

> **文档编号：** OPC-TECH-003  
> **版本：** v1.0  
> **日期：** 2026-06-05  
> **状态：** 草案待评审  
> **关联文档：** `architecture.md`、`data-security-compliance.md`、`project-status.md`  
> **编写：** 技术方案官 agent-solution  
> **审阅：** CEO 团坐009

---

## 一、概述

### 1.1 定位：开园过渡方案

DeepSeek 系列模型（DeepSeek-V3、DeepSeek-R1、DeepSeek-Coder）作为 OPC 平台 **开园首阶段的过渡方案**，承担以下核心职责：

| 角色 | 说明 |
|------|------|
| **体验引流** | 开园初期向创业者提供免费/低价 AI 能力，快速积累用户和数据 |
| **国内直连** | 无需跨境专线，规避开园初期的合规风险和网络延迟 |
| **技术验证** | 验证平台模型代理、计费、限流、流式传输等基础设施的稳定性 |
| **数据闭环** | 积累对话数据、Token 消耗数据、用户行为数据，为后续模型选型提供依据 |

> **核心策略：** 开园 3–6 个月内以 DeepSeek 为主力模型，**零加价**（按官方价格透传），用免费/低价体验吸引种子用户。随后根据用户反馈、业务增长和合规进展，逐步引入 GPT-4o / Claude 3.5 / Gemini 等海外模型专线，完成平滑升级。

### 1.2 过渡期时间线（建议）

```
开园日 (Month 0)          Month 1-2              Month 3-4              Month 5-6
    │                        │                      │                      │
    ▼                        ▼                      ▼                      ▼
┌─────────┐            ┌──────────┐          ┌──────────┐          ┌──────────┐
│ 100%   │  ───────▶  │ 80%     │  ─────▶  │ 50%     │  ─────▶  │ 30%     │
│ DeepSeek│            │ DeepSeek │          │ DeepSeek │          │ DeepSeek │
│ 0%     │            │ 20%     │          │ 50%     │          │ 70%     │
│ 海外   │            │ 海外专线 │          │ 海外专线 │          │ 海外专线 │
└─────────┘            └──────────┘          └──────────┘          └──────────┘
     │                      │                      │                      │
  免费/低价              引入体验版               分场景分流            多模型智能路由
  吸引种子               GPT/Claude               （国内日常/           （根据任务类型
  用户                   尝鲜通道                 海外深度推理）         自动选择最优模型）
```

---

## 二、网络路径

### 2.1 整体拓扑

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              用户浏览器 / 客户端                              │
│                          (Next.js 创业者门户)                                 │
└──────────────────────────────┬───────────────────────────────────────────────┘
                               │ HTTPS / WebSocket
┌──────────────────────────────▼───────────────────────────────────────────────┐
│                        Nginx / API Gateway                                    │
│                     (SSL 终止 + 静态资源 + 反向代理)                         │
└──────────────────────────────┬───────────────────────────────────────────────┘
                               │ HTTP/1.1 或 HTTP/2
┌──────────────────────────────▼───────────────────────────────────────────────┐
│                        OPC 平台后端 (Express)                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │  /api/auth          /api/tasks      /api/agents      /api/proxy   │     │
│  │  /api/users         /api/jobs       /api/earnings   /models      │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                                    │                                         │
│                          ┌─────────┴─────────┐                             │
│                          ▼                   ▼                             │
│                   ┌──────────┐        ┌──────────┐                         │
│                   │ PostgreSQL│        │  Redis   │                         │
│                   │ (主库)     │        │(缓存/会话)│                        │
│                   └──────────┘        └──────────┘                         │
│                          │                                                 │
│                          ▼                                                 │
│                   ┌─────────────────┐                                      │
│                   │  model-proxy    │  ← 本方案核心模块                      │
│                   │  (模型代理层)   │                                      │
│                   └────────┬────────┘                                      │
│                            │                                               │
│                            │  HTTPS / SSE                                  │
│                            │  国内直连，无需跨境                              │
│                            ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │                    DeepSeek 官方 API                               │       │
│  │  api.deepseek.com / api.deepseek.com/v1/chat/completions        │       │
│  │  api.deepseek.com/v1/models                                    │       │
│  └─────────────────────────────────────────────────────────────────┘       │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 关键特征

| 特征 | DeepSeek 方案 | 后期 GPT/Claude 专线 |
|------|--------------|----------------------|
| **网络路径** | 用户→前端→OPC 后端→DeepSeek API（国内直连） | 用户→前端→OPC 后端→跨境专线→海外 API |
| **延迟** | 50–150ms（国内） | 200–500ms（跨境） |
| **合规风险** | 极低（国内厂商） | 中（需数据出境合规） |
| **数据存储** | 需关注 DeepSeek 用户协议 | 需关注 OpenAI/Anthropic 数据处理政策 |
| **可用性** | 依赖 DeepSeek 服务稳定性 | 依赖跨境专线稳定性 + 海外服务稳定性 |
| **计费** | 按官方价格，平台不加价 | 按官方价格 + 跨境专线成本 + 平台服务溢价 |

### 2.3 为什么是用户→前端→后端→API，而不是前端直连？

**前端直连（不推荐）：**
```
用户浏览器 ──HTTPS──▶ DeepSeek API
        (API Key 暴露在前端，无法计费、无法限流、无法审计)
```

**后端代理（推荐）：**
```
用户浏览器 ──HTTPS──▶ OPC 后端 ──HTTPS──▶ DeepSeek API
        (API Key 安全存储在服务端，可计费、可限流、可审计、可切换模型)
```

后端代理的优势：
1. **API Key 安全**：统一在后端管理，前端不暴露任何密钥
2. **统一计费**：所有 Token 消耗经过 OPC 平台，实时扣减用户余额
3. **限流管控**：按用户套餐级别精确限流，防刷防滥用
4. **审计留痕**：完整的请求日志、Token 消耗、响应时间，合规审计所需
5. **模型切换**：前端无需改动，后端动态切换 DeepSeek / GPT / Claude
6. **内容过滤**：请求和响应均可经过平台内容安全审查（见 `data-security-compliance.md`）
7. **流式优化**：后端可对 SSE 流进行缓冲、重试、降级处理

---

## 三、模型选择

### 3.1 三款模型定位

| 模型 | 代号 | 定位 | 核心能力 | 适用场景 | 官方价格（输入/输出） |
|------|------|------|----------|----------|---------------------|
| **DeepSeek-V3** | `deepseek-v3` | 通用对话 | 日常对话、知识问答、文案生成、多轮交互 | 客服、销售文案、日常助理 | ¥1 / 1M tokens / ¥2 / 1M tokens |
| **DeepSeek-R1** | `deepseek-r1` | 深度推理 | 数学推理、逻辑分析、复杂决策、长链思考 | 技术方案、数据分析、合规审查 | ¥2 / 1M tokens / ¥8 / 1M tokens |
| **DeepSeek-Coder** | `deepseek-coder` | 编程辅助 | 代码生成、代码审查、Bug 修复、技术文档 | 技术实施、POC 开发、代码交付 | ¥1 / 1M tokens / ¥2 / 1M tokens |

> **价格来源：** DeepSeek 官方定价（2026-06），实际以最新官方价格为准。平台不加价。

### 3.2 模型选择策略

**自动选择（推荐）：**
根据任务类型自动路由到最优模型，无需用户手动选择。

```
用户发起请求
    │
    ▼
┌────────────────────────┐
│ 任务类型识别            │
│ · 客服/日常对话 → V3   │
│ · 技术方案/推理 → R1   │
│ · 代码相关 → Coder    │
│ · 用户手动指定 → 尊重选择│
└────────┬───────────────┘
         │
         ▼
    路由到对应模型
         │
         ▼
    透传 / 缓存 / 流式返回
```

**手动选择（可选）：**
在数字员工面板或 API 调用中，允许用户显式指定模型：
- `model: "deepseek-v3"` — 默认
- `model: "deepseek-r1"` — 深度推理场景
- `model: "deepseek-coder"` — 编程场景

### 3.3 模型能力对比（参考官方数据）

| 能力维度 | DeepSeek-V3 | DeepSeek-R1 | DeepSeek-Coder |
|----------|-------------|-------------|----------------|
| 上下文长度 | 64K tokens | 64K tokens | 64K tokens |
| 知识截止 | 2024-06 | 2024-06 | 2024-06 |
| 中文能力 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐☆ |
| 英文能力 | ⭐⭐⭐⭐☆ | ⭐⭐⭐⭐☆ | ⭐⭐⭐⭐☆ |
| 推理能力 | ⭐⭐⭐⭐☆ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐☆ |
| 代码能力 | ⭐⭐⭐☆☆ | ⭐⭐⭐⭐☆ | ⭐⭐⭐⭐⭐ |
| 多轮对话 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐☆ | ⭐⭐⭐☆☆ |
| 响应速度 | 快 | 中等（思维链较长） | 快 |

---

## 四、后端架构

### 4.1 新增模块：`model-proxy`

在现有 OPC 后端架构中新增 `model-proxy` 模块，作为所有模型调用的统一代理层。

```
opc-platform/backend/
├── src/
│   ├── index.js              # 主入口
│   ├── routes/
│   │   ├── auth.js           # 现有：认证
│   │   ├── tasks.js          # 现有：任务
│   │   ├── agents.js         # 现有：数字员工
│   │   └── proxy.js          # 【新增】模型代理路由
│   ├── services/
│   │   ├── authService.js    # 现有
│   │   ├── taskService.js    # 现有
│   │   └── modelProxyService.js  # 【新增】模型代理核心服务
│   ├── models/               # 数据库模型
│   ├── middleware/
│   │   ├── auth.js           # 认证中间件
│   │   ├── rateLimiter.js    # 【新增】限流中间件
│   │   └── auditLog.js       # 【新增】审计日志中间件
│   └── utils/
│       ├── deepseekClient.js     # 【新增】DeepSeek API 客户端
│       ├── connectionPool.js     # 【新增】HTTP 连接池管理
│       ├── streamingHandler.js   # 【新增】SSE 流式处理
│       └── billingCalculator.js  # 【新增】实时计费计算器
├── config/
│   └── models.js             # 【新增】模型配置（密钥、价格、限流）
├── tests/
│   └── model-proxy.test.js   # 【新增】测试用例
└── package.json
```

### 4.2 核心文件职责

| 文件 | 职责 | 复杂度 |
|------|------|--------|
| `routes/proxy.js` | Express 路由定义：/api/proxy/models, /api/proxy/chat/completions | 低 |
| `services/modelProxyService.js` | 核心业务逻辑：请求转发、模型选择、错误处理、降级策略 | 高 |
| `utils/deepseekClient.js` | DeepSeek API 专用客户端：封装认证、请求、重试 | 中 |
| `utils/connectionPool.js` | http.Agent 长连接管理，复用 TCP 连接 | 中 |
| `utils/streamingHandler.js` | SSE 流式响应的解析、转发、缓冲、中断处理 | 高 |
| `utils/billingCalculator.js` | 根据 Token 消耗实时计算费用，扣减用户余额 | 中 |
| `middleware/rateLimiter.js` | 按用户套餐级别限流（Redis 计数器） | 中 |
| `middleware/auditLog.js` | 记录请求日志（不含原始内容） | 低 |
| `config/models.js` | 模型元数据、API 密钥、价格表、限流参数 | 低 |

### 4.3 新增 API 路由

| 路由 | 方法 | 功能 | 权限 |
|------|------|------|------|
| `/api/proxy/models` | GET | 获取可用模型列表（DeepSeek-V3/R1/Coder） | 认证用户 |
| `/api/proxy/chat/completions` | POST | 发起对话（支持流式/非流式） | 认证用户 + 余额充足 |
| `/api/proxy/usage` | GET | 查询用户当前计费周期内的 Token 消耗和费用 | 认证用户 |
| `/api/proxy/usage/stream` | GET | SSE 实时推送当前会话的 Token 消耗（可选） | 认证用户 |

---

## 五、连接池管理

### 5.1 为什么需要连接池？

每次调用 DeepSeek API 都新建 TCP 连接会导致：
1. **TCP 三次握手延迟**（约 50–100ms）
2. **TLS 握手延迟**（约 100–200ms）
3. **TIME_WAIT 堆积**（大量短连接导致端口耗尽）
4. **CPU 开销**（频繁创建/销毁连接）

使用 http.Agent 长连接复用可将延迟降低 **50% 以上**，并显著提升并发能力。

### 5.2 http.Agent 配置

```javascript
// utils/connectionPool.js
const http = require('http');
const https = require('https');

const deepseekAgent = new https.Agent({
  // 保持连接的最大数量
  maxSockets: 50,
  // 单个目标主机保持连接的最大数量
  maxFreeSockets: 10,
  // 空闲连接超时时间（毫秒）
  freeSocketTimeout: 30000,
  // 连接超时
  timeout: 60000,
  // 是否保持连接
  keepAlive: true,
  // 最大请求数（防止连接老化）
  maxTotalSockets: 100,
});

// 健康检查：定期清理过期连接
setInterval(() => {
  deepseekAgent.destroy(); // 可选：定期重建连接池，防止老化
}, 300000); // 每 5 分钟

module.exports = { deepseekAgent };
```

### 5.3 连接池监控

```javascript
// 连接池状态监控（集成到 /health 或 /metrics）
function getPoolStats() {
  return {
    maxSockets: deepseekAgent.maxSockets,
    maxFreeSockets: deepseekAgent.maxFreeSockets,
    freeSockets: Object.keys(deepseekAgent.freeSockets).length,
    busySockets: Object.keys(deepseekAgent.requests).length,
    // 扩展指标：通过 Agent 内部状态或自定义统计
  };
}
```

### 5.4 连接池优化策略

| 场景 | 策略 | 实现 |
|------|------|------|
| **高并发** | 增大 maxSockets | 根据服务器内存动态调整 |
| **连接老化** | 定期重建 | setInterval 销毁并重建 Agent |
| **连接泄漏** | 请求超时控制 | 每个请求设置 60s 超时 |
| **错误恢复** | 自动重连 | 请求失败时自动切换新连接 |
| **多实例** | 每个后端进程独立连接池 | 进程间不共享，避免竞争 |

---

## 六、流式转发（SSE）

### 6.1 为什么需要流式？

大模型生成长文本时，非流式响应需要等待全部内容生成完成才能返回，用户体验差：
- **非流式**：等待 5–30 秒，一次性返回全部内容，用户感觉"卡顿"
- **流式（SSE）**：首字延迟 500ms–2s，之后逐字/逐句实时呈现，体验接近"真人打字"

### 6.2 SSE 流式架构

```
用户浏览器
    │
    │ POST /api/proxy/chat/completions
    │ { stream: true, model: "deepseek-v3", messages: [...] }
    ▼
OPC 后端 (Express)
    │
    │ 1. 验证用户身份 + 余额
    │ 2. 检查限流
    │ 3. 转发请求到 DeepSeek API
    │
    ▼
DeepSeek API
    │
    │ SSE 流式响应：
    │ data: {"choices":[{"delta":{"content":"你好"}}]}
    │ data: {"choices":[{"delta":{"content":"，"}}]}
    │ data: {"choices":[{"delta":{"content":"我是"}}]}
    │ ...
    │ data: [DONE]
    │
    ▼
OPC 后端
    │
    │ 1. 逐 chunk 接收
    │ 2. 实时计费（累加 tokens）
    │ 3. 可选：内容安全过滤（逐 chunk）
    │ 4. 逐 chunk 转发给用户
    │
    ▼
用户浏览器
    │
    │ 实时呈现：你好，我是...
```

### 6.3 核心代码：流式代理

```javascript
// utils/streamingHandler.js
const { Transform } = require('stream');

class SSETransform extends Transform {
  constructor(options = {}) {
    super({ objectMode: true });
    this.tokenCount = 0;
    this.onToken = options.onToken || (() => {});
    this.onComplete = options.onComplete || (() => {});
  }

  _transform(chunk, encoding, callback) {
    const lines = chunk.toString().split('\n');
    
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      
      const data = line.slice(6); // 去掉 'data: '
      if (data === '[DONE]') {
        this.onComplete(this.tokenCount);
        this.push('data: [DONE]\n\n');
        continue;
      }

      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta;
        
        if (delta?.content) {
          // 估算 token 数（粗略：中文字符 ≈ 1 token，英文 ≈ 4 chars/token）
          this.tokenCount += this._estimateTokens(delta.content);
          this.onToken(delta.content, this.tokenCount);
        }
        
        // 透传给前端
        this.push(`data: ${JSON.stringify(parsed)}\n\n`);
      } catch (err) {
        // 解析失败，原样透传
        this.push(`${line}\n`);
      }
    }
    
    callback();
  }

  _estimateTokens(text) {
    // 简化估算：中文按字符，英文按单词
    // 实际应使用 tiktoken 或 deepseek 的 tokenizer
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const nonChinese = text.length - chineseChars;
    return Math.ceil(chineseChars + nonChinese / 4);
  }
}

module.exports = { SSETransform };
```

### 6.4 流式请求处理路由

```javascript
// routes/proxy.js (片段)
const express = require('express');
const router = express.Router();
const { deepseekClient } = require('../utils/deepseekClient');
const { SSETransform } = require('../utils/streamingHandler');
const { billingCalculator } = require('../utils/billingCalculator');
const rateLimiter = require('../middleware/rateLimiter');
const auth = require('../middleware/auth');

router.post('/chat/completions', auth, rateLimiter, async (req, res) => {
  const { model = 'deepseek-v3', messages, stream = false, ...otherParams } = req.body;
  const userId = req.user.id;

  try {
    // 1. 检查用户余额
    const balance = await billingCalculator.getBalance(userId);
    if (balance <= 0) {
      return res.status(402).json({ error: '余额不足，请充值' });
    }

    // 2. 非流式请求：直接转发，等待完整响应
    if (!stream) {
      const response = await deepseekClient.chatCompletions({
        model,
        messages,
        ...otherParams,
      });

      const tokens = response.usage?.total_tokens || 0;
      const cost = billingCalculator.calculateCost(model, tokens);
      await billingCalculator.deduct(userId, cost);

      return res.json(response);
    }

    // 3. 流式请求：建立 SSE 连接
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const deepseekStream = await deepseekClient.chatCompletionsStream({
      model,
      messages,
      ...otherParams,
    });

    let finalTokenCount = 0;
    let finalCost = 0;

    const sseTransform = new SSETransform({
      onToken: (content, count) => {
        // 实时计费（每 50 tokens 或每秒更新一次）
        if (count % 50 === 0) {
          finalCost = billingCalculator.calculateCost(model, count);
        }
      },
      onComplete: (count) => {
        finalTokenCount = count;
        finalCost = billingCalculator.calculateCost(model, count);
        billingCalculator.deduct(userId, finalCost).catch(console.error);
        
        // 记录审计日志
        auditLog.record({
          userId,
          model,
          tokensUsed: count,
          cost: finalCost,
          timestamp: new Date(),
        });
      },
    });

    // 管道：DeepSeek → SSETransform → 用户
    deepseekStream.pipe(sseTransform).pipe(res);

    // 错误处理
    deepseekStream.on('error', (err) => {
      console.error('DeepSeek stream error:', err);
      if (!res.headersSent) {
        res.status(502).json({ error: '模型服务暂时不可用' });
      } else {
        res.end();
      }
    });

    req.on('close', () => {
      // 用户断开连接，优雅关闭流
      deepseekStream.destroy();
    });

  } catch (err) {
    console.error('Proxy error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: '服务内部错误' });
    }
  }
});

module.exports = router;
```

### 6.5 流式传输关键注意事项

| 问题 | 解决方案 | 优先级 |
|------|----------|--------|
| **用户中途断开** | `req.on('close')` 监听，销毁上游流，避免资源泄漏 | P0 |
| **上游超时** | 设置 60s 请求超时，超时后返回优雅错误 | P0 |
| **SSE 断线重连** | 前端实现 EventSource 重连，后端支持 `Last-Event-ID` | P1 |
| **Token 计数不准** | 流式阶段用估算值，最终以上游返回的 `usage` 字段为准 | P1 |
| **并发连接上限** | 单个用户最多 3 个并发 SSE 连接，防止滥用 | P1 |
| **内容安全** | 流式阶段逐 chunk 过滤，拦截敏感词立即中断 | P0 |

---

## 七、实时计费

### 7.1 计费策略：零加价体验引流

| 阶段 | 策略 | 价格 |
|------|------|------|
| **开园期（Month 0-3）** | 完全免费 | 0 元 |
| **种子期（Month 3-6）** | 按 DeepSeek 官方原价，平台不加价 | 官方价 |
| **成长期（Month 6+）** | 官方价 + 平台服务费（10–20%） | 官方价 × 1.1–1.2 |

> **开园期免费策略：** 每个注册用户赠送 1000 万 tokens 免费额度，或按日限额 10 万 tokens/天。用免费体验吸引用户注册和使用平台。

### 7.2 计费模型

```
费用 = prompt_tokens × 输入单价 + completion_tokens × 输出单价
```

| 模型 | 输入单价（/1M tokens） | 输出单价（/1M tokens） |
|------|----------------------|----------------------|
| deepseek-v3 | ¥1.00 | ¥2.00 |
| deepseek-r1 | ¥2.00 | ¥8.00 |
| deepseek-coder | ¥1.00 | ¥2.00 |

**示例：**
- 用户发送 1000 tokens 的 prompt，DeepSeek-V3 返回 3000 tokens
- 费用 = 1000 × ¥1/1M + 3000 × ¥2/1M = ¥0.001 + ¥0.006 = **¥0.007**

### 7.3 实时计费流程

```
用户发起请求
    │
    ▼
┌────────────────────────────┐
│ 1. 预检查余额               │
│    · 查询用户当前余额        │
│    · 估算最低费用（1 token） │
│    · 余额不足 → 402 错误     │
└────────────┬───────────────┘
             │
             ▼
┌────────────────────────────┐
│ 2. 请求转发 + 流式/非流式   │
└────────────┬───────────────┘
             │
             ▼
┌────────────────────────────┐
│ 3. 实时计费（流式场景）     │
│    · 逐 chunk 估算 token 数 │
│    · 每 50 tokens 或 1s 更新 │
│    · 前端可实时显示已消耗费用 │
└────────────┬───────────────┘
             │
             ▼
┌────────────────────────────┐
│ 4. 最终结算                 │
│    · 收到上游 usage 字段     │
│    · 精确计算费用            │
│    · 扣减用户余额            │
│    · 写入计费记录            │
└────────────┬───────────────┘
             │
             ▼
┌────────────────────────────┐
│ 5. 审计日志                 │
│    · 记录 user_id, model    │
│    · 记录 tokens, cost      │
│    · 不记录原始内容          │
└────────────────────────────┘
```

### 7.4 计费代码框架

```javascript
// utils/billingCalculator.js
class BillingCalculator {
  constructor() {
    // 价格表（从 config/models.js 加载，支持热更新）
    this.prices = {
      'deepseek-v3': { input: 1.0, output: 2.0 },      // 元/百万 tokens
      'deepseek-r1': { input: 2.0, output: 8.0 },
      'deepseek-coder': { input: 1.0, output: 2.0 },
    };
  }

  // 计算单次请求费用（元）
  calculateCost(model, promptTokens, completionTokens) {
    const price = this.prices[model];
    if (!price) throw new Error(`未知模型: ${model}`);

    const promptCost = (promptTokens / 1_000_000) * price.input;
    const completionCost = (completionTokens / 1_000_000) * price.output;
    
    return parseFloat((promptCost + completionCost).toFixed(6));
  }

  // 估算费用（流式阶段使用）
  estimateCost(model, estimatedTokens) {
    // 使用输出价格估算（保守估计）
    const price = this.prices[model];
    return (estimatedTokens / 1_000_000) * price.output;
  }

  // 查询用户余额
  async getBalance(userId) {
    // 从 Redis/PostgreSQL 查询
    const result = await db.query(
      'SELECT balance FROM user_balances WHERE user_id = $1',
      [userId]
    );
    return result.rows[0]?.balance || 0;
  }

  // 扣减余额
  async deduct(userId, amount) {
    if (amount <= 0) return;
    
    await db.query(
      `UPDATE user_balances 
       SET balance = balance - $1, 
           total_spent = total_spent + $1,
           updated_at = NOW()
       WHERE user_id = $2 AND balance >= $1`,
      [amount, userId]
    );
  }

  // 记录计费日志
  async recordUsage(userId, model, promptTokens, completionTokens, cost) {
    await db.query(
      `INSERT INTO model_usage_logs 
       (user_id, model, prompt_tokens, completion_tokens, cost, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [userId, model, promptTokens, completionTokens, cost]
    );
  }
}

module.exports = new BillingCalculator();
```

### 7.5 用户余额管理

| 字段 | 类型 | 说明 |
|------|------|------|
| `user_id` | UUID | 用户唯一标识 |
| `balance` | DECIMAL(12,6) | 当前余额（元） |
| `free_quota` | BIGINT | 免费额度剩余（tokens） |
| `free_quota_daily` | BIGINT | 每日免费限额（tokens） |
| `total_spent` | DECIMAL(12,6) | 累计消费 |
| `total_tokens_used` | BIGINT | 累计 Token 消耗 |
| `billing_period_start` | TIMESTAMP | 计费周期开始 |

**扣费优先级：**
1. 先用免费额度（`free_quota`）
2. 再用每日免费限额（`free_quota_daily`）
3. 最后用余额（`balance`）
4. 三者皆无 → 402 余额不足

---

## 八、限流策略

### 8.1 按套餐级别限流

| 套餐 | 并发请求 | RPM（请求/分钟） | TPM（tokens/分钟） | 日限额 | 月限额 |
|------|----------|------------------|-------------------|--------|--------|
| **体验版**（免费注册） | 1 | 10 | 20,000 | 100,000 tokens | 1,000,000 tokens |
| **创业版**（付费） | 3 | 60 | 100,000 | 500,000 tokens | 5,000,000 tokens |
| **出海版**（高阶） | 10 | 300 | 500,000 | 2,000,000 tokens | 20,000,000 tokens |
| **企业定制** | 协商 | 协商 | 协商 | 无上限 | 无上限 |

> **RPM = Requests Per Minute，TPM = Tokens Per Minute**

### 8.2 限流中间件实现

```javascript
// middleware/rateLimiter.js
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

const limits = {
  trial: { rpm: 10, tpm: 20000, concurrent: 1 },
  startup: { rpm: 60, tpm: 100000, concurrent: 3 },
  overseas: { rpm: 300, tpm: 500000, concurrent: 10 },
};

async function rateLimiter(req, res, next) {
  const userId = req.user.id;
  const tier = req.user.subscription_tier || 'trial';
  const limit = limits[tier] || limits.trial;

  const now = Math.floor(Date.now() / 1000);
  const windowKey = `ratelimit:${userId}:${now}`;
  const concurrentKey = `concurrent:${userId}`;

  try {
    // 1. 检查并发数
    const concurrent = await redis.incr(concurrentKey);
    await redis.expire(concurrentKey, 60);
    
    if (concurrent > limit.concurrent) {
      await redis.decr(concurrentKey);
      return res.status(429).json({
        error: '并发请求过多',
        limit: limit.concurrent,
        current: concurrent,
      });
    }

    // 2. 检查 RPM（每分钟请求数）
    const requests = await redis.incr(`${windowKey}:requests`);
    await redis.expire(`${windowKey}:requests`, 60);
    
    if (requests > limit.rpm) {
      await redis.decr(concurrentKey);
      return res.status(429).json({
        error: '请求过于频繁',
        retry_after: 60 - (now % 60),
      });
    }

    // 3. 检查 TPM（每分钟 tokens，由请求发起时预估 prompt tokens）
    const estimatedPromptTokens = req.body.messages?.reduce((acc, msg) => {
      return acc + Math.ceil(msg.content.length / 4); // 粗略估算
    }, 0) || 0;

    const tokens = await redis.incrby(`${windowKey}:tokens`, estimatedPromptTokens);
    await redis.expire(`${windowKey}:tokens`, 60);
    
    if (tokens > limit.tpm) {
      await redis.decr(concurrentKey);
      return res.status(429).json({
        error: 'Token 消耗超出限额',
        retry_after: 60 - (now % 60),
      });
    }

    // 请求结束后释放并发计数
    res.on('finish', () => {
      redis.decr(concurrentKey).catch(() => {});
    });

    next();
  } catch (err) {
    // Redis 故障时放行（降级策略），但记录告警
    console.error('Rate limiter error:', err);
    next();
  }
}

module.exports = rateLimiter;
```

### 8.3 限流响应格式

```json
{
  "error": "请求过于频繁",
  "code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 45,
  "limit": 60,
  "current": 61,
  "tier": "startup",
  "suggestion": "升级到出海版可提升限额至 300 RPM"
}
```

---

## 九、代码框架

### 9.1 完整 Express 路由

```javascript
// routes/proxy.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimiter');
const auditLog = require('../middleware/auditLog');
const modelProxyService = require('../services/modelProxyService');

/**
 * GET /api/proxy/models
 * 获取可用模型列表
 */
router.get('/models', auth, async (req, res) => {
  try {
    const models = await modelProxyService.getAvailableModels();
    res.json({ models });
  } catch (err) {
    res.status(500).json({ error: '获取模型列表失败' });
  }
});

/**
 * POST /api/proxy/chat/completions
 * 对话补全（支持流式/非流式）
 */
router.post('/chat/completions', auth, rateLimiter, auditLog, async (req, res) => {
  const { model = 'deepseek-v3', messages, stream = false, temperature, max_tokens } = req.body;
  const userId = req.user.id;

  try {
    const result = await modelProxyService.chatCompletions({
      userId,
      model,
      messages,
      stream,
      temperature,
      max_tokens,
    }, res);

    if (!stream) {
      res.json(result);
    }
    // 流式场景：modelProxyService 直接操作 res 对象
  } catch (err) {
    console.error('Chat completion error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || '服务内部错误' });
    }
  }
});

/**
 * GET /api/proxy/usage
 * 查询用户当前计费周期用量
 */
router.get('/usage', auth, async (req, res) => {
  try {
    const usage = await modelProxyService.getUserUsage(req.user.id);
    res.json(usage);
  } catch (err) {
    res.status(500).json({ error: '查询用量失败' });
  }
});

module.exports = router;
```

### 9.2 核心服务层

```javascript
// services/modelProxyService.js
const deepseekClient = require('../utils/deepseekClient');
const billingCalculator = require('../utils/billingCalculator');
const { SSETransform } = require('../utils/streamingHandler');
const db = require('../models/db');

class ModelProxyService {
  async getAvailableModels() {
    return [
      {
        id: 'deepseek-v3',
        name: 'DeepSeek-V3',
        description: '通用对话模型，适合日常问答、文案生成',
        pricing: { input: 1.0, output: 2.0, unit: '元/百万tokens' },
        capabilities: ['chat', 'completion', 'streaming'],
        max_context: 64000,
      },
      {
        id: 'deepseek-r1',
        name: 'DeepSeek-R1',
        description: '深度推理模型，适合复杂分析、逻辑推理',
        pricing: { input: 2.0, output: 8.0, unit: '元/百万tokens' },
        capabilities: ['chat', 'completion', 'streaming', 'reasoning'],
        max_context: 64000,
      },
      {
        id: 'deepseek-coder',
        name: 'DeepSeek-Coder',
        description: '编程辅助模型，适合代码生成、技术文档',
        pricing: { input: 1.0, output: 2.0, unit: '元/百万tokens' },
        capabilities: ['chat', 'completion', 'streaming', 'code'],
        max_context: 64000,
      },
    ];
  }

  async chatCompletions({ userId, model, messages, stream, temperature, max_tokens }, res) {
    // 1. 检查余额
    const balance = await billingCalculator.getBalance(userId);
    if (balance <= 0) {
      throw new Error('余额不足');
    }

    // 2. 非流式
    if (!stream) {
      const response = await deepseekClient.chatCompletions({
        model,
        messages,
        temperature,
        max_tokens,
      });

      const promptTokens = response.usage?.prompt_tokens || 0;
      const completionTokens = response.usage?.completion_tokens || 0;
      const cost = billingCalculator.calculateCost(model, promptTokens, completionTokens);

      await billingCalculator.deduct(userId, cost);
      await billingCalculator.recordUsage(userId, model, promptTokens, completionTokens, cost);

      return response;
    }

    // 3. 流式
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const deepseekStream = await deepseekClient.chatCompletionsStream({
      model,
      messages,
      temperature,
      max_tokens,
    });

    let finalPromptTokens = 0;
    let finalCompletionTokens = 0;
    let finalCost = 0;

    // 估算 prompt tokens（流式响应不包含 prompt usage）
    finalPromptTokens = messages.reduce((acc, msg) => {
      return acc + Math.ceil(msg.content.length / 4);
    }, 0);

    const sseTransform = new SSETransform({
      onToken: (content, count) => {
        finalCompletionTokens = count;
      },
      onComplete: (count) => {
        finalCompletionTokens = count;
        finalCost = billingCalculator.calculateCost(model, finalPromptTokens, finalCompletionTokens);
        
        billingCalculator.deduct(userId, finalCost).catch(console.error);
        billingCalculator.recordUsage(userId, model, finalPromptTokens, finalCompletionTokens, finalCost).catch(console.error);
      },
    });

    deepseekStream.pipe(sseTransform).pipe(res);

    // 错误处理
    deepseekStream.on('error', (err) => {
      console.error('Stream error:', err);
      if (!res.headersSent) {
        res.status(502).json({ error: '模型服务暂时不可用' });
      } else {
        res.write(`data: {"error": "连接中断"}\n\n`);
        res.end();
      }
    });

    req?.on('close', () => {
      deepseekStream.destroy();
    });
  }

  async getUserUsage(userId) {
    const period = await db.query(`
      SELECT 
        SUM(prompt_tokens) as total_prompt_tokens,
        SUM(completion_tokens) as total_completion_tokens,
        SUM(cost) as total_cost,
        COUNT(*) as total_requests,
        model
      FROM model_usage_logs
      WHERE user_id = $1 
        AND created_at >= DATE_TRUNC('month', NOW())
      GROUP BY model
    `, [userId]);

    const balance = await billingCalculator.getBalance(userId);

    return {
      balance,
      period: '本月',
      by_model: period.rows,
    };
  }
}

module.exports = new ModelProxyService();
```

### 9.3 DeepSeek 客户端封装

```javascript
// utils/deepseekClient.js
const axios = require('axios');
const { deepseekAgent } = require('./connectionPool');

const API_BASE = 'https://api.deepseek.com/v1';
const API_KEY = process.env.DEEPSEEK_API_KEY;

class DeepSeekClient {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      httpAgent: deepseekAgent, // 使用连接池
      timeout: 60000,
    });
  }

  async chatCompletions(params) {
    const response = await this.client.post('/chat/completions', {
      ...params,
      stream: false,
    });
    return response.data;
  }

  async chatCompletionsStream(params) {
    const response = await this.client.post('/chat/completions', {
      ...params,
      stream: true,
    }, {
      responseType: 'stream',
    });
    return response.data;
  }

  async getModels() {
    const response = await this.client.get('/models');
    return response.data;
  }
}

module.exports = new DeepSeekClient();
```

---

## 十、性能估算

### 10.1 测试基准

| 指标 | 假设值 | 说明 |
|------|--------|------|
| 平均 prompt 长度 | 500 tokens | 用户输入 + 系统提示 |
| 平均 completion 长度 | 1500 tokens | 模型输出 |
| 平均响应时间 | 3 秒 | 首字延迟 500ms + 生成时间 |
| 并发用户数 | 100 | 同时在线请求 |
| 请求模式 | 50% 流式 / 50% 非流式 | 混合场景 |

### 10.2 资源估算

#### 带宽

```
单请求峰值带宽 = completion tokens / 生成时间 × 单 token 大小
              = 1500 / 3s × 4 bytes
              ≈ 2 KB/s（上行，到 DeepSeek）
              ≈ 2 KB/s（下行，到用户）

100 并发总带宽 = 100 × 2 KB/s × 2（上下行）
              ≈ 400 KB/s = 3.2 Mbps

考虑峰值和协议开销（HTTP headers、TCP overhead）：
建议预留带宽：10–20 Mbps（含 3x 余量）
```

#### 内存

```
OPC 后端单进程内存占用：
┌─────────────────────┬────────────┐
│ Express + Node.js 基础 │ 100 MB     │
│ 连接池 (50 连接)       │ 5 MB       │
│ 活跃请求上下文 (100)   │ 50 MB      │
│ Redis 连接            │ 2 MB       │
│ 数据库连接池          │ 5 MB       │
│ 流式缓冲区 (100)       │ 20 MB      │
│ 其他（日志、缓存等）    │ 30 MB      │
├─────────────────────┼────────────┤
│ 单进程总计            │ ~210 MB    │
└─────────────────────┴────────────┘

集群部署（4 进程）：
总内存 = 4 × 210 MB ≈ 840 MB

建议配置：2 GB 内存（含余量，可支撑到 200 并发）
```

#### CPU

```
单请求 CPU 开销（OPC 后端）：
┌─────────────────────┬──────────────┐
│ 请求解析/验证        │ 1 ms         │
│ 限流检查（Redis）    │ 2 ms         │
│ 计费计算             │ 1 ms         │
│ 流式转发（每 chunk）  │ 0.5 ms × 100 │
│ 日志记录             │ 2 ms         │
├─────────────────────┼──────────────┤
│ 单请求总计           │ ~50 ms CPU   │
│ 单请求持续时间        │ 3000 ms      │
│ CPU 占用率           │ 50/3000 = 1.7%│
└─────────────────────┴──────────────┘

100 并发总 CPU = 100 × 1.7% = 170%

Node.js 单进程单线程：
· 需要 2 个进程（170% / 单进程 100%）
· 考虑 I/O 等待和余量，建议 4 进程

推荐配置：4 核 CPU（可支撑 200+ 并发）
```

### 10.3 100 并发性能汇总

| 资源 | 估算值 | 推荐配置 | 余量 |
|------|--------|----------|------|
| **带宽** | 3.2 Mbps | 20 Mbps | 6x |
| **内存** | 840 MB | 2 GB | 2.4x |
| **CPU** | 170% | 4 核 | 2.3x |
| **Redis** | 100 并发计数器 | 1 核 + 1 GB | 充足 |
| **PostgreSQL** | 100 并发查询 | 2 核 + 2 GB | 充足 |
| **连接池** | 50 连接 | 100 连接 | 2x |

### 10.4 扩容路径

```
当前：单机 4 进程 → 200 并发
         │
         ▼
    横向扩展（加机器）
         │
         ▼
    2 台：400 并发
    4 台：800 并发
    8 台：1600 并发
         │
         ▼
    负载均衡（Nginx 或 AWS ALB）
    共享 Redis（集群模式）
    共享 PostgreSQL（读写分离）
```

---

## 十一、与后期 GPT/Claude 专线的切换路径

### 11.1 设计原则：模型无关

`model-proxy` 模块的设计核心是 **模型无关化**：前端和后端业务逻辑不关心底层是 DeepSeek、GPT 还是 Claude。切换模型只需修改配置，无需改动业务代码。

```
┌─────────────────────────────────────────────────────────┐
│                      前端 / 客户端                         │
│                 (只关心 model ID 和 messages)             │
└─────────────────────────┬─────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    model-proxy 路由层                      │
│              /api/proxy/chat/completions                │
│              /api/proxy/models                          │
│              /api/proxy/usage                           │
└─────────────────────────┬─────────────────────────────────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
        ┌────────┐  ┌────────┐  ┌────────┐
        │DeepSeek│  │ OpenAI │  │Anthropic│
        │ Client │  │ Client │  │ Client  │
        │ (国内)  │  │(跨境)  │  │ (跨境)  │
        └────────┘  └────────┘  └────────┘
```

### 11.2 切换策略

#### 第一阶段：并行运行（Month 3-4）

```javascript
// config/models.js
module.exports = {
  providers: {
    deepseek: {
      baseURL: 'https://api.deepseek.com/v1',
      apiKey: process.env.DEEPSEEK_API_KEY,
      region: 'domestic',
      priority: 1, // 默认优先
    },
    openai: {
      baseURL: 'https://api.openai.com/v1', // 或跨境专线地址
      apiKey: process.env.OPENAI_API_KEY,
      region: 'overseas',
      priority: 2, // 备选
    },
    anthropic: {
      baseURL: 'https://api.anthropic.com/v1',
      apiKey: process.env.ANTHROPIC_API_KEY,
      region: 'overseas',
      priority: 3,
    },
  },
  
  models: {
    'deepseek-v3': { provider: 'deepseek', modelId: 'deepseek-chat', tier: 'free' },
    'deepseek-r1': { provider: 'deepseek', modelId: 'deepseek-reasoner', tier: 'free' },
    'gpt-4o': { provider: 'openai', modelId: 'gpt-4o', tier: 'premium' },
    'claude-3-5-sonnet': { provider: 'anthropic', modelId: 'claude-3-5-sonnet-20241022', tier: 'premium' },
  },
  
  routing: {
    default: 'deepseek-v3',
    // 按用户套餐路由
    byTier: {
      trial: ['deepseek-v3', 'deepseek-r1'], // 免费用户只能用 DeepSeek
      startup: ['deepseek-v3', 'deepseek-r1', 'gpt-4o'], // 创业版可体验 GPT
      overseas: ['deepseek-v3', 'deepseek-r1', 'gpt-4o', 'claude-3-5-sonnet'], // 出海版全部可用
    },
    // 按任务类型路由（自动选择）
    byTask: {
      coding: 'deepseek-coder', // 或 'claude-3-5-sonnet'
      reasoning: 'deepseek-r1', // 或 'gpt-4o'
      daily: 'deepseek-v3', // 或 'gpt-4o'
    },
  },
};
```

#### 第二阶段：智能路由（Month 5-6）

根据任务类型、用户套餐、模型负载、响应速度自动选择最优模型：

```javascript
// services/modelRouter.js
class ModelRouter {
  async selectModel({ taskType, userTier, preferredModel, urgency }) {
    const availableModels = config.routing.byTier[userTier] || config.routing.byTier.trial;
    
    // 1. 用户手动指定，检查权限
    if (preferredModel && availableModels.includes(preferredModel)) {
      return preferredModel;
    }
    
    // 2. 按任务类型匹配
    if (taskType && config.routing.byTask[taskType]) {
      const taskModel = config.routing.byTask[taskType];
      if (availableModels.includes(taskModel)) {
        return taskModel;
      }
    }
    
    // 3. 按负载和延迟选择（实时监控）
    const modelStats = await this.getModelStats(availableModels);
    const bestModel = modelStats
      .filter(m => m.healthy)
      .sort((a, b) => a.avgLatency - b.avgLatency)[0];
    
    return bestModel?.id || config.routing.default;
  }
}
```

#### 第三阶段：完全切换（Month 6+）

当海外专线稳定、合规手续完备后，可将默认模型切换为 GPT-4o / Claude 3.5：

```javascript
// 仅修改配置，零代码改动
module.exports = {
  routing: {
    default: 'gpt-4o', // 切换默认模型
    byTier: {
      trial: ['deepseek-v3'], // 免费用户仍用 DeepSeek（成本控制）
      startup: ['gpt-4o', 'deepseek-r1'],
      overseas: ['claude-3-5-sonnet', 'gpt-4o', 'deepseek-v3'],
    },
  },
};
```

### 11.3 跨境专线接入要点

当接入 GPT/Claude 海外专线时，需额外考虑：

| 维度 | DeepSeek（国内） | GPT/Claude（海外专线） |
|------|-----------------|----------------------|
| **网络** | 国内直连，50ms | 跨境专线，200ms+ |
| **合规** | 无需数据出境评估 | 需完成安全评估/标准合同备案 |
| **计费** | 官方价 + 0% | 官方价 + 跨境专线成本 + 平台服务费 |
| **API 格式** | OpenAI-compatible | OpenAI-compatible（Claude 略有差异） |
| **内容审查** | 国内法规 | 国内法规 + 海外平台内容政策 |
| **故障切换** | 单点 | 多供应商（OpenAI + Anthropic 互备） |

### 11.4 客户端兼容性

所有模型客户端均遵循 **OpenAI API 格式**：

```javascript
// 统一接口，不同实现
interface ModelClient {
  chatCompletions(params: ChatParams): Promise<ChatResponse>;
  chatCompletionsStream(params: ChatParams): Promise<Stream>;
  getModels(): Promise<Model[]>;
}

// DeepSeek、OpenAI、Anthropic 均实现此接口
// 前端始终调用 /api/proxy/chat/completions，无需感知底层变化
```

---

## 十二、数据库表设计

### 12.1 model_usage_logs（模型调用日志）

```sql
CREATE TABLE model_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    request_id UUID NOT NULL,
    model VARCHAR(50) NOT NULL,
    provider VARCHAR(50) NOT NULL, -- 'deepseek', 'openai', 'anthropic'
    prompt_tokens BIGINT NOT NULL DEFAULT 0,
    completion_tokens BIGINT NOT NULL DEFAULT 0,
    total_tokens BIGINT NOT NULL DEFAULT 0,
    cost DECIMAL(12, 6) NOT NULL DEFAULT 0,
    latency_ms INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'success', -- 'success', 'error', 'timeout', 'rate_limited'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_user_created (user_id, created_at),
    INDEX idx_model_created (model, created_at),
    INDEX idx_request_id (request_id)
);
```

### 12.2 user_balances（用户余额）

```sql
CREATE TABLE user_balances (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    balance DECIMAL(12, 6) NOT NULL DEFAULT 0,
    free_quota BIGINT NOT NULL DEFAULT 10000000, -- 1000万 tokens
    free_quota_daily BIGINT NOT NULL DEFAULT 100000, -- 10万/天
    free_quota_used_today BIGINT NOT NULL DEFAULT 0,
    total_spent DECIMAL(12, 6) NOT NULL DEFAULT 0,
    total_tokens_used BIGINT NOT NULL DEFAULT 0,
    billing_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 12.3 model_provider_configs（模型供应商配置）

```sql
CREATE TABLE model_provider_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL UNIQUE, -- 'deepseek', 'openai', 'anthropic'
    base_url VARCHAR(255) NOT NULL,
    api_key_encrypted TEXT NOT NULL, -- 加密存储
    region VARCHAR(20) NOT NULL, -- 'domestic', 'overseas'
    is_active BOOLEAN NOT NULL DEFAULT true,
    priority INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 十三、风险与应对

| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|----------|
| DeepSeek API 服务中断 | 中 | 高 | 1. 实现自动降级到备用模型（如有）<br>2. 返回友好错误提示<br>3. 记录故障，触发告警 |
| DeepSeek 涨价 | 低 | 中 | 1. 价格配置热更新<br>2. 提前通知用户<br>3. 引导升级至海外模型 |
| Token 计费不准 | 中 | 中 | 1. 流式阶段用估算，最终以上游 usage 为准<br>2. 允许用户申诉，人工审核<br>3. 设置误差容忍阈值（±5%） |
| 用户刷量/滥用 | 中 | 高 | 1. 严格限流（RPM/TPM/并发）<br>2. 异常检测（单用户突然高频）<br>3. 风控系统标记异常用户 |
| 数据隐私争议 | 低 | 极高 | 1. 参考 `data-security-compliance.md` 五层防御<br>2. 用户协议明确数据使用条款<br>3. 不存储原始对话内容 |
| 后期切换海外模型合规受阻 | 中 | 高 | 1. 开园即启动合规准备工作<br>2. 保留 DeepSeek 作为长期备选<br>3. 分阶段切换，先试点再推广 |

---

## 十四、实施计划

### 14.1 开发里程碑

| 阶段 | 周期 | 任务 | 交付物 |
|------|------|------|--------|
| **Phase 1** | Week 1 | 基础设施搭建 | `config/models.js`, `utils/connectionPool.js`, `utils/deepseekClient.js` |
| **Phase 2** | Week 2 | 核心代理服务 | `services/modelProxyService.js`, `routes/proxy.js` |
| **Phase 3** | Week 3 | 流式 + 计费 | `utils/streamingHandler.js`, `utils/billingCalculator.js`, SSE 端到端测试 |
| **Phase 4** | Week 4 | 限流 + 审计 | `middleware/rateLimiter.js`, `middleware/auditLog.js`, 数据库表 |
| **Phase 5** | Week 5 | 集成测试 | 压力测试（100 并发）、计费精度测试、故障切换测试 |
| **Phase 6** | Week 6 | 文档 + 上线 | 本方案文档、API 文档、运维手册、上线部署 |

### 14.2 上线 checklist

- [ ] DeepSeek API Key 申请并配置到环境变量
- [ ] 连接池参数调优（根据实际服务器配置）
- [ ] Redis 限流配置验证
- [ ] 数据库表创建 + 索引优化
- [ ] 计费精度校准（与 DeepSeek 官方账单对比）
- [ ] 内容安全过滤集成（见 `data-security-compliance.md`）
- [ ] 监控告警配置（延迟、错误率、余额不足告警）
- [ ] 用户协议更新（模型服务条款、数据使用条款）
- [ ] 灰度发布（先 10% 用户，再全量）
- [ ] 回滚方案准备（一键切换回纯 OpenClaw Agent 模式）

---

## 十五、总结

DeepSeek 作为 OPC 平台开园过渡方案，具有以下核心价值：

1. **零合规风险**：国内厂商，无需数据出境评估，开园即可上线
2. **成本极低**：官方价格极低（¥1–8/百万 tokens），平台零加价，可支撑免费体验策略
3. **技术验证**：验证模型代理、流式传输、实时计费、限流等核心基础设施
4. **用户引流**：免费/低价体验吸引种子用户，快速验证产品-market fit
5. **平滑升级**：模型无关架构设计，后期切换 GPT/Claude 只需改配置，无需重写业务代码

**关键成功指标：**
- 开园首月注册用户 > 500 人
- 模型调用成功率 > 99.5%
- 平均响应延迟 < 3 秒
- 计费误差 < 5%
- 用户满意度 > 4.0/5.0

---

**下一步行动：**
1. CEO 审批本方案
2. 技术团队启动 Phase 1 开发（Week 1 目标：完成基础客户端 + 连接池）
3. 同步申请 DeepSeek API Key 并测试连通性
4. 与合规团队确认数据安全策略集成方案

---

> **文档控制：**  
> 版本历史：v1.0 (2026-06-05) — 初始草案  
> 审批人：CEO 团坐009（待签批）  
> 关联工单：OPC-TECH-003
