# OPC 数字平台 — 安全审计报告

**项目代号：** opc-platform  
**审计日期：** 2026-06-01  
**审计范围：** Backend (`/backend/src/`) + Docker Compose + 环境变量配置  
**审计版本：** MVP 开园版 (v0.1.0)  
**目标：** 识别在正式上线（中新数据港体系接入）前必须修复的安全与合规矩阵。

---

## 1. Executive Summary

| 安全领域 | 风险等级 | 说明 |
|----------|----------|------|
| 认证与授权 (AuthN/AuthZ) | **🔴 HIGH** | JWT 密钥硬编码且强度不足、令牌生命周期过长、无刷新机制、无账户锁定策略 |
| 数据保护 (Data Protection) | **🔴 HIGH** | 身份证号明文存储、PII 嵌入 JWT Payload、无静态加密 |
| API 安全 (API Security) | **🟡 MEDIUM** | 缺乏统一输入校验、部分路由无独立限流、无 XSS 过滤中间件 |
| 基础设施安全 (Infra Security) | **🔴 HIGH** | `.env` 已提交密钥、Docker Compose 暴露 DB/Redis 宿主机端口、无 Redis AUTH |
| 合规与法遵 (Compliance) | **🔴 HIGH** | 明文存储身份证违反《个人信息保护法》；跨境模型通道存在数据出境合规风险 |
| 业务逻辑安全 (Business Logic) | **🟡 MEDIUM** | 钱包扣费无事务隔离、提现接口为纯 Stub 无二次验证 |

**总体评估：** 当前代码处于 **MVP 开发阶段**，核心安全骨架（Helmet、CORS、参数化查询、bcrypt）已具备，但存在 **3 项 CRITICAL 级问题** 必须在 MVP 上线前修复，否则不满足政府/国资背景平台（中新数据港）的基本安全底线。

---

## 2. Authentication & Authorization Review

### 2.1 JWT 实现

| 检查项 | 状态 | 详情 |
|--------|------|------|
| 密钥强度 | ❌ 不合格 | `JWT_SECRET=opc-jwt-secret-key-change-in-production-2026` 为可预测字符串，长度约 43 字符但熵极低 |
| 密钥存储 | ❌ 不合格 | 硬编码于 `.env` 并纳入版本控制，生产环境将直接泄露 |
| 过期时间 | ⚠️ 偏长 | `expiresIn: '7d'`（默认）远超 access token 推荐值（15m–2h） |
| 刷新机制 | ❌ 缺失 | 仅有单 token，无 refresh token 轮换机制 |
| 令牌内容 | ⚠️ 敏感 | Payload 包含 `phone`、`real_name` 等 PII，增加泄漏面 |
| 算法 | ✅ 合规 | 使用默认 HS256，未暴露 `alg: none` 漏洞 |
| 吊销 | ❌ 缺失 | 无黑名单 / Redis TTL 吊销机制，令牌一旦签发 7 天内无法作废 |

### 2.2 会话管理

- **无设备绑定 / IP 绑定：** `login` 仅更新 `last_login`，无设备指纹或异常登录检测。
- **无并发会话限制：** 同一账号可在多处同时持有有效 token。

### 2.3 权限控制

- **角色模型：** 当前仅有“普通用户”和“企业认证用户”两级（`requireCompanyAuth`），无管理员/运营/审核员角色区分。
- **水平越权防护：**
  - `users.js` `GET /me` 与 `PATCH /me` 正确绑定 `req.user.id` — ✅
  - `agents.js` `GET /sessions/:sessionId` 明确标注 TODO 验证归属 — ⚠️
  - `tasks.js` `POST /:id/claim` 使用 `SELECT ... FOR UPDATE` 防止并发超卖 — ✅

### 2.4 认证端点防护

| 端点 | 限流 | 输入校验 | 账户锁定 | 防重放 |
|------|------|----------|----------|--------|
| `POST /api/auth/register` | ❌ 无 | ❌ 仅判空 | ❌ 无 | ❌ 无 |
| `POST /api/auth/login` | ❌ 无 | ❌ 仅判空 | ❌ 无 | ❌ 无 |
| `POST /api/auth/verify-id` | ❌ 无 | ❌ 仅判空 | — | ❌ 无 |

**风险：** 注册与登录接口暴露在全局 100req/15min 限流之下，攻击者可轻易耗尽该窗口，导致合法用户被误拦截（DoS）。更关键的是，暴力破解和批量注册不受独立频次限制。

