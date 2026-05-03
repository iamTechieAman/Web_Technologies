'use client';
import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Hash, Braces, Binary, Quote, Type } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MemoryMapProps {
  variables: Record<string, { value: unknown; type: string }>;
}

function typeIcon(type: string): React.ReactNode {
  switch (type) {
    case 'number':  return <Hash size={11} />;
    case 'array':   return <Braces size={11} />;
    case 'boolean': return <Binary size={11} />;
    case 'string':  return <Quote size={11} />;
    default:        return <Type size={11} />;
  }
}

function formatValue(val: unknown, type: string): string {
  if (Array.isArray(val)) return `[${(val as unknown[]).join(', ')}]`;
  if (type === 'string') return `"${val}"`;
  return String(val);
}

function typeColor(type: string): string {
  switch (type) {
    case 'number':  return 'text-blue-400';
    case 'string':  return 'text-green-400';
    case 'boolean': return 'text-yellow-400';
    case 'array':   return 'text-purple-400';
    default:        return 'text-gray-300';
  }
}

export default function MemoryMap({ variables }: MemoryMapProps): React.ReactNode {
  const prevRef = useRef<Record<string, unknown>>({});
  const varKeys = Object.keys(variables);

  // Track which keys changed this render
  const [changedKeys, setChangedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    const changed = new Set<string>();
    for (const k of varKeys) {
      if (
        prevRef.current[k] !== undefined &&
        JSON.stringify(prevRef.current[k]) !== JSON.stringify(variables[k]?.value)
      ) {
        changed.add(k);
      }
    }
    setChangedKeys(changed);
    // Update prev snapshot
    const next: Record<string, unknown> = {};
    for (const k of varKeys) next[k] = variables[k]?.value;
    prevRef.current = next;
  }, [variables, varKeys]);

  if (varKeys.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6 gap-3">
        <Box size={40} className="text-gray-800 opacity-60 animate-bounce" />
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Memory Empty</p>
          <p className="text-[9px] text-gray-600 mt-1 max-w-[180px] leading-relaxed">
            Assign a variable (e.g. <code className="text-cyan-500">int x = 5</code>) and step through your code to see memory here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto custom-scrollbar">
      {/* Header row */}
      <div className="grid grid-cols-[1fr_80px_1fr] gap-2 px-2 mb-2 sticky top-0 bg-[#050507]/90 backdrop-blur-sm py-1 z-10">
        <span className="text-[8px] font-black uppercase tracking-widest text-gray-600">Name</span>
        <span className="text-[8px] font-black uppercase tracking-widest text-gray-600">Type</span>
        <span className="text-[8px] font-black uppercase tracking-widest text-gray-600">Value</span>
      </div>

      <div className="space-y-1.5 px-1">
        <AnimatePresence mode="popLayout">
          {varKeys.map(name => {
            const { value, type } = variables[name];
            const changed = changedKeys.has(name);
            const isNew = prevRef.current[name] === undefined && !changed;

            return (
              <motion.div
                key={name}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  'grid grid-cols-[1fr_80px_1fr] gap-2 items-center px-3 py-2.5 rounded-xl border transition-all duration-300',
                  changed  ? 'bg-yellow-500/5 border-yellow-500/25 ring-1 ring-yellow-500/20' :
                  isNew    ? 'bg-green-500/5 border-green-500/20' :
                             'bg-white/[0.02] border-white/5 hover:border-white/10',
                )}
              >
                {/* Name */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className={cn('shrink-0 w-6 h-6 rounded-lg flex items-center justify-center border', typeColor(type), 'bg-white/5 border-white/10')}>
                    {typeIcon(type)}
                  </div>
                  <span className="text-[11px] font-black text-white truncate">{name}</span>
                  {changed && (
                    <span className="shrink-0 text-[7px] font-black bg-yellow-500 text-black px-1.5 py-0.5 rounded-full">
                      CHANGED
                    </span>
                  )}
                </div>

                {/* Type badge */}
                <span className={cn('text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-white/5 truncate', typeColor(type))}>
                  {type}
                </span>

                {/* Value */}
                <div className="min-w-0">
                  <span className={cn(
                    'text-[11px] font-mono break-all',
                    changed ? 'text-yellow-300 font-black' : typeColor(type),
                  )}>
                    {formatValue(value, type)}
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
