'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TOKEN_PACKAGES, MODEL_PRICING, MODEL_PRICING_DISPLAY } from '@/lib/pricing';
import { useStore } from '@/lib/store';

export default function TokenCenterPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'packages' | 'calculator' | 'usage'>('packages');
  const [selectedModel, setSelectedModel] = useState('gpt-5.4');
  const [promptTokens, setPromptTokens] = useState(1000);
  const [completionTokens, setCompletionTokens] = useState(500);
  const isLoggedIn = useStore((state) => state.isLoggedIn);

  const [showAllModels, setShowAllModels] = useState(false);

  const handleBuy = (productId: string) => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    router.push(`/recharge?productId=${productId}`);
  };

  const modelOptions = MODEL_PRICING_DISPLAY.map((m) => ({
    ...m,
    input: MODEL_PRICING[m.key as keyof typeof MODEL_PRICING]?.input ?? 0,
    output: MODEL_PRICING[m.key as keyof typeof MODEL_PRICING]?.output ?? 0,
    perCall: (MODEL_PRICING as Record<string, any>)[m.key as keyof typeof MODEL_PRICING]?.perCall,
    markup: MODEL_PRICING[m.key as keyof typeof MODEL_PRICING]?.markup ?? 0,
  }));

  const selectedPricing = MODEL_PRICING[selectedModel as keyof typeof MODEL_PRICING];
  const selectedDisplay = MODEL_PRICING_DISPLAY.find((m) => m.key === selectedModel);
  const isPerCallModel = selectedPricing && 'perCall' in selectedPricing && selectedPricing.perCall;
  const estimatedCost = isPerCallModel
    ? (selectedPricing as any).perCall
    : selectedPricing
      ? ((promptTokens / 1000) * selectedPricing.input + (completionTokens / 1000) * selectedPricing.output)
      : 0;

  return (
    <div className="min-h-screen bg-slate-50">
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Token 团购中心</h1>
          <p className="text-slate-600">集中采购大模型 API，用多少算多少，透明计费，量大更优惠</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-10">
          {[
            { key: 'packages', label: '团购套餐' },
            { key: 'calculator', label: '费用估算' },
            { key: 'usage', label: '我的用量' },
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
            {/* 价格优势说明 */}
            <div className="bg-accent-50 border border-accent-200 rounded-lg p-4 mb-8 flex items-center gap-3">
              <span className="text-2xl">💎</span>
              <div>
                <p className="font-semibold text-accent-700">团购优势</p>
                <p className="text-sm text-accent-600">平台集中采购全球模型能力，个人用户无需自行注册海外账号、无需外币信用卡，充值人民币即可使用</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {TOKEN_PACKAGES.map((pkg) => (
                <div key={pkg.id} className={`card bg-white ${pkg.id === 'token-standard' ? 'ring-2 ring-brand-500' : ''} relative`}>
                  {pkg.id === 'token-standard' && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs px-4 py-1 rounded-full font-semibold">
                      推荐
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">💎</span>
                    <h3 className="text-lg font-bold text-slate-900">{pkg.name}</h3>
                  </div>
                  <div className="text-3xl font-bold text-slate-900 mb-1">
                    ¥{pkg.price}
                  </div>
                  <p className="text-sm text-slate-500 mb-3">{pkg.period}有效</p>

                  <div className="bg-slate-50 rounded-lg p-3 mb-4 text-center">
                    <p className="text-2xl font-bold text-brand-600">¥{pkg.credit}</p>
                    <p className="text-xs text-slate-500">{pkg.description}</p>
                  </div>

                  <div className="space-y-1 mb-4 text-sm">
                    <div className="flex justify-between text-slate-600">
                      <span>单价</span>
                      <span className="font-medium">{pkg.unitPrice}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>折扣</span>
                      <span className="font-medium text-green-600">{pkg.discount}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>加价率</span>
                      <span className="font-medium">{pkg.effectiveMarkup}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleBuy(pkg.id)}
                    className={`block w-full text-center py-3 rounded-lg font-medium transition-colors ${
                      pkg.id === 'token-standard' ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isLoggedIn ? '立即购买' : '登录后购买'}
                  </button>
                </div>
              ))}
            </div>

            {/* 模型定价表 */}
            <div className="mt-12 card bg-white">
              <h3 className="text-lg font-bold text-slate-900 mb-4">模型计费标准</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-slate-500 font-medium">模型</th>
                      <th className="text-left py-3 px-4 text-slate-500 font-medium">计费方式</th>
                      <th className="text-right py-3 px-4 text-slate-500 font-medium">官方价</th>
                      <th className="text-right py-3 px-4 text-slate-500 font-medium">CSDP 售价</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {modelOptions.slice(0, showAllModels ? modelOptions.length : Math.ceil(modelOptions.length / 2)).map((m) => (
                      <tr key={m.key} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-medium text-slate-900">{m.label}</td>
                        <td className="py-3 px-4 text-slate-600">{m.billingType}</td>
                        <td className="py-3 px-4 text-right text-slate-700">
                          {m.billingType === '按次计费' ? (
                            m.officialPerCall ? `¥${m.officialPerCall.toFixed(4)} / 次` : '-'
                          ) : (
                            <div className="space-y-1">
                              {m.officialInput ? <div>输入 ¥{m.officialInput.toFixed(4)} / 1M</div> : null}
                              {m.officialOutput ? <div>输出 ¥{m.officialOutput.toFixed(4)} / 1M</div> : null}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-700">
                          {m.billingType === '按次计费' ? (
                            m.csdpPerCall ? `¥${m.csdpPerCall.toFixed(4)} / 次` : '-'
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
                {modelOptions.length > 5 && (
                  <div className="text-center mt-4 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => setShowAllModels(!showAllModels)}
                      className="text-brand-600 hover:text-brand-700 text-sm font-medium"
                    >
                      {showAllModels ? '收起模型' : `查看全部 ${modelOptions.length} 个模型`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Calculator Tab */}
        {activeTab === 'calculator' && (
          <div className="max-w-2xl mx-auto">
            <div className="card bg-white">
              <h3 className="text-lg font-bold text-slate-900 mb-6">费用估算器</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">选择模型</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => {
                      setSelectedModel(e.target.value);
                      setPromptTokens(1000);
                      setCompletionTokens(500);
                    }}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  >
                    {modelOptions.map((m) => (
                      <option key={m.key} value={m.key}>{m.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    {selectedDisplay?.billingType === '按次计费' ? '按次计费模型' : '按量计费模型'}
                  </p>
                </div>

                {!isPerCallModel ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Prompt Tokens: {promptTokens.toLocaleString()}
                      </label>
                      <input
                        type="range"
                        min="100"
                        max="100000"
                        step="100"
                        value={promptTokens}
                        onChange={(e) => setPromptTokens(Number(e.target.value))}
                        className="w-full accent-brand-600"
                      />
                      <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>100</span>
                        <span>100K</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Completion Tokens: {completionTokens.toLocaleString()}
                      </label>
                      <input
                        type="range"
                        min="100"
                        max="100000"
                        step="100"
                        value={completionTokens}
                        onChange={(e) => setCompletionTokens(Number(e.target.value))}
                        className="w-full accent-brand-600"
                      />
                      <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>100</span>
                        <span>100K</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-600">该模型按次计费，每次调用费用为：</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">¥{estimatedCost.toFixed(4)} / 次</p>
                  </div>
                )}

                <div className="bg-brand-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-slate-500 mb-1">预估费用</p>
                  <p className="text-3xl font-bold text-brand-700">¥{estimatedCost.toFixed(4)}</p>
                  {!isPerCallModel && selectedPricing && (
                    <p className="text-xs text-slate-400 mt-1">
                      Input: ¥{((promptTokens / 1000) * (selectedPricing?.input || 0)).toFixed(4)} + 
                      Output: ¥{((completionTokens / 1000) * (selectedPricing?.output || 0)).toFixed(4)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Usage Tab */}
        {activeTab === 'usage' && (
          <div className="text-center py-16">
            <p className="text-slate-500 mb-4">用量详情请在登录后查看</p>
            {isLoggedIn ? (
              <Link href="/workspace" className="btn-primary">前往工作台查看</Link>
            ) : (
              <Link href="/login" className="btn-primary">登录查看</Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
