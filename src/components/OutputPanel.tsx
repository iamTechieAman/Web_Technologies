'use client';
import React from 'react';
import { 
  Terminal as TerminalIcon, CheckCircle2, 
  Clock, Cpu, Zap
} from 'lucide-react';
import { ExecutionResult } from '@/types';
import ErrorDisplay from './ErrorDisplay';
import { cn } from '@/lib/utils';
import { useTheme, useThemeClasses } from '@/context/ThemeContext';

interface OutputPanelProps {
  result: ExecutionResult | null;
  loading: boolean;
  language: string;
  sourceCode: string;
}

export default function OutputPanel({ result, loading, language, sourceCode }: OutputPanelProps) {
  const themeClasses = useThemeClasses();
  const { isDark } = useTheme();
  const hasResult = !!(result && (result.success || result.error || result.run?.stdout || result.run?.stderr));

  return (
    <div className={cn("h-full flex flex-col relative group", themeClasses.bg)}>

      {/* Content */}
      <div className="flex-1 overflow-auto custom-scrollbar p-0 font-mono">
        {loading ? (
          <div className={cn("h-full flex flex-col items-center justify-center gap-3 backdrop-blur-sm", isDark ? "bg-black/20" : "bg-white/40")}>
            <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-cyan-500/50">Executing Code...</p>
          </div>
        ) : result ? (
          <div className="min-h-full p-4 space-y-6 animate-in fade-in duration-300">
            {/* Stdout */}
            {result.run?.stdout && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-2 py-1 rounded bg-green-500/5 border border-green-500/10 w-fit">
                  <CheckCircle2 size={10} className="text-green-500" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-green-500/70">Standard Output</span>
                </div>
                <div className={cn(
                  "border rounded-2xl p-5 shadow-2xl group transition-all",
                  isDark ? "bg-black/40 border-white/5 hover:border-white/10" : "bg-white border-gray-100 hover:border-gray-200 shadow-gray-200/20"
                )}>
                  <pre className={cn("text-[13px] whitespace-pre-wrap break-words leading-relaxed font-mono", isDark ? "text-gray-300" : "text-gray-700")}>
                    {result.run.stdout}
                  </pre>
                </div>
              </div>
            )}

            {/* Error Display (Stderr or API Error) */}
            {(result.run?.stderr || result.error) && (
              <div className="space-y-3">
                <ErrorDisplay 
                  stderr={result.run?.stderr || result.error || 'Unknown error'} 
                  language={language}
                  sourceCode={sourceCode}
                />
              </div>
            )}

            {/* Empty Output Case */}
            {!result.run?.stdout && !result.run?.stderr && !result.error && (
              <div className="h-64 flex flex-col items-center justify-center gap-3 opacity-30">
                <CheckCircle2 size={24} className="text-green-500" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Execution successful (Empty output)</p>
              </div>
            )}
            
            {/* Pad bottom */}
            <div className="h-10" />
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-20 group">
            <Zap size={48} className="text-gray-700 mb-4 transition-transform group-hover:scale-110 duration-500" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Waiting for execution...</p>
          </div>
        )}
      </div>

      {/* Stats Footer */}
      {hasResult && !loading && (
        <div className={cn(
          "absolute bottom-4 right-4 z-10 flex items-center gap-3 px-4 py-2 backdrop-blur-md border rounded-2xl shadow-2xl animate-in slide-in-from-right-4 duration-500 group-hover:scale-105 transition-transform",
          isDark ? "bg-[#141725]/80 border-white/10 shadow-black/40" : "bg-white/90 border-gray-200 shadow-gray-200/50"
        )}>
          {result.executionTimeMs !== undefined && (
            <div className="flex items-center gap-1.5 text-gray-400">
              <Clock size={10} className="text-cyan-500" />
              <span className="text-[9px] font-black">{result.executionTimeMs}ms</span>
            </div>
          )}
          {result.memoryUsageBytes !== undefined && (
            <div className="flex items-center gap-1.5 text-gray-400">
              <Cpu size={10} className="text-purple-500" />
              <span className="text-[9px] font-black">
                {(result.memoryUsageBytes / 1024 / 1024).toFixed(1)}MB
              </span>
            </div>
          )}
          <div className={cn("w-[1px] h-3", isDark ? "bg-white/10" : "bg-gray-200")} />
          <span className={cn("text-[8px] font-black uppercase tracking-widest", isDark ? "text-white/40" : "text-gray-400")}>{result.engine || 'local'}</span>
          <div className={cn("w-[1px] h-2", isDark ? "bg-white/10" : "bg-gray-200")} />
          <span className={cn(
            "text-[8px] font-black uppercase tracking-widest",
            result.success ? "text-green-500" : "text-red-500"
          )}>
            {result.success ? 'Success' : 'Failure'}
          </span>
        </div>
      )}
    </div>
  );
}
