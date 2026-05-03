'use client';
import React, { useMemo } from 'react';
import { 
  Clock, Database, Cpu, Layers, Zap, Trophy, 
  GitCompare, Activity, ShieldCheck, Gauge
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExecutionResult, ComplexityResult } from '@/types';

interface MetricsPanelProps {
  code: string;
  result: ExecutionResult | null;
  complexity?: ComplexityResult;
}

export default function MetricsPanel({ code, result, complexity }: MetricsPanelProps) {
  const codeStats = useMemo(() => {
    const lines = code.split('\n').filter(l => l.trim()).length;
    const loopCount = (code.match(/\b(for|while)\b/g) || []).length;
    const branchCount = (code.match(/\b(if|else|elif|switch|case)\b/g) || []).length;
    const funcCount = (code.match(/\b(def |function |fn |func |static\s+\w+\s+\w+\s*\()/g) || []).length;
    
    // Performance score calculation
    let score = 100;
    score -= (loopCount * 8); // Too many loops
    score -= (branchCount * 2); // Branching complexity
    if (lines > 50) score -= (lines - 50) * 0.5; // Code length penalty
    
    const finalScore = Math.max(10, Math.min(100, score));
    return { lines, loopCount, branchCount, funcCount, finalScore };
  }, [code]);

  return (
    <div className="flex flex-col h-full bg-[#0d0d10] text-gray-300">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto scrollbar-hide p-4 space-y-6 pb-10">
        
        {/* Core Analysis Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="group p-4 bg-[#111118] border border-gray-800 rounded-2xl hover:border-blue-500/30 transition-all duration-300">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Clock size={12} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Time Complexity</span>
            </div>
            <div className="text-xl font-black text-blue-100 group-hover:scale-105 transition-transform origin-left">{complexity?.time || 'O(1)'}</div>
          </div>

          <div className="group p-4 bg-[#111118] border border-gray-800 rounded-2xl hover:border-purple-500/30 transition-all duration-300">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                <Database size={12} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Space Complexity</span>
            </div>
            <div className="text-xl font-black text-purple-100 group-hover:scale-105 transition-transform origin-left">{complexity?.space || 'O(1)'}</div>
          </div>
        </div>

        {/* Health Score Gauge */}
        <div className="p-5 bg-gradient-to-br from-[#111118] to-[#0a0a0c] border border-gray-800 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Trophy size={64} className="text-cyan-500" />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2">
              <Gauge size={14} className="text-cyan-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Stability Index</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-white">{codeStats.finalScore}</span>
              <span className="text-sm font-bold text-gray-600 mb-1.5">/ 100</span>
            </div>
            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-800">
              <div 
                className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${codeStats.finalScore}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[9px] font-bold uppercase text-gray-500">
              <span>Optimized</span>
              <span>High Performance</span>
            </div>
          </div>
        </div>

        {/* Code Metadata */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-gray-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Structural Metrics</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Lines', value: codeStats.lines, icon: <Layers size={12} />, color: 'text-blue-400' },
              { label: 'Loops', value: codeStats.loopCount, icon: <Cpu size={12} />, color: 'text-yellow-500' },
              { label: 'Conditions', value: codeStats.branchCount, icon: <GitCompare size={12} />, color: 'text-green-500' },
              { label: 'Functions', value: codeStats.funcCount, icon: <Zap size={12} />, color: 'text-purple-500' },
            ].map(item => (
              <div key={item.label} className="p-3 bg-[#111118]/50 border border-gray-800/50 rounded-xl flex items-center gap-3">
                <div className={cn("p-1.5 rounded-lg bg-gray-900", item.color)}>{item.icon}</div>
                <div>
                  <div className="text-[11px] font-black text-gray-300">{item.value}</div>
                  <div className="text-[9px] text-gray-600 uppercase font-bold">{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Runtime Metrics */}
        {result?.executionTimeMs && (
          <div className="p-4 bg-[#111118] border border-gray-800 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-green-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Runtime Verified</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white">{result.executionTimeMs.toFixed(2)}</span>
              <span className="text-[10px] font-bold text-gray-600">MS</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
