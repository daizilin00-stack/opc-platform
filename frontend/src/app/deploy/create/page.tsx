'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { DEPLOY_PACKAGES } from '@/lib/deploy-pricing';

const TEMPLATES = [
  {
    id: 'customer-service',
    name: '客服助手',
    icon: '🎧',
    desc: '自动回复常见问题，处理售前售后咨询',
    suggestedModel: 'gpt-5.4-mini',
  },
  {
    id: 'sales-assistant',
    name: '销售助手',
    icon: '📈',
    desc: '跟进潜在客户，生成报价与产品介绍',
    suggestedModel: 'claude-sonnet-5',
  },
  {
    id: 'knowledge-base',
    name: '知识库助手',
    icon: '📚',
    desc: '基于上传文档回答内部问题',
    suggestedModel: 'deepseek-v4-pro',
  },
  {
    id: 'data-analyst',
    name: '数据分析师',
    icon: '📊',
    desc: '分析 CSV/Excel 数据并生成报告',
    suggestedModel: 'gpt-5.4',
  },
  {
    id: 'content-writer',
    name: '内容创作助手',
    icon: '✍️',
    desc: '撰写文案、博客、社媒内容',
    suggestedModel: 'kimi-k2.5',
  },
  {
    id: 'custom',
    name: '自定义 Agent',
    icon: '🔧',
    desc: '从零开始配置，完全自定义',
    suggestedModel: 'gpt-5.4-mini',
  },
];

const MODELS = [
  { key: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash', tag: '最省' },
  { key: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro', tag: '国产' },
  { key: 'gpt-5.4-mini', name: 'GPT-5.4 Mini', tag: '推荐' },
  { key: 'gpt-5.4', name: 'GPT-5.4', tag: '强力' },
  { key: 'claude-sonnet-5', name: 'Claude Sonnet 5', tag: '推理' },
  { key: 'kimi-k2.5', name: 'Kimi K2.5', tag: '长文本' },
  { key: 'qwen-plus', name: 'Qwen Plus', tag: '通义' },
];

export default function CreateAgentPage() {
  const isLoggedIn = useStore((state) => state.isLoggedIn);
  const [step, setStep] = useState(1);
  const [template, setTemplate] = useState(TEMPLATES[0]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [model, setModel] = useState(MODELS[2].key);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="card bg-white max-w-md w-full text-center p-8">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">请先登录</h1>
          <p className="text-sm text-slate-600 mb-6">创建 Agent 需要登录 Open Cloud 账号</p>
          <Link href="/login?redirect=/deploy/create" className="block w-full py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors">
            去登录
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // 模拟提交
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSubmitting(false);
    setStep(4);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link href="/deploy" className="text-sm text-slate-500 hover:text-brand-600 mb-2 inline-block">
            ← 返回部署平台
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">创建你的 Agent</h1>
          <p className="text-slate-600 mt-1">选择模板、配置模型，10 秒完成部署</p>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-8">
          {[
            { num: 1, label: '选择模板' },
            { num: 2, label: '基础配置' },
            { num: 3, label: '知识库' },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= s.num ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}
              >
                {s.num}
              </div>
              <span className={`text-sm ${step >= s.num ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                {s.label}
              </span>
              {s.num < 3 && <div className="w-8 h-px bg-slate-200 mx-2" />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="card bg-white">
            <h2 className="text-lg font-bold text-slate-900 mb-4">选择模板</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t)}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    template.id === t.id
                      ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                      : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{t.icon}</span>
                    <span className="font-semibold text-slate-900">{t.name}</span>
                  </div>
                  <p className="text-sm text-slate-600">{t.desc}</p>
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors"
              >
                下一步
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="card bg-white space-y-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">基础配置</h2>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Agent 名称</label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={template.name}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">功能描述</label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="描述这个 Agent 主要解决什么问题..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">选择模型</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {MODELS.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setModel(m.key)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      model === m.key
                        ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                        : 'border-slate-200 hover:border-brand-300'
                    }`}
                  >
                    <div className="font-medium text-slate-900 text-sm">{m.name}</div>
                    <span className="text-xs text-slate-500">{m.tag}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
              >
                上一步
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors"
              >
                下一步
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit} className="card bg-white space-y-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">上传知识库（可选）</h2>
            <p className="text-sm text-slate-600">
              上传 PDF、Word、Markdown、CSV 等文件，Agent 会基于文件内容回答。未上传则使用通用能力。
            </p>
            
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors">
              <div className="text-3xl mb-2">📁</div>
              <p className="text-sm text-slate-600 mb-3">拖拽文件到此处，或点击选择文件</p>
              <input
                type="file"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                className="block mx-auto text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
              />
              {files.length > 0 && (
                <div className="mt-4 text-left">
                  <p className="text-xs text-slate-500 mb-1">已选择 {files.length} 个文件：</p>
                  {files.map((f, i) => (
                    <div key={i} className="text-sm text-slate-700 py-1">{f.name}</div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-accent-50 rounded-lg p-4 text-sm text-accent-700">
              <strong>提示：</strong>文件上传后将存入平台云盘，Agent 无法直接访问员工本地电脑中的文件。如需本地文件同步，请选择企业版私有化方案。
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
              >
                上一步
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
              >
                {submitting ? '创建中...' : '创建 Agent'}
              </button>
            </div>
          </form>
        )}

        {step === 4 && (
          <div className="card bg-white text-center py-12">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Agent 创建成功</h2>
            <p className="text-slate-600 mb-6">{name || template.name} 已进入部署队列，预计 1-2 分钟后上线。</p>
            <div className="flex justify-center gap-4">
              <Link href="/deploy" className="px-6 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors">
                查看我的 Agent
              </Link>
              <button
                onClick={() => { setStep(1); setName(''); setDescription(''); setFiles([]); }}
                className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
              >
                再创建一个
              </button>
            </div>
          </div>
        )}

        {/* Plan hint */}
        <div className="mt-8 card bg-white">
          <h3 className="text-sm font-bold text-slate-900 mb-2">当前套餐权益</h3>
          <p className="text-sm text-slate-600">
            体验版包含 1 个 Agent + 500 次/月调用；创业版包含 5 个 Agent + 10,000 次/月调用；团队版包含 20 个 Agent + 100,000 次/月调用。
            创建 Agent 会占用套餐中的 Agent 名额，调用次数按实际使用从钱包或套餐额度中扣除。
          </p>
        </div>
      </div>
    </div>
  );
}
