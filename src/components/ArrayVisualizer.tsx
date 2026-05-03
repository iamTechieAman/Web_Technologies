'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ArrayVisualizerProps {
  data: any[];
  accessedIndices?: number[];
  updatedIndices?: number[];
  label?: string;
}

export default function ArrayVisualizer({ data, accessedIndices = [], updatedIndices = [], label }: ArrayVisualizerProps) {
  if (!Array.isArray(data)) return null;

  const maxValue = Math.max(...data.filter(x => typeof x === 'number'), 10);

  return (
    <div className="space-y-4 p-4 bg-gray-900/30 rounded-xl border border-gray-800">
      {label && <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</h4>}
      
      <div className="flex items-end gap-1 h-32 px-2">
        <AnimatePresence mode="popLayout">
          {data.map((val, i) => {
            const isAccessed = accessedIndices.includes(i);
            const isUpdated = updatedIndices.includes(i);
            const height = typeof val === 'number' ? (val / maxValue) * 100 : 50;

            return (
              <div key={`${i}-${val}`} className="flex-1 flex flex-col items-center gap-2 group">
                <motion.div
                  layout
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ 
                    height: `${Math.max(height, 5)}%`, 
                    opacity: 1,
                    backgroundColor: isUpdated ? '#f97316' : isAccessed ? '#3b82f6' : '#374151'
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="w-full rounded-t-sm shadow-lg relative"
                >
                  {(isAccessed || isUpdated) && (
                    <motion.div 
                      initial={{ scale: 0 }} 
                      animate={{ scale: 1 }} 
                      className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-xl shadow-white/50" 
                    />
                  )}
                </motion.div>
                <span className={cn(
                  "text-[9px] font-mono",
                  isUpdated ? "text-cyan-500 font-bold" : isAccessed ? "text-blue-500 font-bold" : "text-gray-600"
                )}>
                  {val}
                </span>
              </div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
