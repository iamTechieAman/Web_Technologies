'use client';
import React from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, 
  ChevronLeft, ChevronRight, FastForward,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface PlaybackControlsProps {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onJumpToStart: () => void;
  onJumpToEnd: () => void;
  speed: number;
  setSpeed: (speed: number) => void;
}

export default function PlaybackControls({
  currentStep,
  totalSteps,
  isPlaying,
  onPlayPause,
  onStepForward,
  onStepBackward,
  onJumpToStart,
  onJumpToEnd,
  speed,
  setSpeed
}: PlaybackControlsProps) {
  return (
    <div className="glass-pill px-6 py-3 flex items-center gap-6 group hover:scale-105 transition-all duration-500 orange-glow">
      {/* Step Back Controls */}
      <div className="flex items-center gap-2">
        <button 
          onClick={onJumpToStart}
          className="p-2 text-gray-500 hover:text-orange-500 transition-colors group/btn relative"
          title="Jump to Start"
        >
          <SkipBack size={18} />
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-[8px] font-black text-white px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap">START</span>
        </button>
        <button 
          onClick={onStepBackward}
          className="p-2 text-gray-500 hover:text-orange-500 transition-colors"
          disabled={currentStep === 0}
        >
          <ChevronLeft size={24} />
        </button>
      </div>

      {/* Main Play Toggle */}
      <motion.button 
        whileTap={{ scale: 0.9 }}
        onClick={onPlayPause}
        className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl",
          isPlaying 
            ? "bg-white/5 border border-white/10 text-white" 
            : "bg-orange-500 text-white border border-orange-400 shadow-orange-500/30"
        )}
      >
        {isPlaying ? <Pause size={24} /> : <Play size={24} className="fill-current ml-1" />}
      </motion.button>

      {/* Step Forward Controls */}
      <div className="flex items-center gap-2">
        <button 
          onClick={onStepForward}
          className="p-2 text-gray-500 hover:text-orange-500 transition-colors"
          disabled={currentStep >= totalSteps - 1}
        >
          <ChevronRight size={24} />
        </button>
        <button 
          onClick={onJumpToEnd}
          className="p-2 text-gray-500 hover:text-orange-500 transition-colors group/btn relative"
          title="Jump to End"
        >
          <SkipForward size={18} />
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-[8px] font-black text-white px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap">END</span>
        </button>
      </div>

      <div className="h-8 w-px bg-white/10 mx-2" />
      
      {/* Speed Slider */}
      <div className="flex flex-col gap-1 items-center min-w-[80px]">
        <div className="flex items-center justify-between w-full px-1">
          <span className="text-[7px] font-black uppercase tracking-widest text-gray-600">Speed</span>
          <span className="text-[7px] font-mono text-orange-500/70">{speed}ms</span>
        </div>
        <input 
          type="range" 
          min="100" 
          max="2000" 
          step="100"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="w-full accent-orange-500 cursor-pointer h-1.5 bg-white/5 rounded-full appearance-none overflow-hidden"
        />
      </div>

      {/* Progress Ring / Info */}
      <div className="flex flex-col items-end gap-0.5 min-w-[40px]">
        <span className="text-[9px] font-black text-white">{Math.round(((currentStep + 1) / totalSteps) * 100)}%</span>
        <div className="w-10 h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-orange-500"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
