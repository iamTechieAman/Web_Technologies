'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import localforage from 'localforage';
import type { ExecutionResult, SupportedLanguage } from '@/types';

export interface RunHistoryItem {
  id: string;
  fileName: string;
  language: SupportedLanguage;
  codePreview: string;
  success: boolean;
  output: string;
  timestamp: number;
}

const MAX_HISTORY_ITEMS = 100;

function getHistoryOwner(): string {
  if (typeof window === 'undefined') return 'guest';
  return (window as any).Clerk?.user?.id || 'guest';
}

function getHistoryKey(owner: string): string {
  return `codevisualizer_run_history:${owner}`;
}

export function useRunHistory() {
  const [owner, setOwner] = useState('guest');
  const [items, setItems] = useState<RunHistoryItem[]>([]);
  const storageKey = useMemo(() => getHistoryKey(owner), [owner]);

  useEffect(() => {
    const syncOwner = () => setOwner(getHistoryOwner());
    syncOwner();
    const interval = window.setInterval(syncOwner, 2000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;
    localforage.getItem<RunHistoryItem[]>(storageKey)
      .then(saved => {
        if (!cancelled) setItems(Array.isArray(saved) ? saved : []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => { cancelled = true; };
  }, [storageKey]);

  const recordRun = useCallback(async (
    params: {
      fileName?: string;
      language: SupportedLanguage;
      code: string;
      result: ExecutionResult;
    }
  ) => {
    const nextItem: RunHistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      fileName: params.fileName || 'untitled',
      language: params.language,
      codePreview: params.code.slice(0, 500),
      success: params.result.success,
      output: params.result.run?.output || params.result.error || '',
      timestamp: Date.now(),
    };

    setItems(prev => {
      const next = [nextItem, ...prev].slice(0, MAX_HISTORY_ITEMS);
      localforage.setItem(storageKey, next).catch(() => {});
      return next;
    });
  }, [storageKey]);

  const clearHistory = useCallback(() => {
    setItems([]);
    localforage.removeItem(storageKey).catch(() => {});
  }, [storageKey]);

  return { items, owner, recordRun, clearHistory };
}
