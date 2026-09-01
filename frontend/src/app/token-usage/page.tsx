'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import AuthGuard from '@/components/AuthGuard';
import { MODEL_PRICING } from '@/lib/pricing';
import {
  ArrowLeft,
  PieChart,
  Clock,
  Zap,
  TrendingUp,
  Calendar,
  Loader2,
  AlertCircle,
  Layers,
  Coins,
  ChevronRight,
} from 'lucide-react';

interface UsageSummary {
  total_tokens: number;
  total_cost: number;
  total_calls: number;
}

interface UsageDetail {
  model_name: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  total_cost: number;
}

interface UsageItem {
  created_at: string;
  agent_type: string;
  model_name: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_cny: number;
}

export default function TokenUsagePage() {
  return (
    <AuthGuard>
      <TokenUsageContent />
    </AuthGuard>
  );
}

function TokenUsageContent() {
  const [period, setPeriod] = useState<'current_month' | 'last_month' | '7_days'>('current_month');
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [details, setDetails] = useState<UsageDetail[]>([]);
  const [items, setItems] = useState<UsageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsage();
  }, [period]);

  const fetchUsage = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usageData, detailData] = await Promise.all([
        api.billing.getTokenUsage(period),
        api.billing.getTokenDetails(50, 0),
      ]);

      setSummary(usageData.summary || { total_tokens: 0, total_cost: 0, total_calls: 0 });
      setDetails(usageData.details || []);
      setItems(detailData.items || []);
    } catch (err: any) {
      setError('加载用量数据失败：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const periodLabels = {
    current_month: '本月',
    last_month: '上月',
    '7_days': '近 7 天',
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getModelLabel = (modelName: string) => {
    // 尝试从 pricing 配置中找 label，否则返回原名
    return modelName;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/workspace" className="text-slate-500 hover:text-brand-600 transition">
              ← 返回工作台
            </Link>
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <PieChart className="w-6 h-6 text-brand-600" />
              <h1 className="text-2xl font-bold text-slate-900">Token 用量明细</h1>
            </div>
          </div>
          <Link
            href="/playground"
            className="btn-primary flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            去体验模型
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Period Selector */}
        <div className="flex items-center gap-2 mb-6">
          {Object.entries(periodLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPeriod(key as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                period === key
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card bg-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Layers className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-slate-500">总 Token</span>
            </div>
            <div className="text-3xl font-bold text-slate-900">
              {loading ? '...' : (summary?.total_tokens || 0).toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-1">prompt + completion</div>
          </div>

          <div className="card bg-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Coins className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm text-slate-500">总费用</span>
            </div>
            <div className="text-3xl font-bold text-brand-600">
              {loading ? '...' : `¥${Number(summary?.total_cost || 0).toFixed(4)}`}
            </div>
            <div className="text-xs text-slate-400 mt-1">按实际用量扣费</div>
          </div>

          <div className="card bg-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm text-slate-500">调用次数</span>
            </div>
            <div className="text-3xl font-bold text-slate-900">
              {loading ? '...' : (summary?.total_calls || 0).toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-1">{periodLabels[period]}累计</div>
          </div>
        </div>

        {/* Model Breakdown */}
        <div className="card bg-white mb-8">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-brand-600" />
            <h3 className="font-semibold text-slate-900">按模型分布</h3>
          </div>
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" />
            </div>
          ) : details.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>暂无{periodLabels[period]}用量数据</p>
              <Link href="/playground" className="text-brand-600 hover:text-brand-700 text-sm mt-2 inline-block">
                去模型体验中心 →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">模型</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">Prompt</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">Completion</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">总 Token</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">费用</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {details.map((d, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-slate-900">{getModelLabel(d.model_name)}</td>
                      <td className="py-3 px-4 text-right text-slate-600">{d.prompt_tokens.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-slate-600">{d.completion_tokens.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-medium text-slate-900">{d.total_tokens.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-medium text-brand-600">¥{Number(d.total_cost).toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Calls */}
        <div className="card bg-white">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-600" />
              <h3 className="font-semibold text-slate-900">最近调用记录</h3>
            </div>
            <span className="text-sm text-slate-500">最近 50 条</span>
          </div>
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>暂无调用记录</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">时间</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">模型</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">Prompt</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">Completion</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">总 Token</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">费用</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-600">{formatDate(item.created_at)}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-slate-100 rounded text-slate-700 text-xs">
                          {item.model_name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">{item.prompt_tokens.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-slate-600">{item.completion_tokens.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-medium text-slate-900">{item.total_tokens.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-medium text-brand-600">¥{Number(item.cost_cny).toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
