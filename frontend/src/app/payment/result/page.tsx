"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { payment } from "@/lib/api";
import AuthGuard from "@/components/AuthGuard";

export default function PaymentResultPage() {
  return (
    <AuthGuard>
      <Suspense
        fallback={
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 text-white flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        }
      >
        <PaymentResultContent />
      </Suspense>
    </AuthGuard>
  );
}

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    } else {
      setLoading(false);
      setError("缺少订单号");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // 订单状态为 pending 时自动轮询
  useEffect(() => {
    if (!order || order.status !== "pending") return;

    const interval = setInterval(() => {
      fetchOrder(true);
    }, 3000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.status]);

  const fetchOrder = async (isPolling = false) => {
    if (!orderId) return;
    try {
      if (!isPolling) setLoading(true);
      else setPolling(true);

      const data = await payment.getOrder(orderId);
      if (data.success) {
        setOrder(data.order);
        setError(null);
      } else {
        setError(data.message || "查询订单失败");
      }
    } catch (err: any) {
      setError(err.message || "查询订单失败");
    } finally {
      setLoading(false);
      setPolling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  const statusConfig: Record<
    string,
    { icon: React.ReactNode; title: string; color: string; desc: string }
  > = {
    completed: {
      icon: <CheckCircle className="w-16 h-16 text-green-400" />,
      title: "支付成功",
      color: "text-green-400",
      desc: "充值已到账，您可以在钱包中查看余额。",
    },
    paid: {
      icon: <CheckCircle className="w-16 h-16 text-green-400" />,
      title: "支付成功",
      color: "text-green-400",
      desc: "充值已到账，您可以在钱包中查看余额。",
    },
    pending: {
      icon: <Loader2 className="w-16 h-16 text-yellow-400 animate-spin" />,
      title: "等待支付",
      color: "text-yellow-400",
      desc: "订单尚未完成支付，请继续完成付款。",
    },
    failed: {
      icon: <XCircle className="w-16 h-16 text-red-400" />,
      title: "支付失败",
      color: "text-red-400",
      desc: "订单支付失败，请重新发起充值。",
    },
    cancelled: {
      icon: <XCircle className="w-16 h-16 text-gray-400" />,
      title: "订单已取消",
      color: "text-gray-400",
      desc: "订单已取消，如有疑问请联系客服。",
    },
  };

  const current = order ? statusConfig[order.status] || statusConfig.pending : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 text-white">
      <div className="max-w-lg mx-auto px-6 py-12">
        <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700/50 text-center">
          {error ? (
            <>
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-red-400">查询失败</h2>
              <p className="text-gray-400 mb-6">{error}</p>
              <button
                onClick={() => fetchOrder()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                重试
              </button>
            </>
          ) : current ? (
            <>
              <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                {current.icon}
              </div>
              <h2 className={`text-2xl font-bold mb-2 ${current.color}`}>
                {current.title}
              </h2>
              <p className="text-gray-400 mb-6">{current.desc}</p>

              {order && (
                <div className="bg-gray-700/50 rounded-xl p-4 mb-6 text-left">
                  <div className="flex justify-between py-2 border-b border-gray-600/50">
                    <span className="text-gray-400">订单号</span>
                    <span className="font-mono">{order.orderNo}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-600/50">
                    <span className="text-gray-400">充值金额</span>
                    <span className="font-bold">¥{Number(order.amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-600/50">
                    <span className="text-gray-400">支付方式</span>
                    <span className="capitalize">{order.gateway}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-400">订单状态</span>
                    <span className={`font-medium ${current.color}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-400">创建时间</span>
                    <span className="text-sm">
                      {new Date(order.createdAt).toLocaleString("zh-CN")}
                    </span>
                  </div>
                  {order.completedAt && (
                    <div className="flex justify-between py-2">
                      <span className="text-gray-400">完成时间</span>
                      <span className="text-sm">
                        {new Date(order.completedAt).toLocaleString("zh-CN")}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {order?.status === "pending" && (
                <div className="mb-6">
                  <button
                    onClick={() => fetchOrder()}
                    disabled={polling}
                    className="w-full bg-yellow-600/80 hover:bg-yellow-600 disabled:bg-gray-700 text-white py-3 rounded-xl font-medium transition flex items-center justify-center gap-2"
                  >
                    {polling ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        刷新中...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        刷新状态
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    页面每 3 秒自动刷新一次
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/wallet"
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition"
                >
                  <Wallet className="w-4 h-4" />
                  查看钱包
                </Link>
                <Link
                  href="/recharge"
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition"
                >
                  继续充值
                </Link>
              </div>

              <Link
                href="/workspace"
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white mt-6 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                返回工作台
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
