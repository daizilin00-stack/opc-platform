'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import AuthGuard from '@/components/AuthGuard';
import { MODEL_PRICING } from '@/lib/pricing';
import {
  Send,
  Bot,
  User,
  Wallet,
  Zap,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  History,
  Trash2,
  Loader2,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  cost?: number;
  latency?: number;
  error?: string;
}

interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  pricing: {
    inputPer1k: number;
    outputPer1k: number;
    markup: number;
  };
  features: string[];
}

export default function PlaygroundPage() {
  return (
    <AuthGuard>
      <PlaygroundContent />
    </AuthGuard>
  );
}

function PlaygroundContent() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('gpt-5.4');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPricing, setShowPricing] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchModels();
    fetchWallet();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const fetchModels = async () => {
    try {
      const data = await api.models.list();
      if (data.success && Array.isArray(data.models)) {
        setModels(data.models);
        if (data.models.length > 0 && !data.models.find((m: ModelInfo) => m.id === selectedModel)) {
          setSelectedModel(data.models[0].id);
        }
      }
    } catch (err: any) {
      setError('加载模型列表失败：' + err.message);
    }
  };

  const fetchWallet = async () => {
    try {
      const data = await api.billing.getWallet();
      setWallet(data);
    } catch (err: any) {
      console.error('加载钱包失败:', err);
    }
  };

  const estimateCost = (modelId: string, promptTokens: number, completionTokens: number) => {
    try {
      const pricing = MODEL_PRICING[modelId as keyof typeof MODEL_PRICING];
      if (!pricing) return 0;
      if ('perCall' in pricing && pricing.perCall) {
        return pricing.perCall;
      }
      const inputCost = (promptTokens / 1000) * (pricing.input || 0);
      const outputCost = (completionTokens / 1000) * (pricing.output || 0);
      return Math.round((inputCost + outputCost) * 10000) / 10000;
    } catch {
      return 0;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setError(null);

    const startTime = Date.now();

    try {
      // 使用非流式接口一次性获取内容、用量和费用，避免流式二次调用重复扣费
      const result = await api.models.chat(
        selectedModel,
        newMessages.map((m) => ({ role: m.role, content: m.content })),
        temperature,
        maxTokens
      );

      const finalContent = result.content;
      const usage = result.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
      const cost = result.cost?.costCny ?? estimateCost(selectedModel, usage.prompt_tokens, usage.completion_tokens);

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: finalContent,
          model: selectedModel,
          usage,
          cost,
          latency: Date.now() - startTime,
        },
      ]);

      fetchWallet();
    } catch (err: any) {
      const errMsg = err.message || '调用失败';
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '',
          error: errMsg,
          model: selectedModel,
        },
      ]);
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearHistory = () => {
    if (confirm('确定清空当前对话吗？')) {
      setMessages([]);
    }
  };

  const selectedModelInfo = models.find((m) => m.id === selectedModel);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/workspace" className="text-slate-500 hover:text-brand-600 transition">
              ← 返回工作台
            </Link>
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-600" />
              <h1 className="text-lg font-bold text-slate-900">模型体验中心</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/token-usage" className="text-sm text-slate-600 hover:text-brand-600 flex items-center gap-1">
              <History className="w-4 h-4" />
              用量明细
            </Link>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg border border-green-100">
              <Wallet className="w-4 h-4 text-green-600" />
              <span className="text-sm text-slate-600">余额</span>
              <span className="font-bold text-green-700">¥{wallet?.balance?.toFixed(2) ?? '0.00'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
        {/* Left Sidebar */}
        <div className="w-80 flex-shrink-0 space-y-6">
          {/* Model Selector */}
          <div className="card bg-white">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Bot className="w-4 h-4 text-brand-600" />
              选择模型
            </h3>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            >
              {models.length === 0 && <option>加载中...</option>}
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            {selectedModelInfo && (
              <div className="mt-3 text-xs text-slate-500 space-y-1">
                <div className="flex items-center gap-1">
                  <span className="text-slate-400">提供商:</span>
                  <span>{selectedModelInfo.provider}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedModelInfo.features?.slice(0, 3).map((f, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Parameters */}
          <div className="card bg-white">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-brand-600" />
              参数设置
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Temperature</span>
                  <span className="font-medium">{temperature}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-brand-600"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Max Tokens</span>
                  <span className="font-medium">{maxTokens}</span>
                </div>
                <input
                  type="range"
                  min="256"
                  max="8192"
                  step="256"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full accent-brand-600"
                />
              </div>
            </div>
          </div>

          {/* Pricing Info */}
          <div className="card bg-white">
            <button
              onClick={() => setShowPricing(!showPricing)}
              className="w-full flex items-center justify-between font-semibold text-slate-900"
            >
              <span>当前模型计费</span>
              {showPricing ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showPricing && selectedModelInfo && (
              <div className="mt-4 pt-4 border-t border-slate-100 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">输入单价</span>
                  <span className="font-medium">¥{selectedModelInfo.pricing.inputPer1k.toFixed(4)} / 1K tokens</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">输出单价</span>
                  <span className="font-medium">¥{selectedModelInfo.pricing.outputPer1k.toFixed(4)} / 1K tokens</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">加价率</span>
                  <span className="font-medium">{selectedModelInfo.pricing.markup > 0 ? `${(selectedModelInfo.pricing.markup * 100).toFixed(0)}%` : '无'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="card bg-white">
            <h3 className="font-semibold text-slate-900 mb-3">本次会话</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="text-slate-500">消息数</div>
                <div className="font-bold text-lg">{messages.length}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="text-slate-500">预计总费用</div>
                <div className="font-bold text-lg text-brand-600">
                  ¥{messages.reduce((sum, m) => sum + (m.cost || 0), 0).toFixed(4)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-h-[600px]">
          <div className="card bg-white flex-1 flex flex-col overflow-hidden">
            {/* Chat Header */}
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center">
                  <Bot className="w-4 h-4 text-brand-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{selectedModelInfo?.name || selectedModel}</div>
                  <div className="text-xs text-slate-500">按实际 Token 消耗扣费，余额不足将暂停响应</div>
                </div>
              </div>
              <button
                onClick={clearHistory}
                className="text-sm text-slate-500 hover:text-red-600 flex items-center gap-1 transition"
              >
                <Trash2 className="w-4 h-4" />
                清空对话
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <Bot className="w-16 h-16 mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">开始体验模型能力</p>
                  <p className="text-sm">选择模型后输入问题，系统将实时显示 Token 消耗和费用</p>
                </div>
              )}

              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} flex gap-3`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user' ? 'bg-brand-600' : 'bg-slate-100'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-brand-600" />
                      )}
                    </div>
                    <div className={`${
                      message.role === 'user'
                        ? 'bg-brand-600 text-white rounded-2xl rounded-tr-sm'
                        : 'bg-slate-100 text-slate-900 rounded-2xl rounded-tl-sm'
                    } px-4 py-3`}>
                      {message.error ? (
                        <div className="flex items-center gap-2 text-red-600 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          {message.error}
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.content || (message.role === 'assistant' && loading ? '' : message.content)}
                        </div>
                      )}

                      {/* Usage & Cost Badge */}
                      {message.role === 'assistant' && message.usage && (
                        <div className="mt-3 pt-3 border-t border-slate-200/60 flex flex-wrap items-center gap-3 text-xs">
                          <span className="px-2 py-1 bg-white rounded text-slate-600">
                            {message.model}
                          </span>
                          <span className="px-2 py-1 bg-white rounded text-slate-600 flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {message.usage.total_tokens} tokens
                          </span>
                          <span className="px-2 py-1 bg-green-50 text-green-700 rounded font-medium">
                            ¥{message.cost?.toFixed(4)}
                          </span>
                          {message.latency && (
                            <span className="px-2 py-1 bg-white rounded text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {message.latency}ms
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Bot className="w-4 h-4 text-brand-600" />
                    </div>
                    <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                      <span className="text-sm text-slate-600">模型思考中...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-slate-100 px-6 py-4">
              {error && (
                <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入问题，按 Enter 发送，Shift+Enter 换行..."
                  rows={2}
                  className="flex-1 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="px-6 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white rounded-xl font-medium transition flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  发送
                </button>
              </div>
              <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                <span>按 Enter 发送 · Shift+Enter 换行</span>
                <span>余额不足时系统将自动停止响应</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
