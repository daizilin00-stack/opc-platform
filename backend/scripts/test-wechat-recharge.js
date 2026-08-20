/**
 * 微信充值端到端测试（不经过前端登录）
 * 直接在后端创建充值订单并调起微信 Native 支付，生成二维码图片
 *
 * 用法：docker compose exec backend node scripts/test-wechat-recharge.js [userId]
 */

require('/app/node_modules/dotenv').config();
const path = require('path');
const QRCode = require('qrcode');
const paymentService = require('../src/services/paymentService');

const QR_OUTPUT_PATH = path.resolve(__dirname, 'wechat-test-qr.png');

async function test() {
  const userId = process.argv[2] || '18e1be7a-630d-45fe-89c4-f26ddb54d388';
  try {
    console.log(`使用 userId=${userId} 创建微信充值订单...`);

    const order = await paymentService.createRechargeOrder({
      userId,
      amount: 0.01,
      gateway: 'wechat',
      clientIp: '127.0.0.1',
      description: '微信充值测试 0.01 元',
    });

    console.log('✅ 订单创建成功:', order.third_party_order_id, '金额:', order.amount);

    const payParams = await paymentService.initiatePayment(order);

    if (payParams.gateway === 'wechat' && payParams.codeUrl) {
      console.log('✅ 微信支付下单成功，订单号:', payParams.orderNo);
      console.log('code_url:', payParams.codeUrl);

      await QRCode.toFile(QR_OUTPUT_PATH, payParams.codeUrl, { width: 400, margin: 2 });
      console.log('✅ 二维码已生成:', QR_OUTPUT_PATH);
    } else {
      console.error('❌ 微信调起异常:', payParams);
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

test();
