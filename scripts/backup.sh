#!/bin/bash
# OPC 平台自动备份脚本
# 备份项：PostgreSQL 业务库、NewAPI SQLite 数据库
# 本地保留 + 预留 OSS/S3 远程上传接口

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKUP_DIR="${PROJECT_DIR}/backups"
ENV_FILE="${PROJECT_DIR}/infra/.env.backup"
FEISHU_ENV="${PROJECT_DIR}/infra/.env.feishu"
LOG_DIR="${PROJECT_DIR}/logs/backup"

# 默认配置
KEEP_DAYS=7
POSTGRES_CONTAINER="opc-postgres"
NEWAPI_CONTAINER="opc-newapi"
POSTGRES_DB="opc_db"
POSTGRES_USER="opc"
# 生产 compose 里不暴露 5432，优先用容器内 pg_dump
BACKUP_MODE="docker"  # docker | direct

# 加载环境变量
[ -f "$ENV_FILE" ] && source "$ENV_FILE"
[ -f "$FEISHU_ENV" ] && source "$FEISHU_ENV"

# 创建目录
mkdir -p "$BACKUP_DIR/postgres"
mkdir -p "$BACKUP_DIR/newapi"
mkdir -p "$LOG_DIR"

# 日志文件
LOG_FILE="${LOG_DIR}/backup-$(date +%Y%m%d).log"
ALERT_LOG="${LOG_DIR}/alerts-$(date +%Y%m%d).log"

log() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo "$msg" | tee -a "$LOG_FILE"
}

send_alert() {
    local level="$1"
    local title="$2"
    local content="$3"

    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $title: $content" >> "$ALERT_LOG"

    if [ "${FEISHU_ENABLED}" = "true" ] && [ -n "${FEISHU_WEBHOOK_URL}" ]; then
        "${SCRIPT_DIR}/feishu-alert.sh" "$level" "$title" "$content"
    fi
}

# 远程上传接口（预留实现）
# 接入方式：配置 AWS CLI / ossutil / rclone 后在此实现
upload_to_remote() {
    local file="$1"
    local type="$2"  # postgres | newapi

    if [ "${REMOTE_UPLOAD_ENABLED}" != "true" ]; then
        log "远程上传未启用，跳过: $file"
        return 0
    fi

    local remote_path=""
    case "$REMOTE_PROVIDER" in
        oss)
            # 示例：ossutil cp "$file" "oss://${OSS_BUCKET}/${OSS_PREFIX}/$(basename "$file")"
            remote_path="oss://${OSS_BUCKET}/${OSS_PREFIX}/${type}/$(basename "$file")"
            ;;
        s3)
            # 示例：aws s3 cp "$file" "s3://${S3_BUCKET}/${S3_PREFIX}/$(basename "$file")"
            remote_path="s3://${S3_BUCKET}/${S3_PREFIX}/${type}/$(basename "$file")"
            ;;
        rclone)
            # 示例：rclone copy "$file" "${RCLONE_REMOTE}:${RCLONE_PREFIX}/${type}/"
            remote_path="${RCLONE_REMOTE}:${RCLONE_PREFIX}/${type}/$(basename "$file")"
            ;;
        *)
            log "不支持的远程上传提供商: ${REMOTE_PROVIDER}"
            return 1
            ;;
    esac

    log "上传至远程: $remote_path"
    # TODO: 接入具体命令后取消下面注释
    # if ! <upload_command_here>; then
    #     send_alert "error" "备份远程上传失败" "文件: $file\n目标: $remote_path"
    #     return 1
    # fi
    log "远程上传接口已预留，未执行真实上传。配置 REMOTE_UPLOAD_ENABLED=true 并实现对应命令后启用。"
    return 0
}

