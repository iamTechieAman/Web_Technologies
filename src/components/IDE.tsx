'use client';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import {
  Play, Code2, Sparkles, BookOpen, Download,
  Terminal as TerminalIcon, Activity,
  Search, Globe, Menu, X,
} from 'lucide-react';
import { cn, getLanguageFromExtension } from '@/lib/utils';
import Header from './Header';
import dynamic from 'next/dynamic';
import { generateExecutionSteps } from '@/lib/stepExecutor';
import { preprocessCode } from '@/lib/preprocessor';

const EditorPanel        = dynamic(() => import('./EditorPanel'),        { ssr: false });
const VisualizerPanel    = dynamic(() => import('./VisualizerPanel'),    { ssr: false });
const AIAssistant        = dynamic(() => import('./AIAssistant'),        { ssr: false });
const ProblemDescription = dynamic(() => import('./ProblemDescription'), { ssr: false });
const FileExplorer       = dynamic(() => import('./FileExplorer'),       { ssr: false });
const TerminalPanel      = dynamic(() => import('./TerminalPanel'),      { ssr: false });
const CommandPalette     = dynamic(() => import('./CommandPalette'),     { ssr: false });
const OutputPanel        = dynamic(() => import('./OutputPanel'),        { ssr: false });
const LivePreview        = dynamic(() => import('./LivePreview'),        { ssr: false });
const CustomModal        = dynamic(() => import('./CustomModal'),        { ssr: false });

import { useFileSystem }        from '@/hooks/useFileSystem';
import { useTabs }              from '@/hooks/useTabs';
import { useExecution }         from '@/hooks/useExecution';
import { useStepPlayer }        from '@/hooks/useStepPlayer';
import { useDefaultExtensions } from '@/hooks/useDefaultExtensions';
import { downloadProjectAsZip } from '@/lib/zipUtils';
import { Problem, SupportedLanguage } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

// ── Type for the terminal's imperative run trigger ─────────────────────────
interface TerminalHandle {
  triggerRun: () => void;
}

interface IDEProps {
  initialProblem?: Problem;
}

