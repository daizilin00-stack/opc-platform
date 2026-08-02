'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { NETWORK_SERVICES, IP_SERVICES } from '@/lib/pricing';
import { useStore } from '@/lib/store';

export default function OrderPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isLoggedIn = useStore((state) => state.isLoggedIn);
  const user = useStore((state) => state.user);

  const planId = searchParams.get('plan') || 'net-pro';
  const addIp = searchParams.get('ip') || 'none';
  const bandwidth = parseInt(searchParams.get('bandwidth') || '0');
  const months = parseInt(searchParams.get('months') || '1');

  const plan = NETWORK_SERVICES.find(p => p.id === planId);
  const ipService = addIp !== 'none' ? IP_SERVICES.find(ip => ip.id === addIp) : null;

  const [loading, setLoading] = useState(false);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-slate-600 mb-4">请先登录后再下单</p>
          <Link href="/login" className="btn-primary">去登录</Link>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-slate-600 mb-4">套餐不存在</p>
          <Link href="/network-services" className="btn-primary">返回服务列表</Link>
        </div>
      </div>
    );
  }

  const finalBandwidth = bandwidth > 0 ? bandwidth : plan.bandwidth;
  const PRICE_PER_M = 150;
  const basePrice = plan.monthlyFee;
  const ipPrice = ipService ? ipService.price : 0;
  const totalMonthly = basePrice + ipPrice;
  const totalPrice = totalMonthly * months;

  const handleSubmitOrder = async () => {
    setLoading(true);
    // 模拟提交订单（等后端订单API就绪后替换为真实请求）
    await new Promise(resolve => setTimeout(resolve, 1500));
    const mockOrderId = 'ORD' + Date.now().toString().slice(-8);
    // 跳转到合同签署页面
    router.push(`/contract?plan=${planId}&order=${mockOrderId}`);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
<div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-900 mb-8">确认您的订单</h1>

        {/* 用户信息 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h3 className="font-semibold text-slate-900 mb-4">账户信息</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">用户</p>
              <p className="font-medium">{user?.realName || user?.phone || '未实名'}</p>
            </div>
            <div>
              <p className="text-slate-500">手机号</p>
              <p className="font-medium">{user?.phone}</p>
            </div>
          </div>
        </div>

        {/* 服务配置 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h3 className="font-semibold text-slate-900 mb-4">服务配置</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <p className="font-medium text-slate-900">{plan.name}</p>
                <p className="text-sm text-slate-500">{plan.description}</p>
              </div>
              <span className="font-bold text-slate-900">¥{basePrice}/月</span>
            </div>

            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <p className="font-medium text-slate-900">带宽</p>
                <p className="text-sm text-slate-500">{finalBandwidth} Mbps</p>
              </div>
              <span className="text-sm text-slate-600">{finalBandwidth === plan.bandwidth ? '包含' : `¥${finalBandwidth * PRICE_PER_M}/月`}</span>
            </div>

            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <p className="font-medium text-slate-900">流量</p>
                <p className="text-sm text-slate-500">不限流量</p>
              </div>
              <span className="text-sm text-green-600">包含</span>
            </div>

            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <p className="font-medium text-slate-900">IP 类型</p>
                <p className="text-sm text-slate-500">{plan.ipType}</p>
              </div>
              <span className="text-sm text-slate-600">包含</span>
            </div>

            {ipService && ipService.price > 0 && (
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                  <p className="font-medium text-slate-900">额外 IP</p>
                  <p className="text-sm text-slate-500">{ipService.name}</p>
                </div>
                <span className="font-bold text-slate-900">+¥{ipService.price}/月</span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-slate-900">合约周期</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">{months} 个月</span>
              </div>
            </div>
          </div>
        </div>

        {/* 价格汇总 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h3 className="font-semibold text-slate-900 mb-4">价格汇总</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>月费</span>
              <span>¥{totalMonthly.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>合约时长</span>
              <span>{months} 个月</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between">
              <span className="font-bold text-slate-900">总计</span>
              <span className="text-2xl font-bold text-brand-600">¥{totalPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* 服务说明 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h3 className="font-semibold text-slate-900 mb-4">服务说明</h3>
          <ul className="text-sm text-slate-600 space-y-2">
            <li>• 提交订单后需签署《CSDP-WAN 服务协议》电子合同</li>
            <li>• 合同签署并支付完成后，服务将在 5 分钟内自动开通</li>
            <li>• 平台自动分配网络资源，无需手动配置</li>
            <li>• 支持月付，年付享 8 折优惠</li>
            <li>• 开通后可随时在工作台查看和管理服务</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSubmitOrder}
            disabled={loading}
            className="flex-1 btn-primary py-3 disabled:opacity-50"
          >
            {loading ? '提交中...' : '确认并提交订单'}
          </button>
          <Link href="/network-services" className="btn-secondary py-3 px-6">
            取消
          </Link>
        </div>
      </div>
    </div>
  );
}