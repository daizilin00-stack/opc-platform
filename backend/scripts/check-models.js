require('dotenv').config();

const { MODEL_CONFIGS } = require('../src/services/modelProxy');
const { calculateTokenCost } = require('../src/config/pricing');

console.log('📋 模型列表验证（前端将看到）');
console.log('='.repeat(50));

for (const [key, cfg] of Object.entries(MODEL_CONFIGS)) {
  for (const m of cfg.models) {
    let pricing = { totalCost: 0, markup: 0 };
    try { pricing = calculateTokenCost(key, 1000, 1000); } catch(e) {}
    console.log('\n🔹 ' + m.id);
    console.log('   名称: ' + m.desc);
    console.log('   提供商: ' + cfg.provider);
    console.log('   上下文: ' + m.context + ' tokens');
    console.log('   定价: ¥' + pricing.totalCost + '/1k tokens (加价' + (pricing.markup*100) + '%)');
  }
}
