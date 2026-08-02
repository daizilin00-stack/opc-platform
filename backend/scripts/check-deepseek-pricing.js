require('dotenv').config();

const { calculateTokenCost } = require('../src/config/pricing');

console.log('📊 DeepSeek 官方定价验证（每千 Token）');
console.log('='.repeat(60));

const models = [
  { name: 'DeepSeek-V3 (deepseek-chat)', key: 'deepseek-chat', prompt: 1000, completion: 1000 },
  { name: 'DeepSeek-R1 (deepseek-reasoner)', key: 'deepseek-reasoner', prompt: 1000, completion: 1000 },
  { name: 'DeepSeek-V4-Flash', key: 'deepseek-v4-flash', prompt: 1000, completion: 1000 },
  { name: 'DeepSeek-V4-Pro', key: 'deepseek-v4-pro', prompt: 1000, completion: 1000 },
];

for (const m of models) {
  try {
    const cost = calculateTokenCost(m.key, m.prompt, m.completion);
    console.log(`\n🔹 ${m.name}`);
    console.log(`   输入 ${m.prompt} tokens: ¥${cost.inputCost}`);
    console.log(`   输出 ${m.completion} tokens: ¥${cost.outputCost}`);
    console.log(`   合计: ¥${cost.totalCost} (加价 ${cost.markup * 100}%)`);
  } catch (e) {
    console.log(`\n❌ ${m.name}: ${e.message}`);
  }
}

console.log('\n' + '='.repeat(60));
console.log('📋 与其他国内模型对比（1k in + 1k out）');
console.log('='.repeat(60));

const compare = [
  { name: 'Kimi', key: 'kimi' },
  { name: '通义千问', key: 'tongyi' },
  { name: '豆包(火山方舟)', key: 'volcengine' },
  { name: 'DeepSeek-V3', key: 'deepseek-chat' },
  { name: 'DeepSeek-R1', key: 'deepseek-reasoner' },
];

for (const c of compare) {
  try {
    const cost = calculateTokenCost(c.key, 1000, 1000);
    console.log(`${c.name.padEnd(20)} ¥${cost.totalCost.toFixed(4)} / 1k tokens`);
  } catch (e) {
    console.log(`${c.name.padEnd(20)} 定价未配置`);
  }
}

console.log('\n📋 百万 Token 成本对比（更直观）');
console.log('='.repeat(60));
for (const c of compare) {
  try {
    const cost = calculateTokenCost(c.key, 1000000, 1000000);
    console.log(`${c.name.padEnd(20)} ¥${cost.totalCost.toFixed(2)} / 百万 tokens`);
  } catch (e) {
    console.log(`${c.name.padEnd(20)} 定价未配置`);
  }
}
