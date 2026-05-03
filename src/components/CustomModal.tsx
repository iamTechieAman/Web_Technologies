'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CornerDownLeft, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  placeholder: string;
  onSubmit: (value: string) => void;
  defaultValue?: string;
}

export default function CustomModal({ isOpen, onClose, title, placeholder, onSubmit, defaultValue = '' }: ModalProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue || '');
      setError(null);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen, defaultValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value?.trim() || '';
    if (!trimmed) return;

    try {
      onSubmit(trimmed);
      setValue('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-[#0d0d10] border border-gray-800 rounded-3xl shadow-2xl overflow-hidden shadow-cyan-500/10"
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-800/50 bg-white/[0.02]">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">{title ?? ''}</h3>
              <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => {
                      setValue(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder={placeholder ?? ''}
                    className={cn(
                      "w-full bg-black/40 border rounded-2xl px-5 py-4 text-sm text-white placeholder:text-gray-700 focus:outline-none transition-all font-mono",
                      error ? "border-red-500/50 focus:border-red-500" : "border-gray-800 focus:border-cyan-500/50"
                    )}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[9px] font-black text-gray-700 select-none">
                    <CornerDownLeft size={10} />
                    ENTER
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="flex items-start gap-2 text-[10px] font-bold text-red-400 bg-red-500/5 border border-red-500/10 p-3 rounded-xl"
                    >
                      <AlertCircle size={12} className="shrink-0 mt-0.5" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!value?.trim()}
                  className="flex-1 px-4 py-3 rounded-2xl bg-cyan-500 text-white text-[11px] font-black uppercase tracking-widest hover:bg-cyan-600 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}