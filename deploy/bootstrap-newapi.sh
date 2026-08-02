#!/bin/bash
set -e

# 在 ECS 上首次启动 NewAPI 后运行：
# 1. 修改 root 密码
# 2. 创建 LingAPI 上游渠道
# 3. 配置模型定价
# 4. 创建 OPC 调用 token

# 加载 .env.prod
DEPLOY_DIR="/opt/opc-platform/deploy"
if [ -f "$DEPLOY_DIR/.env.prod" ]; then
    export $(grep -v '^#' "$DEPLOY_DIR/.env.prod" | xargs)
fi

NEWAPI_URL="http://127.0.0.1:3004"
ROOT_PASSWORD="${NEWAPI_ROOT_PASSWORD:-opc-platform-2026}"
NEW_PASSWORD="${NEWAPI_ROOT_PASSWORD:-CHANGE_ME_PASSWORD}"
LINGAPI_KEY="${LINGAPI_API_KEY:-}"

echo "=== NewAPI 生产环境初始化 ==="

# 等待 NewAPI 启动
for i in {1..30}; do
    if curl -s "$NEWAPI_URL/api/status" | grep -q success; then
        echo "NewAPI 已启动"
        break
    fi
    echo "等待 NewAPI 启动... $i/30"
    sleep 2
done

# 登录获取 session
COOKIE_JAR=/tmp/newapi_cookies.txt
rm -f "$COOKIE_JAR"
curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" -X POST "$NEWAPI_URL/api/user/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"root\",\"password\":\"$ROOT_PASSWORD\"}" > /dev/null

HEADERS=(-H "New-Api-User: 1")

# 修改 root 密码（如果提供了新密码）
if [ -n "$NEW_PASSWORD" ] && [ "$NEW_PASSWORD" != "$ROOT_PASSWORD" ]; then
    echo "修改 root 密码..."
    curl -s -b "$COOKIE_JAR" "${HEADERS[@]}" -X PUT "$NEWAPI_URL/api/user/self" \
        -H "Content-Type: application/json" \
        -d "{\"password\":\"$NEW_PASSWORD\"}" > /dev/null
fi

# 创建 LingAPI 上游渠道（如果不存在）
CHANNEL_COUNT=$(curl -s -b "$COOKIE_JAR" "${HEADERS[@]}" "$NEWAPI_URL/api/channel/" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['total'])")
if [ "$CHANNEL_COUNT" -eq "0" ]; then
    echo "创建 LingAPI 上游渠道..."
    curl -s -b "$COOKIE_JAR" "${HEADERS[@]}" -X POST "$NEWAPI_URL/api/channel/" \
        -H "Content-Type: application/json" \
        -d "{
            \"type\": 1,
            \"name\": \"LingAPI-主渠道\",
            \"base_url\": \"http://118.196.5.14:5208\",
            \"key\": \"$LINGAPI_KEY\",
            \"models\": \"gpt-5.5,gpt-5.4-mini,gpt-5.4,claude-sonnet-5,claude-sonnet-4-6,deepseek-v4-flash,deepseek-v4-pro,kimi-k2.5,gemini-3.5-flash\",
            \"test_model\": \"gpt-5.4-mini\",
            \"status\": 1
        }" > /dev/null
else
    echo "上游渠道已存在，跳过创建"
fi

# 配置模型定价
echo "配置模型定价..."
cd /opt/opc-platform/backend/scripts
python3 configure-newapi-pricing.py

# 创建 OPC 调用 token
echo "创建 OPC 调用 token..."
TOKEN_RESPONSE=$(curl -s -b "$COOKIE_JAR" "${HEADERS[@]}" -X POST "$NEWAPI_URL/api/token/" \
    -H "Content-Type: application/json" \
    -d '{"name":"OPC-Production","unlimited_quota":true,"model_limits_enabled":false}')

echo "Token 创建结果：$TOKEN_RESPONSE"

echo "=== NewAPI 初始化完成 ==="
echo "提示：token 的明文 key 需要在 NewAPI 后台查看，然后填入 .env.prod 的 NEWAPI_API_KEY"
