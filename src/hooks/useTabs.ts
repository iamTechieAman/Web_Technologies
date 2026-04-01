'use client';
import { useState, useCallback } from 'react';

export function useTabs() {
  const [openTabs, setOpenTabs] = useState<string[]>([]); // Array of file IDs
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const openTab = useCallback((id: string) => {
    setOpenTabs(prev => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
    setActiveTabId(id);
  }, []);

  const closeTab = useCallback((id: string) => {
    setOpenTabs(prev => {
      const next = prev.filter(t => t !== id);
      if (activeTabId === id) {
        setActiveTabId(next.length > 0 ? next[next.length - 1] : null);
      }
      return next;
    });
  }, [activeTabId]);

  const closeOtherTabs = useCallback((id: string) => {
    setOpenTabs([id]);
    setActiveTabId(id);
  }, []);

  const closeAllTabs = useCallback(() => {
    setOpenTabs([]);
    setActiveTabId(null);
  }, []);

  return {
    openTabs,
    activeTabId,
    openTab,
    closeTab,
    closeOtherTabs,
    closeAllTabs,
    setActiveTabId,
  };
}