---

## 3. Data Protection Review

### 3.1 密码存储

- **算法：** `bcrypt.hash(password, 12)` — ✅ 符合 OWASP 推荐（10–14 rounds）。
- **盐值：** 每次独立随机 — ✅。

### 3.2 个人身份信息 (PII)

| 字段 | 存储方式 | 评估 |
|------|----------|------|
| `phone` | 明文，唯一索引 | 必要业务字段，可接受，但需加密传输 |
| `real_name` | 明文 | 属于敏感个人信息，建议静态加密 |
| `id_card` | **明文 `VARCHAR(18)`** | 🔴 **严重违规** |
| `company_registration_no` | 明文 | 企业敏感信息，建议加密 |
| `business_license_url` | URL 明文 | 需确保对象存储不可遍历 |

**法规红线：** 《个人信息保护法》第二十八条将“身份证号”列为敏感个人信息，必须采取**严格保护措施**，且需取得个人**单独同意**。当前明文存储直接触碰监管红线。

### 3.3 JWT 中的 PII

```js
jwt.sign(
  { id: user.id, phone: user.phone, real_name: user.real_name },
  ...
)
```

- `real_name` 和 `phone` 非授权必需字段，应移出 JWT，改由服务端根据 `id` 查询。
- JWT 仅在 TLS 下传输可防窃听，但若客户端 XSS 导致 localStorage 泄漏，PII 一并外泄。

### 3.4 数据库加密

- **传输加密 (TLS)：** PostgreSQL/Redis 连接字符串未指定 `sslmode=require`。
- **静态加密 (TDE)：** 无表级或列级加密配置。
- **备份加密：** 未涉及，需在运维层面补齐。

---

## 4. API Security Review

### 4.1 SQL Injection

| 文件 | 模式 | 评估 |
|------|------|------|
| 全部路由 | 统一使用 `$1, $2...` 参数化查询 | ✅ 基本无注入风险 |
| `billing.js` `dateFilter` | 硬编码字符串拼接（`DATE_TRUNC(...)`） | ⚠️ 当前不可注入，但模式危险，建议改为参数化 |

### 4.2 XSS / 注入防护

- **无全局 XSS 过滤中间件：** `realName`、`companyName`、`message` 等字段直接入库并可能返回前端，若前端未做转义，存在 Stored XSS 可能。
- **Content-Type：** `express.json()` 限定 JSON，但无额外 `content-type` 校验。
- **Helmet：** 已启用，提供基础 CSP、X-Frame-Options 等 — ✅。

### 4.3 Rate Limiting

```js
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
}));
```

- **问题 1：** 100 req/15min 对 API 消费偏低，对暴力破解又偏高。
- **问题 2：** 认证端点（注册/登录/实名认证）未配置独立、更严格的限流策略。
- **问题 3：** 按 IP 限流在 NAT/代理场景下易误伤，需结合 `trust proxy` 与 `X-Forwarded-For`。

### 4.4 Input Validation

- **现状：** 所有路由均为手动判空（`if (!phone || !password)`），无 schema 校验。
- **缺失校验示例：**
  - `phone` 未校验 11 位大陆手机号格式
  - `password` 无长度/复杂度要求
  - `realName` 未过滤 HTML/Script 标签
  - `skills` 为数组但未校验元素类型/长度
  - `avatar` 未校验 URL 协议（可能引入 `javascript:` 伪协议）

### 4.5 业务逻辑漏洞

| 文件 | 问题 | 严重度 |
|------|------|--------|
| `billing.js` `POST /token/record` | 余额查询与扣费分为两条 SQL，**无事务隔离**（BEGIN/COMMIT），并发请求可导致余额超扣（race condition） | **HIGH** |
| `tasks.js` `POST /:id/claim` | 正确使用 `BEGIN ... FOR UPDATE ... COMMIT` — ✅ 示例 | — |
| `earnings.js` `POST /withdraw` | 纯 Stub 返回，无金额校验、无二次验证、无防重放 | **HIGH** |

### 4.6 文件上传（预留）

- `businessLicense` 字段当前仅存储 URL 字符串，未限制协议/域名，攻击者可填入任意外链。
- 若未来开放本地上传，需配置：格式白名单、大小限制、病毒扫描、存储桶不可遍历。

---

## 5. Infrastructure Security Review

### 5.1 Docker Compose

