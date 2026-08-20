/**
 * 支付宝配置快速验证脚本
 * 发起一笔 0.01 元测试订单，验证 SDK 初始化 + 下单是否成功
 */

require('/app/node_modules/dotenv').config();
const alipay = require('../src/services/alipay');

console.log('ALIPAY_APP_ID:', process.env.ALIPAY_APP_ID || '未配置');
console.log('ALIPAY_PRIVATE_KEY_PATH:', process.env.ALIPAY_PRIVATE_KEY_PATH);
console.log('ALIPAY_PUBLIC_KEY_PATH:', process.env.ALIPAY_PUBLIC_KEY_PATH);
console.log('isConfigured:', alipay.isConfigured());

async function test() {
  const orderNo = `TEST${Date.now()}`;
  try {
    const formHtml = await alipay.createPagePay({
      orderNo,
      amountYuan: '0.01',
      description: 'OPC 支付宝配置测试',
      returnUrl: 'http://localhost:3002/payment/result?gateway=alipay',
      notifyUrl: 'http://localhost:3003/api/payment/alipay/callback',
    });

    if (formHtml && formHtml.includes('alipay.com')) {
      console.log('✅ 支付宝 SDK 初始化 + 下单成功');
      console.log('订单号:', orderNo);
      process.exit(0);
    } else {
      console.error('❌ 返回 form 异常:', formHtml);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ 支付宝下单失败:', error.message);
    process.exit(1);
  }
}

test();
