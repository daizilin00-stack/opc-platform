'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';

interface Message {
  id: string;
  role: 'user' | 'agent';
  text: string;
}

const QUICK_REPLIES = [
  '部署套餐怎么选？',
  '创业版包含几个账号？',
  'AI 能访问我电脑里的文件吗？',
  '如何联系人工销售？',
  '成本计算器价格准吗？',
];

const KNOWLEDGE_BASE: Record<string, string> = {
  '部署套餐怎么选？': '建议先用成本计算器输入您的 Agent 数量、月调用次数和团队人数，系统会自动推荐最划算的套餐。个人开发者选体验版（¥99/月），中小团队选创业版（¥299/月），成长企业选团队版（¥999/月）。',
  '创业版包含几个账号？': '创业版套餐包含 5 个 Agent、10,000 次/月调用、3 个团队成员账号。每个成员使用独立账号登录 Open Cloud 工作台，权限由管理员统一分配。',
  'AI 能访问我电脑里的文件吗？': '为保护数据安全，云端 Agent 默认无法直接访问员工本地电脑文件。员工可通过「工作台」上传文件到平台云盘，Agent 在授权范围内读取；企业版可部署私有化网关，实现受控的本地文件同步。',
  '如何联系人工销售？': '我已记录您的咨询，人工销售会在工作日 9:00-18:00 内回电或邮件联系您。您也可以直接拨打 18223589315 或发送邮件至 csdp-cq@139.com。',
  '成本计算器价格准吗？': '成本计算器给出的价格是部署套餐的订阅费用。实际模型调用还会按 Token 实时计费，套餐内赠送或充值的 Token 额度可抵扣。最终月费 = 套餐订阅费 + 超出套餐的附加费 + Token 按量费用。',
};

export default function ChatWidget({
  title = 'AI 客服 + 人工协同',
  subtitle = '7×24 在线，人工工作日 9:00-18:00',
}: {
  title?: string;
  subtitle?: string;
}) {
  const open = useStore((state) => state.chatOpen);
  const setOpen = useStore((state) => state.setChatOpen);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'agent',
      text: '您好！我是 CSDP AgentWork 智能客服。请先点击下方常见问题，或输入您的问题，复杂需求我会转接人工销售。',
    },
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const handleQuickReply = (text: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text };
    const answer = KNOWLEDGE_BASE[text] || '我已收到您的问题，正在为您转接人工客服，销售顾问会尽快与您联系。';
    const agentMsg: Message = { id: (Date.now() + 1).toString(), role: 'agent', text: answer };
    setMessages((prev) => [...prev, userMsg, agentMsg]);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input.trim() };
    const reply =
      Object.entries(KNOWLEDGE_BASE).find(([k]) => input.trim().includes(k))?.[1] ||
      '我已记录您的问题，人工销售会在工作日 9:00-18:00 内与您联系。紧急需求请拨打 18223589315。';
    const agentMsg: Message = { id: (Date.now() + 1).toString(), role: 'agent', text: reply };
    setMessages((prev) => [...prev, userMsg, agentMsg]);
    setInput('');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {open && (
        <div className="mb-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[32rem]">
          <div className="bg-brand-600 text-white px-4 py-3 flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm">{title}</div>
              <div className="text-xs text-white/80">{subtitle}</div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white text-lg leading-none">
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                    m.role === 'user'
                      ? 'bg-brand-600 text-white rounded-br-none'
                      : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t border-slate-200 bg-white">
            <div className="flex flex-wrap gap-2 mb-3">
              {QUICK_REPLIES.map((q) => (
                <button
                  key={q}
                  onClick={() => handleQuickReply(q)}
                  className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="输入问题…"
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                onClick={handleSend}
                className="px-3 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700 transition-colors"
              >
                发送
              </button>
            </div>
            <div className="mt-2 flex justify-between text-xs text-slate-400">
              <span>人工客服：工作日 9:00-18:00</span>
              <Link href="/support" className="text-brand-600 hover:underline">
                帮助中心 →
              </Link>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 bg-brand-600 hover:bg-brand-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105"
        aria-label={open ? '关闭客服' : '打开客服'}
      >
        {open ? (
          <span className="text-2xl">×</span>
        ) : (
          <span className="text-2xl">💬</span>
        )}
      </button>
    </div>
  );
}
