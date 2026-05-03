'use client';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Trophy, ChevronRight } from 'lucide-react';
import { Problem } from '@/types';
import problemsData from '@/data/problems.json';
import { cn } from '@/lib/utils';
import { useThemeClasses } from '@/context/ThemeContext';

export default function ProblemLibrary(): React.ReactNode {
  const themeClasses = useThemeClasses();
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 25;

  const problems = problemsData as Problem[];

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    problems.forEach(p => {
      const pTags = p.topicTags || p.tags || [];
      pTags.forEach((t: { name: string } | string) => tags.add(typeof t === 'string' ? t : t.name));
    });
    return Array.from(tags).sort();
  }, [problems]);

  const filteredProblems = useMemo(() => {
    const s = search.toLowerCase();
    return problems.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(s) || 
                            (p.id?.toString() || '').includes(s);
      const matchesDiff = difficulty === 'All' || p.difficulty === difficulty;
      const pTags = (p.topicTags || p.tags || []).map((t: { name: string } | string) => 
        (typeof t === 'string' ? t : t.name).toLowerCase()
      );
      const matchesTag = !selectedTag || pTags.includes(selectedTag.toLowerCase());
      return matchesSearch && matchesDiff && matchesTag;
    });
  }, [search, difficulty, selectedTag, problems]);

  const totalPages = Math.ceil(filteredProblems.length / ITEMS_PER_PAGE);
  const paginatedProblems = filteredProblems.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 pb-24">
      {/* Hero Section */}
      <div className="flex flex-col gap-4 mb-12">
        <h1 className={cn("text-4xl font-black tracking-tight flex items-center gap-4", themeClasses.text)}>
          Problem <span className={themeClasses.accent}>Library</span>
        </h1>
        <p className={cn("max-w-2xl leading-relaxed", themeClasses.textTertiary)}>
          Master Data Structures and Algorithms with our curated collection. 
          Use the visualizer to debug your solutions step-by-step.
        </p>
      </div>

      {/* Filters & Search */}
      <div className={cn("flex flex-col md:flex-row gap-6 mb-8 items-center justify-between sticky top-0 z-20 py-4 backdrop-blur-xl border-b", themeClasses.bg, themeClasses.border)}>
        <div className="relative w-full md:w-96 group">
          <Search className={cn("absolute left-4 top-1/2 -translate-y-1/2 transition-colors", themeClasses.textTertiary, "group-focus-within:text-cyan-500")} size={18} />
          <input 
            type="text" 
            placeholder="Search problems..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className={cn("w-full rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none transition-all placeholder:opacity-50", 
              themeClasses.codeBackground, themeClasses.border, themeClasses.text,
              "focus:ring focus:ring-opacity-20", themeClasses.accentBorder)}
          />
        </div>

        <div className={cn("flex gap-2 p-1 rounded-2xl border", themeClasses.codeBackground, themeClasses.border)}>
          {['All', 'Easy', 'Medium', 'Hard'].map((d) => (
            <button
              key={d}
              onClick={() => { setDifficulty(d as 'All' | 'Easy' | 'Medium' | 'Hard'); setPage(1); }}
              className={cn(
                "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                difficulty === d 
                  ? cn(themeClasses.accentBg, themeClasses.text, themeClasses.accentBorder)
                  : cn(themeClasses.textTertiary, "hover:text-white")
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
            !selectedTag ? cn(themeClasses.text, themeClasses.accentBg, themeClasses.accentBorder) : cn(themeClasses.border, themeClasses.textTertiary, "hover:border-gray-600")
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
              selectedTag === tag ? cn(themeClasses.accentBg, themeClasses.text, themeClasses.accentBorder) : cn(themeClasses.border, themeClasses.textTertiary, "hover:border-gray-600")
            )}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Problems List */}
      <div className="grid gap-3 mb-12">
        {problems.length === 0 ? (
          <div className={cn("flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-3xl", themeClasses.textTertiary, themeClasses.bgHover, themeClasses.border)}>
            <Trophy size={48} className="mb-4 opacity-10" />
            <p className="text-lg font-bold">No problems found</p>
            <p className={cn("mt-2 text-sm font-mono px-4 py-2 rounded-lg", themeClasses.accent, themeClasses.accentBg)}>
              Run <code className={cn("font-bold", themeClasses.accent)}>npm run scrape</code> to populate the library.
            </p>
          </div>
        ) : paginatedProblems.length > 0 ? paginatedProblems.map((problem) => (
          <Link 
            key={problem.titleSlug || problem.slug} 
            href={`/problem/${problem.titleSlug || problem.slug}`}
            className={cn("group flex items-center justify-between p-5 rounded-2xl transition-all duration-300", themeClasses.bgSurface, themeClasses.border, "hover:bg-gray-800/50 hover:border-cyan-500/30")}
          >
            <div className="flex items-center gap-6">
              <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center transition-all", themeClasses.codeBackground, themeClasses.border, themeClasses.textTertiary, "group-hover:text-cyan-500 group-hover:border-cyan-500/50")}>
                <Trophy size={18} />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className={cn("text-lg font-bold group-hover:text-white", themeClasses.textSecondary, "group-hover:text-white")}>{problem.title}</h3>
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em]",
                    problem.difficulty === 'Easy' ? "text-green-500" :
                    problem.difficulty === 'Medium' ? "text-cyan-500" :
                    "text-red-500"
                  )}>
                    {problem.difficulty}
                  </span>
                  <div className="flex gap-2">
                    {(problem.topicTags || problem.tags || []).slice(0, 3).map((tag: { name: string } | string) => (
                      <span key={typeof tag === 'string' ? tag : tag.name} className={cn("text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border", themeClasses.textTertiary, themeClasses.bgHover, themeClasses.border)}>
                        {typeof tag === 'string' ? tag : tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={cn("opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 font-black text-[10px] uppercase tracking-widest", themeClasses.accent)}>
                Solve Now <ChevronRight size={14} />
              </div>
            </div>
          </Link>
        )) : (
          <div className={cn("flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-3xl", themeClasses.textTertiary, themeClasses.bgHover, themeClasses.border)}>
            <Search size={48} className="mb-4 opacity-10" />
            <p className="text-lg font-bold">No problems match your criteria</p>
            <button onClick={() => { setSearch(''); setDifficulty('All'); setSelectedTag(null); setPage(1); }} className={cn("mt-4 hover:underline", themeClasses.accent)}>Clear all filters</button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className={cn("px-4 py-2 rounded-lg border text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all", themeClasses.border, themeClasses.text, themeClasses.bgSurface, "hover:bg-gray-800/50")}
          >
            Previous
          </button>
          
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={cn(
                    "w-10 h-10 rounded-lg text-sm font-medium transition-all",
                    page === pageNum 
                      ? cn(themeClasses.accentBg, themeClasses.text)
                      : cn(themeClasses.border, themeClasses.textTertiary, themeClasses.bgSurface, "hover:bg-gray-800/50")
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className={cn("px-4 py-2 rounded-lg border text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all", themeClasses.border, themeClasses.text, themeClasses.bgSurface, "hover:bg-gray-800/50")}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
