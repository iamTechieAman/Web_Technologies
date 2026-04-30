import React from 'react';
import Link from 'next/link';
import { ChevronRight, Building2, Tag } from 'lucide-react';
import { Problem } from '@/types';
import { getDifficultyColor } from '@/lib/problems';
import { cn } from '@/lib/utils';

interface ProblemCardProps {
  problem: Problem;
}

export default function ProblemCard({ problem }: ProblemCardProps) {
  return (
    <div className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:shadow-xl hover:border-blue-500/50 transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 group-hover:text-blue-500 transition-colors">
            {problem.title}
          </h3>
          <span className={cn(
            "inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border mt-1",
            getDifficultyColor(problem.difficulty)
          )}>
            {problem.difficulty}
          </span>
        </div>
        <Link
          href={`/problem/${problem.slug}`}
          className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 group-hover:bg-blue-500 group-hover:text-white transition-all"
        >
          <ChevronRight size={20} />
        </Link>
      </div>

      <div className="space-y-3">
        {/* Companies */}
        <div className="flex items-center gap-2">
          <Building2 size={14} className="text-gray-400" />
          <div className="flex flex-wrap gap-1">
            {problem.companies?.slice(0, 3).map(c => (
              <span key={c} className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                {c}
              </span>
            ))}
            {(problem.companies?.length || 0) > 3 && (
              <span className="text-[10px] text-gray-400">+{(problem.companies?.length || 0) - 3} more</span>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-2">
          <Tag size={14} className="text-gray-400" />
          <div className="flex flex-wrap gap-1">
            {(problem.tags || problem.topicTags?.map(t => t.name) || []).slice(0, 2).map(t => (
              <span key={t} className="text-xs text-blue-600 dark:text-blue-400">
                #{t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-400 uppercase tracking-widest font-bold">
        <span>{problem.timeComplexity} Time</span>
        <span>{problem.spaceComplexity} Space</span>
      </div>
    </div>
  );
}
