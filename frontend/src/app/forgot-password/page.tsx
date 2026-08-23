'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await api.auth.forgotPassword(phone);
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || '提交失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">忘记密码</h1>
            <p className="text-slate-600">提交手机号后，客服将协助您完成身份验证并重置密码</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
              重置申请已提交。当前短信服务未接入，请拨打客服电话 <strong>18223589315</strong> 或联系客服邮箱 <strong>daizilin00@gmail.com</strong> 完成身份验证。
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">手机号</label>
                <input
                  type="tel"
                  required
                  maxLength={11}
                  placeholder="13800000000"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                />
              </div>

              <button
                type="submit"
                disabled={loading || phone.length !== 11}
                className="w-full btn-primary py-3 disabled:opacity-50"
              >
                {loading ? '提交中...' : '提交重置申请'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-600">
                想起密码了？{' '}
                <Link href="/login" className="text-brand-600 hover:text-brand-700 font-medium">返回登录</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
