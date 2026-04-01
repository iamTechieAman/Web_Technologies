'use client';
import React, { useState } from 'react';
import { Github, Loader2, Link2, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GitImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (repoUrl: string) => Promise<void>;
}

export default function GitImportModal({ isOpen, onClose, onImport }: GitImportModalProps) {
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
      
      <div className="relative w-full max-w-md bg-[#0d0d10] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-800/50 flex items-center gap-3 bg-black/20">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
            <Github size={20} className="text-orange-500" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white">Import Git Project</h3>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter mt-0.5">Explore any public repository</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
              <Link2 size={12} />
              Repository URL
            </label>
            <input 
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/user/repo"
              className="w-full bg-black/50 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white placeholder:text-gray-700 focus:outline-none focus:border-orange-500/50 transition-all"
              autoFocus
            />
          </div>

          <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl flex gap-3">
            <Info size={16} className="text-blue-500 shrink-0" />
            <p className="text-[10px] text-blue-400/80 leading-relaxed font-medium">
              We currently support public GitHub repositories. Large projects might take a moment to process.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl flex gap-3 animate-shake">
              <AlertTriangle size={16} className="text-red-500 shrink-0" />
              <p className="text-[10px] text-red-400 font-bold leading-relaxed">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading || !repoUrl.trim()}
              className="flex-1 bg-orange-500 text-white rounded-xl py-3 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:bg-orange-600 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
