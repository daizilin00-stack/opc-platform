# Docker 开发环境 - 配置文件同步检查清单

## 问题背景

2024-07-14 发生两次页面异常：
1. **500 错误** — 容器内 `tsconfig.json` 缺少 `paths` 配置，导致 `@/lib/pricing` 模块解析失败
2. **样式错乱** — 容器内缺失 `tailwind.config.js` 和 `postcss.config.js`，Tailwind CSS 品牌色和 `@apply` 指令失效

**根因：`docker-compose.yml` volume 挂载遗漏关键配置文件**，宿主机修改后容器未同步。

---

## 配置文件挂载对照表

### 前端 (frontend)

| 文件 | 挂载状态 | 用途 | 影响缺失 |
|------|----------|------|----------|
| `src/` | ✅ 已挂载 | 业务代码 | 无法热更新 |
| `public/` | ✅ 已挂载 | 静态资源 | 图片/字体不更新 |
| `package.json` | ✅ 已挂载 | 依赖管理 | 新增依赖不生效 |
| `tsconfig.json` | ✅ **已补** | TypeScript 配置、路径别名 | 模块解析失败 → 500 |
| `tailwind.config.js` | ✅ **已补** | 自定义品牌色、主题 | 样式错乱 |
| `postcss.config.js` | ✅ **已补** | CSS 处理链 | Tailwind 不编译 → @apply 失效 |
| `next.config.js` | ✅ **已补** | Next.js 路由、图片、重定向 | 路由/图片优化异常 |
| `next-env.d.ts` | ✅ **已补** | Next.js 类型声明 | TypeScript 报错 |
| `.env.local` | ✅ **已补** (ro) | 本地环境变量 | 环境变量不同步 |

### 后端 (backend)

| 文件 | 挂载状态 | 用途 | 影响缺失 |
|------|----------|------|----------|
| `src/` | ✅ 已挂载 | 业务代码 | 无法热更新 |
| `package.json` | ✅ 已挂载 | 依赖管理 | 新增依赖不生效 |
| `.env` | ✅ **已补** | 环境变量 | 配置不同步 |
| `scripts/` | ✅ **已补** | 工具脚本 | 脚本无法运行 |

---

## 应用配置变更的正确流程

### 方式一：重启容器（推荐，完全重建）

```bash
cd ~/opc-platform
docker-compose down
docker-compose up -d --build
```

### 方式二：热重载（仅修改源码时）

```bash
# 仅修改 src/ 内文件时，无需重启
docker-compose restart opc-frontend  # 或 opc-backend
```

### ⚠️ 修改以下文件时**必须**重启容器

- `docker-compose.yml`
- `tsconfig.json`
- `tailwind.config.js`
- `postcss.config.js`
- `next.config.js`
- `.env` / `.env.local`
- `package.json`（新增依赖）

---

## 快速诊断命令

```bash
# 1. 检查容器内关键文件是否存在
docker exec opc-frontend ls -la /app/ | grep -E 'tsconfig|tailwind|postcss|next.config'
docker exec opc-backend ls -la /app/ | grep -E '.env|scripts'

# 2. 检查模块解析是否正常
docker exec opc-frontend cat /app/tsconfig.json | grep '"@/\*"'

# 3. 检查 Tailwind 是否正常编译
curl -s http://localhost:3002/_next/static/css/app/layout.css | grep -c 'brand-600'

# 4. 检查容器日志
docker logs opc-frontend --tail 30
docker logs opc-backend --tail 30

# 5. 一键健康检查脚本
cd ~/opc-platform && ./scripts/health-check.sh
```

---

## 长期预防措施

### 1. 使用统一的 Docker 开发镜像

避免在容器内执行 `npm install`，改为在构建时固化依赖：

```dockerfile
# frontend/Dockerfile.dev
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
# 开发模式下通过 volume 挂载源码，但配置文件 COPY 进去
COPY tsconfig.json tailwind.config.js postcss.config.js next.config.js ./
CMD ["npm", "run", "dev"]
```

### 2. 建立 CI 检查

在 GitHub Actions 中添加检查，确保 docker-compose.yml 与配置文件清单一致：

```yaml
- name: Check docker-compose volume mounts
  run: |
    grep -q "tsconfig.json" docker-compose.yml || exit 1
    grep -q "tailwind.config.js" docker-compose.yml || exit 1
    grep -q "postcss.config.js" docker-compose.yml || exit 1
```

### 3. 配置文件变更通知

在团队中约定：修改任何根目录配置文件后，必须在 PR 描述中标注是否需要同步更新 `docker-compose.yml`。

---

## 相关文件

- `docker-compose.yml` — 容器编排配置
- `frontend/tsconfig.json` — TypeScript 配置
- `frontend/tailwind.config.js` — Tailwind 主题配置
- `frontend/postcss.config.js` — PostCSS 处理配置
- `frontend/next.config.js` — Next.js 配置

---

*记录时间：2026-07-14*
*问题修复：补全 docker-compose.yml volume 挂载 + 建立检查清单*
