/**
 * OPC 开园版端到端 API 测试
 * 流程：注册 -> 登录 -> 实名认证 -> 企业认证 -> 签署合同 -> 领取新用户奖励
 *       -> 查看模型列表 -> 充值 -> 模型调用 -> 查看消费记录
 *
 * 运行：docker exec -i opc-backend node scripts/e2e-test.js
 */
require('dotenv').config({ path: '/app/.env' });

const axios = require('axios');

const BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:3001';
const api = axios.create({ baseURL: BASE_URL, timeout: 120000 });

// 生成一个随机手机号（测试用）
function randomPhone() {
  const prefix = '199';
  const suffix = String(Math.floor(Math.random() * 1e8)).padStart(8, '0');
  return prefix + suffix;
}

// 生成一个符合正则的随机身份证号（18位）
function randomIdCard() {
  const region = '110101';
  const year = 1980 + Math.floor(Math.random() * 21); // 1980-2000
  const month = 1 + Math.floor(Math.random() * 12);
  const day = 1 + Math.floor(Math.random() * 28);
  const birth = `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`;
  const seq = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  const last = Math.floor(Math.random() * 10);
  return `${region}${birth}${seq}${last}`;
}

let token = null;
let userId = null;
let wallet = null;
let rechargeOrderId = null;
let modelList = null;

function authHeaders() {
  return { Authorization: `Bearer ${token}` };
}

async function step(name, fn) {
  console.log(`\n▶️ ${name}`);
  try {
    const result = await fn();
    console.log(`✅ ${name} 成功`);
    return result;
  } catch (err) {
    console.error(`❌ ${name} 失败:`);
    console.error('   错误消息:', err.message);
    console.error('   响应状态:', err.response?.status);
    console.error('   响应数据:', err.response?.data);
    console.error('   请求详情:', err.config?.method, err.config?.url, err.config?.data);
    throw err;
  }
}

async function main() {
  const phone = randomPhone();
  const password = 'Test@123456';

  // 1. 注册
  await step('注册新用户', async () => {
    const res = await api.post('/api/auth/register', {
      phone,
      password,
      realName: '测试用户',
    });
    token = res.data.token;
    userId = res.data.user.id;
    console.log('   用户ID:', userId, '手机号:', phone);
    return res.data;
  });

  // 2. 登录
  await step('用户登录', async () => {
    const res = await api.post('/api/auth/login', { phone, password });
    token = res.data.token;
    console.log('   nextStep:', res.data.nextStep);
    return res.data;
  });

  // 3. 实名认证
  const idCard = randomIdCard();
  await step('实名认证', async () => {
    const res = await api.post(
      '/api/auth/verify-id',
      {
        realName: '测试用户',
        idCard,
      },
      { headers: authHeaders() }
    );
    console.log('   结果:', res.data.message, '->', res.data.nextStep);
    return res.data;
  });

  // 4. 企业认证
  await step('企业认证', async () => {
    const res = await api.post(
      '/api/auth/verify-company',
      {
        companyName: '中新测试科技有限公司',
        registrationNo: '91500103MAD9TERB7X',
        companyType: 'existing_upload',
        businessLicense: 'https://example.com/license.pdf',
      },
      { headers: authHeaders() }
    );
    console.log('   结果:', res.data.message, '->', res.data.nextStep);
    return res.data;
  });

  // 5. 签署合同
  await step('签署电子合同', async () => {
    const res = await api.post(
      '/api/auth/sign-contract',
      {
        contractVersion: 'v1.0',
        agreed: true,
      },
      { headers: authHeaders() }
    );
    console.log('   结果:', res.data.message, '->', res.data.nextStep);
    return res.data;
  });

  // 6. 查询认证状态
  await step('查询认证状态', async () => {
    const res = await api.get('/api/auth/status', { headers: authHeaders() });
    console.log('   状态:', JSON.stringify(res.data));
    return res.data;
  });

  // 7. 获取钱包信息 + 领取新用户奖励
  await step('获取钱包信息', async () => {
    const res = await api.get('/api/wallet/info', { headers: authHeaders() });
    wallet = res.data.wallet;
    console.log('   余额:', wallet.balance);
    return res.data;
  });

  await step('领取新用户奖励', async () => {
    try {
      const res = await api.post('/api/wallet/new-user-bonus', {}, { headers: authHeaders() });
      console.log('   结果:', res.data.message, res.data.bonus_amount);
      return res.data;
    } catch (err) {
      // 已领取则忽略
      if (err.response?.data?.message?.includes('已领取')) {
        console.log('   已领取或已存在奖励记录，跳过');
        return null;
      }
      throw err;
    }
  });

  // 8. 创建并确认充值订单
  await step('创建充值订单', async () => {
    const res = await api.post(
      '/api/wallet/recharge',
      { amount: 100, payment_method: 'manual' },
      { headers: authHeaders() }
    );
    rechargeOrderId = res.data.order.id;
    console.log('   订单ID:', rechargeOrderId, '金额:', res.data.order.amount);
    return res.data;
  });

  await step('确认充值', async () => {
    const res = await api.post(
      '/api/wallet/recharge/confirm',
      { order_id: rechargeOrderId, third_party_transaction_id: 'TEST-' + Date.now() },
      { headers: authHeaders() }
    );
    console.log('   新余额:', res.data.new_balance);
    return res.data;
  });

  // 9. 获取模型列表
  await step('获取模型列表', async () => {
    const res = await api.get('/api/models', { headers: authHeaders() });
    modelList = res.data.models;
    console.log('   模型数量:', modelList.length);
    console.log('   前3个模型:', modelList.slice(0, 3).map(m => `${m.id}(${m.provider})`).join(', '));
    return res.data;
  });

  // 10. 调用模型（使用最便宜的 deepseek-v4-flash）
  await step('调用模型 deepseek-v4-flash', async () => {
    const res = await api.post(
      '/api/models/chat',
      {
        model: 'deepseek-v4-flash',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: '你好，请用一句话介绍自己。' },
        ],
        temperature: 0.7,
        maxTokens: 100,
      },
      { headers: authHeaders() }
    );
    console.log('   模型响应:', res.data.content.trim());
    console.log('   用量:', JSON.stringify(res.data.usage));
    console.log('   费用:', res.data.cost);
    return res.data;
  });

  // 11. 查看消费记录
  await step('查看消费记录', async () => {
    const res = await api.get('/api/consumptions/my', { headers: authHeaders() });
    console.log('   消费记录数:', res.data.pagination.total);
    if (res.data.consumptions.length > 0) {
      const c = res.data.consumptions[0];
      console.log('   最新消费:', c.service_name, 'tokens=', c.total_tokens, 'amount=', c.amount);
    }
    return res.data;
  });

  console.log('\n🎉 端到端测试全部通过！');
}

main().catch((err) => {
  console.error('\n💥 端到端测试失败，详情见上方错误。');
  process.exit(1);
});
