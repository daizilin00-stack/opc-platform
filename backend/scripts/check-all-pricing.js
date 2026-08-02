require('dotenv').config();

const { calculateTokenCost } = require('../src/config/pricing');

console.log('💰 OPC 平台模型定价总览（2026-06-13 更新）');
console.log('汇率：1 USD = 7.3 CNY | 国内模型加价 10% | 海外模型加价 25%');
console.log('='.repeat(70));

const domesticModels = [
  { name: '豆包 Pro 32K (火山方舟)', key: 'volcengine' },
  { name: 'DeepSeek-V3 / V4-Flash', key: 'deepseek-chat' },
  { name: 'DeepSeek-R1 / V4-Pro', key: 'deepseek-reasoner' },
  { name: 'Kimi (Moonshot)', key: 'kimi' },
  { name: '通义千问 (阿里云)', key: 'tongyi' },
];

const overseasModels = [
  { name: 'GPT-5.5 (OpenAI 旗舰)', key: 'gpt-5.5' },
  { name: 'GPT-5.4 (OpenAI 标准)', key: 'gpt-5.4' },
  { name: 'GPT-5.4-mini (OpenAI 轻量)', key: 'gpt-5.4-mini' },
  { name: 'Claude 3.5 Sonnet', key: 'claude-3.5-sonnet' },
  { name: 'Claude 3.5 Haiku', key: 'claude-3.5-haiku' },
];

function printModelRow(name, key) {
  try {
    const cost1k = calculateTokenCost(key, 1000, 1000);
    const cost1M = calculateTokenCost(key, 1000000, 1000000);
    const markup = (cost1k.markup * 100).toFixed(0);
    console.log(
      `${name.padEnd(26)} ¥${cost1k.totalCost.toFixed(4).padStart(8)}/1k  ¥${cost1M.totalCost.toFixed(2).padStart(8)}/1M  (+${markup}%)`
    );
  } catch (e) {
    console.log(`${name.padEnd(26)} ❌ ${e.message}`);
  }
}

console.log('\n🇨🇳 国内模型（10% 平台服务费）');
console.log('-'.repeat(70));
console.log(`${'模型'.padEnd(26)} ${'1k 合计'.padStart(10)} ${'1M 合计'.padStart(10)} 加价率`);
console.log('-'.repeat(70));
for (const m of domesticModels) {
  printModelRow(m.name, m.key);
}

console.log('\n🌐 海外模型（25% = 15%平台 + 10%跨境带宽）');
console.log('-'.repeat(70));
console.log(`${'模型'.padEnd(26)} ${'1k 合计'.padStart(10)} ${'1M 合计'.padStart(10)} 加价率`);
console.log('-'.repeat(70));
for (const m of overseasModels) {
  printModelRow(m.name, m.key);
}

console.log('\n' + '='.repeat(70));
console.log('📊 定价对比：调用一次典型的对话（1k 输入 + 2k 输出）');
console.log('='.repeat(70));

const compareScenario = [
  { name: '豆包 Pro 32K', key: 'volcengine' },
  { name: 'DeepSeek-V3', key: 'deepseek-chat' },
  { name: 'Kimi', key: 'kimi' },
  { name: 'GPT-5.4-mini', key: 'gpt-5.4-mini' },
  { name: 'Claude 3.5 Haiku', key: 'claude-3.5-haiku' },
  { name: 'GPT-5.4', key: 'gpt-5.4' },
  { name: 'Claude 3.5 Sonnet', key: 'claude-3.5-sonnet' },
  { name: 'GPT-5.5', key: 'gpt-5.5' },
];

for (const m of compareScenario) {
  try {
    const cost = calculateTokenCost(m.key, 1000, 2000);
    console.log(`${m.name.padEnd(20)} 1k in + 2k out = ¥${cost.totalCost.toFixed(4)}`);
  } catch (e) {
    console.log(`${m.name.padEnd(20)} ❌ ${e.message}`);
  }
}

console.log('\n💡 示例：创业者购买「标准包」¥199/100万Token，能调用多少次？');
console.log('-'.repeat(70));
const packageTokens = 1000000;
for (const m of [
  { name: '豆包 / DeepSeek-V3', key: 'volcengine' },
  { name: 'GPT-5.4-mini', key: 'gpt-5.4-mini' },
  { name: 'GPT-5.4', key: 'gpt-5.4' },
]) {
  try {
    const costPer1M = calculateTokenCost(m.key, 500000, 500000);
    const calls = Math.floor(199 / costPer1M.totalCost);
    console.log(`${m.name.padEnd(20)} 约 ${calls} 次（50万in + 50万out）`);
  } catch (e) {}
}
