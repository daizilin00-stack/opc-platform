# OPC 平台 - 生产环境运维手册

**生效日期**: 2026-07-14  
**负责人**: AI 运维助手 (团坐009)  
**告警通道**: 飞书机器人  
**监控频率**: 每 5 分钟

---

## 目录

1. [架构概览](#架构概览)
2. [监控体系](#监控体系)
3. [告警规则](#告警规则)
4. [应急响应](#应急响应)
5. [日常维护](#日常维护)
6. [变更管理](#变更管理)
7. [灾备恢复](#灾备恢复)

---

## 架构概览

### 服务拓扑

```
用户 → Nginx (端口 80/443)
       ├──→ 前端 Next.js (端口 3002)
       └──→ 后端 API (端口 3003)
              ├──→ PostgreSQL (端口 5432)
              └──→ Redis (端口 6379)
```

### 容器清单

| 容器名 | 服务 | 端口 | 重启策略 |
|--------|------|------|----------|
| opc-frontend | Next.js 前端 | 3002→3000 | unless-stopped |
| opc-backend | Node.js API | 3003→3001 | unless-stopped |
| opc-postgres | PostgreSQL 15 | 5432 | unless-stopped |
| opc-redis | Redis 7 | 6379 | unless-stopped |

---

## 监控体系

### 自动监控（每 5 分钟）

由 `scripts/monitor.sh` 执行，检查结果记录到 `logs/monitor/` 目录。

| 检查项 | 正常标准 | 异常处理 |
|--------|----------|----------|
| 容器状态 | 4 个容器全部 Running | 自动重启，失败则告警 |
| HTTP 前端 | 首页返回 HTTP 200 | 告警，检查日志 |
| HTTP 后端 | /api/health 返回 200 | 告警，检查日志 |
| 前端样式 | CSS 包含 brand-600 | 告警，检查配置挂载 |
| 数据库 | pg_isready 返回 accepting | 告警 |
| 磁盘空间 | 使用率 < 80% | >80% 预警，>90% 告警 |
| 错误日志 | 5 分钟内 < 10 条 | >10 条 告警 |
| 配置挂载 | 5 个配置文件全部存在 | 告警，需重启容器 |

### 监控日志位置

```
opc-platform/
└── logs/
    ├── monitor/
    │   ├── monitor-20260714.log      # 每日检查日志
    │   ├── alerts-20260714.log       # 每日告警记录
    │   └── .last-alert-xxxxxx        # 告警冷却标记
    ├── launchd-monitor.log           # launchd 输出日志
    └── cron-monitor.log              # cron 输出日志
```

---

## 告警规则

### 告警级别定义

| 级别 | 颜色 | 响应时间 | 示例 |
|------|------|----------|------|
| P0 - 致命 | 🔴 红色 | 立即处理 | 服务完全不可用、数据丢失 |
| P1 - 严重 | 🟠 橙色 | 15 分钟内 | 部分功能异常、性能严重下降 |
| P2 - 警告 | 🔵 蓝色 | 1 小时内 | 磁盘空间预警、错误日志增多 |
| P3 - 信息 | 🟢 绿色 | 无需处理 | 系统恢复通知、每日健康报告 |

### 告警冷却机制

同一问题的告警 5 分钟内只发送一次，避免飞书消息轰炸。

---

## 应急响应

### 故障分级响应

#### P0 - 服务完全不可用

**判断标准**: 前端和后端同时返回非 200 状态码

**自动操作**:
1. 发送飞书 P0 告警
2. 尝试自动重启所有容器
3. 记录故障时间戳

**人工操作** (Celine 或值班人员):
1. 确认告警真实性
2. 如自动恢复失败，登录服务器手动排查:
   ```bash
   cd ~/opc-platform
   docker-compose logs -f --tail 100
   ```
3. 如数据库损坏，启动灾备恢复流程

#### P1 - 部分服务异常

**判断标准**: 单一服务异常（如前端正常但后端 500）

**自动操作**:
1. 发送飞书 P1 告警
2. 标记异常服务

**人工操作**:
1. 查看具体服务日志:
   ```bash
   docker logs opc-backend --tail 100
   ```
2. 如涉及代码问题，回滚到上一个稳定版本

#### P2 - 预警

**判断标准**: 磁盘 >80%、错误日志增多等

**自动操作**:
1. 发送飞书 P2 告警
2. 记录到日志

**人工操作**:
1. 磁盘预警: 清理日志或扩容
2. 错误日志: 分析错误模式，决定是否需要热修复

### 常用应急命令

```bash
# 查看所有容器状态
docker ps

# 查看实时日志
docker logs -f opc-frontend
docker logs -f opc-backend

# 重启单个服务
docker-compose restart opc-frontend

# 重启全部服务
cd ~/opc-platform && docker-compose down && docker-compose up -d

# 进入容器调试
docker exec -it opc-frontend sh
docker exec -it opc-backend sh

# 数据库备份
pg_dump -h localhost -U opc opc_db > backup-$(date +%Y%m%d-%H%M%S).sql

# 检查磁盘
 df -h
```

---

## 日常维护

### 每日（自动）

- [x] 每 5 分钟自动健康检查
- [x] 错误日志扫描
- [x] 磁盘空间检查

### 每周（人工确认）

- [ ] 检查监控日志，确认无遗漏告警
- [ ] 验证备份文件可恢复性
- [ ] 检查安全漏洞（npm audit）
- [ ] 清理过期日志（>30 天）

### 每月

- [ ] 灾备恢复演练
- [ ] 性能基线回顾
- [ ] 更新运维文档
- [ ] 检查证书有效期（SSL）

---

## 变更管理

### 变更分级

| 级别 | 定义 | 审批 | 执行窗口 |
|------|------|------|----------|
| 标准变更 | 配置调整、日志清理 | AI 自动执行 | 任意时间 |
| 常规变更 | 代码更新、依赖升级 | Celine 审批 | 低峰时段 |
| 重大变更 | 架构调整、数据库迁移 | Celine 审批 + 方案评审 | 维护窗口 |

### 变更流程

1. **提交**: 在 Git 提交变更，标注变更级别和影响范围
2. **评审**: 常规以上级别需 Celine 确认
3. **Staging**: 先在预发布环境验证
4. **发布**: 蓝绿部署或滚动更新
5. **验证**: 自动监控检查通过
6. **回滚**: 如验证失败，自动回滚到上一版本

### 禁止操作（红线条款）

- ❌ 直接修改生产数据库结构
- ❌ 无备份情况下删除数据
- ❌ 未经验证的代码直接部署
- ❌ 关闭安全日志记录
- ❌ 将生产凭证提交到 Git

---

## 灾备恢复

### 备份策略

| 数据 | 频率 | 保留期 | 位置 |
|------|------|--------|------|
| PostgreSQL 数据库 | 每日 02:00 全量 | 30 天 | 本地 + 云存储 |
| Redis 数据 | 每日 02:00 RDB | 7 天 | 本地 |
| 配置文件 | Git 版本控制 | 永久 | GitHub |
| 用户上传文件 | 实时同步 | 永久 | 对象存储 |

### 恢复流程

#### 场景 1: 单个容器崩溃

```bash
# 自动恢复
  cd ~/opc-platform && docker-compose up -d <服务名>
```

#### 场景 2: 数据库损坏

```bash
# 1. 停止服务
docker-compose stop opc-backend

# 2. 从备份恢复
psql -h localhost -U opc opc_db < backup-YYYYMMDD-HHMMSS.sql

# 3. 重启服务
docker-compose up -d opc-backend

# 4. 验证数据完整性
```

#### 场景 3: 服务器完全故障

1. 在新服务器上克隆代码仓库
2. 恢复 `.env` 配置文件
3. 恢复数据库备份
4. 执行 `docker-compose up -d`
5. 更新 DNS 指向新服务器

### RTO / RPO 目标

| 指标 | 目标 | 说明 |
|------|------|------|
| RTO | < 30 分钟 | 恢复业务运行时间 |
| RPO | < 5 分钟 | 数据丢失上限 |

---

## 飞书告警配置

### 获取 Webhook URL

1. 打开飞书群 → 点击右上角「设置」
2. 选择「群机器人」→「添加机器人」
3. 选择「自定义机器人」
4. 复制 Webhook URL
5. 如需安全设置，记录签名密钥

### 配置写入

编辑文件：`infra/.env.feishu`

```bash
FEISHU_WEBHOOK_URL="https://open.feishu.cn/open-apis/bot/v2/hook/xxxxxx"
FEISHU_SECRET="可选的签名密钥"
FEISHU_ENABLED="true"
```

### 测试告警

```bash
cd ~/opc-platform
./scripts/feishu-alert.sh info "测试告警" "这是一条测试消息，确认飞书通道正常。"
```

---

## 联系人与升级

| 角色 | 联系人 | 联系方式 |
|------|--------|----------|
| 技术负责人 | Celine | 飞书/微信 |
| AI 运维 | 团坐009 | 本系统 |
| 外部支持 | 云服务提供商 | 工单系统 |

### 升级路径

1. AI 自动处理 → 2. 通知 Celine → 3. Celine 决策 → 4. 如需外部支持，开云服务工单

---

## 附录

### A. 监控脚本清单

| 脚本 | 路径 | 用途 |
|------|------|------|
| monitor.sh | scripts/monitor.sh | 综合监控（每 5 分钟） |
| health-check.sh | scripts/health-check.sh | 手动健康检查 |
| feishu-alert.sh | scripts/feishu-alert.sh | 飞书告警推送 |

### B. 关键文件清单

| 文件 | 路径 | 变更需重启 |
|------|------|-----------|
| docker-compose.yml | ./docker-compose.yml | 是 |
| 前端配置 | frontend/tsconfig.json | 是 |
| 前端样式 | frontend/tailwind.config.js | 是 |
| 前端构建 | frontend/postcss.config.js | 是 |
| 前端路由 | frontend/next.config.js | 是 |
| 后端环境 | backend/.env | 是 |
| 后端依赖 | backend/package.json | 是 |

### C. 变更记录

| 日期 | 变更内容 | 执行人 |
|------|----------|--------|
| 2026-07-14 | 建立完整运维体系、飞书告警 | 团坐009 |

---

*本文档由 AI 运维助手维护，任何变更需记录到变更记录表。*
