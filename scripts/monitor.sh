#!/bin/bash
# OPC 平台综合监控脚本 - 生产环境版
# 集成飞书告警、日志记录、自动恢复

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="${SCRIPT_DIR}/.."
LOG_DIR="${PROJECT_DIR}/logs/monitor"
ENV_FILE="${PROJECT_DIR}/infra/.env.feishu"

# 加载飞书配置
if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
fi

# 创建日志目录
mkdir -p "$LOG_DIR"

# 日志文件
LOG_FILE="${LOG_DIR}/monitor-$(date +%Y%m%d).log"
ALERT_LOG="${LOG_DIR}/alerts-$(date +%Y%m%d).log"

# 记录日志
log() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo "$msg" | tee -a "$LOG_FILE"
}

# 发送告警（带防重复）
send_alert() {
    local level="$1"
    local title="$2"
    local content="$3"
    local alert_key="${level}:$title"
    local alert_hash=$(echo "$alert_key" | md5 | head -c 8)
    local last_alert_file="${LOG_DIR}/.last-alert-${alert_hash}"
    local cooldown=300  # 5分钟冷却时间
    
    # 检查冷却期
    if [ -f "$last_alert_file" ]; then
        local last_time=$(cat "$last_alert_file")
        local now=$(date +%s)
        local diff=$((now - last_time))
        if [ $diff -lt $cooldown ]; then
            log "告警冷却中: $title (${diff}s/${cooldown}s)"
            return 0
        fi
    fi
    
    # 记录告警日志
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $title: $content" >> "$ALERT_LOG"
    
    # 发送飞书告警
    if [ "${FEISHU_ENABLED}" = "true" ] && [ -n "${FEISHU_WEBHOOK_URL}" ]; then
        "${SCRIPT_DIR}/feishu-alert.sh" "$level" "$title" "$content"
    fi
    
    # 更新最后告警时间
    date +%s > "$last_alert_file"
}

# 检查容器
check_containers() {
    local failed=0
    local failed_services=""
    
    for container in opc-frontend opc-backend opc-postgres opc-redis; do
        if ! docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
            failed=$((failed + 1))
            failed_services="${failed_services}${container} "
            log "✗ 容器离线: $container"
        else
            log "✓ 容器正常: $container"
        fi
    done
    
    if [ $failed -gt 0 ]; then
        send_alert "error" "容器离线告警" "以下容器未运行: ${failed_services}\n请立即检查 Docker 服务状态。"
        
        # 尝试自动恢复
        log "尝试自动恢复容器..."
        cd "$PROJECT_DIR" && docker-compose up -d
        sleep 5
        
        # 再次检查
        local still_failed=0
        for container in opc-frontend opc-backend opc-postgres opc-redis; do
            if ! docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
                still_failed=$((still_failed + 1))
            fi
        done
        
        if [ $still_failed -eq 0 ]; then
            send_alert "success" "容器自动恢复成功" "所有容器已自动重启并正常运行。"
        else
            send_alert "error" "容器自动恢复失败" "自动重启后仍有容器异常，需要人工介入。"
        fi
    fi
    
    return $failed
}

# 检查 HTTP 服务
check_http_services() {
    local failed=0
    
    # 前端
    local frontend_code
    frontend_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3002/" 2>/dev/null || echo "000")
    if [ "$frontend_code" != "200" ]; then
        log "✗ 前端异常: HTTP $frontend_code"
        send_alert "error" "前端服务异常" "首页返回 HTTP $frontend_code，期望 200。"
        failed=$((failed + 1))
    else
        log "✓ 前端正常: HTTP 200"
    fi
    
    # 后端
    local backend_code
    backend_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3003/api/health" 2>/dev/null || echo "000")
    if [ "$backend_code" != "200" ]; then
        log "✗ 后端异常: HTTP $backend_code"
        send_alert "error" "后端服务异常" "健康检查返回 HTTP $backend_code，期望 200。"
        failed=$((failed + 1))
    else
        log "✓ 后端正常: HTTP 200"
    fi
    
    return $failed
}

# 检查前端样式编译
check_frontend_assets() {
    if curl -s "http://localhost:3002/_next/static/css/app/layout.css" 2>/dev/null | grep -q "brand-600"; then
        log "✓ 前端样式编译正常"
        return 0
    else
        log "✗ 前端样式编译异常"
        send_alert "warning" "前端样式异常" "Tailwind CSS 品牌色未正确编译，页面可能显示异常。"
        return 1
    fi
}

