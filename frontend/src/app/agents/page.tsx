'use client';

import { useState } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import api from '@/lib/api';
import {
  Send,
  Loader2,
  Bot,
  User,
  Zap,
  Clock,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  code: string;
  icon: string;
  description: string;
  capabilities: string[];
  status: 'active' | 'busy' | 'standby';
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  loading?: boolean;
  error?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  cost?: number;
  latency?: number;
  model?: string;
}

const agents: Agent[] = [
  {
    id: 'agent-ceo',
    name: 'CEO',
    code: 'agent-ceo',
    icon: '🕴️',
    description: '全局调度、跨部门协调、向董事长汇报（基于国内模型）',
    capabilities: ['任务调度', '升级处理', '战略建议', '数据看板'],
    status: 'active'
  },
  {
    id: 'agent-sales',
    name: '销售总监',
    code: 'agent-sales',
    icon: '📈',
    description: '客户开发、方案报价、CRM 管理（基于国内模型）',
    capabilities: ['开发话术生成', '报价单生成', 'CRM 记录', '竞品分析'],
    status: 'standby'
  },
  {
    id: 'agent-support',
    name: '客服主管',
    code: 'agent-support',
    icon: '🎧',
    description: '7×24 答疑、工单分级、满意度回访（基于国内模型）',
    capabilities: ['自动应答', '工单分级', '满意度追踪', '知识库更新'],
    status: 'active'
  },
  {
    id: 'agent-solution',
    name: '技术方案官',
    code: 'agent-solution',
    icon: '⚙️',
    description: '方案设计、POC 管理、技术文档（基于国内模型）',
    capabilities: ['方案书生成', 'POC 清单', '故障诊断', 'API 文档'],
    status: 'standby'
  },
  {
    id: 'agent-compliance',
    name: '合规风控官',
    code: 'agent-compliance',
    icon: '🛡️',
    description: '法规跟踪、资质审核、合同审查（基于国内模型）',
    capabilities: ['合规审查', '资质初筛', '合同标注', '政策预警'],
    status: 'standby'
  },
  {
    id: 'agent-assistant',
    name: '行政助理',
    code: 'agent-assistant',
    icon: '📅',
    description: '日程提醒、统计报表、催办通知（基于国内模型）',
    capabilities: ['日程管理', '统计报表', '任务催办', '内部通知'],
    status: 'active'
  }
];

export default function AgentsPage() {
  return (
    <AuthGuard>
      <AgentsContent />
    </AuthGuard>
  );
}

