'use client';
import React, { useState } from 'react';
import { 
  ChevronRight, ChevronDown, Folder, FolderPlus, 
  FilePlus, MoreVertical, Edit2, Trash2, Github, RefreshCw,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileNode } from '@/types';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import * as ContextMenu from '@radix-ui/react-context-menu';
import GitImportModal from './GitImportModal';
import { getFileIcon } from '@/lib/fileIcons';
import { useThemeClasses } from '@/context/ThemeContext';

interface FileExplorerProps {
  files: FileNode[];
  activeFileId: string | null;
  onFileClick: (id: string) => void;
  onCreate: (parentId: string, type: 'file' | 'folder') => void;
  onDelete: (id: string, name: string) => void;
  onRename: (id: string, currentName: string) => void;
  onImportProject: (repoUrl: string) => Promise<void>;
  onResetWorkspace: () => void;
  onDownloadProject?: () => void;
}

export default function FileExplorer({ 
  files, activeFileId, onFileClick, onCreate, onDelete, onRename, 
  onImportProject, onResetWorkspace, onDownloadProject 
}: FileExplorerProps) {
  const themeClasses = useThemeClasses();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ root: true });
  const [isGitModalOpen, setIsGitModalOpen] = useState(false);

  const toggleExpand = (id: string): void => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderTree = (nodes: FileNode[], level = 0): React.ReactNode => {
    return nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    }).map(node => {
      const isExpanded = expanded[node.id];
      const isActive = activeFileId === node.id;
      const isFolder = node.type === 'folder';

      return (
        <ContextMenu.Root key={node.id}>
          <ContextMenu.Trigger>
            <div className="select-none">
              <div 
                className={cn(
                  "group flex items-center gap-2 py-1.5 px-3 cursor-pointer transition-all min-w-0 overflow-hidden relative border-y border-transparent",
                  isActive 
                    ? cn(themeClasses.bgSurface, themeClasses.text, "border-cyan-500/20 shadow-[0_0_15px_-5px_rgba(6,182,212,0.3)]") 
                    : cn(themeClasses.textTertiary, "hover:bg-white/5 hover:text-white")
                )}
                style={{ paddingLeft: `${(level + 1) * 12}px` }}
                onClick={() => isFolder ? toggleExpand(node.id) : onFileClick(node.id)}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent pointer-events-none" />
                )}
                
                {isFolder ? (
                  <div className={cn("transition-transform duration-200", isExpanded && "rotate-90")}>
                    <ChevronRight size={14} className={cn("shrink-0", isActive ? "text-cyan-500" : "text-white/20")} />
                  </div>
                ) : (
                  <div className="w-3.5 shrink-0" />
                )}
                
                {isFolder ? (
                  <Folder size={15} className={cn("shrink-0 transition-colors", isActive || isExpanded ? "text-cyan-500" : "text-cyan-500/40")} strokeWidth={isExpanded ? 2.5 : 2} />
                ) : (
                  <div className="shrink-0 group-hover:scale-110 transition-transform">
                    {getFileIcon(node.name)}
                  </div>
                )}

                <span className={cn("text-[11px] font-bold flex-1 truncate transition-colors", isActive ? "text-white" : "text-white/60 group-hover:text-white/90")}>{node.name}</span>

                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 pr-1">
                  <button 
                    className="p-1 rounded-md transition-all hover:bg-cyan-500/20 text-white/30 hover:text-cyan-400"
                    onClick={(e) => { e.stopPropagation(); onRename(node.id, node.name); }}
                    title="Rename"
                  >
                    <Edit2 size={10} strokeWidth={2.5} />
                  </button>
                  <button 
                    className="p-1 rounded-md transition-all hover:bg-red-500/20 text-white/30 hover:text-red-400"
                    onClick={(e) => { e.stopPropagation(); onDelete(node.id, node.name); }}
                    title="Delete"
                  >
                    <Trash2 size={10} strokeWidth={2.5} />
                  </button>
                  {isFolder && (
                    <>
                      <button 
                        className="p-1 rounded-md transition-all hover:bg-green-500/20 text-white/30 hover:text-green-400"
                        onClick={(e) => { e.stopPropagation(); onCreate(node.id, 'file'); }}
                        title="New File"
                      >
                        <FilePlus size={10} strokeWidth={2.5} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {isFolder && isExpanded && node.children && (
                <div>{renderTree(node.children, level + 1)}</div>
              )}
            </div>
          </ContextMenu.Trigger>

          <ContextMenu.Portal>
            <ContextMenu.Content className={cn("min-w-[160px] glass-panel z-[100] p-1 shadow-2xl rounded-lg", themeClasses.bgSecondary, themeClasses.border)}>
              <ContextMenu.Item 
                className={cn("flex items-center gap-2 px-2 py-1.5 text-[11px] outline-none cursor-pointer rounded", themeClasses.textTertiary, "focus:bg-cyan-500/20 focus:text-white")}
                onClick={() => onRename(node.id, node.name)}
              >
                <Edit2 size={12} /> Rename
              </ContextMenu.Item>
              <ContextMenu.Item 
                className={cn("flex items-center gap-2 px-2 py-1.5 text-[11px] outline-none cursor-pointer rounded", "text-red-400 focus:bg-red-500/20 focus:text-red-300")}
                onClick={() => onDelete(node.id, node.name)}
              >
                <Trash2 size={12} /> Delete
              </ContextMenu.Item>
              <ContextMenu.Separator className={cn("h-px my-1", themeClasses.border)} />
              {isFolder && (
                <>
                  <ContextMenu.Item 
                    className={cn("flex items-center gap-2 px-2 py-1.5 text-[11px] outline-none cursor-pointer rounded", themeClasses.textTertiary, "focus:bg-cyan-500/20 focus:text-white")}
                    onClick={() => onCreate(node.id, 'file')}
                  >
                    <FilePlus size={12} /> New File
                  </ContextMenu.Item>
                  <ContextMenu.Item 
                    className={cn("flex items-center gap-2 px-2 py-1.5 text-[11px] outline-none cursor-pointer rounded", themeClasses.textTertiary, "focus:bg-cyan-500/20 focus:text-white")}
                    onClick={() => onCreate(node.id, 'folder')}
                  >
                    <FolderPlus size={12} /> New Folder
                  </ContextMenu.Item>
                </>
              )}
            </ContextMenu.Content>
          </ContextMenu.Portal>
        </ContextMenu.Root>
      );
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-white/5 flex flex-col gap-3 bg-white/[0.02]">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Explorer</h3>
          <div className="flex items-center gap-1">
            <button onClick={() => onCreate('root', 'file')} title="New File" className={cn("p-1.5 rounded hover:bg-white/10 transition-all", themeClasses.textTertiary, "hover:text-white")}>
              <FilePlus size={14} />
            </button>
            <button onClick={() => onCreate('root', 'folder')} title="New Folder" className={cn("p-1.5 rounded hover:bg-white/10 transition-all", themeClasses.textTertiary, "hover:text-white")}>
              <FolderPlus size={14} />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn("p-1.5 rounded hover:bg-white/10 transition-all", themeClasses.textTertiary, "hover:text-white")}>
                  <MoreVertical size={14} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={cn("bg-[#0B0D17] border-white/10 min-w-[180px] z-[100] shadow-2xl", themeClasses.textTertiary)}>
                <DropdownMenuItem onClick={() => setIsGitModalOpen(true)} className="text-[11px] gap-2 focus:bg-cyan-500/10 focus:text-white cursor-pointer">
                  <Github size={12} /> Import Git Repository
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDownloadProject?.()} className="text-[11px] gap-2 focus:bg-cyan-500/10 focus:text-white cursor-pointer">
                  <Download size={12} /> Download as ZIP
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem onClick={onResetWorkspace} className="text-[11px] gap-2 text-red-400 focus:bg-red-500/10 focus:text-red-300 cursor-pointer">
                  <RefreshCw size={12} /> Reset Workspace
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <button 
          onClick={() => setIsGitModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-cyan-500 hover:bg-cyan-500/20 transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-cyan-500/5 group"
        >
          <Github size={12} className="group-hover:rotate-12 transition-transform" />
          Import Git Repo
        </button>
      </div>

      <div className="flex-1 overflow-auto py-2 custom-scrollbar">
        {files.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 opacity-20 space-y-4">
            <Folder size={48} strokeWidth={1} />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-center">Empty Workspace</p>
          </div>
        ) : (
          <ContextMenu.Root>
            <ContextMenu.Trigger className="h-full w-full">
              <div className="min-h-full">
                {renderTree(files)}
              </div>
            </ContextMenu.Trigger>
            <ContextMenu.Portal>
              <ContextMenu.Content className={cn("min-w-[160px] glass-panel z-[100] p-1 shadow-2xl rounded-lg", themeClasses.bgSecondary, themeClasses.border)}>
                <ContextMenu.Item 
                  className={cn("flex items-center gap-2 px-2 py-1.5 text-[11px] outline-none cursor-pointer rounded", themeClasses.textTertiary, "focus:bg-cyan-500/20 focus:text-white")}
                  onClick={() => onCreate('root', 'file')}
                >
                  <FilePlus size={12} /> New File
                </ContextMenu.Item>
                <ContextMenu.Item 
                  className={cn("flex items-center gap-2 px-2 py-1.5 text-[11px] outline-none cursor-pointer rounded", themeClasses.textTertiary, "focus:bg-cyan-500/20 focus:text-white")}
                  onClick={() => onCreate('root', 'folder')}
                >
                  <FolderPlus size={12} /> New Folder
                </ContextMenu.Item>
                <ContextMenu.Separator className={cn("h-px my-1", themeClasses.border)} />
                <ContextMenu.Item 
                  className={cn("flex items-center gap-2 px-2 py-1.5 text-[11px] outline-none cursor-pointer rounded", themeClasses.textTertiary, "focus:bg-cyan-500/20 focus:text-white")}
                  onClick={() => setIsGitModalOpen(true)}
                >
                  <Github size={12} /> Import Git Repo
                </ContextMenu.Item>
              </ContextMenu.Content>
            </ContextMenu.Portal>
          </ContextMenu.Root>
        )}
      </div>

      <GitImportModal 
        isOpen={isGitModalOpen} 
        onClose={() => setIsGitModalOpen(false)}
        onImport={onImportProject}
      />
    </div>
  );
}
