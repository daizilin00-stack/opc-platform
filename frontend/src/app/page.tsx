import Link from "next/link";
import { PROMOTION_PACKAGES } from '@/lib/pricing';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="relative overflow-hidden bg-white">
        <div className="absolute top-0 right-0 w-96 h-96 opacity-5 pixel-dots" />
        <div className="absolute bottom-0 left-0 w-64 h-64 opacity-5 pixel-dots" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 px-3 py-1 rounded-full text-sm font-medium mb-6">
                <span className="w-2 h-2 bg-accent-500 rounded-full" />
                中新数据港 · AI SaaS 服务平台
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                开园在即
                <span className="text-brand-600"> AI 数字团队</span>
                <span className="block text-2xl mt-2 text-slate-500">首批 100 席位预约中</span>
              </h1>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                注册重庆公司，接入 CSDP AgentWork AI 数字员工平台。
                无需关心底层技术，即开即用，
                让 AI 帮您生产内容、服务客户。
                <span className="block text-sm text-slate-400 mt-2">已有公司？直接入驻，无需重新注册。</span>
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/register" className="btn-primary text-lg px-8 py-3">
                  预约开园名额
                </Link>
                <Link href="/pricing" className="btn-secondary text-lg px-8 py-3">
                  查看定价方案
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-brand-500 rounded-full" />
                  开园倒计时：7天
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-brand-500 rounded-full" />
                  已预约 23/100
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-brand-500 rounded-full" />
                  开园特惠 6折
                </span>
              </div>
              
              <div className="mt-6 bg-accent-50 border-l-3 border-accent-500 p-4 rounded-r-xl">
                <p className="text-sm text-slate-600">
                  <strong className="text-accent-600">SaaS 模式：</strong>
                  平台统一采购和调度海外主流 AI 模型能力（GPT-4o / Claude / Kimi / 通义），封装为即开即用的数字员工服务。
                  您无需自行注册海外模型账号，无需外币信用卡，只需向平台支付人民币，即可合规使用海外模型能力。
                </p>
              </div>
            </div>
            <div className="relative">
              <Link href="/ai-employees" className="block no-underline">
                <div className="bg-gradient-to-br from-brand-50 to-accent-50 rounded-2xl p-8 border border-slate-100 hover:shadow-lg transition-all">
                  <div className="space-y-4">
                    {[
                      { role: "CEO", name: "团坐009", status: "在线", color: "bg-brand-600", query: "ceo" },
                      { role: "销售总监", name: "客户开发", status: "工作中", color: "bg-accent-500", query: "sales" },
                      { role: "客服主管", name: "7×24 多语言应答", status: "工作中", color: "bg-accent-500", query: "support" },
                      { role: "技术方案官", name: "待命", status: "待命", color: "bg-slate-400", query: "solution" },
                    ].map((agent, i) => (
                      <div key={i} className="flex items-center gap-4 bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className={`w-10 h-10 ${agent.color} rounded-lg flex items-center justify-center text-white text-sm font-bold`}>
                          {agent.role[0]}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">{agent.role}</div>
                          <div className="text-sm text-slate-500">{agent.name}</div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          agent.status === "在线" ? "bg-brand-50 text-brand-700" :
                          agent.status === "工作中" ? "bg-accent-50 text-accent-700" :
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {agent.status}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-center text-sm text-brand-600 font-medium">
                    点击了解全部 6 个 AI 数字员工 →
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Core Services */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">平台核心服务</h2>
          <p className="text-slate-600">基于中新数据港基础设施，为企业提供即开即用的 AI SaaS 服务</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              title: "AI 数字员工",
              subtitle: "销售 · 客服 · 技术 · 合规 · 助理",
              desc: "雇佣 AI 数字员工完成日常业务工作。平台自动调度国内主流 AI 模型（Kimi / 通义 / 文心），您只需关注业务目标，无需关心底层技术细节。按月订阅，按需雇佣，随时增减。",
              icon: "🕴️",
              tag: "SaaS 应用",
              tagColor: "bg-brand-50 text-brand-700",
              highlight: true,
              link: "/ai-employees",
            },            {
              title: "OpenClaw 部署平台",
              subtitle: "10 分钟上线自定义 AI Agent",
              desc: "在平台云环境中快速部署您自己的 AI Agent 应用。平台提供计算资源、模型接口和运行环境，您专注业务逻辑。",
              icon: "🚀",
              tag: "部署平台",
              tagColor: "bg-accent-50 text-accent-700",
              highlight: true,
              link: "/deploy",
            },
            {
              title: "Token 团购中心",
              subtitle: "用多少算多少，透明计费",
              desc: "AI 数字员工工作消耗的 Token 实时计费。平台集中采购全球模型能力，以透明价格提供给企业用户。充值即用，余额不足自动提醒。",
              icon: "💎",
              tag: "资源计费",
              tagColor: "bg-brand-50 text-brand-700",
              highlight: false,
              link: "/token-center",
            },
            {
              title: "跨境网络服务",
              subtitle: "合规通道 · 专属 IP · 自动配置",
              desc: "为跨境电商、独立站、个人创业者提供合规、稳定、自动配置的跨境网络通道。专属 IP 防关联，带宽按 300元/M/月 灵活选择，不限流量，即开即用。",
              icon: "🌐",
              tag: "基础设施",
              tagColor: "bg-accent-50 text-accent-700",
              highlight: true,
              link: "/network-services",
            },
          ].map((service, i) => (
            <Link key={i} href={service.link || '#'} className="block no-underline">
              <div className={`card ${service.highlight ? 'card-highlight' : ''} hover:shadow-lg transition-all h-full`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{service.icon}</div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${service.tagColor}`}>
                    {service.tag}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">{service.title}</h3>
                <p className="text-sm text-brand-600 font-medium mb-3">{service.subtitle}</p>
                <p className="text-slate-600 text-sm leading-relaxed">{service.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">开园入驻套餐</h2>
            <p className="text-slate-600">注册重庆公司，选择适合您的 AI 数字员工方案</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PROMOTION_PACKAGES.map((plan) => (
              <div key={plan.id} className={`card ${plan.isPopular ? 'ring-2 ring-brand-500' : ''} relative`}>
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs px-4 py-1 rounded-full font-semibold">
                    开园推荐
                  </div>
                )}
                <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <div className="text-3xl font-bold text-slate-900 mb-1">
                  ¥{plan.price}
                  {plan.originalPrice && (
                    <span className="text-sm font-medium text-slate-400 line-through ml-2">¥{plan.originalPrice}</span>
                  )}
                  <span className="text-sm font-medium text-slate-400">/{plan.period}</span>
                </div>
                <p className="text-sm text-slate-500 mb-4">{plan.description}</p>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="text-accent-500 font-bold">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.id === 'promo-experience' ? '/register' : plan.id === 'promo-startup' ? '/register' : '/support'} className={`block w-full text-center py-3 rounded-lg font-medium transition-colors ${plan.isPopular ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                  {plan.id === 'promo-experience' ? '免费体验' : plan.id === 'promo-startup' ? '立即入驻' : '预约咨询'}
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/pricing" className="text-brand-600 font-medium hover:underline">
              查看完整定价方案 →
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-1">23/100</div>
              <div className="text-brand-100 text-sm">开园预约名额</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-1">6</div>
              <div className="text-brand-100 text-sm">AI 数字员工</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-1">40%</div>
              <div className="text-brand-100 text-sm">开园首月优惠</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-1">10min</div>
              <div className="text-brand-100 text-sm">Agent 部署上线</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-white font-bold text-lg">CSDP</span>
                <span className="text-slate-500">|</span>
                <span className="text-brand-400 font-bold text-lg">AgentWork</span>
              </div>
              <p className="text-sm">中新数据港旗下 AI 数字员工 SaaS 平台。依托中新数据港跨境基础设施，为企业提供即开即用的 AI 生产能力，助力跨境业务拓展。</p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3">联系方式</h4>
              <p className="text-sm">重庆市渝中区长江滨江路 2 号<br />T4N 塔楼第 23 层<br />csdp-cq@139.com</p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3">快速链接</h4>
              <div className="flex flex-col gap-2 text-sm">
                <Link href="/support" className="hover:text-white transition-colors">帮助中心</Link>
                <Link href="/pricing" className="hover:text-white transition-colors">定价方案</Link>
                <Link href="/network-services" className="hover:text-white transition-colors">跨境网络</Link>
                <Link href="/learn" className="hover:text-white transition-colors">学习中心</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 text-center text-sm space-y-2">
            <p>© 2026 中新数据港（重庆）科技有限公司 · CSDP AgentWork</p>
            <p>
              <a
                href="https://beian.miit.gov.cn/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                渝ICP备2026018045号
              </a>
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
