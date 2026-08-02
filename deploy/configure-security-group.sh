#!/bin/bash
set -e

# OPC 数字平台 - ECS 安全组配置脚本
# 需要：aliyun CLI 已安装并配置（aliyun configure）
# 用法：./configure-security-group.sh [安全组ID] [SSH来源CIDR]

SECURITY_GROUP_ID="${1:-}"
SSH_SOURCE="${2:-$(curl -s ifconfig.me)/32}"
REGION="${ALIBABA_CLOUD_REGION:-cn-hangzhou}"

if ! command -v aliyun &> /dev/null; then
    echo "错误：未安装 aliyun CLI"
    echo "安装：curl -fsSL https://aliyun-cli.oss-cn-hangzhou.aliyuncs.com/install.sh | bash"
    exit 1
fi

if [ -z "$SECURITY_GROUP_ID" ]; then
    echo "错误：请提供安全组 ID"
    echo "用法：$0 sg-bp67acfmxazb4p*******"
    echo "查询安全组：aliyun ecs DescribeSecurityGroups --RegionId $REGION"
    exit 1
fi

echo "=== 配置 ECS 安全组 $SECURITY_GROUP_ID ==="
echo "SSH 来源：$SSH_SOURCE"
echo "区域：$REGION"

# 添加安全组规则
add_rule() {
    local port=$1
    local cidr=$2
    local desc=$3

    echo "添加规则：$port $cidr ($desc)"
    aliyun ecs AuthorizeSecurityGroup \
        --RegionId "$REGION" \
        --SecurityGroupId "$SECURITY_GROUP_ID" \
        --IpProtocol tcp \
        --PortRange "${port}/${port}" \
        --SourceCidrIp "$cidr" \
        --Policy accept \
        --Description "$desc" \
        2>&1 || echo "规则可能已存在：$port $cidr"
}

# HTTP/HTTPS 开放给所有人
add_rule 80 "0.0.0.0/0" "HTTP for opc-platform"
add_rule 443 "0.0.0.0/0" "HTTPS for opc-platform"

# SSH 仅允许指定来源
add_rule 22 "$SSH_SOURCE" "SSH admin access"

echo "=== 安全组配置完成 ==="
