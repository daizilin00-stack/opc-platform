# OPC 平台整体产品服务架构与账户体系设计方案

> 版本：v4.0（整体架构版）
> 设计人：团坐009（CEO）
> 日期：2026-07-03
> 面向：董事长 Celine
> 核心变更：重新设计完整产品服务体系 + 团队账户体系（总号+分号+统一计费）

---

## 一、OPC 平台整体产品服务架构

### 1.1 平台定位

```
【OPC 中新数据港 = AI 数字员工即服务平台】

面向用户：跨境电商卖家、内容创作者、中小企业
核心价值：通过AI工具降低内容生产成本，通过合规专线保障业务稳定

┌─────────────────────────────────────────────────────────────────────┐
│                         OPC 平台产品架构                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  【入口层】                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ 网页端   │  │ 小程序   │  │ API接口  │  │ 移动端   │           │
│  │ Next.js  │  │ 微信     │  │ RESTful  │  │ PWA      │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
│                                                                     │
│  【核心产品层】（三大主力）                                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  1. AI Token 服务（模型调用）                                  │  │
│  │     · GPT-4o / Claude 3.5 / DeepSeek / Kimi / 通义            │  │
│  │     · 个人6.5折 / 团队5.5折 / 企业8折                         │  │
│  │     · 通过 lingapi.com 低价渠道 + 官方合规渠道双通道           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  2. 跨境专线网络（合规传输）                                    │  │
│  │     · 共享带宽：5M-50M（¥299-1699/月）                        │  │
│  │     · 独享带宽：10M-100M（¥1999-12999/月）                    │  │
│  │     · 中新数据港官方背书 + AWS Singapore 节点                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  3. AI 数字员工（6个Agent）                                    │  │
│  │     · CEO / 销售总监 / 客服主管 / 技术方案官 / 合规风控官 / 行政助理│  │
│  │     · 按角色订阅，团队共享                                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  【增值产品层】                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ 数字产品 │  │ 任务大厅 │  │ 培训课程 │  │ InkCore  │           │
│  │ 仓库     │  │ (B2B)   │  │ (TikTok)│  │ 上架     │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
│                                                                     │
│  【账户与计费层】（本次重点设计）                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  · 个人账号体系                                               │  │
│  │  · 团队账号体系（总号+分号+统一计费）                          │  │
│  │  · 企业账号体系（多部门+分级管理）                             │  │
│  │  · 统一账单系统（总账+分账+消费明细）                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  【基础设施层】                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ 阿里云   │  │ AWS SG   │  │ 中新专线 │  │ 火山引擎 │           │
│  │ (中国)   │  │ (新加坡) │  │ (跨境)   │  │ (AI工具) │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 产品线详细说明

| # | 产品 | 类型 | 定价 | 目标客户 | 毛利 |
|---|------|------|------|---------|------|
| 1 | **AI Token** | 基础服务 | 个人6.5折/团队5.5折/企业8折 | 所有用户 | 54-68% |
| 2 | **跨境专线** | 基础服务 | 共享¥299-1699/独享¥1999-12999 | 有合规需求用户 | 20-50% |
| 3 | **AI数字员工** | 增值服务 | ¥200-1000/月/角色 | 团队/企业 | 50-70% |
| 4 | **数字产品仓库** | 内容生态 | 按件/按包，批发折扣 | 创作者/卖家 | 15-30% |
| 5 | **任务大厅** | 撮合服务 | 佣金10-15% | 需求方/创作者 | 10-15% |
| 6 | **培训课程** | 知识付费 | ¥99-2999/课程 | 新手卖家 | 70-80% |
| 7 | **InkCore上架** | 变现渠道 | 分成50-80% | 创作者 | 平台抽成20-50% |

---

## 二、账户体系设计（核心）

### 2.1 三层账户架构

```
【OPC 账户体系架构】

                    ┌─────────────────────┐
                    │   OPC 平台注册入口    │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │  个人账号     │  │  团队账号     │  │  企业账号     │
    │  (Individual)│  │  (Team)      │  │  (Enterprise)│
    └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
           │                 │                 │
           │                 ▼                 │
           │        ┌─────────────────┐        │
           │        │   团队总号       │        │
           │        │  (Owner/Admin)  │        │
           │        └────────┬────────┘        │
           │                 │                 │
           │        ┌────────┴────────┐        │
           │        │                 │        │
           │        ▼                 ▼        │
           │   ┌─────────┐       ┌─────────┐  │
           │   │ 分号1   │       │ 分号2   │  │
           │   │(Member) │       │(Member) │  │
           │   └────┬────┘       └────┬────┘  │
           │        │                 │        │
           │        └────────┬────────┘        │
           │                 │                 │
           │        ┌────────┴────────┐        │
           │        │   统一计费系统   │        │
           │        │  (团队总账户)    │        │
           │        └─────────────────┘        │
           │                                   │
           └────────────────┬──────────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │   统一账单系统   │
                   │  · 总账（平台级）│
                   │  · 分账（账户级）│
                   │  · 明细（调用级）│
                   └─────────────────┘
