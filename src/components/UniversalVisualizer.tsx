'use client';
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, Database, GitBranch, TreePine,
  BarChart3, Network, Box, Layers, PlayCircle,
  PauseCircle, SkipForward, SkipBack, RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExecutionStep, SupportedLanguage } from '@/types';

interface UniversalVisualizerProps {
  steps: ExecutionStep[];
  currentStep: number;
  setCurrentStep: (step: number) => void;
  player: any;
  _code: string;
  language: SupportedLanguage;
}

const VISUALIZATION_TYPES = [
  { id: 'memory', name: 'Memory', icon: Database, description: 'Variable tracking' },
  { id: 'arrays', name: 'Array', icon: Database, description: 'Array operations' },
  { id: 'trees', name: 'Tree', icon: TreePine, description: 'Tree structures' },
  { id: 'graphs', name: 'Graph', icon: Network, description: 'Graph algorithms' },
  { id: 'flow', name: 'Flow', icon: GitBranch, description: 'Control flow' },
  { id: 'stack', name: 'Stack', icon: Layers, description: 'Call stack' },
  { id: 'heap', name: 'Heap', icon: Box, description: 'Memory heap' },
  { id: 'performance', name: 'Performance', icon: BarChart3, description: 'Performance metrics' }
] as const;

export default function UniversalVisualizer({
  steps, currentStep, setCurrentStep, player, _code: _, language
}: UniversalVisualizerProps) {
  const [activeVisualization, setActiveVisualization] = useState('memory');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const currentStepData = steps[currentStep];
  
  const languageFeatures = useMemo(() => {
    const features = {
      memory: true,
      arrays: ['python', 'javascript', 'typescript', 'cpp', 'c', 'java', 'csharp', 'rust', 'go'].includes(language),
      trees: ['python', 'javascript', 'typescript', 'cpp', 'java', 'csharp', 'rust', 'go'].includes(language),
      graphs: ['python', 'javascript', 'typescript', 'cpp', 'java', 'csharp', 'rust'].includes(language),
      flow: true,
      stack: ['python', 'javascript', 'typescript', 'cpp', 'c', 'java', 'csharp', 'rust', 'go'].includes(language),
      heap: ['cpp', 'c', 'java', 'csharp', 'rust'].includes(language),
      performance: true
    };
    return features;
  }, [language]);

  const renderVisualization = () => {
    if (!currentStepData) return null;

    switch (activeVisualization) {
      case 'memory':
        return <MemoryVisualization step={currentStepData} language={language} />;
      case 'arrays':
        return <ArrayVisualization step={currentStepData} language={language} />;
      case 'trees':
        return <TreeVisualization step={currentStepData} language={language} />;
      case 'graphs':
        return <GraphVisualization step={currentStepData} language={language} />;
      case 'flow':
        return <FlowVisualization step={currentStepData} language={language} />;
      case 'stack':
        return <StackVisualization step={currentStepData} language={language} />;
      case 'heap':
        return <HeapVisualization step={currentStepData} language={language} />;
      case 'performance':
        return <PerformanceVisualization steps={steps} currentStep={currentStep} language={language} />;
      default:
        return <MemoryVisualization step={currentStepData} language={language} />;
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      player.play();
    } else {
      player.pause();
    }
  };

  const handleStepForward = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleStepBackward = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
    player.reset();
  };

  return (
    <div className="h-full flex flex-col bg-[#0d0d0f]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#2d2d30] bg-[#1a1a1d]/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity size={16} className="text-cyan-500" />
            <span className="text-sm font-medium text-white">Universal Visualizer</span>
            <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-[10px] font-medium rounded-full">
              {language}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            Step {currentStep + 1}/{steps.length}
          </div>
        </div>
      </div>

      {/* Visualization Type Selector */}
      <div className="px-4 py-2 border-b border-[#2d2d30] bg-[#1a1a1d]/30">
        <div className="flex gap-1 flex-wrap">
          {VISUALIZATION_TYPES.filter(viz => languageFeatures[viz.id]).map((viz) => {
            const Icon = viz.icon;
            return (
              <button
                key={viz.id}
                onClick={() => setActiveVisualization(viz.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-medium flex items-center gap-1.5 transition-all",
                  activeVisualization === viz.id
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                )}
                title={viz.description}
              >
                <Icon size={12} />
                {viz.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Visualization Area */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        <div className="absolute inset-0 p-4">
          {renderVisualization()}
        </div>
        
        {steps.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Database size={48} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No execution steps available</p>
              <p className="text-gray-500 text-xs mt-1">Run your code to see visualizations</p>
            </div>
          </div>
        )}
      </div>

      {/* Playback Controls */}
      <div className="px-4 py-3 border-t border-[#2d2d30] bg-[#1a1a1d]/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleStepBackward}
              disabled={currentStep === 0}
              className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SkipBack size={14} />
            </button>
            <button
              onClick={handlePlayPause}
              className="p-1.5 text-cyan-500 hover:text-cyan-400 hover:bg-cyan-500/10 rounded transition-all"
            >
              {isPlaying ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
            </button>
            <button
              onClick={handleStepForward}
              disabled={currentStep === steps.length - 1}
              className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SkipForward size={14} />
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded transition-all"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400">Speed:</span>
              <select
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="bg-[#2d2d30] text-gray-300 text-[10px] px-2 py-1 rounded border border-[#3e3e42] focus:outline-none focus:border-cyan-500/50"
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>
            </div>
            
            {/* Progress Bar */}
            <div className="w-32 h-1 bg-[#2d2d30] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-cyan-500"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Memory Visualization Component
function MemoryVisualization({ step, language: _language }: { step: ExecutionStep; language: SupportedLanguage }) {
  const variables = step.variables || {};
  
  return (
    <div className="h-full flex flex-col">
      <div className="mb-3">
        <h3 className="text-sm font-medium text-white mb-2">Memory State</h3>
        <div className="text-xs text-gray-400 font-mono bg-[#1a1a1d] p-2 rounded">
          Line {step.lineNumber}: {step.lineContent.slice(0, 60)}...
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        {Object.keys(variables).length === 0 ? (
          <div className="text-center text-gray-500 text-sm mt-8">
            <Database size={32} className="mx-auto mb-2 opacity-50" />
            No variables in memory
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(variables).map(([name, value]) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-2 bg-[#1a1a1d] rounded border border-[#2d2d30]"
              >
                <span className="text-cyan-400 font-mono text-sm">{name}</span>
                <span className="text-gray-300 font-mono text-sm">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Array Visualization Component
function ArrayVisualization({ step, language: _language }: { step: ExecutionStep; language: SupportedLanguage }) {
  const arraySnapshot = step.arraySnapshot || [];
  
  return (
    <div className="h-full flex flex-col">
      <div className="mb-3">
        <h3 className="text-sm font-medium text-white mb-2">Array Visualization</h3>
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        {arraySnapshot.length === 0 ? (
          <div className="text-center text-gray-500 text-sm">
            <Database size={32} className="mx-auto mb-2 opacity-50" />
            No array data available
          </div>
        ) : (
          <div className="flex gap-1 flex-wrap justify-center">
            {arraySnapshot.map((value, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "w-12 h-12 flex items-center justify-center rounded border text-sm font-mono",
                  step.accessedIndices?.includes(index)
                    ? "bg-yellow-500/20 border-yellow-500 text-yellow-300"
                    : step.updatedIndices?.includes(index)
                    ? "bg-green-500/20 border-green-500 text-green-300"
                    : "bg-[#1a1a1d] border-[#2d2d30] text-gray-300"
                )}
              >
                {value}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Tree Visualization Component
function TreeVisualization({ step: _step, language: _language }: { step: ExecutionStep; language: SupportedLanguage }) {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-3">
        <h3 className="text-sm font-medium text-white mb-2">Tree Structure</h3>
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500 text-sm">
          <TreePine size={32} className="mx-auto mb-2 opacity-50" />
          Tree visualization coming soon
        </div>
      </div>
    </div>
  );
}

// Graph Visualization Component
function GraphVisualization({ step: _step, language: _language }: { step: ExecutionStep; language: SupportedLanguage }) {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-3">
        <h3 className="text-sm font-medium text-white mb-2">Graph Structure</h3>
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500 text-sm">
          <Network size={32} className="mx-auto mb-2 opacity-50" />
          Graph visualization coming soon
        </div>
      </div>
    </div>
  );
}

// Flow Visualization Component
function FlowVisualization({ step: _step, language: _language }: { step: ExecutionStep; language: SupportedLanguage }) {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-3">
        <h3 className="text-sm font-medium text-white mb-2">Control Flow</h3>
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500 text-sm">
          <GitBranch size={32} className="mx-auto mb-2 opacity-50" />
          Flow visualization coming soon
        </div>
      </div>
    </div>
  );
}

// Stack Visualization Component
function StackVisualization({ step, language: _language }: { step: ExecutionStep; language: SupportedLanguage }) {
  const callStack = step.callStack || [];
  
  return (
    <div className="h-full flex flex-col">
      <div className="mb-3">
        <h3 className="text-sm font-medium text-white mb-2">Call Stack</h3>
      </div>
      
      <div className="flex-1 flex flex-col-reverse gap-1">
        {callStack.length === 0 ? (
          <div className="text-center text-gray-500 text-sm mt-8">
            <Layers size={32} className="mx-auto mb-2 opacity-50" />
            Call stack is empty
          </div>
        ) : (
          callStack.map((frame, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-2 bg-[#1a1a1d] border border-[#2d2d30] rounded text-sm font-mono text-gray-300"
            >
              {frame}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

// Heap Visualization Component
function HeapVisualization({ step: _step, language: _language }: { step: ExecutionStep; language: SupportedLanguage }) {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-3">
        <h3 className="text-sm font-medium text-white mb-2">Memory Heap</h3>
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500 text-sm">
          <Box size={32} className="mx-auto mb-2 opacity-50" />
          Heap visualization coming soon
        </div>
      </div>
    </div>
  );
}

// Performance Visualization Component
function PerformanceVisualization({ steps: _steps, currentStep: _currentStep, language: _language }: { 
  steps: ExecutionStep[]; 
  currentStep: number; 
  language: SupportedLanguage;
}) {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-3">
        <h3 className="text-sm font-medium text-white mb-2">Performance Metrics</h3>
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500 text-sm">
          <BarChart3 size={32} className="mx-auto mb-2 opacity-50" />
          Performance metrics coming soon
        </div>
      </div>
    </div>
  );
}
