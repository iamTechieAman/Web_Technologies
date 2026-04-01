'use client';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Trophy, ChevronRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Problem } from '@/types';
import problemsData from '@/data/problems.json';

export default function ProblemLibrary() {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 25;

  const problems = problemsData as any[];

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    problems.forEach(p => {
      const pTags = p.topicTags || p.tags || [];
      pTags.forEach((t: any) => tags.add(typeof t === 'string' ? t : t.name));
    });
    return Array.from(tags).sort();
  }, [problems]);

  const filteredProblems = useMemo(() => {
    return problems.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
      const matchesDiff = difficulty === 'All' || p.difficulty === difficulty;
      const pTags = (p.topicTags || p.tags || []).map((t: any) => typeof t === 'string' ? t : t.name);
      const matchesTag = !selectedTag || pTags.includes(selectedTag);
      return matchesSearch && matchesDiff && matchesTag;
    });
  }, [search, difficulty, selectedTag, problems]);

  const totalPages = Math.ceil(filteredProblems.length / ITEMS_PER_PAGE);
  const paginatedProblems = filteredProblems.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 pb-24">
      {/* Hero Section */}
      <div className="flex flex-col gap-4 mb-12">
        <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-4">
          Problem <span className="text-orange-500">Library</span>
        </h1>
        <p className="text-gray-500 max-w-2xl leading-relaxed">
          Master Data Structures and Algorithms with our curated collection. 
          Use the visualizer to debug your solutions step-by-step.
        </p>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-6 mb-8 items-center justify-between sticky top-0 z-20 py-4 bg-[#050507]/80 backdrop-blur-xl border-b border-gray-800/50">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-orange-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search problems..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-gray-900 border border-gray-800 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-gray-700"
          />
        </div>

        <div className="flex gap-2 p-1 bg-gray-900 border border-gray-800 rounded-2xl">
          {['All', 'Easy', 'Medium', 'Hard'].map((d) => (
            <button
              key={d}
              onClick={() => { setDifficulty(d as any); setPage(1); }}
              className={cn(
                "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                difficulty === d 
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" 
                  : "text-gray-500 hover:text-white"
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Tags Scroll */}
      <div className="flex gap-2 overflow-x-auto pb-6 custom-scrollbar no-scrollbar scroll-smooth mb-8">
        <button 
          onClick={() => { setSelectedTag(null); setPage(1); }}
          className={cn(
            "px-4 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all",
            !selectedTag ? "bg-white text-black border-white" : "border-gray-800 text-gray-500 hover:border-gray-600"
          )}
        >
          All Topics
        </button>
        {allTags.map(tag => (
          <button 
            key={tag}
            onClick={() => { setSelectedTag(tag); setPage(1); }}
            className={cn(
              "px-4 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all",
              selectedTag === tag ? "bg-orange-500 text-white border-orange-500" : "border-gray-800 text-gray-500 hover:border-gray-600"
            )}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Problems List */}
      <div className="grid gap-3 mb-12">
        {paginatedProblems.length > 0 ? paginatedProblems.map((problem) => (
          <Link 
            key={problem.titleSlug || problem.slug} 
            href={`/problems/${problem.titleSlug || problem.slug}`}
            className="group flex items-center justify-between p-5 bg-gray-900/30 border border-gray-800 rounded-2xl hover:bg-gray-800/50 hover:border-orange-500/30 transition-all duration-300"
          >
            <div className="flex items-center gap-6">
              <div className="w-10 h-10 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-500 group-hover:text-orange-500 group-hover:border-orange-500/50 transition-all">
                <Trophy size={18} />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-gray-200 group-hover:text-white">{problem.title}</h3>
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em]",
                    problem.difficulty === 'Easy' ? "text-green-500" :
                    problem.difficulty === 'Medium' ? "text-orange-500" :
                    "text-red-500"
                  )}>
                    {problem.difficulty}
                  </span>
                  <div className="flex gap-2">
                    {(problem.topicTags || problem.tags || []).slice(0, 3).map((tag: any) => (
                      <span key={typeof tag === 'string' ? tag : tag.name} className="text-[9px] text-gray-600 font-bold uppercase tracking-widest bg-gray-800/50 px-2 py-0.5 rounded border border-gray-800/50">
                        {typeof tag === 'string' ? tag : tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-orange-500 font-black text-[10px] uppercase tracking-widest">
                Solve Now <ChevronRight size={14} />
              </div>
            </div>
          </Link>
        )) : (
          <div className="flex flex-col items-center justify-center py-24 text-gray-700 bg-gray-900/20 border-2 border-dashed border-gray-800 rounded-3xl">
            <Search size={48} className="mb-4 opacity-10" />
            <p className="text-lg font-bold">No problems match your criteria</p>
            <button onClick={() => { setSearch(''); setDifficulty('All'); setSelectedTag(null); setPage(1); }} className="mt-4 text-orange-500 hover:underline">Clear all filters</button>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 rounded-xl bg-gray-900 border border-gray-800 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white disabled:opacity-20 transition-all"
          >
            Prev
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              let pageNum = page;
              if (page <= 3) pageNum = i + 1;
              else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = page - 2 + i;

              if (pageNum < 1 || pageNum > totalPages) return null;

              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={cn(
                    "w-10 h-10 rounded-xl text-[10px] font-black transition-all",
                    page === pageNum ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "bg-gray-900 text-gray-500 hover:text-white border border-gray-800"
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button 
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 rounded-xl bg-gray-900 border border-gray-800 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white disabled:opacity-20 transition-all"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
