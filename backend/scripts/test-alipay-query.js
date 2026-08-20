/**
 * 查询支付宝订单状态
 * 用法：docker compose exec backend node scripts/test-alipay-query.js <商户订单号>
 */

require('/app/node_modules/dotenv').config();
const alipay = require('../src/services/alipay');

async function query(orderNo) {
  if (!orderNo) {
    console.error('请提供订单号，例如：node scripts/test-alipay-query.js RO20260819221275');
    process.exit(1);
  }

  try {
    const result = await alipay.queryOrder(orderNo);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('查询失败:', error.message);
    process.exit(1);
  }
}

query(process.argv[2]);
