'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Activity, Layout, GitBranch, Share2,
  Layers, Lightbulb, Info, Maximize2, Minimize2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExecutionStep } from '@/types';
import { generateExplanation } from '@/lib/explainStep';
import { motion, AnimatePresence } from 'framer-motion';
import { preprocessCode } from '@/lib/preprocessor';
import dynamic from 'next/dynamic';
import PlaybackControls from './PlaybackControls';

// Lazy-load heavy visualizer tabs to keep initial bundle small
const MemoryMap      = dynamic(() => import('./MemoryMap'),      { ssr: false });
const ArrayView      = dynamic(() => import('./ArrayView'),      { ssr: false });
const TreeView       = dynamic(() => import('./TreeView'),       { ssr: false });
const RecursionTree  = dynamic(() => import('./RecursionTree'),  { ssr: false });
const Flowchart      = dynamic(() => import('./Flowchart'),      { ssr: false });

interface VisualizerPanelProps {
  steps: ExecutionStep[];
  currentStep: number;
  setCurrentStep: (step: number) => void;
  player: any;
  /** Raw source code (not yet preprocessed) */
  code: string;
  language: string;
}

type TabType = 'memory' | 'array' | 'tree' | 'recursion' | 'flowchart';

export default function VisualizerPanel({
  steps, currentStep, setCurrentStep, player, code, language,
}: VisualizerPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('memory');
  const [isExpanded, setIsExpanded] = useState(false);
  const [displayText, setDisplayText] = useState('');

  // Always use preprocessed code for the flowchart so it reflects real execution
  const preprocessedCode = useMemo(() => preprocessCode(code, language), [code, language]);

  const step = steps[currentStep] ?? {
    variables: {},
    lineContent: 'Initializing…',
    explanation: 'Ready to visualize.',
    stepIndex: 0,
    lineNumber: 0,
    stdout: '',
  };

  const fullExplanation = useMemo(
    () => generateExplanation(step, code, language),
    [step, code, language],
  );

  // Typewriter effect for explanation
  useEffect(() => {
    let i = 0;
    setDisplayText('');
    const timer = setInterval(() => {
      if (i < fullExplanation.length) {
        setDisplayText(prev => prev + fullExplanation.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 8);
    return () => clearInterval(timer);
  }, [fullExplanation]);

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'memory',    label: 'Memory',    icon: <Layers size={12} /> },
    { id: 'array',     label: 'Array',     icon: <Layout size={12} /> },
    { id: 'tree',      label: 'Tree',      icon: <GitBranch size={12} /> },
    { id: 'recursion', label: 'Recursion', icon: <Share2 size={12} /> },
    { id: 'flowchart', label: 'Flowchart', icon: <Activity size={12} /> },
  ];

  return (
    <div className={cn(
      'h-full flex flex-col bg-[#050507] transition-all duration-500',
      isExpanded ? 'fixed inset-0 z-[100] p-4' : 'relative',
    )}>
      {/* Simulated trace banner */}
      {player.executionFailed && (
        <div className="px-4 py-1.5 shrink-0">
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-orange-200/70">
                Viewing Simulated Trace (Execution Failed)
              </span>
            </div>
            <Info size={13} className="text-orange-500/50" />
          </div>
        </div>
      )}

      {/* AI Insight card */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <motion.div layout className="glass-card p-4 relative overflow-hidden group orange-glow">
          <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/10 blur-[80px] -mr-20 -mt-20 rounded-full" />
          <div className="flex gap-4 items-start relative z-10">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30 shrink-0">
              <Lightbulb size={20} className="text-orange-500" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-[0.25em] text-orange-500">
                  Step {currentStep + 1} / {steps.length || 1}
                </span>
                <button
                  onClick={() => setIsExpanded(e => !e)}
                  className="p-1 text-gray-600 hover:text-white transition-colors"
                >
                  {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
              </div>
              <div
                className="text-xs text-gray-200 leading-relaxed font-medium min-h-[2rem]"
                dangerouslySetInnerHTML={{ __html: displayText }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tab bar — scrollable on mobile */}
      <div className="px-4 pb-2 shrink-0 overflow-x-auto">
        <div className="flex p-1 bg-white/[0.03] border border-white/5 rounded-xl gap-1 min-w-max">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all relative shrink-0',
                activeTab === tab.id
                  ? 'text-orange-500 bg-orange-500/10'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5',
              )}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeVisualizerTab"
                  className="absolute inset-0 border border-orange-500/50 rounded-lg"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                />
              )}
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden relative px-4 pb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="h-full glass-card p-3 overflow-hidden"
          >
            {activeTab === 'memory'    && <MemoryMap variables={step.variables} />}
            {activeTab === 'array'     && <ArrayView variables={step.variables} />}
            {activeTab === 'tree'      && <TreeView variables={step.variables} />}
            {activeTab === 'recursion' && <RecursionTree steps={steps} currentStep={currentStep} />}
            {activeTab === 'flowchart' && (
              <Flowchart
                steps={steps}
                currentStep={currentStep}
                code={preprocessedCode}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Playback controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
        <PlaybackControls
          currentStep={currentStep}
          totalSteps={steps.length || 1}
          isPlaying={player.isPlaying}
          onPlayPause={() => player.isPlaying ? player.pause() : player.play()}
          onStepForward={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
          onStepBackward={() => setCurrentStep(Math.max(0, currentStep - 1))}
          onJumpToStart={() => setCurrentStep(0)}
          onJumpToEnd={() => setCurrentStep(steps.length - 1)}
          speed={player.speed}
          setSpeed={player.setSpeed}
        />
      </div>
    </div>
  );
}
