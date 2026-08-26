'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { DEPLOY_PACKAGES, DEPLOY_ADDONS } from '@/lib/deploy-pricing';
import { MODEL_PRICING } from '@/lib/pricing';

export default function DeployPage() {
  const [activeTab, setActiveTab] = useState<'packages' | 'comparison' | 'calculator' | 'agents' | 'create'>('packages');
  const [selectedCase, setSelectedCase] = useState<number | null>(null);
  const setChatOpen = useStore((state) => state.setChatOpen);
  const isLoggedIn = useStore((state) => state.isLoggedIn);

  const agents = [
    {
      id: 'agt_abc123',
      name: '客服助手',
      status: 'running',
      model: 'gpt-4o',
      endpoint: 'https://agt-abc123.agents.opc-platform.com',
      created_at: '2026-06-29T10:00:00Z',
      hourly_price: 0.05
    },
    {
      id: 'agt_def456',
      name: '销售助手',
      status: 'stopped',
      model: 'claude-3.5-sonnet',
      endpoint: 'https://agt-def456.agents.opc-platform.com',
      created_at: '2026-06-28T15:30:00Z',
      hourly_price: 0.05
    }
  ];

  const statusColors: Record<string, string> = {
    running: 'bg-green-100 text-green-700',
    stopped: 'bg-gray-100 text-gray-700',
    creating: 'bg-blue-100 text-blue-700',
    error: 'bg-red-100 text-red-700'
  };

  const statusText: Record<string, string> = {
    running: '运行中',
    stopped: '已停止',
    creating: '创建中',
    error: '异常'
  };

  const caseStudies = [
    {
      title: '个人开发者博客',
      package: '体验版',
      icon: '👨‍💻',
      description: '1个Agent处理博客评论回复和读者咨询，每月500次调用足够',
      result: '月成本 ¥99（套餐）+ Token 按量约 ¥20',
      detail: '该博客使用 1 个客服 Agent 自动回复评论和读者邮件。月调用约 500 次，平均单次 1,500 tokens，Token 费用约 ¥20。总月成本约 ¥119，替代原本外包客服 ¥800/月。',
    },
    {
      title: '跨境电商3店铺',
      package: '创业版',
      icon: '🛒',
      description: '5个Agent分别服务3个店铺+1个库存助手+1个数据分析',
      result: '月成本 ¥299（套餐）+ Token 按量约 ¥400',
      detail: '3 个店铺客服 Agent + 1 个库存查询 Agent + 1 个数据周报 Agent。月调用约 8,000 次，混合使用 GPT-5.4 Mini 与 DeepSeek，Token 费用约 ¥400。总月成本约 ¥699，替代 2 名外包运营。',
    },
    {
      title: '20人AI客服中心',
      package: '团队版',
      icon: '🏢',
      description: '20个Agent处理不同业务线，10万调用支持日均3000+对话',
      result: '月成本 ¥999（套餐）+ Token 按量约 ¥3,500',
      detail: '20 个 Agent 覆盖售前、售后、技术支持、投诉处理等业务线。月调用约 10 万次，平均单次 2,500 tokens，Token 费用约 ¥3,500。总月成本约 ¥4,500，替代 8 人客服团队（约 ¥32,000/月）。',
    },
    {
      title: '银行智能风控',
      package: '企业版',
      icon: '🏦',
      description: '私有化部署，专属模型微调，7×24风控监控',
      result: '定制方案，私有化部署，数据不出域',
      detail: '企业版提供私有化部署、专属 GPU 资源、模型微调与 7×24 运维支持。费用按项目定制，需联系销售评估。',
    },
  ];

  const faqs = [
    {
      q: 'Agent 如何访问员工电脑中的工作文件？',
      a: 'Open Cloud 部署的 Agent 运行在平台云端，默认无法直接读取员工本地电脑文件。员工可通过「工作台」上传文件到平台云盘，授权 Agent 在指定知识库或会话中读取；企业版支持私有化网关，可在受控网络环境下实现本地文件同步。',
    },
    {
      q: '部署平台与硅基员工有什么区别？',
      a: '部署平台面向开发者，提供自主构建和部署AI Agent的能力，支持自定义代码、工作流编排和API集成；硅基员工面向非技术用户，提供即开即用的AI员工服务，无需开发能力。',
    },
    {
      q: '超出套餐的调用次数后怎么办？',
      a: '系统会自动按量计费（¥0.01/次），您也可以提前购买调用包。当余额不足时，我们会发送预警通知，避免服务中断。',
    },
    {
      q: '支持哪些编程语言和框架？',
      a: '目前支持 Next.js、Python（FastAPI/Flask）、Node.js（Express）、Go 等主流框架。Agent运行时环境基于Docker，理论上支持任何语言。',
    },
    {
      q: '如何迁移现有Agent到本平台？',
      a: '提供一键导入工具，支持从 Coze、Dify、FastGPT 等平台导出配置后导入。API格式兼容 OpenAI 标准，迁移成本极低。',
    },
    {
      q: '数据安全如何保障？',
      a: '体验版/创业版数据存储在平台共享集群（AES-256加密）；团队版支持独立数据库实例；企业版支持私有化部署，数据完全自主可控。',
    },
    {
      q: '可以退订或降级吗？',
      a: '支持随时降级或退订。降级后超出套餐的Agent会进入"暂停"状态，数据保留30天。',
    },
  ];

  const comparisonFeatures = [
    { name: 'Agent 数量', key: 'agentCount', format: (v: any) => v === null ? '无限' : `${v}个` },
    { name: '月调用次数', key: 'monthlyCalls', format: (v: any) => v === null ? '无限' : `${v.toLocaleString()}次` },
    { name: '并发请求', key: 'concurrentRequests', format: (v: any) => v === null ? '无限' : `${v}次/分钟` },
    { name: '知识库', key: 'knowledgeBases', format: (v: any, pkg: any) => v === null ? '无限' : `${v}个 (${pkg.knowledgeBaseSize})` },
    { name: '模型支持', key: 'models', format: (v: any) => Array.isArray(v) ? v.join(' / ') : v },
    { name: '团队人数', key: 'teamSize', format: (v: any) => v === null ? '无限' : `${v}人` },
    { name: '工作流节点', key: 'workflowNodes', format: (v: any) => v === null ? '无限' : `${v}节点` },
    { name: '自定义域名', key: 'customDomain', format: (v: any) => v ? '✅' : '❌' },
    { name: 'API 接口', key: 'apiAccess', format: (v: any) => v ? '✅' : '❌' },
    { name: '监控告警', key: 'monitoring', format: (v: any) => v },
    { name: '技术支持', key: 'support', format: (v: any) => v },
    { name: 'SLA 保障', key: 'sla', format: (v: any) => v || '无' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
{/* Hero Section */}
      <div className="bg-gradient-to-br from-brand-600 to-brand-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 text-white/90 px-3 py-1 rounded-full text-sm font-medium mb-6">
                <span className="w-2 h-2 bg-accent-400 rounded-full animate-pulse"></span>
                10分钟从开发到上线
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                部署你的<br/>
                <span className="text-accent-400">AI Agent</span> 集群
              </h1>
              <p className="text-lg text-white/80 mb-8 leading-relaxed">
                无需关心底层服务器、模型接口、网络配置。平台自动提供计算资源、模型网关、全球加速，
                你只需专注业务逻辑。
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                  <span className="text-xl">🚀</span>
                  <span>一键部署</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                  <span className="text-xl">🤖</span>
                  <span>20+ 模型即插即用</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                  <span className="text-xl">🌐</span>
                  <span>全球边缘加速</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm border border-white/20">
                <div className="font-mono text-sm text-white/90 space-y-2">
                  <div className="text-white/50"># 安装 OpenClaw CLI</div>
                  <div>npm install -g @openclaw/cli</div>
                  <div className="text-white/50 mt-2"># 初始化项目</div>
                  <div>openclaw init my-agent</div>
                  <div className="text-white/50 mt-2"># 选择模板</div>
                  <div>? Template: <span className="text-accent-400">客服助手</span></div>
                  <div>? Model: <span className="text-accent-400">Claude 4.8</span></div>
                  <div className="text-white/50 mt-2"># 部署上线</div>
                  <div>openclaw deploy</div>
                  <div className="text-green-400 mt-2">✓ Agent deployed to https://agt-xxx.opc.run</div>
                  <div className="text-green-400">✓ API endpoint ready</div>
                  <div className="text-green-400">✓ CDN edge caching enabled</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-10">
          {[
            { key: 'packages', label: '部署套餐' },
            { key: 'comparison', label: '功能对比' },
            { key: 'calculator', label: '成本计算器' },
            { key: 'agents', label: '我的 Agent' },
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
            {/* 套餐卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {DEPLOY_PACKAGES.map((plan) => (
                <div key={plan.id} className={`card bg-white relative flex flex-col ${plan.isPopular ? 'ring-2 ring-brand-500 scale-105 shadow-xl' : ''}`}>
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs px-4 py-1 rounded-full font-semibold">
                      推荐
                    </div>
                  )}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                    <p className="text-sm text-slate-500">{plan.tagline}</p>
                  </div>
                  
                  <div className="mb-4">
                    {plan.isEnterprise ? (
                      <div className="text-3xl font-bold text-slate-900">定制</div>
                    ) : (
                      <div className="text-3xl font-bold text-slate-900">
                        ¥{plan.price}
                        <span className="text-sm font-medium text-slate-400">/{plan.period}</span>
                      </div>
                    )}
                  </div>

                  {/* 核心指标 */}
                  <div className="space-y-3 mb-6 flex-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Agent 数量</span>
                      <span className="font-semibold text-slate-900">{plan.agentCount === null ? '无限' : plan.agentCount + '个'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">月调用次数</span>
                      <span className="font-semibold text-slate-900">{plan.monthlyCalls === null ? '无限' : plan.monthlyCalls.toLocaleString() + '次'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">团队人数</span>
                      <span className="font-semibold text-slate-900">{plan.teamSize === null ? '无限' : plan.teamSize + '人'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">并发请求</span>
                      <span className="font-semibold text-slate-900">{plan.concurrentRequests === null ? '无限' : plan.concurrentRequests + '/分钟'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">知识库</span>
                      <span className="font-semibold text-slate-900">{plan.knowledgeBases === null ? '无限' : plan.knowledgeBases + '个'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">模型支持</span>
                      <span className="font-semibold text-slate-900 text-xs">{Array.isArray(plan.models) ? plan.models.slice(0, 2).join(' / ') + '...' : plan.models}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">SLA</span>
                      <span className="font-semibold text-slate-900">{plan.sla || '无'}</span>
                    </div>
                  </div>

                  {/* 功能列表 */}
                  <ul className="space-y-2 mb-6 text-sm">
                    {plan.customDomain && (
                      <li className="flex items-center gap-2 text-slate-600">
                        <span className="text-accent-500 font-bold">✓</span> 自定义域名
                      </li>
                    )}
                    {plan.apiAccess && (
                      <li className="flex items-center gap-2 text-slate-600">
                        <span className="text-accent-500 font-bold">✓</span> API 接口
                      </li>
                    )}
                    <li className="flex items-center gap-2 text-slate-600">
                      <span className="text-accent-500 font-bold">✓</span> {plan.monitoring}
                    </li>
                    <li className="flex items-center gap-2 text-slate-600">
                      <span className="text-accent-500 font-bold">✓</span> {plan.support}
                    </li>
                  </ul>

                  {plan.isEnterprise ? (
                    <button
                      onClick={() => setChatOpen(true)}
                      className="block w-full text-center py-3 rounded-lg font-medium transition-colors bg-slate-800 text-white hover:bg-slate-900"
                    >
                      咨询销售
                    </button>
                  ) : (
                    <Link href={isLoggedIn ? `/order?service=deploy&plan=${plan.id}` : '/register'} 
                      className={`block w-full text-center py-3 rounded-lg font-medium transition-colors ${
                        plan.isPopular ? 'bg-brand-600 text-white hover:bg-brand-700' : 
                        'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}>
                      {isLoggedIn ? '立即开通' : '登录后开通'}
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* 按量计费 */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-12">
              <h3 className="text-lg font-bold text-slate-900 mb-4">按量计费（超出套餐后）</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {DEPLOY_ADDONS.map((addon) => (
                  <div key={addon.id} className="bg-slate-50 rounded-lg p-4">
                    <div className="font-medium text-slate-900">{addon.name}</div>
                    <div className="text-lg font-bold text-brand-600">¥{addon.price}<span className="text-sm font-normal text-slate-500">/{addon.unit}</span></div>
                    <div className="text-xs text-slate-500 mt-1">{addon.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 免费额度 */}
            <div className="bg-accent-50 rounded-xl border border-accent-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🎁</span>
                <div>
                  <h3 className="font-bold text-slate-900">免费试用</h3>
                  <p className="text-sm text-slate-600">注册即送 1个Agent + 500次调用，7天有效</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-accent-500 font-bold">✓</span>
                  <span>注册即送：1个Agent + 500次调用</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-accent-500 font-bold">✓</span>
                  <span>邀请奖励：每邀1人 +200次调用</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-accent-500 font-bold">✓</span>
                  <span>开园特惠：体验版首月 ¥9.9</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comparison Tab */}
        {activeTab === 'comparison' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left px-6 py-4 font-semibold text-slate-900">功能对比</th>
                    {DEPLOY_PACKAGES.map((plan) => (
                      <th key={plan.id} className="text-center px-4 py-4 font-semibold text-slate-900">
                        <div>{plan.name}</div>
                        <div className="text-xs font-normal text-slate-500">
                          {plan.price ? `¥${plan.price}/${plan.period}` : '定制'}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comparisonFeatures.map((feature, idx) => (
                    <tr key={feature.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="px-6 py-3 text-slate-700 font-medium">{feature.name}</td>
                      {DEPLOY_PACKAGES.map((plan) => (
                        <td key={plan.id} className="text-center px-4 py-3 text-slate-600">
                          {feature.format((plan as any)[feature.key], plan)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Calculator Tab */}
        {activeTab === 'calculator' && (
          <CalculatorTab isLoggedIn={isLoggedIn} />
        )}

        {/* Agents Tab */}
        {activeTab === 'agents' && (
          <div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">我的 Agent</h2>
                <Link href="/deploy/create" className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors text-sm">
                  + 创建 Agent
                </Link>
              </div>
              
              <div className="divide-y divide-slate-200">
                {agents.map(agent => (
                  <div key={agent.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center text-brand-600 font-bold">
                          {agent.name[0]}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{agent.name}</h3>
                          <p className="text-sm text-slate-500">
                            {agent.model} · 创建于 {new Date(agent.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[agent.status]}`}>
                          {statusText[agent.status]}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          {agent.status === 'running' ? (
                            <>
                              <button className="text-sm text-slate-600 hover:text-slate-900 px-3 py-1 border border-slate-300 rounded-lg">
                                停止
                              </button>
                              <Link 
                                href={`/deploy/agents/${agent.id}`}
                                className="text-sm text-brand-600 hover:text-brand-700 px-3 py-1 border border-brand-300 rounded-lg"
                              >
                                管理
                              </Link>
                            </>
                          ) : (
                            <>
                              <button className="text-sm text-brand-600 hover:text-brand-700 px-3 py-1 border border-brand-300 rounded-lg">
                                启动
                              </button>
                              <button className="text-sm text-red-600 hover:text-red-700 px-3 py-1 border border-red-300 rounded-lg">
                                删除
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {agent.status === 'running' && (
                      <div className="mt-3 ml-14">
                        <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                          {agent.endpoint}
                        </code>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 快速入门 */}
            <div className="mt-8 bg-gradient-to-r from-brand-50 to-accent-50 rounded-xl p-6 border border-brand-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">快速入门</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-2xl mb-2">1️⃣</div>
                  <h4 className="font-medium text-slate-900">选择套餐</h4>
                  <p className="text-sm text-slate-600">根据业务规模选择合适的部署套餐</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-2xl mb-2">2️⃣</div>
                  <h4 className="font-medium text-slate-900">创建 Agent</h4>
                  <p className="text-sm text-slate-600">选择模板和模型，10秒完成配置</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-2xl mb-2">3️⃣</div>
                  <h4 className="font-medium text-slate-900">API 调用</h4>
                  <p className="text-sm text-slate-600">标准 OpenAI 格式，一行代码接入</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Case Studies */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">客户案例</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {caseStudies.map((study, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedCase(idx)}
                className="card bg-white text-left hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{study.icon}</span>
                  <div>
                    <h3 className="font-bold text-slate-900">{study.title}</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-brand-50 text-brand-700">{study.package}</span>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-3">{study.description}</p>
                <div className="bg-accent-50 rounded-lg p-3 text-sm text-accent-700">
                  <strong>效果：</strong>{study.result}
                </div>
                <div className="mt-3 text-xs text-brand-600 font-medium flex items-center gap-1">
                  查看详情 <span>→</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Case Study Modal */}
        {selectedCase !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedCase(null)}>
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{caseStudies[selectedCase].icon}</span>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{caseStudies[selectedCase].title}</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-brand-50 text-brand-700">{caseStudies[selectedCase].package}</span>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-4">{caseStudies[selectedCase].description}</p>
              <div className="bg-accent-50 rounded-lg p-4 text-sm text-accent-700 mb-4">
                <strong>效果：</strong>{caseStudies[selectedCase].result}
              </div>
              <div className="text-sm text-slate-600 leading-relaxed mb-6">
                {caseStudies[selectedCase].detail}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setChatOpen(true)}
                  className="flex-1 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors"
                >
                  咨询同款方案
                </button>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">常见问题</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="card bg-white">
                <h3 className="font-semibold text-slate-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-slate-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-brand-600 to-brand-800 rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">准备好部署你的 AI Agent 了吗？</h2>
            <p className="text-white/80 mb-6">注册即送 1个Agent + 500次调用，7天免费体验</p>
            <div className="flex justify-center gap-4">
              <Link href="/register" className="bg-white text-brand-600 px-8 py-3 rounded-lg font-semibold hover:bg-white/90 transition-colors">
                免费开始
              </Link>
              <button
                onClick={() => setChatOpen(true)}
                className="bg-white/10 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/20 transition-colors"
              >
                联系销售
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 客户成本测算器：为客户测算真实使用成本（套餐费 + 超额调用费 + Token 按量费）
function CalculatorTab({ isLoggedIn }: { isLoggedIn: boolean }) {
  const setChatOpen = useStore((state) => state.setChatOpen);
  const [agents, setAgents] = useState(5);
  const [calls, setCalls] = useState(10000);
  const [team, setTeam] = useState(3);
  const [tokensPerCall, setTokensPerCall] = useState(2000); // 单次调用平均总 token
  const [model, setModel] = useState<'deepseek-v4-flash' | 'deepseek-v4-pro' | 'gpt-5.4-mini' | 'gpt-5.4' | 'claude-sonnet-5'>('gpt-5.4-mini');

  // 推荐套餐
  const recommended = (() => {
    if (agents <= 1 && calls <= 1000 && team <= 1) return DEPLOY_PACKAGES[0];
    if (agents <= 5 && calls <= 10000 && team <= 3) return DEPLOY_PACKAGES[1];
    if (agents <= 20 && calls <= 100000 && team <= 10) return DEPLOY_PACKAGES[2];
    return DEPLOY_PACKAGES[3];
  })();

  const plan = recommended;

  // 超额资源费
  const extraAgentCount = Math.max(0, agents - (plan.agentCount ?? Infinity));
  const extraCallCount = Math.max(0, calls - (plan.monthlyCalls ?? Infinity));
  const extraTeamCount = Math.max(0, team - (plan.teamSize ?? Infinity));

  const extraAgentCost = extraAgentCount * 50;
  const extraCallCost = (extraCallCount / 1000) * 10;
  const extraTeamCost = extraTeamCount * 30;
  const extraResourceCost = extraAgentCost + extraCallCost + extraTeamCost;

  // Token 按量费：按单次调用平均 token × 调用次数 × 模型单价
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-5.4-mini'];
  const avgInputTokens = Math.round(tokensPerCall * 0.7);
  const avgOutputTokens = Math.round(tokensPerCall * 0.3);
  const tokenCost =
    (calls * avgInputTokens / 1000) * (pricing.input || 0) +
    (calls * avgOutputTokens / 1000) * (pricing.output || 0);

  const subscriptionCost = plan.price ?? 0;
  const totalCost = subscriptionCost + extraResourceCost + tokenCost;

  const formatter = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 });

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card bg-white mb-6">
        <h3 className="text-lg font-bold text-slate-900 mb-2">客户成本测算器</h3>
        <p className="text-sm text-slate-500 mb-6">
          输入您的业务规模，我们将为您测算「套餐订阅费 + 超额资源费 + 模型 Token 按量费」的真实月成本。
        </p>

        <div className="space-y-6">
          <Slider label="Agent 数量" value={agents} min={1} max={50} onChange={setAgents} unit="个" />
          <Slider label="预计月调用次数" value={calls} min={500} max={200000} step={500} onChange={setCalls} unit="次" />
          <Slider label="团队人数" value={team} min={1} max={30} onChange={setTeam} unit="人" />
          <Slider
            label="单次调用平均 Token 数"
            value={tokensPerCall}
            min={200}
            max={16000}
            step={100}
            onChange={setTokensPerCall}
            unit=" tokens"
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">参考模型</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="deepseek-v4-flash">DeepSeek V4 Flash（最省）</option>
              <option value="deepseek-v4-pro">DeepSeek V4 Pro</option>
              <option value="gpt-5.4-mini">GPT-5.4 Mini（推荐）</option>
              <option value="gpt-5.4">GPT-5.4</option>
              <option value="claude-sonnet-5">Claude Sonnet 5</option>
            </select>
            <p className="text-xs text-slate-400 mt-1">
              不同模型单价不同，实际使用中会按各 Agent 配置的模型混合计费，此处按单一模型估算。
            </p>
          </div>
        </div>
      </div>

      {/* 推荐结果 */}
      <div className="bg-gradient-to-r from-brand-50 to-accent-50 rounded-xl border border-brand-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-slate-600">推荐套餐</div>
            <div className="text-2xl font-bold text-slate-900">{plan.name}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-600">预估月费</div>
            <div className="text-3xl font-bold text-brand-600">¥{formatter.format(totalCost)}</div>
          </div>
        </div>

        <div className="space-y-2 text-sm text-slate-600 mb-4">
          <CostRow label="套餐订阅费" value={subscriptionCost} />
          <CostRow label="超额资源费" value={extraResourceCost} detail={`Agent +${extraAgentCount}，调用 +${extraCallCount.toLocaleString()}，成员 +${extraTeamCount}`} />
          <CostRow
            label="模型 Token 费用"
            value={tokenCost}
            detail={`${calls.toLocaleString()} 次 × ${tokensPerCall.toLocaleString()} tokens × ${model}`}
          />
        </div>

        <div className="bg-white rounded-lg p-3 text-xs text-slate-500 mb-4">
          <strong className="text-slate-700">测算说明：</strong>
          实际费用以平台账单为准。Token 费用按实际消耗扣除，套餐内不赠送 Token 额度；如您购买「Token 充值包」或「AI 数字员工套餐」，可抵扣 Token 费用。
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div className="bg-white rounded-lg p-3">
            <div className="text-slate-500">包含 Agent</div>
            <div className="font-bold">{plan.agentCount ?? '无限'} 个</div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="text-slate-500">包含调用</div>
            <div className="font-bold">{(plan.monthlyCalls ?? 0).toLocaleString()} 次/月</div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="text-slate-500">包含成员</div>
            <div className="font-bold">{plan.teamSize ?? '无限'} 人</div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="text-slate-500">SLA</div>
            <div className="font-bold">{plan.sla || '无'}</div>
          </div>
        </div>

        {plan.isEnterprise ? (
          <button
            onClick={() => setChatOpen(true)}
            className="block w-full text-center py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors"
          >
            联系销售获取方案
          </button>
        ) : (
          <Link
            href={isLoggedIn ? `/order?service=deploy&plan=${plan.id}` : '/register'}
            className="block w-full text-center py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors"
          >
            选择此套餐
          </Link>
        )}
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  unit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  unit: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}: <span className="text-brand-600 font-bold">{value.toLocaleString()}{unit}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
      />
      <div className="flex justify-between text-xs text-slate-400 mt-1">
        <span>{min.toLocaleString()}{unit}</span>
        <span>{max.toLocaleString()}{unit}</span>
      </div>
    </div>
  );
}

function CostRow({ label, value, detail }: { label: string; value: number; detail?: string }) {
  return (
    <div className="flex justify-between items-center border-b border-brand-100 last:border-0 pb-2 last:pb-0">
      <div>
        <span className="font-medium text-slate-700">{label}</span>
        {detail && <span className="block text-xs text-slate-400">{detail}</span>}
      </div>
      <span className="font-bold text-slate-900">¥{new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(value)}</span>
    </div>
  );
}