| 检查项 | 状态 | 说明 |
|--------|------|------|
| Postgres 端口映射 | ❌ `5432:5432` | 数据库暴露至宿主机，任何容器逃逸或宿主机入侵直接威胁数据 |
| Redis 端口映射 | ❌ `6379:6379` | 同上，且 Redis 无 AUTH 密码 |
| 环境变量注入 | ❌ 明文 | `JWT_SECRET`、`POSTGRES_PASSWORD` 均以明文硬编码在 `docker-compose.yml` |
| 容器特权 | ✅ 无 | 未使用 `privileged: true` |
| 只读文件系统 | ❌ 无 | 未配置 `read_only: true` 或临时文件系统 |
| 重启策略 | ✅ `unless-stopped` | 基础可用性保障 |
| 网络隔离 | ⚠️ 单一 bridge | 所有服务共处 `opc-network`，无细分 DMZ/DB-Only 网络 |

### 5.2 环境变量与密钥管理

- `.env` 文件包含真实 JWT 密钥和数据库密码，**极有可能被提交至 Git**（即便 `.gitignore` 存在，历史记录难以清除）。
- `.env.example` 虽有安全提示，但 `.env` 未做分离管理。
- 无 Vault / Docker Secrets / 1Password Service Account 集成计划。

### 5.3 CORS 配置

