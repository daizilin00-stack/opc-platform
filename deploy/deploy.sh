#!/bin/bash
set -e

# OPC 数字平台 - 生产部署脚本
# 在 ECS 上的 /opt/opc-platform 目录运行

APP_DIR="/opt/opc-platform"
DEPLOY_DIR="$APP_DIR/deploy"

echo "=== OPC 生产部署开始 ==="
cd "$APP_DIR"

# 1. 检查 .env.prod
if [ ! -f "$DEPLOY_DIR/.env.prod" ]; then
    echo "错误：$DEPLOY_DIR/.env.prod 不存在，请先复制 .env.prod.example 并填写"
    exit 1
fi

# 加载环境变量
export $(grep -v '^#' "$DEPLOY_DIR/.env.prod" | xargs)

# 2. 拉取最新代码（如果是 git 仓库）
if [ -d ".git" ]; then
    git pull origin main || true
fi

# 3. 构建并启动生产容器
cd "$DEPLOY_DIR"
docker compose -f docker-compose.prod.yml --env-file .env.prod down || true
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# 4. 等待后端健康
sleep 5
for i in {1..30}; do
    if curl -s http://127.0.0.1:3003/api/health | grep -q '"status":"ok"'; then
        echo "后端健康检查通过"
        break
    fi
    echo "等待后端启动... $i/30"
    sleep 2
    if [ "$i" -eq 30 ]; then
        echo "后端健康检查失败"
        exit 1
    fi
done

# 5. 配置 Nginx（兼容 conf.d 与 sites-available 两种目录结构）
NGINX_CONF_DIR="/etc/nginx/conf.d"
if [ -d "/etc/nginx/sites-available" ] && [ -d "/etc/nginx/sites-enabled" ]; then
    NGINX_CONF_DIR="/etc/nginx/sites-available"
    if [ ! -L /etc/nginx/sites-enabled/opc.conf ]; then
        cp "$DEPLOY_DIR/nginx/opc.conf" /etc/nginx/sites-available/opc.conf
        sed -i "s/csdp-agentwork.com/${DOMAIN}/g" /etc/nginx/sites-available/opc.conf
        ln -sf /etc/nginx/sites-available/opc.conf /etc/nginx/sites-enabled/opc.conf
    else
        cp "$DEPLOY_DIR/nginx/opc.conf" /etc/nginx/sites-available/opc.conf
        sed -i "s/csdp-agentwork.com/${DOMAIN}/g" /etc/nginx/sites-available/opc.conf
    fi
else
    cp "$DEPLOY_DIR/nginx/opc.conf" /etc/nginx/conf.d/opc.conf
    sed -i "s/csdp-agentwork.com/${DOMAIN}/g" /etc/nginx/conf.d/opc.conf
fi

# 6. 配置 SSL（如果还没有证书）
if [ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
    echo "SSL 证书尚未配置，请在 DNS 解析生效后运行 ssl-setup.sh"
else
    nginx -t && systemctl reload nginx
fi

echo "=== OPC 生产部署完成 ==="
echo "访问地址：https://${DOMAIN}"
