'use client';
import React, { useState, useMemo } from 'react';
import { Sparkles, Search } from 'lucide-react';
import { searchProblems, getSolutionCode } from '@/lib/problems';
import type { Problem, SupportedLanguage } from '@/types';

interface ProblemSolverProps {
  language: SupportedLanguage;
  onSelectProblem: (code: string, problem: Problem) => void;
}

export default function ProblemSolver({ language, onSelectProblem }: ProblemSolverProps) {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return searchProblems(query).slice(0, 3);
  }, [query]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
        <Sparkles size={14} className="text-purple-500 shrink-0" />
        <input
          type="text"
          placeholder="Describe your problem or paste a LeetCode title…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
          onFocus={() => setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          className="flex-1 text-sm bg-transparent text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
        />
        <Search size={14} className="text-gray-400" />
      </div>

      {/* Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
          {results.map((p) => (
            <button
              key={p.id}
              onMouseDown={() => {
                const code = getSolutionCode(p, language);
                onSelectProblem(code, p);
                setQuery('');
                setShowResults(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0"
            >
              <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{p.title}</div>
              <div className="text-xs text-gray-400 mt-0.5">{(p.tags || p.topicTags?.map(t => t.name) || []).join(', ')} • {p.difficulty}</div>
            </button>
          ))}
        </div>
      )}

      {showResults && query.trim() && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 p-4 text-center">
          <p className="text-sm text-gray-400">No matching problems found. Try the Problem Library instead.</p>
        </div>
      )}
    </div>
  );
}
