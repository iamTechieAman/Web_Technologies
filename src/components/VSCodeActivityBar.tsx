'use client';
import React from 'react';
import { 
  File, 
  Search, 
  GitBranch, 
  Bug, 
  Puzzle, 
  User,
  Settings,
  BookOpen,
  Clock
} from 'lucide-react';
import { useTheme, useThemeClasses } from '@/context/ThemeContext';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ActivityBarProps {
  activeView: 'explorer' | 'problem' | 'search' | 'source-control' | 'debug' | 'extensions' | 'history';
  onViewChange: (view: 'explorer' | 'problem' | 'search' | 'source-control' | 'debug' | 'extensions' | 'history') => void;
}

export default function VSCodeActivityBar({ activeView, onViewChange }: ActivityBarProps) {
  const { isDark } = useTheme();
  const themeClasses = useThemeClasses();

  const activityItems = [
    { id: 'explorer' as const, icon: File, label: 'Explorer' },
    { id: 'problem' as const, icon: BookOpen, label: 'Problem Description' },
    { id: 'search' as const, icon: Search, label: 'Search' },
    { id: 'source-control' as const, icon: GitBranch, label: 'Source Control' },
    { id: 'debug' as const, icon: Bug, label: 'Run and Debug' },
    { id: 'extensions' as const, icon: Puzzle, label: 'Extensions' },
    { id: 'history' as const, icon: Clock, label: 'History' },
  ];

  return (
    <div className={cn("w-14 flex flex-col items-center py-4 border-r", themeClasses.bgSecondary, themeClasses.border)}>
      <div className="flex flex-col gap-3 mb-4 w-full px-2">
        {activityItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "w-10 h-10 flex items-center justify-center rounded-xl transition-all relative group overflow-hidden",
                isActive 
                  ? cn(themeClasses.accentBg, themeClasses.accent, "shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]")
                  : cn(themeClasses.textTertiary, "hover:text-cyan-500 hover:bg-cyan-500/5 active:scale-95")
              )}
              title={item.label}
            >
              <Icon size={20} className={cn("transition-transform duration-300 group-hover:scale-110", isActive && "scale-110")} strokeWidth={isActive ? 2.5 : 2} />
              
              {isActive && (
                <motion.div 
                  layoutId="activityIndicator"
                  className={cn("absolute left-0 w-0.5 h-6 rounded-r-full", themeClasses.accent)}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                />
              )}
            </button>
          );
        })}
      </div>
      
      <div className="flex-1" />
      
      <div className="flex flex-col gap-3 w-full px-2">
        <button
          className={cn(
            "w-10 h-10 flex items-center justify-center rounded-xl transition-all group hover:bg-cyan-500/5 active:scale-95",
            themeClasses.textTertiary, "hover:text-cyan-500"
          )}
          title="Settings"
        >
          <Settings size={20} strokeWidth={2} />
        </button>
        
        <button
          className={cn(
            "w-10 h-10 flex items-center justify-center rounded-xl transition-all group hover:bg-cyan-500/5 active:scale-95",
            themeClasses.textTertiary, "hover:text-cyan-500"
          )}
          title="Account"
        >
          <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center", themeClasses.border)}>
            <User size={14} />
          </div>
        </button>
      </div>
    </div>
  );
}
