# Docker Desktop 安装指南 (macOS)

> 准备人: 团坐009
> 日期: 2026-06-22

---

## 📥 下载 Docker Desktop

**官方下载地址：**
https://www.docker.com/products/docker-desktop/

**或直接下载（Apple Silicon）：**
https://desktop.docker.com/mac/main/arm64/Docker.dmg

---

## 🔧 安装步骤

1. 双击下载的 `Docker.dmg`
2. 将 `Docker.app` 拖到 `Applications` 文件夹
3. 打开启动台 → 点击 Docker 图标启动
4. 按提示输入 Mac 密码（用于安装系统组件）
5. 接受许可协议
6. 等待 "Docker Desktop starting..." 完成

---

## ✅ 验证安装

打开终端，依次执行：

```bash
# 检查 Docker 版本
docker --version

# 检查 Docker Compose 版本
docker compose version

# 运行测试容器
docker run hello-world

# 查看运行中的容器
docker ps
```

---

## 🚀 启动 OPC 项目

Docker 安装完成后，在项目目录执行：

```bash
cd ~/opc-platform

# 启动全部服务（后端 + 前端 + 数据库 + Redis）
docker compose up -d

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f backend
```

---

## 🌐 访问地址

| 服务 | 地址 |
|------|------|
| 前端门户 | http://localhost:3000 |
| 后端 API | http://localhost:3001 |
| API 健康检查 | http://localhost:3001/api/health |

---

## 📋 常用命令

```bash
# 停止服务
docker compose down

# 重启服务
docker compose restart

# 查看数据库
docker exec -it opc-postgres psql -U opc -d opc_db

# 进入后端容器
docker exec -it opc-backend sh

# 重建（修改代码后）
docker compose up -d --build
```

---

## ⚠️ 已知问题

1. **Apple Silicon (M1/M2/M3)** - Docker Desktop 已原生支持，无需 Rosetta
2. **首次启动较慢** - 需要下载基础镜像，请耐心等待
3. **端口冲突** - 确保 3000/3001/5432/6379 端口未被占用

---

## 🔗 相关文档

- `docker-compose.yml` - 服务编排配置
- `backend/.env` - 后端环境变量
- `frontend/.env.local` - 前端环境变量
