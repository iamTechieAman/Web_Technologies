import React from 'react';
import ProblemLibrary from '@/components/ProblemLibrary';
import Header from '@/components/Header';

export default function ProblemsPage() {
  return (
    <div className="min-h-screen bg-[#050507]">
      <Header />
      <main>
        <ProblemLibrary />
      </main>
    </div>
  );
}
