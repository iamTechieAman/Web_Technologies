'use client';
import { useEffect } from 'react';
import { extensions } from '@/lib/extensions';
import { Play, Sparkles, BookOpen } from 'lucide-react';

export function useDefaultExtensions() {
  useEffect(() => {
    // 1. Core Command: Run Code
    const runSub = extensions.registerCommand('codevisualizer.runCode', () => {
      // This will be handled by the IDE component listening for this command
      window.dispatchEvent(new CustomEvent('codevisualizer-command', { detail: { id: 'codevisualizer.runCode' } }));
    });

    // 2. Core Command: Toggle Theme
    const themeSub = extensions.registerCommand('codevisualizer.toggleTheme', () => {
      window.dispatchEvent(new CustomEvent('codevisualizer-command', { detail: { id: 'codevisualizer.toggleTheme' } }));
    });

    // 3. Core Command: Format Document
    const formatSub = extensions.registerCommand('codevisualizer.formatDocument', () => {
      window.dispatchEvent(new CustomEvent('codevisualizer-command', { detail: { id: 'codevisualizer.formatDocument' } }));
    });

    return () => {
      runSub.dispose();
      themeSub.dispose();
      formatSub.dispose();
    };
  }, []);
}
