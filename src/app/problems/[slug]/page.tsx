import React from 'react';
import { notFound } from 'next/navigation';
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
  const problem = (problems as any[]).find((p) => p.titleSlug === params.slug || p.slug === params.slug);

  if (!problem) {
    notFound();
  }

  return (
    <main className="h-screen w-screen bg-[#050507] overflow-hidden">
      <IDE initialProblem={problem} />
    </main>
  );
}
