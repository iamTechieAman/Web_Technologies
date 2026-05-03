'use client';
import React, { useEffect } from 'react';
import { Command } from 'cmdk';
import { Search } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  actions: {
    id: string;
    title: string;
    icon: React.ReactNode;
    shortcut?: string;
    onSelect: () => void;
  }[];
}

export default function CommandPalette({ isOpen, onClose, actions }: CommandPaletteProps) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'p' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isOpen) onClose();
        else actions.find(a => a.id === 'open-palette')?.onSelect();
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isOpen, onClose, actions]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-[#0f0f12] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <Command className="flex flex-col h-full">
          <div className="flex items-center px-4 border-b border-gray-800">
            <Search className="w-4 h-4 text-gray-500 mr-3" />
            <Command.Input 
              autoFocus
              placeholder="Search actions (Run, Save, Toggle...)"
              className="w-full h-12 bg-transparent text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none"
            />
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto p-2 custom-scrollbar">
            <Command.Empty className="py-6 text-center text-sm text-gray-500">
              No results found.
            </Command.Empty>

            <Command.Group heading="General" className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-600">
              {actions.map(action => (
                <Command.Item
                  key={action.id}
                  onSelect={() => {
                    action.onSelect();
                    onClose();
                  }}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer aria-selected:bg-cyan-500 aria-selected:text-white transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-gray-500 group-aria-selected:text-white">
                      {action.icon}
                    </div>
                    <span className="text-sm font-medium">{action.title}</span>
                  </div>
                  {action.shortcut && (
                    <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-[10px] font-mono group-aria-selected:bg-white/20">
                      {action.shortcut}
                    </kbd>
                  )}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
