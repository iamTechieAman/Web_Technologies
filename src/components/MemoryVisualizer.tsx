'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Database, Hash, Type, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MemoryVisualizerProps {
  variables: Record<string, any>;
  prevVariables?: Record<string, any>;
}

export default function MemoryVisualizer({ variables, prevVariables = {} }: MemoryVisualizerProps) {
  const entries = Object.entries(variables);

  if (entries.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-700 opacity-50">
        <Database size={32} className="mb-2" />
        <p className="text-xs font-bold uppercase tracking-widest">No variables in scope</p>
      </div>
    );
  }

  return (
    <div className="p-4 h-full overflow-auto space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
          <Database size={14} className="text-blue-500" />
          Virtual Memory Heap
        </h3>
        <span className="text-[9px] font-bold text-gray-600 bg-gray-900 px-2 py-0.5 rounded">{entries.length} Objects</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {entries.map(([name, value], i) => {
          const changed = JSON.stringify(prevVariables[name]) !== JSON.stringify(value);
          const type = getVarType(value);
          const address = `0x${(12345 + i * 16).toString(16).toUpperCase()}`;

          return (
            <motion.div
              key={name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "group p-4 rounded-xl border transition-all duration-500 relative overflow-hidden",
                changed 
                  ? "bg-blue-500/5 border-blue-500/30 shadow-lg shadow-blue-500/5" 
                  : "bg-[#0d0d10] border-gray-800 hover:border-gray-700"
              )}
            >
              {changed && (
                <motion.div 
                  layoutId="highlight"
                  className="absolute inset-0 bg-blue-500/5 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              )}
              
              <div className="flex items-start justify-between relative z-10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-gray-600 tracking-tighter">{address}</span>
                    <span className="text-xs font-black text-blue-400 group-hover:text-blue-300 transition-colors">{name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-gray-800 text-gray-500 rounded text-[8px] font-black uppercase">{type}</span>
                    <div className="text-[11px] font-mono text-gray-200 break-all leading-relaxed">
                      {formatValue(value)}
                    </div>
                  </div>
                </div>
                <div className={cn(
                  "p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-600 group-hover:text-blue-500 transition-colors",
                  changed && "text-blue-500 border-blue-500/30"
                )}>
                  {getVarIcon(type)}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function getVarType(val: any): string {
  if (Array.isArray(val)) return 'Array';
  if (val === null) return 'null';
  if (typeof val === 'object') return 'Object';
  return typeof val;
}

function getVarIcon(type: string) {
  switch (type.toLowerCase()) {
    case 'number': return <Hash size={12} />;
    case 'string': return <Type size={12} />;
    case 'array':
    case 'object': return <Database size={12} />;
    default: return <LinkIcon size={12} />;
  }
}

function formatValue(val: any): string {
  if (typeof val === 'object' && val !== null) {
    try {
      const str = JSON.stringify(val);
      return str.length > 50 ? str.slice(0, 47) + '...' : str;
    } catch (e) {
      return '[Complex Object]';
    }
  }
  return String(val);
}
