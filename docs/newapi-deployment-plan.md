# Token用量中心 - NewAPI 部署与集成方案

> 编制：团坐009 (CEO)  
> 时间：2026-06-29  
> 状态：实施中

---

## 一、架构设计

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        用户访问层                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 首页     │  │ 工作台   │  │ Token用量 │  │ 模型调用 │   │
│  │          │  │          │  │ 中心     │  │ 接口     │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │             │             │             │          │
│       └─────────────┴──────┬──────┴─────────────┘          │
│                            │                                │
│                     OPC 统一网关                             │
│              (api.opc-platform.com)                         │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────┐
│                     内部服务层                             │
│                                                            │
│  ┌──────────────────┐    ┌──────────────────────────┐     │
│  │  OPC 原有后端      │    │   NewAPI 网关             │     │
│  │  (用户/钱包/订单)  │    │   (token.opc-platform.com)│     │
│  │                  │    │                          │     │
│  │  - 用户认证       │    │  - 用户管理               │     │
│  │  - 钱包充值       │◄──►│  - Token 计费             │     │
│  │  - 套餐购买       │    │  - 模型路由               │     │
│  │  - 订单管理       │    │  - 用量统计               │     │
│  └──────────────────┘    └────────────┬─────────────────┘     │
│                                       │                      │
│                            ┌──────────┴──────────┐          │
│                            │    上游渠道          │          │
│                            │  ┌──────┐ ┌──────┐ │          │
│                            │  │LingAPI│ │其他  │ │          │
│                            │  │2.4折 │ │渠道  │ │          │
│                            │  └──────┘ └──────┘ │          │
│                            └─────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 NewAPI 功能定位

| 功能模块 | 说明 | 对标 LingAPI |
|---------|------|-------------|
| **用户管理** | 创建子账户、分配额度 | ✅ 相同 |
| **Token 计费** | 按模型、按 token 实时计费 | ✅ 相同 |
| **模型路由** | 智能分发到不同上游 | ✅ 相同 |
| **用量统计** | 仪表盘、图表、导出 | ✅ 相同 |
| **充值管理** | 与 OPC 钱包打通 | ⚠️ 需定制 |
| **品牌定制** | OPC 品牌皮肤 | ⚠️ 需定制 |

---

## 二、部署方案

### 2.1 Docker Compose 配置

```yaml
# docker-compose.yml (新增部分)
version: '3.8'

services:
  # ... 现有服务 ...

  # NewAPI - Token 用量中心
  newapi:
    image: calciumion/new-api:latest
    container_name: opc-newapi
    restart: always
    ports:
      - "3004:3000"
    volumes:
      - newapi_data:/data
      - ./newapi/config:/config
    environment:
      - TZ=Asia/Shanghai
      - SQLITE_PATH=/data/one-api.db
      - SESSION_SECRET=opc-platform-2026
      - SYNC_FREQUENCY=60
    depends_on:
      - postgres
    networks:
      - opc-network

  # NewAPI 数据库（本地开发使用 SQLite；生产环境可改为 PostgreSQL/MySQL）
  # 当前配置：SQLite 文件持久化在 newapi_data 卷中

volumes:
  # ... 现有 volumes ...
  newapi_data:

networks:
  opc-network:
    driver: bridge
```

### 2.2 部署步骤

```bash
# 1. 拉取镜像
docker pull calciumion/new-api:latest

# 2. 创建配置目录
mkdir -p ~/.openclaw/workspace/opc-platform/newapi/config

# 3. 启动容器
cd ~/.openclaw/workspace/opc-platform
docker-compose up -d newapi

# 4. 初始化管理员账户
# 访问 http://localhost:3004
# 默认管理员：root / 123456
# 首次登录后立即修改密码

# 5. 配置上游渠道（LingAPI）
# 在后台添加渠道：
# - 类型：OpenAI
# - 密钥：LingAPI 给你的总 API Key
# - 代理地址：https://lingapi.com/v1
# - 模型：gpt-4, gpt-4o, claude-3.5 等

# 6. 配置自定义品牌
# - 系统名称：中新数据港 Token 用量中心
# - Logo：上传 OPC 品牌 Logo
# - 首页内容：自定义
```

### 2.3 与 OPC 平台集成

#### A. 前端入口集成

