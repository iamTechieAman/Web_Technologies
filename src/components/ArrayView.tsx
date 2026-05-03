'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, TrendingUp, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ArrayViewProps {
  variables: Record<string, { value: unknown, type: string }>;
}

export default function ArrayView({ variables }: ArrayViewProps): React.ReactNode {
  const arrayEntry = Object.entries(variables).find(([_, val]) => val.type === 'array');

  if (!arrayEntry) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <Database size={48} className="text-gray-800 mb-4 opacity-40" />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">No Array in Scope</p>
        <p className="text-[9px] text-gray-600 mt-2 max-w-[200px] leading-relaxed">
          Declare an array variable (e.g. <code className="text-cyan-500">int[] arr = {'{1,2,3}'}</code>) and run your code to see a visual bar chart here.
        </p>
      </div>
    );
  }

  const [name, data] = arrayEntry;
  const arr = data.value as unknown[];
  const maxValue = Math.max(...(arr.filter(v => typeof v === 'number') as number[]), 10);

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <Database size={18} className="text-blue-500" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              {name}
              <span className="text-[8px] font-bold text-gray-500 bg-white/5 px-1.5 py-0.5 rounded uppercase">
                {arr.length} Elements
              </span>
            </h3>
            <p className="text-[9px] font-bold text-gray-600 uppercase tracking-tighter">Structural Heap View</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-gray-500">
            <TrendingUp size={12} /> Heatmap Active
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-1">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  i === 1 ? "bg-blue-500" : i === 2 ? "bg-cyan-500" : "bg-green-500"
                )} />
                <span className="text-[8px] font-bold text-gray-600">
                  {i === 1 ? "Read" : i === 2 ? "Access" : "Swap"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-end gap-3 px-4 pb-16 pt-4 relative">
        {/* Background Grid */}
        <div className="absolute inset-x-0 bottom-16 top-4 border-b border-white/[0.02] flex flex-col justify-between pointer-events-none opacity-20">
          {[...Array(5)].map((_, i) => <div key={i} className="w-full border-t border-white/5" />)}
        </div>

        <AnimatePresence mode="popLayout">
          {arr.map((val: unknown, idx: number) => {
            const isNumber = typeof val === 'number';
            const height = isNumber ? (val as number / maxValue) * 100 : 30;
            
            return (
              <motion.div 
                key={`${idx}-${name}`}
                layout
                className="flex-1 flex flex-col items-center gap-4 group"
              >
                <div className="w-full relative flex-1 flex items-end justify-center">
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: `${Math.max(height, 5)}%`, opacity: 1 }}
                    transition={{ type: "spring", damping: 15, stiffness: 100 }}
                    className={cn(
                      "w-full rounded-t-xl transition-all duration-500 relative flex flex-col items-center",
                      "bg-gradient-to-t from-blue-500/20 to-blue-500/40 border-x border-t border-blue-500/30",
                      "group-hover:from-blue-500/40 group-hover:to-blue-500/60"
                    )}
                  >
                    <div className="absolute -top-7 text-[10px] font-black text-white opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 px-2 py-0.5 rounded border border-white/10 backdrop-blur">
                      {val as React.ReactNode}
                    </div>
                    {/* Glowing Cap */}
                    <div className="h-1 w-full bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.5)] rounded-full opacity-50" />
                  </motion.div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[9px] font-black text-gray-500 bg-white/5 w-6 h-6 flex items-center justify-center rounded-lg border border-white/5 group-hover:border-blue-500/50 group-hover:text-blue-500 transition-all">
                    {idx}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="mt-auto glass-panel p-4 rounded-2xl flex items-center justify-between border-t border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-cyan-500/10 rounded-lg">
            <Info size={14} className="text-cyan-500" />
          </div>
          <p className="text-[10px] font-bold text-gray-400">
            Current Focus: <span className="text-blue-400">Random Access Optimization</span>
          </p>
        </div>
        <div className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em]">
          Algorithm Insight Engaged
        </div>
      </div>
    </div>
  );
}
