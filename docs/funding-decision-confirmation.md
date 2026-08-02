# 资金与商业模式决策确认

> 决策日期：2026-06-03 18:07
> 决策人：Celine（董事长）
> 执行人：团坐009（CEO）
> 状态：已确认，已执行

---

## 确认的三项决策

### 1. 任务大厅佣金：15%固定

| 项目 | 确认内容 |
|------|----------|
| **佣金率** | 15%固定（开园期） |
| **适用范围** | 所有任务大厅交易 |
| **计费方式** | 发布方支付总任务款，平台扣除15%佣金，85%给接单方 |
| **开园优惠** | 前100单免佣金（平台补贴） |
| **未来调整** | 阶梯佣金：小单20%→大单10%，信用等级：铜牌18%→钻石5% |
| **参考** | 低于Upwork新用户20%（流失率40%），低于猪八戒20%（跳单30%） |

**已执行：**
- ✅ `backend/src/routes/commissions.js` - 佣金计算API
- ✅ `backend/src/routes/escrow.js` - escrow托管自动扣15%佣金
- ✅ 数据库表 `commissions` 已创建

---

### 2. 资金托管：平台自管钱包

| 项目 | 确认内容 |
|------|----------|
| **方案** | 平台自管钱包（用户充值到平台钱包） |
| **开发成本** | 低（1周完成） |
| **合规风险** | 中（需备付金，开园后3月接入微信/支付宝分账） |
| **资金流程** | 用户充值→平台钱包→任务escrow冻结→验收释放→接单方可提现 |
| **提现** | 1-3工作日到账，最低100元 |
| **安全** | 每笔交易记录流水，可审计 |

**已执行：**
- ✅ `backend/src/routes/wallet.js` - 钱包API（充值、查询、交易记录、提现）
- ✅ `backend/src/routes/escrow.js` - escrow托管全流程（创建/接单/提交/验收/自动释放）
- ✅ 数据库表 `wallets`, `wallet_transactions`, `escrow_payments` 已创建
- ✅ 前端页面 `/wallet` - 钱包余额、交易记录
- ✅ 前端页面 `/recharge` - 充值流程

---

### 3. 新用户奖励：15元Token

| 项目 | 确认内容 |
|------|----------|
| **奖励金额** | ¥15等值Token |
| **发放方式** | 注册后自动到账 |
| **有效期** | 90天 |
| **适用范围** | Token调用 + 任务支付 |
| **获客成本** | ¥15/人 |
| **参考** | 硅基流动送¥15，OpenRouter送$5 |

**已执行：**
- ✅ `backend/src/routes/wallet.js` - `POST /wallet/new-user-bonus` 自动发放
- ✅ 数据库表 `new_user_credits` 已创建
- ✅ 前端页面 `/wallet` 自动检测新用户并发放

---

## 技术实现清单

### 后端API

| API | 路径 | 功能 | 状态 |
|-----|------|------|------|
| Escrow创建 | `POST /api/escrow/create` | 发布方支付任务款，资金冻结 | ✅ |
| Escrow接单 | `POST /api/escrow/accept` | 接单方确认接单 | ✅ |
| Escrow提交 | `POST /api/escrow/submit` | 接单方提交交付物 | ✅ |
| Escrow验收 | `POST /api/escrow/review` | 发布方验收/拒绝 | ✅ |
| Escrow详情 | `GET /api/escrow/:id` | 查看托管详情 | ✅ |
| Escrow列表 | `GET /api/escrow/my/list` | 我的托管列表 | ✅ |
| 自动释放 | `POST /api/escrow/auto-release` | 系统定时释放超时订单 | ✅ |
| 钱包信息 | `GET /api/wallet/info` | 查询余额 | ✅ |
| 充值 | `POST /api/wallet/recharge` | 创建充值订单 | ✅ |
| 充值确认 | `POST /api/wallet/recharge/confirm` | 确认到账 | ✅ |
| 交易记录 | `GET /api/wallet/transactions` | 查询流水 | ✅ |
| 提现 | `POST /api/wallet/withdraw` | 申请提现 | ✅ |
| 新用户奖励 | `POST /api/wallet/new-user-bonus` | 发放15元奖励 | ✅ |
| 佣金计算 | `POST /api/commissions/calculate` | 计算15%佣金 | ✅ |
| 佣金记录 | `GET /api/commissions/my` | 我的佣金记录 | ✅ |
| 佣金统计 | `GET /api/commissions/stats` | 平台佣金统计（管理员） | ✅ |

### 数据库表

| 表名 | 用途 | 状态 |
|------|------|------|
| `wallets` | 用户钱包（余额+冻结） | ✅ 已有，扩展 |
| `wallet_transactions` | 资金流水 | ✅ 新建 |
| `escrow_payments` | 任务资金托管 | ✅ 新建 |
| `commissions` | 佣金记录 | ✅ 新建 |
| `new_user_credits` | 新用户奖励 | ✅ 新建 |
| `task_milestones` | 任务里程碑 | ✅ 新建 |
| `recharge_orders` | 充值订单 | ✅ 新建 |

### 前端页面

| 页面 | 路径 | 功能 | 状态 |
|------|------|------|------|
| 钱包 | `/wallet` | 余额、交易记录、充值入口 | ✅ |
| 充值 | `/recharge` | 选择金额、支付方式、创建订单 | ✅ |
| 工作台 | `/workspace` | 添加钱包导航入口 | ✅ |

---

## 下一步行动

| 优先级 | 行动项 | 时间 | 状态 |
|--------|--------|------|------|
| 🔴 P0 | 测试完整流程：充值→发布任务→接单→提交→验收→释放 | 1天 | 待执行 |
| 🔴 P0 | 添加自动释放定时任务（cron） | 1天 | 待执行 |
| 🟡 P1 | 任务大厅前端接入escrow流程 | 2天 | 待执行 |
| 🟡 P1 | 前端API集成（钱包+任务+escrow） | 2天 | 待执行 |
| 🟢 P2 | 接入微信/支付宝分账API（开园后3月） | 3月后 | 待执行 |
| 🟢 P2 | 设计阶梯佣金+信用等级体系 | 1周 | 待执行 |
| 🟢 P2 | 会员制方案（¥99/月） | 开园后6月 | 待执行 |

---

**CEO 确认：** 团坐009  
**执行日期：** 2026-06-03 18:07  
**状态：** 已确认，已执行
