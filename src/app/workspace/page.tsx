'use client';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const IDE = dynamic(() => import('@/components/IDE'), { 
  ssr: false,
  loading: () => (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#0B0D17] text-cyan-500 gap-6">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-cyan-500/10 rounded-2xl" />
        <div className="absolute inset-0 border-4 border-t-cyan-500 rounded-2xl animate-spin" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Initializing CodeVisualizer v4.0</p>
    </div>
  )
});

export default function WorkspacePage() {
  return (
    <main className="h-screen overflow-hidden bg-[#0B0D17]">
      <ErrorBoundary>
        <Suspense fallback={null}>
          <IDE />
        </Suspense>
      </ErrorBoundary>
    </main>
  );
}
