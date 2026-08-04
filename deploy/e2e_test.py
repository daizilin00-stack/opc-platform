import requests, json, subprocess

BASE = 'http://121.196.238.35'

# Register
r = requests.post(f'{BASE}/api/auth/register', json={'phone':'13800138001','password':'TestPass123!'})
print('register:', r.status_code, r.json().get('success') or r.json().get('message'))
if r.status_code not in (200, 201):
    raise SystemExit(1)
token = r.json()['token']

# Verify id
r = requests.post(f'{BASE}/api/auth/verify-id', headers={'Authorization': f'Bearer {token}'}, json={'idCard':'110101199001011235','realName':'测试用户2'})
print('verify-id:', r.status_code, r.json().get('message',''))

# Verify company
r = requests.post(f'{BASE}/api/auth/verify-company', headers={'Authorization': f'Bearer {token}'}, json={'companyName':'测试2科技有限公司','companyType':'new_register'})
print('verify-company:', r.status_code, r.json().get('message',''))

# Sign contract
r = requests.post(f'{BASE}/api/auth/sign-contract', headers={'Authorization': f'Bearer {token}'}, json={'contractVersion':'v1.0','agreed':True})
print('sign-contract:', r.status_code, r.json().get('message',''))

# Model chat
r = requests.post(f'{BASE}/api/models/chat', headers={'Authorization': f'Bearer {token}'}, json={'model':'gpt-5.4-mini','messages':[{'role':'user','content':'hello'}],'maxTokens':50})
print('model-chat:', r.status_code)
if r.status_code == 200:
    print(json.dumps(r.json(), ensure_ascii=False, indent=2)[:500])
else:
    print(r.text[:300])

# Cleanup
subprocess.run(['docker','exec','opc-postgres','psql','-U','opc','-d','opc_db','-c',"DELETE FROM users WHERE phone='13800138001';"], check=True)
print('cleanup done')
