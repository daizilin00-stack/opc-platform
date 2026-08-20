/**
 * 支付宝充值端到端测试（不经过前端登录）
 * 直接在后端创建充值订单并调起支付宝支付
 */

require('/app/node_modules/dotenv').config();
const paymentService = require('../src/services/paymentService');

async function test() {
  const userId = process.argv[2] || '18e1be7a-630d-45fe-89c4-f26ddb54d388';
  try {
    console.log(`使用 userId=${userId} 创建充值订单...`);

    const order = await paymentService.createRechargeOrder({
      userId,
      amount: 0.01,
      gateway: 'alipay',
      clientIp: '127.0.0.1',
      description: '支付宝充值测试 0.01 元',
    });

    console.log('✅ 订单创建成功:', order.third_party_order_id, '金额:', order.amount);

    const payParams = await paymentService.initiatePayment(order);

    if (payParams.gateway === 'alipay' && payParams.formHtml) {
      console.log('✅ 支付宝支付调起成功，订单号:', payParams.orderNo);
      console.log('formHtml 长度:', payParams.formHtml.length);
      console.log('预览:', payParams.formHtml.slice(0, 200) + '...');
    } else {
      console.error('❌ 支付宝调起异常:', payParams);
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  }
}

test();
