#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ling API 高级功能专项测试
测试范围：Function Calling / JSON Mode / 品牌隔离 / Usage 精度 / 并发压测
"""

import os
import sys
import json
import time
import concurrent.futures
from urllib.parse import urljoin

import requests

BASE_URL = os.environ.get("LING_API_BASE_URL", "http://118.196.5.14:5208")
API_KEY = os.environ.get("LING_API_KEY", "")
TEST_MODELS = ["gpt-5.4", "claude-sonnet-5", "deepseek-v4-flash", "kimi-k2.5"]


def _headers():
    return {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }


def log(title, body=None):
    print(f"\n{'='*60}")
    print(f" {title}")
    print(f"{'='*60}")
    if body is not None:
        print(json.dumps(body, ensure_ascii=False, indent=2) if isinstance(body, dict) else body)


def check_key():
    if not API_KEY:
        print("❌ 请先设置 LING_API_KEY 环境变量")
        sys.exit(1)
    url = urljoin(BASE_URL, "/v1/models")
    r = requests.get(url, headers=_headers(), timeout=10)
    if r.status_code != 200:
        print(f"❌ API Key 无效: {r.status_code} {r.text[:200]}")
        sys.exit(1)
    log("✅ API Key 有效", {"models_count": len(r.json().get("data", []))})


def test_function_calling(model: str):
    """测试 Function Calling / Tools"""
    url = urljoin(BASE_URL, "/v1/chat/completions")
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": "查询上海明天天气"}],
        "tools": [{
            "type": "function",
            "function": {
                "name": "get_weather",
                "description": "获取指定城市的天气",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "city": {"type": "string", "description": "城市名"},
                        "date": {"type": "string", "description": "日期，格式 YYYY-MM-DD"}
                    },
                    "required": ["city"]
                }
            }
        }],
        "tool_choice": "auto",
        "max_tokens": 200
    }
    r = requests.post(url, headers=_headers(), json=payload, timeout=60)
    result = {
        "model": model,
        "status": r.status_code,
        "tool_calls": None,
        "finish_reason": None,
        "usage": None,
        "error": None
    }
    if r.status_code == 200:
        data = r.json()
        msg = data.get("choices", [{}])[0].get("message", {})
        result["tool_calls"] = msg.get("tool_calls")
        result["finish_reason"] = data.get("choices", [{}])[0].get("finish_reason")
        result["usage"] = data.get("usage")
    else:
        result["error"] = r.text[:300]
    return result


def test_json_mode(model: str):
    """测试 JSON Mode / Structured Output"""
    url = urljoin(BASE_URL, "/v1/chat/completions")
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "请用 JSON 格式输出，包含 name 和 age 字段。"},
            {"role": "user", "content": "创建一个叫 Alice、28 岁的用户。"}
        ],
        "response_format": {"type": "json_object"},
        "max_tokens": 200
    }
    r = requests.post(url, headers=_headers(), json=payload, timeout=60)
    result = {
        "model": model,
        "status": r.status_code,
        "content": None,
        "is_valid_json": False,
        "usage": None,
        "error": None
    }
    if r.status_code == 200:
        data = r.json()
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        result["content"] = content
        try:
            json.loads(content)
            result["is_valid_json"] = True
        except Exception as e:
            result["error"] = f"JSON 解析失败: {e}"
        result["usage"] = data.get("usage")
    else:
        result["error"] = r.text[:300]
    return result


def test_brand_isolation():
    """测试品牌隔离：响应头、错误信息脱敏"""
    # 1. 正常请求响应头
    r1 = requests.get(urljoin(BASE_URL, "/v1/models"), headers=_headers(), timeout=10)
    headers = {k: v for k, v in r1.headers.items() if any(x in k.lower() for x in ["new", "ling", "oneapi", "server", "x-request-id"])}

    # 2. 错误请求响应
    r2 = requests.post(urljoin(BASE_URL, "/v1/chat/completions"), headers={"Authorization": "Bearer invalid-key", "Content-Type": "application/json"}, json={"model": "gpt-5.4", "messages": []}, timeout=10)
    error_body = r2.json() if r2.status_code != 200 else {}

    # 3. 404 响应
    r3 = requests.get(urljoin(BASE_URL, "/v1/nonexistent"), headers=_headers(), timeout=10)
    error_body_404 = r3.json() if r3.status_code != 200 else {}

    return {
        "normal_headers": dict(r1.headers),
        "suspicious_headers": headers,
        "error_status": r2.status_code,
        "error_body": error_body,
        "404_status": r3.status_code,
        "404_body": error_body_404
    }


def test_usage_accuracy(model: str):
    """测试 usage 精度：非流式 vs 流式"""
    url = urljoin(BASE_URL, "/v1/chat/completions")
    prompt = "请列出三个中国古代诗人名字。"
    results = {"model": model}

    # 非流式
    r = requests.post(url, headers=_headers(), json={"model": model, "messages": [{"role": "user", "content": prompt}], "max_tokens": 60}, timeout=60)
    if r.status_code == 200:
        data = r.json()
        results["non_stream_usage"] = data.get("usage")
        results["non_stream_content"] = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    else:
        results["non_stream_error"] = r.text[:300]

    # 流式：收集 content 并对比 usage
    response_content = ""
    stream_usage = None
    try:
        r = requests.post(url, headers=_headers(), json={"model": model, "messages": [{"role": "user", "content": prompt}], "max_tokens": 60, "stream": True}, stream=True, timeout=60)
        for line in r.iter_lines():
            if line:
                line_str = line.decode("utf-8")
                if line_str.startswith("data: "):
                    chunk_str = line_str[6:]
                    if chunk_str == "[DONE]":
                        break
                    try:
                        chunk = json.loads(chunk_str)
                        delta = chunk.get("choices", [{}])[0].get("delta", {})
                        if delta.get("content"):
                            response_content += delta["content"]
                        usage = chunk.get("usage")
                        if usage:
                            stream_usage = usage
                    except Exception:
                        pass
        results["stream_usage"] = stream_usage
        results["stream_content"] = response_content
    except Exception as e:
        results["stream_error"] = str(e)

    return results


def test_concurrent(model: str, workers: int = 10, total: int = 30):
    """并发压测"""
    url = urljoin(BASE_URL, "/v1/chat/completions")
    payload = {"model": model, "messages": [{"role": "user", "content": "你好"}], "max_tokens": 20}

    def _req(i):
        start = time.time()
        try:
            r = requests.post(url, headers=_headers(), json=payload, timeout=30)
            latency = time.time() - start
            return {"index": i, "status": r.status_code, "latency": latency, "body": r.text[:200]}
        except Exception as e:
            return {"index": i, "status": -1, "latency": time.time() - start, "error": str(e)}

    start = time.time()
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as executor:
        futures = [executor.submit(_req, i) for i in range(total)]
        results = [f.result() for f in concurrent.futures.as_completed(futures)]
    total_time = time.time() - start

    statuses = {}
    for r in results:
        statuses[r["status"]] = statuses.get(r["status"], 0) + 1
    latencies = [r["latency"] for r in results if r["status"] == 200]

    return {
        "model": model,
        "workers": workers,
        "total_requests": total,
        "total_time_sec": round(total_time, 2),
        "rps": round(total / total_time, 2) if total_time > 0 else 0,
        "statuses": statuses,
        "success_rate": round(sum(1 for r in results if r["status"] == 200) / total * 100, 1),
        "avg_latency_ms": round(sum(latencies) / len(latencies) * 1000, 1) if latencies else None,
        "max_latency_ms": round(max(latencies) * 1000, 1) if latencies else None,
        "errors_sample": [r for r in results if r["status"] != 200][:3]
    }


def main():
    check_key()

    log("1. Function Calling / Tools 专项测试")
    fc_results = []
    for m in TEST_MODELS:
        fc_results.append(test_function_calling(m))
    for r in fc_results:
        log(f"Function Calling: {r['model']}", r)

    log("2. JSON Mode / Structured Output 专项测试")
    json_results = []
    for m in TEST_MODELS:
        json_results.append(test_json_mode(m))
    for r in json_results:
        log(f"JSON Mode: {r['model']}", r)

    log("3. 品牌隔离验证")
    brand = test_brand_isolation()
    log("品牌隔离结果", brand)

    log("4. Usage 计费精度验证（非流式 vs 流式）")
    usage_results = []
    for m in ["gpt-5.4", "deepseek-v4-flash"]:
        usage_results.append(test_usage_accuracy(m))
    for r in usage_results:
        log(f"Usage 精度: {r['model']}", r)

    log("5. 并发压测")
    concurrent_result = test_concurrent("gpt-5.4-mini", workers=10, total=30)
    log("并发压测结果 (gpt-5.4-mini, 10 workers, 30 requests)", concurrent_result)

    # 汇总报告
    summary = {
        "function_calling": {r["model"]: {"supported": r["tool_calls"] is not None, "finish_reason": r["finish_reason"]} for r in fc_results},
        "json_mode": {r["model"]: {"supported": r["is_valid_json"], "status": r["status"]} for r in json_results},
        "brand_exposure": {
            "has_new_api_headers": any("new" in k.lower() for k in brand["normal_headers"].keys()),
            "has_oneapi_headers": any("oneapi" in k.lower() for k in brand["normal_headers"].keys()),
            "error_message": str(brand["error_body"])
        }
    }
    log("📊 测试汇总", summary)


if __name__ == "__main__":
    main()
