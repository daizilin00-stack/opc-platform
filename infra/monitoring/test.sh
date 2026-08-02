#!/bin/bash
# OPC Monitoring Quick Test Script
cd "$(dirname "$0")"

echo "🧪 Testing Feishu Bot..."
python3 feishu_bot.py

echo ""
echo "🔍 Running full monitoring check..."
python3 monitor.py
