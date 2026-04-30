'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { 
  Play, Code2, Sparkles, BookOpen, Download, Settings, 
  Terminal as TerminalIcon, Activity, Layout, ChevronRight, 
  ChevronLeft, Search, Command, Globe
} from 'lucide-react';
import { cn, getLanguageFromExtension } from '@/lib/utils';
import Header from './Header';
import dynamic from 'next/dynamic';
import { generateExecutionSteps } from '@/lib/stepExecutor';
import { preprocessCode } from '@/lib/preprocessor';

const EditorPanel = dynamic(() => import('./EditorPanel'), { ssr: false });
const VisualizerPanel = dynamic(() => import('./VisualizerPanel'), { ssr: false });
const AIAssistant = dynamic(() => import('./AIAssistant'), { ssr: false });
const ProblemDescription = dynamic(() => import('./ProblemDescription'), { ssr: false });
const FileExplorer = dynamic(() => import('./FileExplorer'), { ssr: false });
const TerminalPanel = dynamic(() => import('./TerminalPanel'), { ssr: false });
const CommandPalette = dynamic(() => import('./CommandPalette'), { ssr: false });
import { useFileSystem } from '@/hooks/useFileSystem';
import { useTabs } from '@/hooks/useTabs';
import { useExecution } from '@/hooks/useExecution';
import { useStepPlayer } from '@/hooks/useStepPlayer';
import { useDefaultExtensions } from '@/hooks/useDefaultExtensions';
import { downloadProjectAsZip } from '@/lib/zipUtils';
import { Problem, SupportedLanguage } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import OutputPanel from './OutputPanel';
import LivePreview from './LivePreview';
import CustomModal from './CustomModal';

interface IDEProps {
  initialProblem?: Problem;
}

