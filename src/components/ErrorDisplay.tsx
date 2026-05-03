'use client';
import React, { useState } from 'react';
import {
  AlertCircle, Keyboard, Clock, Cpu, Boxes,
  ChevronDown, ChevronRight, Code2, Hash, Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { interpretError } from '@/lib/errorInterpreter';

interface ErrorDisplayProps {
  stderr: string;
  language: string;
  sourceCode?: string;
}

export default function ErrorDisplay({ stderr, language, sourceCode }: ErrorDisplayProps) {
  const [showRaw, setShowRaw] = useState(false);
  const err = interpretError(stderr, language);

  // Find the source line
  const faultyLine =
    err.line && sourceCode
      ? sourceCode.split('\n')[err.line - 1]?.trim() ?? null
      : null;

  // Choose icon based on error type
  const Icon =
    err.isInputError ? Keyboard :
    err.title.includes('Time') ? Clock :
    err.title.includes('Memory') ? Cpu :
    err.title.includes('Module') ? Boxes :
    AlertCircle;

  const accentColor = err.isInputError
    ? 'border-yellow-500/30 bg-yellow-500/5'
    : 'border-red-500/20 bg-red-500/8';
  const headerColor = err.isInputError
    ? 'bg-yellow-500/10 border-yellow-500/20'
    : 'bg-red-500/10 border-red-500/20';
  const iconColor = err.isInputError ? 'text-yellow-500' : 'text-red-500';
  const titleColor = err.isInputError ? 'text-yellow-500' : 'text-red-400';

  return (
    <div className={cn('rounded-2xl border overflow-hidden', accentColor)}>
      {/* Header */}
      <div className={cn('flex items-center justify-between px-4 py-3 border-b', headerColor)}>
        <div className="flex items-center gap-2">
          <Icon size={15} className={iconColor} />
          <span className={cn('text-[10px] font-black uppercase tracking-widest', titleColor)}>
            {err.title}
          </span>
        </div>
        {err.line && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black/30 rounded border border-white/10">
            <Hash size={10} className="text-gray-500" />
            <span className="text-[9px] font-bold text-gray-400">Line {err.line}</span>
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Human-readable message */}
        <p className="text-sm font-semibold text-white leading-relaxed">
          {err.message}
        </p>

        {/* Faulty source line */}
        {faultyLine && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-gray-500">
              <Code2 size={11} />
              Problematic line
            </div>
            <div className="bg-black/50 border border-red-500/20 rounded-xl p-3 font-mono text-xs flex gap-3 overflow-x-auto">
              <span className="text-red-500/50 select-none shrink-0">{err.line}</span>
              <span className="text-red-300/80 break-all">{faultyLine}</span>
            </div>
          </div>
        )}

        {/* Fix suggestion */}
        <div className="flex items-start gap-2.5 p-3 bg-cyan-500/5 border border-cyan-500/15 rounded-xl">
          <Lightbulb size={14} className="text-cyan-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-cyan-200/80 leading-relaxed font-medium">
            <span className="text-cyan-500 font-black">Fix: </span>
            {err.fix}
          </p>
        </div>

        {/* Collapsible raw trace — no raw errors by default */}
        <button
          onClick={() => setShowRaw(v => !v)}
          className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-gray-600 hover:text-gray-400 transition-colors"
        >
          {showRaw ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          {showRaw ? 'Hide' : 'Show'} raw error trace
        </button>

        {showRaw && (
          <pre className="text-[9px] font-mono text-gray-600 whitespace-pre-wrap break-all leading-tight bg-black/30 rounded-xl p-3 border border-white/5 max-h-40 overflow-auto custom-scrollbar">
            {err.raw}
          </pre>
        )}
      </div>
    </div>
  );
}
