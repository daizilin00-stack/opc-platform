"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { API_BASE } from "@/lib/api";

interface Withdrawal {
  id: string;
  user_id: string;
  user_phone: string;
  user_real_name: string;
  amount: number;
  net_amount: number;
  method: string;
  account_info: any;
  status: string;
  risk_level: string;
  risk_flags: string[];
  user_note: string;
  review_note: string;
  created_at: string;
  reviewed_at: string;
  paid_at: string;
  credit_score: number;
  id_card_verified: boolean;
  company_verified: boolean;
}

interface DashboardStats {
  today: { count: number; amount: number };
  pending: { count: number; amount: number };
  month: {
    total_count: number;
    completed_amount: number;
    pending_amount: number;
    rejected_amount: number;
  };
  trend: any[];
  risk_distribution: any[];
}

export default function AdminWithdrawalsPage() {
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected" | "completed" | "all">("pending");
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showPaymentRef, setShowPaymentRef] = useState(false);
  const [paymentRef, setPaymentRef] = useState("");
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

  useEffect(() => {
    fetchWithdrawals();
    fetchDashboardStats();
  }, [activeTab]);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const status = activeTab === "all" ? "" : activeTab;
      const res = await fetch(
        `${API_BASE}/admin/withdrawals?status=${status}&limit=50`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setWithdrawals(data.withdrawals || []);
      } else {
        setError(data.message || "加载失败");
      }
    } catch (err) {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/withdrawals/stats/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setDashboardStats(data.dashboard);
      }
    } catch (err) {
      console.error("加载统计失败:", err);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/withdrawals/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ note: "审批通过" }),
      });
      const data = await res.json();
      if (data.success) {
        alert("审批通过！");
        fetchWithdrawals();
        fetchDashboardStats();
      } else {
        alert(data.message || "操作失败");
      }
    } catch (err) {
      alert("网络错误");
    }
  };

  const handleReject = async () => {
    if (!selectedWithdrawal || !rejectReason) return;
    try {
      const res = await fetch(`${API_BASE}/admin/withdrawals/${selectedWithdrawal.id}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (data.success) {
        alert("已拒绝，金额已返还用户钱包");
        setShowRejectModal(false);
        setRejectReason("");
        fetchWithdrawals();
        fetchDashboardStats();
      } else {
        alert(data.message || "操作失败");
      }
    } catch (err) {
      alert("网络错误");
    }
  };

  const handleComplete = async (id: string) => {
    if (!paymentRef) {
      alert("请输入银行流水号/支付单号");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/admin/withdrawals/${id}/complete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ payment_ref: paymentRef }),
      });
      const data = await res.json();
      if (data.success) {
        alert("已标记打款完成！");
        setShowPaymentRef(false);
        setPaymentRef("");
        fetchWithdrawals();
        fetchDashboardStats();
      } else {
        alert(data.message || "操作失败");
      }
    } catch (err) {
      alert("网络错误");
    }
  };

  const handleBatchApprove = async () => {
    if (selectedItems.size === 0) {
      alert("请先选择要审批的提现");
      return;
    }
    if (!confirm(`确认批量审批 ${selectedItems.size} 条提现申请？`)) return;
    try {
      const res = await fetch(`${API_BASE}/admin/withdrawals/batch-approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedItems) }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`批量审批完成：成功 ${data.approved_count} 条，失败 ${data.failed_count} 条`);
        setSelectedItems(new Set());
        fetchWithdrawals();
        fetchDashboardStats();
      } else {
        alert(data.message || "操作失败");
      }
    } catch (err) {
      alert("网络错误");
    }
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedItems(newSet);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700",
      approved: "bg-blue-100 text-blue-700",
      rejected: "bg-red-100 text-red-700",
      processing: "bg-purple-100 text-purple-700",
      completed: "bg-green-100 text-green-700",
      cancelled: "bg-gray-100 text-gray-600",
    };
    const labels: Record<string, string> = {
      pending: "待审核",
      approved: "已审批",
      rejected: "已拒绝",
      processing: "处理中",
      completed: "已完成",
      cancelled: "已取消",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getRiskBadge = (level: string) => {
    const styles: Record<string, string> = {
      low: "bg-green-100 text-green-700",
      medium: "bg-yellow-100 text-yellow-700",
      high: "bg-orange-100 text-orange-700",
      critical: "bg-red-100 text-red-700",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[level] || styles.low}`}>
        {level === "low" ? "低风险" : level === "medium" ? "中风险" : level === "high" ? "高风险" : "极高风险"}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 统计卡片 */}
        {dashboardStats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <p className="text-sm text-slate-500 mb-1">今日提现</p>
              <p className="text-2xl font-bold text-slate-900">{dashboardStats.today.count} 笔</p>
              <p className="text-sm text-slate-600">¥{Number(dashboardStats.today.amount).toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <p className="text-sm text-slate-500 mb-1">待审核</p>
              <p className="text-2xl font-bold text-yellow-600">{dashboardStats.pending.count} 笔</p>
              <p className="text-sm text-slate-600">¥{Number(dashboardStats.pending.amount).toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <p className="text-sm text-slate-500 mb-1">本月已完成</p>
              <p className="text-2xl font-bold text-green-600">¥{Number(dashboardStats.month?.completed_amount || 0).toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <p className="text-sm text-slate-500 mb-1">本月待处理</p>
              <p className="text-2xl font-bold text-blue-600">¥{Number(dashboardStats.month?.pending_amount || 0).toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <p className="text-sm text-slate-500 mb-1">本月已拒绝</p>
              <p className="text-2xl font-bold text-red-600">¥{Number(dashboardStats.month?.rejected_amount || 0).toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* 标签切换 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            {[
              { key: "pending", label: `待审核 ${dashboardStats?.pending.count ? `(${dashboardStats.pending.count})` : ""}` },
              { key: "approved", label: "已审批" },
              { key: "processing", label: "处理中" },
              { key: "completed", label: "已完成" },
              { key: "rejected", label: "已拒绝" },
              { key: "all", label: "全部" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === key
                    ? "bg-brand-600 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {activeTab === "pending" && selectedItems.size > 0 && (
            <button
              onClick={handleBatchApprove}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              批量审批 ({selectedItems.size})
            </button>
          )}
        </div>

        {/* 提现列表 */}
        {loading ? (
          <div className="text-center py-12 text-slate-500">加载中...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : withdrawals.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <p className="text-slate-400">暂无提现记录</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {activeTab === "pending" && <th className="w-10 px-4 py-3"></th>}
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">用户信息</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">金额</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">提现方式</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">风险等级</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">状态</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">申请时间</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50">
                    {activeTab === "pending" && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(w.id)}
                          onChange={() => toggleSelection(w.id)}
                          className="rounded border-slate-300"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{w.user_real_name || "未实名"}</div>
                      <div className="text-slate-500 text-xs">{w.user_phone}</div>
                      <div className="text-xs text-slate-400">
                        信用分: {w.credit_score} | {w.id_card_verified ? "✅实名" : "❌未实名"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">¥{Number(w.amount).toFixed(2)}</div>
                      <div className="text-xs text-slate-500">实到: ¥{Number(w.net_amount).toFixed(2)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-700">
                        {w.method === "bank_transfer" ? "银行转账" : w.method === "alipay" ? "支付宝" : w.method === "wechat" ? "微信" : w.method}
                      </div>
                      {w.account_info && (
                        <div className="text-xs text-slate-500">
                          {w.account_info.account ? `尾号${w.account_info.account.slice(-4)}` : ""}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {getRiskBadge(w.risk_level)}
                      {w.risk_flags && w.risk_flags.length > 0 && (
                        <div className="text-xs text-red-500 mt-1 max-w-[200px] truncate" title={w.risk_flags.join(", ")}>
                          {w.risk_flags[0]}{w.risk_flags.length > 1 ? ` (+${w.risk_flags.length - 1})` : ""}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(w.status)}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {new Date(w.created_at).toLocaleString("zh-CN")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedWithdrawal(w);
                            setShowDetailModal(true);
                          }}
                          className="text-brand-600 hover:text-brand-700 text-sm font-medium"
                        >
                          详情
                        </button>
                        {w.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(w.id)}
                              className="text-green-600 hover:text-green-700 text-sm font-medium"
                            >
                              通过
                            </button>
                            <button
                              onClick={() => {
                                setSelectedWithdrawal(w);
                                setShowRejectModal(true);
                              }}
                              className="text-red-600 hover:text-red-700 text-sm font-medium"
                            >
                              拒绝
                            </button>
                          </>
                        )}
                        {w.status === "approved" && (
                          <button
                            onClick={() => {
                              setSelectedWithdrawal(w);
                              setShowPaymentRef(true);
                            }}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            标记打款
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 详情弹窗 */}
      {showDetailModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">提现详情</h3>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">用户</p>
                  <p className="font-medium">{selectedWithdrawal.user_real_name || "未实名"}</p>
                  <p className="text-xs text-slate-500">{selectedWithdrawal.user_phone}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">状态</p>
                  <p>{getStatusBadge(selectedWithdrawal.status)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">提现金额</p>
                  <p className="font-bold text-lg">¥{Number(selectedWithdrawal.amount).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">风险等级</p>
                  <p>{getRiskBadge(selectedWithdrawal.risk_level)}</p>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <p className="text-sm text-slate-500 mb-2">账户信息</p>
                <div className="bg-slate-50 rounded-lg p-3 text-sm">
                  {selectedWithdrawal.account_info && (
                    <>
                      <p>方式: {selectedWithdrawal.method}</p>
                      <p>姓名: {selectedWithdrawal.account_info.name}</p>
                      <p>账号: {selectedWithdrawal.account_info.account}</p>
                      {selectedWithdrawal.account_info.bank_name && <p>银行: {selectedWithdrawal.account_info.bank_name}</p>}
                      {selectedWithdrawal.account_info.branch && <p>支行: {selectedWithdrawal.account_info.branch}</p>}
                    </>
                  )}
                </div>
              </div>

              {selectedWithdrawal.risk_flags && selectedWithdrawal.risk_flags.length > 0 && (
                <div className="border-t border-slate-200 pt-4">
                  <p className="text-sm text-slate-500 mb-2">风控标记</p>
                  <div className="space-y-1">
                    {selectedWithdrawal.risk_flags.map((flag, i) => (
                      <p key={i} className="text-sm text-red-600">⚠️ {flag}</p>
                    ))}
                  </div>
                </div>
              )}

              {selectedWithdrawal.user_note && (
                <div className="border-t border-slate-200 pt-4">
                  <p className="text-sm text-slate-500 mb-2">用户备注</p>
                  <p className="text-sm text-slate-700">{selectedWithdrawal.user_note}</p>
                </div>
              )}

              {selectedWithdrawal.review_note && (
                <div className="border-t border-slate-200 pt-4">
                  <p className="text-sm text-slate-500 mb-2">审核备注</p>
                  <p className="text-sm text-slate-700">{selectedWithdrawal.review_note}</p>
                </div>
              )}

              <div className="border-t border-slate-200 pt-4">
                <p className="text-sm text-slate-500 mb-2">时间线</p>
                <div className="text-xs space-y-1 text-slate-600">
                  <p>申请: {new Date(selectedWithdrawal.created_at).toLocaleString("zh-CN")}</p>
                  {selectedWithdrawal.reviewed_at && (
                    <p>审核: {new Date(selectedWithdrawal.reviewed_at).toLocaleString("zh-CN")}</p>
                  )}
                  {selectedWithdrawal.paid_at && (
                    <p>打款: {new Date(selectedWithdrawal.paid_at).toLocaleString("zh-CN")}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 拒绝弹窗 */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">拒绝提现申请</h3>
            <p className="text-sm text-slate-600 mb-4">
              用户: {selectedWithdrawal?.user_real_name} | 金额: ¥{selectedWithdrawal?.amount}
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="请输入拒绝原因（用户将看到此原因）..."
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none h-24 text-sm"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-medium"
              >
                取消
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
              >
                确认拒绝
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 标记打款弹窗 */}
      {showPaymentRef && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">标记打款完成</h3>
            <p className="text-sm text-slate-600 mb-4">
              用户: {selectedWithdrawal?.user_real_name} | 金额: ¥{selectedWithdrawal?.amount}
            </p>
            <input
              type="text"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              placeholder="请输入银行流水号/支付单号"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPaymentRef(false);
                  setPaymentRef("");
                }}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-medium"
              >
                取消
              </button>
              <button
                onClick={() => selectedWithdrawal && handleComplete(selectedWithdrawal.id)}
                disabled={!paymentRef}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
              >
                确认完成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
