'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PROMOTION_PACKAGES, AGENT_EMPLOYEE_PRICING } from '@/lib/pricing';
import { useStore } from '@/lib/store';

export default function AIEmployeesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'packages' | 'agents' | 'faq'>('packages');
  const isLoggedIn = useStore((state) => state.isLoggedIn);

  const agentRoles = [
    { key: 'ceo', ...AGENT_EMPLOYEE_PRICING.ceo, icon: '👔', desc: '全局调度、战略决策、向董事长汇报' },
    { key: 'sales', ...AGENT_EMPLOYEE_PRICING.sales, icon: '📈', desc: '客户开发、报价、CRM管理、销售跟进' },
    { key: 'support', ...AGENT_EMPLOYEE_PRICING.support, icon: '🎧', desc: '7×24多语言答疑、工单处理、客户回访' },
    { key: 'solution', ...AGENT_EMPLOYEE_PRICING.solution, icon: '⚙️', desc: '方案设计、POC验证、技术文档' },
    { key: 'compliance', ...AGENT_EMPLOYEE_PRICING.compliance, icon: '🛡️', desc: '法规跟踪、资质审核、合同审查' },
    { key: 'assistant', ...AGENT_EMPLOYEE_PRICING.assistant, icon: '📝', desc: '日程管理、提醒、统计、通知' },
  ];

  const handleBuyPackage = (productId: string) => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    router.push(`/recharge?productId=${productId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-3">雇佣你的 AI 数字团队</h1>
          <p className="text-slate-600">销售 · 客服 · 技术 · 合规 · 助理 — 按需雇佣，按月付费，随时增减</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-10">
          {[
            { key: 'packages', label: '入驻套餐' },
            { key: 'agents', label: '单独雇佣' },
            { key: 'faq', label: '常见问题' },
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
            {/* 套餐说明 */}
            <div className="bg-accent-50 border border-accent-200 rounded-lg p-4 mb-8 flex items-center gap-3">
              <span className="text-2xl">🚀</span>
              <div>
                <p className="font-semibold text-accent-700">开园特惠套餐</p>
                <p className="text-sm text-accent-600">注册公司即可入驻，套餐内含数字员工 + Token 额度，一站式配齐。每个团队成员使用独立账号登录工作台。</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PROMOTION_PACKAGES.map((plan) => (
                <div key={plan.id} className={`card bg-white ${plan.isPopular ? 'ring-2 ring-brand-500' : ''} relative`}>
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs px-4 py-1 rounded-full font-semibold">
                      开园推荐
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🕴️</span>
                    <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                  </div>
                  <p className="text-sm text-slate-500 mb-3">{plan.description}</p>
                  <div className="text-3xl font-bold text-slate-900 mb-1">
                    ¥{plan.price}
                    {plan.originalPrice && (
                      <span className="text-sm font-medium text-slate-400 line-through ml-2">¥{plan.originalPrice}</span>
                    )}
                    <span className="text-sm font-medium text-slate-400">/{plan.period}</span>
                  </div>
                  {plan.limit && (
                    <p className="text-xs text-accent-600 mb-4">{plan.limit}</p>
                  )}

                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between text-slate-600">
                      <span>数字员工</span>
                      <span className="font-medium">{plan.aiEmployees.length} 个</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Token 额度</span>
                      <span className="font-medium text-green-600">价值 ¥{plan.tokenCredit}/月</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>模型能力</span>
                      <span className="font-medium">DeepSeek / Kimi / 通义</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>海外模型</span>
                      <span className="font-medium text-accent-600">已接入</span>
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

                  <button
                    onClick={() => handleBuyPackage(plan.id)}
                    className={`block w-full text-center py-3 rounded-lg font-medium transition-colors ${
                      plan.isPopular ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isLoggedIn ? '立即下单' : '立即开通'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agents Tab */}
        {activeTab === 'agents' && (
          <div>
            <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 mb-8">
              <p className="text-sm text-brand-700">
                <strong>单独雇佣</strong> 适合已有套餐但想扩充团队，或只需要特定角色的用户。按月订阅，随时增减。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agentRoles.map((agent) => (
                <div key={agent.key} className="card bg-white">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{agent.icon}</span>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{agent.name}</h3>
                      <p className="text-xs text-slate-500">AI {agent.name}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">{agent.desc}</p>
                  <div className="text-2xl font-bold text-brand-600 mb-4">
                    ¥{agent.monthly}
                    <span className="text-sm font-medium text-slate-400">/月</span>
                  </div>
                  <Link href={isLoggedIn ? '/support' : '/login'} className="block w-full text-center py-2 rounded-lg font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
                    {isLoggedIn ? '联系运营' : '登录后咨询'}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <div className="space-y-6 max-w-3xl mx-auto">
            {[
              {
                q: '创业版的「3人团队」是指什么？员工如何工作？',
                a: '指为您的企业创建 3 个独立的工作台账号，3 名员工各自用自己的账号登录 Open Cloud 平台。AI 数字员工运行在云端，员工通过浏览器/工作台向 Agent 分配任务、上传文件、查看结果。工作流无需重新调整，平台提供标准流程；如需对接企业现有系统，可联系技术方案官定制。',
              },
              {
                q: 'AI 数字员工能读取员工电脑里的文件吗？',
                a: '不能。为保护数据安全，云端 Agent 默认无法访问员工本地文件。员工需通过工作台把文件上传到平台云盘，授权 Agent 在指定知识库或会话中读取；企业版支持私有化网关，可在受控环境下同步本地文件。',
              },
              {
                q: 'AI 数字员工能做什么？',
                a: 'AI 数字员工是基于大语言模型的智能代理，可以执行特定业务角色：CEO负责战略调度，销售负责客户开发，客服负责答疑，技术官负责方案设计，合规官负责法规跟踪，助理负责日常事务。它们 24/7 在线，不知疲倦。',
              },
              {
                q: '数字员工使用什么模型？',
                a: '平台已接入海内外主流模型能力，包括国内 DeepSeek / Kimi / 通义，以及海外 GPT-4o / Claude 等。套餐已包含海外模型能力，无需额外付费。',
              },
              {
                q: 'Token 额度用完了怎么办？',
                a: '套餐内的 Token 额度用完后，可以购买 Token 加油包或升级到更高套餐。Token 用量可在「Token 用量中心」实时查看。',
              },
              {
                q: '可以只雇佣一个数字员工吗？',
                a: '可以。选择「单独雇佣」标签页，按月订阅单个角色。也可以先购买套餐获得多个员工，再单独增加。',
              },
              {
                q: '数字员工能替代真人吗？',
                a: 'AI 数字员工适合处理标准化、重复性工作，如客服应答、数据整理、文案生成等。复杂决策和创意工作仍需真人参与。我们建议将数字员工视为「智能助手」而非完全替代。',
              },
            ].map((item, i) => (
              <div key={i} className="card bg-white">
                <h4 className="font-semibold text-slate-900 mb-2">{item.q}</h4>
                <p className="text-sm text-slate-600">{item.a}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
