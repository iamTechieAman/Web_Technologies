'use client';
import React from 'react';
import { CheckCircle2, Circle, ArrowRight, BookOpen, Code2, Eye, Zap, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlgorithmRoadmapProps {
  currentPhase?: number;
}

const PHASES = [
  { id: 0, title: 'Understand', desc: 'Read the problem carefully. Identify inputs, outputs, and constraints.', icon: <BookOpen size={16} />, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { id: 1, title: 'Plan', desc: 'Choose a data structure and algorithm. Consider time/space tradeoffs.', icon: <Code2 size={16} />, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  { id: 2, title: 'Code', desc: 'Write clean, readable code. Handle edge cases.', icon: <Code2 size={16} />, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  { id: 3, title: 'Visualize', desc: 'Use the step trace and flowchart to verify your logic.', icon: <Eye size={16} />, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  { id: 4, title: 'Test', desc: 'Run against test cases. Fix bugs and edge cases.', icon: <Zap size={16} />, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  { id: 5, title: 'Optimize', desc: 'Analyze complexity. Can you improve time or space?', icon: <Trophy size={16} />, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
];

export default function AlgorithmRoadmap({ currentPhase = 0 }: AlgorithmRoadmapProps) {
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen size={14} className="text-orange-500" />
        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-500">Problem-Solving Roadmap</span>
      </div>

      <div className="space-y-2">
        {PHASES.map((phase, i) => {
          const isActive = i === currentPhase;
          const isCompleted = i < currentPhase;

          return (
            <div key={phase.id}>
              <div className={cn(
                "flex items-start gap-3 p-3 rounded-xl border transition-all",
                isActive ? `${phase.bg} ${phase.border} shadow-lg` : isCompleted ? 'bg-gray-800/20 border-gray-700/20' : 'bg-transparent border-gray-800/20 opacity-50'
              )}>
                <div className={cn("mt-0.5 shrink-0", isActive ? phase.color : isCompleted ? 'text-green-500' : 'text-gray-600')}>
                  {isCompleted ? <CheckCircle2 size={16} /> : isActive ? phase.icon : <Circle size={16} />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-xs font-bold", isActive ? phase.color : isCompleted ? 'text-gray-400 line-through' : 'text-gray-600')}>
                      {phase.title}
                    </span>
                    {isActive && <span className="text-[8px] font-black uppercase bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded animate-pulse">Current</span>}
                  </div>
                  {(isActive || isCompleted) && (
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{phase.desc}</p>
                  )}
                </div>
              </div>
              {i < PHASES.length - 1 && (
                <div className="flex justify-center py-0.5">
                  <div className={cn("w-px h-3", i < currentPhase ? 'bg-green-500/30' : 'bg-gray-800/30')} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
