"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  QrCode,
  Check,
  AlertCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { API_BASE, payment } from "@/lib/api";
import AuthGuard from "@/components/AuthGuard";

export default function RechargePage() {
  return (
    <AuthGuard>
      <RechargeContent />
    </AuthGuard>
  );
}

interface PayConfig {
  amountOptions: number[];
  gateways: Array<{
    value: string;
    label: string;
    available: boolean;
    reason?: string;
  }>;
}

function RechargeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");
  const [product, setProduct] = useState<any>(null);
  const [amount, setAmount] = useState("100");
  const [method, setMethod] = useState("mock");
  const [config, setConfig] = useState<PayConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [payParams, setPayParams] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [payResult, setPayResult] = useState<any>(null);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`${API_BASE}/products/${productId}`);
      const data = await res.json();
      if (data.success) {
        setProduct(data.product);
        setAmount(data.product.price.toString());
      } else {
        setError(data.message || "商品不存在或已下架");
      }
    } catch (err: any) {
      setError(err.message || "加载商品信息失败");
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setConfigLoading(true);
      const data = await payment.getConfig();
      if (data.success) {
        setConfig(data.data);
        // 默认选择第一个可用的支付方式
        const available = data.data.gateways.find((g: any) => g.available);
        if (available) {
          setMethod(available.value);
        }
      }
    } catch (err: any) {
      setError(err.message || "加载支付配置失败");
    } finally {
      setConfigLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await payment.createOrder(parseFloat(amount), method, productId || undefined);
      setOrder(data.order);

      if (method === "mock") {
        // mock 模式直接调起模拟支付参数
        const payData = await payment.initiatePay(data.order.id);
        setPayParams(payData.payParams);
      } else {
        // 真实支付模式，获取支付参数（二维码/Form 等）
        const payData = await payment.initiatePay(data.order.id);
        setPayParams(payData.payParams);
      }
    } catch (err: any) {
      setError(err.message || "创建订单失败");
    } finally {
      setLoading(false);
    }
  };

  const handleMockPay = async () => {
    if (!order?.orderNo) return;
    try {
      setPaying(true);
      setError(null);
      const result = await payment.mockAutoPay(order.orderNo);
      setPayResult(result);
    } catch (err: any) {
      setError(err.message || "模拟支付失败");
    } finally {
      setPaying(false);
    }
  };

  const handleGoToResult = () => {
    if (order?.id) {
      router.push(`/payment/result?order_id=${order.id}`);
    }
  };

  if (configLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  // 支付调起成功后的界面
  if (order && payParams) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 text-white">
        <div className="max-w-lg mx-auto px-6 py-12">
          <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700/50 text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CreditCard className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">订单已创建</h2>
            <p className="text-gray-400 mb-6">
              订单号: {order.orderNo}
            </p>
            <div className="bg-gray-700/50 rounded-xl p-4 mb-6">
              <div className="text-sm text-gray-400 mb-1">充值金额</div>
              <div className="text-3xl font-bold">¥{order.amount}</div>
            </div>

            {method === "mock" ? (
              <>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-200 text-left">
                      <p className="font-medium mb-1">模拟支付环境</p>
                      <p>当前处于 mock 测试模式，点击下方按钮即可模拟支付成功。</p>
                    </div>
                  </div>
                </div>

                {payResult?.success ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-green-400" />
                    </div>
                    <p className="text-green-400 font-medium">模拟支付成功！</p>
                    <p className="text-sm text-gray-400">
                      新余额: ¥{Number(payResult.newBalance || 0).toFixed(2)}
                    </p>
                    <button
                      onClick={handleGoToResult}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition"
                    >
                      查看订单详情
                    </button>
                    <Link
                      href="/wallet"
                      className="block w-full bg-gray-700/50 hover:bg-gray-700 text-white py-3 rounded-xl font-medium transition"
                    >
                      返回钱包
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={handleMockPay}
                    disabled={paying}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2"
                  >
                    {paying ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        处理中...
                      </>
                    ) : (
                      "模拟支付成功"
                    )}
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
                  <div className="text-sm text-blue-200 mb-2">
                    {method === "wechat"
                      ? "请使用微信扫码支付"
                      : "请在新页面完成支付宝支付"}
                  </div>
                  <p className="text-xs text-gray-400">
                    {method === "wechat"
                      ? "请使用微信扫描下方二维码完成支付"
                      : "点击下方按钮跳转支付宝收银台"}
                  </p>
                </div>

                {method === "wechat" && payParams?.codeUrl ? (
                  <div className="mb-6">
                    <div className="bg-white p-3 rounded-xl mx-auto mb-4 w-fit">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payParams.codeUrl)}`}
                        alt="微信支付二维码"
                        className="w-48 h-48"
                      />
                    </div>
                    <p className="text-sm text-gray-400 mb-6">请使用微信扫一扫完成支付</p>
                  </div>
                ) : method === "alipay" && payParams?.formHtml ? (
                  <div className="mb-6">
                    <div
                      dangerouslySetInnerHTML={{ __html: payParams.formHtml }}
                      className="hidden"
                      id="alipay-form-container"
                    />
                    <button
                      onClick={() => {
                        const form = document.querySelector(
                          '#alipay-form-container form'
                        ) as HTMLFormElement | null;
                        form?.submit();
                      }}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-5 h-5" />
                      跳转支付宝支付
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-48 h-48 bg-white rounded-xl mx-auto mb-6 flex items-center justify-center">
                      <QrCode className="w-32 h-32 text-gray-800" />
                    </div>
                    <p className="text-sm text-gray-400 mb-6">等待支付参数...</p>
                  </>
                )}

                <button
                  onClick={handleGoToResult}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition"
                >
                  查询支付结果
                </button>
              </>
            )}

            {error && (
              <div className="mt-4 bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-200 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 text-white">
      <div className="max-w-lg mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/wallet" className="p-2 hover:bg-gray-700/50 rounded-lg transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">{product ? "确认订单" : "充值"}</h1>
        </div>

        {/* 商品信息 / 金额选择 */}
        <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 mb-6">
          {product ? (
            <>
              <div className="text-sm text-gray-400 mb-2">商品</div>
              <div className="text-xl font-bold mb-1">{product.name}</div>
              <p className="text-sm text-gray-400 mb-4">{product.description}</p>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-blue-400">¥{product.price}</span>
                {product.creditValue > product.price && (
                  <span className="text-sm text-green-400">到账 ¥{product.creditValue}</span>
                )}
              </div>
              {product.tokenQuota > 0 && (
                <div className="text-sm text-accent-400 mb-2">
                  含 Token 额度 {product.tokenQuota.toLocaleString()} tokens
                </div>
              )}
              {product.aiEmployees?.length > 0 && (
                <div className="text-sm text-gray-400">
                  包含 AI 员工：{product.aiEmployees.join(", ")}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="text-sm text-gray-400 mb-4">选择金额</div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {(config?.amountOptions || [50, 100, 200, 500, 1000, 2000]).map(
                  (amt) => (
                    <button
                      key={amt}
                      onClick={() => setAmount(amt.toString())}
                      className={`py-3 rounded-xl font-medium transition ${
                        amount === amt.toString()
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700/50 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      ¥{amt}
                    </button>
                  )
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-400">自定义</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  className="flex-1 bg-gray-700/50 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入金额"
                />
              </div>
            </>
          )}
        </div>

        {/* 支付方式 */}
        <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 mb-6">
          <div className="text-sm text-gray-400 mb-4">支付方式</div>
          <div className="space-y-3">
            {(config?.gateways || []).map((gateway) => {
              const isWechat = gateway.value === "wechat";
              const isAlipay = gateway.value === "alipay";
              const isMock = gateway.value === "mock";
              const selected = method === gateway.value;

              let iconColor = "bg-gray-500";
              if (isWechat) iconColor = "bg-green-500";
              if (isAlipay) iconColor = "bg-blue-500";
              if (isMock) iconColor = "bg-purple-500";

              return (
                <button
                  key={gateway.value}
                  onClick={() =>
                    gateway.available && setMethod(gateway.value)
                  }
                  disabled={!gateway.available}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl transition text-left ${
                    selected
                      ? "bg-blue-500/20 border border-blue-500/50"
                      : gateway.available
                      ? "bg-gray-700/50 border border-transparent hover:bg-gray-700"
                      : "bg-gray-800/50 border border-transparent opacity-50 cursor-not-allowed"
                  }`}
                >
                  <div
                    className={`w-10 h-10 ${iconColor} rounded-lg flex items-center justify-center`}
                  >
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-medium">{gateway.label}</div>
                    {gateway.reason && (
                      <div className="text-sm text-gray-400">{gateway.reason}</div>
                    )}
                  </div>
                  {selected && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6 text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* 充值按钮 */}
        <button
          onClick={handleCreateOrder}
          disabled={loading || !amount || parseFloat(amount) < 1}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              处理中...
            </>
          ) : (
            product ? `立即支付 ¥${amount}` : `充值 ¥${amount}`
          )}
        </button>

        <p className="text-center text-sm text-gray-400 mt-4">
          充值即代表同意《充值服务协议》
        </p>
      </div>
    </div>
  );
}
