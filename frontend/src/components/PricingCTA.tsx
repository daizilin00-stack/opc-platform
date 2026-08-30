'use client';

import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';

interface PricingCTAProps {
  productId: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary';
}

export default function PricingCTA({ productId, children, className = '', variant = 'primary' }: PricingCTAProps) {
  const router = useRouter();
  const { isLoggedIn, hydrated } = useStore();

  const handleClick = () => {
    const target = `/recharge?productId=${encodeURIComponent(productId)}`;
    if (!hydrated) {
      // During hydration uncertainty, send to login with redirect just in case
      router.push(`/login?redirect=${encodeURIComponent(target)}`);
      return;
    }
    if (isLoggedIn) {
      router.push(target);
    } else {
      router.push(`/login?redirect=${encodeURIComponent(target)}`);
    }
  };

  const baseStyles = variant === 'primary'
    ? 'bg-brand-600 text-white hover:bg-brand-700'
    : 'bg-slate-100 text-slate-700 hover:bg-slate-200';

  return (
    <button
      onClick={handleClick}
      className={`block w-full text-center py-3 rounded-lg font-medium transition-colors ${baseStyles} ${className}`}
    >
      {children}
    </button>
  );
}
