'use client';
import React from 'react';
import { AlertCircle, Terminal, Hash, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseError } from '@/lib/errorParser';

interface ErrorDisplayProps {
  stderr: string;
  language: string;
  sourceCode?: string;
}

export default function ErrorDisplay({ stderr, language, sourceCode }: ErrorDisplayProps) {
  const parsed = parseError(stderr, language);
  
  // Try to find the line of code that caused the error
  const lines = sourceCode?.split('\n') || [];
  const faultyLine = parsed.line && lines[parsed.line - 1] ? lines[parsed.line - 1].trim() : null;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-red-500/10 px-4 py-3 border-b border-red-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-red-500">
              {parsed.type || 'Execution Error'}
            </span>
          </div>
          {parsed.line && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 rounded border border-red-500/20">
              <Hash size={10} className="text-red-500/50" />
              <span className="text-[9px] font-bold text-red-400">Line {parsed.line}</span>
            </div>
          )}
        </div>

        {/* Message */}
        <div className="p-4 space-y-4">
          <p className="text-sm font-bold text-white leading-relaxed">
            {parsed.message}
          </p>

          {/* Faulty Line Highlight */}
          {faultyLine && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-gray-500">
                <Code2 size={12} />
                Problematic Line
              </div>
              <div className="bg-black/40 border border-gray-800 rounded-xl p-3 font-mono text-xs flex gap-4">
                <span className="text-gray-700 select-none">{parsed.line}</span>
                <span className="text-gray-300 break-all">{faultyLine}</span>
              </div>
            </div>
          )}
        </div>

        {/* Raw Trace (Collapsible if needed, showing by default) */}
        <div className="px-4 py-3 bg-black/20 border-t border-red-500/10">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-gray-600 mb-2">
            <Terminal size={12} />
            Raw Error Trace
          </div>
          <pre className="text-[10px] font-mono text-red-400/60 whitespace-pre-wrap break-all leading-tight">
            {parsed.raw}
          </pre>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[9px] text-gray-600 italic bg-white/5 p-3 rounded-xl border border-gray-800/50">
        <AlertCircle size={12} className="text-orange-500" />
        Tip: Check for syntax errors, missing semicolons, or invalid variable references on the highlighted line.
      </div>
    </div>
  );
}
