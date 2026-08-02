#!/bin/bash
set -e

# OPC 数字平台 - SSL 证书配置脚本（Let's Encrypt + certbot）
# 前提：域名已解析到本机公网 IP，Nginx 已安装

# 加载环境变量
DEPLOY_DIR="/opt/opc-platform/deploy"
if [ -f "$DEPLOY_DIR/.env.prod" ]; then
    export $(grep -v '^#' "$DEPLOY_DIR/.env.prod" | xargs)
fi

DOMAIN=${DOMAIN:-csdp-agentwork.com}

echo "=== 为 $DOMAIN 配置 SSL 证书 ==="

# 安装 certbot
if ! command -v certbot &> /dev/null; then
    apt-get install -y certbot python3-certbot-nginx
fi

# 获取证书（自动配置 Nginx）
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email admin@"$DOMAIN" || true

# 配置自动续期
if command -v certbot &> /dev/null; then
    echo "0 3 * * * root certbot renew --quiet" > /etc/cron.d/certbot-renew
fi

nginx -t && systemctl reload nginx

echo "=== SSL 配置完成 ==="
echo "证书路径：/etc/letsencrypt/live/$DOMAIN/"
