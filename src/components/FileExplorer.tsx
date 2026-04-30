'use client';
import React, { useState } from 'react';
import { 
  ChevronRight, ChevronDown, FileCode, Folder, FolderPlus, 
  FilePlus, MoreVertical, Edit2, Trash2, Github, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileNode } from '@/types';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import GitImportModal from './GitImportModal';

interface FileExplorerProps {
  files: FileNode[];
  activeFileId: string | null;
  onFileClick: (id: string) => void;
  onCreate: (parentId: string, type: 'file' | 'folder') => void;
  onDelete: (id: string, name: string) => void;
  onRename: (id: string, newName: string) => void;
  onImportProject: (repoUrl: string) => Promise<void>;
  onResetWorkspace: () => void;
}

export default function FileExplorer({ 
  files, activeFileId, onFileClick, onCreate, onDelete, onRename, onImportProject, onResetWorkspace 
}: FileExplorerProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ root: true });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isGitModalOpen, setIsGitModalOpen] = useState(false);

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const startRename = (node: FileNode) => {
    setEditingId(node.id);
    setEditValue(node.name);
  };

  const handleRename = (id: string) => {
    if (editValue.trim()) {
      onRename(id, editValue.trim());
    }
    setEditingId(null);
  };

  const renderTree = (nodes: FileNode[], level = 0) => {
    return nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    }).map(node => {
      const isExpanded = expanded[node.id];
      const isActive = activeFileId === node.id;

      return (
        <div key={node.id} className="select-none">
          <div 
            className={cn(
              "group flex items-center gap-1.5 py-1 px-2 cursor-pointer hover:bg-gray-800/50 transition-colors",
              isActive && "bg-orange-500/10 text-orange-400 border-l-2 border-orange-500",
              !isActive && "text-gray-400"
            )}
            style={{ paddingLeft: `${(level + 1) * 12}px` }}
            onContextMenu={(e) => {
              e.preventDefault();
              // Trigger the dropdown menu via some state if we wanted to be fancy, 
              // but for now, we'll ensure the existing menu is accessible.
            }}
            onClick={() => node.type === 'folder' ? toggleExpand(node.id) : onFileClick(node.id)}
          >
            {node.type === 'folder' ? (
              isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
            ) : (
              <div className="w-3.5" />
            )}
            
            {node.type === 'folder' ? (
              <Folder size={14} className="text-orange-500/80" />
            ) : (
              <FileCode size={14} className="text-blue-400/80" />
            )}

            {editingId === node.id ? (
              <input
                autoFocus
                className="bg-gray-900 border border-orange-500/50 text-[11px] px-1 focus:outline-none w-full h-5 rounded"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleRename(node.id)}
                onKeyDown={(e) => e.key === 'Enter' && handleRename(node.id)}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="text-[11px] font-medium flex-1 truncate">{node.name}</span>
            )}

            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
              {node.type === 'folder' && (
                <button 
                  className="p-0.5 hover:bg-gray-700 rounded"
                  onClick={(e) => { e.stopPropagation(); onCreate(node.id, 'file'); }}
                >
                  <FilePlus size={12} />
                </button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-0.5 hover:bg-gray-700 rounded" onClick={(e) => e.stopPropagation()}>
                    <MoreVertical size={12} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-gray-900 border-gray-800 text-gray-400">
                  <DropdownMenuItem onClick={() => startRename(node)} className="text-[11px] gap-2 focus:bg-gray-800 focus:text-white">
                    <Edit2 size={12} /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(node.id, node.name)} className="text-[11px] gap-2 text-red-400 focus:bg-red-500/10 focus:text-red-400">
                    <Trash2 size={12} /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {node.type === 'folder' && isExpanded && node.children && (
            <div>{renderTree(node.children, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="h-full flex flex-col bg-[#08080a] border-r border-gray-800/50">
      <div className="p-3 border-b border-gray-800/50 flex flex-col gap-3 bg-black/20">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Explorer</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => onCreate('root', 'folder')} title="New Folder" className="text-gray-600 hover:text-white transition-colors">
              <FolderPlus size={14} />
            </button>
            <button onClick={() => onCreate('root', 'file')} title="New File" className="text-gray-600 hover:text-white transition-colors">
              <FilePlus size={14} />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-gray-600 hover:text-white transition-colors">
                  <MoreVertical size={14} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#0d0d10] border-gray-800 text-gray-400 min-w-[150px]">
                <DropdownMenuItem onClick={onResetWorkspace} className="text-[10px] font-black uppercase tracking-widest gap-2 focus:bg-red-500/10 focus:text-red-400">
                  <RefreshCw size={12} /> Reset Workspace
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <button 
          onClick={() => setIsGitModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-orange-500 hover:bg-orange-500/20 transition-all shadow-lg shadow-orange-500/5"
        >
          <Github size={12} />
          Import Git Repo
        </button>
      </div>

      <div className="flex-1 overflow-auto py-2 custom-scrollbar">
        {files.length === 0 ? (
          <div className="p-6 text-center space-y-3 opacity-40">
            <Folder size={32} className="mx-auto text-gray-800" />
            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Workspace Empty</p>
          </div>
        ) : renderTree(files)}
      </div>

      <GitImportModal 
        isOpen={isGitModalOpen} 
        onClose={() => setIsGitModalOpen(false)}
        onImport={onImportProject}
      />
    </div>
  );
}