```typescript
// frontend/src/app/token-center/page.tsx
// Token用量中心入口页面

import Link from 'next/link';

export default function TokenCenterPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">
          Token 用量中心
        </h1>
        
        {/* 用量概览卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard title="今日用量" value="1.2M" unit="tokens" />
          <StatCard title="本月用量" value="28.5M" unit="tokens" />
          <StatCard title="余额" value="¥3,250" />
          <StatCard title="预计可用" value="18" unit="天" />
        </div>
        
        {/* 快速入口 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="http://localhost:3004" target="_blank" className="card hover:shadow-lg">
            <h3 className="text-xl font-bold mb-2">📊 详细用量统计</h3>
            <p className="text-slate-600">查看模型调用明细、计费记录、用量趋势</p>
          </Link>
          
          <Link href="/wallet/recharge" className="card hover:shadow-lg">
            <h3 className="text-xl font-bold mb-2">💰 充值续费</h3>
            <p className="text-slate-600">充值 Token 额度，确保服务不中断</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
```

#### B. 统一认证集成

```javascript
// NewAPI 支持自定义认证
// 方案：OPC 登录后，生成临时 Token 跳转到 NewAPI

// 1. OPC 后端生成 NewAPI 子账户 Token
// 2. 用户点击 Token用量中心时，自动携带 Token 免密登录
// 3. NewAPI 通过回调验证 Token 有效性

// 伪代码：
router.get('/token-center/sso', async (req, res) => {
  const user = req.user; // OPC 登录用户
  
  // 在 NewAPI 创建/获取子账户
  const newapiToken = await newApiService.getOrCreateUserToken({
    username: user.id,
    displayName: user.companyName,
    quota: user.tokenBalance, // 同步钱包余额
  });
  
  // 重定向到 NewAPI，携带 SSO Token
  res.redirect(`http://token.opc-platform.com/login?sso=${newapiToken}`);
});
```

#### C. 钱包余额同步

```javascript
// 方案：OPC 钱包 ↔ NewAPI 额度 双向同步

// 充值时：
// 1. 用户在 OPC 钱包充值 ¥1000
// 2. OPC 调用 NewAPI API：给用户增加对应额度
// 3. 兑换比例：¥1 = X tokens（根据模型加权平均）

// 消耗时：
// 1. NewAPI 实时扣除 token 额度
// 2. 定时同步到 OPC 钱包（每小时/每天）
// 3. OPC 展示：剩余额度、预计可用天数

const TOKEN_EXCHANGE_RATE = {
  // ¥1 能买多少 tokens（按 LingAPI 2.4折成本）
  gpt4o: 240,      // ¥1 = 240 tokens
  claude35: 300,   // ¥1 = 300 tokens
  gemini: 350,     // ¥1 = 350 tokens
  // 统一按加权平均展示给用户
  default: 280     // ¥1 = 280 tokens（平台统一价）
};
```

---

## 三、LingAPI 计费模式复刻

### 3.1 NewAPI 配置：对接 LingAPI

```yaml
# NewAPI 后台配置
渠道名称: LingAPI-主渠道
渠道类型: OpenAI
密钥: sk-lingapi-your-master-key
代理地址: https://lingapi.com/v1
模型列表:
  - gpt-4o
  - gpt-4o-mini
  - gpt-4
  - claude-3.5-sonnet
  - claude-3-opus
  - gemini-1.5-pro
优先级: 100
权重: 100
状态: 启用
```

### 3.2 计费倍率配置（复刻 LingAPI 模式）

```yaml
# NewAPI 倍率设置（对接 LingAPI 2.4折后价格）
模型倍率:
  gpt-4o:
    input_ratio: 0.41    # ¥0.0041/1K (2.4折后)
    output_ratio: 0.98   # ¥0.0098/1K (2.4折后)
    
  claude-3.5-sonnet:
    input_ratio: 0.25    # ¥0.0025/1K
    output_ratio: 0.82   # ¥0.0082/1K
    
  gemini-1.5-pro:
    input_ratio: 0.16    # ¥0.0016/1K
    output_ratio: 0.98   # ¥0.0098/1K

# 分组倍率（不同用户等级）
用户分组:
  default: 1.0      # 普通用户
  premium: 0.8     # 付费会员（8折）
  enterprise: 0.5  # 企业用户（5折）
```

### 3.3 仪表盘复刻

NewAPI 自带仪表盘，包含：
- ✅ 今日/本月用量统计
- ✅ 模型调用分布饼图
- ✅ Token 消耗趋势折线图
- ✅ 用户排名/消费排行
- ✅ 实时在线用户数
- ✅ 渠道健康状态

**定制**：替换为 OPC 品牌，颜色主题改为蓝色系。

---

## 四、OpenClaw部署平台 集成方案

### 4.1 你的问题：OpenClaw部署平台能否放入 LingAPI 模式？

**答案：完全可以，这是最佳组合。**

```
OpenClaw部署平台 服务内容升级：

原定义：在平台云环境中快速部署自定义 AI Agent
升级后：一键部署 AI Agent + 自动接入多模型网关

