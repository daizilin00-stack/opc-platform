'use client';

import { Suspense } from 'react';
import ContractPageContent from './ContractPageContent';

export default function ContractPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-slate-600">加载中...</p></div>}>
      <ContractPageContent />
    </Suspense>
  );
}