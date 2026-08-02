#!/bin/bash
# 飞书告警推送脚本
# 用法: ./scripts/feishu-alert.sh [info|warning|error|success] "标题" "内容"

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../infra/.env.feishu"

# 加载配置
if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
fi

# 检查是否启用
if [ "${FEISHU_ENABLED}" != "true" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 飞书告警未启用，跳过推送"
    exit 0
fi

# 检查 Webhook URL
if [ -z "${FEISHU_WEBHOOK_URL}" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 错误: FEISHU_WEBHOOK_URL 未配置"
    exit 1
fi

# 参数解析
LEVEL="${1:-info}"
TITLE="${2:-告警通知}"
CONTENT="${3:-暂无详情}"

# 根据级别设置颜色
case "$LEVEL" in
    info)
        COLOR="blue"
        ;;
    warning)
        COLOR="orange"
        ;;
    error)
        COLOR="red"
        ;;
    success)
        COLOR="green"
        ;;
    *)
        COLOR="blue"
        ;;
esac

# 生成签名（如果配置了密钥）
generate_sign() {
    local timestamp=$(date +%s)
    local secret="${FEISHU_SECRET}"
    
    if [ -n "$secret" ]; then
        local sign=$(echo -n "${timestamp}\n${secret}" | openssl dgst -sha256 -hmac "$secret" -binary | base64)
        echo "\"timestamp\": \"${timestamp}\", \"sign\": \"${sign}\","
    fi
}

# 构建消息体
TIMESTAMP_SIGN=$(generate_sign)

# 发送消息
send_message() {
    local json_payload
    
    # 使用 interactive 卡片消息，更美观
    json_payload=$(cat <<EOF
{
    ${TIMESTAMP_SIGN}
    "msg_type": "interactive",
    "card": {
        "header": {
            "title": {
                "tag": "plain_text",
                "content": "🖥️ OPC 平台告警"
            },
            "template": "${COLOR}"
        },
        "elements": [
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": "**${TITLE}**"
                }
            },
            {
                "tag": "div",
                "text": {
                    "tag": "plain_text",
                    "content": "${CONTENT}"
                }
            },
            {
                "tag": "hr"
            },
            {
                "tag": "note",
                "elements": [
                    {
                        "tag": "plain_text",
                        "content": "时间: $(date '+%Y-%m-%d %H:%M:%S') | 级别: ${LEVEL}"
                    }
                ]
            }
        ]
    }
}
EOF
)

    local response
    local http_code
    
    response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$json_payload" \
        "${FEISHU_WEBHOOK_URL}" 2>/dev/null || echo "\n000")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] 飞书告警发送成功"
        return 0
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] 飞书告警发送失败: HTTP $http_code"
        echo "响应: $body"
        return 1
    fi
}

send_message
