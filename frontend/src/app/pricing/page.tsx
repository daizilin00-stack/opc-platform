'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PROMOTION_PACKAGES, TOKEN_PACKAGES, LINE_BUNDLE_PROMOS, MODEL_PRICING_DISPLAY } from '@/lib/pricing';

export default function PricingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'promotion' | 'token' | 'model' | 'line'>('promotion');
  const [showAllModels, setShowAllModels] = useState(false);

  const handleBuy = (productId: string) => {
    router.push(`/recharge?productId=${productId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-3">CSDP AgentWork 定价方案</h1>
          <p className="text-slate-600">透明计费，按需选择，开园期间享专属优惠</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-10">
          {[
            { key: 'promotion', label: '开园套餐' },
            { key: 'token', label: 'Token 充值' },
            { key: 'model', label: '模型定价' },
            { key: 'line', label: '专线 + AI 捆绑' },
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

        {/* Promotion Tab */}
        {activeTab === 'promotion' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PROMOTION_PACKAGES.map((plan) => (
              <div key={plan.id} className={`card bg-white ${plan.isPopular ? 'ring-2 ring-brand-500' : ''} relative`}>
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
                <p className="text-xs text-accent-600 font-medium mb-4">{plan.limit}</p>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="text-accent-500 font-bold">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleBuy(plan.id)}
                  className={`block w-full text-center py-3 rounded-lg font-medium transition-colors ${
                    plan.isPopular
                      ? 'bg-brand-600 text-white hover:bg-brand-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {plan.id === 'promo-experience' ? '立即体验' : plan.id === 'promo-startup' ? '立即入驻' : '立即开通'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Token Tab */}
        {activeTab === 'token' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {TOKEN_PACKAGES.map((pkg) => (
              <div key={pkg.id} className="card bg-white">
                <h3 className="text-lg font-bold text-slate-900 mb-2">{pkg.name}</h3>
                <div className="text-2xl font-bold text-brand-600 mb-1">
                  ¥{pkg.price}
                  <span className="text-sm font-medium text-slate-400">/{pkg.period}</span>
                </div>
                <p className="text-sm text-slate-500 mb-4">{pkg.description}</p>
                <div className="space-y-2 mb-6 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>到账</span>
                    <span className="font-medium text-brand-600">¥{pkg.credit}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>折扣</span>
                    <span className="font-medium">{pkg.discount}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>计费方式</span>
                    <span className="font-medium">{pkg.unitPrice}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleBuy(pkg.id)}
                  className="block w-full text-center py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 font-medium transition-colors"
                >
                  立即充值
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Model Tab */}
        {activeTab === 'model' && (
          <div className="card bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">模型</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">计费方式</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">官方价</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">CSDP 售价</th>
                  </tr>
                </thead>
                <tbody>
                  {MODEL_PRICING_DISPLAY.slice(0, showAllModels ? MODEL_PRICING_DISPLAY.length : Math.ceil(MODEL_PRICING_DISPLAY.length / 2)).map((m) => (
                    <tr key={m.key} className="border-b border-slate-100">
                      <td className="py-3 px-4 font-medium text-slate-900">{m.label}</td>
                      <td className="py-3 px-4 text-slate-600">{m.billingType}</td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {m.billingType === '按次计费' ? (
                          m.officialPerCall ? `¥${m.officialPerCall.toFixed(4)} / 次` : '-'
                        ) : m.billingType === '动态计费' ? (
                          '动态'
                        ) : (
                          <div className="space-y-1">
                            {m.officialInput ? <div>输入 ¥{m.officialInput.toFixed(4)} / 1M</div> : null}
                            {m.officialOutput ? <div>输出 ¥{m.officialOutput.toFixed(4)} / 1M</div> : null}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {m.billingType === '按次计费' ? (
                          m.csdpPerCall ? `¥${m.csdpPerCall.toFixed(4)} / 次` : '-'
                        ) : m.billingType === '动态计费' ? (
                          '动态'
                        ) : (
                          <div className="space-y-1">
                            {m.csdpInput ? <div>输入 ¥{m.csdpInput.toFixed(4)} / 1K</div> : null}
                            {m.csdpOutput ? <div>输出 ¥{m.csdpOutput.toFixed(4)} / 1K</div> : null}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {MODEL_PRICING_DISPLAY.length > 5 && (
                <div className="text-center mt-4 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setShowAllModels(!showAllModels)}
                    className="text-brand-600 hover:text-brand-700 text-sm font-medium"
                  >
                    {showAllModels ? '收起模型' : `查看全部 ${MODEL_PRICING_DISPLAY.length} 个模型`}
                  </button>
                </div>
              )}
            </div>
            <div className="mt-4 p-4 bg-accent-50 rounded-lg text-sm text-slate-600">
              <strong className="text-accent-700">计费规则：</strong>
              按量计费模型：实际费用 = (promptTokens / 1000 × CSDP input 单价) + (completionTokens / 1000 × CSDP output 单价)。
              按次计费模型：每次调用按 CSDP 售价扣费。所有 CSDP 售价均为对应官方平台价的 8 折。
              Token 从钱包实时扣除，余额不足时 Agent 自动暂停服务。
            </div>
          </div>
        )}

        {/* Line Bundle Tab */}
        {activeTab === 'line' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {LINE_BUNDLE_PROMOS.map((promo) => (
              <div key={promo.promoName} className="card bg-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center text-2xl">🌐</div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{promo.promoName}</h3>
                    <p className="text-sm text-slate-500">{promo.description}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm mb-6">
                  <div className="flex justify-between text-slate-600">
                    <span>带宽</span>
                    <span className="font-medium">{promo.bandwidth} Mbps</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>月费</span>
                    <span className="font-medium">¥{promo.monthlyFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>赠送 Token 额度</span>
                    <span className="font-medium text-brand-600">¥{promo.freeTokenCredit}</span>
                  </div>
                </div>
                <div className="bg-accent-50 p-3 rounded-lg text-xs text-accent-700">
                  B+C 捆绑模式：购买跨境专线（B 业务）即赠送 AI 平台 Token 额度（C 业务），实现业务协同。
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
              <h4 className="font-semibold text-slate-900 mb-1">开园优惠持续多久？</h4>
              <p className="text-slate-600">开园促销套餐（体验版/创业版/出海版）限开园前 100 名用户，首月价格有效期至 2026-12-31。</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Token 用不完可以退吗？</h4>
              <p className="text-slate-600">Token 按实际用量实时扣费，预充值余额可退（需联系客服）。套餐内 Token 有效期见各套餐说明。</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">海外模型</h4>
              <p className="text-slate-600">海外模型能力已接入，套餐内可直接使用 GPT-4o / Claude 等海外主流模型。已购买套餐的用户无需额外付费。</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">企业定制方案？</h4>
              <p className="text-slate-600">超过 6 个 AI 数字员工或月 Token 消耗超过 500 万的企业，请联系专属客户成功经理定制方案。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
