#!/usr/bin/env python3
"""Bootstrap NewAPI for OPC production.

Note: NewAPI v1.0.0-rc.23 changed the channel creation API in a way that is not
trivially scriptable without the exact UI request payload. For a first-time setup,
the recommended approach is to seed the production NewAPI SQLite database from a
local development instance that already has the LingAPI channel and model pricing
configured, then run this script to create the OPC production token and update
`.env.prod`.

What this script does:
1. Waits for NewAPI to be ready.
2. Logs in as root (using NEWAPI_ROOT_PASSWORD from .env.prod).
3. Creates the OPC production token if it doesn't exist.
4. Prints the token key and writes it to .env.prod as NEWAPI_API_KEY.

Prerequisites:
- NewAPI container is running and an admin root user exists.
- LingAPI channel and model pricing are already present in the database.
- .env.prod contains NEWAPI_ROOT_PASSWORD, NEWAPI_BASE_URL, etc.
"""
import json
import os
import re
import sys
import time
import requests

BASE_URL = os.environ.get("NEWAPI_URL", "http://127.0.0.1:3004")
DEPLOY_DIR = os.environ.get("DEPLOY_DIR", "/opt/opc-platform/deploy")
ENV_FILE = os.path.join(DEPLOY_DIR, ".env.prod")
ROOT_PASSWORD = ***"NEWAPI_ROOT_PASSWORD", "")

print(f"=== NewAPI token bootstrap on {BASE_URL} ===")

if not ROOT_PASSWORD:
    print("ERROR: NEWAPI_ROOT_PASSWORD not set in environment/.env.prod")
    sys.exit(1)

session = requests.Session()

# Wait for NewAPI
for i in range(30):
    try:
        r = session.get(f"{BASE_URL}/api/status")
        if r.json().get("success"):
            print("NewAPI is ready")
            break
    except Exception as e:
        print(f"Waiting for NewAPI... {i+1}/30 ({e})")
        time.sleep(2)
else:
    print("ERROR: NewAPI did not become ready")
    sys.exit(1)

# Login
r = session.post(f"{BASE_URL}/api/user/login", json={"username": "root", "password": ROOT_PASSWORD})
print("Login:", r.status_code, r.json().get("success"), r.json().get("message", ""))
if not r.json().get("success"):
    sys.exit(1)

user = r.json().get("data", {})
# rc.23 returns an access_token; older versions use session cookies
if "access_token" in user:
    access_token = user["access_token"]
    headers = {"Authorization": f"Bearer {access_token}", "New-Api-User": "1"}
else:
    # Older cookie-based auth
    headers = {"New-Api-User": "1"}

# Check if OPC-Production token already exists
r = session.get(f"{BASE_URL}/api/token/", headers=headers)
existing = None
if r.json().get("success"):
    for item in r.json().get("data", {}).get("items", []):
        if item.get("name") == "OPC-Production":
            existing = item
            break

if existing:
    print(f"OPC-Production token already exists (id={existing['id']}).")
    print(f"Token key: {existing.get('key', '[hidden in API response]')}")
    token_key = existing.get("key")
else:
    # Create token
    r = session.post(
        f"{BASE_URL}/api/token/",
        headers=headers,
        json={"name": "OPC-Production", "unlimited_quota": True, "model_limits_enabled": False},
    )
    print("Create token:", r.status_code, r.json().get("success"), r.json().get("message", ""))
    if not r.json().get("success"):
        sys.exit(1)
    data = r.json().get("data", {})
    token_key = data.get("key")
    print(f"Token key: {token_key}")

if not token_key:
    print("WARNING: Token key not returned by API. Retrieve it from the NewAPI web UI")
    print("or query the SQLite database: SELECT key FROM tokens WHERE name='OPC-Production';")
else:
    # Update .env.prod
    if os.path.exists(ENV_FILE):
        with open(ENV_FILE, "r") as f:
            content = f.read()
        new_content = re.sub(r"^NEWAPI_API_KEY=.*$", f"NEWAPI_API_KEY={token_key}", content, flags=re.MULTILINE)
        if "NEWAPI_API_KEY=" not in new_content:
            new_content += f"\nNEWAPI_API_KEY={token_key}\n"
        with open(ENV_FILE, "w") as f:
            f.write(new_content)
        print(f"Updated {ENV_FILE} with NEWAPI_API_KEY")
    else:
        print(f"WARNING: {ENV_FILE} not found. Please set NEWAPI_API_KEY={token_key} manually.")

print("=== NewAPI token bootstrap done ===")
