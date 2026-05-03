'use client';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Theme } from '@/types';

export interface ThemeColors {
  // Background colors
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  surface: string;
  surfaceHover: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  
  // Border colors
  border: string;
  borderSecondary: string;
  borderAccent: string;
  
  // Accent colors
  accent: string;
  accentHover: string;
  accentSecondary: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Code specific
  codeBackground: string;
  codeText: string;
  codeSelection: string;
  codeComment: string;
  codeKeyword: string;
  codeString: string;
  codeNumber: string;
}

export const darkTheme: ThemeColors = {
  // Background colors
  background: '#05070A',
  backgroundSecondary: '#0C0E14',
  backgroundTertiary: '#12151C',
  surface: '#0F1117',
  surfaceHover: '#161922',
  
  // Text colors
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  textInverse: '#000000',
  
  // Border colors
  border: '#1E293B',
  borderSecondary: '#334155',
  borderAccent: '#06B6D4',
  
  // Accent colors
  accent: '#06B6D4',
  accentHover: '#0891B2',
  accentSecondary: '#8B5CF6',
  
  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Code specific
  codeBackground: '#020617',
  codeText: '#E2E8F0',
  codeSelection: '#1E293B',
  codeComment: '#64748B',
  codeKeyword: '#06B6D4',
  codeString: '#10B981',
  codeNumber: '#F59E0B'
};

export const lightTheme: ThemeColors = {
  // Background colors
  background: '#FFFFFF',
  backgroundSecondary: '#F8FAFC',
  backgroundTertiary: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceHover: '#F1F5F9',
  
  // Text colors
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#64748B',
  textInverse: '#FFFFFF',
  
  // Border colors
  border: '#E2E8F0',
  borderSecondary: '#CBD5E1',
  borderAccent: '#0366D6',
  
  // Accent colors
  accent: '#0366D6',
  accentHover: '#0256CC',
  accentSecondary: '#DBEAFE',
  
  // Status colors
  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
  info: '#2563EB',
  
  // Code specific
  codeBackground: '#F8FAFC',
  codeText: '#1E293B',
  codeSelection: '#DBEAFE',
  codeComment: '#64748B',
  codeKeyword: '#0550AE',
  codeString: '#116329',
  codeNumber: '#D73A49'
};

interface ThemeContextValue {
  theme: Theme;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  isLight: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  colors: darkTheme,
  toggleTheme: () => {},
  setTheme: () => {},
  isDark: true,
  isLight: false
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  const getThemeColors = useCallback((currentTheme: Theme): ThemeColors => {
    return currentTheme === 'dark' ? darkTheme : lightTheme;
  }, []);

  const colors = getThemeColors(theme);
  const isDark = theme === 'dark';
  const isLight = theme === 'light';

  useEffect(() => {
    const stored = localStorage.getItem('codevisualizer-theme') as Theme | null;
    if (stored && (stored === 'dark' || stored === 'light')) {
      setTheme(stored);
    }
  }, []);

  useEffect(() => {
    // Apply theme to document element
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
    
    // Store preference
    localStorage.setItem('codevisualizer-theme', theme);
    
    // Apply CSS custom properties for consistent theming
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
  }, [theme, colors]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const handleSetTheme = useCallback((newTheme: Theme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      setTheme(newTheme);
    }
  }, []);

  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        colors, 
        toggleTheme, 
        setTheme: handleSetTheme,
        isDark,
        isLight
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    // Fallback to default theme if context is not available
    return {
      theme: 'dark',
      colors: darkTheme,
      toggleTheme: () => {},
      setTheme: () => {},
      isDark: true,
      isLight: false
    };
  }
  return context;
}

// Helper hook for getting theme-aware classes
export function useThemeClasses() {
  const { isDark } = useTheme();
  
  return {
    bg: isDark ? 'bg-[#0B0D17]' : 'bg-white',
    bgSecondary: isDark ? 'bg-[#141725]' : 'bg-[#f8f9fa]',
    bgSurface: isDark ? 'bg-[#141725]' : 'bg-white',
    bgHover: isDark ? 'bg-[#1C1F30]' : 'bg-[#f1f3f4]',
    
    text: isDark ? 'text-white' : 'text-gray-900',
    textSecondary: isDark ? 'text-[#cccccc]' : 'text-gray-700',
    textTertiary: isDark ? 'text-[#969696]' : 'text-gray-500',
    
    border: isDark ? 'border-[#24283b]' : 'border-gray-200',
    borderSecondary: isDark ? 'border-[#3b4261]' : 'border-gray-300',
    
    accent: isDark ? 'text-[#06B6D4]' : 'text-blue-600',
    accentBg: isDark ? 'bg-[#06B6D4]/20' : 'bg-blue-50',
    accentBorder: isDark ? 'border-[#06B6D4]/30' : 'border-blue-200',
    
    purple: isDark ? 'text-[#A855F7]' : 'text-purple-600',
    purpleBg: isDark ? 'bg-[#A855F7]/20' : 'bg-purple-50',
    
    success: isDark ? 'text-[#10B981]' : 'text-green-600',
    error: isDark ? 'text-[#EF4444]' : 'text-red-600',
    warning: isDark ? 'text-[#F59E0B]' : 'text-yellow-600',
    info: isDark ? 'text-[#3B82F6]' : 'text-blue-600',
    
    // Code editor specific colors
    codeBackground: isDark ? 'bg-[#0B0D17]' : 'bg-gray-50',
    codeText: isDark ? 'text-[#d4d4d4]' : 'text-gray-800',
    codeSelection: isDark ? 'bg-[#264f78]' : 'bg-blue-100'
  };
}
