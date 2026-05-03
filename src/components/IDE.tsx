'use client';
import React, { useState, useEffect, useMemo, useCallback, useTransition } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import {
  Play, Download,
  Terminal as TerminalIcon,
  Globe, X, ChevronRight, ChevronLeft,
  Save, Search as SearchIcon, Github, Archive, Activity, Keyboard
} from 'lucide-react';
import { cn, getLanguageFromExtension, dynamicWithRetry } from '@/lib/utils';
import { safeArray } from '@/lib/safe';
import Header from './Header';
import dynamic from 'next/dynamic';
import { generateExecutionSteps } from '@/lib/stepExecutor';
import { preprocessCode } from '@/lib/preprocessor';
import { detectLanguageFromCode } from '@/lib/languageConfigs';

const IDELoading = ({ label }: { label: string }) => (
  <div className="h-full w-full flex flex-col items-center justify-center bg-[#0B0D17] p-8 animate-in fade-in duration-500">
    <div className="relative w-16 h-16 mb-6">
      <div className="absolute inset-0 border-4 border-cyan-500/10 rounded-xl" />
      <div className="absolute inset-0 border-4 border-t-cyan-500 rounded-xl animate-spin" />
    </div>
    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500 animate-pulse">{label}</p>
  </div>
);

const EditorPanel        = dynamic(() => dynamicWithRetry(() => import('./EditorPanel')),        { ssr: false, loading: () => <IDELoading label="Editor" /> });
const VisualizerPanel    = dynamic(() => dynamicWithRetry(() => import('./VisualizerPanel')),    { ssr: false, loading: () => <IDELoading label="Visualizer" /> });
const EnhancedAIAssistant = dynamic(() => dynamicWithRetry(() => import('./EnhancedAIAssistant')), { ssr: false, loading: () => <IDELoading label="AI Mentor" /> });
const FileExplorer       = dynamic(() => dynamicWithRetry(() => import('./FileExplorer')),       { ssr: false, loading: () => <IDELoading label="Files" /> });
const TerminalPanel      = dynamic(() => dynamicWithRetry(() => import('./TerminalPanel')),      { ssr: false, loading: () => <IDELoading label="Terminal" /> });
const CommandPalette     = dynamic(() => dynamicWithRetry(() => import('./CommandPalette')),     { ssr: false });
const OutputPanel        = dynamic(() => dynamicWithRetry(() => import('./OutputPanel')),        { ssr: false, loading: () => <IDELoading label="Output" /> });
const LivePreview        = dynamic(() => dynamicWithRetry(() => import('./LivePreview')),        { ssr: false });
const CustomModal        = dynamic(() => dynamicWithRetry(() => import('./CustomModal')),        { ssr: false });
const VSCodeActivityBar = dynamic(() => dynamicWithRetry(() => import('./VSCodeActivityBar')), { ssr: false });
const VSCodeSidebar = dynamic(() => dynamicWithRetry(() => import('./VSCodeSidebar')), { ssr: false, loading: () => <IDELoading label="Sidebar" /> });
const StatusBar = dynamic(() => dynamicWithRetry(() => import('./StatusBar')), { ssr: false });

import { useFileSystem }        from '@/hooks/useFileSystem';
import { useTabs }              from '@/hooks/useTabs';
import { useExecution }         from '@/hooks/useExecution';
import { useStepPlayer }        from '@/hooks/useStepPlayer';
import { useDefaultExtensions } from '@/hooks/useDefaultExtensions';
import { useRunHistory } from '@/hooks/useRunHistory';
import { Problem, SupportedLanguage } from '@/types';
import { useTheme, useThemeClasses } from '@/context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

interface IDEProps {
  initialProblem?: Problem;
}

interface ModalConfig {
  isOpen: boolean;
  title: string;
  placeholder: string;
  onSubmit: (value: string) => void;
}

