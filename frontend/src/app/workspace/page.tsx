'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useStore } from '@/lib/store';
import AuthGuard from '@/components/AuthGuard';
import { CreditCard, Package, Calendar, CheckCircle2, Clock } from 'lucide-react';

export default function WorkspacePage() {
  return (
    <AuthGuard>
      <WorkspaceContent />
    </AuthGuard>
  );
}

function WorkspaceContent() {
  const [activeTab, setActiveTab] = useState('active');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [tokenUsage, setTokenUsage] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const user = useStore((state) => state.user);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [profileRes, walletRes, usageRes, subRes, ordersRes] = await Promise.all([
          api.users.getProfile().catch(() => null),
          api.billing.getWallet().catch(() => null),
          api.billing.getTokenUsage().catch(() => null),
          api.products.getSubscriptions().catch(() => null),
          api.payment.listOrders({ limit: 5 }).catch(() => null),
        ]);
        setProfile(profileRes);
        setWallet(walletRes);
        setTokenUsage(usageRes);
        setSubscriptions(subRes?.subscriptions || []);
        setOrders(ordersRes?.orders || []);
      } catch (err: any) {
        setError(err.message || '加载数据失败');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = [
    { label: '进行中任务', value: profile?.activeTasks ?? '0', color: 'text-brand-600' },
    { label: '账户余额', value: wallet?.balance ? `¥${wallet.balance}` : '¥0', color: 'text-green-600' },
    { label: '信用分', value: profile?.creditScore ?? user?.creditScore ?? '100', color: 'text-blue-600' },
    { label: '等级', value: profile?.level ? `LV.${profile.level}` : user?.level ? `LV.${user.level}` : 'LV.1', color: 'text-purple-600' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {/* 概览卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card text-center">
                <div className="text-2xl font-bold text-gray-300">...</div>
                <div className="text-sm text-gray-400 mt-1">加载中</div>
              </div>
            ))
          ) : (
            stats.map((stat, i) => (
              <div key={i} className="card text-center">
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))
          )}
        </div>

        {/* Token 用量提示 */}
        {tokenUsage && (
          <div className="card mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">本月 Token 用量</h3>
                <p className="text-sm text-gray-500 mt-1">
                  已用 {tokenUsage.promptTokens ?? 0} prompt + {tokenUsage.completionTokens ?? 0} completion
                  {tokenUsage.costCny ? `，费用 ¥${tokenUsage.costCny}` : ''}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-brand-600">
                  {tokenUsage?.totalTokens ?? 0}
                </div>
                <div className="text-sm text-gray-500">总 Token</div>
              </div>
            </div>
          </div>
        )}

        {/* 我的套餐与购买记录 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 当前套餐 */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-brand-600" />
              <h3 className="font-semibold text-gray-900">我的套餐</h3>
            </div>
            {subscriptions.length > 0 ? (
              <div className="space-y-3">
                {subscriptions.slice(0, 3).map((sub: any) => (
                  <div key={sub.id} className="flex items-center justify-between p-3 bg-brand-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{sub.productName || '未知套餐'}</div>
                      <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {sub.startedAt ? new Date(sub.startedAt).toLocaleDateString('zh-CN') : '-'}</span>
                        <span>至 {sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString('zh-CN') : '-'}</span>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {sub.status === 'active' ? '生效中' : sub.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500 mb-3">暂无生效套餐</p>
                <Link href="/pricing" className="text-sm text-brand-600 hover:text-brand-700 font-medium">去选择套餐 →</Link>
              </div>
            )}
          </div>

          {/* 最近购买记录 */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-brand-600" />
                <h3 className="font-semibold text-gray-900">最近购买记录</h3>
              </div>
              <Link href="/wallet" className="text-sm text-brand-600 hover:text-brand-700 font-medium">查看全部 →</Link>
            </div>
            {orders.length > 0 ? (
              <div className="space-y-3">
                {orders.map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{order.orderNo}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{order.createdAt ? new Date(order.createdAt).toLocaleString('zh-CN') : '-'}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">¥{Number(order.amount || 0).toFixed(2)}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                        {order.status === 'completed' ? <CheckCircle2 className="w-3 h-3 text-green-600" /> : <Clock className="w-3 h-3 text-gray-400" />}
                        {order.status === 'completed' ? '已完成' : order.status === 'pending' ? '待支付' : order.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500 mb-3">暂无购买记录</p>
                <Link href="/pricing" className="text-sm text-brand-600 hover:text-brand-700 font-medium">去购买 →</Link>
              </div>
            )}
          </div>
        </div>

        {/* 标签页 */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'active', label: '进行中' },
            { key: 'pending', label: '待审核' },
            { key: 'completed', label: '已完成' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                activeTab === key
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 任务列表 */}
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-gray-500 mb-4">暂无{activeTab === 'active' ? '进行中' : activeTab === 'pending' ? '待审核' : '已完成'}任务</p>
          <Link href="/tasks" className="btn-primary">
            去任务大厅接单
          </Link>
        </div>

        {/* 快捷操作 */}
        <div className="mt-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">快捷操作</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/agents" className="card hover:shadow-md transition-shadow">
              <div className="text-2xl mb-2">🤖</div>
              <h4 className="font-bold text-gray-900">召唤数字员工</h4>
              <p className="text-sm text-gray-500">让 AI 团队协助你完成任务</p>
            </Link>
              <Link href="/tasks" className="card hover:shadow-md transition-shadow">
              <div className="text-2xl mb-2">📋</div>
              <h4 className="font-bold text-gray-900">任务大厅</h4>
              <p className="text-sm text-gray-500">跨境商业撮合与AI任务</p>
            </Link>
            <Link href="/community" className="card hover:shadow-md transition-shadow">
              <div className="text-2xl mb-2">💬</div>
              <h4 className="font-bold text-gray-900">社区</h4>
              <p className="text-sm text-gray-500">跨境商机分享与资源对接</p>
            </Link>
            <Link href="/network-services" className="card hover:shadow-md transition-shadow">
              <div className="text-2xl mb-2">🌐</div>
              <h4 className="font-bold text-gray-900">跨境网络服务</h4>
              <p className="text-sm text-gray-500">合规通道、专属 IP、自动配置</p>
            </Link>
            <Link href="/earnings" className="card hover:shadow-md transition-shadow">
              <div className="text-2xl mb-2">💰</div>
              <h4 className="font-bold text-gray-900">查看收益</h4>
              <p className="text-sm text-gray-500">结算记录与提现管理</p>
            </Link>
            <Link href="/settings" className="card hover:shadow-md transition-shadow">
              <div className="text-2xl mb-2">🔒</div>
              <h4 className="font-bold text-gray-900">账户设置</h4>
              <p className="text-sm text-gray-500">修改登录密码</p>
            </Link>
            <Link href="/learn" className="card hover:shadow-md transition-shadow">
              <div className="text-2xl mb-2">📚</div>
              <h4 className="font-bold text-gray-900">学习中心</h4>
              <p className="text-sm text-gray-500">中新数据港业务知识库</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
