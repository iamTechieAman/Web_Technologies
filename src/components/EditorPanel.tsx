'use client';
import React from 'react';
import Editor from '@monaco-editor/react';
import {
  Play, Save, Settings,
  Loader2, Zap, X, Sparkles as SparklesIcon, Camera, Keyboard
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { FileNode } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme, useThemeClasses } from '@/context/ThemeContext';
import { getLanguageConfig } from '@/lib/languageConfigs';

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
  onStdinChange: (val: string) => void;
  onSelectionChange?: (code: string) => void;
  onChatWithSelection?: () => void;
  onCursorChange?: (line: number, column: number) => void;
}

export default function EditorPanel({
  activeFile, openTabs, files, onTabClick, onTabClose,
  onCodeChange, onSave, onRun, loading, stdin, onStdinChange, onSelectionChange, onChatWithSelection,
  onCursorChange
}: EditorPanelProps) {
  const { isDark } = useTheme();
  const themeClasses = useThemeClasses();
  const [showStdin, setShowStdin] = React.useState(false);
  const [showCmdK, setShowCmdK] = React.useState(false);
  const [cmdKPrompt, setCmdKPrompt] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  
  const editorRef = React.useRef<any>(null);
  const monacoRef = React.useRef<any>(null);
  const cmdKInputRef = React.useRef<HTMLInputElement>(null);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.onDidChangeCursorPosition((e: any) => {
      if (onCursorChange) {
        onCursorChange(e.position.lineNumber, e.position.column);
      }
    });

    editor.onDidChangeCursorSelection(() => {
      const selection = editor.getSelection();
      const model = editor.getModel();
      if (model && selection && onSelectionChange) {
        const text = model.getValueInRange(selection);
        onSelectionChange(text);
      }
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
      setShowCmdK(true);
      setTimeout(() => cmdKInputRef.current?.focus(), 50);
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyL, () => {
      if (onChatWithSelection) onChatWithSelection();
    });
  };

  const executeCmdK = async () => {
    if (!cmdKPrompt.trim() || isGenerating || !editorRef.current) return;
    setIsGenerating(true);
    
    const editor = editorRef.current;
    const model = editor.getModel();
    const selection = editor.getSelection();
    const selectedText = model.getValueInRange(selection);
    
    // We will build a prompt requesting raw code.
    const prompt = `You are an expert coder. Modify the following code according to this instruction: "${cmdKPrompt}". 
Return ONLY the raw code block. No markdown formatting, no explanation.

Code:
${selectedText || model.getValue()}`;

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [{ role: 'user', content: prompt }], 
          context: '',
          mode: 'edit'
        }),
      });

      if (!res.body) throw new Error('No body');
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      
      // If we had a selection, replace it. Otherwise, insert at cursor or replace all.
      // For streaming inline replacement:

      
      // Clear the selection first
      editor.executeEdits('cmd-k', [{
        range: selection.isEmpty() ? model.getFullModelRange() : selection,
        text: '',
        forceMoveMarkers: true
      }]);

      const insertPosition = selection.isEmpty() ? { lineNumber: 1, column: 1 } : selection.getStartPosition();
      let currentLine = insertPosition.lineNumber;
      let currentCol = insertPosition.column;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        // Clean up markdown block if AI still sends it
        const cleanChunk = chunk.replace(/```\w*\n?/g, '').replace(/```/g, '');
        
        editor.executeEdits('cmd-k', [{
          range: new monacoRef.current.Range(currentLine, currentCol, currentLine, currentCol),
          text: cleanChunk,
          forceMoveMarkers: true
        }]);
        
        // Update position for next chunk
        const lines = cleanChunk.split('\n');
        if (lines.length > 1) {
          currentLine += lines.length - 1;
          currentCol = lines[lines.length - 1].length + 1;
        } else {
          currentCol += cleanChunk.length;
        }
      }
    } catch (e) {
      console.error('CmdK Error', e);
    } finally {
      setIsGenerating(false);
      setShowCmdK(false);
      setCmdKPrompt('');
    }
  };

  const handleExportImage = async () => {
    if (!activeFile?.content || isExporting) return;
    setIsExporting(true);
    try {
      const blob = await apiClient.exportToImage({
        code: activeFile.content,
        language: activeFile.language || 'javascript'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${activeFile.name}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed', e);
    } finally {
      setIsExporting(false);
    }
  };

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
    <div className={cn("h-full flex flex-col relative overflow-hidden", themeClasses.bgSurface)}>

      {/* Tabs bar */}
      <div className={cn("h-11 border-b flex items-center px-3 overflow-x-auto custom-scrollbar gap-1", themeClasses.bgSecondary, themeClasses.border)}>
        <AnimatePresence>
          {openTabs.map(tabId => {
            const file = getFileById(tabId);
            if (!file) return null;
            const isActive = activeFile?.id === tabId;
            return (
              <motion.div
                key={tabId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => onTabClick(tabId)}
                className={cn(
                  'group flex items-center gap-2 px-4 h-8 cursor-pointer transition-all rounded-full text-[11px] font-bold relative overflow-hidden min-w-[140px] border',
                  isActive 
                    ? cn(themeClasses.bgSurface, themeClasses.text, "border-cyan-500/30 shadow-[0_0_15px_-5px_rgba(6,182,212,0.4)]")
                    : cn(themeClasses.textTertiary, "hover:text-white border-transparent hover:bg-white/5")
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeTabUnderline"
                    className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-transparent pointer-events-none" 
                  />
                )}
                <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", isActive ? "bg-cyan-500 animate-pulse" : "bg-white/10 group-hover:bg-white/30")} />
                <span className="truncate flex-1 relative z-10">{file.name}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onTabClose(tabId); }}
                  className={cn("opacity-0 group-hover:opacity-100 p-1 rounded-full transition-all relative z-10 hover:bg-red-500/20 hover:text-red-400")}
                >
                  <X size={10} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Toolbar */}
      <div className={cn("h-16 border-b flex items-center justify-between px-6 z-10", themeClasses.border, themeClasses.bgSurface)}>
        <div className="flex items-center gap-4">
          <button
            onClick={onRun}
            disabled={loading}
            className={cn(
              'h-10 px-6 rounded-xl font-black transition-all flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] group relative overflow-hidden',
              loading
                ? cn(themeClasses.bgHover, themeClasses.textTertiary, 'cursor-not-allowed')
                : cn(themeClasses.accentBg, themeClasses.accent, 'hover:scale-[1.02] active:scale-[0.98] border border-cyan-500/20 shadow-xl shadow-cyan-500/10'),
            )}
          >
            {loading
              ? <Loader2 size={16} className="animate-spin" />
              : <Play size={16} className="fill-current group-hover:scale-110 transition-transform" strokeWidth={3} />}
            <span>{loading ? 'Compiling' : 'Run Project'}</span>
            {!loading && <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />}
          </button>

          <div className={cn("h-10 flex items-center rounded-xl border p-1", themeClasses.bgSecondary, themeClasses.border)}>
            <button
              onClick={() => setShowStdin(!showStdin)}
              className={cn(
                'h-full px-4 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all',
                showStdin 
                  ? cn(themeClasses.accentBg, themeClasses.accent, "shadow-sm")
                  : cn(themeClasses.textTertiary, "hover:text-white")
              )}
            >
              Std Input
            </button>
            <div className={cn("w-px h-4 mx-1", themeClasses.border)} />
            <p className={cn("px-3 text-[9px] font-black uppercase tracking-widest hidden md:block opacity-30")}>
              Ctrl + Enter
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={cn("flex items-center gap-1 p-1.5 rounded-xl border", themeClasses.bgSecondary, themeClasses.border)}>
            <button 
              onClick={handleExportImage} 
              disabled={isExporting}
              className={cn("p-2 rounded-lg transition-all relative group", themeClasses.textTertiary, "hover:text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-30")} 
              title="Export Snapshot"
            >
              {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} strokeWidth={2.5} />}
              <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-black text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap border border-white/10">Snap to PNG</span>
            </button>
            <div className={cn("w-px h-4 mx-1", themeClasses.border)} />
            <button onClick={onSave} className={cn("p-2 rounded-lg transition-all", themeClasses.textTertiary, "hover:text-green-400 hover:bg-green-500/10")} title="Save Snapshot">
              <Save size={16} strokeWidth={2.5} />
            </button>
            <button className={cn("p-2 rounded-lg transition-all", themeClasses.textTertiary, "hover:text-purple-400 hover:bg-purple-500/10")}>
              <Settings size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Monaco editor */}
      <div className="flex-1 relative overflow-hidden">
        {activeFile ? (
          <Editor
            theme={isDark ? "vs-dark" : "vs"}
            language={getLanguageConfig(activeFile.language || 'javascript').monaco}
            value={activeFile.content || ''}
            onChange={(val) => onCodeChange(val || '')}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: true, showSlider: 'mouseover' },
              fontSize: 14,
              fontFamily: 'JetBrains Mono, Menlo, Consolas, monospace',
              fontLigatures: true,
              cursorBlinking: 'smooth',
              cursorStyle: 'line',
              cursorWidth: 2,
              smoothScrolling: true,
              contextmenu: true,
              padding: { top: 16, bottom: 16 },
              scrollbar: { 
                vertical: 'visible', 
                horizontal: 'visible',
                verticalScrollbarSize: 14,
                horizontalScrollbarSize: 14,
                useShadows: false
              },
              lineNumbersMinChars: 4,
              glyphMargin: true,
              folding: true,
              lineDecorationsWidth: 10,
              renderLineHighlight: 'line',
              renderWhitespace: 'selection',
              bracketPairColorization: { enabled: true },
              guides: {
                indentation: true,
                bracketPairs: true
              },
              suggest: {
                showKeywords: true,
                showSnippets: true
              }
            }}
          />
        ) : (
          <div className={cn("flex-1 flex flex-col items-center justify-center text-center p-12 h-full", themeClasses.bg)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative mb-12"
            >
              <div className={cn("absolute inset-0 blur-[100px] rounded-full animate-pulse", themeClasses.accentBg)} />
              <div className={cn("relative w-28 h-28 rounded-[2.5rem] border flex items-center justify-center shadow-2xl", themeClasses.bgSurface, themeClasses.border)}>
                <Zap size={48} className={cn("animate-pulse", themeClasses.accent)} />
              </div>
            </motion.div>
            <h2 className={cn("text-2xl font-black mb-3", themeClasses.text)}>Open a File to Begin</h2>
            <p className={cn("text-sm max-w-xs leading-relaxed", themeClasses.textTertiary)}>
              Select a file from the explorer, or create a new one to start coding.
            </p>
          </div>
        )}

        <AnimatePresence>
          {showStdin && activeFile && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 160, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={cn("absolute bottom-0 left-0 right-0 border-t z-20 flex flex-col backdrop-blur-xl bg-[#0B0D17]/95", themeClasses.border)}
            >
              <div className={cn("flex items-center justify-between px-4 py-2 border-b bg-white/5", themeClasses.borderSecondary)}>
                <div className="flex items-center gap-3">
                  <Keyboard size={12} className="text-cyan-500" />
                  <span className={cn("text-[10px] font-black uppercase tracking-widest", themeClasses.textSecondary)}>Program Input (stdin)</span>
                </div>
                <div className="flex items-center gap-4">
                  {/* Quick Tips */}
                  <div className="hidden md:flex items-center gap-2 px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <SparklesIcon size={10} className="text-cyan-500" />
                    <span className="text-[9px] font-bold text-cyan-400">
                      {activeFile.language === 'python' ? 'Use: val = input()' : 
                       activeFile.language === 'java' ? 'Use: Scanner sc = new Scanner(System.in)' :
                       activeFile.language === 'cpp' ? 'Use: cin >> val' :
                       activeFile.language === 'javascript' ? 'Use: fs.readFileSync(0)' : 'Reading from stdin'}
                    </span>
                  </div>
                  <button onClick={() => setShowStdin(false)} className={cn(themeClasses.textTertiary, "hover:text-white p-1")}>
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="flex-1 flex min-h-0">
                <textarea
                  value={stdin}
                  onChange={(e) => onStdinChange(e.target.value)}
                  placeholder={`Supply input here for your ${activeFile.language || 'code'} execution...`}
                  className={cn("flex-1 bg-transparent p-4 text-[13px] font-mono resize-none focus:outline-none custom-scrollbar", themeClasses.textSecondary, "placeholder:opacity-30")}
                />
                <div className="w-48 border-l border-white/5 p-4 hidden lg:block bg-black/20">
                  <h5 className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3">Live Integration</h5>
                  <p className="text-[10px] leading-relaxed text-gray-600 font-medium">
                    The values entered here are automatically buffered and streamed to your program's standard input stream upon execution.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showCmdK && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-lg z-30 flex gap-2 p-3 bg-[#2d2d30] border border-[#007acc] rounded-lg shadow-2xl"
            >
              <SparklesIcon size={16} className="text-[#007acc] mt-2.5 ml-2 shrink-0" />
              <input
                ref={cmdKInputRef}
                value={cmdKPrompt}
                onChange={e => setCmdKPrompt(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') executeCmdK();
                  if (e.key === 'Escape') setShowCmdK(false);
                }}
                disabled={isGenerating}
                placeholder="Generate or edit code... (Press Enter)"
                className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:[#6c6c6c] p-2"
              />
              {isGenerating && <Loader2 size={16} className="text-[#007acc] animate-spin mt-2.5 mr-2" />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
