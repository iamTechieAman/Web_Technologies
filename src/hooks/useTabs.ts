'use client';
import { useState, useCallback } from 'react';

export function useTabs(): {
  openTabs: string[];
  activeTabId: string | null;
  openTab: (id: string) => void;
  closeTab: (id: string) => void;
  closeOtherTabs: (id: string) => void;
  closeAllTabs: () => void;
  setActiveTabId: React.Dispatch<React.SetStateAction<string | null>>;
} {
  const [openTabs, setOpenTabs] = useState<string[]>([]); // Array of file IDs
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const openTab = useCallback((id: string): void => {
    setOpenTabs(prev => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
    setActiveTabId(id);
  }, []);

  const closeTab = useCallback((id: string): void => {
    setOpenTabs(prev => {
      const next = prev.filter(t => t !== id);
      if (activeTabId === id) {
        setActiveTabId(next.length > 0 ? next[next.length - 1] : null);
      }
      return next;
    });
  }, [activeTabId]);

  const closeOtherTabs = useCallback((id: string): void => {
    setOpenTabs([id]);
    setActiveTabId(id);
  }, []);

  const closeAllTabs = useCallback((): void => {
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
