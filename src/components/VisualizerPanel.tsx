'use client';
import React, { useState, useTransition } from 'react';
import { 
  Database, Layout as LayoutArray, GitBranch, 
  Workflow, Network, Info, GitGraph, ChevronDown, Sparkles, Loader2, Brain, X
} from 'lucide-react';
import { cn, dynamicWithRetry } from '@/lib/utils';
import { ExecutionStep } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import PlaybackControls from './PlaybackControls';
import { AI_TOOLS, AIToolMode } from '@/lib/aiTools';
import { useTheme, useThemeClasses } from '@/context/ThemeContext';

// Loading component for visualizer tabs
const TabLoading = () => (
  <div className="h-full flex flex-col items-center justify-center p-8 opacity-40">
    <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-4" />
    <p className="text-[10px] font-black uppercase tracking-widest text-cyan-500">Loading Module...</p>
  </div>
);

// Lazy-load heavy visualizer tabs with loading state and retry logic
const MemoryMap      = dynamic(() => dynamicWithRetry(() => import('./MemoryMap')),      { ssr: false, loading: () => <TabLoading /> });
const ArrayView      = dynamic(() => dynamicWithRetry(() => import('./ArrayView')),      { ssr: false, loading: () => <TabLoading /> });
const TreeView       = dynamic(() => dynamicWithRetry(() => import('./TreeView')),       { ssr: false, loading: () => <TabLoading /> });
const RecursionTree  = dynamic(() => dynamicWithRetry(() => import('./RecursionTree')),  { ssr: false, loading: () => <TabLoading /> });
const Flowchart      = dynamic(() => dynamicWithRetry(() => import('./Flowchart')),      { ssr: false, loading: () => <TabLoading /> });
const CodeMapView    = dynamic(() => dynamicWithRetry(() => import('./CodeMapView')),    { ssr: false, loading: () => <TabLoading /> });
const DatabaseVisualizer = dynamic(() => dynamicWithRetry(() => import('./DatabaseVisualizer')), { ssr: false, loading: () => <TabLoading /> });

interface VisualizerPanelProps {
  steps: ExecutionStep[];
  currentStep: number;
  setCurrentStep: (step: number) => void;
  // eslint-disable-next-line
  player: any;
  /** Raw source code (not yet preprocessed) */
  code: string;
  _language: string;
  fileId?: string;
}

type TabType = 'memory' | 'database' | 'array' | 'tree' | 'recursion' | 'flowchart' | 'codemap';

