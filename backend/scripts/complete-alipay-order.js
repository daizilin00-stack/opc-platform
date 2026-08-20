/**
 * 手动将支付宝成功订单标记为已支付（仅用于本地测试回调不到的情况）
 * 用法：docker compose exec backend node scripts/complete-alipay-order.js <商户订单号> <支付宝交易号>
 */

require('/app/node_modules/dotenv').config();
const paymentService = require('../src/services/paymentService');

async function complete(orderNo, tradeNo) {
  if (!orderNo || !tradeNo) {
    console.error('用法：node scripts/complete-alipay-order.js <商户订单号> <支付宝交易号>');
    process.exit(1);
  }

  try {
    const result = await paymentService.handlePaymentSuccess(orderNo, tradeNo, { manual: true });
    console.log('✅ 订单处理完成');
    console.log('订单号:', result.order.third_party_order_id);
    console.log('新余额:', result.newBalance);
  } catch (error) {
    console.error('❌ 处理失败:', error.message);
    process.exit(1);
  }
}

complete(process.argv[2], process.argv[3]);
