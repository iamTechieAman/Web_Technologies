'use client';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

const IDE = dynamic(() => import('@/components/IDE'), { 
  ssr: false,
  loading: () => (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#0a0a0c] text-orange-500 gap-4">
      <Loader2 className="animate-spin" size={48} />
      <p className="text-xs font-black uppercase tracking-widest animate-pulse">Initializing Advanced Workspace...</p>
    </div>
  )
});

export default function WorkspacePage() {
  return (
    <main className="h-screen overflow-hidden">
      <Suspense fallback={null}>
        <IDE />
      </Suspense>
    </main>
  );
}
