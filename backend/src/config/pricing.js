// 后端定价配置 — 与前端 opc-platform/frontend/src/lib/pricing.ts 保持一致
// 模型价格来源：LingAPI 模型价格表（2026-07-13）
// CSDP 售价 = 官方价 × 0.8（8折），LingAPI 折扣为平台采购成本

const MODEL_PRICING = {
  'MiniMax-M2.7': {
    input: 0.00168,
    output: 0.00672,
    currency: 'CNY',
    markup: 0,
  },
  'asset_create_media': {
    input: 0,
    output: 0,
    perCall: 0.04352,
    currency: 'CNY',
    markup: 0,
  },
  'omni_flash-v2v': {
    input: 0,
    output: 0,
    perCall: 2.72,
    currency: 'CNY',
    markup: 0,
  },
  'claude-fable-5': {
    input: 0.0544,
    output: 0.272,
    currency: 'CNY',
    markup: 0,
  },
  'claude-opus-4-6': {
    input: 0.0272,
    output: 0.136,
    currency: 'CNY',
    markup: 0,
  },
  'claude-opus-4-6-thinking': {
    input: 0.0272,
    output: 0.136,
    currency: 'CNY',
    markup: 0,
  },
  'claude-opus-4-7': {
    input: 0.0272,
    output: 0.136,
    currency: 'CNY',
    markup: 0,
  },
  'claude-opus-4-7-thinking': {
    input: 0.0272,
    output: 0.136,
    currency: 'CNY',
    markup: 0,
  },
  'claude-opus-4-8': {
    input: 0.0272,
    output: 0.136,
    currency: 'CNY',
    markup: 0,
  },
  'claude-sonnet-4-6': {
    input: 0.01632,
    output: 0.0816,
    currency: 'CNY',
    markup: 0,
  },
  'claude-sonnet-4-6-thinking': {
    input: 0.01632,
    output: 0.0816,
    currency: 'CNY',
    markup: 0,
  },
  'claude-sonnet-5': {
    input: 0.01088,
    output: 0.0544,
    currency: 'CNY',
    markup: 0,
  },
  'deepseek-v4-flash': {
    input: 0.00049,
    output: 0.000979,
    currency: 'CNY',
    markup: 0,
  },
  'deepseek-v4-pro': {
    input: 0.002366,
    output: 0.004733,
    currency: 'CNY',
    markup: 0,
  },
  'gemini-3.1-pro-preview': {
    input: 0.01088,
    output: 0.06528,
    currency: 'CNY',
    markup: 0,
  },
  'gemini-3.5-flash': {
    input: 0.00816,
    output: 0.04896,
    currency: 'CNY',
    markup: 0,
  },
  'nano-banana-2': {
    input: 0,
    output: 0,
    perCall: 0.7616,
    currency: 'CNY',
    markup: 0,
  },
  'nano-banana-pro': {
    input: 0,
    output: 0,
    perCall: 0.9792,
    currency: 'CNY',
    markup: 0,
  },
  'gpt-5.4': {
    input: 0.0136,
    output: 0.0816,
    currency: 'CNY',
    markup: 0,
  },
  'gpt-5.4-mini': {
    input: 0.00408,
    output: 0.02448,
    currency: 'CNY',
    markup: 0,
  },
  'gpt-5.5': {
    input: 0.0272,
    output: 0.1632,
    currency: 'CNY',
    markup: 0,
  },
  'gpt-5.6-luna': {
    input: 0.00544,
    output: 0.04352,
    currency: 'CNY',
    markup: 0,
  },
  'gpt-5.6-sol': {
    input: 0.0272,
    output: 0.2176,
    currency: 'CNY',
    markup: 0,
  },
  'gpt-5.6-terra': {
    input: 0.0136,
    output: 0.1088,
    currency: 'CNY',
    markup: 0,
  },
  'gpt-image-2': {
    input: 0,
    output: 0,
    perCall: 0.3264,
    currency: 'CNY',
    markup: 0,
  },
  'gpt-image-2-4k': {
    input: 0,
    output: 0,
    perCall: 0.457143,
    currency: 'CNY',
    markup: 0,
  },
  'canling-seedance-2.0': {
    input: 0,
    output: 0,
    currency: 'CNY',
    markup: 0,
  },
  'canling-seedance-2.0-fast': {
    input: 0,
    output: 0,
    currency: 'CNY',
    markup: 0,
  },
  'glm-4.7': {
    input: 0.002176,
    output: 0.00952,
    currency: 'CNY',
    markup: 0,
  },
  'glm-5': {
    input: 0.0032,
    output: 0.01312,
    currency: 'CNY',
    markup: 0,
  },
  'glm-5.1': {
    input: 0.0048,
    output: 0.01968,
    currency: 'CNY',
    markup: 0,
  },
  'qwen-plus': {
    input: 0.001088,
    output: 0.00272,
    currency: 'CNY',
    markup: 0,
  },
  'qwen3.7-max': {
    input: 0.0096,
    output: 0.0288,
    currency: 'CNY',
    markup: 0,
  },
};

