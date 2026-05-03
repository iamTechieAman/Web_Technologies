'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecursionVisualizerProps {
  steps: any[];
  currentStep: number;
}

export default function RecursionVisualizer({ steps, currentStep }: RecursionVisualizerProps) {
  // Heuristic for recursion: look for 'call' events or changes in scope
  // For now, we'll use a simplified version that looks at consecutive steps
  // In a real implementation, the tracer should provide explicit call/return events
  
  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <Layers size={14} className="text-purple-500" />
        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Recursion Stack / Call Trace</h3>
      </div>

      <div className="flex-1 overflow-auto space-y-2 flex flex-col-reverse justify-end">
        <AnimatePresence mode="popLayout">
          {steps.slice(0, currentStep + 1).filter(s => s.event === 'call' || s.event === 'loop_start').map((s, i) => (
            <motion.div
              key={`${i}-${s.stepIndex}`}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn(
                "p-4 rounded-xl border border-gray-800 bg-[#0d0d10] flex items-center justify-between group",
                s.stepIndex === currentStep ? "border-purple-500/50 bg-purple-500/5 shadow-lg shadow-purple-500/10" : "opacity-40"
              )}
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center text-[10px] font-black text-gray-500">
                  #{i + 1}
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-black text-purple-400 font-mono">{s.lineContent.split('(')[0].replace('def ', '').replace('function ', '')}()</div>
                  <div className="text-[10px] text-gray-600 font-mono">
                    {JSON.stringify(s.variables)}
                  </div>
                </div>
              </div>
              <div className="text-[9px] font-bold text-gray-700 bg-gray-900 px-2 py-1 rounded">
                Line {s.lineNumber}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {steps.filter(s => s.event === 'call' || s.event === 'loop_start').length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 grayscale p-8">
            <Layers size={48} className="text-gray-800 mb-4" />
            <p className="text-xs font-bold uppercase tracking-widest text-gray-600">No recursion or complex calls detected in current trace.</p>
          </div>
        )}
      </div>
    </div>
  );
}
