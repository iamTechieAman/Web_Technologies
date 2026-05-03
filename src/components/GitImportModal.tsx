'use client';
import React, { useState } from 'react';
import { Github, Loader2, Link2, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThemeClasses } from '@/context/ThemeContext';

interface GitImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (repoUrl: string) => Promise<void>;
}

export default function GitImportModal({ isOpen, onClose, onImport }: GitImportModalProps) {
  const themeClasses = useThemeClasses();
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await onImport(repoUrl.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to import repository');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className={cn("relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200", themeClasses.bgSurface, themeClasses.border)}>
        <div className={cn("p-6 border-b flex items-center gap-3", themeClasses.border, themeClasses.bgSecondary)}>
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", themeClasses.accentBg, themeClasses.accentBorder)}>
            <Github size={20} className={themeClasses.accent} />
          </div>
          <div>
            <h3 className={cn("text-sm font-black uppercase tracking-widest", themeClasses.text)}>Import Git Project</h3>
            <p className={cn("text-[10px] uppercase font-bold tracking-tighter mt-0.5", themeClasses.textTertiary)}>Explore any public repository</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className={cn("text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5", themeClasses.textTertiary)}>
              <Link2 size={12} />
              Repository URL
            </label>
            <input 
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/user/repo"
              className={cn("w-full rounded-xl px-4 py-3 text-xs placeholder:opacity-50 focus:outline-none transition-all", 
                themeClasses.codeBackground, themeClasses.border, themeClasses.text,
                "focus:ring focus:ring-opacity-20", themeClasses.accentBorder)}
              autoFocus
            />
          </div>

          <div className={cn("p-3 rounded-xl flex gap-3", themeClasses.accentBg, themeClasses.accentBorder)}>
            <Info size={16} className={cn("shrink-0", themeClasses.accent)} />
            <p className={cn("text-[10px] leading-relaxed font-medium", themeClasses.accent)}>
              We currently support public GitHub repositories. Large projects might take a moment to process.
            </p>
          </div>

          {error && (
            <div className={cn("p-3 rounded-xl flex gap-3 animate-shake", themeClasses.bgHover, themeClasses.border)}>
              <AlertTriangle size={16} className={cn("shrink-0", themeClasses.accent)} />
              <p className={cn("text-[10px] font-bold leading-relaxed", themeClasses.accent)}>{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button 
              type="button"
              onClick={onClose}
              className={cn("flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors", themeClasses.textTertiary, "hover:text-white")}
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading || !repoUrl.trim()}
              className={cn("flex-1 rounded-xl py-3 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2",
                themeClasses.accentBg, themeClasses.text, themeClasses.accentBorder,
                "hover:opacity-90 active:scale-95 disabled:cursor-not-allowed")}
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Processing...
                </>
              ) : (
                'Import Repo'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
