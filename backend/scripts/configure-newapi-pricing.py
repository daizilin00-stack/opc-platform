#!/usr/bin/env python3
"""Configure NewAPI model pricing based on OPC backend pricing.js"""
import json
import os
import requests

NEWAPI_BASE = "http://localhost:3004"
LOGIN = {"username": "root", "password": os.environ.get("NEWAPI_ROOT_PASSWORD", "opc-platform-2026")}

session = requests.Session()

# Login
r = session.post(f"{NEWAPI_BASE}/api/user/login", json=LOGIN)
print("Login:", r.status_code, r.json().get("success"))
if not r.json().get("success"):
    raise SystemExit("Login failed")

headers = {"New-Api-User": "1"}

# Read current options
r = session.get(f"{NEWAPI_BASE}/api/option/", headers=headers)
options = {x["key"]: x["value"] for x in r.json()["data"]}

# Model prices from OPC backend pricing.js (CNY per 1K tokens)
# ModelRatio = input price per 1K tokens in CNY
# CompletionRatio = output/input multiplier (or absolute output price?)
model_prices = {
    "MiniMax-M2.7": {"input": 0.00168, "output": 0.00672},
    "claude-fable-5": {"input": 0.0544, "output": 0.272},
    "claude-opus-4-6": {"input": 0.0272, "output": 0.136},
    "claude-opus-4-6-thinking": {"input": 0.0272, "output": 0.136},
    "claude-opus-4-7": {"input": 0.0272, "output": 0.136},
    "claude-opus-4-7-thinking": {"input": 0.0272, "output": 0.136},
    "claude-opus-4-8": {"input": 0.0272, "output": 0.136},
    "claude-sonnet-4-6": {"input": 0.01632, "output": 0.0816},
    "claude-sonnet-4-6-thinking": {"input": 0.01632, "output": 0.0816},
    "claude-sonnet-5": {"input": 0.01088, "output": 0.0544},
    "deepseek-v4-flash": {"input": 0.00049, "output": 0.000979},
    "deepseek-v4-pro": {"input": 0.002366, "output": 0.004733},
    "gemini-3.1-pro-preview": {"input": 0.01088, "output": 0.06528},
    "gemini-3.5-flash": {"input": 0.00816, "output": 0.04896},
    "gpt-5.4": {"input": 0.0136, "output": 0.0816},
    "gpt-5.4-mini": {"input": 0.00408, "output": 0.02448},
    "gpt-5.5": {"input": 0.0272, "output": 0.1632},
    "gpt-5.6-luna": {"input": 0.00544, "output": 0.04352},
    "gpt-5.6-sol": {"input": 0.0272, "output": 0.2176},
    "gpt-5.6-terra": {"input": 0.0136, "output": 0.1088},
    "glm-5": {"input": 0.0032, "output": 0.01312},
    "glm-5.1": {"input": 0.0048, "output": 0.01968},
    "qwen-plus": {"input": 0.001088, "output": 0.00272},
    "qwen3.7-max": {"input": 0.0096, "output": 0.0288},
    "kimi-k2.5": {"input": 0.00816, "output": 0.04896},  # approximate from gemini-3.5-flash
}

# Per-call models (image/video) - use ModelPrice
per_call_models = {
    "asset_create_media": 0.04352,
    "gpt-image-2": 0.3264,
    "gpt-image-2-4k": 0.457143,
    "nano-banana-2": 0.7616,
    "nano-banana-pro": 0.9792,
    "omni_flash-v2v": 2.72,
}

# Build model_ratio (input price per 1K tokens in CNY)
model_ratio = {}
completion_ratio = {}

for model, prices in model_prices.items():
    model_ratio[model] = round(prices["input"], 6)
    if prices["output"] and prices["input"]:
        multiplier = prices["output"] / prices["input"]
        completion_ratio[model] = round(multiplier, 2)

print(f"Setting {len(model_ratio)} model ratios and {len(completion_ratio)} completion ratios")

# Update ModelRatio
r = session.put(
    f"{NEWAPI_BASE}/api/option/",
    headers=headers,
    json={"key": "ModelRatio", "value": json.dumps(model_ratio, ensure_ascii=False)},
)
print("ModelRatio update:", r.status_code, r.json().get("success"))

# Update CompletionRatio
r = session.put(
    f"{NEWAPI_BASE}/api/option/",
    headers=headers,
    json={"key": "CompletionRatio", "value": json.dumps(completion_ratio, ensure_ascii=False)},
)
print("CompletionRatio update:", r.status_code, r.json().get("success"))

# Update ModelPrice (per-call)
current_model_price = json.loads(options.get("ModelPrice", "{}"))
current_model_price.update(per_call_models)
r = session.put(
    f"{NEWAPI_BASE}/api/option/",
    headers=headers,
    json={"key": "ModelPrice", "value": json.dumps(current_model_price, ensure_ascii=False)},
)
print("ModelPrice update:", r.status_code, r.json().get("success"))

print("Done")
