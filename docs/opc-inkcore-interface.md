# InkCore 与 OPC 平台关系：API 接口设计

> **决策确认：** 两个独立项目，通过最小化 API 连通
> **董事长要求：** OPC 保持精简、InkCore 独立面向 C 端、两者通过后台 API 接口连接
> **CEO：** 团坐009
> **日期：** 2026-06-07（品牌更新：2026-06-13 墨核/MOHE → InkCore）

---

## 一、核心原则：两个独立项目，最小化 API 耦合

**OPC平台 = 中国 B2B 创业服务平台（独立项目）**
- 不做 C 端，不碰消费者
- 不直接卖商品给个人买家
- 专注服务创业者、创作者、企业
- 核心：数字员工、任务大厅、创作者工具、数字产品仓库

**InkCore = 新加坡 C2C 数字商品交易平台（独立项目）**
- 独立品牌、独立域名、独立运营、独立代码库、独立数据库
- 直接面向东南亚消费者（TikTok 用户）
- 独立处理商品展示、支付、交付、客服
- 核心：商品浏览、支付、自动交付、订单管理

**连接方式 = 最小化 API 接口（后台连通）**
- OPC 创作者在 OPC 后台一键上架商品到 InkCore 销售
- InkCore 销售收益回流到 OPC 创作者钱包，方便变现
- 两个平台独立运行，仅通过 3 个 API 接口交互

---

## 二、架构图：两个独立项目 + API 连通

```
┌─────────────────────────────────────────────────────────────┐
│              OPC 中新数据港（中国）—— 独立项目               │
│                   B2B 创业服务平台                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ 创业者门户    │  │ 数字员工     │  │ 任务大厅     │    │
│  │ · 注册认证   │  │ · 6个Agent  │  │ · 发布/接单  │    │
│  │ · 工作台     │  │ · 调用/协作  │  │ · 资金托管   │    │
│  │ · 收益中心   │  │ · 知识库    │  │ · 佣金结算   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  数字产品仓库（创作者生产工具）                        │  │
│  │  · 创作者上传内容 → 审核 → 入库                       │  │
│  │  · 卖家（创业者）批发采购（6-100件折扣）               │  │
│  │  · 支持：脚本/模板/素材/报告/工具                     │  │
│  │  · 定价：批发价（¥3-75/件）                          │  │
│  │  · 结算：人民币，平台佣金15%，创作者分成50-70%       │  │
│  └──────────────┬───────────────────────────────────────┘  │
│                 │                                           │
│                 │ 后台操作：创作者点击"上架到 InkCore"        │
│                 │                                           │
└─────────────────┼───────────────────────────────────────────┘
                  │
                  │  API 连通层（仅3个接口）
                  │  ┌─────────────────────────┐
                  │  │ 1. 产品上架 API          │
                  │  │ 2. 收益回流 API          │
                  │  │ 3. 账号验证 API          │
                  │  └─────────────────────────┘
                  │
                  ▼ 互联网/专线
┌─────────────────────────────────────────────────────────────┐
│              InkCore（新加坡）—— 独立项目                    │
│                C2C 数字商品交易平台                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  InkCore Store（store.inkcore.sg）                   │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐           │  │
│  │  │ 商品浏览   │ │ 商品详情  │ │ 支付下单  │           │  │
│  │  │ 瀑布流     │ │ 多图展示  │ │ Stripe   │           │  │
│  │  │ 分类筛选   │ │ 评价/销量 │ │ PayNow   │           │  │
│  │  └──────────┘ └──────────┘ └──────────┘           │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐           │  │
│  │  │ 自动交付   │ │ 订单中心  │ │ 卖家后台  │           │  │
│  │  │ 下载链接   │ │ 历史订单  │ │ 商品管理  │           │  │
│  │  │ 邮箱发送   │ │ 重新下载  │ │ 收入统计  │           │  │
│  │  └──────────┘ └──────────┘ └──────────┘           │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  消费者（C端）              卖家（OPC 创作者）          │  │
│  │  · 东南亚TikTok用户        · 在 OPC 后台点击上架      │  │
│  │  · 个人/小团队买家         · 商品自动同步到 InkCore    │  │
│  │  · SGD/USD支付             · 独立管理 InkCore 售价    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  技术栈：独立 Next.js 前端 + 独立 Node.js 后端               │
│  数据库：独立 PostgreSQL（仅含商品/订单/消费者数据）         │
│  文件存储：AWS S3 Singapore / Cloudflare R2               │
│  支付：Stripe + PayNow（SGD/USD）                           │
│  账号：调用 OPC SSO API 验证（不存储 OPC 用户数据）           │
└─────────────────────────────────────────────────────────────┘
```

---

