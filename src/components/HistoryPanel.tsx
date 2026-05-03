'use client';
import React from 'react';
import { Clock, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThemeClasses } from '@/context/ThemeContext';
import type { RunHistoryItem } from '@/hooks/useRunHistory';

interface HistoryPanelProps {
  items: RunHistoryItem[];
  owner: string;
  onClear: () => void;
}

export default function HistoryPanel({ items, owner, onClear }: HistoryPanelProps) {
  const themeClasses = useThemeClasses();
  const isGuest = owner === 'guest';

  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-12 items-center justify-between border-b px-4", themeClasses.border)}>
        <div>
          <h3 className={cn("text-[10px] font-black uppercase tracking-widest", themeClasses.text)}>History</h3>
          <p className={cn("mt-0.5 text-[10px]", themeClasses.textTertiary)}>
            {isGuest ? 'Local guest runs' : 'Signed-in runs'}
          </p>
        </div>
        <button
          onClick={onClear}
          disabled={items.length === 0}
          className={cn("rounded-lg p-1.5 transition-all disabled:opacity-30", themeClasses.textTertiary, "hover:bg-white/5 hover:text-white")}
          title="Clear history"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {items.length === 0 ? (
          <div className={cn("flex h-full flex-col items-center justify-center text-center", themeClasses.textTertiary)}>
            <Clock size={34} className="mb-3 opacity-30" />
            <p className="text-sm font-semibold">No runs yet</p>
            <p className="mt-1 max-w-[220px] text-xs leading-relaxed opacity-70">
              Run code and CodeVisualizer will keep recent activity here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className={cn("rounded-xl border p-3", themeClasses.border, themeClasses.bgSurface)}>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className={cn("truncate text-xs font-bold", themeClasses.text)}>{item.fileName}</div>
                    <div className={cn("mt-1 text-[10px] uppercase tracking-widest", themeClasses.textTertiary)}>
                      {item.language} · {new Date(item.timestamp).toLocaleString()}
                    </div>
                  </div>
                  {item.success ? (
                    <CheckCircle2 size={14} className="shrink-0 text-green-400" />
                  ) : (
                    <XCircle size={14} className="shrink-0 text-red-400" />
                  )}
                </div>
                <pre className="max-h-20 overflow-hidden whitespace-pre-wrap rounded-lg bg-black/30 p-2 text-[10px] text-gray-400">
                  {item.output || item.codePreview || 'No output'}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
