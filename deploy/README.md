# OPC 数字平台 - 生产部署指南

## 环境要求

- 阿里云 ECS 2C2G（国内节点）
- Ubuntu 22.04/24.04
- 域名已解析到 ECS 公网 IP

## 目录结构

```
deploy/
├── docker-compose.prod.yml       # 生产 Docker Compose
├── .env.prod.example             # 环境变量模板
├── .env.prod                     # 真实环境变量（不提交 git）
├── ecs-setup.sh                  # ECS 首次初始化
├── deploy.sh                     # 部署/更新脚本
├── ssl-setup.sh                  # SSL 证书配置
├── bootstrap-newapi.sh           # NewAPI 首次初始化
├── configure-security-group.sh   # ECS 安全组配置（可选）
└── nginx/
    └── opc.conf                  # Nginx 反向代理配置
```

## 部署步骤

### 1. 本地准备

在 ECS 上执行前，先在本地生成生产环境变量：

```bash
# 本仓库已预生成 deploy/.env.prod，请检查并修改其中的敏感值
cat deploy/.env.prod
```

### 2. 上传代码到 ECS

```bash
# 方式 A：git clone
ssh root@YOUR_ECS_IP "cd /opt && git clone YOUR_REPO opc-platform"

# 方式 B：rsync
rsync -avz --exclude=node_modules --exclude=.next --exclude=dist \
  ./ root@YOUR_ECS_IP:/opt/opc-platform/
```

### 3. 配置 ECS 安全组

**方式 A：自动脚本（需要 aliyun CLI）**

```bash
ssh root@YOUR_ECS_IP
cd /opt/opc-platform/deploy

# 查询安全组 ID
aliyun ecs DescribeSecurityGroups --RegionId cn-hangzhou

# 配置安全组（替换 sg-xxx 为你的安全组 ID）
./configure-security-group.sh sg-xxx
```

**方式 B：手动在阿里云控制台配置**

进入 **ECS 控制台 → 安全组 → 配置规则 → 入方向**，添加：

| 端口 | 来源 | 说明 |
|------|------|------|
| 22 | 你的办公 IP/32 | SSH 管理 |
| 80 | 0.0.0.0/0 | HTTP 访问 |
| 443 | 0.0.0.0/0 | HTTPS 访问 |

> 注意：3002/3003/3004 不需要对公网开放，Nginx 通过 127.0.0.1 访问容器。

### 4. ECS 初始化

```bash
ssh root@YOUR_ECS_IP
cd /opt/opc-platform/deploy
chmod +x ecs-setup.sh
./ecs-setup.sh
```

### 5. 检查环境变量

```bash
# 在 ECS 上
cd /opt/opc-platform/deploy
cat .env.prod
# 确认已填入：
# - 数据库密码
# - JWT_SECRET（随机长字符串）
# - LingAPI API Key
# - NewAPI session secret / root 密码
```

### 6. 执行部署

```bash
cd /opt/opc-platform/deploy
chmod +x deploy.sh
./deploy.sh
```

### 7. 初始化 NewAPI（首次部署）

```bash
cd /opt/opc-platform/deploy
./bootstrap-newapi.sh
```

然后登录 NewAPI 后台，复制 `OPC-Production` token 的完整 key，填入 `.env.prod` 的 `NEWAPI_API_KEY`，再重新部署后端：

```bash
./deploy.sh
```

### 8. 配置 SSL

确保域名 DNS 已解析到 ECS IP：

```bash
cd /opt/opc-platform/deploy
chmod +x ssl-setup.sh
./ssl-setup.sh
```

## 更新部署

```bash
cd /opt/opc-platform
git pull origin main
cd deploy
./deploy.sh
```

## 运维命令

```bash
# 查看容器状态
docker compose -f docker-compose.prod.yml ps

# 查看日志
docker compose -f docker-compose.prod.yml logs -f backend

# 重启服务
docker compose -f docker-compose.prod.yml restart backend

# 进入数据库
docker compose -f docker-compose.prod.yml exec postgres psql -U opc -d opc_db
```

## 注意事项

1. **2C2G 内存紧张**：生产容器已限制 PostgreSQL/Redis 内存，建议开园前升级到 2C4G
2. **安全组**：仅开放 22、80、443 端口到公网
3. **备份**：定期备份 PostgreSQL 数据卷
4. **备案**：国内节点需要 ICP 备案后才能正式对外访问
5. **.env.prod**：包含敏感信息，已加入 `.gitignore`，请勿提交
