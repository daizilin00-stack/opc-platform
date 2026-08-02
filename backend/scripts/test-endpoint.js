require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.VOLCENGINE_API_KEY;
const BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';
const ENDPOINT_ID = 'ep-20260613183438-lg6g2';

if (!API_KEY) {
  console.error('❌ 缺少 VOLCENGINE_API_KEY 环境变量');
  process.exit(1);
}

async function testEndpoint() {
  console.log(`🔥 测试接入点: ${ENDPOINT_ID}`);
  console.log(`🔑 Key: ${API_KEY.slice(0, 12)}...${API_KEY.slice(-4)}`);
  console.log('='.repeat(50));

  try {
    const start = Date.now();
    const response = await axios.post(
      `${BASE_URL}/chat/completions`,
      {
        model: ENDPOINT_ID,
        messages: [
          { role: 'system', content: '你是一个简洁的助手。' },
          { role: 'user', content: '你好，请用一句话介绍自己。' },
        ],
        temperature: 0.7,
        max_tokens: 50,
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );
    const latency = Date.now() - start;

    const content = response.data.choices?.[0]?.message?.content?.trim() || '';
    const usage = response.data.usage;

    console.log(`✅ 状态: 200 OK`);
    console.log(`⏱️ 延迟: ${latency}ms`);
    console.log(`💬 回复: ${content}`);
    console.log(`📊 Usage: prompt=${usage?.prompt_tokens}, completion=${usage?.completion_tokens}, total=${usage?.total_tokens}`);
    return true;
  } catch (err) {
    console.log(`❌ 失败: ${err.message}`);
    if (err.response) {
      console.log(`   状态码: ${err.response.status}`);
      console.log(`   响应: ${JSON.stringify(err.response.data, null, 2)}`);
    }
    return false;
  }
}

async function testStream() {
  console.log(`\n🧪 测试流式...`);
  try {
    const response = await axios.post(
      `${BASE_URL}/chat/completions`,
      {
        model: ENDPOINT_ID,
        messages: [{ role: 'user', content: '你好，请用两个字回答' }],
        stream: true,
        max_tokens: 10,
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        responseType: 'stream',
        timeout: 30000,
      }
    );

    let buffer = '';
    let fullContent = '';
    let chunkCount = 0;

    for await (const chunk of response.data) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (!trimmed.startsWith('data: ')) continue;

        const jsonStr = trimmed.slice(6);
        try {
          const data = JSON.parse(jsonStr);
          const delta = data.choices?.[0]?.delta?.content || '';
          if (delta) {
            fullContent += delta;
            chunkCount++;
          }
        } catch (e) {}
      }
    }

    console.log(`✅ 流式成功 | ${chunkCount} chunks | 内容: ${fullContent.trim()}`);
    return true;
  } catch (err) {
    console.log(`❌ 流式失败: ${err.message}`);
    if (err.response) {
      console.log(`   状态码: ${err.response.status}`);
    }
    return false;
  }
}

async function main() {
  const ok = await testEndpoint();
  if (ok) await testStream();
}

main().catch(console.error);
