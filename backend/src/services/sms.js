/**
 * 短信服务封装
 * 支持阿里云 SMS，未配置或发送失败时自动 fallback 到 mock（日志输出）
 */

const crypto = require('crypto');
const axios = require('axios');
const logger = require('../utils/logger');

// 生成 6 位数字验证码
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// mock 发送：仅记录日志，返回验证码（用于开发和未开通短信服务时）
async function sendMockCode(phone, code, templateCode) {
  logger.info(`[MOCK SMS] 向 ${phone} 发送验证码: ${code}${templateCode ? `, 模板: ${templateCode}` : ''}`);
  return { success: true, provider: 'mock', code };
}

// 阿里云 SMS 签名验证辅助函数
function sign(key, str) {
  return crypto.createHmac('sha1', key).update(str, 'utf8').digest('base64');
}

/**
 * 使用阿里云 SMS OpenAPI 发送短信验证码
 * 文档：https://help.aliyun.com/document_detail/101414.html
 */
async function sendAliyunSmsCode(phone, code, signName, templateCode) {
  const accessKeyId = process.env.SMS_ALIYUN_ACCESS_KEY_ID;
  const accessKeySecret = process.env.SMS_ALIYUN_ACCESS_KEY_SECRET;

  if (!accessKeyId || !accessKeySecret || !signName || !templateCode) {
    throw new Error('阿里云 SMS 配置不完整');
  }

  const params = {
    AccessKeyId: accessKeyId,
    Action: 'SendSms',
    Format: 'JSON',
    PhoneNumbers: phone,
    SignName: signName,
    TemplateCode: templateCode,
    TemplateParam: JSON.stringify({ code }),
    SignatureMethod: 'HMAC-SHA1',
    SignatureNonce: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
    SignatureVersion: '1.0',
    Timestamp: new Date().toISOString(),
    Version: '2017-05-25',
  };

  // 按键名 ASCII 升序排列
  const sortedKeys = Object.keys(params).sort();
  const canonicalQueryString = sortedKeys
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&');

  const stringToSign = `GET&${encodeURIComponent('/')}&${encodeURIComponent(canonicalQueryString)}`;
  const signature = sign(`${accessKeySecret}&`, stringToSign);

  const url = `https://dysmsapi.aliyuncs.com/?${canonicalQueryString}&Signature=${encodeURIComponent(signature)}`;

  const response = await axios.get(url, { timeout: 10000 });
  const data = response.data;

  if (data.Code && data.Code !== 'OK') {
    throw new Error(`阿里云 SMS 发送失败: ${data.Code} - ${data.Message}`);
  }

  return { success: true, provider: 'aliyun', requestId: data.RequestId, code };
}

/**
 * 发送验证码短信
 * @param {string} phone
 * @returns {Promise<{success: boolean, code: string, provider: string, error?: string}>}
 */
async function sendVerificationCode(phone) {
  const code = generateCode();
  const signName = process.env.SMS_ALIYUN_SIGN_NAME;
  const templateCode = process.env.SMS_RESET_PASSWORD_TEMPLATE_CODE;

  // 如果配置了阿里云 SMS，优先使用真实发送
  if (process.env.SMS_PROVIDER === 'aliyun' || (process.env.SMS_ALIYUN_ACCESS_KEY_ID && signName && templateCode)) {
    try {
      const result = await sendAliyunSmsCode(phone, code, signName, templateCode);
      return { ...result, code };
    } catch (err) {
      logger.warn(`阿里云 SMS 发送失败，fallback 到 mock: ${err.message}`);
      return sendMockCode(phone, code, templateCode);
    }
  }

  // 默认 mock
  return sendMockCode(phone, code);
}

module.exports = {
  generateCode,
  sendVerificationCode,
};
