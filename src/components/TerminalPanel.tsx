'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import 'xterm/css/xterm.css';
import {
  X, Trash2, Command, Wifi, WifiOff, Square, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const EXEC_WS_URL = 'ws://localhost:8765';
const EXEC_HTTP_URL = 'http://localhost:8765';

type ServerStatus = 'checking' | 'connected' | 'offline';
type RunStatus    = 'idle' | 'compiling' | 'running' | 'done';

interface TerminalPanelProps {
  onClose: () => void;
  /** Batch fallback: for non-interactive commands ("run", "ls", etc.) */
  onRunCommand: (cmd: string) => Promise<string>;
  /** IDE calls this with a fn it can invoke to trigger a run imperatively */
  onRegisterRunTrigger?: (fn: () => void) => void;
  /** Called when the user types "run" in interactive mode — provides code+language */
  activeCode?: string;
  activeLanguage?: string;
}

export default function TerminalPanel({
  onClose, onRunCommand, activeCode, activeLanguage, onRegisterRunTrigger,
}: TerminalPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const xtermRef     = useRef<Terminal | null>(null);
  const fitAddonRef  = useRef<FitAddon | null>(null);
  const wsRef        = useRef<WebSocket | null>(null);
  const isMounted    = useRef(true);
  const inputLineRef = useRef('');
  const isInteractiveRef = useRef(false); // true while a process is running

  const [serverStatus, setServerStatus] = useState<ServerStatus>('checking');
  const [runStatus,    setRunStatus]    = useState<RunStatus>('idle');

  // ── Write helpers ───────────────────────────────────────────────────────────
  const write  = useCallback((s: string) => xtermRef.current?.write(s),  []);
  const writeln = useCallback((s: string) => xtermRef.current?.writeln(s), []);
  const prompt = useCallback(() => {
    if (!isInteractiveRef.current) write('\r\n\x1b[1;34m➜ \x1b[0m ');
  }, [write]);

  // ── Check if exec server is reachable ──────────────────────────────────────
  const checkServer = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(EXEC_HTTP_URL, { signal: AbortSignal.timeout(1500) });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  // ── Connect WebSocket ───────────────────────────────────────────────────────
  const connectWS = useCallback((): Promise<WebSocket | null> => {
    return new Promise((resolve) => {
      try {
        const ws = new WebSocket(EXEC_WS_URL);
        ws.onopen  = () => resolve(ws);
        ws.onerror = () => resolve(null);
        ws.onclose = () => {
          if (isMounted.current) setServerStatus('offline');
        };
      } catch {
        resolve(null);
      }
    });
  }, []);

  // ── Initialise xterm ───────────────────────────────────────────────────────
  useEffect(() => {
    isMounted.current = true;

    const term = new Terminal({
      cursorBlink:  true,
      fontSize:     13,
      fontFamily:   'JetBrains Mono, Cascadia Code, Menlo, monospace',
      letterSpacing: 0,
      lineHeight:   1.35,
      theme: {
        background:         '#0a0a0c',
        foreground:         '#d1d5db',
        cursor:             '#f97316',
        cursorAccent:       '#0a0a0c',
        selectionBackground:'rgba(249,115,22,0.25)',
        black:              '#1e1e2e',
        red:                '#f38ba8',
        green:              '#a6e3a1',
        yellow:             '#f9e2af',
        blue:               '#89b4fa',
        magenta:            '#cba6f7',
        cyan:               '#89dceb',
        white:              '#cdd6f4',
        brightBlack:        '#585b70',
        brightWhite:        '#ffffff',
      },
      convertEol:         true,
      scrollback:         2000,
      allowProposedApi:   true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    const mountTimer = setTimeout(async () => {
      if (!isMounted.current || !containerRef.current) return;

      try {
        term.open(containerRef.current);
        xtermRef.current   = term;
        fitAddonRef.current = fitAddon;

        if (containerRef.current.offsetWidth > 0) fitAddon.fit();

        // ── Startup banner ─────────────────────────────────────────────────
        term.writeln('\x1b[1;33m ◆  CodeVisualizer Terminal\x1b[0m');
        term.write('\x1b[2m Checking for interactive exec server...\x1b[0m');

        const online = await checkServer();
        if (!isMounted.current) return;

        if (online) {
          const ws = await connectWS();
          if (ws && isMounted.current) {
            wsRef.current = ws;
            setServerStatus('connected');
            term.write('\r\x1b[K'); // clear the "checking..." line
            term.writeln(' \x1b[32m● Interactive mode active\x1b[0m  \x1b[2m(local exec server connected)\x1b[0m');
            term.writeln(' \x1b[2mType  \x1b[32mrun\x1b[0m\x1b[2m  to execute your active file · \x1b[0m\x1b[2mInput typed here goes directly to your program.\x1b[0m\r\n');

            // Register the run trigger so IDE.tsx Run button works
            if (onRegisterRunTrigger) {
              onRegisterRunTrigger(() => {
                const codeToRun = activeCode || '';
                const lang      = activeLanguage || 'python';
                if (!codeToRun.trim()) {
                  term.writeln('\x1b[31m✗ No code to run. Open a file in the editor.\x1b[0m');
                  return;
                }
                if (ws.readyState === WebSocket.OPEN) {
                  term.writeln(`\x1b[2m▶ Running ${lang}…\x1b[0m\r\n`);
                  ws.send(JSON.stringify({ type: 'run', code: codeToRun, language: lang }));
                }
              });
            }

            // ── Handle messages from exec server ───────────────────────────
            ws.onmessage = (event) => {
              if (!isMounted.current) return;
              let msg: any;
              try { msg = JSON.parse(event.data); } catch { return; }

              switch (msg.type) {
                case 'status':
                  if (msg.status === 'starting') {
                    setRunStatus('compiling');
                    isInteractiveRef.current = true;
                  } else if (msg.status === 'running') {
                    setRunStatus('running');
                  }
                  break;

                case 'stdout':
                  // stdout goes directly to terminal (shows prompts etc.)
                  term.write(msg.data.replace(/\n/g, '\r\n'));
                  break;

                case 'stderr':
                  term.write('\x1b[31m' + msg.data.replace(/\n/g, '\r\n') + '\x1b[0m');
                  break;

                case 'compile_error':
                  setRunStatus('done');
                  isInteractiveRef.current = false;
                  term.write('\r\n\x1b[31m✗ Compilation failed:\x1b[0m\r\n');
                  term.write('\x1b[31m' + (msg.message || '').replace(/\n/g, '\r\n') + '\x1b[0m');
                  term.write('\r\n');
                  prompt();
                  break;

                case 'error':
                  setRunStatus('done');
                  isInteractiveRef.current = false;
                  term.write('\r\n\x1b[31m✗ Error: ' + (msg.message || 'unknown') + '\x1b[0m\r\n');
                  prompt();
                  break;

                case 'exit':
                  setRunStatus('done');
                  isInteractiveRef.current = false;
                  if (msg.code === 0) {
                    term.write('\r\n\x1b[2m━━ Process exited (success) ━━\x1b[0m\r\n');
                  } else {
                    term.write(`\r\n\x1b[31m━━ Process exited (code ${msg.code ?? '?'}) ━━\x1b[0m\r\n`);
                  }
                  prompt();
                  break;
              }
            };
          } else {
            setServerStatus('offline');
            showFallbackBanner(term);
          }
        } else {
          setServerStatus('offline');
          term.write('\r\x1b[K');
          showFallbackBanner(term);
        }

        // ── Input handler ──────────────────────────────────────────────────
        term.onData((data: string) => {
          if (!isMounted.current) return;
          const code = data.charCodeAt(0);

          // ── Interactive mode: pipe all keystrokes directly to process ────
          if (isInteractiveRef.current) {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              // Send keystroke to backend process stdin
              wsRef.current.send(JSON.stringify({ type: 'stdin', data }));
            }
            // Echo the character (process sees it, user sees it)
            if (code === 13) {
              term.write('\r\n');
            } else if (code === 127) {
              term.write('\b \b');
            } else {
              term.write(data);
            }
            return;
          }

          // ── Command mode (no process running) ─────────────────────────
          if (code === 13) { // Enter
            term.write('\r\n');
            const cmd = inputLineRef.current.trim();
            inputLineRef.current = '';
            handleCommand(cmd, term);
          } else if (code === 127) { // Backspace
            if (inputLineRef.current.length > 0) {
              inputLineRef.current = inputLineRef.current.slice(0, -1);
              term.write('\b \b');
            }
          } else if (code === 3) { // Ctrl+C
            inputLineRef.current = '';
            term.write('^C\r\n');
            prompt();
          } else {
            inputLineRef.current += data;
            term.write(data);
          }
        });

        prompt();
      } catch (e) {
        console.warn('[TerminalPanel] init error:', e);
      }
    }, 100);

    // ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      if (!isMounted.current || !fitAddonRef.current) return;
      requestAnimationFrame(() => {
        try { fitAddonRef.current?.fit(); } catch {}
      });
    });
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    return () => {
      isMounted.current = false;
      clearTimeout(mountTimer);
      resizeObserver.disconnect();
      wsRef.current?.close();
      try { xtermRef.current?.dispose(); } catch {}
      xtermRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fallback banner (offline mode) ─────────────────────────────────────────
  function showFallbackBanner(term: Terminal) {
    term.writeln(' \x1b[33m● Offline mode\x1b[0m  \x1b[2m(batch stdin only — exec server not running)\x1b[0m');
    term.writeln(' \x1b[2mStart the interactive server: \x1b[32mnpm run exec-server\x1b[0m\r\n');
  }

  // ── Command handler (offline / utility commands) ───────────────────────────
  const handleCommand = useCallback(async (cmd: string, term: Terminal) => {
    if (!cmd) { prompt(); return; }

    if (cmd === 'clear' || cmd === 'cls') {
      term.clear(); prompt(); return;
    }
    if (cmd === 'help') {
      term.writeln('\x1b[1mAvailable commands:\x1b[0m');
      term.writeln('  \x1b[32mrun\x1b[0m          Execute the active editor file');
      term.writeln('  \x1b[32mkill\x1b[0m         Kill the running process');
      term.writeln('  \x1b[32mls\x1b[0m           List files in workspace');
      term.writeln('  \x1b[32mclear\x1b[0m        Clear terminal');
      term.writeln('  \x1b[32mhelp\x1b[0m         Show this help');
      prompt(); return;
    }
    if (cmd === 'kill') {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'kill' }));
      }
      prompt(); return;
    }
    if (cmd === 'run') {
      if (serverStatus === 'connected' && wsRef.current?.readyState === WebSocket.OPEN) {
        // Interactive run via WebSocket
        const code = activeCode || '';
        const lang = activeLanguage || 'python';
        if (!code.trim()) {
          term.writeln('\x1b[31m✗ No code to run. Open a file in the editor first.\x1b[0m');
          prompt(); return;
        }
        term.writeln(`\x1b[2m▶ Running ${lang} (interactive mode)...\x1b[0m\r\n`);
        wsRef.current.send(JSON.stringify({ type: 'run', code, language: lang }));
        return; // Don't call prompt — process will call it on exit
      } else {
        // Batch fallback
        term.writeln('\x1b[33m⚡ Running in batch mode (stdin from Stdin box)...\x1b[0m');
        try {
          const output = await onRunCommand('run');
          term.writeln(output || '(no output)');
        } catch (e: any) {
          term.writeln('\x1b[31m✗ ' + e.message + '\x1b[0m');
        }
        prompt(); return;
      }
    }
    if (cmd === 'ls') {
      try {
        const output = await onRunCommand('ls');
        term.writeln(output);
      } catch {}
      prompt(); return;
    }

    // Default: try batch fallback
    try {
      const output = await onRunCommand(cmd);
      term.writeln(output);
    } catch {
      term.writeln(`\x1b[31mUnknown command: ${cmd}. Type "help" for available commands.\x1b[0m`);
    }
    prompt();
  }, [serverStatus, activeCode, activeLanguage, onRunCommand, prompt]);

  // ── Kill button ─────────────────────────────────────────────────────────────
  const handleKill = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'kill' }));
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0a0c]">
      {/* Header */}
      <div className="px-4 py-1.5 border-b border-gray-800/50 flex items-center justify-between bg-black/20 shrink-0">
        <div className="flex items-center gap-3">
          <Command size={12} className="text-orange-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Terminal</span>

          {/* Server status badge */}
          <div className={cn(
            'flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border',
            serverStatus === 'connected' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
            serverStatus === 'offline'   ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
                                           'bg-gray-500/10 border-gray-500/20 text-gray-500',
          )}>
            {serverStatus === 'checking'  && <Loader2 size={8} className="animate-spin" />}
            {serverStatus === 'connected' && <Wifi size={8} />}
            {serverStatus === 'offline'   && <WifiOff size={8} />}
            {serverStatus === 'checking'  ? 'Checking' : serverStatus === 'connected' ? 'Interactive' : 'Batch Mode'}
          </div>

          {/* Run status */}
          {runStatus !== 'idle' && runStatus !== 'done' && (
            <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-wider text-orange-400">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              {runStatus === 'compiling' ? 'Compiling…' : 'Running…'}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {(runStatus === 'compiling' || runStatus === 'running') && (
            <button
              onClick={handleKill}
              title="Kill process"
              className="flex items-center gap-1 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-lg text-[9px] font-black text-red-400 hover:bg-red-500/20 transition-all"
            >
              <Square size={9} /> Kill
            </button>
          )}
          <button onClick={() => xtermRef.current?.clear()} className="text-gray-600 hover:text-white transition-colors p-1" title="Clear">
            <Trash2 size={12} />
          </button>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors p-1" title="Close">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* xterm.js container */}
      <div ref={containerRef} className="flex-1 p-2 overflow-hidden min-h-0" />
    </div>
  );
}
