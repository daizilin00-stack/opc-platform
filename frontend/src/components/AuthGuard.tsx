'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoggedIn } = useStore();

  useEffect(() => {
    if (!isLoggedIn && !user) {
      router.push('/login');
    }
  }, [isLoggedIn, user, router]);

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