const TOKEN_PACKAGES = [
  {
    id: 'token-credit-100',
    name: '轻量充值',
    price: 100,
    credit: 110,
    period: '永久有效',
    description: '充值 ¥100，到账 ¥110',
    discount: '送 ¥10',
    unitPrice: '按模型实际单价',
    effectiveMarkup: '无均价包',
  },
  {
    id: 'token-credit-500',
    name: '标准充值',
    price: 500,
    credit: 580,
    period: '永久有效',
    description: '充值 ¥500，到账 ¥580',
    discount: '送 ¥80',
    unitPrice: '按模型实际单价',
    effectiveMarkup: '约8.6折',
  },
  {
    id: 'token-credit-2000',
    name: '企业充值',
    price: 2000,
    credit: 2400,
    period: '永久有效',
    description: '充值 ¥2000，到账 ¥2400',
    discount: '送 ¥400',
    unitPrice: '按模型实际单价',
    effectiveMarkup: '约8.3折',
  },
  {
    id: 'token-credit-10000',
    name: '年付充值',
    price: 10000,
    credit: 13000,
    period: '永久有效',
    description: '充值 ¥10000，到账 ¥13000',
    discount: '送 ¥3000',
    unitPrice: '按模型实际单价',
    effectiveMarkup: '约7.7折',
  },
];

const PROMOTION_PACKAGES = [
  {
    id: 'promo-experience',
    name: '体验版',
    description: '适合个人创业者初次体验',
    price: 99,
    period: '月付',
    features: [
      '1 个 AI 数字员工（行政助理）',
      '价值 ¥100 Token 额度/月',
      '国内模型能力（DeepSeek / Kimi / 通义）',
      '基础客服支持',
    ],
    aiEmployees: ['assistant'],
    tokenQuota: 100000,
    tokenCredit: 100,
    limit: '每人限购 1 次，限购 1 个月',
    target: '拉新',
  },
  {
    id: 'promo-startup',
    name: '创业版',
    description: '适合初创企业快速启动',
    price: 999,
    originalPrice: 2500,
    period: '首月特惠',
    features: [
      '3 个 AI 数字员工（自选角色）',
      '价值 ¥600 Token 额度/月',
      '国内模型能力（DeepSeek / Kimi / 通义）',
      '优先客服支持',
      '海外模型能力接入后自动升级',
    ],
    aiEmployees: ['sales', 'support', 'assistant'],
    tokenQuota: 500000,
    tokenCredit: 600,
    annualDiscount: 0.8,
    limit: '前 100 名首月 ¥999',
    target: '开园主推',
    isPopular: true,
  },
  {
    id: 'promo-overseas',
    name: '出海版',
    description: '适合有海外业务的企业',
    price: 3999,
    period: '月付',
    features: [
      '6 个 AI 数字员工（全角色）',
      '价值 ¥2500 Token 额度/月',
      '国内模型能力（DeepSeek / Kimi / 通义）',
      '优先客服支持',
      '海外模型能力接入后自动升级',
      '专属客户成功经理',
    ],
    aiEmployees: ['ceo', 'sales', 'support', 'solution', 'compliance', 'assistant'],
    tokenQuota: 2000000,
    tokenCredit: 2500,
    annualDiscount: 0.9,
    target: '高价值用户',
  },
];

const LINE_BUNDLE_PROMOS = [
  {
    lineType: 'csdp-wan',
    bandwidth: 5,
    monthlyFee: 1500, // 5M × 300元/M
    freeTokenCredit: 500,
    promoName: '专线 5M 首年优惠',
    description: '买 5M 专线，送 ¥500 Token 额度',
  },
  {
    lineType: 'csdp-wan',
    bandwidth: 10,
    monthlyFee: 3000, // 10M × 300元/M
    freeTokenCredit: 2000,
    promoName: '专线 10M 首年优惠',
    description: '买 10M 专线，送 ¥2000 Token 额度',
  },
  {
    lineType: 'csdp-wan',
    bandwidth: 20,
    monthlyFee: 6000, // 20M × 300元/M
    freeTokenCredit: 5000,
    promoName: '专线 20M 首年优惠',
    description: '买 20M 专线，送 ¥5000 Token 额度 + 创业版套餐',
  },
];