# 检查数据库连接
check_database() {
    if docker exec opc-postgres pg_isready -U opc 2>/dev/null | grep -q "accepting connections"; then
        log "✓ 数据库连接正常"
        return 0
    else
        log "✗ 数据库连接异常"
        send_alert "error" "数据库连接异常" "PostgreSQL 无法接受连接，请检查数据库状态。"
        return 1
    fi
}

# 检查磁盘空间
check_disk_space() {
    local usage
    usage=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [ "$usage" -gt 90 ]; then
        log "✗ 磁盘空间不足: ${usage}%"
        send_alert "error" "磁盘空间告警" "磁盘使用率 ${usage}%，请立即清理空间。"
        return 1
    elif [ "$usage" -gt 80 ]; then
        log "⚠ 磁盘空间预警: ${usage}%"
        send_alert "warning" "磁盘空间预警" "磁盘使用率 ${usage}%，建议清理日志和缓存。"
        return 1
    else
        log "✓ 磁盘空间充足: ${usage}%"
        return 0
    fi
}

# 检查容器日志错误
check_logs() {
    local errors=0
    local since="5m"
    
    # 检查前端错误日志
    local frontend_errors
    frontend_errors=$(docker logs opc-frontend --since "$since" 2>&1 | grep -c "error\|Error\|ERROR\|fatal\|Fatal\|FATAL" 2>/dev/null | tr -d '\n' || echo "0")
    if [ "$frontend_errors" -gt 0 ]; then
        log "⚠ 前端 ${since}内发现 ${frontend_errors} 条错误日志"
        # 不重复告警，只记录日志
    fi
    
    # 检查后端错误日志
    local backend_errors
    backend_errors=$(docker logs opc-backend --since "$since" 2>&1 | grep -c "error\|Error\|ERROR\|fatal\|Fatal\|FATAL" 2>/dev/null | tr -d '\n' || echo "0")
    if [ "$backend_errors" -gt 0 ]; then
        log "⚠ 后端 ${since}内发现 ${backend_errors} 条错误日志"
        if [ "$backend_errors" -gt 10 ]; then
            send_alert "warning" "后端错误日志激增" "过去 ${since}内发现 ${backend_errors} 条错误，建议检查服务状态。"
        fi
    fi
    
    return 0
}

# 检查配置文件挂载
check_config_mounts() {
    local failed=0
    
    for file in "/app/tsconfig.json" "/app/tailwind.config.js" "/app/postcss.config.js" "/app/next.config.js"; do
        if ! docker exec opc-frontend test -f "$file" 2>/dev/null; then
            log "✗ 前端配置未挂载: $file"
            failed=$((failed + 1))
        fi
    done
    
    if [ $failed -gt 0 ]; then
        send_alert "error" "配置文件挂载异常" "${failed} 个配置文件未正确挂载，需要重启容器。"
    else
        log "✓ 配置文件挂载正常"
    fi
    
    return $failed
}

# 主检查流程
main() {
    log "========================================"
    log "开始综合监控检查"
    log "========================================"
    
    local total_errors=0
    
    check_containers || total_errors=$((total_errors + $?))
    check_http_services || total_errors=$((total_errors + $?))
    check_frontend_assets || total_errors=$((total_errors + $?))
    check_database || total_errors=$((total_errors + $?))
    check_disk_space || total_errors=$((total_errors + $?))
    check_logs
    check_config_mounts || total_errors=$((total_errors + $?))
    
    log "========================================"
    if [ $total_errors -eq 0 ]; then
        log "✓ 所有检查通过，系统健康"
        # 每天只发送一次成功通知（避免刷屏）
        local today=$(date +%Y%m%d)
        local success_file="${LOG_DIR}/.success-${today}"
        if [ ! -f "$success_file" ]; then
            touch "$success_file"
            # 可选：发送每日健康报告
            # send_alert "success" "系统健康日报" "所有监控项正常，系统运行稳定。"
        fi
    else
        log "✗ 发现 ${total_errors} 个问题"
    fi
    log ""
    
    # 清理旧日志（保留30天）
    find "$LOG_DIR" -name "monitor-*.log" -mtime +30 -delete 2>/dev/null || true
    find "$LOG_DIR" -name "alerts-*.log" -mtime +30 -delete 2>/dev/null || true
    find "$LOG_DIR" -name ".last-alert-*" -mtime +1 -delete 2>/dev/null || true
    find "$LOG_DIR" -name ".success-*" -mtime +7 -delete 2>/dev/null || true
    
    return $total_errors
}

main