export default React.memo(function VisualizerPanel({
  steps, currentStep, setCurrentStep: _setCurrentStep, player, code, _language: __language, fileId
}: VisualizerPanelProps) {
  const { isDark } = useTheme();
  const themeClasses = useThemeClasses();
  const [activeTab, setActiveTab] = useState<TabType>('memory');
  const [toolsOpen, setToolsOpen] = useState(false);
  const [aiInsight, setAiInsight] = useState<{ title: string; content: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const currentSnapshot = steps[currentStep]?.variables || {};
  const [, startTransition] = useTransition();

  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
  };

  const tabs = [
    { id: 'memory' as const, label: 'Memory Map', icon: Database },
    { id: 'database' as const, label: 'Data Model', icon: Database },
    { id: 'array' as const, label: 'Array View', icon: LayoutArray },
    { id: 'tree' as const, label: 'Tree View', icon: Network },
    { id: 'recursion' as const, label: 'Recursion', icon: GitBranch },
    { id: 'flowchart' as const, label: 'Flowchart', icon: Workflow },
    { id: 'codemap' as const, label: 'Code Map', icon: GitGraph },
  ];

  const buildVisualizerContext = (): string => {
    const current = steps[currentStep];
    return `# Visualization Context

**Language:** ${__language}
**Current Step:** ${currentStep + 1} of ${steps.length || 0}

## Current Code
\`\`\`${__language}
${code || ''}
\`\`\`

## Runtime Snapshot
\`\`\`json
${JSON.stringify(currentSnapshot, null, 2)}
\`\`\`

## Current Execution Step
${current?.explanation || 'No execution step selected.'}`;
  };

  const runAiTool = async (tool: typeof AI_TOOLS[number]): Promise<void> => {
    setToolsOpen(false);
    setAiLoading(true);
    setAiInsight({ title: tool.name, content: '' });
    
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: tool.mode as AIToolMode,
          context: buildVisualizerContext(),
          messages: [{ role: 'user', content: tool.prompt }],
        }),
      });

      if (!response.ok) throw new Error('Failed to run AI tool');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            accumulatedContent += chunk;
            setAiInsight({ title: tool.name, content: accumulatedContent });
          }
        } finally {
          reader.releaseLock();
        }
      }
    } catch (error) {
      setAiInsight({ 
        title: tool.name, 
        content: `### ⚠️ Analysis Interrupted\n\nUnable to run this tool: **${error instanceof Error ? error.message : String(error)}**\n\nEnsure your API keys are valid in .env.local.` 
      });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className={cn("h-full flex flex-col", themeClasses.bg)}>
      {/* Visualizer Tabs */}
      <div className={cn("border-b", themeClasses.border, themeClasses.bgSecondary)}>
        <div className="flex items-center justify-between gap-4 px-4 h-12">
          <div className="flex overflow-x-auto no-scrollbar h-full gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-5 text-[9px] font-black uppercase tracking-[0.2em] transition-all relative whitespace-nowrap h-full group",
                    isActive 
                      ? cn(themeClasses.accent, "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-cyan-500 bg-cyan-500/5") 
                      : cn(themeClasses.textTertiary, "hover:text-white hover:bg-white/5")
                  )}
                >
                  <Icon size={14} className={cn("transition-transform group-hover:scale-110", isActive ? themeClasses.accent : "opacity-40")} />
                  {tab.label}
                </button>
              );
            })}
          </div>
          
          <div className="relative shrink-0">
            <button
              onClick={() => setToolsOpen(open => !open)}
              disabled={aiLoading}
              className={cn(
                "h-8 flex items-center gap-2 px-4 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50",
                toolsOpen 
                  ? "border-purple-500/50 bg-purple-500/10 text-purple-400"
                  : "border-cyan-500/30 bg-cyan-500/5 text-cyan-400 hover:border-cyan-500/60 shadow-lg shadow-cyan-500/10"
              )}
            >
              {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Brain size={12} />}
              AI Tools
              <ChevronDown size={12} className={cn("transition-transform", toolsOpen && "rotate-180")} />
            </button>
            <AnimatePresence>
              {toolsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className={cn("absolute right-0 top-11 z-[100] w-80 rounded-2xl border shadow-2xl overflow-hidden backdrop-blur-2xl", themeClasses.border, themeClasses.bgSurface)}
                >
                  <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Deep Analysis Tools</span>
                    <span className="flex items-center gap-1 text-[9px] text-cyan-400 font-bold uppercase"><Sparkles size={10} /> model 4.0</span>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-2">
                    {AI_TOOLS.map(tool => {
                      const ToolIcon = tool.icon;
                      return (
                        <button
                          key={tool.id}
                          onClick={() => runAiTool(tool)}
                          className={cn("w-full flex items-start gap-4 px-4 py-3 rounded-xl text-left transition-all group", "hover:bg-cyan-500/10")}
                        >
                          <div className="p-2 rounded-lg bg-white/5 group-hover:bg-cyan-500/20 text-gray-400 group-hover:text-cyan-400 transition-colors">
                            <ToolIcon size={16} />
                          </div>
                          <div className="min-w-0 pt-0.5">
                            <span className="block text-xs font-bold text-gray-200 group-hover:text-white truncate">{tool.name}</span>
                            <span className="block text-[10px] text-gray-500 group-hover:text-gray-400 line-clamp-1">{tool.prompt}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={cn("flex-1 min-h-0 relative group overflow-hidden bg-grid-pattern", isDark ? "" : "bg-gray-50/50")}>
        <div className="absolute inset-0 overflow-auto custom-scrollbar p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
              transition={{ duration: 0.3, ease: "circOut" }}
              className="h-full"
            >
              {activeTab === 'memory' && <MemoryMap variables={currentSnapshot} />}
              {activeTab === 'database' && <DatabaseVisualizer variables={currentSnapshot} />}
              {activeTab === 'array' && <ArrayView variables={currentSnapshot} />}
              {activeTab === 'tree' && <TreeView variables={currentSnapshot} />}
              {activeTab === 'recursion' && <RecursionTree steps={steps} currentStep={currentStep} />}
              {activeTab === 'flowchart' && <Flowchart steps={steps} currentStep={currentStep} code={code} />}
              {activeTab === 'codemap' && <CodeMapView code={code} language={__language} fileId={fileId || 'temp'} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Floating Explanation Overlay */}
        {activeTab !== 'codemap' && steps[currentStep]?.explanation && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-6 left-6 right-6 z-20 pointer-events-none"
          >
            <div className={cn(
              "backdrop-blur-2xl border p-5 rounded-3xl shadow-2xl flex items-start gap-5 max-w-3xl mx-auto pointer-events-auto ring-1",
              isDark ? "bg-black/80 border-white/10 ring-white/5" : "bg-white/90 border-gray-200 ring-black/5 shadow-gray-200/50"
            )}>
              <div className="p-3 bg-cyan-500/10 rounded-2xl text-cyan-500 shrink-0 shadow-inner">
                <Info size={20} strokeWidth={2.5} />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-500/60">Execution Insight</span>
                <p className={cn("text-xs leading-relaxed font-medium", isDark ? "text-white/90" : "text-gray-900")} dangerouslySetInnerHTML={{ __html: steps[currentStep].explanation }} />
              </div>
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {aiInsight && (
            <motion.aside
              initial={{ opacity: 0, x: 50, filter: 'blur(10px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: 50, filter: 'blur(10px)' }}
              className={cn("absolute top-6 right-6 bottom-6 z-50 w-[min(480px,calc(100%-3rem))] rounded-[2rem] border shadow-2xl flex flex-col overflow-hidden backdrop-blur-3xl", themeClasses.border, themeClasses.bgSurface)}
            >
              <div className="px-6 py-4 border-b flex items-center justify-between bg-white/5 border-white/5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", isDark ? "bg-purple-500/20 text-purple-400" : "bg-purple-100 text-purple-600")}>
                    <Sparkles size={16} />
                  </div>
                  <h3 className={cn("text-sm font-black truncate uppercase tracking-widest", isDark ? "text-white" : "text-gray-900")}>{aiInsight.title}</h3>
                </div>
                <button onClick={() => setAiInsight(null)} className={cn("p-2 rounded-full transition-colors", isDark ? "hover:bg-white/10 text-gray-500" : "hover:bg-black/5 text-gray-400")}><X size={18} /></button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                {aiLoading ? (
                  <div className="h-full flex flex-col items-center justify-center gap-4">
                    <div className="relative">
                      <div className={cn("w-12 h-12 border-4 rounded-full animate-spin", isDark ? "border-purple-500/10 border-t-purple-500" : "border-purple-200 border-t-purple-600")} />
                      <div className={cn("absolute inset-0 blur-xl animate-pulse", isDark ? "bg-purple-500/20" : "bg-purple-500/10")} />
                    </div>
                    <span className={cn("text-[10px] font-black uppercase tracking-[0.3em]", isDark ? "text-purple-400" : "text-purple-600")}>Deep Synthesizing</span>
                  </div>
                ) : (
                  <div className={cn("prose prose-xs max-w-none", isDark ? "prose-invert" : "prose-slate")}>
                    <div className={cn("text-[12px] leading-relaxed font-medium whitespace-pre-wrap", isDark ? "text-gray-300" : "text-gray-700")}>{aiInsight.content}</div>
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Playback Controls */}
      {activeTab !== 'codemap' && (
        <div className={cn("p-6 border-t", themeClasses.border, themeClasses.bgSurface)}>
          <PlaybackControls
            currentStep={currentStep}
            totalSteps={steps.length}
            isPlaying={player.isPlaying}
            onPlayPause={player.togglePlay}
            onStepForward={player.stepForward}
            onStepBackward={player.stepBackward}
            onJumpToStart={() => player.setCurrentStep(0)}
            onJumpToEnd={() => player.setCurrentStep(steps.length - 1)}
            speed={player.playbackSpeed}
            setSpeed={player.setPlaybackSpeed}
          />
        </div>
      )}
    </div>
  );
});
