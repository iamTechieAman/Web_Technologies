'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface VariableMapProps {
  variables: Record<string, any>;
  prevVariables?: Record<string, any>;
}

export default function VariableMap({ variables, prevVariables = {} }: VariableMapProps) {
  const entries = Object.entries(variables);

  return (
    <div className="h-full flex flex-col p-4 bg-[#0d0d10] overflow-auto custom-scrollbar">
      <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-2">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Live Memory Map</h3>
        <span className="text-[10px] font-bold text-blue-500/80">{entries.length} active variables</span>
      </div>

      <div className="grid gap-2">
        <AnimatePresence mode="popLayout">
          {entries.map(([name, value], i) => {
            const isChanged = prevVariables[name] !== undefined && JSON.stringify(prevVariables[name]) !== JSON.stringify(value);
            const isNew = prevVariables[name] === undefined;
            const type = Array.isArray(value) ? 'array' : typeof value;

            return (
              <motion.div
                key={name}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl border transition-all duration-300",
                  isNew ? "bg-green-500/5 border-green-500/30" : 
                  isChanged ? "bg-red-500/5 border-red-500/30" : "bg-gray-900/50 border-gray-800"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-gray-800 flex items-center justify-center text-[10px] font-mono text-gray-500 border border-gray-700">
                    0x{i.toString(16).padStart(2, '0')}
                  </div>
                  <div>
                    <div className="text-[11px] font-black text-gray-300 flex items-center gap-2">
                      {name}
                      <span className="text-[8px] font-bold text-gray-600 uppercase bg-gray-800 px-1 rounded">{type}</span>
                    </div>
                  </div>
                </div>
                <div className={cn(
                  "text-[11px] font-mono font-bold",
                  isChanged || isNew ? "text-orange-400" : "text-gray-500"
                )}>
                  {JSON.stringify(value)}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
