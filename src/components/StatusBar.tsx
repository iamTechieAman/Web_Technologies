'use client';
import React from 'react';
import { 
  GitBranch, 
  Wifi, 
  CheckCircle2, 
  AlertCircle,
  Code2,
  Terminal as TerminalIcon,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThemeClasses } from '@/context/ThemeContext';

interface StatusBarProps {
  language: string;
  isExecuting: boolean;
  hasError: boolean;
  line: number;
  column: number;
  isConnected: boolean;
}

export default function StatusBar({ 
  language, 
  isExecuting, 
  hasError,
  line,
  column,
  isConnected
}: StatusBarProps) {
  const themeClasses = useThemeClasses();

  return (
    <div className={cn(
      "h-7 flex items-center justify-between px-6 text-[9px] font-black uppercase tracking-[0.2em] select-none border-t shadow-2xl relative z-[100]",
      isExecuting ? "bg-cyan-600 text-white" : cn(themeClasses.bgSecondary, themeClasses.textTertiary, themeClasses.border)
    )}>
      <div className="flex items-center gap-6 h-full">
        {/* Connection Status */}
        <div className="flex items-center gap-2 group cursor-help">
          <div className={cn(
            "w-2 h-2 rounded-full ring-4 transition-all duration-500",
            isConnected 
              ? "bg-green-400 ring-green-400/20 animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]" 
              : "bg-gray-600 ring-gray-600/10"
          )} />
          <span className={cn("transition-colors", isExecuting ? "text-white" : cn("group-hover:text-cyan-500", themeClasses.textTertiary))}>
            {isConnected ? 'System Live' : 'Offline Engine'}
          </span>
        </div>

        {/* Git Branch */}
        <div className={cn("flex items-center gap-2 cursor-pointer transition-colors px-1 group", isExecuting ? "text-white" : cn("hover:text-cyan-500", themeClasses.textTertiary))}>
          <GitBranch size={12} className="opacity-40 group-hover:opacity-100 transition-opacity" />
          <span>production</span>
        </div>

        {/* Execution State */}
        {isExecuting && (
          <div className="flex items-center gap-2 px-3 bg-white/20 rounded-full h-5">
            <Activity size={10} className="animate-spin" strokeWidth={3} />
            <span className="font-black">Compiling Stream</span>
          </div>
        )}

        {hasError && !isExecuting && (
          <div className="flex items-center gap-2 text-red-400 px-1 animate-pulse">
            <AlertCircle size={12} strokeWidth={3} />
            <span>Trace Failed</span>
          </div>
        )}

        {!hasError && !isExecuting && isConnected && (
          <div className="flex items-center gap-2 text-green-500 px-1 opacity-60">
            <CheckCircle2 size={12} />
            <span>Engine Ready</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-6 h-full">
        {/* Editor Cursor Position */}
        <div className={cn("flex items-center gap-4", isExecuting ? "text-white" : themeClasses.textTertiary)}>
          <div className="flex items-center gap-1">
            <span className="opacity-40">Ln</span> {line}
          </div>
          <div className="flex items-center gap-1">
            <span className="opacity-40">Col</span> {column}
          </div>
        </div>

        <div className={cn("w-px h-3", isExecuting ? "bg-white/20" : themeClasses.border)} />

        {/* Language Selection */}
        <div className={cn("flex items-center gap-2 cursor-pointer transition-colors group", isExecuting ? "text-white" : cn("hover:text-cyan-500", themeClasses.textTertiary))}>
          <Code2 size={12} className={cn("transition-colors", isExecuting ? "text-white" : "text-cyan-500/60 group-hover:text-cyan-400")} strokeWidth={3} />
          <span>{language}</span>
        </div>

        {/* Wifi/Network */}
        <div className="flex items-center">
          <Wifi size={12} className={cn("transition-all", isConnected ? (isExecuting ? "text-white" : "text-cyan-500 shadow-glow") : "text-gray-600")} strokeWidth={3} />
        </div>
      </div>
    </div>
  );
}
