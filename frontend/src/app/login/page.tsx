'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useStore } from '@/lib/store';

export default function LoginPage() {
  const [form, setForm] = useState({ phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const login = useStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.auth.login(form.phone, form.password);
      if (res?.token) {
        const user = res.user;
        login({
          id: user.id,
          phone: user.phone,
          realName: user.realName || '',
          skills: user.skills || [],
          creditScore: user.creditScore || 100,
          level: user.level || 1,
          accountType: user.accountType || 'individual',
          token: res.token,
        });
        router.push('/workspace');
      } else {
        setError(res?.error || '登录失败');
      }
    } catch (err: any) {
      setError(err.message || '登录失败，请检查账号密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* 欢迎文案 */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">欢迎回到 AgentWork</h1>
            <p className="text-slate-600">登录您的账户，管理 AI 数字员工</p>
          </div>

          {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">手机号</label>
                <input
                  type="tel"
                  required
                  placeholder="13800000000"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">密码</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                  <span className="text-slate-600">记住我</span>
                </label>
                <Link href="#" className="text-brand-600 hover:text-brand-700 font-medium">忘记密码？</Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 disabled:opacity-50"
              >
                {loading ? '登录中...' : '登录'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-600">
                还没有账户？{' '}
                <Link href="/register" className="text-brand-600 hover:text-brand-700 font-medium">免费注册</Link>
              </p>
            </div>
          </div>

          {/* 入驻流程提示 */}
          <div className="mt-6 bg-accent-50 border border-accent-200 rounded-xl p-4">
            <p className="text-sm text-slate-700">
              <strong className="text-accent-700">新用户入驻流程：</strong>
              个人：注册 → 实名认证 → 使用基础 AI 服务；
              企业：注册 → 实名认证 → 营业执照 → 签署电子合同 → 开通全部服务
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-500 space-y-1">
          <p>© 2026 中新数据港（重庆）科技有限公司 · CSDP AgentWork</p>
          <p>
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-600 transition-colors"
            >
              渝ICP备2026018045号
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
