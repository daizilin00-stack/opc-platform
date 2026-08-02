"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CreditCard,
  Gift,
  History,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  X,
  Banknote,
} from "lucide-react";
import { API_BASE } from "@/lib/api";
import AuthGuard from "@/components/AuthGuard";

export default function WalletPage() {
  return (
    <AuthGuard>
      <WalletContent />
    </AuthGuard>
  );
}

function WalletContent() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [withdrawHistory, setWithdrawHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("bank_transfer");
  const [accountInfo, setAccountInfo] = useState({
    name: "",
    account: "",
    bank_name: "",
    branch: "",
  });
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");

  useEffect(() => {
    fetchWallet();
    fetchWithdrawHistory();
  }, []);

  const fetchWallet = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("请先登录");
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/wallet/info`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success) {
        setWallet(data.wallet);
        if (data.is_new) {
          await claimNewUserBonus();
        }
        fetchTransactions();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("加载失败");
    } finally {
      setLoading(false);
    }
  };

  const claimNewUserBonus = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/wallet/new-user-bonus`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        fetchWallet();
      }
    } catch (err) {
      console.error("领取奖励失败:", err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/wallet/transactions?limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error("加载交易记录失败:", err);
    }
  };

  const fetchWithdrawHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/withdrawal/withdraw/history?limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setWithdrawHistory(data.withdraws || []);
      }
    } catch (err) {
      console.error("加载提现记录失败:", err);
    }
  };

  const handleWithdraw = async () => {
    setWithdrawError("");
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < 100) {
      setWithdrawError("提现金额不能小于100元");
      return;
    }
    if (!accountInfo.name || !accountInfo.account) {
      setWithdrawError("请填写姓名和账号");
      return;
    }

    setWithdrawLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/withdrawal/withdraw`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount,
          method: withdrawMethod,
          account_info: accountInfo,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setShowWithdrawModal(false);
        setWithdrawAmount("");
        setAccountInfo({ name: "", account: "", bank_name: "", branch: "" });
        fetchWallet();
        fetchWithdrawHistory();
      } else {
        setWithdrawError(data.message || "提现失败");
      }
    } catch (err) {
      setWithdrawError("网络错误，请稍后重试");
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleCancelWithdraw = async (id: string) => {
    if (!confirm("确认取消该提现申请？金额将返还至钱包。")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/withdrawal/withdraw/${id}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        alert("提现已取消，金额已返还");
        fetchWallet();
        fetchWithdrawHistory();
      } else {
        alert(data.message || "取消失败");
      }
    } catch (err) {
      alert("网络错误");
    }
  };

  if (loading) return <div className="p-8 text-center text-white">加载中...</div>;
  if (error) return <div className="p-8 text-center text-red-400">{error}</div>;

  const balance = wallet?.balance || 0;
  const frozen = wallet?.frozen || 0;

  const transactionTypeLabels = {
    recharge: "充值",
    token_usage: "Token消费",
    task_escrow: "任务托管",
    task_release: "任务收入",
    task_refund: "任务退款",
    commission: "佣金",
    withdrawal: "提现",
    withdrawal_cancel: "提现取消",
    withdrawal_reject: "提现拒绝返还",
    bonus: "奖励",
    subscription: "订阅",
  };

  const withdrawStatusLabels = {
    pending: "待审核",
    approved: "已审批",
    rejected: "已拒绝",
    processing: "处理中",
    completed: "已完成",
    cancelled: "已取消",
  };

  const withdrawStatusColors = {
    pending: "text-yellow-400",
    approved: "text-blue-400",
    rejected: "text-red-400",
    processing: "text-purple-400",
    completed: "text-green-400",
    cancelled: "text-gray-400",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 text-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Wallet className="w-8 h-8 text-blue-400" />
            我的钱包
          </h1>
          <Link href="/workspace" className="text-gray-400 hover:text-white transition">
            ← 返回工作台
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 余额卡片 */}
          <div className="lg:col-span-2 bg-gradient-to-br from-blue-600/30 to-purple-600/30 rounded-2xl p-8 border border-blue-500/30">
            <div className="text-gray-400 mb-2">可用余额</div>
            <div className="text-5xl font-bold mb-4">¥{Number(balance).toFixed(2)}</div>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>冻结金额: ¥{Number(frozen).toFixed(2)}</span>
              <span>•</span>
              <span>总资产: ¥{Number(balance + frozen).toFixed(2)}</span>
            </div>
            <div className="flex gap-3 mt-6">
              <Link
                href="/recharge"
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition"
              >
                <ArrowUpRight className="w-4 h-4" />
                充值
              </Link>
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="bg-gray-700/50 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition"
              >
                <ArrowDownLeft className="w-4 h-4" />
                提现
              </button>
            </div>
          </div>

          {/* 快捷操作 */}
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-400" />
              快捷操作
            </h3>
            <div className="space-y-3">
              <Link
                href="/recharge"
                className="flex items-center justify-between p-3 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <ArrowUpRight className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <div className="font-medium">充值</div>
                    <div className="text-sm text-gray-400">微信/支付宝</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
              <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Gift className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="font-medium">新用户奖励</div>
                    <div className="text-sm text-gray-400">已领取 ¥15</div>
                  </div>
                </div>
                <span className="text-green-400 text-sm">已到账</span>
              </div>
            </div>
          </div>
        </div>

        {/* 提现记录 */}
        {withdrawHistory.length > 0 && (
          <div className="mt-8 bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Banknote className="w-5 h-5 text-blue-400" />
              最近提现
            </h2>
            <div className="space-y-3">
              {withdrawHistory.map((w) => (
                <div key={w.id} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                      <ArrowDownLeft className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <div className="font-medium">
                        提现 {w.method === "bank_transfer" ? "银行转账" : w.method === "alipay" ? "支付宝" : w.method === "wechat" ? "微信" : w.method}
                      </div>
                      <div className="text-sm text-gray-400">
                        {w.account_info?.name} | 尾号{w.account_info?.account?.slice(-4)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-red-400">-¥{Number(w.amount).toFixed(2)}</div>
                    <div className={`text-sm ${withdrawStatusColors[w.status] || "text-gray-400"}`}>
                      {withdrawStatusLabels[w.status] || w.status}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(w.created_at).toLocaleString("zh-CN")}
                    </div>
                    {w.status === "pending" && (
                      <button
                        onClick={() => handleCancelWithdraw(w.id)}
                        className="text-xs text-gray-400 hover:text-red-400 underline mt-1"
                      >
                        取消申请
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 交易记录 */}
        <div className="mt-8 bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" />
            交易记录
          </h2>

          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无交易记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        tx.direction === "in" ? "bg-green-500/20" : "bg-red-500/20"
                      }`}
                    >
                      {tx.direction === "in" ? (
                        <ArrowUpRight className="w-5 h-5 text-green-400" />
                      ) : (
                        <ArrowDownLeft className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">
                        {transactionTypeLabels[tx.transaction_type] || tx.transaction_type}
                      </div>
                      <div className="text-sm text-gray-400">{tx.description || ""}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-bold ${
                        tx.direction === "in" ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {tx.direction === "in" ? "+" : "-"}¥{Number(tx.amount).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-400">
                      {new Date(tx.created_at).toLocaleString("zh-CN")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 提现弹窗 */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">申请提现</h3>
              <button onClick={() => { setShowWithdrawModal(false); setWithdrawError(""); }} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* 余额提示 */}
              <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                <div className="text-sm text-gray-400">可用余额</div>
                <div className="text-2xl font-bold text-white">¥{Number(balance).toFixed(2)}</div>
                <div className="text-xs text-gray-500 mt-1">最低提现 ¥100</div>
              </div>

              {withdrawError && (
                <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {withdrawError}
                </div>
              )}

              {/* 金额输入 */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">提现金额</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">¥</span>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="请输入提现金额"
                    min="100"
                    className="w-full pl-8 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* 提现方式 */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">提现方式</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "bank_transfer", label: "银行卡" },
                    { key: "alipay", label: "支付宝" },
                    { key: "wechat", label: "微信" },
                  ].map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setWithdrawMethod(m.key)}
                      className={`py-2 rounded-lg text-sm font-medium transition ${
                        withdrawMethod === m.key
                          ? "bg-blue-500 text-white"
                          : "bg-gray-700/50 text-gray-400 hover:bg-gray-700"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 账户信息 */}
              <div className="space-y-3">
                <label className="block text-sm text-gray-400">
                  {withdrawMethod === "bank_transfer" ? "银行卡信息" : "账户信息"}
                </label>
                <input
                  type="text"
                  value={accountInfo.name}
                  onChange={(e) => setAccountInfo({ ...accountInfo, name: e.target.value })}
                  placeholder="收款人姓名"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
                <input
                  type="text"
                  value={accountInfo.account}
                  onChange={(e) => setAccountInfo({ ...accountInfo, account: e.target.value })}
                  placeholder={withdrawMethod === "bank_transfer" ? "银行卡号" : "账号"}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
                {withdrawMethod === "bank_transfer" && (
                  <>
                    <input
                      type="text"
                      value={accountInfo.bank_name}
                      onChange={(e) => setAccountInfo({ ...accountInfo, bank_name: e.target.value })}
                      placeholder="开户银行"
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                    <input
                      type="text"
                      value={accountInfo.branch}
                      onChange={(e) => setAccountInfo({ ...accountInfo, branch: e.target.value })}
                      placeholder="开户支行（选填）"
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </>
                )}
              </div>

              {/* 提示 */}
              <div className="bg-gray-700/30 rounded-lg p-3 text-xs text-gray-400 space-y-1">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                  <span>1-3 工作日到账</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                  <span>平台承担手续费，提现零费用</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                  <span>仅工作日 9:00-18:00 可申请</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                  <span>需完成实名认证 + 企业认证</span>
                </div>
              </div>

              <button
                onClick={handleWithdraw}
                disabled={withdrawLoading}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition"
              >
                {withdrawLoading ? "处理中..." : "确认提现"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