用户操作：
1. 在 OpenClaw部署平台创建 Agent
2. 选择模型：GPT-4o / Claude / Gemini / 国内模型
3. 系统自动分配 API Key（走 NewAPI 网关）
4. Agent 上线运行，按 token 计费
```

### 4.2 技术集成

```yaml
# OpenClaw部署平台配置
服务模板:
  name: AI Agent + 模型网关
  description: 部署自定义 Agent，自动接入全球模型
  
  resources:
    cpu: 1核
    memory: 2GB
    storage: 10GB
    
  env:
    # 自动注入 NewAPI 配置
    OPENAI_API_KEY: "{{newapi_user_key}}"
    OPENAI_BASE_URL: "https://token.opc-platform.com/v1"
    
    # 可选模型
    MODEL_OPTIONS:
      - gpt-4o
      - claude-3.5-sonnet
      - gemini-1.5-pro
      - deepseek-v3
      
  billing:
    # 计算资源：按部署时长计费（固定）
    compute: ¥0.05/小时
    
    # 模型调用：按 token 计费（走 NewAPI）
    tokens: 按实际用量，NewAPI 自动扣费
```

### 4.3 用户视角

```
用户 A（创业者）：
1. 入驻 OPC 平台
2. 进入 OpenClaw部署平台
3. 填写 Agent 名称和提示词
4. 选择 "GPT-4o" 作为底层模型
5. 一键部署
6. 获得访问地址：agent-a.opc-platform.com
7. 开始对外提供服务
8. 月底收到账单：计算资源 ¥36 + 模型调用 ¥128

全程无需：
❌ 自己申请 OpenAI 账户
❌ 自己解决跨境网络
❌ 自己处理外币支付
```

---

## 五、实施计划

### Phase 1：部署 NewAPI（本周内）

| 天数 | 任务 | 产出 |
|------|------|------|
| Day 1 | 部署 NewAPI Docker | http://localhost:3004 可访问 |
| Day 1 | 配置 LingAPI 上游渠道 | 可调用 GPT/Claude/Gemini |
| Day 2 | 配置倍率和分组 | 复刻 LingAPI 计费模式 |
| Day 2 | 品牌定制（Logo/名称） | OPC 品牌皮肤 |
| Day 3 | 测试子账户创建和扣费 | 端到端流程跑通 |

### Phase 2：集成到 OPC 平台（下周）

| 天数 | 任务 | 产出 |
|------|------|------|
| Day 4-5 | 前端 Token用量中心页面 | /token-center 入口 |
| Day 5-6 | SSO 免密登录集成 | 点击自动跳转 NewAPI |
| Day 6-7 | 钱包余额同步 | 充值后额度实时到账 |

### Phase 3：OpenClaw部署平台升级（第 3 周）

| 天数 | 任务 | 产出 |
|------|------|------|
| Day 8-10 | 部署模板集成 NewAPI | Agent 自动分配模型 Key |
| Day 10-12 | 统一计费对接 | 计算资源 + Token 合并账单 |
| Day 12-14 | 测试上线 | 完整流程验证 |

---

## 六、立即执行

我现在开始部署 NewAPI：

```bash
# Step 1: 创建目录和配置
mkdir -p ~/.openclaw/workspace/opc-platform/newapi

# Step 2: 拉取并启动 NewAPI
docker run -d \
  --name opc-newapi \
  -p 3004:3000 \
  -v newapi_data:/data \
  -e TZ=Asia/Shanghai \
  -e SQL_DSN=/data/one-api.db \
  --restart always \
  calciumion/new-api:latest

# Step 3: 等待启动，配置管理员
echo "部署完成，访问 http://localhost:3004"
echo "默认管理员：root / 123456"
```

## 七、LingAPI 上游渠道配置（实测配置）

> 来源：Ling API 官方文档 `https://1d0omvxd82.apifox.cn/84499787f0`  
> 本章节用于内部工程师参考，指导如何在 NewAPI 中正确配置 LingAPI 上游渠道。

### 7.1 基础信息

| 配置项 | 值 | 说明 |
|--------|-----|------|
| Base URL | `http://118.196.5.14:5208/v1` | LingAPI OpenAI 兼容接口地址 |
| 鉴权方式 | `Authorization: Bearer {API_TOKEN}` | 使用 LingAPI 控制台生成的 API 令牌 |
| 协议 | OpenAI 兼容协议 | 已测试支持 `/v1/models`、`/v1/chat/completions` |
| 联调账号 | `Celine_dev_use` / `Lucky_66` | 本地开发测试账号 |
| 测试额度 | 200（单位） | 测试环境额度上限 |

### 7.2 常用接口

