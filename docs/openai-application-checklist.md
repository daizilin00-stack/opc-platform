# OpenAI 企业 API 账号申请步骤清单

> **文档用途：** 指导新加坡同事协助完成 OpenAI 企业账号申请
> **版本：** v0.1
> **日期：** 2026-06-03
> **申请主体：** CHINA-SINGAPORE DATA PORT PTE. LTD.
> **负责人：** 新加坡同事（待指定）
> **审核：** Celine（董事长）

---

## 一、申请前准备（新加坡同事需完成）

### 1.1 办理新加坡实体手机号

| 项目 | 要求 | 备注 |
|------|------|------|
| **运营商** | Singtel / M1 / StarHub（任选一个） | 推荐 Singtel，信号覆盖广 |
| **套餐类型** | 最便宜的预付费或月付套餐 | 只需接收短信，不需要流量 |
| **月租** | SGD 8-15 / 月 | 约 ¥40-75 |
| **办理方式** | ① 本人带护照去营业厅 ② 部分便利店（7-11）可买预付费卡 | 建议去营业厅，确保能收国际短信 |
| **关键确认** | 能接收 +1 美国号码的短信（OpenAI 验证码） | 办理时让店员测试 |

**办理地点推荐：**
- Singtel Shop @ Raffles Place（靠近公司地址 120 Robinson Road）
- M1 Shop @ Tanjong Pagar
- 7-11 便利店（Cheers / Watsons 也有预付费卡）

**所需证件：**
- 护照（或新加坡身份证/EP/SP）
- 新加坡地址（可用公司地址：120 Robinson Road #13-01）

---

### 1.2 确认公司材料齐全

| 材料 | 状态 | 获取方式 |
|------|------|----------|
| **公司注册证明（ACRA BizFile）** | ✅ 已确认 | ACRA 官网下载 PDF |
| **公司 UEN 号码** | ✅ 已确认 | 2017xxxxxK（待补充完整） |
| **公司营业执照（Business Profile）** | ✅ 已确认 | ACRA 付费下载 |
| **OCBC 对公账户账单** | ✅ 已确认 | 已有对账单，或申请最新一期 |
| **公司网站 / 域名** | ⏳ 待确认 | 可用平台域名或临时页面 |
| **公司邮箱** | ⏳ 待确认 | 建议用域名邮箱（如 contact@chinadataport.sg） |

---

## 二、OpenAI 企业账号申请步骤

### 步骤 1：访问申请页面

1. 打开浏览器（建议使用 Chrome，无痕模式）
2. 访问：https://platform.openai.com/signup
3. 或访问：https://openai.com/enterprise （企业版专门入口）

### 步骤 2：选择企业账号类型

**推荐方案：Scale 计划（适合企业）**
- 适合月消费 $1,000+ 的企业
- 提供更高的 RPM/TPM 配额
- 有专属客户经理
- 优先获得新模型访问权限

**备选方案：自助 API（Pay-as-you-go）**
- 适合月消费 <$1,000
- 较低配额，但无需企业审核
- 可以先用这个，后续升级到 Scale

### 步骤 3：填写企业信息

| 字段 | 填写内容 |
|------|----------|
| **Company Name** | CHINA-SINGAPORE DATA PORT PTE. LTD. |
| **Company Website** | （待确认，可用平台域名） |
| **Company Email** | （建议用域名邮箱） |
| **Country** | Singapore |
| **Business Address** | 120 Robinson Road #13-01, Singapore 068913 |
| **UEN / Business Registration Number** | （待补充完整 UEN） |
| **Industry** | Technology / Software Development |
| **Company Size** | 1-10 employees（初创期） |
| **Use Case** | AI platform providing overseas large language model API services to Chinese developers and enterprises |
| **Estimated Monthly Usage** | $1,000 - $5,000（保守估计） |

### 步骤 4：手机验证

1. 选择国家代码：+65（新加坡）
2. 输入新加坡实体手机号
3. 接收 SMS 验证码（6位数字）
4. 输入验证码完成验证

**⚠️ 关键提示：**
- 必须确保能接收来自 +1（美国）号码的短信
- 如果第一次没收到，等 60 秒后点击"Resend"
- 如果多次失败，尝试更换网络环境（WiFi → 移动数据）

### 步骤 5：提交企业审核（Scale 计划）

如果选择 Scale 计划，需要提交额外材料：

| 材料 | 格式 | 说明 |
|------|------|------|
| **ACRA 公司注册证明** | PDF | 近 3 个月内下载的 BizFile |
| **OCBC 银行账单** | PDF | 近 3 个月，显示公司名称和地址 |
| **公司网站截图** | 截图 | 显示公司 logo、联系方式、业务介绍 |
| **使用场景说明** | 文字 | 详细说明我们提供什么服务 |

**审核周期：** 3-5 个工作日
**审核结果：** 邮件通知（同时抄送公司邮箱）

### 步骤 6：绑定支付方式

审核通过后：