```

### 2.2 个人账号

```
【个人账号模型】

User {
  id: "user_xxx",
  type: "individual",
  phone: "+86 138xxxx",
  email: "user@example.com",
  realName: "张三",
  idCardHash: "sha256(...)", // 实名认证
  avatar: "https://...",
  
  // 账户信息
  account: {
    balance: 100.00,          // 余额（元）
    totalSpent: 500.00,       // 累计消费
    tier: "personal",         // 层级：personal
  },
  
  // 服务配置
  services: {
    tokenQuota: 1000000,      // Token额度（100万）
    tokenUsed: 450000,        // 已使用
    models: ["gpt-4o", "claude-3.5", "deepseek"],
    networkService: null,     // 无网络服务
    aiEmployees: ["assistant"], // 1个数字员工
  },
  
  // 账单
  billing: {
    invoices: [...],          // 账单列表
    paymentMethods: [...],    // 支付方式
  },
  
  createdAt: "2026-07-01",
}
```

**个人账号特点：**
- 单独注册、单独付费、单独消费
- 消费直接计入个人账户
- 不可创建子账号
- 适合：个人卖家、SOHO、创作者

### 2.3 团队账号（核心设计）

```
【团队账号模型】

Team {
  id: "team_xxx",
  type: "team",
  name: "XX跨境电商团队",
  description: "主营TikTok美妆",
  
  // 企业认证信息
  businessLicense: "91110000...",
  companyName: "XX科技有限公司",
  legalPerson: "张三",
  
  // 总号（Owner）
  owner: {
    userId: "user_owner_xxx",
    role: "owner",
    name: "张三",
    phone: "+86 138xxxx",
  },
  
  // 管理员
  admins: [
    { userId: "user_admin_xxx", role: "admin", name: "李四" }
  ],
  
  // 成员（分号）
  members: [
    { 
      userId: "user_member1", 
      role: "member", 
      name: "王五",
      joinedAt: "2026-07-01",
      status: "active",
    },
    { 
      userId: "user_member2", 
      role: "member", 
      name: "赵六",
      joinedAt: "2026-07-02",
      status: "active",
    }
  ],
  
  // 团队总账户（统一计费）
  account: {
    balance: 5000.00,         // 团队总余额
    totalSpent: 15000.00,     // 团队累计消费
    monthlyBudget: 10000.00,  // 月度预算（可选）
    alertThreshold: 8000.00,  // 余额预警阈值
    tier: "team",             // 层级：team
  },
  
  // 服务配置（团队级）
  services: {
    tokenQuota: 10000000,     // 团队Token额度（1000万）
    tokenUsed: 6500000,       // 团队已使用
    models: ["gpt-4o", "claude-3.5", "deepseek", "kimi"],
    networkService: {
      type: "shared",
      bandwidth: 10,          // 10M共享
      status: "active",
    },
    aiEmployees: ["sales", "support", "assistant"], // 3个数字员工
  },
  
  // 权限配置
  permissions: {
    memberCanInvite: false,   // 成员是否可以邀请新成员
    memberCanViewAllConsumption: false, // 成员是否可查看全部消费
    memberCanManageBilling: false,      // 成员是否可以管理账单
  },
  
  createdAt: "2026-07-01",
}
```

**团队账号特点：**
- 一个总号（Owner）创建团队，邀请成员加入
- 所有消费统一计入团队总账户
- Owner/Admin 管理团队成员、配置服务、查看总账单
- 成员使用自己的账号登录，消费计入团队
- 成员可见自己的消费明细，但不可见其他成员的消费（除非权限开放）

### 2.4 企业账号

```
【企业账号模型】