export default function IDE({ initialProblem }: IDEProps) {
  // ── Core hooks ─────────────────────────────────────────────────────────────
  const fs   = useFileSystem();
  const tabs = useTabs();
  const { run, result, setResult, steps: rawSteps, loading } = useExecution();
  useDefaultExtensions();

  // ── UI state ───────────────────────────────────────────────────────────────
  const [activeTab,        setActiveTab]        = useState<'problem' | 'ide'>('ide');
  const [activeRightTab,   setActiveRightTab]   = useState<'visualizer' | 'ai'>('visualizer');
  const [bottomTab,        setBottomTab]        = useState<'terminal' | 'output'>('terminal');
  const [isTerminalOpen,   setIsTerminalOpen]   = useState(true);   // open by default
  const [isPaletteOpen,    setIsPaletteOpen]    = useState(false);
  const [isLiveServerOpen, setIsLiveServerOpen] = useState(false);
  const [isSidebarOpen,    setIsSidebarOpen]    = useState(false);
  const [modalConfig,      setModalConfig]      = useState<{
    isOpen: boolean; title: string; placeholder: string; onSubmit: (val: string) => void;
  } | null>(null);

  // Ref that the terminal exposes so Run button can trigger exec-server run
  const terminalRunRef = useRef<(() => void) | null>(null);

  // ── Active file ─────────────────────────────────────────────────────────────
  const activeFile = useMemo(
    () => (tabs.activeTabId ? fs.findNode(tabs.activeTabId) : null),
    [tabs.activeTabId, fs.files],
  );
  const code     = activeFile?.content || '';
  const language = useMemo<SupportedLanguage>(() => {
    if (activeFile?.language) return activeFile.language as SupportedLanguage;
    if (activeFile?.name)     return getLanguageFromExtension(activeFile.name);
    return 'python';
  }, [activeFile]);

  // ── Visualizer steps (client-side simulation) ─────────────────────────────
  const enhancedSteps = useMemo(() => {
    if (rawSteps.length > 0) return rawSteps;
    const preprocessed = preprocessCode(code, language);
    return generateExecutionSteps(preprocessed, language, '');
  }, [rawSteps, code, language]);

  const player = useStepPlayer(enhancedSteps.length);

  // ── Run handler ────────────────────────────────────────────────────────────
  // Strategy: always route through the terminal.
  // 1. Open terminal if closed
  // 2. Switch to terminal tab
  // 3. If exec server connected → tell TerminalPanel to trigger a run
  // 4. If not connected → fall back to Piston batch (updates OutputPanel)
  const handleRun = useCallback(() => {
    if (!code.trim()) return;

    // Always show terminal
    setIsTerminalOpen(true);
    setBottomTab('terminal');

    // Let TerminalPanel handle it (it knows if exec-server is up or not)
    if (terminalRunRef.current) {
      terminalRunRef.current();
    } else {
      // Fallback: Piston batch execution (updates visualizer + output panel)
      run(code, language, '').then(res => {
        setBottomTab('output');
        player.setCurrentStep(0);
        if (!res.success) setActiveRightTab('ai');
      });
    }
  }, [code, language, run, player]);

  // ── Terminal batch command handler ─────────────────────────────────────────
  const handleCommand = useCallback(async (cmd: string): Promise<string> => {
    const t = cmd.trim().toLowerCase();
    if (t === 'ls')    return fs.files.map(f => f.name).join('  ');
    if (t === 'clear') return '\x1b[2J\x1b[H';
    if (t === 'run') {
      if (!code) return '\x1b[31mError: No code to run\x1b[0m';
      const res = await run(code, language, '');
      setBottomTab('output');
      return res.run?.output || (res.success ? 'Executed (no output)' : `\x1b[31m${res.error}\x1b[0m`);
    }
    return `codevisualizer: command not found: ${t}`;
  }, [code, language, run, fs.files]);

  // ── File operations ─────────────────────────────────────────────────────────
  const handleCreateFile = useCallback((parentId: string, type: 'file' | 'folder') => {
    setModalConfig({
      isOpen: true,
      title: type === 'file' ? 'New File' : 'New Folder',
      placeholder: type === 'file' ? 'filename.py' : 'folder-name',
      onSubmit: (name) => {
        if (type === 'file') {
          const lang = getLanguageFromExtension(name);
          const node = fs.createFile(parentId, name, lang);
          if (node) tabs.openTab(node.id);
        } else {
          fs.createFolder(parentId, name);
        }
      },
    });
  }, [fs, tabs]);

  const handleRename = useCallback((id: string, currentName: string) => {
    setModalConfig({
      isOpen: true, title: 'Rename', placeholder: currentName,
      onSubmit: (name) => fs.renameNode(id, name),
    });
  }, [fs]);

  const handleDelete = useCallback((id: string, name: string) => {
    setModalConfig({
      isOpen: true, title: 'Delete Item',
      placeholder: `Type DELETE to confirm removing "${name}"`,
      onSubmit: (val) => { if (val.toUpperCase() === 'DELETE') fs.deleteNode(id); },
    });
  }, [fs]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleRun(); }
      if (e.key === 'p'     && (e.metaKey || e.ctrlKey) && e.shiftKey) { e.preventDefault(); setIsPaletteOpen(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleRun]);

  // ── Palette actions ─────────────────────────────────────────────────────────
  const paletteActions = useMemo(() => [
    { id: 'run',      title: 'Run Code',               icon: <Play size={14} />,         shortcut: '⌘Enter', onSelect: handleRun },
    { id: 'live',     title: 'Go Live: Toggle Server',  icon: <Sparkles size={14} />,    onSelect: () => setIsLiveServerOpen(v => !v) },
    { id: 'terminal', title: 'Toggle Terminal',         icon: <TerminalIcon size={14} />, onSelect: () => setIsTerminalOpen(v => !v) },
    { id: 'zip',      title: 'Download Project (ZIP)',  icon: <Download size={14} />,    onSelect: () => downloadProjectAsZip(fs.files, initialProblem?.slug || 'project') },
  ], [handleRun, fs.files, initialProblem]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen w-full flex flex-col bg-[#050507] text-gray-300 font-sans overflow-hidden selection:bg-orange-500/30">
      <Header language={language} onRun={handleRun} loading={loading} />
      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} actions={paletteActions} />

      <div className="flex-1 flex overflow-hidden flex-col md:flex-row">

        {/* Activity bar */}
        <div className="hidden md:flex w-12 bg-[#0a0a0c] border-r border-gray-800/50 flex-col items-center py-4 gap-4 z-20">
          <button onClick={() => setActiveTab('ide')} className={cn('p-2 rounded-lg transition-all', activeTab === 'ide' ? 'bg-orange-500/10 text-orange-500' : 'text-gray-600 hover:text-gray-400')} title="Editor">
            <Code2 size={20} />
          </button>
          <button onClick={() => setActiveTab('problem')} className={cn('p-2 rounded-lg transition-all', activeTab === 'problem' ? 'bg-orange-500/10 text-orange-500' : 'text-gray-600 hover:text-gray-400')} title="Problem">
            <BookOpen size={20} />
          </button>
          <div className="mt-auto flex flex-col gap-4 items-center">
            <button onClick={() => { setIsTerminalOpen(v => !v); }} className={cn('p-2 rounded-lg transition-colors', isTerminalOpen ? 'text-orange-500 bg-orange-500/10' : 'text-gray-600 hover:text-white')} title="Terminal (Ctrl+`)">
              <TerminalIcon size={20} />
            </button>
            <button onClick={() => setIsPaletteOpen(true)} className="p-2 text-gray-600 hover:text-white transition-colors" title="Command Palette">
              <Search size={20} />
            </button>
          </div>
        </div>

        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-2 px-3 py-2 bg-[#0a0a0c] border-b border-gray-800/50">
          <button onClick={() => setIsSidebarOpen(v => !v)} className="p-1.5 text-gray-500 hover:text-white">
            {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex-1 truncate">
            {activeFile?.name ?? 'No file'}
          </span>
          <button onClick={handleRun} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-[10px] font-black uppercase disabled:opacity-50">
            <Play size={12} /> {loading ? 'Running…' : 'Run'}
          </button>
        </div>

        {/* Main workspace */}
        <div className="flex-1 flex overflow-hidden relative">
          <AnimatePresence mode="wait">
            {activeTab === 'problem' ? (
              <motion.div key="problem" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 overflow-auto bg-[#050507] p-6 md:p-8 custom-scrollbar">
                {initialProblem && <ProblemDescription problem={initialProblem} />}
              </motion.div>
            ) : (
              <PanelGroup direction="horizontal" className="flex-1">
                {/* File explorer */}
                <Panel defaultSize={15} minSize={10} collapsible className="hidden md:block border-r border-gray-800/50">
                  <FileExplorer
                    files={fs.files}
                    activeFileId={tabs.activeTabId}
                    onFileClick={tabs.openTab}
                    onCreate={handleCreateFile}
                    onDelete={handleDelete}
                    onRename={handleRename}
                    onImportProject={async (repoUrl) => {
                      const res = await fetch('/api/git/clone', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ repoUrl }) });
                      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Import failed'); }
                      const { fileTree } = await res.json();
                      await fs.importProject(fileTree);
                    }}
                    onResetWorkspace={() => { if (window.confirm('Reset workspace?')) fs.resetWorkspace(); }}
                  />
                </Panel>

                <PanelResizeHandle className="w-px bg-gray-800/50 hover:bg-orange-500/50 transition-colors hidden md:block" />

                {/* Mobile sidebar overlay */}
                <AnimatePresence>
                  {isSidebarOpen && (
                    <>
                      <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="md:hidden fixed left-0 top-0 bottom-0 w-72 z-[150] bg-[#0a0a0c] border-r border-gray-800/50 shadow-2xl">
                        <div className="flex items-center justify-between p-4 border-b border-gray-800/50">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Files</span>
                          <button onClick={() => setIsSidebarOpen(false)} className="p-1 text-gray-600 hover:text-white"><X size={16} /></button>
                        </div>
                        <FileExplorer files={fs.files} activeFileId={tabs.activeTabId} onFileClick={(id) => { tabs.openTab(id); setIsSidebarOpen(false); }} onCreate={handleCreateFile} onDelete={handleDelete} onRename={handleRename} onImportProject={async () => {}} onResetWorkspace={() => {}} />
                      </motion.div>
                      <div onClick={() => setIsSidebarOpen(false)} className="md:hidden fixed inset-0 z-[149] bg-black/50 backdrop-blur-sm" />
                    </>
                  )}
                </AnimatePresence>

                {/* Editor + terminal */}
                <Panel defaultSize={45} minSize={30}>
                  <PanelGroup direction="vertical">
                    <Panel defaultSize={isTerminalOpen ? 65 : 100}>
                      <EditorPanel
                        activeFile={activeFile}
                        openTabs={tabs.openTabs}
                        files={fs.files}
                        onTabClick={tabs.setActiveTabId}
                        onTabClose={tabs.closeTab}
                        onCodeChange={(newCode) => { if (tabs.activeTabId) fs.updateNodeContent(tabs.activeTabId, newCode); }}
                        onSave={() => {}}
                        onRun={handleRun}
                        loading={loading}
                      />
                    </Panel>

                    {isTerminalOpen && (
                      <>
                        <PanelResizeHandle className="h-px bg-gray-800/50 hover:bg-orange-500/50 transition-colors" />
                        <Panel defaultSize={35} minSize={15} className="bg-[#0a0a0c]">
                          <div className="h-full flex flex-col">
                            {/* Tab switcher: terminal / output */}
                            <div className="flex bg-[#0d0d10] border-b border-gray-800/50 shrink-0">
                              {(['terminal', 'output'] as const).map(t => (
                                <button key={t} onClick={() => setBottomTab(t)} className={cn('px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-all capitalize', bottomTab === t ? 'text-orange-500 border-b border-orange-500 bg-orange-500/5' : 'text-gray-600')}>
                                  {t}
                                </button>
                              ))}
                            </div>
                            <div className="flex-1 overflow-hidden">
                              {bottomTab === 'output'
                                ? <OutputPanel result={result} loading={loading} language={language} sourceCode={code} />
                                : (
                                  <TerminalPanel
                                    onClose={() => setIsTerminalOpen(false)}
                                    onRunCommand={handleCommand}
                                    activeCode={code}
                                    activeLanguage={language}
                                    onRegisterRunTrigger={(fn) => { terminalRunRef.current = fn; }}
                                  />
                                )
                              }
                            </div>
                          </div>
                        </Panel>
                      </>
                    )}
                  </PanelGroup>
                </Panel>

                <PanelResizeHandle className="w-px bg-gray-800/50 hover:bg-orange-500/50 transition-colors" />

                {/* Right panel */}
                <Panel defaultSize={40} minSize={20} collapsible className="bg-[#08080a]">
                  <div className="h-full flex flex-col">
                    <div className="flex bg-[#0a0a0c] border-b border-gray-800/50 shrink-0">
                      {[
                        { id: 'visualizer', label: 'Visualiser', icon: <Activity size={14} /> },
                        { id: 'ai',         label: 'AI Mentor',  icon: <Sparkles size={14} /> },
                      ].map(t => (
                        <button key={t.id} onClick={() => setActiveRightTab(t.id as any)} className={cn('flex-1 py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all', activeRightTab === t.id ? 'text-orange-500 bg-orange-500/5 border-b-2 border-orange-500' : 'text-gray-600 hover:text-gray-400')}>
                          {t.icon} {t.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      {activeRightTab === 'visualizer'
                        ? <VisualizerPanel code={code} steps={enhancedSteps} currentStep={player.currentStep} setCurrentStep={player.setCurrentStep} player={{ ...player, executionFailed: result?.success === false }} language={language} />
                        : <AIAssistant files={fs.files} activeFileCode={code} activeFileName={activeFile?.name} currentStepExplanation={enhancedSteps[player.currentStep]?.explanation} lastResult={result} />
                      }
                    </div>
                  </div>
                </Panel>
              </PanelGroup>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Status bar */}
      <footer className="h-6 bg-[#1e1e1e] border-t border-gray-800/50 text-white flex items-center justify-between px-3 text-[10px] font-medium z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Activity size={12} className="text-green-500" />
            <span className="text-gray-400">Ready</span>
          </div>
        </div>
        <div className="flex items-center gap-2 h-full">
          <button onClick={() => setIsLiveServerOpen(v => !v)} className={cn('px-3 h-full flex items-center gap-2 transition-all border-l border-gray-800/50 text-[10px] font-black uppercase tracking-widest', isLiveServerOpen ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-white/5')}>
            <Globe size={12} className={isLiveServerOpen ? 'animate-pulse' : ''} />
            <span className="hidden sm:inline">{isLiveServerOpen ? 'Live: On' : 'Go Live'}</span>
          </button>
          <div className="hover:bg-white/5 px-3 h-full flex items-center cursor-pointer transition-colors border-l border-gray-800/50 text-gray-400">
            {language}
          </div>
        </div>
      </footer>

      {/* Live preview */}
      <AnimatePresence>
        {isLiveServerOpen && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="fixed top-16 right-4 md:right-6 bottom-10 w-[90vw] md:w-[450px] z-[60] shadow-2xl rounded-2xl overflow-hidden border border-gray-800 ring-1 ring-orange-500/20 bg-[#0d0d10]">
            <LivePreview files={fs.files} activeFileId={tabs.activeTabId} onClose={() => setIsLiveServerOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generic modal */}
      {modalConfig && (
        <CustomModal isOpen={modalConfig.isOpen} onClose={() => setModalConfig(p => p ? { ...p, isOpen: false } : null)} title={modalConfig.title} placeholder={modalConfig.placeholder} onSubmit={modalConfig.onSubmit} />
      )}
    </div>
  );
}
