'use client';
import React from 'react';
import { Shield, Zap, BarChart3, Clock, Database, Cpu, Layers, GitBranch, ArrowRight, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { analyzeComplexity } from '@/lib/complexityAnalyzer';

interface CodeAnalysisProps {
  code: string;
}

export default function CodeAnalysis({ code }: CodeAnalysisProps) {
  const complexity = analyzeComplexity(code);
  const lines = code.split('\n');
  const nonEmptyLines = lines.filter(l => l.trim()).length;
  const commentLines = lines.filter(l => l.trim().startsWith('//') || l.trim().startsWith('#') || l.trim().startsWith('/*') || l.trim().startsWith('*')).length;
  const loopCount = (code.match(/\b(for|while)\b/g) || []).length;
  const condCount = (code.match(/\b(if|else|elif|switch|case)\b/g) || []).length;
  const funcCount = (code.match(/\b(def |function |fn |func |static\s+\w+\s+\w+\s*\()/g) || []).length;
  const hasRecursion = complexity.properties.some(p => p.toLowerCase().includes('recurs'));
  const isInPlace = complexity.properties.some(p => p.toLowerCase().includes('in-place'));
  const isStable = !code.match(/\bsort\b/i) || code.match(/\b(merge.?sort|insertion.?sort|bubble.?sort|timsort)\b/i);

  return (
    <div className="p-4 space-y-4 text-xs">
      {/* Complexity */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock size={11} className="text-blue-400" />
            <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">Time</span>
          </div>
          <div className="text-lg font-black text-blue-300">{complexity.time}</div>
        </div>
        <div className="p-3 bg-purple-500/5 border border-purple-500/10 rounded-xl">
          <div className="flex items-center gap-1.5 mb-1">
            <Database size={11} className="text-purple-400" />
            <span className="text-[9px] font-black uppercase tracking-widest text-purple-400">Space</span>
          </div>
          <div className="text-lg font-black text-purple-300">{complexity.space}</div>
        </div>
      </div>

      {/* Reasoning */}
      <div className="p-3 bg-gray-800/30 border border-gray-700/30 rounded-xl">
        <div className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Analysis</div>
        <p className="text-gray-400 leading-relaxed">{complexity.reasoning}</p>
      </div>

      {/* Properties */}
      <div>
        <div className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Properties</div>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { label: 'Recursive', active: hasRecursion, icon: <RefreshCw size={11} /> },
            { label: 'In-place', active: isInPlace, icon: <Layers size={11} /> },
            { label: 'Stable', active: !!isStable, icon: <Shield size={11} /> },
            { label: 'Iterative', active: !hasRecursion && loopCount > 0, icon: <GitBranch size={11} /> },
          ].map(p => (
            <div key={p.label} className={cn(
              "flex items-center gap-1.5 px-2 py-1.5 rounded-lg border transition-colors",
              p.active
                ? "bg-green-500/5 border-green-500/20 text-green-400"
                : "bg-gray-800/20 border-gray-700/20 text-gray-600"
            )}>
              {p.icon}
              <span className="font-semibold">{p.label}</span>
              <span className="ml-auto text-[9px] font-bold">{p.active ? '✓' : '—'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Code Stats */}
      <div>
        <div className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Code Statistics</div>
        <div className="space-y-1">
          {[
            { label: 'Lines of Code', value: nonEmptyLines, color: 'text-blue-400' },
            { label: 'Comments', value: commentLines, color: 'text-green-400' },
            { label: 'Loops', value: loopCount, color: 'text-yellow-400' },
            { label: 'Conditionals', value: condCount, color: 'text-orange-400' },
            { label: 'Functions', value: funcCount, color: 'text-purple-400' },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between py-1 px-2 bg-gray-800/20 rounded">
              <span className="text-gray-500">{s.label}</span>
              <span className={cn("font-bold", s.color)}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