Enterprise {
  id: "ent_xxx",
  type: "enterprise",
  name: "XX集团",
  
  // 多部门结构
  departments: [
    {
      id: "dept_1",
      name: "跨境电商部",
      teams: ["team_xxx", "team_yyy"],
    },
    {
      id: "dept_2",
      name: "内容创作部",
      teams: ["team_zzz"],
    }
  ],
  
  // 企业级账户
  account: {
    balance: 50000.00,
    totalSpent: 200000.00,
    tier: "enterprise",
  },
  
  // 企业级服务
  services: {
    tokenQuota: 100000000,    // 1亿Token
    networkService: {
      type: "dedicated",
      bandwidth: 50,          // 50M独享
      ipCount: 5,
    },
  },
  
  createdAt: "2026-07-01",
}
```

**企业账号特点：**
- 多部门、多团队结构
- 统一企业级计费
- 分级管理（集团管理员→部门管理员→团队管理员→成员）
- 适合：大型跨境电商公司、集团企业

---

## 三、消费计费体系设计（核心）

### 3.1 计费模型

```
【消费计费流程】

用户发起API调用
       │
       ▼
┌──────────────┐
│ API网关       │
│ · 认证        │ ← 判断是个人/团队成员
│ · 鉴权        │
│ · 限流        │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 账户类型判断  │
└──────┬───────┘
       │
   ┌───┴───┐
   │       │
   ▼       ▼
 个人    团队/企业
   │       │
   ▼       ▼
个人账户  团队总账户
扣费      扣费
   │       │
   ▼       ▼
生成消费记录
   │
   ▼
┌─────────────────────────────────────────┐
│            消费记录模型                   │
│  {                                      │
│    id: "cons_xxx",                      │
│    userId: "user_member1",  ← 谁调用的   │
│    teamId: "team_xxx",      ← 所属团队   │
│    accountId: "acc_team_xxx", ← 扣费账户 │
│    type: "token_usage",                 │
│    model: "gpt-4o",                     │
│    promptTokens: 1000,                  │
│    completionTokens: 500,               │
│    cost: 0.0234,          ← 费用        │
│    timestamp: "2026-07-03T10:00:00Z",   │
│  }                                      │
└─────────────────────────────────────────┘
```

### 3.2 消费记录模型

```javascript
// 消费记录（Consumption）
{
  id: "cons_abc123",
  
  // 谁消费的
  userId: "user_member1",       // 实际调用者（分号）
  userName: "王五",
  
  // 所属团队（如果是团队消费）
  teamId: "team_xxx",
  teamName: "XX跨境电商团队",
  
  // 扣费账户
  accountId: "acc_team_xxx",    // 团队总账户
  accountType: "team",          // team / individual / enterprise
  
  // 消费内容
  serviceType: "token",         // token / network / employee / product
  serviceId: "gpt-4o",
  serviceName: "GPT-4o",
  
  // 用量
  usage: {
    promptTokens: 1000,
    completionTokens: 500,
    totalTokens: 1500,
  },
  
  // 费用（按团队版5.5折计算）
  unitPrice: 0.0198,            // 单价（元/1K tokens）
  quantity: 1.5,                // 数量（千Token）
  amount: 0.0297,               // 费用（元）
  currency: "CNY",
  
  // 折扣信息
  discount: {
    tier: "team",               // 团队版折扣
    rate: 0.55,                 // 5.5折
    originalAmount: 0.054,      // 原价
  },
  
  // 状态
  status: "billed",             // billed / refunded / disputed
  
  // 时间
  createdAt: "2026-07-03T10:00:00Z",
  billedAt: "2026-07-03T10:00:01Z",
}
```

### 3.3 账单体系（三层）

```
【账单体系：总账 → 分账 → 明细】

