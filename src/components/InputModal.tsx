'use client';
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal, X, Play, AlertTriangle, Keyboard,
  ChevronRight, Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InputRequirement } from '@/lib/inputDetector';

interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called when user confirms — passes the stdin string */
  onConfirm: (stdin: string) => void;
  /** Already-existing stdin value in parent state */
  currentStdin: string;
  requirement: InputRequirement;
  language: string;
}

export default function InputModal({
  isOpen, onClose, onConfirm, currentStdin, requirement, language,
}: InputModalProps) {
  const [value, setValue] = useState(currentStdin);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync with parent stdin whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setValue(currentStdin);
      setTimeout(() => textareaRef.current?.focus(), 120);
    }
  }, [isOpen, currentStdin]);

  const handleConfirm = () => {
    onConfirm(value);
    onClose();
  };

  const handleSkip = () => {
    onConfirm(value); // send whatever is there (may be empty)
    onClose();
  };

  const iconColor: Record<string, string> = {
    java: 'text-cyan-500', python: 'text-blue-400',
    cpp: 'text-cyan-400', c: 'text-cyan-400',
    javascript: 'text-yellow-400', typescript: 'text-blue-300',
    go: 'text-cyan-300', rust: 'text-cyan-400',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[201] w-full max-w-lg"
          >
            <div className="bg-[#0d0d10] border border-cyan-500/20 rounded-3xl shadow-2xl shadow-cyan-500/10 overflow-hidden">
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-white/5 bg-cyan-500/5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                      <Keyboard size={20} className="text-cyan-500" />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-white">Program Input Required</h2>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        Detected <span className={cn('font-black', iconColor[language] ?? 'text-gray-300')}>{requirement.count}</span> stdin read{requirement.count !== 1 ? 's' : ''} in your {language} code
                      </p>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-1.5 text-gray-600 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Hints */}
              {requirement.hints.length > 0 && (
                <div className="px-6 py-3 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">
                    <Info size={11} />
                    What your program expects
                  </div>
                  <div className="space-y-1">
                    {requirement.hints.map((hint, i) => (
                      <div key={i} className="flex items-center gap-2 text-[10px] text-gray-400">
                        <ChevronRight size={10} className="text-cyan-500/50 shrink-0" />
                        {hint}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Input area */}
              <div className="px-6 py-4">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                  <Terminal size={11} className="inline mr-1.5" />
                  Standard Input (stdin)
                </label>
                <textarea
                  ref={textareaRef}
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  onKeyDown={e => {
                    // Ctrl+Enter / Cmd+Enter confirms
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      handleConfirm();
                    }
                  }}
                  placeholder={
                    requirement.types[0] === 'number'
                      ? 'e.g.  5\n3.14\n10 20 30'
                      : 'e.g.  hello world\n42'
                  }
                  rows={6}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm font-mono text-gray-200 placeholder-gray-700 focus:outline-none focus:border-cyan-500/50 resize-none transition-all leading-relaxed custom-scrollbar"
                  spellCheck={false}
                />
                <p className="mt-1.5 text-[9px] text-gray-600">
                  Each line = one value. Separate multiple values with spaces or new lines.&nbsp;
                  <kbd className="px-1 py-0.5 bg-white/5 rounded text-gray-500 text-[8px]">Ctrl+Enter</kbd> to confirm.
                </p>
              </div>

              {/* Warning if empty */}
              {value.trim() === '' && (
                <div className="mx-6 mb-4 p-3 bg-yellow-500/8 border border-yellow-500/20 rounded-xl flex items-start gap-2">
                  <AlertTriangle size={13} className="text-yellow-500 shrink-0 mt-0.5" />
                  <p className="text-[9px] text-yellow-200/70 leading-relaxed">
                    The stdin box is empty. Your program may crash or produce unexpected results.
                    You can still run it by clicking "Run Anyway".
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={handleSkip}
                  className="flex-1 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl border border-white/10 text-gray-500 hover:text-white hover:border-white/20 transition-all"
                >
                  Run Anyway
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={value.trim() === ''}
                  className={cn(
                    'flex-1 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all',
                    value.trim()
                      ? 'bg-cyan-500 text-white hover:bg-cyan-600 shadow-lg shadow-cyan-500/20'
                      : 'bg-white/5 text-gray-600 cursor-not-allowed',
                  )}
                >
                  <Play size={12} /> Run with Input
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
