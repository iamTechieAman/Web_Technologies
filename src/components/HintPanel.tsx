'use client';
import React, { useState } from 'react';
import { Brain, Lock, Unlock, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface HintPanelProps {
  hints: string[];
}

export default function HintPanel({ hints: problemHints }: HintPanelProps) {
  const [unlockedLevel, setUnlockedLevel] = useState(0);
  
  // Default hints if none provided
  const defaultHints = [
    "High-level Approach: Think about the data structure that fits this problem best.",
    "Algorithm Observation: Look for patterns in the input or constraints.",
    "Implementation Detail: Consider edge cases like empty input or single elements."
  ];

  const hintsToDisplay = (problemHints && problemHints.length > 0) ? problemHints : defaultHints;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Progressive Hints</h3>
        <div className="flex items-center gap-2 px-2 py-1 bg-cyan-500/10 rounded text-[9px] font-black text-cyan-500 uppercase tracking-tighter">
          <Sparkles size={12} /> AI Powered
        </div>
      </div>

      <div className="space-y-4">
        {hintsToDisplay.map((hint, i) => {
          const level = i + 1;
          const isLocked = unlockedLevel < level;
          
          return (
            <div 
              key={level}
              className={cn(
                "relative rounded-xl border transition-all duration-500",
                isLocked 
                  ? "bg-[#111118]/40 border-gray-800/50 opacity-60 grayscale" 
                  : "bg-[#111118] border-cyan-500/20 shadow-xl shadow-cyan-500/5"
              )}
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black transition-colors",
                      isLocked ? "bg-gray-800 text-gray-500" : "bg-cyan-500 text-white"
                    )}>
                      {level}
                    </span>
                    <h4 className={cn("text-[10px] font-black uppercase tracking-widest", isLocked ? "text-gray-600" : "text-gray-400")}>
                      {isLocked ? `Hint ${level} (Locked)` : `Insight ${level}`}
                    </h4>
                  </div>
                  {isLocked ? <Lock size={14} className="text-gray-700" /> : <Unlock size={14} className="text-cyan-500 animate-pulse" />}
                </div>

                {!isLocked ? (
                  <div className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-500">
                    <div className="mt-1.5"><ChevronRight size={14} className="text-cyan-500" /></div>
                    <p className="text-xs text-gray-400 leading-relaxed font-medium">
                      {hint}
                    </p>
                  </div>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="xs" 
                    className="w-full mt-2 bg-gray-900/50 border border-gray-800 text-[9px] font-black uppercase tracking-widest text-gray-600 hover:text-cyan-400 hover:border-cyan-500/50 py-4 transition-all"
                    onClick={() => setUnlockedLevel(level)}
                  >
                    Unlock Hint {level}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {unlockedLevel === 0 && (
        <div className="text-center py-6 px-8 border border-dashed border-gray-800 rounded-2xl bg-gray-900/10">
          <Brain size={32} className="mx-auto text-gray-800 mb-3" />
          <p className="text-[10px] text-gray-600 uppercase font-black tracking-widest leading-loose">
            Unlock hints to progress through the problem<br />without revealing the complete solution.
          </p>
        </div>
      )}
    </div>
  );
}
