# OPC 平台 × LingAPI 技术对接需求书

> 发送方：中新数据港 OPC 平台（团坐009）  
> 接收方：LingAPI 技术团队  
> 日期：2026-06-29  
> 版本：V1.0  
> 对接人：技术负责人

---

## 一、合作背景与目标

中新数据港 OPC 平台是一个面向企业客户的 AI SaaS 服务平台，计划接入 LingAPI 的模型能力作为上游渠道之一。我们已就商务价格（2.4 折）达成一致，现进入技术对接阶段。

**核心目标**：
- 我们不需要使用 LingAPI 的用户系统、计费系统、前端页面
- 我们只需要一个**总账户 API Key**，通过标准 OpenAI 格式调用模型
- 所有用户管理、计费、品牌由 OPC 平台自行处理

---

## 二、我们需要的接入方式

### 2.1 总账户批发模式（OpenAI 格式）

```
┌────────────────────────────────────────┐
│              OPC 平台                     │
│  ┌──────────┐     ┌──────────────────┐ │
│  │ 用户A    │────→│                  │ │
│  │ 用户B    │────→│  OPC 网关        │ │
│  │ 用户C    │────→│  (用户/计费/品牌)│ │
│  └──────────┘     └────────┬─────────┘ │
│                             │            │
│                        1 个总 API Key    │
│                             │            │
│                             ↓            │
│                      ┌──────────┐        │
│                      │ LingAPI  │        │
│                      │ 上游渠道 │        │
│                      └──────────┘        │
└────────────────────────────────────────┘
```

**关键要求**：
- 给我们一个 **Master API Key**（总账户密钥）
- 我们按实际调用量计费，月底结算
- 我们内部再分发给终端用户，LingAPI 不感知最终用户

---

## 三、具体技术需求

### 3.1 API 格式要求

| 项目 | 要求 | 说明 |
|------|------|------|
| **接口规范** | OpenAI API 兼容 | `/v1/chat/completions`, `/v1/models` 等 |
| **鉴权方式** | Bearer Token | `Authorization: Bearer sk-...` |
| **请求格式** | JSON | 与 OpenAI 标准一致 |
| **响应格式** | SSE (流式) + JSON | 标准 OpenAI 流式返回 |
| **编码** | UTF-8 | 中英文支持 |

### 3.2 请求示例（我们发出的）

```bash
curl https://lingapi.com/v1/chat/completions \
  -H "Authorization: Bearer sk-xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant"},
      {"role": "user", "content": "你好，请介绍一下自己"}
    ],
    "stream": true,
    "temperature": 0.7
  }'
```

### 3.3 响应要求

```json
// 非流式响应
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "created": 1700000000,
  "model": "gpt-4o",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "你好！我是..."
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 50,
    "total_tokens": 75
  }
}
```

```
// 流式响应 (SSE)
data: {"id":"chatcmpl-xxx","choices":[{"delta":{"content":"你"}}]}

data: {"id":"chatcmpl-xxx","choices":[{"delta":{"content":"好"}}]}

data: [DONE]
```

**关键要求**：
- `usage` 字段必须返回准确的 token 消耗数（用于我们的计费）
- 流式响应必须正确返回 `usage` 在最后一个 chunk 中
- 错误码遵循 OpenAI 标准（401/429/500 等）

---

## 四、品牌隔离要求

### 4.1 响应头脱敏

由于我们的终端用户不会知道 LingAPI 的存在，请确保：

| 响应头 | 要求 |
|--------|------|
| `x-request-id` | ✅ 保留，用于排查问题 |
| `x-new-api-version` | ❌ 请移除或改为通用名称 |
| `x-new-api-xxx` | ❌ 所有带 new-api 标识的头请移除 |
| `Server` | ⚠️ 建议改为通用值如 `nginx` 或移除 |
| 任何包含 "Ling" 或 "new-api" 的头 | ❌ 请移除 |

### 4.2 错误信息重写

请将错误信息中的品牌标识替换为通用描述：

| 原错误 | 改为 |
|--------|------|
| "LingAPI key invalid" | "API key invalid" |
| "new-api rate limit" | "rate limit exceeded" |
| "LingAPI quota exceeded" | "quota exceeded" |

---

## 五、计费与用量查询

### 5.1 我们需要的数据

为了 OPC 平台能准确计费，我们需要实时或准实时的用量数据：

| 数据项 | 要求 | 用途 |
|--------|------|------|
| 每次请求的 `usage` | 实时 | 即时扣费 |
| 模型名称 | 实时 | 按模型区分单价 |
| 请求时间 | 实时 | 对账 |
| 请求 IP | 可选 | 安全审计 |

### 5.2 建议的用量查询方式

请提供以下方式之一（优先级从高到低）：

**方案 A：Webhook 回调（推荐）**
- 每次请求完成后，LingAPI 回调 OPC 提供的 Webhook URL
- 携带请求 ID、模型、token 用量、用户信息

```json
// Webhook 回调示例
{
  "request_id": "req-xxx",
  "model": "gpt-4o",
  "prompt_tokens": 100,
  "completion_tokens": 200,
  "total_tokens": 300,
  "timestamp": "2026-06-29T10:00:00Z",
  "cost": 0.005  // 按 2.4 折后的实际成本
}
```

**方案 B：用量查询 API**
- 提供一个查询接口，按时间段查询用量
- 支持按模型、按天聚合

```bash
GET /v1/billing/usage?start_date=2026-06-01&end_date=2026-06-29
Authorization: Bearer sk-master-key
```

**方案 C：每日用量报告（兜底）**
- 每天凌晨自动生成前一天的用量报告
- 通过邮件或 API 下载

---

## 六、模型支持清单