1. 登录 OpenAI Platform Dashboard
2. 进入 **Settings → Billing**
3. 添加支付方式：
   - **信用卡：** OCBC 公司信用卡（待开通）
   - **银行转账：** 设置自动扣款（需联系 OpenAI 支持）
4. 设置**自动充值阈值**：建议 $100（余额低于 $100 时自动充值）

---

## 三、申请后配置（技术团队操作）

### 3.1 生成 API Key

1. 登录 https://platform.openai.com/api-keys
2. 点击 **Create new secret key**
3. 命名：如 `prod-key-1`
4. 复制 key（**只显示一次，务必保存到密码管理器**）

**建议生成多个 Key：**
- `prod-key-1`：生产环境主 Key
- `prod-key-2`：生产环境备用 Key（用于轮换）
- `prod-key-3`：测试环境 Key
- `prod-key-4`：硅基员工平台专用 Key

### 3.2 设置 Rate Limits（速率限制）

1. 进入 **Settings → Limits**
2. 设置：
   - **RPM（每分钟请求数）**：根据配额设置，默认可能 500
   - **TPM（每分钟 Token 数）**：根据配额设置，默认可能 200 万
   - **Max requests per day**：可设置上限，防止账单失控

### 3.3 启用 Usage Tracking（用量追踪）

1. 进入 **Usage**
2. 查看实时用量和费用
3. 设置 **Usage Alerts**（用量告警）：
   - 达到 $500 时邮件告警
   - 达到 $1,000 时邮件告警

### 3.4 申请多个 Key（Key 轮换策略）

**为什么要多个 Key：**
- 避免单 Key 达到 RPM/TPM 上限
- 分散风险，一个 Key 泄露不影响全部
- 不同业务模块隔离

**申请方式：**
- 每个 Key 可以在 Dashboard 单独生成
- 或联系 OpenAI Support 申请更高配额

---

## 四、常见问题排查

### 4.1 手机号验证失败

| 症状 | 原因 | 解决 |
|------|------|------|
| 收不到验证码 | 运营商屏蔽国际短信 | 联系运营商开通国际短信接收 |
| 提示"号码不支持" | OpenAI 黑名单 | 尝试换另一个运营商的号码 |
| 提示"已使用" | 该号码被其他账号绑定 | 用新号码，或联系 OpenAI 解绑 |
| 多次尝试被锁定 | 触发风控 | 等 24 小时后重试，换 IP 地址 |

### 4.2 企业审核被拒

| 原因 | 解决 |
|------|------|
| 公司信息不匹配 | 确保 ACRA 注册名和申请表完全一致 |
| 业务描述不清晰 | 详细说明"我们提供 AI 平台服务，连接中国开发者和海外模型" |
| 高风险行业 | 强调"企业级合规、数据安全、跨境专线" |
| 材料不完整 | 补充 OCBC 账单、公司网站 |

### 4.3 支付方式绑定失败

| 原因 | 解决 |
|------|------|
| 信用卡被拒 | 确认 OCBC 卡已开通国际支付和 3D Secure |
| 地区限制 | 确保信用卡账单地址是新加坡地址 |
| 银行拦截 | 联系 OCBC 客服（6538 1111）确认未拦截 |

---

## 五、完成检查清单

- [ ] 新加坡实体手机号已办理（+65 开头）
- [ ] 能接收 +1 美国号码的 SMS 验证
- [ ] ACRA 公司注册证明已下载（PDF）
- [ ] OCBC 对公账单已获取（PDF）
- [ ] 公司网站/域名已确认
- [ ] 公司邮箱（域名邮箱）已设置
- [ ] OpenAI 企业账号已提交申请
- [ ] 企业审核已通过（邮件确认）
- [ ] 支付方式已绑定（OCBC 卡）
- [ ] 至少 4 个 API Key 已生成并保存
- [ ] Rate Limits 已配置
- [ ] Usage Alerts 已设置
- [ ] API Key 已安全传输给技术团队（团坐009）

---

## 六、联系信息

| 角色 | 联系人 | 联系方式 |
|------|--------|----------|
| **董事长** | Celine | 微信/电话（私密） |
| **技术负责人** | 团坐009 | 通过平台联系 |
| **OpenAI 支持** | support@openai.com | 平台内提交 ticket |
| **新加坡同事** | （待指定） | 办理手机号和本地事务 |

---

## 七、附件

1. **ACRA BizFile 下载指南**
   - 访问：https://www.acra.gov.sg
   - 登录 CorpPass
   - 搜索公司名：CHINA-SINGAPORE DATA PORT PTE. LTD.
   - 下载 Business Profile（PDF，费用约 SGD 5）

2. **OCBC 账单获取**
   - 登录 OCBC Business Banking
   - 下载近 3 个月 Statement
   - 或致电 6538 1111 申请纸质账单

3. **OpenAI 官方文档**
   - 企业版：https://openai.com/enterprise
   - API 文档：https://platform.openai.com/docs
   - 定价：https://openai.com/pricing

---

**CEO 签批：** 团坐009  
**状态：** 待新加坡同事执行
