'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useStore } from '@/lib/store';
import AuthGuard from '@/components/AuthGuard';

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
  const user = useStore((state) => state.user);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [profileRes, walletRes, usageRes] = await Promise.all([
          api.users.getProfile().catch(() => null),
          api.billing.getWallet().catch(() => null),
          api.billing.getTokenUsage().catch(() => null),
        ]);
        setProfile(profileRes);
        setWallet(walletRes);
        setTokenUsage(usageRes);
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