请确认 2.4 折价格覆盖以下模型（或提供完整清单）：

| 模型 | 类型 | 确认可用 |
|------|------|---------|
| gpt-4o | OpenAI | ？ |
| gpt-4o-mini | OpenAI | ？ |
| gpt-4-turbo | OpenAI | ？ |
| claude-3-5-sonnet | Anthropic | ？ |
| claude-3-opus | Anthropic | ？ |
| gemini-1.5-pro | Google | ？ |
| gemini-1.5-flash | Google | ？ |
| deepseek-chat | DeepSeek | ？ |
| deepseek-coder | DeepSeek | ？ |
| doubao-pro | 字节 | ？ |
| qwen-max | 阿里 | ？ |
| glm-4 | 智谱 | ？ |

---

## 七、技术调试协作流程

### 7.1 调试环境

| 环境 | 地址 | 用途 |
|------|------|------|
| OPC 开发环境 | `http://dev.opc-platform.com` | 日常调试 |
| OPC 测试环境 | `http://test.opc-platform.com` | 联调测试 |
| LingAPI 测试地址 | 请提供 | 沙盒测试 |

### 7.2 联调步骤

**Phase 1：连通性测试（1 天）**
1. LingAPI 提供测试用 API Key（有限额度）
2. OPC 从开发环境发起请求，验证连通性
3. 测试成功标准：能返回 200 + 正确 usage

**Phase 2：品牌隔离验证（1 天）**
1. OPC 检查响应头，确认无 LingAPI 标识
2. 检查错误信息，确认品牌已脱敏
3. 测试成功标准：终端用户无法感知上游是 LingAPI

**Phase 3：计费精度验证（1-2 天）**
1. OPC 记录自身统计的 token 数
2. 与 LingAPI 返回的 usage 对比
3. 误差应 < 1%，否则排查原因

**Phase 4：压测（1 天）**
1. 模拟并发请求（100 req/s）
2. 监控响应时间、错误率、限流情况
3. 确认 LingAPI 能承载 OPC 平台预期流量

### 7.3 沟通渠道

| 场景 | 沟通方式 | 响应时间要求 |
|------|---------|-------------|
| 日常技术问题 | 微信群/飞书 | 2 小时内 |
| 紧急故障（P0） | 电话 + 微信群 | 15 分钟内 |
| 需求变更 | 邮件 + 会议 | 1 个工作日内 |
| 月度对账 | 邮件 | 3 个工作日内 |

---

## 八、安全要求

### 8.1 API Key 安全

| 项目 | 要求 |
|------|------|
| **传输加密** | 必须使用 HTTPS，禁止 HTTP |
| **Key 存储** | 请确保我们的 Master Key 不在任何日志中明文打印 |
| **Key 轮换** | 支持定期轮换（如每季度），旧 Key 保留 7 天兼容期 |
| **IP 白名单** | 建议支持绑定 OPC 服务器出口 IP，增强安全性 |

### 8.2 数据安全

| 项目 | 要求 |
|------|------|
| **对话数据** | 不存储用户对话内容，仅用于路由和计费 |
| **数据留存** | 计费日志保留 30 天，对账完成后可删除 |
| **合规** | 符合中国网络安全法、数据安全法要求 |

---

## 九、交付清单

请 LingAPI 技术团队在对接完成后提供：

| 交付物 | 说明 | 时间 |
|--------|------|------|
| **Master API Key** | 生产环境总账户密钥 | 联调前 |
| **测试 API Key** | 沙盒测试用（有限额度） | 立即 |
| **API 文档** | 完整的接口文档（OpenAI 兼容说明） | 联调前 |
| **计费接口** | 用量查询 API 或 Webhook 文档 | 联调前 |
| **对接联系人** | 技术负责人联系方式 | 立即 |
| **SLA 承诺** | 可用性、响应时间、故障处理流程 | 签约前 |

---

## 十、常见问题（FAQ）

**Q1：OPC 需要 LingAPI 的用户系统吗？**
> 不需要。我们有自己的用户体系，只通过 Master Key 调用模型。

**Q2：OPC 需要 LingAPI 的计费系统吗？**
> 不需要。我们自建计费，但需要 LingAPI 提供准确的 usage 数据用于对账。

**Q3：终端用户会看到 LingAPI 吗？**
> 不会。我们要求品牌完全隔离，用户只知道 "中新数据港 OPC 平台"。

**Q4：如果 LingAPI 上游（如 OpenAI）故障，怎么通知？**
> 建议在错误响应中区分 "LingAPI 层错误" 和 "上游错误"，便于我们判断是否需要切换渠道。

**Q5：支持自定义模型名映射吗？**
> 可选。如果我们用 `opc-gpt-4o` 作为内部模型名，LingAPI 能否映射到 `gpt-4o`？

---

## 附录：技术联系方式

| 角色 | 姓名 | 联系方式 | 职责 |
|------|------|---------|------|
| OPC 技术负责人 | 团坐009 | 微信/邮件 | 整体架构、接口定义 |
| OPC 后端开发 | 待定 | 待定 | 网关开发、联调 |
| OPC 前端开发 | 待定 | 待定 | 前端页面集成 |
| LingAPI 技术负责人 | 待定 | 待填写 | 接口实现、调试 |
| LingAPI 运维 | 待定 | 待填写 | 压测、监控、故障处理 |

---

**文档状态**：待 LingAPI 技术团队确认  
**下一步行动**：请 LingAPI 确认以上需求，提供测试 Key 和对接人联系方式

---

> 本需求书基于双方 2.4 折商务合作框架，技术实现应围绕"最小侵入、最大灵活"原则，确保双方低成本、高效率完成对接。
