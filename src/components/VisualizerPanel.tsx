'use client';
import React, { useState, useEffect } from 'react';
import { 
  Activity, Layout, GitBranch, Share2, 
  Layers, Play, SkipBack, SkipForward, Pause,
  Lightbulb, Info, Maximize2, Minimize2,
  ChevronRight, ChevronLeft, FastForward
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExecutionStep } from '@/types';
import { generateExplanation } from '@/lib/explainStep';
import { motion, AnimatePresence } from 'framer-motion';
import MemoryMap from './MemoryMap';
import ArrayView from './ArrayView';
import TreeView from './TreeView';
import RecursionTree from './RecursionTree';
import Flowchart from './Flowchart';
import PlaybackControls from './PlaybackControls';

interface VisualizerPanelProps {
  steps: ExecutionStep[];
  currentStep: number;
  setCurrentStep: (step: number) => void;
  player: any;
  code: string;
  language: string;
}

type TabType = 'memory' | 'array' | 'tree' | 'recursion' | 'flowchart';

export default function VisualizerPanel({ 
  steps, currentStep, setCurrentStep, player, code, language 
}: VisualizerPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('memory');
  const [isExpanded, setIsExpanded] = useState(false);
  const [displayText, setDisplayText] = useState('');
  
  const step = steps[currentStep] || { 
    variables: {}, 
    lineContent: 'Initializing...', 
    explanation: 'Ready to visualize...',
    stepIndex: 0,
    lineNumber: 0,
    stdout: ''
  };

  const fullExplanation = generateExplanation(step, code, language);

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
    }, 10); // Faster typewriter
    return () => clearInterval(timer);
  }, [fullExplanation]);

  const tabs = [
    { id: 'memory', label: 'Memory Map', icon: <Layers size={14} /> },
    { id: 'array', label: 'Array View', icon: <Layout size={14} /> },
    { id: 'tree', label: 'Tree View', icon: <GitBranch size={14} /> },
    { id: 'recursion', label: 'Recursion', icon: <Share2 size={14} /> },
    { id: 'flowchart', label: 'Flowchart', icon: <Activity size={14} /> },
  ];

  return (
    <div className={cn(
      "h-full flex flex-col bg-[#050507] transition-all duration-500",
      isExpanded ? "fixed inset-0 z-[100] p-6" : "relative"
    )}>
      {/* Execution Status Banner */}
      {player.executionFailed && (
        <div className="px-6 py-2">
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-200/70">
                Viewing Simulated Trace (Execution Failed)
              </span>
            </div>
            <Info size={14} className="text-orange-500/50" />
          </div>
        </div>
      )}

      {/* Premium Header / Explanation Card */}
      <div className="p-6 shrink-0">
        <motion.div 
          layout
          className="glass-card p-6 relative overflow-hidden group orange-glow"
        >
          {/* Background Gradient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
          
          <div className="flex gap-6 items-start relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30 group-hover:scale-110 transition-transform duration-500">
              <Lightbulb size={28} className="text-orange-500 animate-pulse" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">AI Mentor Insight</h4>
                  <div className="h-px w-12 bg-orange-500/30" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    Step {currentStep + 1} of {steps.length || 1}
                  </span>
                </div>
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 text-gray-600 hover:text-white transition-colors"
                >
                  {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
              </div>
              <div className="text-sm text-gray-200 leading-relaxed font-medium min-h-[3rem] typewriter-cursor">
                <span dangerouslySetInnerHTML={{ __html: displayText }} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 pb-2 shrink-0">
        <div className="flex p-1.5 bg-white/[0.03] border border-white/5 rounded-2xl gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden group",
                activeTab === tab.id 
                  ? "text-orange-500 bg-orange-500/10 shadow-[inset_0_0_20px_rgba(249,115,22,0.05)]" 
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
              )}
            >
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 border border-orange-500/50 rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Visualization Content */}
      <div className="flex-1 overflow-hidden relative px-6 py-4">
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.02, y: -10 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="h-full relative glass-card p-4"
          >
            {activeTab === 'memory' && <MemoryMap variables={step.variables} />}
            {activeTab === 'array' && <ArrayView variables={step.variables} />}
            {activeTab === 'tree' && <TreeView variables={step.variables} />}
            {activeTab === 'recursion' && <RecursionTree steps={steps} currentStep={currentStep} />}
            {activeTab === 'flowchart' && <Flowchart steps={steps} currentStep={currentStep} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Playback Controls (Floating Pill) */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50">
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