┌─────────────────────────────────────────────────────────────┐
│                    平台级总账（OPC内部）                       │
│  · 所有用户的消费汇总                                        │
│  · 按产品分类统计                                            │
│  · 平台收入和成本                                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    账户级分账（用户可见）                      │
│                                                              │
│  【个人用户】                                                │
│    月度账单：                                                │
│      · Token消费：¥324                                      │
│      · 网络服务：¥0                                         │
│      · 数字员工：¥200                                       │
│      · 合计：¥524                                           │
│                                                              │
│  【团队Owner】                                               │
│    月度账单（总）：                                          │
│      · Token消费：¥3,960（团队总计）                         │
│        - 王五：¥1,200                                       │
│        - 赵六：¥980                                         │
│        - 其他：¥1,780                                       │
│      · 网络服务：¥499                                       │
│      · 数字员工：¥1,500                                     │
│      · 合计：¥5,959                                         │
│                                                              │
│  【团队成员】                                                │
│    月度账单（我的）：                                        │
│      · 我的Token消费：¥1,200                                │
│      · 我的数字员工调用：¥300                               │
│      · 合计：¥1,500                                         │
│      · （提示：计入团队总账户，无需个人付费）                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    调用级明细（逐笔记录）                      │
│                                                              │
│  2026-07-03 10:00:01                                        │
│    用户：王五                                                │
│    服务：GPT-4o                                              │
│    用量：Input 1000 tokens + Output 500 tokens               │
│    费用：¥0.0297                                            │
│    折扣：团队版5.5折                                         │
│                                                              │
│  2026-07-03 10:05:23                                        │
│    用户：王五                                                │
│    服务：Claude 3.5                                          │
│    用量：Input 2000 tokens + Output 1000 tokens              │
│    费用：¥0.0605                                            │
│    折扣：团队版5.5折                                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.4 团队消费的特殊处理

```
【团队消费流程】

成员（王五）发起API调用
       │
       ▼
API网关验证：
  1. 王五的userToken有效
  2. 王五属于 team_xxx
  3. team_xxx 的余额充足
       │
       ▼
扣费：从 team_xxx 的总账户扣费
       │
       ▼
记录消费：
  · userId = 王五（谁消费的）
  · teamId = team_xxx（所属团队）
  · accountId = team_xxx 的总账户（谁付费）
       │
       ▼
通知：
  · 王五：收到消费通知（"您本次调用消费¥0.03，计入团队账户"）
  · Owner：不通知（除非设置阈值预警）
       │
       ▼
汇总：
  · 实时更新王五的消费统计
  · 实时更新团队总消费统计
  · 日终生成团队日报（发送给Owner）
```

### 3.5 余额与预警

```javascript
// 团队账户余额管理
TeamAccount {
  teamId: "team_xxx",
  
  // 余额
  balance: 5000.00,             // 当前余额
  
  // 预算与预警
  settings: {
    monthlyBudget: 10000.00,    // 月度预算
    alertThreshold: 2000.00,    // 余额预警阈值（低于时通知Owner）
    dailyAlert: true,           // 是否发送每日消费摘要
    memberQuota: {              // 成员个人限额（可选）
      "user_member1": 2000.00,  // 王五每月限额¥2000
      "user_member2": 1500.00,  // 赵六每月限额¥1500
    }
  },
  
  // 消费统计
  stats: {
    today: 150.00,
    thisWeek: 850.00,
    thisMonth: 3500.00,
    lastMonth: 6200.00,
  },
  
  // 成员消费统计
  memberStats: {
    "user_member1": {           // 王五
      today: 80.00,
      thisMonth: 1800.00,
      totalCalls: 15000,
    },
    "user_member2": {           // 赵六
      today: 70.00,
      thisMonth: 1700.00,
      totalCalls: 12000,
    }
  }
}
```

---

## 四、OPC 平台监管职能

### 4.1 平台监管范围

```
【OPC 监管职能】

1. 合规监管
   · 用户实名认证（身份证+企业营业执照）
   · 跨境数据传输审计（中新数据港专线日志）
   · AI模型调用内容审核（敏感词过滤）
   · 数据出境合规报告（企业版提供）

2. 消费监管
   · 团队Owner可查看所有成员消费
   · 团队成员仅可查看自己的消费
   · 平台管理员可查看所有用户消费（用于风控）
   · 异常消费预警（突然大量调用）

3. 服务监管
   · API调用限流（防止滥用）
   · 模型可用性监控（lingapi.com渠道健康度）
   · 网络质量监控（专线延迟/丢包）
   · 数字员工行为审计

4. 内容监管
   · 数字产品仓库内容审核
   · 任务大厅任务合规检查
   · InkCore上架商品审核
```

### 4.2 监管数据流

```
【监管数据流】

用户调用API
    │
    ├─► 实名认证检查 → 未认证则拒绝
    │
    ├─► 内容审核 → 敏感内容则拦截
    │
    ├─► 消费限额检查 → 超额则拒绝或预警
    │
    ├─► 限流检查 → 超频则限流
    │
    └─► 记录审计日志 → 保留180天
```

### 4.3 团队Owner的监管权限

