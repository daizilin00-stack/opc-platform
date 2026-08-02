#!/usr/bin/env bash
set -euo pipefail

WORKSPACE="/Users/celine/.openclaw/workspace"
PROJECT="${WORKSPACE}/opc-platform"
NOW=$(date '+%Y-%m-%d %H:%M %z')

# Build report
cd "${PROJECT}"

## Git summary
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "N/A")
GIT_LAST_COMMIT=$(git log -1 --format="%h %s (%cr)" 2>/dev/null || echo "N/A")
GIT_DIRTY=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
UNTRACKED=$(git status --porcelain 2>/dev/null | grep '^??' | wc -l | tr -d ' ')

## Recent commits
RECENT_COMMITS=$(git log --oneline -5 2>/dev/null || echo "N/A")

## Docker status
DOCKER_STATUS=$(docker ps --filter "name=opc" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "Docker unavailable")

## Service health
FRONTEND_HEALTH=$(curl -s --max-time 5 -o /dev/null -w "%{http_code}" http://localhost:3002/ 2>/dev/null || echo "ERR")
BACKEND_HEALTH=$(curl -s --max-time 5 -o /dev/null -w "%{http_code}" http://localhost:3003/api/health 2>/dev/null || echo "ERR")
NEWAPI_HEALTH=$(curl -s --max-time 5 -o /dev/null -w "%{http_code}" http://localhost:3004/api/status 2>/dev/null || echo "ERR")

## Compose status
COMPOSE_STATUS=$(docker compose ps --format "table {{.Service}}\t{{.Status}}" 2>/dev/null || echo "Compose ps unavailable")

REPORT=$(cat <<EOF
🖥️ OPC 项目进度同步
时间：${NOW}

📦 Git 分支：${GIT_BRANCH}
✅ 最新提交：${GIT_LAST_COMMIT}
📝 未提交变更：${GIT_DIRTY}（未跟踪：${UNTRACKED}）

📌 最近提交：
${RECENT_COMMITS}

🐳 Docker 容器状态：
${DOCKER_STATUS}

🔌 服务健康：
- 前端 (3002): ${FRONTEND_HEALTH}
- 后端 (3003/api/health): ${BACKEND_HEALTH}
- NewAPI (3004/api/status): ${NEWAPI_HEALTH}

${COMPOSE_STATUS}
EOF
)

# Send via OpenClaw WeChat
openclaw message send \
  --channel openclaw-weixin \
  --account 79714117b5a3-im-bot \
  --target "o9cq806pdVQAhg6v_E5kDhXg71Bo@im.wechat" \
  --message "${REPORT}"
