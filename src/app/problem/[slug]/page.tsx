'use client';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { getProblemBySlug } from '@/lib/problems';
import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';

const IDE = dynamic(() => import('@/components/IDE'), { 
  ssr: false,
  loading: () => (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#0a0a0c] text-orange-500 gap-4">
      <Loader2 className="animate-spin" size={48} />
      <p className="text-xs font-black uppercase tracking-widest animate-pulse">Loading Problem Environment...</p>
    </div>
  )
});

export default function ProblemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const problem = useMemo(() => getProblemBySlug(slug), [slug]);

  if (!problem) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a0c]">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-200">Problem Not Found</h1>
          <button onClick={() => router.push('/problems')} className="text-orange-500 font-semibold hover:underline">
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="h-screen overflow-hidden">
      <IDE initialProblem={problem} />
    </main>
  );
}
