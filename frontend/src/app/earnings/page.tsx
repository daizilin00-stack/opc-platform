'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import { API_BASE } from '@/lib/api';
import { Banknote, ArrowUpRight, AlertCircle } from 'lucide-react';

interface EarningRecord {
  id: string;
  date: string;
  source: string;
  type: 'task' | 'referral' | 'bonus';
  amount: number;
  status: 'pending' | 'settled' | 'withdrawn';
}

export default function EarningsPage() {
  return (
    <AuthGuard>
      <EarningsContent />
    </AuthGuard>
  );
}

function EarningsContent() {
  const [filter, setFilter] = useState<'all' | 'task' | 'referral' | 'bonus'>('all');
  const [records, setRecords] = useState<EarningRecord[]>([]);
  const [withdrawStats, setWithdrawStats] = useState({ total_in: 0, total_out: 0, pending_amount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarningsData();
  }, []);

  const fetchEarningsData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // 获取收益数据（这里用模拟数据，实际应调用 /api/earnings/summary 等）
      const mockRecords: EarningRecord[] = [
        { id: 'E001', date: '2026-05-28', source: '内容共创任务 #1024', type: 'task', amount: 280, status: 'settled' },
        { id: 'E002', date: '2026-05-25', source: '邀请奖励：用户 138****8888', type: 'referral', amount: 99, status: 'settled' },
        { id: 'E003', date: '2026-05-20', source: '开园入驻早鸟奖励', type: 'bonus', amount: 500, status: 'pending' },
      ];
      setRecords(mockRecords);

      // 获取钱包统计
      const walletRes = await fetch(`${API_BASE}/wallet/transactions?type=withdrawal&limit=1`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (walletRes.ok) {
        const walletData = await walletRes.json();
        if (walletData.success) {
          setWithdrawStats({
            total_in: walletData.stats?.total_in || 0,
            total_out: walletData.stats?.total_out || 0,
            pending_amount: 0
          });
        }
      }
    } catch (err) {
      console.error('加载收益数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = filter === 'all' ? records : records.filter(r => r.type === filter);
  const total = records.reduce((sum, r) => sum + r.amount, 0);
  const settled = records.filter(r => r.status === 'settled').reduce((sum, r) => sum + r.amount, 0);
  const availableWithdraw = settled - (withdrawStats.total_out || 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 概览 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card bg-white text-center">
            <div className="text-2xl font-bold text-slate-900">¥{total}</div>
            <div className="text-sm text-slate-500 mt-1">累计收益</div>
          </div>
          <div className="card bg-white text-center">
            <div className="text-2xl font-bold text-accent-600">¥{settled}</div>
            <div className="text-sm text-slate-500 mt-1">已结算</div>
          </div>
          <div className="card bg-white text-center">
            <div className="text-2xl font-bold text-brand-600">¥{total - settled}</div>
            <div className="text-sm text-slate-500 mt-1">待结算</div>
          </div>
          <div className="card bg-white text-center relative">
            <div className="text-2xl font-bold text-green-600">¥{Math.max(0, availableWithdraw)}</div>
            <div className="text-sm text-slate-500 mt-1">可提现</div>
            <Link href="/wallet" className="absolute top-2 right-2 text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />
              去提现
            </Link>
          </div>
        </div>

        {/* 快速提现提示 */}
        <div className="mb-6 bg-gradient-to-r from-brand-50 to-blue-50 rounded-xl border border-brand-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
              <Banknote className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <div className="font-medium text-slate-900">收益已到账钱包</div>
              <div className="text-sm text-slate-600">所有收益自动汇入钱包，可随时发起提现</div>
            </div>
          </div>
          <Link href="/wallet" className="btn-primary text-sm">
            立即提现
          </Link>
        </div>

        {/* 筛选 */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'all', label: '全部' },
            { key: 'task', label: '任务收益' },
            { key: 'referral', label: '邀请奖励' },
            { key: 'bonus', label: '平台奖励' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 列表 */}
        <div className="card bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">日期</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">来源</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">类型</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-900">金额</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">状态</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100">
                    <td className="py-3 px-4 text-slate-600">{r.date}</td>
                    <td className="py-3 px-4 text-slate-900">{r.source}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        r.type === 'task' ? 'bg-brand-50 text-brand-700' :
                        r.type === 'referral' ? 'bg-accent-50 text-accent-700' :
                        'bg-yellow-50 text-yellow-700'
                      }`}>
                        {r.type === 'task' ? '任务' : r.type === 'referral' ? '邀请' : '奖励'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-900">¥{r.amount}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        r.status === 'settled' ? 'bg-green-50 text-green-700' :
                        r.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                        'bg-slate-50 text-slate-600'
                      }`}>
                        {r.status === 'settled' ? '已结算' : r.status === 'pending' ? '待结算' : '已提现'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {records.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <div className="text-4xl mb-3">💰</div>
              <p>暂无收益记录，去任务大厅接单吧</p>
              <Link href="/tasks" className="btn-primary mt-4 inline-block">去任务大厅</Link>
            </div>
          )}
        </div>

        {/* 提现 */}
        <div className="mt-8 card bg-white">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Banknote className="w-5 h-5 text-brand-600" />
            提现管理
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            收益结算后自动汇入钱包，可随时发起提现。首次提现需完成实名认证 + 企业认证。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="flex-1 p-4 bg-slate-50 rounded-lg">
              <div className="font-medium text-slate-900 mb-1">提现门槛</div>
              <div className="text-slate-600">满 ¥100 可提现</div>
            </div>
            <div className="flex-1 p-4 bg-slate-50 rounded-lg">
              <div className="font-medium text-slate-900 mb-1">到账时间</div>
              <div className="text-slate-600">1-3 工作日</div>
            </div>
            <div className="flex-1 p-4 bg-slate-50 rounded-lg">
              <div className="font-medium text-slate-900 mb-1">开放时间</div>
              <div className="text-slate-600">工作日 9:00-18:00</div>
            </div>
            <div className="flex-1 p-4 bg-slate-50 rounded-lg">
              <div className="font-medium text-slate-900 mb-1">认证要求</div>
              <div className="text-slate-600">实名 + 企业认证</div>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <Link href="/wallet" className="btn-primary text-sm">
              去钱包提现
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