export default function IDE({ initialProblem }: IDEProps) {
  const { isDark } = useTheme();
  const themeClasses = useThemeClasses();
  const fs   = useFileSystem();
  const tabs = useTabs();
  const { run, result, steps: rawSteps, loading, error: execError } = useExecution();
  const [currentProblem, setCurrentProblem] = useState<Problem | undefined>(initialProblem);
  const runHistory = useRunHistory();
  useDefaultExtensions();

  const [, startTransition] = useTransition();

  const [bottomTab, setBottomTab] = useState<'terminal' | 'output'>('terminal');
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  
  const handleBottomTabChange = (tab: 'terminal' | 'output') => {
    startTransition(() => {
      setBottomTab(tab);
    });
  };
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isLiveServerOpen, setIsLiveServerOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [modalConfig, setModalConfig] = useState<ModalConfig | null>(null);
  const [debouncedCode, setDebouncedCode] = useState('');
  const [runTriggerTick, setRunTriggerTick] = useState(0);
  const [stdin, setStdin] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [selectedCode, setSelectedCode] = useState('');
  const [activeSidebarView, setActiveSidebarView] = useState<'explorer' | 'problem' | 'search' | 'source-control' | 'debug' | 'extensions' | 'history'>('explorer');
  const [activeRightTab, setActiveRightTab] = useState<'ai' | 'visualizer'>('ai');
  const [aiInitialPrompt, setAiInitialPrompt] = useState('');
  const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 });

  useEffect(() => {
    const handleResize = (): void => {
      const width = window.innerWidth;
      setWindowWidth(width);
      setIsMobile(width < 768);
      if (width < 1200 && width >= 768) setIsRightPanelOpen(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    
    if (initialProblem) {
      setCurrentProblem(initialProblem);
      setActiveSidebarView('problem');
      
      // Attempt to open a relevant file for the problem
      const findMainFile = (nodes: any[]): string | null => {
        const priorityNames = ['Main.java', 'solution.js', 'Solution.java', 'main.py', 'index.js'];
        const slugMatch = initialProblem.titleSlug || initialProblem.slug;
        
        // 1. Try priority names
        for (const node of nodes) {
          if (node.type === 'file' && priorityNames.includes(node.name)) return node.id;
        }
        // 2. Try slug match
        for (const node of nodes) {
          if (node.type === 'file' && node.name.toLowerCase().includes(slugMatch.toLowerCase())) return node.id;
        }
        // 3. Fallback to first file
        for (const node of nodes) {
          if (node.type === 'file') return node.id;
          if (node.children) {
            const found = findMainFile(node.children);
            if (found) return found;
          }
        }
        return null;
      };

      if (!tabs.activeTabId && fs.files.length > 0) {
        const mainId = findMainFile(fs.files);
        if (mainId) tabs.openTab(mainId);
      }
    }

    return () => window.removeEventListener('resize', handleResize);
  }, [initialProblem, tabs, fs]);

  const handleProblemSelect = useCallback((problem: Problem) => {
    setCurrentProblem(problem);
    setActiveSidebarView('problem');
    setIsSidebarOpen(true);
    setActiveRightTab('visualizer');
    
    // Create/Open solution file
    const slug = problem.titleSlug || problem.slug;
    // Try to find a language from starterCode keys, or fallback
    const problemLang = (Object.keys(problem.starterCode || {})[0] as SupportedLanguage) || 'python';
    
    const extension = problemLang === 'python' ? 'py' : 
                      problemLang === 'java' ? 'java' : 'js';
    const filename = `${slug}.${extension}`;
    
    let file = fs.files.find(f => f.name === filename);
    if (!file) {
      const stub = fs.createFile('root', filename, getLanguageFromExtension(filename));
      const newId = stub.id;
      const starterContent = problem.starterCode?.[problemLang] || '';
      if (newId && starterContent) {
        fs.updateNodeContent(newId, starterContent);
      }
      tabs.openTab(newId);
    } else {
      tabs.openTab(file.id);
    }
  }, [fs, tabs]);

  const isRightPanelOverlay = windowWidth < 1200 && !isMobile;
  const centerPanelDefaultSize = useMemo(() => {
    if (isMobile) return 100;
    const sidebarSize = isSidebarOpen ? 20 : 0;
    const rightSize = isRightPanelOpen && !isRightPanelOverlay ? 30 : 0;
    return Math.max(30, 100 - sidebarSize - rightSize);
  }, [isMobile, isRightPanelOpen, isRightPanelOverlay, isSidebarOpen]);

  const activeFile = useMemo(
    () => (tabs.activeTabId ? fs.findNode(tabs.activeTabId) : null),
    [tabs.activeTabId, fs],
  );

  const code = activeFile?.content || '';

  const language = useMemo<SupportedLanguage>(() => {
    if (activeFile?.language) return activeFile.language as SupportedLanguage;
    if (activeFile?.name) return getLanguageFromExtension(activeFile.name);
    return 'python';
  }, [activeFile]);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedCode(code || ''), 300);
    return () => clearTimeout(handler);
  }, [code]);

  const enhancedSteps = useMemo(() => {
    if (Array.isArray(rawSteps) && rawSteps.length > 0) return rawSteps;
    const preprocessed = preprocessCode(debouncedCode, language || 'python');
    return generateExecutionSteps(preprocessed, language || 'python', stdin);
  }, [rawSteps, debouncedCode, language, stdin]);

  const player = useStepPlayer(Array.isArray(enhancedSteps) ? enhancedSteps.length : 0);

  const handleRun = useCallback(async (): Promise<void> => {
    if (!activeFile?.content) return;
    setIsTerminalOpen(true);
    setBottomTab('terminal');
    setRunTriggerTick(prev => prev + 1);
    const executionResult = await run(activeFile.content || '', language || 'javascript', stdin);
    runHistory.recordRun({
      fileName: activeFile.name,
      language: language || 'javascript',
      code: activeFile.content || '',
      result: executionResult,
    });
  }, [activeFile, language, run, runHistory, stdin]);

  const handleCreateFile = useCallback((parentId: string, type: 'file' | 'folder'): void => {
    setModalConfig({
      isOpen: true,
      title: type === 'file' ? 'New File' : 'New Folder',
      placeholder: type === 'file' ? 'filename.py' : 'folder-name',
      onSubmit: (name: string) => {
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

  const handleRename = useCallback((id: string, currentName: string): void => {
    setModalConfig({
      isOpen: true,
      title: 'Rename',
      placeholder: currentName || '',
      onSubmit: (name: string) => fs.renameNode(id, name),
    });
  }, [fs]);

  const handleDelete = useCallback((id: string, name: string): void => {
    setModalConfig({
      isOpen: true,
      title: 'Delete Item',
      placeholder: `Type DELETE to confirm removing "${name || ''}"`,
      onSubmit: (val: string) => {
        if (val?.toUpperCase() === 'DELETE') fs.deleteNode(id);
      },
    });
  }, [fs]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleRun(); }
      if (e.key === 'p' && (e.metaKey || e.ctrlKey) && e.shiftKey) { e.preventDefault(); setIsPaletteOpen(true); }
      if (e.key === 's' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); /* Save logic */ }
      if (e.key === '`' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setIsTerminalOpen(v => !v); }
      if (e.key === 'b' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setIsSidebarOpen(v => !v); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleRun]);

  const handleCodeChange = useCallback((newCode: string): void => {
    if (!tabs.activeTabId) return;
    const detected = detectLanguageFromCode(newCode || '', activeFile?.name || '');
    startTransition(() => {
      fs.updateNodeContent(
        tabs.activeTabId!,
        newCode || '',
        detected.confidence >= 4 && detected.language !== activeFile?.language ? detected.language : undefined,
      );
    });
  }, [tabs.activeTabId, activeFile?.name, activeFile?.language, fs]);

  const paletteActions = useMemo(() => [
    { id: 'run', title: 'Run Code', icon: <Play size={14} />, shortcut: 'Ctrl+Enter', onSelect: handleRun },
    { id: 'save', title: 'Save File', icon: <Save size={14} />, shortcut: 'Ctrl+S', onSelect: () => {} },
    { id: 'terminal', title: 'Toggle Terminal', icon: <TerminalIcon size={14} />, shortcut: 'Ctrl+`', onSelect: () => setIsTerminalOpen(v => !v) },
    { id: 'sidebar', title: 'Toggle Sidebar', icon: <ChevronRight size={14} />, shortcut: 'Ctrl+B', onSelect: () => setIsSidebarOpen(v => !v) },
    { id: 'git', title: 'Import Git Repository', icon: <Github size={14} />, onSelect: () => setActiveSidebarView('explorer') },
    { id: 'zip', title: 'Download Project (ZIP)', icon: <Archive size={14} />, onSelect: () => {
      import('@/lib/zipUtils').then(z => z.downloadProjectAsZip(safeArray(fs.files), initialProblem?.slug || 'project'));
    }},
  ], [handleRun, fs.files, initialProblem]);

  const handleDownloadProject = useCallback((): void => {
    import('@/lib/zipUtils').then(z => z.downloadProjectAsZip(safeArray(fs.files), initialProblem?.slug || 'project'));
  }, [fs.files, initialProblem]);

  const handleImportProject = useCallback(async (repoUrl: string): Promise<void> => {
    const res = await fetch('/api/git/clone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoUrl }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.fileTree) throw new Error(data?.error || 'Failed to import repository');
    await fs.importProject(safeArray(data.fileTree));
    const firstFile = safeArray<any>(data.fileTree).find((n) => n?.type === 'file');
    if (firstFile?.id) tabs.openTab(String(firstFile.id));
  }, [fs, tabs]);

  useEffect(() => {
    if (tabs.activeTabId) return;
    const openFirstFile = (nodes: any[]): string | null => {
      for (const node of safeArray<any>(nodes)) {
        if (node?.type === 'file' && node?.id) return String(node.id);
        if (Array.isArray(node?.children)) {
          const found = openFirstFile(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    const firstFileId = openFirstFile(safeArray(fs.files));
    if (firstFileId) tabs.openTab(firstFileId);
  }, [fs.files, tabs]);

  return (
    <div className={cn("h-screen w-screen overflow-hidden flex flex-col antialiased", themeClasses.bg)}>
      <Header 
        language={activeFile ? language : undefined}
        onLanguageChange={(lang) => { if (activeFile) fs.updateNodeContent(activeFile.id, activeFile.content || '', lang); }}
        onRun={handleRun}
        loading={loading}
        showControls={!isMobile} 
        onMenuClick={() => setIsSidebarOpen(v => !v)}
      />

      <div className="flex-1 min-h-0 w-full overflow-hidden relative flex">
        {/* Responsive Drawers */}
        <AnimatePresence>
          {isMobile && isSidebarOpen && (
            <div className="absolute inset-0 z-[100] flex">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsSidebarOpen(false)} />
              <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className={cn("relative w-[300px] h-full shadow-2xl flex flex-col border-r glass-panel", themeClasses.bgSecondary, themeClasses.border)}>
                <div className={cn("h-12 flex items-center justify-between px-4 border-b", themeClasses.border)}>
                  <span className={cn("text-[10px] font-black uppercase tracking-[0.2em]", themeClasses.text)}>Workspace</span>
                  <button onClick={() => setIsSidebarOpen(false)} className={themeClasses.textTertiary}><X size={18} /></button>
                </div>
                <div className="flex-1 overflow-auto p-0">
                  <FileExplorer files={safeArray(fs.files)} activeFileId={tabs.activeTabId} onFileClick={(id) => { tabs.openTab(id); setIsSidebarOpen(false); }} onCreate={handleCreateFile} onDelete={handleDelete} onRename={handleRename} onImportProject={handleImportProject} onResetWorkspace={fs.resetWorkspace} />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {!isMobile && (
          <VSCodeActivityBar 
            activeView={activeSidebarView}
            onViewChange={(view) => { setActiveSidebarView(view); if (!isSidebarOpen) setIsSidebarOpen(true); }}
          />
        )}

        <PanelGroup id="main-layout-horizontal" direction="horizontal" className="flex-1">
          {/* Sidebar Panel */}
          {isSidebarOpen && !isMobile && (
            <>
              <Panel id="sidebar-panel" order={1} defaultSize={20} minSize={15} maxSize={40} className="h-full">
                <div className={cn(
                  "h-full flex flex-col border-r backdrop-blur-xl",
                  isDark ? "bg-[#0B0D17]/50 border-[#24283b]" : "bg-white/80 border-gray-200"
                )}>
                  <VSCodeSidebar
                    activeView={activeSidebarView}
                    onViewChange={setActiveSidebarView}
                    files={safeArray(fs.files)}
                    activeFileId={tabs.activeTabId}
                    onFileClick={tabs.openTab}
                    onCreate={handleCreateFile}
                    onDelete={handleDelete}
                    onRename={handleRename}
                    onImportProject={handleImportProject}
                    initialProblem={currentProblem}
                    onProblemSelect={handleProblemSelect}
                    onDownloadProject={handleDownloadProject}
                    historyItems={runHistory.items}
                    historyOwner={runHistory.owner}
                    onClearHistory={runHistory.clearHistory}
                  />
                </div>
              </Panel>
              <PanelResizeHandle className={cn("w-[2px] transition-colors cursor-col-resize z-50 active:bg-cyan-500/60", isDark ? "bg-white/5 hover:bg-cyan-500/40" : "bg-black/5 hover:bg-cyan-500/20")} />
            </>
          )}

          {/* Editor + Terminal Center */}
          <Panel id="center-panel" order={2} defaultSize={centerPanelDefaultSize} minSize={30}>
            <PanelGroup id="center-layout-vertical" direction="vertical">
              <Panel id="editor-panel" order={1} defaultSize={70} minSize={20} className="flex flex-col">
                <EditorPanel
                  activeFile={activeFile}
                  openTabs={safeArray(tabs.openTabs)}
                  files={safeArray(fs.files)}
                  onTabClick={tabs.openTab}
                  onTabClose={tabs.closeTab}
                  onCodeChange={handleCodeChange}
                  onSave={() => { /* Save logic can be implemented here if needed */ console.log('File saved locally'); }}
                  onRun={handleRun}
                  loading={loading}
                  stdin={stdin}
                  onStdinChange={setStdin}
                  onSelectionChange={setSelectedCode}
                  onCursorChange={(l, c) => setCursorPos({ line: l, column: c })}
                  onChatWithSelection={() => { setIsRightPanelOpen(true); setActiveRightTab('ai'); setAiInitialPrompt('Can you explain or help me with the selected code?'); }}
                />
              </Panel>
              
              {isTerminalOpen && (
                <>
                  <PanelResizeHandle className={cn("h-[2px] transition-colors cursor-row-resize z-50 active:bg-cyan-500/60", isDark ? "bg-white/5 hover:bg-cyan-500/40" : "bg-black/5 hover:bg-cyan-500/20")} />
                  <Panel id="terminal-panel" order={2} defaultSize={30} minSize={15}>
                    <div className={cn("h-full flex flex-col", themeClasses.bg)}>
                      <div className={cn("h-9 border-b px-3 flex items-center justify-between shrink-0", themeClasses.border, themeClasses.bgSecondary)}>
                        <div className="flex items-center h-full gap-4">
                          <div className="flex items-center h-full">
                            <button onClick={() => handleBottomTabChange('terminal')} className={cn("h-full px-4 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] transition-all relative", bottomTab === 'terminal' ? cn(themeClasses.text, "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-cyan-500") : cn(themeClasses.textTertiary, "hover:text-cyan-500"))}>
                              <TerminalIcon size={10} className={cn("opacity-40", bottomTab === 'terminal' && "text-cyan-500 opacity-100")} />
                              Terminal
                            </button>
                            <button onClick={() => handleBottomTabChange('output')} className={cn("h-full px-4 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] transition-all relative", bottomTab === 'output' ? cn(themeClasses.text, "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-cyan-500") : cn(themeClasses.textTertiary, "hover:text-cyan-500"))}>
                              <Activity size={10} className={cn("opacity-40", bottomTab === 'output' && "text-cyan-500 opacity-100")} />
                              Output
                            </button>
                          </div>
                          
                          {bottomTab === 'terminal' && (
                            <div className="flex items-center gap-2 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                              <div className={cn("w-1 h-1 rounded-full", runTriggerTick > 0 ? "bg-green-500 animate-pulse" : "bg-gray-600")} />
                              <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest">
                                {runTriggerTick > 0 ? "Interactive" : "Batch Mode"}
                              </span>
                            </div>
                          )}
                        </div>
                        <button onClick={() => setIsTerminalOpen(false)} className={cn("p-1.5 rounded-lg hover:bg-white/5 transition-colors", themeClasses.textTertiary)} title="Close Panel"><X size={14} /></button>
                      </div>
                      <div className="flex-1 min-h-0">
                        {bottomTab === 'terminal' ? (
                          <TerminalPanel onClose={() => setIsTerminalOpen(false)} result={result} loading={loading} runTriggerTick={runTriggerTick} language={language} code={activeFile?.content || ''} onStdinChange={setStdin} initialStdin={stdin} />
                        ) : (
                          <OutputPanel result={result} loading={loading} language={language || 'javascript'} sourceCode={code || ''} />
                        )}
                      </div>
                    </div>
                  </Panel>
                </>
              )}
            </PanelGroup>
          </Panel>

          {/* Right Panel (AI / Visualizer) */}
          {!isMobile && !isRightPanelOverlay && isRightPanelOpen && (
            <>
              <PanelResizeHandle className={cn("w-[2px] transition-colors cursor-col-resize z-50 active:bg-cyan-500/60", isDark ? "bg-white/5 hover:bg-cyan-500/40" : "bg-black/5 hover:bg-cyan-500/20")} />
              <Panel id="right-panel" order={3} defaultSize={30} minSize={20} maxSize={50}>
                <div className={cn(
                  "h-full flex flex-col border-l backdrop-blur-xl transition-all duration-500",
                  isDark ? "bg-[#0B0D17]/50 border-white/5" : "bg-white/80 border-gray-200"
                )}>
                  <RightPanelContent activeRightTab={activeRightTab} setActiveRightTab={setActiveRightTab} themeClasses={themeClasses} fs={fs} code={code} activeFile={activeFile} enhancedSteps={enhancedSteps} player={player} result={result} selectedCode={selectedCode} aiInitialPrompt={aiInitialPrompt} setAiInitialPrompt={setAiInitialPrompt} onClose={() => setIsRightPanelOpen(false)} isDark={isDark} />
                </div>
              </Panel>
            </>
          )}
        </PanelGroup>

        {/* Floating Right Panel Toggle (when closed) */}
        {!isRightPanelOpen && !isMobile && (
          <button onClick={() => setIsRightPanelOpen(true)} className={cn("absolute right-0 top-1/2 -translate-y-1/2 z-[60] w-5 h-16 flex items-center justify-center rounded-l-md border border-r-0 bg-white/5 backdrop-blur-xl", themeClasses.border, "hover:bg-cyan-500/20 transition-all text-cyan-500")}><ChevronLeft size={14} /></button>
        )}
        {isRightPanelOpen && isRightPanelOverlay && (
          <div className={cn(
            "absolute inset-y-0 right-0 z-[90] w-[420px] max-w-[calc(100vw-56px)] border-l shadow-2xl backdrop-blur-xl transition-all duration-500",
            isDark ? "bg-[#0B0D17]/95 border-white/5" : "bg-white/95 border-gray-200"
          )}>
            <RightPanelContent activeRightTab={activeRightTab} setActiveRightTab={setActiveRightTab} themeClasses={themeClasses} fs={fs} code={code} activeFile={activeFile} enhancedSteps={enhancedSteps} player={player} result={result} selectedCode={selectedCode} aiInitialPrompt={aiInitialPrompt} setAiInitialPrompt={setAiInitialPrompt} onClose={() => setIsRightPanelOpen(false)} isDark={isDark} />
          </div>
        )}
      </div>

      <StatusBar language={language} isExecuting={loading} hasError={!!execError} line={cursorPos.line} column={cursorPos.column} isConnected={runTriggerTick > 0} />

      {/* Overlays & Modals */}
      {isPaletteOpen && <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} actions={paletteActions} />}
      {isLiveServerOpen && <div className="fixed inset-0 z-[200]"><LivePreview files={safeArray(fs.files)} activeFileId={tabs.activeTabId} onClose={() => setIsLiveServerOpen(false)} /></div>}
      {modalConfig && <CustomModal isOpen={modalConfig.isOpen} onClose={() => setModalConfig(null)} title={modalConfig.title} placeholder={modalConfig.placeholder} onSubmit={modalConfig.onSubmit} />}
    </div>
  );
}

function RightPanelContent({ activeRightTab, setActiveRightTab, themeClasses, fs, code, activeFile, enhancedSteps, player, result, selectedCode, aiInitialPrompt, setAiInitialPrompt, onClose, isMobile = false, isDark }: any) {
  return (
    <div className="h-full flex flex-col">
      <div className={cn("h-10 flex border-b shrink-0", themeClasses.border, themeClasses.bgSecondary)}>
        <button onClick={() => setActiveRightTab('ai')} className={cn("flex-1 text-[9px] font-black uppercase tracking-widest transition-all relative", activeRightTab === 'ai' ? cn(themeClasses.purple, "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-purple-500") : cn(themeClasses.textTertiary, "hover:text-purple-400"))}>AI Mentor</button>
        <button onClick={() => setActiveRightTab('visualizer')} className={cn("flex-1 text-[9px] font-black uppercase tracking-widest transition-all relative", activeRightTab === 'visualizer' ? cn(themeClasses.accent, "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-cyan-500") : cn(themeClasses.textTertiary, "hover:text-cyan-400"))}>Visualizer</button>
        {!isMobile && onClose && <button onClick={onClose} className={cn("px-4", themeClasses.textTertiary, "hover:text-cyan-500")}><X size={16} /></button>}
      </div>
      <div className="flex-1 overflow-auto custom-scrollbar">
        {activeRightTab === 'ai' ? (
          <EnhancedAIAssistant 
            files={safeArray(fs.files)} 
            activeFileCode={code || ''} 
            activeFileName={activeFile?.name || ''} 
            currentStepExplanation={enhancedSteps[player.currentStep]?.explanation || ''} 
            lastResult={result} 
            selectedCode={selectedCode} 
            initialPrompt={aiInitialPrompt} 
            onClearInitialPrompt={() => setAiInitialPrompt('')} 
          />
        ) : (
          <VisualizerPanel 
            steps={safeArray(enhancedSteps)} 
            currentStep={player.currentStep} 
            setCurrentStep={player.setCurrentStep} 
            player={player} 
            code={code || ''} 
            _language={activeFile?.language || 'javascript'} 
            fileId={activeFile?.id} 
          />
        )}
      </div>
    </div>
  );
}
