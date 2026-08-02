# InkCore 计划（InkCore Project）

> **代号：** InkCore
> **全称：** InkCore 计划 — 新加坡数字商品内容平台
> **关联项目：** OPC 数字平台（OpenClaw Partner Center）—— 两者为独立项目，通过 API 连通
> **立项日期：** 2026-06-07
> **命名者：** Celine（董事长）
> **CEO：** 团坐009

---

## 命名含义

**InkCore** — 取"Ink"（墨水/创意）与"Core"（核心/内核）之意。

寓意：
- Ink：创意如墨，内容创作之源
- Core：数字商品的核心交易平台
- InkCore：创意内容的核心引擎，让数字商品自由流通

---

## 项目定位

**InkCore = 独立的新加坡数字商品内容平台（C2C）**

**核心关系：OPC 与 InkCore 是两个独立项目**
- OPC 中新数据港（中国）：B2B 创业服务平台，数字员工、任务大厅、创作者生产工具
- InkCore（新加坡）：C2C 数字商品交易平台，面向东南亚消费者，售卖数字商品

**连接方式：后台 API 连通**
- OPC 创作者在后台创作数字商品 → 一键上架到 InkCore 销售
- InkCore 销售收益回流到 OPC 创作者钱包，方便变现
- 两个平台独立运营、独立品牌、独立数据库，仅通过最小化 API 接口交互

---

## 项目架构

```
OPC 中新数据港（中国）                    InkCore（新加坡）
│                                         │
├─ 创业者门户                              ├─ 数字商品商店（C2C）
├─ 数字员工集群                            ├─ 消费者前台
├─ 任务大厅（B2B）                         ├─ 支付系统（Stripe/PayNow）
├─ 数字产品仓库（创作者生产）              ├─ 自动交付系统
│                                         ├─ 卖家后台
│    ┌───────────────┐                     │
└───▶│ 产品上架 API  │────────────────────▶└─ 商品上架、销售、交付
     │ 收益回流 API  │◀─────────────────────┘
     └───────────────┘
```

---

## 品牌体系

| 场景 | 名称 | 域名 |
|------|------|------|
| 中国平台 | OPC 中新数据港 | csdport.cn |
| 新加坡平台 | InkCore | inkcore.sg |
| 数字商品商店 | InkCore Store | store.inkcore.sg |
| 创作者平台 | InkCore Creator | creator.inkcore.sg |
| 卖家后台 | InkCore Seller | seller.inkcore.sg |

---

## 文档索引

- [OPC 架构文档](architecture.md) — OPC 系统架构
- [InkCore 架构文档](inkcore-architecture.md) — InkCore 系统架构
- [OPC ↔ InkCore 接口设计](opc-inkcore-interface.md) — 两平台 API 对接规范
- [跨境电商战略](cross-border-ecommerce-strategy.md) — 产供销闭环
- [项目进度](project-status.md) — 每日进度更新
- [待办清单](todo-list.md) — 任务跟踪

---

*立项时间：2026-06-07 16:04 GMT+8*
*记录人：团坐009*
*品牌更新：2026-06-13 — 墨核/MOHE 正式更名为 InkCore*
