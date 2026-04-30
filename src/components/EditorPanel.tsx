'use client';
import React from 'react';
import Editor from '@monaco-editor/react';
import {
  Play, Save, Settings,
  Loader2, Zap, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileNode } from '@/types';
import { motion } from 'framer-motion';

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
}

export default function EditorPanel({
  activeFile, openTabs, files, onTabClick, onTabClose,
  onCodeChange, onSave, onRun, loading,
}: EditorPanelProps) {

  const getFileById = (id: string): FileNode | null => {
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

      {/* Tabs bar */}
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
                'group flex items-center gap-3 px-4 h-8 cursor-pointer transition-all rounded-xl text-[10px] font-black uppercase tracking-widest relative overflow-hidden min-w-[140px]',
                isActive ? 'text-orange-500 bg-orange-500/10' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5',
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

      {/* Toolbar */}
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-black/40 backdrop-blur-3xl z-10">
        <div className="flex items-center gap-4">
          {/* Run button */}
          <button
            onClick={onRun}
            disabled={loading || !activeFile}
            className={cn(
              'group flex items-center gap-3 px-6 py-2 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden',
              loading
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-orange-500 text-white hover:bg-orange-600 hover:shadow-[0_0_30px_rgba(249,115,22,0.3)] active:scale-95 shadow-xl shadow-orange-500/20',
            )}
          >
            {loading
              ? <Loader2 size={14} className="animate-spin" />
              : <Play size={14} className="fill-current group-hover:scale-110 transition-transform" />}
            <span>{loading ? 'Executing' : 'Run'}</span>
          </button>

          <p className="text-[9px] text-gray-700 font-bold uppercase tracking-widest hidden sm:block">
            ⌘+Enter to run · type in terminal
          </p>
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

      {/* Monaco editor */}
      <div className="flex-1 relative overflow-hidden">
        {activeFile ? (
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
              scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
              lineNumbersMinChars: 4,
              glyphMargin: true,
              folding: true,
              lineDecorationsWidth: 10,
            }}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-[#050507] h-full">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative mb-12"
            >
              <div className="absolute inset-0 bg-orange-500/20 blur-[100px] rounded-full animate-pulse" />
              <div className="relative w-28 h-28 bg-gradient-to-br from-orange-500/10 to-red-600/10 rounded-[2.5rem] border border-orange-500/20 flex items-center justify-center shadow-2xl">
                <Zap size={48} className="text-orange-500 animate-pulse" />
              </div>
            </motion.div>
            <h2 className="text-2xl font-black text-white mb-3">Open a File to Begin</h2>
            <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
              Select a file from the explorer, or create a new one to start coding.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
