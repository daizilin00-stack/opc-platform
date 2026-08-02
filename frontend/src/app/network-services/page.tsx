'use client';

import { useState } from 'react';
import Link from 'next/link';
import { NETWORK_SERVICES, IP_SERVICES } from '@/lib/pricing';
import { useStore } from '@/lib/store';

export default function NetworkServicesPage() {
  const [activeTab, setActiveTab] = useState<'packages' | 'ip' | 'usecase'>('packages');
  const [customBandwidth, setCustomBandwidth] = useState(20);
  const PRICE_PER_M = 300; // 独立带宽单价：300元/M/月
  const isLoggedIn = useStore((state) => state.isLoggedIn);

  const estimatedPrice = customBandwidth * PRICE_PER_M;

  return (
    <div className="min-h-screen bg-slate-50">
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-3">CSDP 跨境网络服务</h1>
          <p className="text-slate-600">为跨境电商、独立站、个人创业者提供合规、稳定、自动配置的跨境网络通道</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-10">
          {[
            { key: 'packages', label: '网络套餐' },
            { key: 'ip', label: 'IP 地址' },
            { key: 'usecase', label: '使用场景' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Packages Tab */}
        {activeTab === 'packages' && (
          <div>
            {/* Auto-config banner */}
            <div className="bg-accent-50 border border-accent-200 rounded-lg p-4 mb-8 flex items-center gap-3">
              <span className="text-2xl">🚀</span>
              <div>
                <p className="font-semibold text-accent-700">自动配置专属网络服务</p>
                <p className="text-sm text-accent-600">开通后平台自动为您分配网络资源，无需手动配置，即开即用</p>
              </div>
            </div>

            {/* 带宽价格估算器 */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
              <h3 className="text-lg font-bold text-slate-900 mb-4">💡 带宽价格估算器</h3>
              <div className="bg-accent-50 border border-accent-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-accent-700">
                  <strong>定价标准：</strong>跨境专线带宽按 <strong>¥300/M/月</strong> 计费，不限流量。共享带宽享受折扣，独享带宽按标准价。
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">选择带宽（Mbps）</label>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={customBandwidth}
                    onChange={(e) => setCustomBandwidth(Number(e.target.value))}
                    className="w-full accent-brand-600"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>5M</span>
                    <span className="text-brand-600 font-bold text-sm">{customBandwidth}M</span>
                    <span>100M</span>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-slate-500 mb-1">独立带宽单价</p>
                  <p className="text-2xl font-bold text-brand-600">¥{PRICE_PER_M}<span className="text-sm font-normal text-slate-400">/M/月</span></p>
                </div>
                <div className="bg-brand-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-slate-500 mb-1">预估月费</p>
                  <p className="text-3xl font-bold text-brand-700">¥{estimatedPrice.toLocaleString()}<span className="text-sm font-normal text-slate-400">/月</span></p>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-4">* 基于独立带宽 ¥300/M/月 估算，实际价格可能因合约期限、IP 数量等因素有所调整</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {NETWORK_SERVICES.map((plan) => (
                <div key={plan.id} className={`card bg-white ${plan.isPopular ? 'ring-2 ring-brand-500' : ''} relative`}>
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs px-4 py-1 rounded-full font-semibold">
                      推荐
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🌐</span>
                    <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                  </div>
                  <p className="text-sm text-slate-500 mb-3">{plan.description}</p>
                  <div className="text-3xl font-bold text-slate-900 mb-1">
                    ¥{plan.monthlyFee}
                    <span className="text-sm font-medium text-slate-400">/月</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">{plan.target}</p>

                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between text-slate-600">
                      <span>带宽</span>
                      <span className="font-medium">{plan.bandwidth} Mbps</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>流量</span>
                      <span className="font-medium text-green-600">不限流量</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>IP 类型</span>
                      <span className="font-medium">{plan.ipType}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>自动配置</span>
                      <span className="font-medium text-accent-600">{plan.autoConfig ? '✓ 已开启' : '手动'}</span>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-6 text-sm">
                {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-slate-600">
                        <span className="text-accent-500 font-bold">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link href={isLoggedIn ? `/order?plan=${plan.id}&bandwidth=${plan.bandwidth}&months=1` : '/register'} className={`block w-full text-center py-3 rounded-lg font-medium transition-colors ${
                    plan.isPopular ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}>
                    {isLoggedIn ? '立即下单' : '立即开通'}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* IP Tab */}
        {activeTab === 'ip' && (
          <div>
            <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 mb-8">
              <p className="text-sm text-brand-700">
                <strong>为什么要专属 IP？</strong> 跨境电商多账号/多店铺运营时，共享 IP 可能导致平台关联封号。专属 IP 为每个店铺提供独立网络身份，有效防关联。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {IP_SERVICES.map((ip) => (
                <div key={ip.id} className="card bg-white">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{ip.name}</h3>
                  <p className="text-sm text-slate-500 mb-4">{ip.description}</p>
                  <div className="text-2xl font-bold text-brand-600 mb-4">
                    {ip.price === 0 ? '免费' : `¥${ip.price}`}
                    <span className="text-sm font-medium text-slate-400">/{ip.unit}</span>
                  </div>
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="text-slate-600">
                      <span className="font-medium">适用场景：</span>{ip.suitable}
                    </div>
                    <div className="text-slate-600">
                      <span className="font-medium">包含套餐：</span>{ip.included.join(' / ')}
                    </div>
                    {ip.extra && (
                      <div className="text-slate-600">
                        <span className="font-medium">额外购买：</span>{ip.extra}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 card bg-white">
              <h3 className="text-lg font-bold text-slate-900 mb-4">IP 地址自动分配规则</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="font-medium text-slate-900 mb-2">自动分配</div>
                  <p className="text-slate-600">开通服务后，平台自动从 IP 池中为您分配地址，无需手动配置。5 分钟内生效。</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="font-medium text-slate-900 mb-2">IP 更换</div>
                  <p className="text-slate-600">共享 IP 每月可更换一次；专属 IP 如需更换，提交工单处理，24 小时内完成。</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="font-medium text-slate-900 mb-2">IP 绑定</div>
                  <p className="text-slate-600">专属 IP 可绑定到具体账号/店铺，绑定后该 IP 仅为此账号使用，不与其他用户共享。</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="font-medium text-slate-900 mb-2">IP 审计</div>
                  <p className="text-slate-600">专属 IP 提供完整访问日志，支持导出审计报告，满足合规要求。</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Usecase Tab */}
        {activeTab === 'usecase' && (
          <div className="space-y-6">
            {[
              {
                icon: '🛒',
                title: '跨境电商独立站',
                desc: 'Shopify / WooCommerce / Amazon 独立卖家，需要稳定跨境访问海外店铺后台、上传产品、处理订单。',
                solution: '跨境个人版（5M 共享）→ 专业版（10M + 专属 IP）',
                benefit: '平台自动分配网络通道，无需自建 VPN；专属 IP 防关联，保护店铺安全',
              },
              {
                icon: '📱',
                title: '海外社交媒体运营',
                desc: 'TikTok / Instagram / Facebook 运营，需要稳定访问海外社交平台，发布内容、管理广告账户。',
                solution: '跨境个人版（5M 共享）',
                benefit: '自动配置，即开即用；合规通道，避免账号被封风险',
              },
              {
                icon: '🤖',
                title: 'AI 模型开发调用',
                desc: '开发者需要调用 GPT-4 / Claude 等海外模型 API，进行产品开发或自动化流程。',
                solution: '跨境专业版（10M + 专属 IP）→ 企业版（100M）',
                benefit: 'API 调用低延迟、高稳定性；专属 IP 便于 API 白名单管理',
              },
              {
                icon: '📦',
                title: '多店铺矩阵运营',
                desc: '同时运营多个 Amazon / Shopify / Etsy 店铺，需要每个店铺独立网络环境，防止平台关联。',
                solution: '跨境企业版（100M + 多段专属 IP）',
                benefit: '多段 IP 地址段，每个店铺分配独立 IP；环境完全隔离，零关联风险',
              },
              {
                icon: '💼',
                title: '外贸企业办公',
                desc: '外贸团队需要访问 Google / LinkedIn / 海外邮件系统，进行客户开发和商务沟通。',
                solution: '跨境专业版（10M）→ 企业版（100M）',
                benefit: '团队共享带宽，成本均摊；SLA 保障，办公不中断',
              },
            ].map((case_, i) => (
              <div key={i} className="card bg-white">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{case_.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{case_.title}</h3>
                    <p className="text-sm text-slate-600 mb-3">{case_.desc}</p>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <div className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full">
                        推荐：{case_.solution}
                      </div>
                    </div>
                    <p className="text-sm text-accent-600 mt-2">{case_.benefit}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FAQ */}
        <div className="mt-12 card bg-white">
          <h3 className="text-lg font-bold text-slate-900 mb-4">常见问题</h3>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">开通后多久可以使用？</h4>
              <p className="text-slate-600">平台自动配置，支付完成后 5 分钟内网络通道生效。您会收到短信/邮件通知。</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">支持哪些设备接入？</h4>
              <p className="text-slate-600">支持 Windows / macOS / iOS / Android 设备，通过平台客户端或浏览器插件接入。无需额外硬件。</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">专属 IP 和普通 VPN 有什么区别？</h4>
              <p className="text-slate-600">普通 VPN 多为共享 IP，多人使用同一地址，易被平台识别并封号。专属 IP 是您的独立出口地址，仅为您一人使用，大幅降低关联风险。</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">跨境网络服务合规吗？</h4>
              <p className="text-slate-600">完全合规。中新数据港持有跨境数据通信资质，所有网络服务均通过持牌专线提供。您以公司法人主体身份使用服务，无需额外申报。</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">我需要自己注册海外模型账号吗？</h4>
              <p className="text-slate-600">不需要。平台统一采购海外模型 API，您无需自行注册 OpenAI/Claude 账号，也无需外币信用卡。只需在平台充值人民币，即可通过平台调用海外模型能力。</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">平台如何支付海外模型费用？</h4>
              <p className="text-slate-600">中新数据港新加坡公司通过外币账户（USD/SGD）向海外模型商统一支付 API 费用。国内客户只需向平台支付人民币，平台负责所有海外结算。</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">可以月付吗？</h4>
              <p className="text-slate-600">支持月付。个人版 ¥1,500/月（5M共享）、专业版 ¥3,000/月（10M独享）、企业版 ¥6,000/月（20M独享）。年付享 8 折优惠。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
