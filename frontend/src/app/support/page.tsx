'use client';


const sections = [
  {
    title: '平台基础',
    items: [
      { title: '什么是中新数据港 AgentWork？', desc: '基于中新数据港跨境基础设施的 AI 数字员工 SaaS 平台。' },
      { title: '如何注册入驻？', desc: '完成手机号注册 → 实名认证 → 企业认证（已有公司直接上传执照，无公司可由平台代办注册）→ 签署合同即可开通服务。' },
      { title: '什么是 AI 数字员工？', desc: '基于大语言模型的自动化工作 Agent，可扮演销售、客服、技术、合规、助理等角色。' },
    ],
  },
  {
    title: '计费与充值',
    items: [
      { title: 'Token 如何计费？', desc: '按实际调用模型的 prompt + completion Token 量实时计费，不同模型单价不同。' },
      { title: '套餐和按量哪个划算？', desc: '初创企业建议创业版套餐（含 3 个 Agent + 50 万 Token）；业务稳定后可按量充值。' },
      { title: '余额不足会怎样？', desc: 'Agent 自动暂停服务，充值后立即恢复。不会自动扣款或透支。' },
    ],
  },
  {
    title: '跨境合规',
    items: [
      { title: '使用海外模型是否合规？', desc: '通过 CSDP 跨境专线访问，平台已完成数据出境安全评估，用户无需单独申报。一人公司亦为法人主体，可合法接受服务。' },
      { title: '我需要自己注册 OpenAI/Claude 账号吗？', desc: '不需要。平台统一采购海外模型 API，您无需自行注册海外模型账号，也无需外币信用卡。只需在平台充值人民币，即可通过平台调用海外模型能力。' },
      { title: '我的数据存储在哪里？', desc: '用户业务数据存储在平台重庆节点；跨境传输数据经专线加密传输至海外模型节点。' },
      { title: '硬件接入 vs 平台接入怎么选？', desc: '小企业建议平台接入（成本低、即开即用）；中大型企业可选硬件专线（带宽独享、可控性强）。' },
    ],
  },
  {
    title: '任务与收益',
    items: [
      { title: '如何接单赚钱？', desc: '进入任务大厅，筛选符合技能的任务，报名后按需求方要求完成交付。' },
      { title: '收益何时到账？', desc: '任务验收通过后 7 日内结算至钱包，每月 1-5 日可发起提现。' },
      { title: '信用分是什么？', desc: '按时交付、好评率高可提升信用分，信用分高可解锁高价值任务和优惠费率。' },
    ],
  },
];

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-slate-50">
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-3">帮助中心</h1>
          <p className="text-slate-600">常见问题与平台使用指南</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section) => (
            <div key={section.title} className="card bg-white">
              <h2 className="text-lg font-bold text-brand-700 mb-4">{section.title}</h2>
              <div className="space-y-4">
                {section.items.map((item, i) => (
                  <div key={i} className="border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                    <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-slate-600">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-10 card bg-white text-center">
          <h2 className="text-lg font-bold text-slate-900 mb-3">仍未解决？</h2>
          <p className="text-sm text-slate-600 mb-6">
            联系客服主管（AI 客服 7×24 在线，人工客服工作日 9:00-18:00）
          </p>
          <div className="flex justify-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <span className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center">📧</span>
              csdp-cq@139.com
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <span className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center">📍</span>
              重庆市渝中区 T4N 塔楼 23 层
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
