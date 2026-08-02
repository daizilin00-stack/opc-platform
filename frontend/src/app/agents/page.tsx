'use client';

import { useState } from 'react';
import AuthGuard from '@/components/AuthGuard';

interface Agent {
  id: string;
  name: string;
  code: string;
  icon: string;
  description: string;
  capabilities: string[];
  status: 'active' | 'busy' | 'standby';
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
  const [messages, setMessages] = useState<Record<string, string[]>>({});
  const [input, setInput] = useState('');

  const invokeAgent = (agentCode: string) => {
    setActiveSession(agentCode);
    if (!messages[agentCode]) {
      const agent = agents.find(a => a.code === agentCode);
      setMessages(prev => ({
        ...prev,
        [agentCode]: [`您好，我是${agent?.name}，已就绪。请告诉我您需要什么帮助？`]
      }));
    }
  };

  const sendMessage = () => {
    if (!activeSession || !input.trim()) return;
    setMessages(prev => ({
      ...prev,
      [activeSession]: [...(prev[activeSession] || []), `创业者：${input}`]
    }));
    setInput('');
    // TODO: 实际调用 Agent API
    setTimeout(() => {
      setMessages(prev => ({
        ...prev,
        [activeSession]: [...(prev[activeSession] || []), `${agents.find(a => a.code === activeSession)?.name}：收到，正在为您处理...`]
      }));
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent 列表 */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">召唤数字员工</h2>
            {agents.map(agent => (
              <button
                key={agent.id}
                onClick={() => invokeAgent(agent.code)}
                className={`w-full text-left card p-4 hover:shadow-md transition-shadow ${
                  activeSession === agent.code ? 'ring-2 ring-brand-500' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{agent.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900">{agent.name}</h3>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        agent.status === 'active' ? 'bg-green-100 text-green-700' :
                        agent.status === 'busy' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {agent.status === 'active' ? '在线' : agent.status === 'busy' ? '忙碌' : '待命'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{agent.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* 对话面板 */}
          <div className="lg:col-span-2">
            {activeSession ? (
              <div className="card h-[600px] flex flex-col">
                <div className="border-b border-gray-100 pb-4 mb-4">
                  <h3 className="font-bold text-gray-900">
                    {agents.find(a => a.code === activeSession)?.icon} {' '}
                    {agents.find(a => a.code === activeSession)?.name}
                  </h3>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {(messages[activeSession] || []).map((msg, i) => (
                    <div key={i} className={`p-3 rounded-lg ${
                      msg.startsWith('创业者') 
                        ? 'bg-brand-50 ml-8' 
                        : 'bg-gray-50 mr-8'
                    }`}>
                      <p className="text-sm text-gray-700">{msg}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder={`向 ${agents.find(a => a.code === activeSession)?.name} 发送指令...`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                  <button onClick={sendMessage} className="btn-primary px-6">
                    发送
                  </button>
                </div>
              </div>
            ) : (
              <div className="card h-[600px] flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="text-4xl mb-4">🤖</div>
                  <p>点击左侧数字员工开始对话</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
