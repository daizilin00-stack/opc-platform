'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [form, setForm] = useState({ phone: '', code: '', newPassword: '' });
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mockCode, setMockCode] = useState('');

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendCode = async () => {
    if (!/^1[3-9]\d{9}$/.test(form.phone)) {
      setError('请输入正确的 11 位手机号');
      return;
    }
    setSending(true);
    setError('');
    try {
      const res = await api.auth.forgotPassword(form.phone);
      setSuccess(res.message || '验证码已发送');
      setCountdown(60);
      if (res.mock && res.code) {
        setMockCode(res.code);
      }
    } catch (err: any) {
      setError(err.message || '发送验证码失败');
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.auth.resetPassword(form.phone, form.code, form.newPassword);
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess(res.message || '密码重置成功');
        setTimeout(() => router.push('/login'), 1500);
      }
    } catch (err: any) {
      setError(err.message || '重置密码失败');
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
            <p className="text-slate-600">输入手机号获取验证码，自助重置密码</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {success}
            </div>
          )}

          {mockCode && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-4 text-sm">
              <strong>测试模式：</strong>验证码为 <code className="font-mono font-bold">{mockCode}</code>（短信服务未接入，仅供测试）
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">手机号</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    required
                    maxLength={11}
                    placeholder="13800000000"
                    className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                  />
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={sending || countdown > 0 || form.phone.length !== 11}
                    className="px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {countdown > 0 ? `${countdown}s` : sending ? '发送中...' : '获取验证码'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">验证码</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="6 位验证码"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">新密码</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="至少 8 位"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                  value={form.newPassword}
                  onChange={e => setForm({ ...form, newPassword: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={loading || form.phone.length !== 11 || form.code.length !== 6 || form.newPassword.length < 8}
                className="w-full btn-primary py-3 disabled:opacity-50"
              >
                {loading ? '重置中...' : '重置密码'}
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
