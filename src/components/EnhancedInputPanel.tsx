'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal, X, Play, AlertTriangle, ChevronRight, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InputRequirement } from '@/lib/inputDetector';

interface EnhancedInputPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (stdin: string) => void;
  currentStdin: string;
  requirement: InputRequirement | null;
  language: string;
  isExecuting: boolean;
  lastError?: string;
}

export default function EnhancedInputPanel({
  isOpen, onClose, onConfirm, currentStdin, requirement, language, isExecuting, lastError,
}: EnhancedInputPanelProps) {
  const [value, setValue] = useState(currentStdin);
  const [showPreview, setShowPreview] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync with parent stdin whenever modal opens or requirements change
  useEffect(() => {
    if (isOpen) {
      setValue(currentStdin);
      setTimeout(() => {
        textareaRef.current?.focus();
        setIsFocused(true);
      }, 100);
    } else {
      setIsFocused(false);
    }
  }, [isOpen, currentStdin]);

  const handleConfirm = useCallback(() => {
    onConfirm(value);
    onClose();
  }, [value, onConfirm, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleConfirm();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  }, [handleConfirm, onClose]);

  const getLanguageIcon = (lang: string) => {
    const icons: Record<string, string> = {
      java: '☕', python: '🐍', cpp: '⚙️', c: '⚙️',
      javascript: '🟨', typescript: '🔷', go: '🐹',
      rust: '🦀', php: '🐘', ruby: '💎', csharp: '🔷'
    };
    return icons[lang] || '📝';
  };

  const getInputPreview = () => {
    if (!value.trim()) return [];
    return value.split('\n').filter(line => line.trim());
  };

  if (!requirement?.required) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[201] w-full max-w-2xl"
          >
            <div className="bg-[#0d0d0f] border border-[#2d2d30] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
              {/* Header */}
              <div className="px-6 pt-5 pb-4 border-b border-[#2d2d30] bg-gradient-to-r from-[#1a1a1d] to-[#1e1e1e]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl border flex items-center justify-center text-lg",
                      isFocused 
                        ? "bg-[#007acc]/20 border-[#007acc]/50 shadow-lg shadow-[#007acc]/20" 
                        : "bg-[#2d2d30] border-[#3e3e42]"
                    )}>
                      {getLanguageIcon(language)}
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                        Input Required
                        <span className="px-2 py-0.5 bg-[#007acc]/20 text-[#007acc] text-[10px] font-medium rounded-full">
                          {requirement.count} value{requirement.count !== 1 ? 's' : ''}
                        </span>
                      </h2>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Your {language} program is waiting for input
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={onClose} 
                    className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Input Requirements */}
              <div className="px-6 py-3 border-b border-[#2d2d30] bg-[#1a1a1d]/50">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  <Info size={11} className="text-[#007acc]" />
                  Expected Input
                </div>
                <div className="space-y-1.5">
                  {requirement.hints.slice(0, 3).map((hint, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-[11px] text-gray-300">
                      <ChevronRight size={8} className="text-[#007acc] shrink-0 mt-0.5" />
                      <span>{hint}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Main Input Area */}
              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    <Terminal size={11} className="text-[#007acc]" />
                    Standard Input (stdin)
                  </label>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className={cn(
                      "text-[10px] px-2 py-1 rounded transition-all",
                      showPreview 
                        ? "bg-[#007acc]/20 text-[#007acc]" 
                        : "text-gray-500 hover:text-gray-300"
                    )}
                  >
                    {showPreview ? 'Edit' : 'Preview'}
                  </button>
                </div>

                {!showPreview ? (
                  <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={
                      requirement.types[0] === 'number'
                        ? "Enter numbers:\n5\n3.14\n10 20 30"
                        : "Enter text:\nhello world\n42"
                    }
                    rows={Math.max(3, Math.min(8, getInputPreview().length + 2))}
                    className={cn(
                      "w-full border rounded-xl px-4 py-3 text-sm font-mono resize-none transition-all leading-relaxed",
                      "focus:outline-none focus:ring-2 focus:ring-[#007acc]/50",
                      isFocused 
                        ? "bg-[#1a1a1d] border-[#007acc]/50 text-white"
                        : "bg-[#0d0d0f] border-[#2d2d30] text-gray-300",
                      "placeholder:text-gray-600"
                    )}
                    spellCheck={false}
                  />
                ) : (
                  <div className="bg-[#0d0d0f] border border-[#2d2d30] rounded-xl p-4 min-h-[100px]">
                    {getInputPreview().length > 0 ? (
                      <div className="space-y-1">
                        {getInputPreview().map((line, i) => (
                          <div key={i} className="text-sm font-mono text-gray-300">
                            <span className="text-gray-600 mr-3">{String(i + 1).padStart(2, '0')}</span>
                            {line}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-600 py-4">
                        <Terminal size={24} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No input provided</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-2.5 flex items-center justify-between">
                  <p className="text-[10px] text-gray-500">
                    <kbd className="px-1.5 py-0.5 bg-[#2d2d30] rounded text-gray-400">Ctrl+Enter</kbd> to run
                  </p>
                  {lastError && (
                    <div className="flex items-center gap-1.5 text-[10px] text-red-400">
                      <AlertTriangle size={10} />
                      {lastError}
                    </div>
                  )}
                </div>
              </div>

              {/* Warning for empty input */}
              {value.trim() === '' && (
                <div className="mx-6 mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start gap-2">
                  <AlertTriangle size={12} className="text-yellow-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-yellow-200/80 leading-relaxed">
                    No input provided. Your program may crash or wait indefinitely.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="px-6 pb-5 flex gap-3">
                <button
                  onClick={() => {
                    onConfirm(value);
                    onClose();
                  }}
                  className="flex-1 py-2.5 text-[11px] font-semibold uppercase tracking-wider rounded-xl border border-[#2d2d30] text-gray-400 hover:text-white hover:border-[#3e3e42] transition-all"
                >
                  Run Anyway
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={value.trim() === '' || isExecuting}
                  className={cn(
                    'flex-1 py-2.5 text-[11px] font-semibold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all',
                    value.trim() && !isExecuting
                      ? 'bg-[#007acc] text-white hover:bg-[#1e6aa8] shadow-lg shadow-[#007acc]/20'
                      : 'bg-[#2d2d30] text-gray-600 cursor-not-allowed',
                  )}
                >
                  {isExecuting ? (
                    <>
                      <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play size={12} />
                      Run with Input
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