```
【团队Owner/Admin 控制台】

┌─────────────────────────────────────────────────────────────┐
│                    团队管理控制台                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  【成员管理】                                                │
│    · 邀请成员（发送邀请链接）                                │
│    · 移除成员                                              │
│    · 设置成员角色（Admin/Member）                           │
│    · 设置成员消费限额                                       │
│                                                             │
│  【消费监管】                                                │
│    · 团队总消费（实时）                                     │
│    · 各成员消费明细                                         │
│    · 消费趋势图（日/周/月）                                 │
│    · 异常消费预警                                           │
│                                                             │
│  【服务配置】                                                │
│    · Token额度分配                                          │
│    · 模型权限（允许成员使用哪些模型）                        │
│    · 网络服务配置                                           │
│    · 数字员工分配                                           │
│                                                             │
│  【账单管理】                                                │
│    · 月度账单导出                                           │
│    · 充值/续费                                             │
│    · 发票申请                                              │
│                                                             │
│  【审计日志】                                                │
│    · 成员操作日志（谁调用了什么）                            │
│    · 内容审核日志（敏感内容拦截记录）                        │
│    · 导出审计报告（企业版）                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 五、API 接口设计

### 5.1 团队管理接口

```
POST /api/teams                    // 创建团队（需企业认证）
GET  /api/teams/:teamId            // 获取团队信息
PUT  /api/teams/:teamId            // 更新团队信息
DELETE /api/teams/:teamId          // 解散团队

POST /api/teams/:teamId/invite     // 邀请成员（发送邀请码/链接）
POST /api/teams/:teamId/join       // 成员加入（通过邀请码）
DELETE /api/teams/:teamId/members/:userId  // 移除成员
PUT  /api/teams/:teamId/members/:userId    // 更新成员角色/限额

