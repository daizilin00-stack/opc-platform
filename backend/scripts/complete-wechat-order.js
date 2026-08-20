/**
 * 手动查询微信订单状态并标记为已支付（仅用于本地测试回调不到的情况）
 *
 * 用法：docker compose exec backend node scripts/complete-wechat-order.js <商户订单号>
 */

require('/app/node_modules/dotenv').config();
const wechatPay = require('../src/services/wechatPay');
const paymentService = require('../src/services/paymentService');

async function complete(orderNo) {
  if (!orderNo) {
    console.error('请提供订单号，例如：node scripts/complete-wechat-order.js RO20260819221275');
    process.exit(1);
  }

  try {
    console.log('正在查询微信订单:', orderNo);
    const result = await wechatPay.queryOrder(orderNo);
    console.log('查询结果:', JSON.stringify(result, null, 2));

    const tradeState = result.trade_state;
    if (tradeState === 'SUCCESS') {
      const handleResult = await paymentService.handlePaymentSuccess(
        orderNo,
        result.transaction_id,
        result
      );
      console.log('✅ 订单处理完成');
      console.log('订单号:', handleResult.order.third_party_order_id);
      console.log('新余额:', handleResult.newBalance);
    } else if (['CLOSED', 'REVOKED', 'PAYERROR'].includes(tradeState)) {
      await paymentService.handlePaymentFailure(orderNo, `trade_state: ${tradeState}`);
      console.log('订单已标记为失败:', tradeState);
    } else {
      console.log('订单尚未成功，当前状态:', tradeState);
    }
  } catch (error) {
    console.error('❌ 处理失败:', error.message);
    process.exit(1);
  }
}

complete(process.argv[2]);
