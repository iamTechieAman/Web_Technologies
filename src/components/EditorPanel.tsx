'use client';
import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { 
  Play, Save, Settings, ChevronDown, ChevronUp, 
  Terminal as TerminalIcon, Loader2, Sparkles, Zap,
  X, Keyboard, MousePointer2, Info, Layout
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileNode, SupportedLanguage } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface EditorPanelProps {
  activeFile: FileNode | null;
  openTabs: string[];
  files: FileNode[];
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
  onCodeChange: (newCode: string) => void;
  onSave: () => void;
  onRun: () => void;
  loading: boolean;
  stdin: string;
  setStdin: (val: string) => void;
}

export default function EditorPanel({
  activeFile, openTabs, files, onTabClick, onTabClose, onCodeChange, onSave, onRun, loading, stdin, setStdin
}: EditorPanelProps) {
  const [showStdin, setShowStdin] = useState(false);

  const getFileById = (id: string) => {
    const find = (nodes: FileNode[]): FileNode | null => {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
          const found = find(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    return find(files);
  };

  return (
    <div className="h-full flex flex-col bg-[#050507] relative overflow-hidden">
      {/* Premium Tabs Bar */}
      <div className="h-11 bg-[#0d0d10] border-b border-white/5 flex items-center px-3 overflow-x-auto custom-scrollbar no-scrollbar gap-1">
        {openTabs.map(tabId => {
          const file = getFileById(tabId);
          if (!file) return null;
          const isActive = activeFile?.id === tabId;
          return (
            <motion.div 
              key={tabId}
              layoutId={`tab-${tabId}`}
              onClick={() => onTabClick(tabId)}
              className={cn(
                "group flex items-center gap-3 px-4 h-8 cursor-pointer transition-all rounded-xl text-[10px] font-black uppercase tracking-widest relative overflow-hidden min-w-[140px]",
                isActive ? "text-orange-500 bg-orange-500/10" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
              )}
            >
              {isActive && (
                <motion.div 
                  layoutId="activeTabGlow"
                  className="absolute inset-0 border border-orange-500/30 rounded-xl"
                />
              )}
              <span className="truncate flex-1 relative z-10">{file.name}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); onTabClose(tabId); }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded-lg transition-all relative z-10"
              >
                <X size={10} />
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Editor Toolbar */}
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-black/40 backdrop-blur-3xl z-10">
        <div className="flex items-center gap-6">
          <button 
            onClick={onRun}
            disabled={loading || !activeFile}
            className={cn(
              "group flex items-center gap-3 px-6 py-2 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden",
              loading 
                ? "bg-gray-800 text-gray-500 cursor-not-allowed" 
                : "bg-orange-500 text-white hover:bg-orange-600 hover:shadow-[0_0_30px_rgba(249,115,22,0.3)] active:scale-95 shadow-xl shadow-orange-500/20"
            )}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} className="fill-current group-hover:scale-110 transition-transform" />}
            <span>{loading ? 'Executing' : 'Run Project'}</span>
          </button>

          <div className="h-6 w-px bg-white/5" />

          <button 
            onClick={() => setShowStdin(!showStdin)}
            className={cn(
              "flex items-center gap-3 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border group",
              showStdin ? "bg-white/10 border-white/20 text-white shadow-inner" : "border-white/5 text-gray-500 hover:text-white hover:border-white/10"
            )}
          >
            <TerminalIcon size={14} className={cn("transition-colors", showStdin ? "text-orange-500" : "text-gray-600 group-hover:text-gray-400")} />
            Stdin
            {showStdin ? <ChevronUp size={12} className="opacity-40" /> : <ChevronDown size={12} className="opacity-40" />}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-white/[0.03] rounded-2xl border border-white/5">
            <button onClick={onSave} className="p-2.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all" title="Save (⌘S)">
              <Save size={16} />
            </button>
            <button className="p-2.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all">
              <Settings size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {activeFile ? (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 relative">
              <Editor
                theme="vs-dark"
                language={activeFile.language || 'javascript'}
                value={activeFile.content || ''}
                onChange={(val) => onCodeChange(val || '')}
                options={{
                  minimap: { enabled: true },
                  fontSize: 14,
                  fontFamily: 'JetBrains Mono, Menlo, monospace',
                  fontLigatures: true,
                  cursorBlinking: 'smooth',
                  smoothScrolling: true,
                  contextmenu: true,
                  padding: { top: 24, bottom: 24 },
                  scrollbar: {
                    verticalScrollbarSize: 8,
                    horizontalScrollbarSize: 8,
                  },
                  lineNumbersMinChars: 4,
                  glyphMargin: true,
                  folding: true,
                  lineDecorationsWidth: 10,
                }}
              />
            </div>
            
            {/* Premium Collapsible stdin */}
            <AnimatePresence>
              {showStdin && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 160, opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-[#0d0d10] border-t border-white/5 flex flex-col overflow-hidden glass-panel"
                >
                  <div className="px-6 h-10 flex items-center justify-between border-b border-white/[0.03]">
                    <div className="flex items-center gap-3">
                      <TerminalIcon size={12} className="text-orange-500" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Standard Input Console</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setStdin('')} className="text-[9px] text-gray-600 hover:text-orange-500 uppercase font-black tracking-widest transition-colors">Clear Input</button>
                      <button onClick={() => setShowStdin(false)} className="text-gray-600 hover:text-white transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  <textarea 
                    value={stdin}
                    onChange={(e) => setStdin(e.target.value)}
                    placeholder="Enter input tokens (space or newline separated)..."
                    className="flex-1 bg-transparent p-6 text-xs font-mono text-gray-300 resize-none focus:outline-none custom-scrollbar placeholder:text-gray-800"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-[#050507]">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative mb-12"
            >
              <div className="absolute inset-0 bg-orange-500/20 blur-[100px] rounded-full animate-pulse-soft" />
              <div className="relative w-28 h-28 bg-gradient-to-br from-orange-500/10 to-red-600/10 rounded-[2.5rem] border border-orange-500/20 flex items-center justify-center shadow-2xl">
                <Zap size={48} className="text-orange-500 animate-pulse" />
              </div>
            </motion.div>
            
            <h2 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter italic premium-gradient-text">
              CodeVisualizer
            </h2>
            <p className="text-gray-500 max-w-sm text-sm font-medium leading-relaxed mb-12 uppercase tracking-widest opacity-60">
              Elite Workspace for Algorithm Mastery
            </p>
            
            <div className="grid grid-cols-2 gap-6">
              <KbdShortcut keys={['⌘', 'N']} label="New Node" icon={<Layout size={12} />} />
              <KbdShortcut keys={['⌘', 'P']} label="Search" icon={<MousePointer2 size={12} />} />
              <KbdShortcut keys={['F5']} label="Run Trace" icon={<Play size={12} />} />
              <KbdShortcut keys={['⌃', '`']} label="Console" icon={<TerminalIcon size={12} />} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function KbdShortcut({ keys, label, icon }: { keys: string[], label: string, icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 bg-white/[0.02] px-5 py-4 rounded-3xl border border-white/5 hover:border-white/10 transition-all group cursor-default">
      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-gray-600 group-hover:text-orange-500 transition-colors">
        {icon}
      </div>
      <div className="flex flex-col items-start gap-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-gray-300 transition-colors">{label}</span>
        <div className="flex gap-1.5">
          {keys.map(k => (
            <kbd key={k} className="bg-black/40 text-gray-400 px-2 py-0.5 rounded-lg text-[9px] font-black border border-white/5 min-w-[24px] text-center">{k}</kbd>
          ))}
        </div>
      </div>
    </div>
  );
}
