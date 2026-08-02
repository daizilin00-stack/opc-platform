// 开园活动配置
// 注意：开园日期、名额等关键数据修改后请同步前端展示

export const LAUNCH_CONFIG = {
  // 开园时间（ISO 8601）
  launchDate: '2026-08-05T00:00:00+08:00',

  // 开园优惠名额
  totalSeats: 100,
  reservedSeats: 23, // 当前已预约数（可替换为 API 获取）

  // 优惠套餐
  packages: [
    {
      id: 'promo-experience',
      name: '体验版',
      tag: '不限名额',
      originalPrice: 99,
      launchPrice: 9.9,
      period: '首月',
      features: ['1 个 AI 行政助理', '价值 ¥100 Token 额度', '国内模型能力'],
    },
    {
      id: 'promo-startup',
      name: '创业版',
      tag: '前 100 名',
      originalPrice: 999,
      launchPrice: 299,
      period: '首月',
      features: ['3 个 AI 数字员工', '价值 ¥600 Token 额度', '国内 + 海外模型能力', '优先客服支持'],
      popular: true,
    },
    {
      id: 'promo-overseas',
      name: '出海版',
      tag: '前 20 名',
      originalPrice: 3999,
      launchPrice: 999,
      period: '首月',
      features: ['6 个 AI 数字员工', '价值 ¥2500 Token 额度', '专属客户成功经理', '送 1 个月 5M 专线'],
    },
  ],

  // 核心亮点
  highlights: [
    {
      icon: '🕴️',
      title: '6 个 AI 数字员工',
      desc: 'CEO、销售、客服、技术方案、合规风控、行政助理，按需雇佣',
    },
    {
      icon: '💳',
      title: '人民币结算',
      desc: '无需海外账号、无需外币信用卡，Token 充值即用',
    },
    {
      icon: '🌐',
      title: '跨境基础设施',
      desc: '依托中新数据港，合规使用 GPT/Claude/Kimi/DeepSeek',
    },
    {
      icon: '🚀',
      title: '10 分钟上线',
      desc: '注册企业、选择员工、充值 Token，立即开始工作',
    },
  ],

  // 注册即送
  registrationBonus: {
    amount: 15,
    description: '新用户注册完成实名认证，即送 ¥15 等值 Token',
  },
};

export function getRemainingSeats(): number {
  return Math.max(0, LAUNCH_CONFIG.totalSeats - LAUNCH_CONFIG.reservedSeats);
}

export function getLaunchProgress(): number {
  return Math.min(100, Math.round((LAUNCH_CONFIG.reservedSeats / LAUNCH_CONFIG.totalSeats) * 100));
}
