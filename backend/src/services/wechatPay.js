/**
 * 微信支付服务（API v3）
 * 封装：Native 下单、回调签名验证、回调解密
 */

const fs = require('fs');
const path = require('path');
const { Wechatpay, Rsa, Aes, Formatter } = require('wechatpay-axios-plugin');
const logger = require('../utils/logger');

const {
  WECHAT_PAY_MCHID,
  WECHAT_PAY_APPID,
  WECHAT_PAY_SERIAL,
  WECHAT_PAY_PRIVATE_KEY_PATH,
  WECHAT_PAY_PLATFORM_PUBLIC_KEY_PATH,
  WECHAT_PAY_PLATFORM_KEY_ID,
  WECHAT_PAY_APIV3_KEY,
  WECHAT_PAY_NOTIFY_URL,
  FRONTEND_URL,
} = process.env;

let wxpay = null;

function isConfigured() {
  return !!(WECHAT_PAY_MCHID && WECHAT_PAY_SERIAL && WECHAT_PAY_PRIVATE_KEY_PATH && WECHAT_PAY_PLATFORM_PUBLIC_KEY_PATH && WECHAT_PAY_PLATFORM_KEY_ID && WECHAT_PAY_APIV3_KEY);
}

function initClient() {
  if (!isConfigured()) {
    throw new Error('微信支付未配置完整环境变量，请检查 WECHAT_PAY_* 系列变量');
  }

  if (wxpay) return wxpay;

  const privateKeyPath = WECHAT_PAY_PRIVATE_KEY_PATH.startsWith('file://')
    ? WECHAT_PAY_PRIVATE_KEY_PATH
    : `file://${path.resolve(WECHAT_PAY_PRIVATE_KEY_PATH)}`;

  const publicKeyPath = WECHAT_PAY_PLATFORM_PUBLIC_KEY_PATH.startsWith('file://')
    ? WECHAT_PAY_PLATFORM_PUBLIC_KEY_PATH
    : `file://${path.resolve(WECHAT_PAY_PLATFORM_PUBLIC_KEY_PATH)}`;

  wxpay = new Wechatpay({
    mchid: WECHAT_PAY_MCHID,
    serial: WECHAT_PAY_SERIAL,
    privateKey: privateKeyPath,
    certs: {
      [WECHAT_PAY_PLATFORM_KEY_ID]: publicKeyPath,
    },
    secret: WECHAT_PAY_APIV3_KEY,
  });

  logger.info('微信支付客户端初始化成功，商户号:', WECHAT_PAY_MCHID);
  return wxpay;
}

/**
 * Native 支付下单
 * @param {object} params
 * @param {string} params.orderNo - 商户订单号
 * @param {number} params.amountFen - 金额（分）
 * @param {string} params.description - 商品描述
 * @param {string} [params.notifyUrl] - 回调地址
 * @returns {Promise<string>} code_url - 微信支付二维码链接
 */
async function createNativeOrder({ orderNo, amountFen, description, notifyUrl }) {
  const client = initClient();

  const result = await client.v3.pay.transactions.native.post({
    mchid: WECHAT_PAY_MCHID,
    appid: WECHAT_PAY_APPID,
    out_trade_no: orderNo,
    description: description || 'OPC 账户充值',
    notify_url: notifyUrl || WECHAT_PAY_NOTIFY_URL || `${FRONTEND_URL}/api/payment/wechat/callback`,
    amount: {
      total: amountFen,
      currency: 'CNY',
    },
  });

  return result.data.code_url;
}

/**
 * 验证微信支付回调签名
 * @param {object} headers - HTTP headers
 * @param {string} rawBody - 原始请求体字符串
 * @returns {boolean}
 */
function verifyCallbackSignature(headers, rawBody) {
  if (!isConfigured()) {
    throw new Error('微信支付未配置，无法验证回调签名');
  }

  const timestamp = headers['wechatpay-timestamp'];
  const nonce = headers['wechatpay-nonce'];
  const signature = headers['wechatpay-signature'];
  const serial = headers['wechatpay-serial'];

  if (!timestamp || !nonce || !signature || !serial) {
    throw new Error('微信支付回调缺少必要请求头');
  }

  const publicKeyPath = WECHAT_PAY_PLATFORM_PUBLIC_KEY_PATH.startsWith('file://')
    ? WECHAT_PAY_PLATFORM_PUBLIC_KEY_PATH.slice(7)
    : path.resolve(WECHAT_PAY_PLATFORM_PUBLIC_KEY_PATH);

  const publicKey = Rsa.from(`file://${publicKeyPath}`, Rsa.KEY_TYPE_PUBLIC);
  const message = Formatter.response(timestamp, nonce, rawBody);

  return Rsa.verify(message, signature, publicKey);
}

/**
 * 解密微信支付回调资源
 * @param {object} body - 回调 JSON body
 * @returns {object}
 */
function decryptCallbackResource(body) {
  if (!isConfigured()) {
    throw new Error('微信支付未配置，无法解密回调');
  }

  const { resource } = body;
  if (!resource) {
    throw new Error('微信支付回调缺少 resource 字段');
  }

  const { ciphertext, associated_data, nonce } = resource;
  const key = Buffer.from(WECHAT_PAY_APIV3_KEY, 'utf8');
  const iv = Buffer.from(nonce, 'utf8');
  const aad = Buffer.from(associated_data || '', 'utf8');

  const decipher = require('crypto').createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAAD(aad);

  const encrypted = Buffer.from(ciphertext, 'base64');
  const authTag = encrypted.slice(-16);
  const encryptedData = encrypted.slice(0, -16);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedData, null, 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted);
}

/**
 * 查询订单状态
 * @param {string} orderNo - 商户订单号
 */
async function queryOrder(orderNo) {
  const client = initClient();
  const result = await client.v3.pay.transactions.outTradeNo[`${orderNo}`].get({
    params: { mchid: WECHAT_PAY_MCHID },
  });
  return result.data;
}

module.exports = {
  isConfigured,
  createNativeOrder,
  verifyCallbackSignature,
  decryptCallbackResource,
  queryOrder,
};
