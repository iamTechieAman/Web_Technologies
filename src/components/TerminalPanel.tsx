'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import 'xterm/css/xterm.css';
import { X, Trash2, Command } from 'lucide-react';

interface TerminalPanelProps {
  onClose: () => void;
  onRunCommand: (cmd: string) => Promise<string>;
}

export default function TerminalPanel({ onClose, onRunCommand }: TerminalPanelProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    
    // 1. Initialize Terminal instance immediately but don't open yet
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 12,
      fontFamily: 'JetBrains Mono, Menlo, monospace',
      theme: {
        background: '#0a0a0c',
        foreground: '#d1d5db',
        cursor: '#f97316',
      },
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    // 2. Delayed mounting to ensure DOM is ready and resizable-panels have finished animating
    const mountTimer = setTimeout(() => {
      if (!isMounted.current || !terminalRef.current) return;

      try {
        term.open(terminalRef.current);
        
        term.writeln('\x1b[1;33mWelcome to CodeVisualizer Mock Terminal v1.0\x1b[0m');
        term.writeln('Type \x1b[32m"help"\x1b[0m to see available commands.\n');
        term.write('\x1b[1;34m➜ \x1b[0m ');

        let currentCommand = '';
        term.onData(async (data: string) => {
          if (!isMounted.current) return;
          const code = data.charCodeAt(0);
          if (code === 13) { // Enter
            term.write('\n');
            const cmd = currentCommand.trim().toLowerCase();
            if (cmd === 'clear' || cmd === 'cls') {
              term.clear();
            } else if (cmd === 'help') {
              term.writeln('Available commands: help, clear, run, ls, python, node');
            } else if (cmd) {
              term.writeln(`Executing: ${cmd}...`);
              const output = await onRunCommand(cmd);
              term.writeln(output);
            }
            currentCommand = '';
            term.write('\x1b[1;34m➜ \x1b[0m ');
          } else if (code === 127) { // Backspace
            if (currentCommand.length > 0) {
              currentCommand = currentCommand.slice(0, -1);
              term.write('\b \b');
            }
          } else {
            currentCommand += data;
            term.write(data);
          }
        });

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        // Perform initial fit
        if (terminalRef.current.offsetWidth > 0) {
          fitAddon.fit();
        }
      } catch (e) {
        console.warn('Xterm initialization suppressed:', e);
      }
    }, 100);

    // 3. Robust ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      if (!isMounted.current || !xtermRef.current || !fitAddonRef.current) return;
      
      requestAnimationFrame(() => {
        try {
          const entry = entries[0];
          if (entry && entry.contentRect.width > 0 && entry.contentRect.height > 0) {
            fitAddonRef.current?.fit();
          }
        } catch (e) {
          // Ignore transient fit errors during unmount/resize
        }
      });
    });

    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    return () => {
      isMounted.current = false;
      clearTimeout(mountTimer);
      resizeObserver.disconnect();
      
      if (xtermRef.current) {
        try {
          xtermRef.current.dispose();
        } catch (e) {}
        xtermRef.current = null;
      }
    };
  }, [onRunCommand]);

  return (
    <div className="h-full flex flex-col bg-[#0a0a0c]">
      <div className="px-4 py-1.5 border-b border-gray-800/50 flex items-center justify-between bg-black/20">
        <div className="flex items-center gap-2">
          <Command size={12} className="text-orange-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Integrated Terminal</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => xtermRef.current?.clear()} className="text-gray-600 hover:text-white transition-colors">
            <Trash2 size={12} />
          </button>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>
      <div ref={terminalRef} className="flex-1 p-2 overflow-hidden" />
    </div>
  );
}
