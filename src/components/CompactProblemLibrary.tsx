'use client';
import React, { useState, useMemo } from 'react';
import { Search, Trophy, ChevronRight, BookOpen, RefreshCw, Globe } from 'lucide-react';
import { Problem } from '@/types';
import problemsData from '@/data/problems.json';
import { cn } from '@/lib/utils';
import { useThemeClasses } from '@/context/ThemeContext';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

export default function CompactProblemLibrary({ onSelect }: { onSelect?: (p: Problem) => void }) {
  const themeClasses = useThemeClasses();
  const [search, setSearch] = useState('');
  const [externalProblems, setExternalProblems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const localProblems = (problemsData as Problem[]).slice(0, 50);
  const allProblems = useMemo(() => [...localProblems, ...externalProblems], [localProblems, externalProblems]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return allProblems.filter((p: any) => 
      (p.title || '').toLowerCase().includes(s) || 
      (p.id?.toString() || '').includes(s)
    );
  }, [search, allProblems]);

  const handleFetchExternal = async () => {
    setIsLoading(true);
    try {
      const fetched = await apiClient.fetchCodeforcesProblems(15);
      setExternalProblems(fetched);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 px-1">
        <div className="relative group">
          <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 transition-colors", themeClasses.textTertiary, "group-focus-within:text-cyan-500")} size={12} />
          <input 
            type="text" 
            placeholder="Filter problems..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className={cn("w-full rounded-lg py-1.5 pl-8 pr-2 text-[11px] focus:outline-none transition-all placeholder:opacity-30", 
              themeClasses.codeBackground, themeClasses.border, themeClasses.text)}
          />
        </div>

        <button 
          onClick={handleFetchExternal}
          disabled={isLoading}
          className={cn(
            "w-full py-2 rounded-lg border text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
            themeClasses.border, "text-cyan-500/60 hover:text-cyan-400 hover:border-cyan-500/30"
          )}
        >
          {isLoading ? <RefreshCw size={10} className="animate-spin" /> : <Globe size={10} />}
          {isLoading ? "Fetching..." : "Fetch Codeforces Challenges"}
        </button>
      </div>

      <div className="flex flex-col gap-1 mt-2">
        {filtered.length > 0 ? filtered.map((problem: any, i: number) => {
          const isExternal = !!problem.url;
          return (
            <div 
              key={`${problem.slug}-${i}`} 
              onClick={() => {
                if (isExternal) {
                  window.open(problem.url, '_blank');
                } else if (onSelect) {
                  onSelect(problem);
                }
              }}
              className={cn("group flex items-center justify-between p-2 rounded-lg transition-all cursor-pointer", themeClasses.bgHover)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Trophy size={12} className={cn(
                  problem.difficulty === 'Easy' ? "text-green-500" :
                  problem.difficulty === 'Medium' ? "text-cyan-500" :
                  "text-red-500"
                )} />
                <div className="flex flex-col min-w-0">
                  <span className={cn("text-[11px] font-medium truncate transition-colors", themeClasses.textSecondary, "group-hover:text-cyan-500")}>
                    {problem.title}
                  </span>
                  {isExternal && (
                    <span className="text-[8px] text-cyan-500/40 uppercase font-black tracking-widest">External: Codeforces</span>
                  )}
                </div>
              </div>
              <ChevronRight size={12} className={cn("shrink-0 transition-colors", themeClasses.textTertiary, "group-hover:text-cyan-500")} />
            </div>
          );
        }) : (
          <div className="py-8 text-center opacity-20">
            <BookOpen size={24} className="mx-auto mb-2" />
            <p className="text-[9px] font-black uppercase tracking-widest">No Matches</p>
          </div>
        )}
      </div>
    </div>
  );
}