```js
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

- 生产环境若 `FRONTEND_URL` 未配置，回退到 `localhost` 不会导致危险（攻击者无法在公网伪造 localhost）。
- 但若配置为多域名通配或反射 Origin，则存在 CSRF / 凭证泄漏风险。当前配置为白名单模式 — ✅。

### 5.4 日志与监控

- Morgan + Winston（推测）日志记录所有 HTTP 请求，但未配置**字段脱敏**规则，可能记录 `Authorization` 头或请求体中的密码。
- `errorHandler` 在生产环境隐藏 stack trace — ✅ 合规。
- 无结构化审计日志（audit trail）记录敏感操作（实名认证、合同签署、提现）。

---

## 6. Compliance Notes (中新数据港 & PRC Legal Context)

### 6.1 《个人信息保护法》(PIPL)

| 条款 | 要求 | 当前状态 |
|------|------|----------|
| 第 13 条 | 处理敏感个人信息需取得个人**单独同意** | ❌ 无同意记录表 |
| 第 28–29 条 | 敏感个人信息应采取**严格保护措施**（加密、去标识化） | ❌ 身份证号明文存储 |
| 第 51 条 | 制定内部管理制度和操作规程 | ⚠️ 无数据分类分级策略文档 |
| 第 52 条 | 个人信息处理者定期合规审计 | ⚠️ 需建立周期性审计机制 |

### 6.2 《数据安全法》

- 平台涉及“实名认证 + 企业信息 + 合同签署”数据，属于**重要数据**范畴。
- 需建立数据分类分级制度，当前未定义。

### 6.3 《网络安全法》

- **等级保护 2.0：** 作为“政府-adjacent 数据平台”，建议至少按 **等保三级** 设计。当前缺少：
  - 身份鉴别（双因素认证缺失）
  - 安全审计（无独立审计日志系统）
  - 数据完整性校验（合同内容无签名/哈希）

### 6.4 跨境数据合规（核心红线）

- **“合规海外模型通道”** (`model_tunnel`) 意味着用户请求可能通过专线出境至海外模型供应商（OpenAI / Anthropic 等）。
- 根据《数据出境安全评估办法》：
  - 若传输内容含个人信息或重要数据，需进行**安全评估**或**标准合同备案**。
  - **建议：** 建立**境内预处理网关**，对出境请求进行**脱敏 + 审计 + 内容过滤**，避免原始 PII 直接出境。

### 6.5 中新数据港国资背景要求

- 建议接入**国密算法（SM2/SM3/SM4）**进行敏感字段加密与 TLS 握手。
- 建议采用**信创环境**适配（鲲鹏/海光 + 欧拉/麒麟 + 达梦/人大金仓），当前使用 PostgreSQL 需评估替代方案。

---

## 7. Specific Findings & Recommendations

### 🔴 CRITICAL

#### F1 — 硬编码 JWT 密钥且强度不足
- **位置：** `backend/.env` (`JWT_SECRET`)
- **风险：** 密钥可预测，一旦被泄露，攻击者可伪造任意用户 token（包括管理员）。
- **建议：**
  1. 立即生成高强度密钥：`openssl rand -base64 64`
  2. 密钥仅通过**运行时环境变量**注入，绝不入 Git
  3. 引入 Docker Secrets 或外部 Vault（HashiCorp Vault / AWS Secrets Manager）

#### F2 — 身份证号明文存储
- **位置：** `backend/src/db/init.sql` (`users.id_card VARCHAR(18)`)，`auth.js` `verify-id`
- **风险：** 违反 PIPL，数据库泄露将导致大规模敏感个人信息外泄。
- **建议：**
  1. 使用 **AES-256-GCM** 加密存储，密钥由 HSM / KMS 管理
  2. 若仅需校验性别/年龄，可存储哈希或脱敏片段（如 `110101********1234`）
  3. 对接权威实名 API（阿里云/腾讯云）后，仅保留“已认证”布尔值，**不存原文**

#### F3 — 数据库与 Redis 宿主机端口暴露
- **位置：** `docker-compose.yml` (`5432:5432`, `6379:6379`)
- **风险：** 容器逃逸或宿主机其他服务被入侵后，可直接访问数据层。
- **建议：**
  1. 生产环境**移除** `ports` 映射，仅通过 `opc-network` 内部通信
  2. Redis 配置 `requirepass`
  3. PostgreSQL 配置独立强密码 + `pg_hba.conf` 限制来源 IP

### 🟠 HIGH

#### F4 — 钱包扣费无事务隔离
- **位置：** `billing.js` `POST /token/record`
- **风险：** 并发调用时余额检查与扣费非原子操作，可导致负余额。
- **建议：** 使用 `BEGIN` + `SELECT balance FROM wallets WHERE user_id = $1 FOR UPDATE` + `UPDATE ...` + `COMMIT`

#### F5 — 环境变量文件纳入版本控制
- **位置：** `backend/.env`
- **风险：** Git 历史永久记录密钥，即使后续删除仍可被提取。
- **建议：**
  1. 立即执行 `git rm --cached backend/.env && git commit`
  2. 轮换所有已泄露密钥（JWT、数据库、Redis）
  3. 强制所有开发者本地使用 `.env.local`（已在 `.gitignore`）

#### F6 — 跨境模型通道数据出境风险
- **位置：** 业务设计文档 / `user_services.model_tunnel_enabled`
- **风险：** 用户通过“海外模型通道”发送的 prompt 可能包含未脱敏的个人信息，直接违反数据出境安全评估办法。
- **建议：**
  1. 在出境网关层增加**内容过滤器 + PII 检测 + 脱敏替换**
  2. 建立出境数据审计日志（记录用户、时间、数据分类、出境目的地）
  3. 咨询法务完成安全评估或标准合同备案

#### F7 — 提现接口为 Stub 且无安全控制
- **位置：** `earnings.js` `POST /withdraw`
- **风险：** MVP 阶段若意外暴露，可被批量调用造成财务混乱。
- **建议：** 正式上线前补充：金额/频次/账户校验 + 短信/支付密码二次验证 + 人工审核流程

### 🟡 MEDIUM

#### F8 — JWT 过期时间过长 + 无 Refresh Token
- **建议：** Access token 缩短至 15min–2h；引入 refresh token（7–30 天），存储于 Redis 并支持吊销。

#### F9 — 全局限流策略不合理
- **建议：**
  - 通用 API：`100 req / 15min`（IP 维度）
  - 认证端点：`5 req / 15min`（账号维度）
  - 敏感操作（实名认证/提现）：`3 req / 1h`

#### F10 — 缺少统一输入校验中间件
- **建议：** 引入 `express-validator` 或 Zod，对所有路由实施 schema 校验：手机号正则、`realName` 长度与 XSS 过滤、`avatar` URL 协议白名单。

#### F11 — JWT Payload 包含 PII
- **建议：** Payload 仅保留 `user.id` 与 `role`，`phone`/`real_name` 由服务端查询。

#### F12 — 无独立审计日志
- **建议：** 建立 `audit_logs` 表，记录：实名认证、合同签署、服务开通、提现申请、密码修改。字段：时间、用户、IP、操作类型、结果、请求 ID。

#### F13 — 无数据库连接 TLS
- **建议：** `DATABASE_URL` 追加 `?sslmode=require`，PostgreSQL 配置 server 证书。

### 🟢 LOW

#### F14 — `req.ip` 记录未适配反向代理
- **建议：** 配置 `app.set('trust proxy', true)`，优先使用 `X-Forwarded-For` 末端 IP（需确认代理可信）。

#### F15 — `express.json({ limit: '10mb' })` 偏大
- **建议：** 当前业务无需大 JSON，降至 `100kb`，单独为需上传的接口放开。

#### F16 — 合同内容完整性校验缺失
- **建议：** 存储合同时计算 SHA-256 哈希，防止事后篡改抵赖。

#### F17 — 水平越权 TODO 未闭环
- **位置：** `agents.js` `GET /sessions/:sessionId`
- **建议：** 查询 `agent_sessions` 时强制附加 `WHERE user_id = $1`。

---

## 8. Remediation Plan

### Phase 1 — MVP 上线前必须完成（Blockers）

> 以下问题不解决，平台不满足接入中新数据港或面向真实用户的基本安全底线。

| # | 任务 | 负责人 | 工时估 | 关联发现 |
|---|------|--------|--------|----------|
| 1 | 轮换所有密钥，将 `.env` 移出版本控制，引入 `.env.example` + 文档 | DevOps | 0.5d | F1, F5 |
| 2 | JWT 密钥改为 `openssl rand -base64 64`，生产环境仅环境变量注入 | Backend | 0.5d | F1 |
| 3 | **身份证号加密存储**：AES-256-GCM 或对接实名 API 后不存原文 | Backend | 1d | F2 |
| 4 | 生产 Docker Compose 移除 DB/Redis 宿主机端口映射，Redis 加 AUTH | DevOps | 0.5d | F3 |
| 5 | `POST /token/record` 余额扣费加事务隔离（`BEGIN ... FOR UPDATE`） | Backend | 0.5d | F4 |
| 6 | 提现接口补充金额校验、频次限制、二次验证（Stub → 实现） | Backend | 1d | F7 |
| 7 | 跨境模型通道增加内容过滤 + PII 脱敏网关，法务评估出境合规 | Compliance + Backend | 3d | F6 |
| 8 | 引入 `express-validator`，对注册/登录/实名认证做严格 schema 校验 | Backend | 1d | F10 |

### Phase 2 — MVP 上线后 2 周内完成

| # | 任务 | 优先级 | 关联发现 |
|---|------|--------|----------|
| 9 | 拆分 Access Token（15min）+ Refresh Token（30天，Redis 存储可吊销） | P1 | F8 |
| 10 | 限流细化：认证端点独立限流 + 按账号维度限制 | P1 | F9 |
| 11 | 建立 `audit_logs` 表，所有敏感操作写审计日志 | P1 | F12 |
| 12 | 数据库连接强制 TLS (`sslmode=require`) | P1 | F13 |
| 13 | JWT Payload 清理 PII，仅保留 `id` + `role` | P2 | F11 |
| 14 | 增加全局 XSS 过滤输出中间件（或前端转义规范） | P2 | F10 |
| 15 | 合同内容存储 SHA-256 校验 | P2 | F16 |
| 16 | `req.ip` 适配反向代理，配置 `trust proxy` | P3 | F14 |
| 17 | JSON body limit 降至 100kb | P3 | F15 |
| 18 | 等保三级差距评估与整改计划 | P1 | 6.3 |

### Phase 3 — 持续运营（长期）

- 引入 SAST/DAST 工具（如 SonarQube、Semgrep）集成 CI/CD
- 建立 Bug Bounty 或周期性渗透测试机制
- 数据分类分级制度落地，完成 PIPL 合规审计
- 评估信创适配（国密、国产数据库、国产 OS）

---

## 附录：快速检查清单（上线前核对）

- [ ] `.env` 不在 Git 仓库中，所有密钥已轮换
- [ ] `docker-compose.prod.yml` 不暴露 5432/6379 到宿主机
- [ ] 身份证号存储字段已改为加密或已删除
- [ ] JWT 密钥 >= 64 字节随机 base64，过期 <= 2h
- [ ] `POST /token/record` 使用事务 + `FOR UPDATE`
- [ ] 注册/登录/实名认证有独立限流
- [ ] 所有用户输入有 schema 校验
- [ ] Redis 配置 `requirepass`
- [ ] 数据库连接启用 TLS
- [ ] 提现接口有二次验证 + 人工审核
- [ ] 跨境模型通道有 PII 脱敏 + 审计日志
- [ ] 生产环境 `NODE_ENV=production`

---

*报告生成：2026-06-01*  
*下次审计建议：MVP 上线后 30 日内*  
*审计人：Security Sub-agent (OpenClaw)*