# 备份 PostgreSQL
backup_postgres() {
    local timestamp
    timestamp=$(date +%Y%m%d-%H%M%S)
    local filename="opc-postgres-${timestamp}.sql.gz"
    local filepath="${BACKUP_DIR}/postgres/${filename}"

    log "========================================"
    log "开始 PostgreSQL 备份: $filename"

    if ! docker ps --format '{{.Names}}' | grep -q "^${POSTGRES_CONTAINER}$"; then
        send_alert "error" "PostgreSQL 备份失败" "容器 ${POSTGRES_CONTAINER} 未运行"
        return 1
    fi

    if [ "$BACKUP_MODE" = "docker" ]; then
        docker exec -e PGPASSWORD="${POSTGRES_PASSWORD}" "${POSTGRES_CONTAINER}" \
            pg_dump -h localhost -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" --no-owner --no-acl | gzip > "$filepath"
    else
        PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump -h localhost -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" --no-owner --no-acl | gzip > "$filepath"
    fi

    local size
    size=$(du -h "$filepath" | awk '{print $1}')
    log "✓ PostgreSQL 备份完成: $filepath ($size)"

    upload_to_remote "$filepath" "postgres"
    return 0
}

# 备份 NewAPI SQLite
backup_newapi() {
    local timestamp
    timestamp=$(date +%Y%m%d-%H%M%S)
    local filename="opc-newapi-${timestamp}.db.gz"
    local filepath="${BACKUP_DIR}/newapi/${filename}"

    log "========================================"
    log "开始 NewAPI 备份: $filename"

    if ! docker ps --format '{{.Names}}' | grep -q "^${NEWAPI_CONTAINER}$"; then
        send_alert "error" "NewAPI 备份失败" "容器 ${NEWAPI_CONTAINER} 未运行"
        return 1
    fi

    # NewAPI 使用 SQLite，路径 /data/one-api.db
    # 用 docker cp 先复制到临时位置，再压缩，避免直接压缩运行时 WAL 文件
    local tmpfile="/tmp/one-api-${timestamp}.db"
    docker cp "${NEWAPI_CONTAINER}:/data/one-api.db" "$tmpfile"
    gzip -c "$tmpfile" > "$filepath"
    rm -f "$tmpfile"

    local size
    size=$(du -h "$filepath" | awk '{print $1}')
    log "✓ NewAPI 备份完成: $filepath ($size)"

    upload_to_remote "$filepath" "newapi"
    return 0
}

# 清理旧备份
cleanup_old_backups() {
    log "========================================"
    log "清理 ${KEEP_DAYS} 天前的旧备份"

    local deleted=0
    deleted=$((deleted + $(find "${BACKUP_DIR}/postgres" -name 'opc-postgres-*.sql.gz' -mtime +${KEEP_DAYS} -delete -print | wc -l)))
    deleted=$((deleted + $(find "${BACKUP_DIR}/newapi" -name 'opc-newapi-*.db.gz' -mtime +${KEEP_DAYS} -delete -print | wc -l)))

    log "✓ 已清理 ${deleted} 个旧备份文件"

    # 日志文件保留 30 天
    find "$LOG_DIR" -name 'backup-*.log' -mtime +30 -delete 2>/dev/null || true
    find "$LOG_DIR" -name 'alerts-*.log' -mtime +30 -delete 2>/dev/null || true
}

# 主流程
main() {
    log "========================================"
    log "开始 OPC 平台自动备份"
    log "备份目录: $BACKUP_DIR"
    log "保留天数: $KEEP_DAYS"
    log "========================================"

    local total_errors=0

    backup_postgres || total_errors=$((total_errors + 1))
    backup_newapi || total_errors=$((total_errors + 1))
    cleanup_old_backups

    log "========================================"
    if [ $total_errors -eq 0 ]; then
        log "✓ 备份任务全部完成"
        # 每天只发送一次成功通知，避免刷屏
        local today
        today=$(date +%Y%m%d)
        local success_file="${LOG_DIR}/.success-${today}"
        if [ ! -f "$success_file" ]; then
            touch "$success_file"
            # 可选：发送每日成功通知
            # send_alert "success" "备份成功" "PostgreSQL 和 NewAPI 备份已完成，保留 ${KEEP_DAYS} 天。"
        fi
    else
        log "✗ 备份任务失败 ${total_errors} 项"
        send_alert "error" "备份任务失败" "有 ${total_errors} 项备份失败，请检查日志: ${LOG_FILE}"
    fi
    log ""

    return $total_errors
}

main