```text
GET  /v1/models                  # 查看可用模型
POST /v1/chat/completions        # 对话补全（含流式）
POST /v1/responses               # Responses API（部分模型支持）
POST /v1/embeddings              # 文本向量
POST /v1/images/generations      # 图片生成（部分渠道开放）
POST /v1/audio/transcriptions    # 语音转写（部分渠道开放）
POST /v1/audio/speech            # 语音合成（部分渠道开放）
```

**注意**：实际可用接口和模型能力以 LingAPI 控制台、`/v1/models` 返回结果及模型本身能力为准。NewAPI 上游渠道中建议只勾选已确认可用的模型，避免用户调用失败。

### 7.3 NewAPI 渠道配置

```yaml
渠道名称: LingAPI-主渠道
渠道类型: OpenAI
密钥: sk-lingapi-your-master-key
代理地址: http://118.196.5.14:5208/v1
模型列表（已实测）:
  - gpt-5.4
  - gpt-5.4-mini
  - gpt-5.5
  - gpt-5.6-luna
  - gpt-5.6-sol
  - gpt-5.6-terra
  - claude-sonnet-5
  - claude-sonnet-4-6
  - claude-opus-4-6
  - claude-fable-5
  - gemini-3.5-flash
  - gemini-3.1-pro-preview
  - deepseek-v4-flash
  - deepseek-v4-pro
  - qwen-plus
  - qwen3.7-max
  - glm-4.7
  - glm-5
  - glm-5.1
  - MiniMax-M2.7
优先级: 100
权重: 100
状态: 启用
```

### 7.4 功能支持实测结果

| 特性 | 状态 | 备注 |
|------|------|------|
| 流式 SSE | ✅ 支持 | 请求体中加入 `"stream": true` |
| Function Calling / Tools | ✅ 部分支持 | gpt-5.4、claude-sonnet-5、kimi-k2.5 支持；deepseek-v4-flash 未支持 |
| JSON Mode / Structured Output | ✅ 部分支持 | gpt-5.4、deepseek-v4-flash、kimi-k2.5 支持；claude-sonnet-5 未支持 |
| 图片生成（DALL-E） | ❌ 暂无 | 当前渠道未开放 |
| 音频转写（Whisper） | ❌ 暂无 | 当前渠道未开放 |

### 7.5 计费精度注意事项

- **gpt-5.4 非流式**：返回 `usage`，可用；流式 `usage` 为 `null`
- **gpt-5.4 prompt_tokens 偏高**：普通请求可能返回 4397+ prompt tokens，推测网关注入大量系统提示，需确认计费影响
- **deepseek-v4-flash**：非流式与流式均返回 `usage`，精度一致
- **品牌隔离**：当前网关会暴露 `X-New-Api-Version` / `X-Oneapi-Request-Id` 响应头和 `new_api_error` 错误类型，需要自定义响应头/错误重写以隐藏上游来源

### 7.6 调用示例（内部联调）

```bash
# 查看可用模型
curl http://118.196.5.14:5208/v1/models \
  -H "Authorization: Bearer {LING_API_TOKEN}"

# 非流式对话
curl http://118.196.5.14:5208/v1/chat/completions \
  -H "Authorization: Bearer {LING_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5.4",
    "messages": [{"role": "user", "content": "你好"}]
  }'

# 流式对话
curl http://118.196.5.14:5208/v1/chat/completions \
  -H "Authorization: Bearer {LING_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5.4",
    "stream": true,
    "messages": [{"role": "user", "content": "你好"}]
  }'
```

### 7.7 不建议对外展示的内容

以下内容**不得**直接复制到用户可见页面：

- LingAPI 具体 IP 地址和端口号（`118.196.5.14:5208`）
- LingAPI 营销话术：「无需科学上网」「连接速度是官方的1200倍」「100%保值换绑」等
- LingAPI 的 Logo、品牌名称、版权声明
- 只适用于 LingAPI 控制台的操作说明（如「令牌管理」创建流程）

对外文档应统一使用 CSDP / OPC 品牌口径：平台通过 NewAPI 网关统一接入全球模型，用户只需调用 OPC API 即可。

---

## 八、用户可见文档口径

对最终用户的说明应保持统一：

- 用户无需自行注册海外模型账号
- 用户无需外币信用卡
- 用户只需充值人民币到 OPC 钱包，即可调用模型
- 模型调用走 CSDP-WAN 合规专线，平台统一处理跨境访问
- 用户调用的是 `https://api.opc-platform.com/api/models/chat`（或本地 `http://localhost:3003/api/models/chat`），不是 LingAPI 直接地址

**内部文档**：可保留 LingAPI 上游配置细节。  
**学习中心/帮助中心**：只使用 OPC 品牌接口示例，不暴露上游供应商。
