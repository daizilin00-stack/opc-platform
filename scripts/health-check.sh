#!/bin/bash
# OPC 平台 Docker 开发环境健康检查脚本
# 用法: cd ~/opc-platform && ./scripts/health-check.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "  OPC 平台 Docker 环境健康检查"
echo "=========================================="
echo ""

ERRORS=0
WARNINGS=0

# 检查容器运行状态
check_container() {
    local name=$1
    local container=$2
    
    if docker ps | grep -q "$container"; then
        echo -e "${GREEN}✓${NC} $name 运行中"
    else
        echo -e "${RED}✗${NC} $name 未运行"
        ERRORS=$((ERRORS + 1))
    fi
}

# 检查文件挂载
check_file_mounted() {
    local container=$1
    local file=$2
    local desc=$3
    local type=${4:-file}
    
    if [ "$type" = "dir" ]; then
        if docker exec "$container" test -d "$file" 2>/dev/null; then
            echo -e "${GREEN}✓${NC} $desc 已挂载 ($file)"
        else
            echo -e "${RED}✗${NC} $desc 未挂载 ($file)"
            ERRORS=$((ERRORS + 1))
        fi
    else
        if docker exec "$container" test -f "$file" 2>/dev/null; then
            echo -e "${GREEN}✓${NC} $desc 已挂载 ($file)"
        else
            echo -e "${RED}✗${NC} $desc 未挂载 ($file)"
            ERRORS=$((ERRORS + 1))
        fi
    fi
}

# 检查 HTTP 响应
check_http() {
    local url=$1
    local desc=$2
    local expected=${3:-200}
    
    local code
    code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$code" = "$expected" ]; then
        echo -e "${GREEN}✓${NC} $desc 响应正常 (HTTP $code)"
    else
        echo -e "${RED}✗${NC} $desc 异常 (HTTP $code, 期望 $expected)"
        ERRORS=$((ERRORS + 1))
    fi
}

# 1. 容器状态
echo "【容器状态】"
check_container "前端 (opc-frontend)" "opc-frontend"
check_container "后端 (opc-backend)" "opc-backend"
check_container "PostgreSQL" "opc-postgres"
check_container "Redis" "opc-redis"
echo ""

# 2. 前端关键文件挂载
echo "【前端配置文件挂载】"
check_file_mounted "opc-frontend" "/app/tsconfig.json" "tsconfig.json"
check_file_mounted "opc-frontend" "/app/tailwind.config.js" "tailwind.config.js"
check_file_mounted "opc-frontend" "/app/postcss.config.js" "postcss.config.js"
check_file_mounted "opc-frontend" "/app/next.config.js" "next.config.js"
check_file_mounted "opc-frontend" "/app/next-env.d.ts" "next-env.d.ts"
echo ""

# 3. 后端关键文件挂载
echo "【后端配置文件挂载】"
check_file_mounted "opc-backend" "/app/.env" ".env"
check_file_mounted "opc-backend" "/app/scripts" "scripts/" dir
echo ""

# 4. 前端模块解析检查
echo "【前端模块解析】"
if docker exec opc-frontend grep -q '"@/\*"' /app/tsconfig.json 2>/dev/null; then
    echo -e "${GREEN}✓${NC} 路径别名 @/* 配置正确"
else
    echo -e "${RED}✗${NC} 路径别名 @/* 配置缺失"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 5. 前端样式编译检查
echo "【前端样式编译】"
if curl -s "http://localhost:3002/_next/static/css/app/layout.css" 2>/dev/null | grep -q "brand-600"; then
    echo -e "${GREEN}✓${NC} Tailwind 品牌色已编译"
else
    echo -e "${RED}✗${NC} Tailwind 品牌色未编译"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 6. HTTP 服务检查
echo "【HTTP 服务响应】"
check_http "http://localhost:3002/" "前端首页" 200
check_http "http://localhost:3003/api/health" "后端健康接口" 200
echo ""

# 7. 数据库连接检查
echo "【数据库连接】"
if docker exec opc-backend node -e "require('pg')" 2>/dev/null; then
    echo -e "${YELLOW}!${NC} 数据库连接请通过后端日志确认"
else
    echo -e "${YELLOW}!${NC} 未安装 pg 模块，跳过数据库检查"
fi
echo ""

# 总结
echo "=========================================="
if [ "$ERRORS" -eq 0 ]; then
    echo -e "${GREEN}✓ 所有检查通过，环境健康${NC}"
elif [ "$ERRORS" -le 2 ]; then
    echo -e "${YELLOW}! 发现 $ERRORS 个问题，建议修复${NC}"
else
    echo -e "${RED}✗ 发现 $ERRORS 个问题，需要立即处理${NC}"
fi
echo "=========================================="

exit $ERRORS
