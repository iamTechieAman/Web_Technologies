'use client';
import React from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, 
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useThemeClasses } from '@/context/ThemeContext';

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

export default React.memo(function PlaybackControls({
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
  const themeClasses = useThemeClasses();

  return (
    <div className={cn("px-6 py-3 flex items-center gap-6 rounded-2xl transition-all duration-500 glass-panel", themeClasses.bgSecondary, themeClasses.border, "hover:scale-[1.01]")}>
      {/* Step Back Controls */}
      <div className="flex items-center gap-1">
        <button 
          onClick={onJumpToStart}
          className={cn("p-2 transition-all rounded-lg group/btn relative", themeClasses.textTertiary, "hover:text-white hover:bg-white/5")}
          title="Jump to Start"
        >
          <SkipBack size={16} />
          <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-black/90 text-[8px] font-black text-white px-2 py-1 rounded-md opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap border border-white/10 shadow-xl">START</span>
        </button>
        <button 
          onClick={onStepBackward}
          className={cn("p-2 transition-all rounded-lg disabled:opacity-30", themeClasses.textTertiary, "hover:text-white hover:bg-white/5")}
          disabled={currentStep === 0}
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* Main Play Toggle */}
      <motion.button 
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        onClick={onPlayPause}
        className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg shadow-cyan-500/10",
          isPlaying 
            ? cn("bg-white/5 border border-white/10 text-white hover:bg-white/10")
            : cn("bg-[#06B6D4] text-white shadow-[0_0_20px_rgba(6,182,212,0.2)]")
        )}
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} className="fill-current ml-1" />}
      </motion.button>

      {/* Step Forward Controls */}
      <div className="flex items-center gap-1">
        <button 
          onClick={onStepForward}
          className={cn("p-2 transition-all rounded-lg disabled:opacity-30", themeClasses.textTertiary, "hover:text-white hover:bg-white/5")}
          disabled={currentStep >= totalSteps - 1}
        >
          <ChevronRight size={20} />
        </button>
        <button 
          onClick={onJumpToEnd}
          className={cn("p-2 transition-all rounded-lg group/btn relative", themeClasses.textTertiary, "hover:text-white hover:bg-white/5")}
          title="Jump to End"
        >
          <SkipForward size={16} />
          <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-black/90 text-[8px] font-black text-white px-2 py-1 rounded-md opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap border border-white/10 shadow-xl">END</span>
        </button>
      </div>

      <div className={cn("h-6 w-px mx-1 bg-white/5")} />
      
      {/* Speed Slider */}
      <div className="flex flex-col gap-1.5 items-center min-w-[100px]">
        <div className="flex items-center justify-between w-full px-1">
          <span className={cn("text-[7px] font-black uppercase tracking-widest text-white/30")}>Delay</span>
          <span className={cn("text-[8px] font-mono font-bold text-cyan-400")}>{speed}ms</span>
        </div>
        <input 
          type="range" 
          min="50" 
          max="1000" 
          step="50"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="w-full cursor-pointer h-1 rounded-full appearance-none bg-white/5 accent-cyan-500 hover:bg-white/10 transition-all"
        />
      </div>

      {/* Progress */}
      <div className="flex flex-col items-end gap-1 min-w-[50px]">
        <div className="flex items-center gap-1.5">
          <span className={cn("text-[10px] font-black text-white")}>{currentStep + 1}</span>
          <span className={cn("text-[8px] font-bold text-white/20")}>/</span>
          <span className={cn("text-[8px] font-bold text-white/40")}>{totalSteps || 1}</span>
        </div>
        <div className="w-12 h-1 rounded-full bg-white/5 overflow-hidden">
          <motion.div 
            className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / Math.max(totalSteps, 1)) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
});
