'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Terminal, ChevronDown, ArrowRight, Zap } from 'lucide-react';
import { ExecutionStep } from '@/types';
import { cn } from '@/lib/utils';

interface RecursionTreeProps {
  steps: ExecutionStep[];
  currentStep: number;
}

export default function RecursionTree({ steps, currentStep }: RecursionTreeProps) {
  const step = steps[currentStep];
  const callStack = step?.callStack || [];

  if (callStack.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
        <div className="relative mb-6">
          <Share2 size={64} className="text-gray-800" />
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-orange-500/20 blur-2xl rounded-full"
          />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Call Stack Empty</p>
        <p className="text-[9px] text-gray-700 mt-2 max-w-[200px]">Recursive function calls will create a visual tree of execution frames here.</p>
      </div>
    );
  }

  return (
    <div className="h-full p-8 overflow-auto custom-scrollbar bg-black/20">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <Zap size={20} className="text-orange-500 fill-orange-500/20" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white">Execution Frames</h3>
            <p className="text-[9px] font-bold text-gray-600 uppercase tracking-tighter">Recursive Depth Analysis</p>
          </div>
        </div>
        <div className="glass-panel px-4 py-2 rounded-xl text-[10px] font-black text-orange-500 uppercase tracking-widest">
          {callStack.length} Layers Deep
        </div>
      </div>

      <div className="space-y-6 relative max-w-2xl mx-auto">
        <div className="absolute left-7 top-10 bottom-10 w-px bg-gradient-to-b from-orange-500/50 via-orange-500/10 to-transparent" />

        <AnimatePresence mode="popLayout">
          {callStack.map((frame, i) => {
            const isLast = i === callStack.length - 1;
            return (
              <motion.div
                key={`${frame.functionName}-${i}`}
                initial={{ opacity: 0, x: -30, y: 20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: 20 }}
                transition={{ type: "spring", damping: 20, stiffness: 100, delay: i * 0.05 }}
                className="flex items-start gap-8 group"
              >
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center border-2 shrink-0 transition-all duration-500 relative z-10",
                  isLast 
                    ? "bg-orange-500 border-orange-400 shadow-2xl shadow-orange-500/40 scale-110 rotate-3" 
                    : "bg-[#0d0d10] border-white/5 opacity-50 group-hover:opacity-100"
                )}>
                  {isLast && (
                    <motion.div 
                      layoutId="stack-pulse"
                      className="absolute inset-0 bg-white/20 rounded-2xl animate-ping"
                    />
                  )}
                  <span className={cn(
                    "text-xs font-black",
                    isLast ? "text-white" : "text-gray-500"
                  )}>
                    {i + 1}
                  </span>
                </div>

                <div className={cn(
                  "flex-1 glass-card p-5 relative transition-all duration-500",
                  isLast ? "border-orange-500/50 orange-glow translate-x-2" : "border-white/5 opacity-40 hover:opacity-100"
                )}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        isLast ? "bg-orange-500 animate-pulse" : "bg-gray-700"
                      )} />
                      <h4 className="text-xs font-black text-white uppercase tracking-widest">
                        {frame.functionName}<span className="text-gray-600">(</span>
                        <span className="text-orange-400/80">{frame.params}</span>
                        <span className="text-gray-600">)</span>
                      </h4>
                    </div>
                    {isLast && (
                      <span className="text-[8px] font-black bg-orange-500 text-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                        Active
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                      <Terminal size={10} />
                      Memory Context ID: <span className="text-gray-300">0x{Math.abs(frame.functionName.length * i * 1234).toString(16)}</span>
                    </div>
                    <div className="h-3 w-px bg-white/5" />
                    <div className="flex items-center gap-1.5">
                      <ArrowRight size={10} />
                      Status: {isLast ? "Executing" : "Paused"}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {callStack.length > 5 && (
        <div className="mt-8 flex justify-center">
          <div className="glass-pill px-4 py-2 flex items-center gap-2">
            <ChevronDown size={14} className="text-gray-600 animate-bounce" />
            <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Stack limit visualization threshold reached</span>
          </div>
        </div>
      )}
    </div>
  );
}