## 三、API 接口设计：仅3个最小化接口

### 3.1 接口 1：产品上架 API（OPC → InkCore）

**触发方式：** 创作者在 OPC 后台点击"上架到 InkCore"

**OPC 调用 InkCore API：**
```http
POST https://api.inkcore.sg/v1/products
Content-Type: application/json
Authorization: Bearer {opc_service_token}

{
  "sync_type": "product_publish",
  "opc_product_id": "wh_12345",
  "seller": {
    "opc_user_id": "user_xxx",
    "username": "CreatorStudio",
    "avatar": "https://opc.../avatar.jpg",
    "rating": 4.8,
    "sales_count": 1280
  },
  "product": {
    "title": "TikTok美妆带货脚本合集（50条）",
    "description": "高转化脚本...",
    "category": "短视频脚本",
    "tags": ["TikTok", "美妆", "带货"],
    "files": [{
      "filename": "美妆脚本合集.pdf",
      "size": "2.3MB",
      "storage_url": "s3://opc-warehouse/..."  // InkCore 异步复制到新加坡 S3
    }],
    "preview_images": ["https://cdn.../1.jpg", "https://cdn.../2.jpg"]
  },
  "pricing": {
    "suggested_retail_sgd": 15.00,
    "cost_price_sgd": 8.00
  }
}
```

**技术实现：**
- OPC 后台调用 InkCore API，携带服务级认证 token
- 文件异步复制：OPC 存储 → InkCore 存储（AWS 跨区域复制或中转服务器）
- 创作者可在 InkCore 卖家后台调整售价（不低于成本价）

---

### 3.2 接口 2：收益回流 API（InkCore → OPC）

**触发方式：** 订单完成（7天自动确认或买家确认收货）

**InkCore 调用 OPC API：**
```http
POST https://api.opc.csdport.cn/v1/external/revenue
Content-Type: application/json
Authorization: Bearer {inkcore_service_token}

{
  "sync_type": "sale_revenue",
  "inkcore_order_id": "order_xxx",
  "opc_user_id": "user_xxx",
  "product_id": "wh_12345",
  "sale": {
    "quantity": 1,
    "unit_price_sgd": 15.00,
    "total_sgd": 15.00,
    "platform_fee_sgd": 2.25,
    "net_to_seller_sgd": 12.75,
    "exchange_rate": 1.0,
    "net_to_seller_cny": 80.00
  },
  "timestamp": "2026-06-07T10:00:00Z"
}
```

**技术实现：**
- InkCore 调用 OPC API，携带服务级认证 token
- 数据汇入 OPC 创作者"收益中心"（标记为"InkCore 销售收益"）
- 创作者在 OPC 统一提现（InkCore 收益 + OPC 任务收益合并结算）

---

### 3.3 接口 3：账号验证 API（双向）

**场景：** InkCore 用户登录时，验证 OPC 账号

**InkCore 调用 OPC API：**
```http
POST https://api.opc.csdport.cn/v1/external/auth/verify
Content-Type: application/json

{
  "phone": "+86 138xxxx",
  "password": "..."
}

// 返回
{
  "valid": true,
  "opc_user_id": "user_xxx",
  "token": "opc_jwt_token",
  "profile": {
    "username": "CreatorStudio",
    "avatar": "https://...",
    "verified": true
  }
}
```

**关键设计：**
- InkCore 不存储 OPC 用户密码，只存 token 和基本画像
- 登录验证实时走 OPC API
- token 过期后重新验证

---

## 四、OPC 保持精简：功能边界

### 4.1 OPC 不做的（InkCore 独立做）

| 功能 | 归属 | 说明 |
|------|------|------|
| 商品瀑布流展示 | ❌ OPC 不做 | InkCore 做 |
| 消费者购物车 | ❌ OPC 不做 | InkCore 做 |
| 消费者支付（SGD） | ❌ OPC 不做 | InkCore 做 |
| 自动交付下载页 | ❌ OPC 不做 | InkCore 做 |
| 消费者评价系统 | ❌ OPC 不做 | InkCore 做 |
| 商品搜索/推荐算法 | ❌ OPC 不做 | InkCore 做 |
| 消费者客服 | ❌ OPC 不做 | InkCore 做 |

### 4.2 OPC 专注做的（B2B 核心）

| 功能 | 归属 | 说明 |
|------|------|------|
| 创业者注册/认证 | ✅ OPC 做 | 数字员工平台入口 |
| 数字员工调用 | ✅ OPC 做 | 6个Agent核心能力 |
| 任务大厅（B2B 撮合） | ✅ OPC 做 | 创业者接任务 |
| 数字产品仓库（创作者生产） | ✅ OPC 做 | 创作者创作工具 |
| 资金托管（任务交易） | ✅ OPC 做 | escrow 系统 |
| 人民币钱包/提现 | ✅ OPC 做 | 中国境内结算 |
| 创作者管理/等级 | ✅ OPC 做 | 创作者生态 |
| 数字员工训练/配置 | ✅ OPC 做 | Agent 知识库管理 |

