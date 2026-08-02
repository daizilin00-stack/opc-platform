// 平台收款账户信息 — 中新数据港（重庆）科技有限公司
// 更新时同步修改：docs/payment-and-invoicing.md

export const COMPANY_INFO = {
  name: '中新数据港（重庆）科技有限公司',
  taxId: '91500103MAD9TERB7X',
  address: '重庆市渝中区长江滨江路 2 号 T4N 塔楼第 23 层 X07 号',
  phone: '028-69296293',
  bankName: '中国民生银行股份有限公司重庆解放碑支行',
  bankAccount: '644200815',
};

export const COMPANY_INFO_SG = {
  name: 'CHINA-SINGAPORE DATA PORT PTE. LTD.', // 已确认（OCBC对账单显示含PORT）
  address: '120 ROBINSON ROAD, #13-01, SINGAPORE 068913', // 已确认
  bankName: 'OCBC Bank（华侨银行）', // 已确认
  bankAddress: '65 Chulia Street, OCBC Centre, Singapore 049513', // OCBC Centre Branch
  bankAccount: {
    sgd: '604465948001', // 新加坡元账户（Business Growth Account，已确认）
    usd: '687211722201', // 美元账户（用户单独提供）
  },
  swiftCode: 'OCBCSGSG', // OCBC Singapore标准SWIFT（OCBC Centre Branch通用）
  branch: 'OCBC Centre Branch',
  status: 'active', // USD/SGD 账户已开通，信息已确认
};

export const BILLING_CONTACT = {
  name: '石玲玲',
  phone: '15828093962',
  mailAddress: '成都市青羊区通惠门 3 号锦都一期一栋一单元 19 楼 1908',
};

export const PAYMENT_METHODS = {
  cny: {
    wechat: { name: '微信支付', fee: '0.6%', time: '即时' },
    alipay: { name: '支付宝', fee: '0.6%', time: '即时' },
    bankTransfer: {
      name: '对公转账',
      fee: '无',
      time: '1-3 工作日',
      account: COMPANY_INFO,
      contact: BILLING_CONTACT,
      note: '转账备注请务必填写「CSDP-用户ID」',
    },
  },
  // 外币收款待新加坡公司账户确认后补充
  foreign: {
    wire: { name: '银行电汇 (TT)', fee: '$20-50', time: '3-7 天', status: 'available', note: 'USD/SGD 账户已开通' },
    stripe: { name: 'Stripe (信用卡)', fee: '2.9%', time: '7-14 天', status: 'pending', note: '信用卡账户待开户' },
    paypal: { name: 'PayPal', fee: '4.4%', time: '即时', status: 'pending', note: '待开通' },
  },
};

export const INVOICE_RULES = {
  vatRate: 0.06, // 6% 增值税（已确认）
  serviceType: '技术服务', // 统一对外开具技术服务发票
  autoIssue: false, // 电子发票服务商待选定，暂为手动开票
  validityDays: 30, // 开票申请有效期（支付后30天内）
  status: 'pending_provider', // 电子发票服务商待选定
};
