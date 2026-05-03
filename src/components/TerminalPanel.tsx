'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import 'xterm/css/xterm.css';
import { X, Trash2, Command, Copy, Check, Keyboard, Play, AlertCircle, Sparkles as SparklesIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExecutionResult } from '@/types';
import { useTheme, useThemeClasses } from '@/context/ThemeContext';

interface TerminalPanelProps {
  onClose: () => void;
  result: ExecutionResult | null;
  loading: boolean;
  runTriggerTick?: number;
  language?: string;
  code?: string;
  onStdinChange?: (stdin: string) => void;
  initialStdin?: string;
}

type TerminalProtocol = 'pty' | 'exec';

export default function TerminalPanel({
  onClose, result, loading, runTriggerTick, language, code, onStdinChange, initialStdin = ''
}: TerminalPanelProps) {
  const { colors, isDark } = useTheme();
  const themeClasses = useThemeClasses();
  const containerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const isMounted = useRef(true);
  const [copied, setCopied] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showStdin, setShowStdin] = useState(false);
  const [localStdin, setLocalStdin] = useState(initialStdin);
  const protocolRef = useRef<TerminalProtocol>('pty');
  const queuedRunTick = useRef(0);
  const ptyUnavailableRef = useRef(false);

  const WS_URL = process.env.NEXT_PUBLIC_WS_SERVER_URL || 'ws://localhost:5001';

  const connectToPty = useCallback((): void => {
    if (ptyUnavailableRef.current) {
      setShowStdin(true);
      return;
    }

    if (wsRef.current) wsRef.current.close();

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      if (xtermRef.current) {
        xtermRef.current.reset();
        xtermRef.current.write('\x1b[2J\x1b[H'); // Clear and home
        
        if (code && language) {
          protocolRef.current = WS_URL.includes(':5001') ? 'pty' : 'exec';
          ws.send(JSON.stringify({
            type: protocolRef.current === 'pty' ? 'start' : 'run',
            language: language.toLowerCase(),
            code,
            stdin: localStdin,
            cols: xtermRef.current.cols,
            rows: xtermRef.current.rows
          }));
        }
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if ((msg.type === 'output' || msg.type === 'stdout') && xtermRef.current) {
          xtermRef.current.write(msg.data);
          xtermRef.current.scrollToBottom();
        } else if (msg.type === 'stderr' && xtermRef.current) {
          xtermRef.current.write(`\x1b[31m${msg.data}\x1b[0m`);
          xtermRef.current.scrollToBottom();
        } else if (msg.type === 'exit') {
          setIsConnected(false);
          if (xtermRef.current) {
            xtermRef.current.writeln(`\r\n\x1b[33mProcess exited with code ${msg.exitCode ?? msg.code ?? 0}\x1b[0m`);
          }
        }
      } catch (e) {
        // Fallback for raw data if not JSON
        if (xtermRef.current) xtermRef.current.write(event.data);
      }
    };

    ws.onerror = () => {
      ptyUnavailableRef.current = true;
      setIsConnected(false);
      setShowStdin(true);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };
  }, [WS_URL, code, language, localStdin]);

  // Initialize xterm
  useEffect(() => {
    isMounted.current = true;

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      fontSize: 12,
      fontFamily: 'JetBrains Mono, Menlo, monospace',
      convertEol: true,
      disableStdin: false,
      allowTransparency: true,
      theme: { 
        background: 'transparent',
        foreground: colors.textPrimary,
        cursor: colors.accent,
        selectionBackground: 'rgba(6, 182, 212, 0.3)',
      }
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    setTimeout(() => {
      if (!containerRef.current || !isMounted.current) return;
      try {
        term.open(containerRef.current);
        xtermRef.current = term;
        fitAddonRef.current = fitAddon;
        
        term.onData(data => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: protocolRef.current === 'pty' ? 'input' : 'stdin',
              data
            }));
          } else {
            // Echo input in batch mode? No, batch mode is stdin-based.
          }
        });

        setTimeout(() => { 
          if (containerRef.current && containerRef.current.clientHeight > 0) {
            try { fitAddon.fit(); } catch {} 
          }
        }, 100);
      } catch {
        return;
      }
      term.writeln('\x1b[36m⚡ CodeVisualizer Terminal v4.0\x1b[0m');
      term.writeln('\x1b[90mSYSTEM: PTY Environment Active • Ready for execution\x1b[0m');
      setIsReady(true);
    }, 100);

    const resizeObs = new ResizeObserver(() => {
      if (fitAddonRef.current && xtermRef.current && containerRef.current && containerRef.current.clientHeight > 0) {
        try { 
          fitAddonRef.current.fit(); 
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'resize',
              cols: xtermRef.current.cols,
              rows: xtermRef.current.rows
            }));
          }
        } catch (e) {}
      }
    });
    if (containerRef.current) resizeObs.observe(containerRef.current);

    return () => {
      isMounted.current = false;
      resizeObs.disconnect();
      xtermRef.current?.dispose();
      if (wsRef.current) wsRef.current.close();
    };
  }, [colors.accent, colors.textPrimary]);

  useEffect(() => {
    setLocalStdin(initialStdin);
  }, [initialStdin]);

  // Handle run triggers
  useEffect(() => {
    if (!isReady) return;
    if (runTriggerTick && runTriggerTick > 0 && runTriggerTick !== queuedRunTick.current) {
      queuedRunTick.current = runTriggerTick;
      connectToPty();
    }
  }, [runTriggerTick, isReady, connectToPty]);

  // Batch fallback display
  useEffect(() => {
    if (!isReady || isConnected) return;
    if (result && xtermRef.current && !loading) {
      xtermRef.current.reset();
      xtermRef.current.write('\x1b[2J\x1b[H'); // Clear and home
      
      // Compact high-density output
      const lines = [];
      const stdout = result.run?.stdout || '';
      const stderr = result.run?.stderr || result.error || '';
      if (stdout) lines.push(stdout.trim());
      if (stderr) lines.push(`\x1b[31m${stderr.trim()}\x1b[0m`);
      
      xtermRef.current.write(lines.join('\r\n'));
      xtermRef.current.write(`\r\n\x1b[32m[Batch Mode] Process exited: ${result.run?.code ?? (result.success ? 0 : 1)}\x1b[0m\r\n`);
      
      if (ptyUnavailableRef.current) {
        xtermRef.current.write('\x1b[90mNote: Interactive PTY unavailable; used batch fallback.\x1b[0m');
      }
    }
  }, [result, loading, isReady, isConnected]);

  const copyTerminal = (): void => {
    const buffer = xtermRef.current?.buffer.active;
    if (!buffer) return;

    let text = '';
    for (let i = 0; i < buffer.length; i++) {
      const line = buffer.getLine(i);
      if (line) text += line.translateToString(true) + '\n';
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearTerminal = (): void => {
    if (xtermRef.current) {
      xtermRef.current.reset();
      xtermRef.current.write('\x1b[2J\x1b[H');
      xtermRef.current.writeln('\x1b[36mCodeVisualizer Terminal\x1b[0m');
    }
  };

  const handleStdinChangeInternal = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalStdin(val);
    onStdinChange?.(val);
  };

  return (
    <div className={cn("h-full flex flex-col overflow-hidden relative group", isDark ? "bg-black/40" : "bg-white")}>
      {/* Floating Action Controls - Minimalist approach */}
      <div className="absolute top-2 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={copyTerminal}
          className={cn(
            "p-1.5 border rounded-lg transition-all backdrop-blur-md",
            isDark ? "bg-[#141725]/80 border-white/5 text-gray-500 hover:text-white" : "bg-white/90 border-gray-200 text-gray-400 hover:text-gray-900"
          )}
          title="Copy output"
        >
          {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12}/>}
        </button>
        <button 
          onClick={clearTerminal}
          className={cn(
            "p-1.5 border rounded-lg transition-all backdrop-blur-md",
            isDark ? "bg-[#141725]/80 border-white/5 text-gray-500 hover:text-white" : "bg-white/90 border-gray-200 text-gray-400 hover:text-gray-900"
          )}
          title="Clear"
        >
          <Trash2 size={12}/>
        </button>
      </div>

      {/* Stdin Fallback Panel - Unified UI */}
      {showStdin && !isConnected && (
        <div className={cn("border-b shrink-0 backdrop-blur-xl bg-[#0B0D17]/95", themeClasses.border)}>
          <div className={cn("flex items-center justify-between px-4 py-2 border-b bg-white/5", themeClasses.borderSecondary)}>
            <div className="flex items-center gap-3">
              <Keyboard size={12} className="text-cyan-500" />
              <span className={cn("text-[10px] font-black uppercase tracking-widest", themeClasses.textSecondary)}>Program Input (stdin)</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <SparklesIcon size={10} className="text-cyan-500" />
                <span className="text-[9px] font-bold text-cyan-400 uppercase">Input Buffer Active</span>
              </div>
              <button onClick={() => setShowStdin(false)} className={cn(themeClasses.textTertiary, "hover:text-white p-1")}>
                <X size={14} />
              </button>
            </div>
          </div>
          <textarea
            value={localStdin}
            onChange={handleStdinChangeInternal}
            placeholder="Enter input to pre-supply to your program..."
            className={cn(
              "w-full h-24 px-4 py-3 text-[13px] font-mono bg-transparent resize-none focus:outline-none transition-all",
              themeClasses.textSecondary, "placeholder:opacity-30"
            )}
          />
        </div>
      )}

      {/* Terminal Viewport */}
      <div className="flex-1 min-h-0 relative">
        <div ref={containerRef} className="absolute inset-0 px-3 py-2" />
        {!isReady && (
          <div className={cn("absolute inset-0 flex flex-col items-center justify-center gap-4", themeClasses.bg)}>
            <div className="relative w-12 h-12">
              <div className={cn("absolute inset-0 rounded-full border-2 border-t-transparent animate-spin", themeClasses.accentBorder)} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Command size={16} className={themeClasses.accent} />
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-500/40">Initializing Terminal...</span>
          </div>
        )}
      </div>
    </div>
  );
}
