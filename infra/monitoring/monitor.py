#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OPC Platform Monitoring Script
Checks all services and sends notifications via Feishu
"""

import sys
import time
import socket
import subprocess
import requests
from pathlib import Path
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))
from feishu_bot import send_status_report, send_alert

# Configuration
FRONTEND_URL = "http://localhost:3002"
BACKEND_URL = "http://localhost:3003"
API_HEALTH_ENDPOINT = "http://localhost:3003/api/health"
DB_HOST = "localhost"
DB_PORT = 5432
REDIS_HOST = "localhost"
REDIS_PORT = 6379
DOCKER_SERVICES = ["opc-backend", "opc-frontend", "opc-postgres", "opc-redis"]
RESPONSE_TIME_THRESHOLD = 3  # seconds

class ServiceChecker:
    def __init__(self):
        self.results = {}
    
    def check_all(self):
        """Run all checks and return results"""
        self.results = {}
        
        # Check Docker containers
        self._check_docker()
        
        # Check Frontend
        self._check_frontend()
        
        # Check Backend
        self._check_backend()
        
        # Check Database
        self._check_database()
        
        # Check Redis
        self._check_redis()
        
        return self.results
    
    def _check_docker(self):
        """Check if Docker containers are running"""
        try:
            result = subprocess.run(
                ["docker", "ps", "--format", "{{.Names}}"],
                capture_output=True, text=True, timeout=10
            )
            running = result.stdout.strip().split('\n')
            
            missing = [s for s in DOCKER_SERVICES if s not in running]
            
            if missing:
                self.results["Docker 容器"] = {
                    "status": "error",
                    "detail": f"以下容器未运行: {', '.join(missing)}",
                    "missing": missing
                }
            else:
                self.results["Docker 容器"] = {
                    "status": "ok",
                    "detail": f"全部 {len(DOCKER_SERVICES)} 个容器运行正常"
                }
        except Exception as e:
            self.results["Docker 容器"] = {
                "status": "error",
                "detail": f"检查失败: {str(e)}"
            }
    
    def _check_frontend(self):
        """Check if frontend is accessible"""
        try:
            start = time.time()
            response = requests.get(FRONTEND_URL, timeout=10)
            elapsed = time.time() - start
            
            if response.status_code == 200:
                if elapsed > RESPONSE_TIME_THRESHOLD:
                    self.results["前端服务"] = {
                        "status": "warning",
                        "detail": f"响应慢 ({elapsed:.2f}s)"
                    }
                else:
                    self.results["前端服务"] = {
                        "status": "ok",
                        "detail": f"正常 (响应 {elapsed:.2f}s)"
                    }
            else:
                self.results["前端服务"] = {
                    "status": "error",
                    "detail": f"HTTP {response.status_code}"
                }
        except requests.exceptions.ConnectionError:
            self.results["前端服务"] = {
                "status": "error",
                "detail": "无法连接"
            }
        except Exception as e:
            self.results["前端服务"] = {
                "status": "error",
                "detail": f"检查失败: {str(e)}"
            }
    
    def _check_backend(self):
        """Check if backend API is accessible"""
        try:
            start = time.time()
            response = requests.get(BACKEND_URL, timeout=10)
            elapsed = time.time() - start
            
            if response.status_code in [200, 404]:  # 404 is ok for root path
                # Try health endpoint if available
                health_status = self._check_health_endpoint()
                
                if health_status:
                    self.results["后端 API"] = {
                        "status": "ok",
                        "detail": f"正常 ({elapsed:.2f}s) + 健康检查通过"
                    }
                else:
                    self.results["后端 API"] = {
                        "status": "warning",
                        "detail": f"可访问但健康检查失败"
                    }
            else:
                self.results["后端 API"] = {
                    "status": "error",
                    "detail": f"HTTP {response.status_code}"
                }
        except requests.exceptions.ConnectionError:
            self.results["后端 API"] = {
                "status": "error",
                "detail": "无法连接"
            }
        except Exception as e:
            self.results["后端 API"] = {
                "status": "error",
                "detail": f"检查失败: {str(e)}"
            }
    
    def _check_health_endpoint(self):
        """Check health endpoint if available"""
        try:
            response = requests.get(API_HEALTH_ENDPOINT, timeout=5)
            return response.status_code == 200
        except:
            return False
    
    def _check_database(self):
        """Check if PostgreSQL is accessible"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            result = sock.connect_ex((DB_HOST, DB_PORT))
            sock.close()
            
            if result == 0:
                self.results["PostgreSQL"] = {
                    "status": "ok",
                    "detail": "端口 5432 可连接"
                }
            else:
                self.results["PostgreSQL"] = {
                    "status": "error",
                    "detail": f"端口 5432 连接失败 (错误码: {result})"
                }
        except Exception as e:
            self.results["PostgreSQL"] = {
                "status": "error",
                "detail": f"检查失败: {str(e)}"
            }
    
    def _check_redis(self):
        """Check if Redis is accessible"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            result = sock.connect_ex((REDIS_HOST, REDIS_PORT))
            sock.close()
            
            if result == 0:
                self.results["Redis"] = {
                    "status": "ok",
                    "detail": "端口 6379 可连接"
                }
            else:
                self.results["Redis"] = {
                    "status": "error",
                    "detail": f"端口 6379 连接失败 (错误码: {result})"
                }
        except Exception as e:
            self.results["Redis"] = {
                "status": "error",
                "detail": f"检查失败: {str(e)}"
            }

def main():
    """Main monitoring function"""
    print(f"🔍 Starting OPC monitoring check at {datetime.now()}")
    
    checker = ServiceChecker()
    results = checker.check_all()
    
    # Print results to console
    print("\n📊 Check Results:")
    for service, info in results.items():
        status = info["status"]
        emoji = {"ok": "✅", "warning": "⚠️", "error": "❌"}.get(status, "❓")
        print(f"  {emoji} {service}: {info['detail']}")
    
    # Send notification
    has_errors = any(info["status"] == "error" for info in results.values())
    has_warnings = any(info["status"] == "warning" for info in results.values())
    
    if has_errors or has_warnings:
        print(f"\n🚨 Issues detected, sending alert...")
        # Send alert for each issue
        for service, info in results.items():
            if info["status"] in ["error", "warning"]:
                send_alert(service, info["detail"])
    else:
        print(f"\n✅ All services normal, sending status report...")
    
    # Always send status report
    send_status_report(results)
    
    print(f"\n✅ Monitoring check completed at {datetime.now()}")
    return 0 if not has_errors else 1

if __name__ == "__main__":
    sys.exit(main())
