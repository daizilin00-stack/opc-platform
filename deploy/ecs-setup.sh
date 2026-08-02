#!/bin/bash
set -e

# OPC 数字平台 - ECS 初始化脚本
# 适用：阿里云 ECS 2C2G，Ubuntu 22.04/24.04
# 以 root 权限运行

echo "=== OPC ECS 初始化开始 ==="

# 1. 系统更新
apt-get update
apt-get install -y curl wget git vim htop ufw

# 2. 安装 Docker
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

# 3. 安装 Docker Compose v2
if ! command -v docker compose &> /dev/null; then
    apt-get install -y docker-compose-plugin
fi

# 4. 安装 Nginx
if ! command -v nginx &> /dev/null; then
    apt-get install -y nginx
    systemctl enable nginx
fi

# 5. 配置时区
timedatectl set-timezone Asia/Shanghai

# 6. 配置 SWAP（2C2G 建议 2G swap）
if ! swapon -s | grep -q swapfile; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# 7. 创建部署目录
mkdir -p /opt/opc-platform
mkdir -p /var/www/certbot

# 8. 配置 UFW 防火墙
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "=== ECS 初始化完成 ==="
echo "下一步："
echo "  1. 上传 opc-platform 代码到 /opt/opc-platform"
echo "  2. 复制 deploy/.env.prod.example 为 .env.prod 并填写真实值"
echo "  3. 运行 /opt/opc-platform/deploy/deploy.sh"
