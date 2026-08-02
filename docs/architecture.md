# OPC 数字平台（OpenClaw Partner Center）架构文档

> **版本：** MVP v0.1  
> **日期：** 2026-05-29  
> **董事长：** Celine  
> **CEO：** 团坐009 (agent-ceo)

---

## 一、平台定位

**「AI 数字员工即服务」**

让每一个创业者都能雇佣一支 AI 团队（销售、客服、技术、合规、助理），在中新数据港体系内接单、做交付、管客户、拿收益。

---

## 二、系统架构

```
┌─────────────────────────────────────────────────────────┐
│                    创业者门户 (Next.js)                   │
│  ┌──────────┬──────────┬──────────┬──────────┐          │
│  │ 任务大厅 │ 工作台   │数字员工  │ 收益中心 │          │
│  │          │          │ 面板    │          │          │
│  └──────────┴──────────┴──────────┴──────────┘          │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS / API
┌──────────────────────▼──────────────────────────────────┐
│                  API Gateway (Express)                  │
│  ┌─────────────┬─────────────┬──────────────┐          │
│  │ /api/auth   │ /api/tasks  │ /api/agents  │          │
│  │ /api/users  │ /api/jobs   │ /api/payouts │          │
│  └─────────────┴─────────────┴──────────────┘          │
└──────────────────────┬──────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
   ┌──────────┐  ┌──────────┐  ┌──────────┐
   │PostgreSQL│  │  Redis   │  │ OpenClaw │
   │  (主库)   │  │(缓存/会话)│  │(AI Agent)│
   └──────────┘  └──────────┘  └──────────┘
```

---

## 三、核心模块

### 3.1 创业者端（前台）

| 模块 | 路径 | 功能 |
|------|------|------|
| 注册/认证 | `/register` | 手机号注册、实名认证、技能标签 |
| 任务大厅 | `/tasks` | 浏览、筛选、接单 |
| 我的工作台 | `/workspace` | 进行中的任务、交付物提交 |
| 数字员工面板 | `/agents` | 一键召唤各 AI Agent |
| 学习中心 | `/learn` | 中新业务知识库、合规培训 |
| 收益中心 | `/earnings` | 佣金统计、结算、提现 |

### 3.2 管理端（后台）

| 模块 | 路径 | 功能 |
|------|------|------|
| 任务管理 | `/admin/tasks` | 发布、审核、分配、追踪 |
| 创业者管理 | `/admin/partners` | 审核、等级、信用分 |
| 数字员工运营 | `/admin/agents` | Agent 配置、知识库、模板 |
| 计费结算 | `/admin/billing` | 佣金规则、结算审批 |
| 数据看板 | `/admin/dashboard` | GMV、活跃度、完成率 |

### 3.3 数字员工集群

| Agent | 代号 | 职责 | 触发场景 |
|-------|------|------|----------|
| CEO | `agent-ceo` | 全局调度、向董事长汇报 | 跨部门协调 |
| 销售总监 | `agent-sales` | 客户开发、报价、CRM | 创业者接「拓展类」任务 |
| 客服主管 | `agent-support` | 答疑、工单、回访 | 创业者服务的客户有问题 |
| 技术方案官 | `agent-solution` | 方案设计、POC、文档 | 创业者接「技术实施」任务 |
| 合规风控官 | `agent-compliance` | 资质审核、法规跟踪、合同审查 | 涉及合规、合同场景 |
| 行政助理 | `agent-assistant` | 日程、提醒、统计、通知 | 日常运营辅助 |

---

## 四、数据模型

### 4.1 核心实体

```
User (创业者)
  ├── id, phone, real_name, status, level, credit_score
  ├── skills[], certifications[]
  ├── created_at, last_login
  └── earnings_total, earnings_pending

Task (任务)
  ├── id, title, description, type, status
  ├── reward_amount, currency, deadline
  ├── required_skills[], region, priority
  ├── publisher_id, assignee_id
  └── created_at, assigned_at, completed_at

JobExecution (任务执行)
  ├── id, task_id, partner_id, status
  ├── deliverables[], agent_invocations[]
  ├── started_at, submitted_at, approved_at
  └── payout_status, payout_amount

AgentInvocation (Agent 调用记录)
  ├── id, execution_id, agent_type, prompt
  ├── response, tokens_used, latency_ms
  └── created_at

Payout (结算)
  ├── id, partner_id, period_start, period_end
  ├── total_amount, fee_amount, net_amount
  ├── status, method, transaction_ref
  └── created_at, processed_at
```

---

## 五、API 设计概览

### 认证
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `POST /api/auth/verify` - 实名认证

### 任务
- `GET /api/tasks` - 任务列表（筛选、分页）
- `GET /api/tasks/:id` - 任务详情
- `POST /api/tasks/:id/claim` - 接单
- `POST /api/tasks/:id/submit` - 提交交付物
- `GET /api/tasks/my` - 我的任务

### 数字员工
- `POST /api/agents/invoke` - 召唤 Agent（type, context, task_id）
- `GET /api/agents/sessions/:id` - 查询会话历史
- `GET /api/agents/templates` - 获取预设模板

### 收益
- `GET /api/earnings/summary` - 收益总览
- `GET /api/earnings/history` - 结算历史
- `POST /api/earnings/withdraw` - 提现申请

---

## 六、MVP 里程碑

### Phase 1（Week 1-2）：骨架
- [x] 目录结构与文档
- [ ] 后端 API 框架 + 数据库
- [ ] 前端基础页面 + 路由
- [ ] Docker 开发环境

### Phase 2（Week 3）：核心闭环
- [ ] 注册/登录
- [ ] 任务发布/接单/提交
- [ ] 数字员工面板（可调用 OpenClaw Agent）
- [ ] 基础收益统计

### Phase 3（Week 4）：AI 深度集成
- [ ] 数字员工自主协作流程
- [ ] 知识库 RAG
- [ ] 任务自动分配算法
- [ ] 合规自动审查

---

## 七、安全与合规

- 创业者实名认证（对接官方数据源）
- 敏感操作二次确认
- API 限流防刷
- 中新两地数据法规遵循
- 所有 AI 交互留痕审计

---

**CEO 签批：** 团坐009  
**状态：** 已批准，进入开发阶段
