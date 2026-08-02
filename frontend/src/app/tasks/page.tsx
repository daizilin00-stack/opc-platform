'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useStore, getToken } from '@/lib/store';

interface Task {
  id: string;
  title: string;
  type: string;
  region: string;
  description: string;
  reward: number;
  currency: string;
  deadline: string;
  status: string;
  applicants?: number;
  poster?: string;
  assignee_id?: string;
}

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'ai' | 'business' | 'content' | 'tech'>('all');
  const [regionFilter, setRegionFilter] = useState<'all' | 'china' | 'singapore' | 'global'>('all');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claiming, setClaiming] = useState<string | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [postForm, setPostForm] = useState({
    title: '',
    description: '',
    type: 'ai',
    region: 'china',
    reward: '',
    deadline: '',
  });
  const [posting, setPosting] = useState(false);
  const user = useStore((state) => state.user);
  const token = getToken();

  const mockTasks: Task[] = [
    {
      id: 'T001',
      title: 'AI客服数字员工部署',
      type: 'ai',
      region: 'china',
      description: '为某跨境电商企业部署中英双语AI客服，接入Shopify和独立站',
      reward: 5000,
      currency: 'CNY',
      deadline: '2026-07-25',
      status: 'open',
      applicants: 12,
      poster: '某跨境电商',
    },
    {
      id: 'T002',
      title: '新加坡品牌中国入华市场调研',
      type: 'business',
      region: 'global',
      description: '为新加坡美妆品牌进行中国市场调研，包括竞品分析、渠道评估、定价策略',
      reward: 8000,
      currency: 'CNY',
      deadline: '2026-07-30',
      status: 'open',
      applicants: 5,
      poster: '新加坡某美妆品牌',
    },
    {
      id: 'T003',
      title: 'TikTok短视频内容制作（中英双语）',
      type: 'content',
      region: 'global',
      description: '制作10条中英双语产品种草视频，适配TikTok和抖音平台',
      reward: 3000,
      currency: 'CNY',
      deadline: '2026-07-20',
      status: 'open',
      applicants: 8,
      poster: '某出海3C品牌',
    },
    {
      id: 'T004',
      title: 'AI Agent定制开发（销售自动化）',
      type: 'tech',
      region: 'china',
      description: '开发自动化销售Agent，集成CRM、邮件自动发送、客户跟进',
      reward: 15000,
      currency: 'CNY',
      deadline: '2026-08-01',
      status: 'open',
      applicants: 3,
      poster: '某B2B SaaS企业',
    },
    {
      id: 'T005',
      title: '中国餐饮品牌出海新加坡本地化',
      type: 'business',
      region: 'singapore',
      description: '帮助中国火锅品牌进入新加坡市场，包括菜单本地化、供应链对接、社媒运营',
      reward: 12000,
      currency: 'CNY',
      deadline: '2026-07-28',
      status: 'open',
      applicants: 7,
      poster: '某火锅连锁集团',
    },
  ];

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.tasks.list();
      // 合并后端任务和mock任务（后端没有数据时显示mock）
      const backendTasks = res.tasks || [];
      const allTasks = backendTasks.length > 0 ? backendTasks : mockTasks;
      setTasks(allTasks);
    } catch (err: any) {
      setError(err.message || '获取任务列表失败');
      // 失败时显示mock任务
      setTasks(mockTasks);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (taskId: string) => {
    if (!token) {
      alert('请先登录');
      return;
    }
    try {
      setClaiming(taskId);
      await api.tasks.claim(taskId);
      alert('报名成功！');
      fetchTasks();
    } catch (err: any) {
      alert(err.message || '报名失败');
    } finally {
      setClaiming(null);
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      alert('请先登录');
      return;
    }
    try {
      setPosting(true);
      await api.tasks.create({
        title: postForm.title,
        description: postForm.description,
        type: postForm.type,
        region: postForm.region,
        reward: parseFloat(postForm.reward),
        deadline: postForm.deadline,
        status: 'open',
      });
      alert('任务发布成功！');
      setShowPostModal(false);
      setPostForm({ title: '', description: '', type: 'ai', region: 'china', reward: '', deadline: '' });
      fetchTasks();
    } catch (err: any) {
      alert(err.message || '发布失败');
    } finally {
      setPosting(false);
    }
  };

  const filtered = tasks.filter((t) => {
    if (activeTab !== 'all' && t.type !== activeTab) return false;
    if (regionFilter !== 'all' && t.region !== regionFilter) return false;
    return true;
  });

  const typeLabels: Record<string, string> = {
    ai: 'AI任务',
    business: '商业任务',
    content: '内容共创',
    tech: '技术开发',
  };

  const regionLabels: Record<string, string> = {
    china: '🇨🇳 中国',
    singapore: '🇸🇬 新加坡',
    global: '🌐 全球',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">任务大厅</h1>
          <p className="text-slate-600">连接中国与全球商业机会，AI任务 + 跨境撮合</p>
        </div>

        {/* 防跳单提示 */}
        <div className="bg-accent-50 border border-accent-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-xl">🛡️</span>
            <div className="flex-1">
              <p className="font-semibold text-accent-700 mb-1">平台交易保障</p>
              <p className="text-sm text-accent-600">
                所有交易通过平台完成，享受资金托管、交易纠纷调解、信用积分累积。
                平台服务费10-20%，随信用等级降低。私下交易无保障，且将被扣减信用分。
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex gap-2">
            {[
              { key: 'all', label: '全部' },
              { key: 'ai', label: '🤖 AI任务' },
              { key: 'business', label: '💼 商业任务' },
              { key: 'content', label: '🎬 内容共创' },
              { key: 'tech', label: '⚙️ 技术开发' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeTab === key
                    ? 'bg-brand-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {[
              { key: 'all', label: '全部地区' },
              { key: 'china', label: '🇨🇳 中国' },
              { key: 'singapore', label: '🇸🇬 新加坡' },
              { key: 'global', label: '🌐 全球' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setRegionFilter(key as any)}
                className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                  regionFilter === key
                    ? 'bg-accent-100 text-accent-700'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-slate-500">加载任务中...</p>
          </div>
        )}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Task List */}
        {!loading && (
          <div className="space-y-4">
            {filtered.map((task) => (
              <div key={task.id} className="card bg-white hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        task.type === 'ai' ? 'bg-brand-50 text-brand-700' :
                        task.type === 'business' ? 'bg-accent-50 text-accent-700' :
                        task.type === 'content' ? 'bg-yellow-50 text-yellow-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {typeLabels[task.type] || task.type}
                      </span>
                      <span className="text-xs text-slate-500">{regionLabels[task.region] || task.region}</span>
                      <span className="text-xs text-slate-400">{(task.applicants || 0)}人报名</span>
                      {task.status === 'in_progress' && (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700">进行中</span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">{task.title}</h3>
                    <p className="text-sm text-slate-600 mb-3">{task.description}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>发布方：{task.poster || '匿名'}</span>
                      <span>截止：{task.deadline}</span>
                    </div>
                  </div>
                  <div className="text-right ml-6">
                    <div className="text-2xl font-bold text-brand-600">
                      {task.currency === 'CNY' ? '¥' : '$'}{task.reward.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-400 mb-3">
                      含{Math.round(task.reward * 0.15)}平台服务费
                    </div>
                    <button
                      onClick={() => handleClaim(task.id)}
                      disabled={claiming === task.id || task.status !== 'open'}
                      className="btn-primary text-sm px-6 py-2 disabled:opacity-50"
                    >
                      {claiming === task.id ? '报名中...' : task.status === 'open' ? '立即报名' : '已截止'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filtered.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-slate-500 mb-2">暂无符合条件的任务</p>
            <p className="text-sm text-slate-400">试试其他筛选条件</p>
          </div>
        )}

        {/* Post Task CTA */}
        <div className="mt-8 card bg-brand-50 border border-brand-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-brand-700 mb-1">有跨境需求？发布任务</h3>
              <p className="text-sm text-brand-600">
                无论是AI服务、商业撮合、内容共创还是技术开发，平台帮您连接全球资源
              </p>
            </div>
            <button
              onClick={() => setShowPostModal(true)}
              className="btn-primary"
            >
              发布任务
            </button>
          </div>
        </div>

        {/* Community Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            想先了解市场？去
            <Link href="/community" className="text-brand-600 hover:underline font-medium mx-1">社区</Link>
            浏览跨境商机和经验分享
          </p>
        </div>
      </div>

      {/* Post Task Modal */}
      {showPostModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">发布任务</h3>
              <button
                onClick={() => setShowPostModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handlePost} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">任务标题</label>
                <input
                  type="text"
                  required
                  placeholder="简要描述任务内容"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  value={postForm.title}
                  onChange={e => setPostForm({ ...postForm, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">任务描述</label>
                <textarea
                  required
                  rows={3}
                  placeholder="详细描述任务需求、交付要求、时间节点等"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  value={postForm.description}
                  onChange={e => setPostForm({ ...postForm, description: e.target.value })}
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">任务类型</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    value={postForm.type}
                    onChange={e => setPostForm({ ...postForm, type: e.target.value })}
                  >
                    <option value="ai">🤖 AI任务</option>
                    <option value="business">💼 商业任务</option>
                    <option value="content">🎬 内容共创</option>
                    <option value="tech">⚙️ 技术开发</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">地区</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    value={postForm.region}
                    onChange={e => setPostForm({ ...postForm, region: e.target.value })}
                  >
                    <option value="china">🇨🇳 中国</option>
                    <option value="singapore">🇸🇬 新加坡</option>
                    <option value="global">🌐 全球</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">报酬（CNY）</label>
                  <input
                    type="number"
                    required
                    min="100"
                    placeholder="5000"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    value={postForm.reward}
                    onChange={e => setPostForm({ ...postForm, reward: e.target.value })}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">截止日期</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    value={postForm.deadline}
                    onChange={e => setPostForm({ ...postForm, deadline: e.target.value })}
                  />
                </div>
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={posting}
                  className="w-full btn-primary py-3 disabled:opacity-50"
                >
                  {posting ? '发布中...' : '发布任务'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