---

## 五、数据流图：一次完整交易（跨两个独立项目）

```
【创作者视角（OPC 后台）】

1. 创作者在 OPC 后台创作内容
   └─ 例：写了50条TikTok美妆脚本

2. 创作者上传至"数字产品仓库"
   └─ 定价：批发价 ¥5/条（6件8折，100件5折）
   └─ 面向：B2B（创业者/卖家批量采购）

3. 创作者点击"上架到 InkCore"
   └─ 设置零售价：S$15（约¥80，毛利70%）
   └─ 点击确认

4. 产品上架 API 触发
   └─ OPC → InkCore API：发送商品元数据
   └─ 文件异步复制：中国存储 → 新加坡存储
   └─ InkCore 生成商品页：store.inkcore.sg/product/123

【消费者视角（InkCore 前台）】

5. 消费者在 TikTok 看到视频
   └─ 点击 Bio 链接 → 进入 InkCore Store

6. 消费者浏览商品页
   └─ 查看预览图、评价、价格（S$15）
   └─ 点击购买

7. 消费者支付（Stripe/PayNow）
   └─ 支付成功 → InkCore 触发自动交付
   └─ 生成下载页 → 发送邮件

8. 消费者下载商品
   └─ 24小时内有效，可下载5次

【结算视角（跨平台）】

9. 7天后订单自动完成
   └─ InkCore 计算：S$15 × 15%平台费 = S$2.25
   └─ 创作者实得：S$12.75

10. 收益回流 API 触发
    └─ InkCore → OPC API：创作者收益数据
    └─ OPC 收益中心显示：InkCore 销售 S$12.75（≈¥80）

11. 创作者在 OPC 后台提现
    └─ InkCore 收益 + OPC 任务收益，合并结算
    └─ 人民币到账（按汇率换算）
```

---

## 六、技术栈确认（各自独立）

### 6.1 OPC（保持现有）

| 层 | 技术 | 部署 |
|----|------|------|
| 前端 | Next.js 14 + Tailwind | 阿里云 CDN（中国） |
| 后端 | Node.js + Express | 阿里云 ECS/K8s |
| 数据库 | PostgreSQL | 阿里云 RDS（重庆） |
| 缓存 | Redis | 阿里云 ElastiCache |
| 支付 | 微信支付/支付宝 | 境内通道 |
| 文件存储 | 阿里云 OSS | 中国节点 |

### 6.2 InkCore（独立新建）

| 层 | 技术 | 部署 |
|----|------|------|
| 前端 | Next.js 14 + Tailwind | Cloudflare + AWS CloudFront |
| 后端 | Node.js + Express | AWS ECS/Fargate（Singapore） |
| 数据库 | PostgreSQL | AWS RDS（ap-southeast-1） |
| 缓存 | Redis | AWS ElastiCache（Singapore） |
| 支付 | Stripe + PayNow | 新加坡通道 |
| 文件存储 | AWS S3 | ap-southeast-1 |

**关键：两个项目各自独立，不共享代码库、不共享数据库、不共享部署。**

---

## 七、需要董事长确认

| # | 确认项 | 建议 | 说明 |
|---|--------|------|------|
| 1 | **两个独立项目确认** | ✅ | OPC 和 InkCore 各自独立，不是母子关系 |
| 2 | **InkCore 域名** | inkcore.sg | 独立品牌，独立域名 |
| 3 | **API 接口数量** | 仅3个 | 产品上架、收益回流、账号验证 |
| 4 | **数据库隔离** | 完全独立 | 中国 PG 与 新加坡 PG，无共享表 |
| 5 | **代码库独立** | 独立仓库 | 不共用 monorepo |
| 6 | **开发顺序** | 先 OPC 稳定，后 InkCore | OPC 开园后再启动 InkCore 开发 |
| 7 | **品牌名** | InkCore | 确认英文品牌名（2026-06-13 已确认） |

---

**CEO 理解：**
- OPC 是"创作者工具箱"（创作、生产、管理、B2B 任务）
- InkCore 是"独立销售店"（C 端展示、支付、交付、客服）
- 两个项目各自独立，仅通过 3 个 API 接口交互，最小化耦合
- InkCore 为 OPC 创作者提供变现通道，但两者不是母子关系

**CEO 签批：** 团坐009
**日期：** 2026-06-07 16:55（品牌更新：2026-06-13）