const NETWORK_SERVICES = [
  {
    id: 'net-solo',
    name: '跨境个人版',
    description: '适合跨境电商独立站、SOHO 个人',
    bandwidth: 5,
    monthlyFee: 1500,
    trafficLimit: '不限流量',
    ipType: '专属IP（可选）',
    autoConfig: true,
    features: [
      '5M 带宽独享通道',
      '不限流量',
      '可选专属 IP 地址（防关联）',
      '自动分配网络标识',
      '平台统一合规管理',
      '跨境电商独立站适用',
      '7×24 技术监控',
    ],
    target: '跨境电商 / 独立站 / SOHO',
  },
  {
    id: 'net-pro',
    name: '跨境专业版',
    description: '适合多店铺运营、团队使用',
    bandwidth: 10,
    monthlyFee: 3000,
    trafficLimit: '不限流量',
    ipType: '专属IP（可选）',
    autoConfig: true,
    features: [
      '10M 带宽独享通道',
      '不限流量',
      '可选专属 IP 地址（独立站防关联）',
      '平台统一合规管理',
      '多店铺/多账号环境隔离',
      '优先级网络保障',
      'API 接口管理',
    ],
    target: '跨境电商团队 / 多店铺运营',
    isPopular: true,
  },
  {
    id: 'net-business',
    name: '跨境企业版',
    description: '适合规模企业、高稳定性需求',
    bandwidth: 20,
    monthlyFee: 6000,
    trafficLimit: '不限流量',
    ipType: '专属IP（多段）',
    autoConfig: true,
    features: [
      '20M 带宽独享通道',
      '不限流量',
      '多段专属 IP 地址',
      '独立合规通道（可审计）',
      '多环境隔离 + 负载均衡',
      'SLA 99.9% 保障',
      '专属技术支持',
      '审计日志导出',
    ],
    target: '规模企业 / 高稳定性需求',
  },
];

const IP_SERVICES = [
  {
    id: 'ip-shared',
    name: '共享 IP',
    description: '平台自动分配，多用户共享出口',
    price: 0,
    unit: '月',
    included: ['net-solo', 'net-pro', 'net-business'],
    suitable: '一般跨境访问、AI 模型调用',
  },
  {
    id: 'ip-dedicated',
    name: '专属 IP',
    description: '独立出口地址，防关联、可审计',
    price: 299,
    unit: '月/个',
    included: ['net-pro', 'net-business'],
    extra: 'net-solo 可额外购买',
    suitable: '跨境电商独立站防关联、多账号管理',
  },
  {
    id: 'ip-segment',
    name: 'IP 地址段',
    description: '多段专属 IP，适合大规模运营',
    price: 999,
    unit: '月/段',
    included: ['net-business'],
    extra: 'net-pro 可额外购买',
    suitable: '多店铺矩阵、大规模账号运营',
  },
];

const AGENT_EMPLOYEE_PRICING = {
  ceo: { monthly: 800, name: 'CEO' },
  sales: { monthly: 600, name: '销售总监' },
  support: { monthly: 500, name: '客服主管' },
  solution: { monthly: 600, name: '技术方案官' },
  compliance: { monthly: 500, name: '合规风控官' },
  assistant: { monthly: 300, name: '行政助理' },
};

function calculateTokenCost(modelName, promptTokens, completionTokens) {
  const pricing = MODEL_PRICING[modelName];
  if (!pricing) {
    throw new Error(`未知模型: ${modelName}`);
  }
  if (pricing.perCall) {
    return {
      perCallCost: Math.round(pricing.perCall * 10000) / 10000,
      totalCost: Math.round(pricing.perCall * 10000) / 10000,
      markup: pricing.markup,
    };
  }
  const inputCost = (promptTokens / 1000) * pricing.input;
  const outputCost = (completionTokens / 1000) * pricing.output;
  const totalCost = inputCost + outputCost;
  return {
    inputCost: Math.round(inputCost * 10000) / 10000,
    outputCost: Math.round(outputCost * 10000) / 10000,
    totalCost: Math.round(totalCost * 10000) / 10000,
    markup: pricing.markup,
  };
}

module.exports = {
  MODEL_PRICING,
  TOKEN_PACKAGES,
  PROMOTION_PACKAGES,
  LINE_BUNDLE_PROMOS,
  NETWORK_SERVICES,
  IP_SERVICES,
  AGENT_EMPLOYEE_PRICING,
  calculateTokenCost,
};
