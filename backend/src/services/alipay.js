/**
 * 支付宝支付服务
 * 封装：电脑网站支付下单、支付回调验证、订单查询
 */

const fs = require('fs');
const path = require('path');
const { AlipaySdk } = require('alipay-sdk');
const logger = require('../utils/logger');

const {
  ALIPAY_APP_ID,
  ALIPAY_PRIVATE_KEY_PATH,
  ALIPAY_PUBLIC_KEY_PATH,
  ALIPAY_NOTIFY_URL,
  FRONTEND_URL,
} = process.env;

let alipaySdk = null;

function isConfigured() {
  return !!(ALIPAY_APP_ID && ALIPAY_PRIVATE_KEY_PATH && ALIPAY_PUBLIC_KEY_PATH);
}

function readKey(filePath) {
  if (!filePath) return null;

  const resolved = filePath.startsWith('file://')
    ? filePath.slice(7)
    : path.resolve(filePath);

  if (!fs.existsSync(resolved)) {
    throw new Error(`密钥文件不存在: ${resolved}`);
  }

  return fs.readFileSync(resolved, 'utf8');
}

function initClient() {
  if (!isConfigured()) {
    throw new Error('支付宝支付未配置完整环境变量，请检查 ALIPAY_* 系列变量');
  }

  if (alipaySdk) return alipaySdk;

  const privateKey = readKey(ALIPAY_PRIVATE_KEY_PATH);
  const alipayPublicKey = readKey(ALIPAY_PUBLIC_KEY_PATH);

  alipaySdk = new AlipaySdk({
    appId: ALIPAY_APP_ID,
    privateKey,
    keyType: 'PKCS8',
    signType: 'RSA2',
    alipayPublicKey,
    gateway: 'https://openapi.alipay.com/gateway.do',
    timeout: 10000,
  });

  logger.info('支付宝客户端初始化成功，APPID:', ALIPAY_APP_ID);
  return alipaySdk;
}

/**
 * 电脑网站支付下单
 * @param {object} params
 * @param {string} params.orderNo - 商户订单号
 * @param {number} params.amountYuan - 金额（元）
 * @param {string} params.description - 商品描述
 * @param {string} [params.returnUrl] - 支付完成后同步返回地址
 * @param {string} [params.notifyUrl] - 异步回调地址
 * @returns {Promise<string>} formHtml - 支付宝返回的 form HTML，前端直接嵌入即可
 */
async function createPagePay({ orderNo, amountYuan, description, returnUrl, notifyUrl }) {
  const sdk = initClient();

  const formHtml = await sdk.pageExec('alipay.trade.page.pay', {
    notifyUrl: notifyUrl || ALIPAY_NOTIFY_URL || `${FRONTEND_URL}/api/payment/alipay/callback`,
    returnUrl: returnUrl || `${FRONTEND_URL}/payment/result?gateway=alipay`,
    bizContent: {
      out_trade_no: orderNo,
      product_code: 'FAST_INSTANT_TRADE_PAY',
      total_amount: amountYuan,
      subject: description || 'OPC 账户充值',
      body: `充值订单 ${orderNo}`,
    },
  });

  return formHtml;
}

/**
 * 手机网站支付下单
 * @param {object} params - 同上
 * @returns {Promise<string>} formHtml
 */
async function createWapPay({ orderNo, amountYuan, description, returnUrl, notifyUrl }) {
  const sdk = initClient();

  const formHtml = await sdk.pageExec('alipay.trade.wap.pay', {
    notifyUrl: notifyUrl || ALIPAY_NOTIFY_URL || `${FRONTEND_URL}/api/payment/alipay/callback`,
    returnUrl: returnUrl || `${FRONTEND_URL}/payment/result?gateway=alipay`,
    bizContent: {
      out_trade_no: orderNo,
      product_code: 'QUICK_WAP_WAY',
      total_amount: amountYuan,
      subject: description || 'OPC 账户充值',
      body: `充值订单 ${orderNo}`,
    },
  });

  return formHtml;
}

/**
 * 验证支付宝回调签名
 * @param {object} query/body - 支付宝回调参数
 * @returns {boolean}
 */
function verifyCallback(params) {
  if (!isConfigured()) {
    throw new Error('支付宝支付未配置，无法验证回调');
  }

  try {
    const sdk = initClient();
    return sdk.checkNotifySign(params);
  } catch (error) {
    logger.error('支付宝回调签名验证失败:', error);
    return false;
  }
}

/**
 * 查询订单状态
 * @param {string} orderNo - 商户订单号
 */
async function queryOrder(orderNo) {
  const sdk = initClient();

  const result = await sdk.exec('alipay.trade.query', {
    bizContent: {
      out_trade_no: orderNo,
    },
  });

  return result;
}

module.exports = {
  isConfigured,
  createPagePay,
  createWapPay,
  verifyCallback,
  queryOrder,
};