export default function IDE({ initialProblem }: IDEProps) {
  // Hooks
  const fs = useFileSystem();
  const tabs = useTabs();
  const { run, result, setResult, steps: rawSteps, loading } = useExecution();
  useDefaultExtensions(); // Initialize extensions
  
  // UI State
  const [activeTab, setActiveTab] = useState<'problem' | 'ide'>('ide');
  const [activeRightTab, setActiveRightTab] = useState<'visualizer' | 'ai'>('visualizer');
  const [bottomTab, setBottomTab] = useState<'terminal' | 'output'>('output');
  const [stdin, setStdin] = useState('');
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isLiveServerOpen, setIsLiveServerOpen] = useState(false);
  
  // Current active file data
  const activeFile = useMemo(() => 
    tabs.activeTabId ? fs.findNode(tabs.activeTabId) : null
  , [tabs.activeTabId, fs.files]);

  // Code & Language sync
  const code = activeFile?.content || '';
  const language = useMemo(() => {
    if (activeFile?.language) return activeFile.language;
    if (activeFile?.name) return getLanguageFromExtension(activeFile.name);
    return 'python' as SupportedLanguage;
  }, [activeFile]);

  // Execution sync
  const enhancedSteps = useMemo(() => {
    if (rawSteps.length > 0) return rawSteps;
    const preprocessed = preprocessCode(code, language);
    return generateExecutionSteps(preprocessed, language, stdin);
  }, [rawSteps, code, language, stdin]);

  const player = useStepPlayer(enhancedSteps.length);

  // Actions
  const handleRun = async () => {
    if (!code) {
      setResult({
        success: false,
        error: 'Cannot run an empty file. Please write some code first.',
        engine: 'piston'
      });
      setBottomTab('output');
      setIsTerminalOpen(true);
      return;
    }

    // console.log('[UI/IDE] stdin value before run:', JSON.stringify(stdin));

    setBottomTab('output');
    setIsTerminalOpen(true);

    const res = await run(code, language as SupportedLanguage, stdin);
    player.setCurrentStep(0);

    // Switch to AI if execution had an input-related error
    if (!res.success) {
      const errMsg = (res.error || res.run?.stderr || '').toLowerCase();
      const isInputErr =
        errMsg.includes('nosuchelementexception') ||
        errMsg.includes('inputmismatchexception') ||
        errMsg.includes('eoferror') ||
        errMsg.includes('input required');
      if (isInputErr) setActiveRightTab('ai');
      else setActiveRightTab('visualizer');
    } else {
      setActiveRightTab('visualizer');
    }
  };

  const handleCommand = async (cmd: string): Promise<string> => {
    const trimmed = cmd.trim().toLowerCase();
    if (trimmed === 'run') {
      if (!code) return '\x1b[31mError: No code to run\x1b[0m';
      setBottomTab('output');
      const res = await run(code, language as SupportedLanguage, stdin);
      return res.run?.output || (res.success ? 'Program executed successfully (no output)' : `\x1b[31mError: ${res.error}\x1b[0m`);
    }
    if (trimmed === 'ls') {
      return fs.files.map(f => f.name).join('  ');
    }
    if (trimmed === 'python' || trimmed === 'node' || trimmed === 'java' || trimmed === 'g++') {
      return `\x1b[33mTip: Use the "run" command to execute the current file with its appropriate environment.\x1b[0m`;
    }
    // Mock execution for other commands
    return `codevisualizer: command not found: ${trimmed}`;
  };

  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean, title: string, placeholder: string, onSubmit: (val: string) => void } | null>(null);

  const handleCreateFile = (parentId: string, type: 'file' | 'folder') => {
    setModalConfig({
      isOpen: true,
      title: type === 'file' ? 'Create New File' : 'Create New Folder',
      placeholder: type === 'file' ? 'filename.py' : 'Folder name',
      onSubmit: (name) => {
        if (type === 'file') {
          const lang = getLanguageFromExtension(name);
          const newNode = fs.createFile(parentId, name, lang);
          if (newNode) tabs.openTab(newNode.id);
        } else {
          fs.createFolder(parentId, name);
        }
      }
    });
  };

  useEffect(() => {
    const handleCommand = (e: any) => {
      const { id } = e.detail;
      if (id === 'codevisualizer.runCode') handleRun();
      if (id === 'codevisualizer.toggleLiveServer') setIsLiveServerOpen(prev => !prev);
    };
    window.addEventListener('codevisualizer-command', handleCommand);
    return () => window.removeEventListener('codevisualizer-command', handleCommand);
  }, [handleRun]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Run: Ctrl+Enter or Cmd+Enter
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleRun();
      }
      // Save: Ctrl+S or Cmd+S
      if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        // logic for save could go here if needed, fs.updateNodeContent is auto-saving to localforage
      }
      // Command Palette: Ctrl+Shift+P or Cmd+Shift+P
      if (e.key === 'p' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        setIsPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRun]);

  const handleRename = (id: string, currentName: string) => {
    setModalConfig({
      isOpen: true,
      title: 'Rename Item',
      placeholder: currentName,
      onSubmit: (newName) => fs.renameNode(id, newName)
    });
  };

  const handleDelete = (id: string, name: string) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete Item',
      placeholder: `Type "DELETE" to confirm deleting ${name}`,
      onSubmit: (val) => {
        if (val.toUpperCase() === 'DELETE') fs.deleteNode(id);
      }
    });
  };
  const paletteActionsFromExtensions = (toggleLive: (val: boolean) => void) => [
    { 
      id: 'codevisualizer.runCode', 
      title: 'Run Code', 
      icon: <Play size={14} />, 
      shortcut: 'F5', 
      onSelect: () => handleRun() 
    },
    { 
      id: 'codevisualizer.toggleLiveServer', 
      title: 'Go Live: Toggle Server', 
      icon: <Sparkles size={14} />, 
      onSelect: () => toggleLive(true) 
    },
  ];

  const paletteActions = [
    ...paletteActionsFromExtensions(setIsLiveServerOpen),
    { id: 'save-code', title: 'Save File', icon: <Download size={14} />, shortcut: '⌘S', onSelect: () => {} },
    { id: 'toggle-terminal', title: 'Toggle Terminal', icon: <TerminalIcon size={14} />, shortcut: '⌃`', onSelect: () => setIsTerminalOpen(!isTerminalOpen) },
    { id: 'download-zip', title: 'Download Project (ZIP)', icon: <Download size={14} />, onSelect: () => downloadProjectAsZip(fs.files, initialProblem?.slug || 'project') },
  ];

  return (
    <div className="h-screen w-full flex flex-col bg-[#050507] text-gray-300 font-sans selection:bg-orange-500/30 overflow-hidden">
      <Header 
        language={language as SupportedLanguage}
        onRun={handleRun}
        loading={loading}
      />
      
      <CommandPalette 
        isOpen={isPaletteOpen} 
        onClose={() => setIsPaletteOpen(false)} 
        actions={paletteActions} 
      />

      <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
        {/* Activity Bar (Slim Left Sidebar) - Hidden on extra small mobile */}
        <div className="hidden md:flex w-12 bg-[#0a0a0c] border-r border-gray-800/50 flex-col items-center py-4 gap-4 z-20">
          <button 
            onClick={() => setActiveTab('ide')}
            className={cn("p-2 rounded-lg transition-all group relative", activeTab === 'ide' ? "bg-orange-500/10 text-orange-500" : "text-gray-600 hover:text-gray-400")}
          >
            <Code2 size={20} />
          </button>
          <button 
            onClick={() => setActiveTab('problem')}
            className={cn("p-2 rounded-lg transition-all group relative", activeTab === 'problem' ? "bg-orange-500/10 text-orange-500" : "text-gray-600 hover:text-gray-400")}
          >
            <BookOpen size={20} />
          </button>
          <div className="mt-auto flex flex-col gap-4 items-center">
            <button onClick={() => setIsTerminalOpen(!isTerminalOpen)} className={cn("p-2 rounded-lg transition-colors", isTerminalOpen ? "text-orange-500 bg-orange-500/10" : "text-gray-600 hover:text-white")}>
              <TerminalIcon size={20} />
            </button>
            <button onClick={() => setIsPaletteOpen(true)} className="p-2 text-gray-600 hover:text-white transition-colors">
              <Search size={20} />
            </button>
          </div>
        </div>

        {/* Main Workspace */}
        <div className="flex-1 flex overflow-hidden relative">
          <AnimatePresence mode="wait">
            {activeTab === 'problem' ? (
              <motion.div 
                key="problem" 
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="flex-1 overflow-auto bg-[#050507] p-8 custom-scrollbar"
              >
                {initialProblem && <ProblemDescription problem={initialProblem} />}
              </motion.div>
            ) : (
              <PanelGroup direction="horizontal" className="flex-1">
                {/* File Explorer Panel */}
                <Panel defaultSize={15} minSize={10} collapsible className="hidden md:block border-r border-gray-800/50">
                  <FileExplorer 
                    files={fs.files} 
                    activeFileId={tabs.activeTabId}
                    onFileClick={tabs.openTab}
                    onCreate={handleCreateFile}
                    onDelete={handleDelete}
                    onRename={handleRename}
                    onImportProject={async (repoUrl) => {
                      const res = await fetch('/api/git/clone', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ repoUrl }),
                      });
                      if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.error || 'Failed to import repository');
                      }
                      const { fileTree } = await res.json();
                      await fs.importProject(fileTree);
                    }}
                    onResetWorkspace={() => {
                      if (window.confirm('This will delete all current files and reset the workspace. Continue?')) {
                        fs.resetWorkspace();
                      }
                    }}
                  />
                </Panel>
                
                <PanelResizeHandle className="w-px bg-gray-800/50 hover:bg-orange-500/50 transition-colors" />

                {/* Center Panel (Editor + Terminal) */}
                <Panel defaultSize={45} minSize={30}>
                  <PanelGroup direction="vertical">
                    <Panel defaultSize={70}>
                      <EditorPanel 
                        activeFile={activeFile}
                        openTabs={tabs.openTabs}
                        files={fs.files}
                        onTabClick={tabs.setActiveTabId}
                        onTabClose={tabs.closeTab}
                        onCodeChange={(newCode) => {
                          if (tabs.activeTabId) fs.updateNodeContent(tabs.activeTabId, newCode);
                        }}
                        onSave={() => {}}
                        onRun={handleRun}
                        loading={loading}
                        stdin={stdin}
                        setStdin={setStdin}
                      />
                    </Panel>
                    
                    {isTerminalOpen && (
                      <>
                        <PanelResizeHandle className="h-px bg-gray-800/50 hover:bg-orange-500/50 transition-colors" />
                        <Panel defaultSize={30} minSize={10} className="bg-[#0a0a0c]">
                          <div className="h-full flex flex-col">
                            <div className="flex bg-[#0d0d10] border-b border-gray-800/50">
                              <button 
                                onClick={() => setBottomTab('output')}
                                className={cn("px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-all", bottomTab === 'output' ? "text-orange-500 border-b border-orange-500 bg-orange-500/5" : "text-gray-600")}
                              >
                                Output
                              </button>
                              <button 
                                onClick={() => setBottomTab('terminal')}
                                className={cn("px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-all", bottomTab === 'terminal' ? "text-orange-500 border-b border-orange-500 bg-orange-500/5" : "text-gray-600")}
                              >
                                Terminal
                              </button>
                            </div>
                            <div className="flex-1 overflow-hidden">
                              {bottomTab === 'output' ? (
                                <OutputPanel 
                                  result={result} 
                                  loading={loading}
                                  language={language}
                                  sourceCode={code}
                                />
                              ) : (
                                <TerminalPanel 
                                  onClose={() => setIsTerminalOpen(false)}
                                  onRunCommand={handleCommand}
                                />
                              )}
                            </div>
                          </div>
                        </Panel>
                      </>
                    )}
                  </PanelGroup>
                </Panel>

                <PanelResizeHandle className="w-px bg-gray-800/50 hover:bg-orange-500/50 transition-colors" />

                {/* Right Panel (Visualizer + AI) */}
                <Panel defaultSize={40} minSize={20} collapsible className="bg-[#08080a]">
                  <div className="h-full flex flex-col">
                    <div className="flex bg-[#0a0a0c] border-b border-gray-800/50">
                      <button 
                        onClick={() => setActiveRightTab('visualizer')}
                        className={cn("flex-1 py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all", activeRightTab === 'visualizer' ? "text-orange-500 bg-orange-500/5 border-b-2 border-orange-500" : "text-gray-600 hover:text-gray-400")}
                      >
                        <Activity size={14} /> Visualiser
                      </button>
                      <button 
                        onClick={() => setActiveRightTab('ai')}
                        className={cn("flex-1 py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all", activeRightTab === 'ai' ? "text-orange-500 bg-orange-500/5 border-b-2 border-orange-500" : "text-gray-600 hover:text-gray-400")}
                      >
                        <Sparkles size={14} /> AI Mentor
                      </button>
                    </div>

                    <div className="flex-1 overflow-hidden">
                      {activeRightTab === 'visualizer' ? (
                        <VisualizerPanel 
                          code={code}
                          steps={enhancedSteps}
                          currentStep={player.currentStep}
                          setCurrentStep={player.setCurrentStep}
                          player={{ ...player, executionFailed: result?.success === false }}
                          language={language}
                        />
                      ) : (
                        <AIAssistant 
                          files={fs.files}
                          activeFileCode={code}
                          activeFileName={activeFile?.name}
                          currentStepExplanation={enhancedSteps[player.currentStep]?.explanation}
                          lastResult={result}
                        />
                      )}
                    </div>
                  </div>
                </Panel>
              </PanelGroup>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer / Status Bar */}
      <footer className="h-6 bg-[#1e1e1e] border-t border-gray-800/50 text-white flex items-center justify-between px-3 text-[10px] font-medium z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 hover:bg-white/5 px-2 h-6 cursor-pointer transition-colors">
            <Activity size={12} className="text-green-500" />
            <span className="text-gray-400">Ready</span>
          </div>
          <button 
            onClick={() => setIsLiveServerOpen(!isLiveServerOpen)}
            className={cn(
              "flex items-center gap-1.5 px-2 h-6 transition-colors",
              isLiveServerOpen ? "bg-orange-500/20 text-orange-500" : "hover:bg-white/5 text-gray-400"
            )}
          >
            <Sparkles size={12} />
            <span className="font-bold uppercase tracking-widest">{isLiveServerOpen ? 'Live: Port 5500' : 'Go Live'}</span>
          </button>
        </div>
        <div className="flex items-center gap-4 h-full">
          <button 
            onClick={() => setIsLiveServerOpen(!isLiveServerOpen)}
            className={cn(
              "px-3 h-full flex items-center gap-2 transition-all border-l border-gray-800/50 text-[10px] font-black uppercase tracking-widest",
              isLiveServerOpen ? "bg-orange-500 text-white shadow-[inset_0_0_20px_rgba(0,0,0,0.2)]" : "text-gray-400 hover:bg-white/5"
            )}
          >
            <Globe size={12} className={isLiveServerOpen ? "animate-pulse" : ""} />
            {isLiveServerOpen ? "Live: On" : "Go Live"}
          </button>
          <div className="hover:bg-white/5 px-3 h-full flex items-center cursor-pointer transition-colors border-l border-gray-800/50 text-gray-400">
            {language}
          </div>
          <div className="hover:bg-white/5 px-3 h-full flex items-center cursor-pointer transition-colors border-l border-gray-800/50 text-gray-400">
            UTF-8
          </div>
        </div>
      </footer>

      {/* Live Preview Overlay */}
      <AnimatePresence>
        {isLiveServerOpen && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed top-16 right-6 bottom-10 w-[450px] z-[60] shadow-2xl rounded-2xl overflow-hidden border border-gray-800 ring-1 ring-orange-500/20 bg-[#0d0d10]"
          >
            <LivePreview 
              files={fs.files} 
              activeFileId={tabs.activeTabId} 
              onClose={() => setIsLiveServerOpen(false)} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {modalConfig && (
        <CustomModal 
          isOpen={modalConfig.isOpen}
          onClose={() => setModalConfig(prev => prev ? { ...prev, isOpen: false } : null)}
          title={modalConfig.title}
          placeholder={modalConfig.placeholder}
          onSubmit={modalConfig.onSubmit}
        />
      )}
    </div>
  );
}
