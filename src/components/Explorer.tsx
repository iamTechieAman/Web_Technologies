'use client';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  FolderOpen, File, ChevronRight, ChevronDown, Plus, Trash2, 
  FileText, Search, BookOpen, Filter, FolderPlus, FilePlus,
  MoreVertical, Edit2, Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FileNode } from '@/hooks/useFileSystem';
import problemsData from '@/data/problems.json';
import { useRouter } from 'next/navigation';

const LANG_ICONS: Record<string, { color: string; label: string }> = {
  python: { color: 'text-yellow-400', label: 'PY' },
  javascript: { color: 'text-yellow-300', label: 'JS' },
  typescript: { color: 'text-blue-400', label: 'TS' },
  cpp: { color: 'text-blue-500', label: 'C++' },
  c: { color: 'text-gray-400', label: 'C' },
  java: { color: 'text-red-400', label: 'JA' },
  rust: { color: 'text-orange-400', label: 'RS' },
  go: { color: 'text-cyan-400', label: 'GO' },
};

interface ExplorerProps {
  files: FileNode[];
  activeFileId: string;
  onFileClick: (id: string) => void;
  onCreateFile: (parentId: string, name: string, type: 'file' | 'folder') => void;
  onDeleteFile: (id: string) => void;
}

export default function Explorer({ files, activeFileId, onFileClick, onCreateFile, onDeleteFile }: ExplorerProps) {
  const router = useRouter();
  const [view, setView] = useState<'files' | 'problems'>('files');
  const [newFileType, setNewFileType] = useState<'file' | 'folder' | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [search, setSearch] = useState('');
  const [visibleProblemsCount, setVisibleProblemsCount] = useState(50);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, nodeId: string, type: 'file' | 'folder' } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const filteredProblems = useMemo(() => {
    let result = problemsData as any[];
    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(lowerSearch) || 
        p.tags.some((t: string) => t.toLowerCase().includes(lowerSearch)) ||
        p.source?.toLowerCase().includes(lowerSearch)
      );
    }
    return result;
  }, [search]);

  const visibleProblems = useMemo(() => {
    return filteredProblems.slice(0, visibleProblemsCount);
  }, [filteredProblems, visibleProblemsCount]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      setVisibleProblemsCount(prev => Math.min(prev + 50, filteredProblems.length));
    }
  };

  const handleCreate = () => {
    if (!newFileName.trim() || !newFileType) return;
    onCreateFile('root', newFileName.trim(), newFileType);
    setNewFileName('');
    setNewFileType(null);
  };

  const handleContextMenu = (e: React.MouseEvent, nodeId: string, type: 'file' | 'folder') => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId, type });
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0a0c] border-r border-gray-800/50 select-none">
      {/* Tabs */}
      <div className="flex bg-[#0d0d10] border-b border-gray-800/50">
        <button 
          onClick={() => setView('files')}
          className={cn(
            "flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2",
            view === 'files' ? "border-orange-500 text-orange-500 bg-orange-500/5" : "border-transparent text-gray-500 hover:text-gray-300"
          )}
        >
          Files
        </button>
        <button 
          onClick={() => setView('problems')}
          className={cn(
            "flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2",
            view === 'problems' ? "border-orange-500 text-orange-500 bg-orange-500/5" : "border-transparent text-gray-500 hover:text-gray-300"
          )}
        >
          Problems
        </button>
      </div>

      <div className="p-3">
        {view === 'files' ? (
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">Workspace</span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setNewFileType('file')} 
                className="p-1 hover:text-orange-400 text-gray-600 transition-colors"
                title="New File"
              >
                <FilePlus size={14}/>
              </button>
              <button 
                onClick={() => setNewFileType('folder')} 
                className="p-1 hover:text-orange-400 text-gray-600 transition-colors"
                title="New Folder"
              >
                <FolderPlus size={14}/>
              </button>
            </div>
          </div>
        ) : (
          <div className="relative mb-2">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600" />
            <input 
              value={search}
              onChange={e => { setSearch(e.target.value); setVisibleProblemsCount(50); }}
              placeholder="Search 8000+ problems..."
              className="w-full bg-gray-900/50 border border-gray-800 rounded-lg py-1.5 pl-8 pr-3 text-[10px] text-gray-300 focus:outline-none focus:border-orange-500/50 placeholder:text-gray-700 font-medium"
            />
          </div>
        )}
      </div>

      {view === 'files' && newFileType && (
        <div className="px-3 pb-3 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 bg-[#111118] border border-orange-500/30 rounded-lg px-3 py-2 shadow-xl shadow-orange-500/5">
            {newFileType === 'file' ? <File size={12} className="text-orange-500"/> : <FolderOpen size={12} className="text-orange-500"/>}
            <input
              autoFocus
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => { 
                if (e.key === 'Enter') handleCreate(); 
                if (e.key === 'Escape') setNewFileType(null); 
              }}
              onBlur={() => { if (!newFileName) setNewFileType(null); }}
              placeholder={newFileType === 'file' ? "name.py" : "folder name"}
              className="flex-1 bg-transparent text-[11px] text-gray-300 focus:outline-none placeholder:text-gray-700"
            />
          </div>
        </div>
      )}

      <div 
        ref={scrollContainerRef}
        onScroll={view === 'problems' ? handleScroll : undefined}
        className="flex-1 overflow-auto px-2 scrollbar-thin scrollbar-thumb-gray-800"
      >
        {view === 'files' ? (
          <div className="space-y-0.5 pb-20">
            {files.map(node => (
              <TreeNode 
                key={node.id} 
                node={node} 
                depth={0} 
                activeFileId={activeFileId} 
                onFileClick={onFileClick} 
                onDelete={onDeleteFile}
                onCreateChild={onCreateFile}
                onContextMenu={handleContextMenu}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-1 pb-4">
            {visibleProblems.map((p: any) => (
              <button
                key={p.id}
                onClick={() => router.push(`/problem/${p.slug || p.id}`)}
                className="w-full text-left p-2.5 rounded-xl hover:bg-gray-800/30 group transition-all border border-transparent hover:border-gray-800/50"
              >
                <div className="flex items-center justify-between mb-1 gap-2">
                  <span className="text-[10px] font-bold text-gray-300 group-hover:text-orange-400 transition-colors truncate">{p.title}</span>
                  <span className={cn(
                    "text-[8px] font-black uppercase px-1 rounded border shrink-0",
                    p.difficulty === 'Easy' ? "border-green-500/30 text-green-500" : 
                    p.difficulty === 'Medium' ? "border-orange-500/30 text-orange-500" : "border-red-500/30 text-red-500"
                  )}>
                    {p.difficulty[0]}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {p.tags.slice(0, 2).map((t: string) => (
                      <span key={t} className="text-[8px] text-gray-600 font-black tracking-tight">#{t}</span>
                    ))}
                  </div>
                  <span className="text-[7px] font-black text-gray-700 uppercase tracking-tighter">{p.source}</span>
                </div>
              </button>
            ))}
            {visibleProblemsCount < filteredProblems.length && (
              <div className="py-4 text-center">
                <div className="w-4 h-4 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Custom Context Menu */}
      {contextMenu && (
        <div 
          className="fixed z-[100] bg-[#111118] border border-gray-800 rounded-xl shadow-2xl p-1.5 min-w-[140px] animate-in fade-in zoom-in-95 duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button 
            onClick={() => { onDeleteFile(contextMenu.nodeId); setContextMenu(null); }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <Trash2 size={12} /> Delete {contextMenu.type === 'file' ? 'File' : 'Folder'}
          </button>
          <button 
            onClick={() => setContextMenu(null)}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold text-gray-400 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Edit2 size={12} /> Rename
          </button>
        </div>
      )}

      <div className="p-3 border-t border-gray-800/50 flex items-center justify-between text-[9px] text-gray-600 font-black uppercase tracking-widest bg-[#0d0d10]">
        <div className="flex items-center gap-2">
          <BookOpen size={10} />
          <span>CodeVisualizer v3.0</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1 h-1 bg-green-500 rounded-full shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
          <span>Live</span>
        </div>
      </div>
    </div>
  );
}

function TreeNode({ node, depth, activeFileId, onFileClick, onDelete, onCreateChild, onContextMenu }: {
  node: FileNode; depth: number; activeFileId: string;
  onFileClick: (id: string) => void; onDelete: (id: string) => void;
  onCreateChild: (parentId: string, name: string, type: 'file' | 'folder') => void;
  onContextMenu: (e: React.MouseEvent, id: string, type: 'file' | 'folder') => void;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const isActive = node.id === activeFileId;
  const langInfo = node.language ? LANG_ICONS[node.language] : null;

  if (node.type === 'folder') {
    return (
      <div className="animate-in fade-in duration-300">
        <div 
          onContextMenu={(e) => onContextMenu(e, node.id, 'folder')}
          className="group flex items-center gap-1.5 px-2 py-1 text-xs rounded-xl transition-all hover:bg-gray-800/30"
        >
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 flex-1 min-w-0"
            style={{ paddingLeft: `${depth * 12}px` }}
          >
            {expanded ? <ChevronDown size={12} className="shrink-0" /> : <ChevronRight size={12} className="shrink-0" />}
            <FolderOpen size={13} className={cn("shrink-0", expanded ? "text-orange-500" : "text-gray-600")} />
            <span className="truncate font-black tracking-tight">{node.name}</span>
          </button>
          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
            <button onClick={() => onCreateChild(node.id, 'new-file', 'file')} className="p-1 hover:text-orange-500 text-gray-600"><Plus size={13}/></button>
            <button onClick={() => onDelete(node.id)} className="p-1 hover:text-red-500 text-gray-600"><Trash2 size={13}/></button>
          </div>
        </div>
        {expanded && node.children?.map(child => (
          <TreeNode 
            key={child.id} 
            node={child} 
            depth={depth + 1} 
            activeFileId={activeFileId} 
            onFileClick={onFileClick} 
            onDelete={onDelete}
            onCreateChild={onCreateChild}
            onContextMenu={onContextMenu}
          />
        ))}
      </div>
    );
  }

  return (
    <button
      onClick={() => onFileClick(node.id)}
      onContextMenu={(e) => onContextMenu(e, node.id, 'file')}
      className={cn(
        "w-full flex items-center gap-1.5 px-2 py-1.5 text-xs rounded-xl transition-all group border-l-2",
        isActive 
          ? "bg-orange-500/10 border-orange-500 text-orange-400 font-bold" 
          : "border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800/20"
      )}
      style={{ paddingLeft: `${depth * 12 + 16}px` }}
    >
      {langInfo ? (
        <span className={cn("text-[9px] font-black w-4 shrink-0 text-center", langInfo.color)}>{langInfo.label}</span>
      ) : (
        <FileText size={12} className="text-gray-600 shrink-0" />
      )}
      <span className="truncate font-medium">{node.name}</span>
      <button
        className="ml-auto opacity-0 group-hover:opacity-60 hover:opacity-100 text-red-500 transition-opacity p-1"
        onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
      >
        <Trash2 size={12} />
      </button>
    </button>
  );
}
