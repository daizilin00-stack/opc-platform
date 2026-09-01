'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useStore } from '@/lib/store';
import AuthGuard from '@/components/AuthGuard';
import {
  CreditCard,
  Package,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Bot,
  Rocket,
  Wallet,
  Zap,
  TrendingUp,
  PieChart,
  ArrowRight,
  Plus,
  RefreshCw,
  History,
  LayoutDashboard,
  MessageSquare,
  Globe,
  Users,
  Cpu,
  Gem,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

export default function WorkspacePage() {
  return (
    <AuthGuard>
      <WorkspaceContent />
    </AuthGuard>
  );
}

function WorkspaceContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [tokenUsage, setTokenUsage] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [recentCalls, setRecentCalls] = useState<any[]>([]);
  const user = useStore((state) => state.user);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [profileRes, walletRes, usageRes, subRes, ordersRes, agentsRes, callsRes] = await Promise.all([
          api.users.getProfile().catch(() => null),
          api.billing.getWallet().catch(() => null),
          api.billing.getTokenUsage().catch(() => null),
          api.products.getSubscriptions().catch(() => null),
          api.payment.listOrders({ limit: 5 }).catch(() => null),
          api.deploy.listAgents().catch(() => null),
          api.billing.getTokenDetails(5, 0).catch(() => null),
        ]);
        setProfile(profileRes);
        setWallet(walletRes);
        setTokenUsage(usageRes);
        setSubscriptions(subRes?.subscriptions || []);
        setOrders(ordersRes?.orders || []);
        setAgents(agentsRes?.data || []);
        setRecentCalls(callsRes?.items || []);
      } catch (err: any) {
        setError(err.message || '加载数据失败');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const balance = parseFloat(wallet?.balance || 0);
  const totalTokens = tokenUsage?.summary?.total_tokens || 0;
  const totalCost = parseFloat(tokenUsage?.summary?.total_cost || 0);
  const totalCalls = tokenUsage?.summary?.total_calls || 0;
  const modelBreakdown = tokenUsage?.details || [];

  const activeSubscription = subscriptions.find((s: any) => s.status === 'active');
  const tokenQuota = activeSubscription?.tokenQuota || 0;
  const tokenUsagePercent = tokenQuota > 0 ? Math.min(100, Math.round((totalTokens / tokenQuota) * 100)) : 0;

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <LayoutDashboard className="w-7 h-7 text-brand-600" />
                工作台
              </h1>
              <p className="text-slate-500 mt-1">
                欢迎回来，{profile?.realName || user?.phone || '创业者'}！这里是你的产品控制中心。
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/recharge" className="btn-primary flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                充值
              </Link>
              <Link href="/pricing" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-medium transition">
                升级套餐
              </Link>
            </div>
          </div>
        </div>

        {/* Asset Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card bg-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm text-slate-500">账户余额</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {loading ? '...' : `¥${balance.toFixed(2)}`}
            </div>
            <div className="text-xs text-slate-400 mt-1">可用于模型调用与套餐购买</div>
          </div>

          <div className="card bg-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-brand-600" />
              </div>
              <span className="text-sm text-slate-500">当前套餐</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {loading ? '...' : (activeSubscription ? activeSubscription.productName : '未开通')}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {activeSubscription
                ? `有效期至 ${new Date(activeSubscription.expiresAt).toLocaleDateString('zh-CN')}`
                : '选择套餐开始体验'}
            </div>
          </div>

          <div className="card bg-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-slate-500">本月 Token</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {loading ? '...' : totalTokens.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-1">{totalCalls.toLocaleString()} 次调用</div>
          </div>

          <div className="card bg-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm text-slate-500">本月费用</span>
            </div>
            <div className="text-2xl font-bold text-brand-600">
              {loading ? '...' : `¥${totalCost.toFixed(4)}`}
            </div>
            <div className="text-xs text-slate-400 mt-1">按实际用量实时扣费</div>
          </div>
        </div>

        {/* Quick Actions - Direct Product Access */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">立即使用</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/playground" className="group card bg-white hover:ring-2 hover:ring-brand-500 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-brand-600 transition" />
              </div>
              <h3 className="font-bold text-slate-900 mb-1">体验模型</h3>
              <p className="text-sm text-slate-500">选择 GPT/Claude/DeepSeek 等模型直接对话</p>
            </Link>

            <Link href="/agents" className="group card bg-white hover:ring-2 hover:ring-brand-500 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-brand-600 transition" />
              </div>
              <h3 className="font-bold text-slate-900 mb-1">召唤数字员工</h3>
              <p className="text-sm text-slate-500">让 CEO、销售、客服等 AI 员工协助工作</p>
            </Link>

            <Link href="/deploy/create" className="group card bg-white hover:ring-2 hover:ring-brand-500 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Cpu className="w-6 h-6 text-white" />
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-brand-600 transition" />
              </div>
              <h3 className="font-bold text-slate-900 mb-1">部署 Agent</h3>
              <p className="text-sm text-slate-500">创建并运行专属 OpenClaw Agent</p>
            </Link>

            <Link href="/network-services" className="group card bg-white hover:ring-2 hover:ring-brand-500 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-brand-600 transition" />
              </div>
              <h3 className="font-bold text-slate-900 mb-1">跨境网络服务</h3>
              <p className="text-sm text-slate-500">合规通道、专属 IP、自动配置</p>
            </Link>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* My Subscription */}
          <div className="card bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-brand-600" />
                <h3 className="font-semibold text-slate-900">我的套餐与权益</h3>
              </div>
              <Link href="/pricing" className="text-sm text-brand-600 hover:text-brand-700">升级 →</Link>
            </div>
            {subscriptions.length > 0 ? (
              <div className="space-y-4">
                {subscriptions.slice(0, 3).map((sub: any) => (
                  <div key={sub.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-slate-900">{sub.productName || '未知套餐'}</div>
                      <span className={`text-xs px-2 py-1 rounded-full ${sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {sub.status === 'active' ? '生效中' : sub.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mb-3 flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {sub.startedAt ? new Date(sub.startedAt).toLocaleDateString('zh-CN') : '-'} 至 {sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString('zh-CN') : '-'}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white rounded-lg p-2 text-center border border-slate-100">
                        <div className="font-bold text-brand-600">{sub.aiEmployees?.length || 0}</div>
                        <div className="text-slate-500">AI 员工</div>
                      </div>
                      <div className="bg-white rounded-lg p-2 text-center border border-slate-100">
                        <div className="font-bold text-blue-600">{(sub.tokenQuota || 0).toLocaleString()}</div>
                        <div className="text-slate-500">Token 额度</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Package className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500 mb-3">暂无生效套餐</p>
                <Link href="/pricing" className="btn-primary text-sm">去选择套餐</Link>
              </div>
            )}
          </div>

          {/* Token Usage Visualization */}
          <div className="card bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-brand-600" />
                <h3 className="font-semibold text-slate-900">本月 Token 用量</h3>
              </div>
              <Link href="/token-usage" className="text-sm text-brand-600 hover:text-brand-700">明细 →</Link>
            </div>
            <div className="text-center py-4">
              <div className="relative inline-flex items-center justify-center w-32 h-32 mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="10"
                    strokeDasharray={`${tokenUsagePercent * 2.64} 264`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute text-center">
                  <div className="text-2xl font-bold text-slate-900">{tokenUsagePercent}%</div>
                  <div className="text-xs text-slate-500">已用</div>
                </div>
              </div>
              <div className="text-sm text-slate-600 mb-1">
                已用 <span className="font-bold text-slate-900">{totalTokens.toLocaleString()}</span> / {tokenQuota > 0 ? tokenQuota.toLocaleString() : '无限制'} tokens
              </div>
              <div className="text-xs text-slate-400 mb-4">本月累计调用 {totalCalls.toLocaleString()} 次，费用 ¥{totalCost.toFixed(4)}</div>
              <Link href="/playground" className="btn-primary text-sm w-full justify-center">
                去体验模型
              </Link>
            </div>
          </div>

          {/* My Products / Features */}
          <div className="card bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Gem className="w-5 h-5 text-brand-600" />
                <h3 className="font-semibold text-slate-900">我的产品</h3>
              </div>
            </div>
            <div className="space-y-3">
              <Link href="/playground" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-brand-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-slate-900">模型体验中心</div>
                  <div className="text-xs text-slate-500">直接调用 GPT/Claude/DeepSeek</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link href="/agents" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-slate-900">硅基员工平台</div>
                  <div className="text-xs text-slate-500">{activeSubscription ? `已开通 ${activeSubscription.aiEmployees?.length || 0} 个角色` : '未开通'}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link href="/deploy" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-slate-900">OpenClaw 部署平台</div>
                  <div className="text-xs text-slate-500">已部署 {agents.length} 个 Agent</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link href="/token-center" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Gem className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-slate-900">Token 团购中心</div>
                  <div className="text-xs text-slate-500">充值更优惠，量大更省钱</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>

        {/* Model Usage Breakdown */}
        {modelBreakdown.length > 0 && (
          <div className="card bg-white mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-600" />
                <h3 className="font-semibold text-slate-900">按模型用量分布</h3>
              </div>
              <Link href="/token-usage" className="text-sm text-brand-600 hover:text-brand-700">查看全部 →</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modelBreakdown.slice(0, 6).map((item: any, i: number) => {
                const percent = totalTokens > 0 ? Math.round((item.total_tokens / totalTokens) * 100) : 0;
                return (
                  <div key={i} className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-900 text-sm">{item.model_name}</span>
                      <span className="text-xs text-slate-500">{percent}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 mb-3">
                      <div className="bg-brand-600 h-2 rounded-full transition-all" style={{ width: `${percent}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{item.total_tokens.toLocaleString()} tokens</span>
                      <span className="font-medium text-brand-600">¥{Number(item.total_cost || 0).toFixed(4)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Orders */}
          <div className="card bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-brand-600" />
                <h3 className="font-semibold text-slate-900">最近购买记录</h3>
              </div>
              <Link href="/wallet" className="text-sm text-brand-600 hover:text-brand-700">查看全部 →</Link>
            </div>
            {orders.length > 0 ? (
              <div className="space-y-3">
                {orders.map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div>
                      <div className="font-medium text-slate-900 text-sm">{order.orderNo}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{order.createdAt ? formatDate(order.createdAt) : '-'}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-slate-900">¥{Number(order.amount || 0).toFixed(2)}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 justify-end">
                        {order.status === 'completed' ? <CheckCircle2 className="w-3 h-3 text-green-600" /> : <Clock className="w-3 h-3 text-gray-400" />}
                        {order.status === 'completed' ? '已完成' : order.status === 'pending' ? '待支付' : order.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">暂无购买记录</p>
              </div>
            )}
          </div>

          {/* Recent Calls */}
          <div className="card bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-brand-600" />
                <h3 className="font-semibold text-slate-900">最近调用记录</h3>
              </div>
              <Link href="/token-usage" className="text-sm text-brand-600 hover:text-brand-700">查看全部 →</Link>
            </div>
            {recentCalls.length > 0 ? (
              <div className="space-y-3">
                {recentCalls.map((call: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div>
                      <div className="font-medium text-slate-900 text-sm">{call.model_name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{call.created_at ? formatDate(call.created_at) : '-'}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-slate-900">{call.total_tokens.toLocaleString()} tokens</div>
                      <div className="text-xs text-brand-600">¥{Number(call.cost_cny || 0).toFixed(4)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm mb-3">暂无调用记录</p>
                <Link href="/playground" className="text-sm text-brand-600 hover:text-brand-700">去模型体验中心 →</Link>
              </div>
            )}
          </div>
        </div>

        {/* My Agent */}
        <div className="card bg-white mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-brand-600" />
              <h3 className="font-semibold text-slate-900">我的 OpenClaw Agent</h3>
            </div>
            <Link href="/deploy/create" className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1">
              <Plus className="w-4 h-4" />
              创建 Agent
            </Link>
          </div>
          {agents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.slice(0, 6).map((agent: any) => (
                <div key={agent.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-slate-900">{agent.name}</div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      agent.status === 'running' ? 'bg-green-100 text-green-700' :
                      agent.status === 'creating' ? 'bg-blue-100 text-blue-700' :
                      agent.status === 'error' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {agent.status === 'running' ? '运行中' : agent.status === 'creating' ? '创建中' : agent.status === 'error' ? '异常' : agent.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mb-3">模型：{agent.model} · 创建于 {agent.created_at ? new Date(agent.created_at).toLocaleDateString('zh-CN') : '-'}</div>
                  <Link href={`/deploy`} className="text-xs text-brand-600 hover:text-brand-700 font-medium">管理 →</Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Rocket className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm mb-3">暂无部署的 Agent</p>
              <Link href="/deploy/create" className="btn-primary text-sm">去创建 Agent</Link>
            </div>
          )}
        </div>

        {/* Onboarding / Help */}
        <div className="card bg-gradient-to-r from-brand-50 to-blue-50 border-brand-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">新手引导：3 步开始使用</h3>
              <div className="flex items-center gap-6 text-sm text-slate-600">
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs">1</span>
                  充值或购买套餐
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs">2</span>
                  进入模型体验中心
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs">3</span>
                  选择模型开始对话
                </span>
              </div>
            </div>
            <Link href="/playground" className="btn-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              立即体验
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
