require('dotenv').config({ path: '/app/.env' });
const { chatCompletion } = require('../src/services/modelProxy');

async function main() {
  const model = process.argv[2] || 'gpt-5.4-mini';
  console.log(`Testing model: ${model}`);
  try {
    const result = await chatCompletion({
      model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant. Reply with one short sentence.' },
        { role: 'user', content: 'Say hello in Chinese.' },
      ],
      temperature: 0.7,
      maxTokens: 50,
    });
    console.log('✅ SUCCESS');
    console.log('Provider:', result.provider);
    console.log('Model:', result.model);
    console.log('Latency:', result.latency, 'ms');
    console.log('Usage:', JSON.stringify(result.usage));
    console.log('Content:', result.content);
  } catch (err) {
    console.error('❌ FAILED:', err.message);
    process.exit(1);
  }
}

main();
