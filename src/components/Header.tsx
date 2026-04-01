'use client';
import React from 'react';
import Link from 'next/link';
import { Sun, Moon, Play, Loader2, Zap, RotateCcw, BookOpen, Settings, Layout, Code2, Sparkles } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { LANGUAGE_LIST } from '@/lib/utils';
import type { SupportedLanguage } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

interface HeaderProps {
  language?: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void;
  onRun?: () => void;
  onClear?: () => void;
  loading?: boolean;
  showControls?: boolean;
  onSettingsClick?: () => void;
}

export default function Header({
  language, onLanguageChange, onRun, onClear, loading = false, showControls = true, onSettingsClick,
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-14 flex items-center justify-between px-4 bg-[#0d0d10] border-b border-gray-800/50 z-50">
      <div className="flex items-center gap-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Zap size={16} className="text-white fill-white" />
          </div>
          <span className="text-lg font-black tracking-tighter text-white uppercase">
            Code<span className="text-orange-500">Visualizer</span>
          </span>
        </Link>

        {/* Primary Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {[
            { label: 'IDE', href: '/workspace', icon: <Code2 size={14} /> },
            { label: 'Problems', href: '/problems', icon: <BookOpen size={14} /> },
          ].map((item) => (
            <Link 
              key={item.label}
              href={item.href} 
              className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {showControls && language && onLanguageChange && (
          <div className="relative group">
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
              className="appearance-none pl-3 pr-8 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 focus:outline-none transition-all cursor-pointer"
            >
              {LANGUAGE_LIST.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600">
              <ChevronDown size={12} />
            </div>
          </div>
        )}

        {showControls && onRun && (
          <Button 
            onClick={onRun} 
            disabled={loading}
            variant="orange"
            size="sm"
            className="h-8 px-5 gap-2 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-orange-500/10"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} className="fill-current" />}
            {loading ? 'Executing' : 'Run Code'}
          </Button>
        )}

        <div className="h-4 w-px bg-gray-800 mx-1" />

        <div className="flex items-center gap-1">
          {onSettingsClick && (
            <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-500 hover:text-white" onClick={onSettingsClick}>
              <Settings size={16} />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-500 hover:text-white" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-500 hover:text-white">
            <Layout size={16} />
          </Button>
        </div>
      </div>
    </header>
  );
}

function ChevronDown({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
