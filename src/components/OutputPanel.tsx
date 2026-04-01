'use client';
import React from 'react';
import { 
  Terminal as TerminalIcon, AlertCircle, CheckCircle2, 
  Clock, Cpu, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExecutionResult } from '@/types';
import ErrorDisplay from './ErrorDisplay';

interface OutputPanelProps {
  result: ExecutionResult | null;
  loading: boolean;
  language: string;
  sourceCode: string;
}

export default function OutputPanel({ result, loading, language, sourceCode }: OutputPanelProps) {
  const hasResult = result && (result.success || result.error || result.run?.stderr);

  return (
    <div className="h-full flex flex-col bg-[#050507]">
      {/* Header */}
      <div className="h-10 bg-[#0d0d10] border-b border-gray-800/50 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <TerminalIcon size={14} className="text-orange-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">Execution Output</span>
        </div>
        
        {hasResult && !loading && (
          <div className="flex items-center gap-4">
            {result.executionTimeMs !== undefined && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded border border-gray-800">
                <Clock size={10} className="text-blue-500" />
                <span className="text-[9px] font-bold text-gray-500">{result.executionTimeMs}ms</span>
              </div>
            )}
            {result.memoryUsageBytes !== undefined && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded border border-gray-800">
                <Cpu size={10} className="text-green-500" />
                <span className="text-[9px] font-bold text-gray-500">
                  {(result.memoryUsageBytes / 1024 / 1024).toFixed(1)}MB
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto custom-scrollbar p-4 font-mono text-sm">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full animate-pulse" />
              <Zap size={24} className="text-orange-500 animate-bounce relative" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">Executing code on backend...</p>
          </div>
        ) : result ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Stdout */}
            {result.run?.stdout && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-green-500/50">
                  <CheckCircle2 size={12} />
                  Standard Output
                </div>
                <pre className="bg-white/5 border border-gray-800/50 rounded-xl p-4 text-gray-300 whitespace-pre-wrap break-all leading-relaxed">
                  {result.run.stdout}
                </pre>
              </div>
            )}

            {/* Error Display (Stderr or API Error) */}
            {(result.run?.stderr || result.error) && (
              <ErrorDisplay 
                stderr={result.run?.stderr || result.error || 'Unknown error'} 
                language={language}
                sourceCode={sourceCode}
              />
            )}

            {/* Empty Output Case */}
            {!result.run?.stdout && !result.run?.stderr && !result.error && (
              <div className="h-full flex flex-col items-center justify-center gap-3 py-20 opacity-40">
                <CheckCircle2 size={24} className="text-green-500" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Program executed successfully (no output)</p>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-20">
            <Zap size={48} className="text-gray-700 mb-4" />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Run your code to see results</p>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      {hasResult && (
        <div className="h-8 border-t border-gray-800/50 flex items-center px-4 bg-[#0d0d10] gap-4 shrink-0">
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">Engine: {result.engine || 'local'}</span>
          <div className="w-px h-3 bg-gray-800" />
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">Status: {result.success ? 'Success' : 'Error'}</span>
        </div>
      )}
    </div>
  );
}
