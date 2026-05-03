'use client';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { Sun, Moon, Play, Loader2, Zap, BookOpen, Settings, Code2, Menu, X } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import type { SupportedLanguage } from '@/types';
import { cn } from '@/lib/utils';
import { getLanguageConfig } from '@/lib/languageConfigs';

const FREE_AI_MODELS = [
  { value: 'openrouter/free', label: 'OpenRouter Free Router' },
  { value: 'meta-llama/llama-3.2-3b-instruct:free', label: 'Llama 3.2 3B Free' },
  { value: 'qwen/qwen-2.5-7b-instruct:free', label: 'Qwen 2.5 7B Free' },
  { value: 'google/gemma-3-4b-it:free', label: 'Gemma 3 4B Free' },
];

interface HeaderProps {
  language?: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void;
  onRun?: () => void;
  onClear?: () => void;
  loading?: boolean;
  showControls?: boolean;
  onSettingsClick?: () => void;
  onMenuClick?: () => void;
}

export default function Header({
  language, onLanguageChange: _onLanguageChange, onRun, onClear: _onClear, loading = false, showControls = true, onSettingsClick, onMenuClick
}: HeaderProps): React.ReactNode {
  const { theme, toggleTheme, setTheme, isDark } = useTheme();
  const languageLabel = language ? getLanguageConfig(language).name : '';
  const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [aiModel, setAiModel] = useState('openrouter/free');
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedModel = localStorage.getItem('codevisualizer-ai-model') || 'openrouter/free';
    const validModel = FREE_AI_MODELS.some(model => model.value === savedModel) ? savedModel : 'openrouter/free';
    setAiModel(validModel);
    localStorage.setItem('codevisualizer-ai-model', validModel);
    setReducedMotion(localStorage.getItem('codevisualizer-reduced-motion') === 'true');
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reducedMotion);
    localStorage.setItem('codevisualizer-reduced-motion', String(reducedMotion));
  }, [reducedMotion]);

  const openSettings = (): void => {
    onSettingsClick?.();
    setSettingsOpen(true);
  };

  const updateAiModel = (model: string): void => {
    setAiModel(model);
    localStorage.setItem('codevisualizer-ai-model', model);
  };

  return (
    <header className={cn(
      "h-14 shrink-0 flex items-center justify-between px-4 border-b z-50 glass-panel sticky top-0 transition-all duration-500",
      isDark ? "bg-[#0B0D17]/80 border-white/5" : "bg-white/80 border-gray-200"
    )}>
      <div className="flex items-center gap-6 min-w-0">
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <button 
              onClick={onMenuClick} 
              className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-all active:scale-95 md:hidden"
            >
              <Menu size={20} />
            </button>
          )}
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 bg-gradient-to-br from-cyan-400 to-[#06B6D4] rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-all duration-500 group-hover:rotate-3">
              <Zap size={20} className="text-white fill-white" />
              <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className={cn("text-sm font-black tracking-tighter uppercase leading-none", isDark ? "text-white" : "text-gray-950")}>
                Code<span className="text-[#06B6D4]">Visualizer</span>
              </span>
              <span className="text-[8px] font-bold text-white/20 uppercase tracking-[0.3em]">Next-Gen IDE</span>
            </div>
          </Link>
        </div>

        {/* Primary Navigation */}
        <nav className="hidden xl:flex items-center gap-1">
          {[
            { label: 'IDE', href: '/workspace', icon: <Code2 size={14} /> },
            { label: 'Challenges', href: '/problems', icon: <BookOpen size={14} /> },
          ].map((item) => (
            <Link 
              key={item.label}
              href={item.href} 
              className={cn(
                "flex items-center gap-2.5 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] rounded-2xl transition-all border border-transparent", 
                isDark 
                  ? "text-gray-400 hover:text-white hover:bg-white/5" 
                  : "text-gray-600 hover:text-gray-950 hover:bg-gray-100"
              )}
            >
              <div className="opacity-40">{item.icon}</div>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {showControls && language && (
          <div
            className="hidden lg:flex items-center gap-2 pl-3 pr-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-gray-300"
            title="Language is detected automatically from the file name and code content"
          >
            <Code2 size={13} className="text-cyan-400" />
            <span className="text-gray-500">Auto</span>
            <span>{languageLabel}</span>
          </div>
        )}

        {showControls && onRun && (
          <button 
            onClick={onRun} 
            disabled={loading}
            className={cn(
              "h-11 px-8 rounded-full flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500",
              "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.03] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
            )}
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} className="fill-current group-hover:scale-110 transition-transform" />}
            <span>{loading ? 'Synthesizing' : 'Run Project'}</span>
          </button>
        )}

        <div className={cn("h-6 w-px mx-1", isDark ? "bg-white/10" : "bg-gray-200")} />

        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme}
            className={cn(
              "w-11 h-11 flex items-center justify-center rounded-2xl transition-all duration-300",
              isDark ? "text-white/40 hover:text-white hover:bg-white/5" : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
            )}
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            onClick={openSettings} 
            className={cn(
              "w-11 h-11 flex items-center justify-center rounded-2xl transition-all duration-300",
              isDark ? "text-white/40 hover:text-white hover:bg-white/5" : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
            )} 
            title="Settings"
          >
            <Settings size={20} />
          </button>
          {hasClerk ? (
            <>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className={cn(
                    "hidden sm:inline-flex h-11 items-center rounded-2xl border px-6 text-[10px] font-black uppercase tracking-widest transition-all",
                    isDark 
                      ? "border-white/10 text-gray-300 hover:bg-white/5 hover:text-white" 
                      : "border-gray-300 text-gray-900 hover:bg-gray-100"
                  )}>
                    Login
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className={cn(
                    "h-11 rounded-2xl px-6 text-[10px] font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-95",
                    "bg-gradient-to-r from-cyan-500 to-blue-500 hover:shadow-cyan-500/20"
                  )}>
                    Sign Up
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <div className="h-11 w-11 overflow-hidden rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </SignedIn>
            </>
          ) : (
            <button onClick={openSettings} className="h-11 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-6 text-[10px] font-black uppercase tracking-widest text-cyan-200">
              Settings
            </button>
          )}
        </div>
      </div>
      {mounted && settingsOpen && createPortal(
        <div className="fixed inset-0 z-[300] flex items-start justify-center overflow-y-auto bg-black/70 p-4 py-6 backdrop-blur-md sm:items-center" onClick={() => setSettingsOpen(false)}>
          <div className="max-h-[calc(100vh-3rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-[#0B0D17] p-5 shadow-2xl custom-scrollbar" onClick={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black uppercase tracking-widest text-white">Settings</h2>
                <p className="mt-1 text-xs text-gray-500">Saved on this browser for your workspace.</p>
              </div>
              <button onClick={() => setSettingsOpen(false)} className="rounded-lg p-2 text-gray-500 hover:bg-white/5 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-500">Theme</span>
                <div className="grid grid-cols-2 gap-2">
                  {(['dark', 'light'] as const).map((item) => (
                    <button
                      key={item}
                      onClick={() => setTheme(item)}
                      className={cn("h-10 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all", theme === item ? "border-cyan-400 bg-cyan-500/15 text-cyan-200" : "border-white/10 bg-white/5 text-gray-400 hover:text-white")}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </label>
              <label className="block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-500">Free AI Model</span>
                <select
                  value={aiModel}
                  onChange={(event) => updateAiModel(event.target.value)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-[#141725] px-3 text-sm text-gray-200 outline-none focus:border-cyan-500/60"
                >
                  {FREE_AI_MODELS.map(model => (
                    <option key={model.value} value={model.value}>{model.label}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                <span>
                  <span className="block text-xs font-bold text-gray-200">Reduce Motion</span>
                  <span className="text-[11px] text-gray-500">Softens animations across the UI.</span>
                </span>
                <input className="h-4 w-4 accent-cyan-500" type="checkbox" checked={reducedMotion} onChange={(event) => setReducedMotion(event.target.checked)} />
              </label>
              {!hasClerk && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-[11px] leading-relaxed text-amber-100">
                  Login and signup are wired with Clerk. Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to `.env.local`, then restart the dev server.
                </div>
              )}
            </div>
          </div>
        </div>
      , document.body)}
    </header>
  );
}
