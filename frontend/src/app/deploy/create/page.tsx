'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import api from '@/lib/api';
import { DEPLOY_PACKAGES } from '@/lib/deploy-pricing';

const TEMPLATES = [
  { id: 'customer-service', name: '客服助手', icon: '🎧', desc: '自动回复常见问题，处理售前售后咨询', suggestedModel: 'gpt-5.4-mini' },
  { id: 'sales-assistant', name: '销售助手', icon: '📈', desc: '跟进潜在客户，生成报价与产品介绍', suggestedModel: 'claude-sonnet-5' },
  { id: 'knowledge-base', name: '知识库助手', icon: '📚', desc: '基于上传文档回答内部问题', suggestedModel: 'deepseek-v4-pro' },
  { id: 'data-analyst', name: '数据分析师', icon: '📊', desc: '分析 CSV/Excel 数据并生成报告', suggestedModel: 'gpt-5.4' },
  { id: 'content-writer', name: '内容创作助手', icon: '✍️', desc: '撰写文案、博客、社媒内容', suggestedModel: 'kimi-k2.5' },
  { id: 'custom', name: '自定义 Agent', icon: '🔧', desc: '从零开始配置，完全自定义', suggestedModel: 'gpt-5.4-mini' },
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
  const router = useRouter();
  const isLoggedIn = useStore((state) => state.isLoggedIn);
  const [step, setStep] = useState(1);
  const [template, setTemplate] = useState(TEMPLATES[0]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [model, setModel] = useState(MODELS[2].key);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

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
    setError('');
    try {
      const res = await api.deploy.createAgent({
        name: name || template.name,
        description,
        template: template.id,
        model,
        config: {
          system_prompt: systemPrompt,
        },
        resources: {
          cpu: '1',
          memory: '2G',
          storage: '10G'
        }
      });

      if (res.code !== 0 && res.code !== 201) {
        throw new Error(res.message || '创建失败');
      }

      setResult(res.data);
      setStep(4);
    } catch (err: any) {
      setError(err.message || '创建失败，请重试');
    } finally {
      setSubmitting(false);
    }
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

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2 mb-8">
          {[
            { num: 1, label: '选择模板' },
            { num: 2, label: '基础配置' },
            { num: 3, label: '知识库' },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= s.num ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {s.num}
              </div>
              <span className={`text-sm ${step >= s.num ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>{s.label}</span>
              {s.num < 3 && <span className="text-slate-300 mx-1">→</span>}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTemplate(t); setModel(t.suggestedModel); setStep(2); }}
                className={`text-left p-6 rounded-xl border transition-all ${
                  template.id === t.id
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-slate-200 bg-white hover:border-brand-300'
                }`}
              >
                <div className="text-3xl mb-3">{t.icon}</div>
                <h3 className="font-bold text-slate-900 mb-1">{t.name}</h3>
                <p className="text-sm text-slate-500">{t.desc}</p>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Agent 名称</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={template.name}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">描述</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="这个 Agent 用来做什么..."
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">选择模型</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {MODELS.map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setModel(m.key)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        model === m.key
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-slate-200 hover:border-brand-300'
                      }`}
                    >
                      <div className="font-medium text-slate-900 text-sm">{m.name}</div>
                      <div className="text-xs text-brand-600 mt-1">{m.tag}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">系统提示词（可选）</label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={4}
                  placeholder="你是一个专业的客服助手..."
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => setStep(1)} className="px-6 py-2 text-slate-600 hover:text-slate-900">
                上一步
              </button>
              <button type="submit" className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">
                下一步
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">知识库文档</label>
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setFiles(Array.from(e.target.files || []))}
                    className="hidden"
                    id="kb-files"
                  />
                  <label htmlFor="kb-files" className="cursor-pointer text-brand-600 hover:text-brand-700">
                    点击上传文档（PDF/Word/TXT）
                  </label>
                  {files.length > 0 && (
                    <p className="text-sm text-slate-500 mt-2">已选择 {files.length} 个文件</p>
                  )}
                  <p className="text-xs text-slate-400 mt-2">MVP 阶段仅记录文件名，暂不解析内容</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => setStep(2)} className="px-6 py-2 text-slate-600 hover:text-slate-900">
                上一步
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
              >
                {submitting ? '部署中...' : '确认部署'}
              </button>
            </div>
          </form>
        )}

        {step === 4 && result && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <div className="text-5xl mb-4">🚀</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Agent 创建中</h2>
            <p className="text-slate-600 mb-6">容器正在后台启动，约需 10–30 秒。创建完成后可在工作台查看。</p>
            <div className="bg-slate-50 rounded-lg p-4 text-left text-sm font-mono mb-6 space-y-2">
              <div><span className="text-slate-500">Agent ID:</span> {result.id}</div>
              <div><span className="text-slate-500">状态:</span> {result.status}</div>
              <div><span className="text-slate-500">API Key:</span> <span className="break-all">{result.api_key}</span></div>
            </div>
            <div className="flex gap-3 justify-center">
              <Link href="/workspace" className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">
                去工作台查看
              </Link>
              <Link href="/deploy" className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">
                返回部署页
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