GET  /api/teams/:teamId/consumption        // 获取团队消费统计
GET  /api/teams/:teamId/members/:userId/consumption  // 获取成员消费明细
GET  /api/teams/:teamId/billing            // 获取团队账单
```

### 5.2 消费记录接口

```
GET  /api/consumption              // 获取当前用户的消费记录
GET  /api/consumption/summary      // 获取消费汇总（日/周/月）
GET  /api/consumption/team         // 获取团队消费（Owner/Admin权限）
GET  /api/consumption/export       // 导出消费记录（CSV/Excel）
```

### 5.3 账户接口

```
GET  /api/account                  // 获取当前账户信息（余额/限额等）
POST /api/account/recharge         // 账户充值
GET  /api/account/balance          // 获取余额
GET  /api/account/stats            // 获取账户统计
```

---

## 六、数据库模型设计

### 6.1 核心表结构

```sql
-- 用户表（个人/团队成员）
CREATE TABLE users (
  id UUID PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  real_name VARCHAR(100),
  id_card_hash VARCHAR(255),
  avatar_url TEXT,
  type VARCHAR(20) CHECK (type IN ('individual', 'team_member', 'enterprise_member')),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 团队表
CREATE TABLE teams (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  business_license VARCHAR(255),
  company_name VARCHAR(255),
  legal_person VARCHAR(100),
  owner_id UUID REFERENCES users(id),
  account_balance DECIMAL(10,2) DEFAULT 0,
  monthly_budget DECIMAL(10,2),
  alert_threshold DECIMAL(10,2),
  tier VARCHAR(20) DEFAULT 'team',
  token_quota BIGINT DEFAULT 10000000,
  token_used BIGINT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 团队成员表（关联表）
CREATE TABLE team_members (
  id UUID PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) CHECK (role IN ('owner', 'admin', 'member')),
  monthly_quota DECIMAL(10,2),  -- 个人月度限额（可选）
  status VARCHAR(20) DEFAULT 'active',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- 消费记录表
CREATE TABLE consumptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  team_id UUID REFERENCES teams(id),
  account_id UUID NOT NULL,  -- 扣费账户（个人ID或团队ID）
  account_type VARCHAR(20) CHECK (account_type IN ('individual', 'team', 'enterprise')),
  
  service_type VARCHAR(50) NOT NULL,  -- token / network / employee / product
  service_id VARCHAR(100) NOT NULL,   -- gpt-4o / claude-3.5 等
  service_name VARCHAR(255),
  
  prompt_tokens BIGINT,
  completion_tokens BIGINT,
  total_tokens BIGINT,
  
  unit_price DECIMAL(10,6),  -- 单价（元/1K tokens）
  quantity DECIMAL(10,2),    -- 数量
  amount DECIMAL(10,4),      -- 费用
  currency VARCHAR(10) DEFAULT 'CNY',
  
  discount_rate DECIMAL(3,2), -- 折扣率
  original_amount DECIMAL(10,4), -- 原价
  
  status VARCHAR(20) DEFAULT 'billed',
  created_at TIMESTAMP DEFAULT NOW(),
  billed_at TIMESTAMP
);

-- 账单表
CREATE TABLE bills (
  id UUID PRIMARY KEY,
  account_id UUID NOT NULL,
  account_type VARCHAR(20),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_amount DECIMAL(10,2),
  discount_amount DECIMAL(10,2),
  final_amount DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pending',
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 审计日志表
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  team_id UUID REFERENCES teams(id),
  action VARCHAR(100) NOT NULL,  -- api_call / login / config_change 等
  resource_type VARCHAR(50),     -- token / member / billing 等
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 索引优化
CREATE INDEX idx_consumptions_user_id ON consumptions(user_id);
CREATE INDEX idx_consumptions_team_id ON consumptions(team_id);
CREATE INDEX idx_consumptions_created_at ON consumptions(created_at);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_audit_logs_team_id ON audit_logs(team_id);
```

---

## 七、前端页面调整

### 7.1 新增页面

| 页面 | 路径 | 说明 |
|------|------|------|
| 团队管理 | `/team/manage` | Owner/Admin管理团队 |
| 成员邀请 | `/team/invite` | 发送邀请链接 |
| 团队消费 | `/team/consumption` | 团队消费统计 |
| 成员消费 | `/team/members/:id/consumption` | 单个成员消费 |
| 团队账单 | `/team/billing` | 团队账单导出 |
| 账户充值 | `/account/recharge` | 统一充值入口 |

### 7.2 现有页面调整

| 页面 | 调整内容 |
|------|---------|
| 工作台 `/workspace` | 增加团队信息卡片、成员列表、快速邀请 |
| 钱包 `/wallet` | 支持团队余额显示、成员消费汇总 |
| 定价 `/pricing` | 增加"团队版"入口，引导企业认证 |
| 设置 `/settings` | 增加团队设置、成员权限管理 |

---

## 八、实施计划

### 8.1 实施优先级

| 阶段 | 时间 | 任务 | 优先级 |
|------|------|------|--------|
| **Phase 1** | 1-2周 | 数据库模型改造（用户/团队/消费） | P0 |
| **Phase 2** | 2-3周 | 后端API开发（团队管理/消费计费） | P0 |
| **Phase 3** | 3-4周 | 前端页面开发（团队管理/消费统计） | P0 |
| **Phase 4** | 4-5周 | 测试与调优（账户体系/计费准确性） | P1 |
| **Phase 5** | 5-6周 | 上线与监控（数据迁移/用户引导） | P1 |

### 8.2 数据迁移

```
现有用户 → 全部标记为 "individual" 类型
现有消费记录 → 补充 account_id = user_id, account_type = "individual"
新注册团队用户 → 创建 Team 记录，关联 User 记录
```

### 8.3 关键指标

| 指标 | 目标 | 说明 |
|------|------|------|
| 团队创建率 | >20% | 注册用户中创建团队的比例 |
| 团队平均成员数 | 3-5人 | 每个团队的平均成员数 |
| 团队消费占比 | >60% | 团队消费占总消费的比例 |
| 消费记录准确率 | 99.99% | 计费准确性 |
| 账户余额预警及时率 | 100% | 余额不足时及时通知 |

---

## 九、总结

### 核心设计

| 设计项 | 结论 | 说明 |
|--------|------|------|
| **账户体系** | 三层：个人/团队/企业 | 团队是核心，总号+分号结构 |
| **计费方式** | 团队统一计费 | 成员消费计入团队总账户 |
| **消费可见性** | 成员可见自己的，Owner可见全部的 | 分级权限 |
| **监管职能** | 平台级+团队级 | 平台负责合规，Owner负责管理 |
| **数据模型** | 6张核心表 | users, teams, team_members, consumptions, bills, audit_logs |

### 一句话总结

> **OPC 平台账户体系：个人账号独立消费，团队账号总号统一付费、分号消费可见。平台提供合规监管、消费审计、分级权限管理，确保团队使用透明可控。**

---

**CEO 签批：** 团坐009
**状态：** 待董事长确认
**日期：** 2026-07-03