function AgentsContent() {
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invokeAgent = (agentCode: string) => {
    setActiveSession(agentCode);
    setError(null);
    if (!messages[agentCode] || messages[agentCode].length === 0) {
      const agent = agents.find(a => a.code === agentCode);
      setMessages(prev => ({
        ...prev,
        [agentCode]: [{
          id: 'welcome',
          role: 'assistant',
          content: `您好，我是${agent?.name}，已就绪。请告诉我您需要什么帮助？`
        }]
      }));
    }
  };

  const sendMessage = async () => {
    if (!activeSession || !input.trim() || sending) return;

    const userContent = input.trim();
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userContent,
    };

    const loadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      loading: true,
    };

    setMessages(prev => ({
      ...prev,
      [activeSession]: [...(prev[activeSession] || []), userMessage, loadingMessage],
    }));
    setInput('');
    setSending(true);
    setError(null);

    const startTime = Date.now();

    try {
      const data = await api.agents.invoke(activeSession, userContent);

      setMessages(prev => {
        const sessionMessages = prev[activeSession] || [];
        const updated = [...sessionMessages];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx]?.loading) {
          updated[lastIdx] = {
            id: updated[lastIdx].id,
            role: 'assistant',
            content: data.response?.text || '（无回复内容）',
            usage: data.usage,
            cost: data.cost?.costCny,
            latency: Date.now() - startTime,
            model: data.model,
          };
        }
        return { ...prev, [activeSession]: updated };
      });
    } catch (err: any) {
      const errMsg = err.message || '调用失败，请稍后重试';
      setError(errMsg);
      setMessages(prev => {
        const sessionMessages = prev[activeSession] || [];
        const updated = [...sessionMessages];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx]?.loading) {
          updated[lastIdx] = {
            id: updated[lastIdx].id,
            role: 'assistant',
            content: '',
            error: errMsg,
          };
        }
        return { ...prev, [activeSession]: updated };
      });
    } finally {
      setSending(false);
    }
  };

  const activeAgent = agents.find(a => a.code === activeSession);
  const currentMessages = activeSession ? (messages[activeSession] || []) : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent 列表 */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 mb-4">召唤数字员工</h2>
            {agents.map(agent => (
              <button
                key={agent.id}
                onClick={() => invokeAgent(agent.code)}
                className={`w-full text-left card p-4 hover:shadow-md transition-shadow ${
                  activeSession === agent.code ? 'ring-2 ring-brand-500 bg-brand-50' : 'bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{agent.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900">{agent.name}</h3>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        agent.status === 'active' ? 'bg-green-100 text-green-700' :
                        agent.status === 'busy' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {agent.status === 'active' ? '在线' : agent.status === 'busy' ? '忙碌' : '待命'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">{agent.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* 对话面板 */}
          <div className="lg:col-span-2">
            {activeSession ? (
              <div className="card h-[650px] flex flex-col bg-white">
                <div className="border-b border-slate-100 pb-4 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{activeAgent?.icon}</div>
                    <div>
                      <h3 className="font-bold text-slate-900">{activeAgent?.name}</h3>
                      <p className="text-xs text-slate-500">{activeAgent?.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Zap className="w-3 h-3" />
                    按实际 Token 消耗计费
                  </div>
                </div>

                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                  {currentMessages.map((msg, i) => (
                    <div key={msg.id || i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} flex gap-3`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          msg.role === 'user' ? 'bg-brand-600' : 'bg-slate-100'
                        }`}>
                          {msg.role === 'user' ? (
                            <User className="w-4 h-4 text-white" />
                          ) : (
                            <Bot className="w-4 h-4 text-brand-600" />
                          )}
                        </div>
                        <div className={`${
                          msg.role === 'user'
                            ? 'bg-brand-600 text-white rounded-2xl rounded-tr-sm'
                            : 'bg-slate-100 text-slate-900 rounded-2xl rounded-tl-sm'
                        } px-4 py-3`}
                        >
                          {msg.loading ? (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                              <span>{activeAgent?.name}正在思考中...</span>
                            </div>
                          ) : msg.error ? (
                            <div className="flex items-center gap-2 text-red-600 text-sm">
                              <AlertCircle className="w-4 h-4" />
                              {msg.error}
                            </div>
                          ) : (
                            <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                          )}

                          {/* Usage & Cost */}
                          {msg.role === 'assistant' && !msg.loading && !msg.error && msg.usage && (
                            <div className="mt-3 pt-3 border-t border-slate-200/60 flex flex-wrap items-center gap-2 text-xs">
                              <span className="px-2 py-1 bg-white rounded text-slate-600">
                                {msg.model}
                              </span>
                              <span className="px-2 py-1 bg-white rounded text-slate-600 flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                {msg.usage.total_tokens} tokens
                              </span>
                              <span className="px-2 py-1 bg-green-50 text-green-700 rounded font-medium">
                                ¥{msg.cost?.toFixed(4)}
                              </span>
                              {msg.latency && (
                                <span className="px-2 py-1 bg-white rounded text-slate-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {msg.latency}ms
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendMessage()}
                      disabled={sending}
                      placeholder={`向 ${activeAgent?.name} 发送指令...`}
                      className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-slate-50"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!input.trim() || sending}
                      className="btn-primary px-6 flex items-center gap-2 disabled:opacity-50"
                    >
                      {sending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          处理中
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          发送
                        </>
                      )}
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                    <span>按 Enter 发送 · 余额不足时将无法调用</span>
                    <Link href="/token-usage" className="text-brand-600 hover:text-brand-700">查看 Token 明细 →</Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card h-[650px] flex items-center justify-center text-slate-400 bg-white">
                <div className="text-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-10 h-10 text-slate-300" />
                  </div>
                  <p className="text-lg font-medium text-slate-600 mb-2">点击左侧数字员工开始对话</p>
                  <p className="text-sm text-slate-400">每次对话将按实际 Token 消耗从钱包扣费</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
