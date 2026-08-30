'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoggedIn, hydrated } = useStore();
  const [mounted, setMounted] = useState(false);
  const [returnUrl, setReturnUrl] = useState('/workspace');

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      setReturnUrl(window.location.pathname + window.location.search);
    }
  }, []);

  useEffect(() => {
    if (!mounted || !hydrated) return;
    if (!isLoggedIn && !user) {
      router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
    }
  }, [mounted, hydrated, isLoggedIn, user, router, returnUrl]);

  if (!mounted || !hydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-500">正在恢复登录状态...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔐</div>
          <p className="text-gray-500">请先登录</p>
          <p className="text-sm text-gray-400 mt-2">正在跳转至登录页面...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
