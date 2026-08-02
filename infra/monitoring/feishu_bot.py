#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Feishu (Lark) Bot Notification Module
Sends messages to Feishu group via webhook
"""

import json
import requests
import os
from datetime import datetime
from pathlib import Path

# Load config
CONFIG_FILE = Path(__file__).parent / ".env.monitor"
webhook_url = "https://open.feishu.cn/open-apis/bot/v2/hook/e6c81890-087d-45dd-b352-55851b726bab"

def send_text_message(content: str, title: str = None):
    """Send plain text message"""
    msg = {
        "msg_type": "text",
        "content": {
            "text": f"{title}\n{content}" if title else content
        }
    }
    return _send(msg)

def send_rich_card(title: str, elements: list):
    """Send interactive rich card message"""
    msg = {
        "msg_type": "interactive",
        "card": {
            "config": {
                "wide_screen_mode": True,
                "enable_forward": True
            },
            "header": {
                "title": {
                    "tag": "plain_text",
                    "content": title
                },
                "template": "red" if "告警" in title or "异常" in title else "green"
            },
            "elements": elements
        }
    }
    return _send(msg)

def send_status_report(status_data: dict):
    """Send system status report card"""
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    elements = [
        {
            "tag": "div",
            "text": {
                "tag": "lark_md",
                "content": f"**📅 检查时间：** {now}"
            }
        },
        {"tag": "hr"},
        {
            "tag": "div",
            "text": {
                "tag": "lark_md",
                "content": "**🌐 服务状态**"
            }
        }
    ]
    
    # Add service status
    for service, info in status_data.items():
        status_emoji = "✅" if info.get("status") == "ok" else "❌"
        detail = info.get("detail", "")
        elements.append({
            "tag": "div",
            "text": {
                "tag": "lark_md",
                "content": f"{status_emoji} **{service}**：{detail}"
            }
        })
    
    title = "🔔 OPC 系统状态报告" if all(s.get("status") == "ok" for s in status_data.values()) else "🚨 OPC 系统异常告警"
    return send_rich_card(title, elements)

def send_alert(service_name: str, issue: str, detail: str = ""):
    """Send alert notification"""
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    elements = [
        {
            "tag": "div",
            "text": {
                "tag": "lark_md",
                "content": f"**⏰ 时间：** {now}\n**🔴 服务：** {service_name}\n**⚠️ 问题：** {issue}"
            }
        }
    ]
    if detail:
        elements.append({
            "tag": "div",
            "text": {
                "tag": "lark_md",
                "content": f"**详情：** {detail}"
            }
        })
    
    return send_rich_card(f"🚨 OPC 告警：{service_name}", elements)

def _send(payload: dict):
    """Send request to Feishu webhook"""
    try:
        headers = {"Content-Type": "application/json; charset=utf-8"}
        response = requests.post(
            webhook_url,
            headers=headers,
            data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
            timeout=10
        )
        result = response.json()
        if result.get("code") == 0:
            print(f"✅ Message sent successfully")
            return True
        else:
            print(f"❌ Failed to send message: {result}")
            return False
    except Exception as e:
        print(f"❌ Error sending message: {e}")
        return False

if __name__ == "__main__":
    # Test send
    send_text_message("OPC 监控机器人已启动 🚀", "测试消息")
