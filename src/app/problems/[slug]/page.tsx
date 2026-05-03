import React from 'react';
import IDE from '@/components/IDE';
import problems from '@/data/problems.json';
import { Problem } from '@/types';

interface PageProps {
  params: {
    slug: string;
  };
}

// Generate static params for all scraped problems
export async function generateStaticParams() {
  return (problems as any[]).map((p) => ({
    slug: p.titleSlug || p.slug,
  }));
}

export default function ProblemPage({ params }: PageProps) {
  const slug = params?.slug ?? '';
  const problem = (problems as any[]).find((p) => p?.titleSlug === slug || p?.slug === slug);
  console.log('[problems/[slug]] route', { slug, found: !!problem });

  if (!problem) {
    return (
      <main className="h-screen w-screen bg-[#050507] overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-200">Problem not found</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen w-screen bg-[#050507] overflow-hidden">
      <IDE initialProblem={problem as Problem} />
    </main>
  );
}
