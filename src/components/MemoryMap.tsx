'use client';
import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Type, Clock, Hash, Braces, Binary, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MemoryMapProps {
  variables: Record<string, { value: any, type: string }>;
}

export default function MemoryMap({ variables }: MemoryMapProps) {
  const previousState = useRef<Record<string, any>>({});
  const varKeys = Object.keys(variables);

  useEffect(() => {
    previousState.current = JSON.parse(JSON.stringify(variables));
  }, [variables]);

  if (varKeys.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
        <Box size={48} className="text-gray-800 mb-4 animate-bounce" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">No variables detected yet</p>
        <p className="text-[9px] text-gray-700 mt-2">Memory will populate as your code executes assignments.</p>
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'number': return <Hash size={12} />;
      case 'array': return <Braces size={12} />;
      case 'boolean': return <Binary size={12} />;
      case 'string': return <Quote size={12} />;
      default: return <Type size={12} />;
    }
  };

  return (
    <div className="h-full overflow-auto custom-scrollbar p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {varKeys.map((name) => {
            const current = variables[name];
            const prev = previousState.current[name];
            const hasChanged = prev && JSON.stringify(prev.value) !== JSON.stringify(current.value);
            const isNew = !prev;

            return (
              <motion.div
                key={name}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "group relative p-4 rounded-2xl border transition-all duration-500",
                  hasChanged ? "bg-yellow-500/5 border-yellow-500/30 ring-1 ring-yellow-500/20" : 
                  isNew ? "bg-green-500/5 border-green-500/30" : 
                  "bg-white/[0.02] border-white/5 hover:border-white/10"
                )}
              >
                {/* Change Indicator */}
                {hasChanged && (
                  <motion.div 
                    layoutId={`change-${name}`}
                    className="absolute -top-1.5 -right-1.5 px-2 py-0.5 bg-yellow-500 text-[8px] font-black uppercase text-black rounded-full shadow-lg z-20"
                  >
                    Updated
                  </motion.div>
                )}

                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center border transition-colors",
                      hasChanged ? "bg-yellow-500/10 border-yellow-500/20" : "bg-black/40 border-white/10"
                    )}>
                      {getTypeIcon(current.type)}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white flex items-center gap-2">
                        {name}
                        <span className="text-[8px] font-bold text-gray-500 bg-white/5 px-1.5 py-0.5 rounded uppercase">
                          {current.type}
                        </span>
                      </h4>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-black/40 rounded-xl border border-white/5 font-mono text-[11px] break-all min-h-[2.5rem] flex items-center justify-center relative overflow-hidden group-hover:border-white/10 transition-colors">
                  <span className={cn(
                    "relative z-10 transition-all duration-500",
                    hasChanged ? "text-yellow-400 scale-110" : "text-gray-300"
                  )}>
                    {current.type === 'array' ? `Array(${current.value.length})` : String(current.value)}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
