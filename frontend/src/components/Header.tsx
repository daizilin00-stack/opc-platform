'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useStore } from '@/lib/store';

export type HeaderVariant = 'landing' | 'dashboard' | 'admin' | 'minimal' | 'auto';

interface HeaderProps {
  variant?: HeaderVariant;
  title?: string;
  backHref?: string;
  backLabel?: string;
}

const Logo = () => (
  <Link href="/" className="flex items-center gap-3">
    <Image src="/logo-csdp.png" alt="CSDP" width={100} height={36} className="h-9 w-auto" />
    <div className="flex items-center gap-2">
      <span className="text-lg font-bold text-slate-900">CSDP</span>
      <span className="text-slate-300">|</span>
      <span className="text-base font-semibold text-brand-600">AgentWork</span>
    </div>
  </Link>
);

export default function Header({ variant = 'auto', title, backHref, backLabel }: HeaderProps) {
  const pathname = usePathname();
  const isLoggedIn = useStore((state) => state.isLoggedIn);
  const user = useStore((state) => state.user);

  const resolvedVariant =
    variant === 'auto'
      ? pathname?.startsWith('/admin')
        ? 'admin'
        : pathname === '/contract' || pathname === '/order' || pathname === '/recharge'
        ? 'minimal'
        : pathname === '/' || pathname === '/pricing' || pathname === '/network-services' || pathname === '/learn' || pathname === '/courses' || pathname === '/support' || pathname === '/login' || pathname === '/register' || pathname === '/ai-employees' || pathname === '/deploy'
        ? 'landing'
        : 'dashboard'
      : variant;

  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
    const active = pathname === href || pathname?.startsWith(`${href}/`);
    return (
      <Link
        href={href}
        className={`font-medium transition-colors ${
          active ? 'text-brand-600' : 'text-slate-600 hover:text-brand-600'
        }`}
      >
        {children}
      </Link>
    );
  };

  if (resolvedVariant === 'minimal') {
    return (
      <nav className="border-b border-slate-200 bg-white/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo />
            {title && (
              <>
                <span className="text-slate-300">|</span>
                <span className="text-base font-semibold text-slate-700">{title}</span>
              </>
            )}
          </div>
          {backHref && (
            <Link href={backHref} className="text-slate-600 hover:text-brand-600 font-medium">
              ← {backLabel || '返回'}
            </Link>
          )}
        </div>
      </nav>
    );
  }

  if (resolvedVariant === 'admin') {
    return (
      <nav className="border-b border-slate-200 bg-white/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="text-slate-300">|</span>
            <span className="text-base font-semibold text-slate-700">管理后台</span>
          </div>
          <div className="flex items-center gap-4">
            <NavLink href="/admin/customers">客户管理</NavLink>
            <NavLink href="/admin/withdrawals">提现审核</NavLink>
            <NavLink href="/workspace">返回工作台</NavLink>
            <div className="text-sm text-slate-500 border-l border-slate-200 pl-4">
              {user?.phone || '管理员'}
            </div>
          </div>
        </div>
      </nav>
    );
  }

  if (resolvedVariant === 'dashboard') {
    return (
      <nav className="border-b border-slate-200 bg-white/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Logo />
            <div className="hidden md:flex items-center gap-5 text-sm">
              <NavLink href="/workspace">工作台</NavLink>
              <NavLink href="/agents">数字员工</NavLink>
              <NavLink href="/tasks">任务大厅</NavLink>
              <NavLink href="/token-center">Token 中心</NavLink>
              <NavLink href="/wallet">钱包</NavLink>
              <NavLink href="/community">社区</NavLink>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/workspace" className="btn-primary text-sm">
              进入工作台
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  // landing
  return (
    <nav className="border-b border-slate-200 bg-white/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo />
        </div>
        <div className="flex items-center gap-5 text-sm">
          <NavLink href="/courses">培训学院</NavLink>
          <NavLink href="/tasks">任务大厅</NavLink>
          <NavLink href="/community">社区</NavLink>
          <NavLink href="/pricing">定价</NavLink>
          <NavLink href="/support">帮助</NavLink>
          {isLoggedIn ? (
            <Link href="/workspace" className="btn-primary text-sm">
              工作台
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-slate-600 hover:text-brand-600 font-medium transition-colors">
                登录
              </Link>
              <Link href="/register" className="btn-primary text-sm">
                立即入驻
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
