#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ling API 测试脚本
测试联调环境连接和基本功能
"""

import requests
import json
import sys

# 配置
BASE_URL = "http://118.196.5.14:5208"
TENANT_NAME = "Celine_dev_use"
PASSWORD = "Lucky_66"

def test_connection():
    """测试基础连接"""
    print(f"🌐 测试连接到 {BASE_URL}...")
    try:
        # 先尝试根路径
        response = requests.get(f"{BASE_URL}/", timeout=10)
        print(f"  ✅ 根路径连接成功: HTTP {response.status_code}")
        print(f"  响应: {response.text[:200]}")
        return True
    except Exception as e:
        print(f"  ❌ 连接失败: {e}")
        return False

def test_login():
    """测试登录获取 Token"""
    print(f"\n🔑 测试登录...")
    print(f"  账号: {TENANT_NAME}")
    
    try:
        # 常见的登录路径尝试
        endpoints = [
            "/api/auth/login",
            "/auth/login",
            "/login",
            "/api/v1/login",
            "/v1/auth/login"
        ]
        
        for endpoint in endpoints:
            url = f"{BASE_URL}{endpoint}"
            print(f"\n  尝试: {url}")
            try:
                response = requests.post(
                    url,
                    json={
                        "username": TENANT_NAME,
                        "password": PASSWORD
                    },
                    timeout=10,
                    headers={"Content-Type": "application/json"}
                )
                print(f"  状态: HTTP {response.status_code}")
                print(f"  响应: {response.text[:500]}")
                
                if response.status_code == 200:
                    print(f"  ✅ 登录成功!")
                    return response.json()
            except Exception as e:
                print(f"  失败: {e}")
                continue
        
        print(f"\n  ⚠️ 所有登录路径尝试失败")
        return None
        
    except Exception as e:
        print(f"  ❌ 登录测试失败: {e}")
        return None

def test_api_docs():
    """检查 API 文档端点"""
    print(f"\n📚 检查 API 文档...")
    
    doc_endpoints = [
        "/docs",
        "/swagger",
        "/api-docs",
        "/openapi.json",
        "/api/v1/docs"
    ]
    
    for endpoint in doc_endpoints:
        url = f"{BASE_URL}{endpoint}"
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print(f"  ✅ 发现文档: {url}")
                print(f"  内容类型: {response.headers.get('content-type', 'unknown')}")
                return True
        except:
            continue
    
    print(f"  ⚠️ 未找到 API 文档")
    return False

def main():
    print("=" * 60)
    print("Ling API 联调测试")
    print(f"目标: {BASE_URL}")
    print("=" * 60)
    
    # 测试 1: 基础连接
    connected = test_connection()
    
    # 测试 2: API 文档
    test_api_docs()
    
    # 测试 3: 登录
    if connected:
        token_data = test_login()
        if token_data:
            print(f"\n✅ 测试完成，登录成功")
            print(f"Token 数据: {json.dumps(token_data, indent=2, ensure_ascii=False)[:500]}")
        else:
            print(f"\n⚠️ 测试完成，但登录未成功，可能需要确认 API 路径")
    else:
        print(f"\n❌ 无法连接到服务器，请检查:")
        print(f"  1. 网络是否可以访问 {BASE_URL}")
        print(f"  2. 服务器是否已启动")
        print(f"  3. 端口 5208 是否开放")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()
