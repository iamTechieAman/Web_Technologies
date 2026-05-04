'use client';
import React from 'react';
import { 
  ChevronDown, ChevronRight, File, Folder, FolderOpen, BookOpen,
  Search as SearchIcon, GitBranch, Bug, Puzzle 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileNode, Problem } from '@/types';
import ProblemDescription from './ProblemDescription';
import { useThemeClasses } from '@/context/ThemeContext';
import GitImportModal from './GitImportModal';
import FileExplorer from './FileExplorer';
import CompactProblemLibrary from './CompactProblemLibrary';
import HistoryPanel from './HistoryPanel';
import type { RunHistoryItem } from '@/hooks/useRunHistory';
import { Badge } from '@/components/ui/badge';

interface VSCodeSidebarProps {
  activeView: 'explorer' | 'problem' | 'search' | 'source-control' | 'debug' | 'extensions' | 'history';
  onViewChange?: (view: 'explorer' | 'problem' | 'search' | 'source-control' | 'debug' | 'extensions' | 'history') => void;
  files: FileNode[];
  activeFileId: string | null;
  onFileClick: (id: string) => void;
  onCreate: (parentId: string, type: 'file' | 'folder') => void;
  onDelete: (id: string, name: string) => void;
  onRename: (id: string, newName: string) => void;
  onImportProject?: (repoUrl: string) => Promise<void>;
  initialProblem?: Problem;
  onDownloadProject?: () => void;
  onProblemSelect?: (problem: Problem) => void;
  historyItems?: RunHistoryItem[];
  historyOwner?: string;
  onClearHistory?: () => void;
}

export default function VSCodeSidebar({ 
  activeView, 
  onViewChange,
  files, 
  activeFileId, 
  onFileClick, 
  onCreate, 
  onDelete, 
  onRename,
  onImportProject,
  initialProblem,
  onDownloadProject,
  onProblemSelect,
  historyItems = [],
  historyOwner = 'guest',
  onClearHistory = () => {}
}: VSCodeSidebarProps) {
  const themeClasses = useThemeClasses();
  const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(new Set());
  const [showGitImport, setShowGitImport] = React.useState(false);
  const [_importing, setImporting] = React.useState(false);

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFileTree = (nodes: FileNode[], depth = 0): JSX.Element[] => {
    return nodes.map((node) => {
      const isFolder = node.type === 'folder';
      const isExpanded = expandedFolders.has(node.id);
      const isActive = node.id === activeFileId;

      if (isFolder) {
        return (
          <div key={node.id}>
            <div
              className={cn(
                "flex items-center gap-1 px-2 py-1 cursor-pointer transition-all group",
                themeClasses.textSecondary,
                "hover:text-cyan-500 hover:bg-cyan-500/5"
              )}
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
              onClick={() => toggleFolder(node.id)}
            >
              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              {isExpanded ? <FolderOpen size={16} className={themeClasses.accent} /> : <Folder size={16} className={themeClasses.textTertiary} />}
              <span className="text-sm select-none">{node.name}</span>
            </div>
            {isExpanded && node.children && (
              <div>{renderFileTree(node.children, depth + 1)}</div>
            )}
          </div>
        );
      }

      return (
        <div
          key={node.id}
          className={cn(
            "flex items-center gap-1 px-2 py-1 cursor-pointer transition-all group",
            isActive 
              ? cn(themeClasses.accentBg, themeClasses.accent)
              : cn(themeClasses.textSecondary, "hover:text-cyan-500 hover:bg-cyan-500/5")
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => onFileClick(node.id)}
        >
          <File size={16} className={isActive ? themeClasses.accent : themeClasses.textTertiary} />
          <span className="text-sm select-none">{node.name}</span>
        </div>
      );
    });
  };

  const handleGitImport = async (repoUrl: string) => {
    setImporting(true);
    try {
      if (onImportProject) {
        await onImportProject(repoUrl);
      } else {
        const response = await fetch('/api/git/clone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repoUrl }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to import repository');
        }

        const { fileTree } = await response.json();
        console.log('Imported files:', fileTree);
      }
      
      setShowGitImport(false);
    } catch (error) {
      console.error('Git import failed:', error);
      throw error;
    } finally {
      setImporting(false);
    }
  };


  const [searchQuery, setSearchQuery] = React.useState('');

  const renderExplorer = () => (
    <div className="flex flex-col h-full overflow-hidden">
      <FileExplorer
        files={files}
        activeFileId={activeFileId}
        onFileClick={onFileClick}
        onCreate={onCreate}
        onDelete={onDelete}
        onRename={onRename}
        onImportProject={onImportProject || (async () => {})}
        onResetWorkspace={() => {}}
        onDownloadProject={onDownloadProject}
      />
    </div>
  );

  const renderSearch = () => {
    const searchResults = files.filter(f => 
      f.type === 'file' && 
      (f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
       (f.content && f.content.toLowerCase().includes(searchQuery.toLowerCase())))
    );

    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className={cn("flex items-center justify-between px-4 py-3 border-b", themeClasses.border, themeClasses.bgSurface)}>
          <span className={cn("text-[10px] font-black uppercase tracking-widest", themeClasses.textTertiary)}>Search</span>
        </div>
        <div className={cn("p-4 border-b", themeClasses.border)}>
          <div className="relative group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files or code..."
              className={cn(
                "w-full pl-8 pr-3 py-2 text-xs rounded-xl border transition-all",
                themeClasses.border,
                themeClasses.text,
                themeClasses.codeBackground,
                "focus:ring-1 focus:ring-cyan-500/50 outline-none placeholder:opacity-30"
              )}
            />
            <SearchIcon className={cn("absolute left-2.5 top-2.5 transition-colors", themeClasses.textTertiary, "group-focus-within:text-cyan-500")} size={14} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {searchQuery && searchResults.length > 0 ? (
            <div className="space-y-1">
              {searchResults.map(file => <div 
                    key={file.id} 
                    onClick={() => onFileClick(file.id)}
                    className={cn("p-2 rounded-lg cursor-pointer group", themeClasses.bgHover)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <File size={12} className={themeClasses.accent} />
                      <span className={cn("text-[11px] font-bold", themeClasses.text)}>{file.name}</span>
                    </div>
                    {file.content && file.content.toLowerCase().includes(searchQuery.toLowerCase()) && (
                      <div className={cn("text-[10px] line-clamp-2 pl-5 font-mono", themeClasses.textTertiary)}>
                        ...{file.content.substring(Math.max(0, file.content.toLowerCase().indexOf(searchQuery.toLowerCase()) - 20), Math.min(file.content.length, file.content.toLowerCase().indexOf(searchQuery.toLowerCase()) + 40))}...
                      </div>
                    )}
                  </div>
              )}
            </div>
          ) : searchQuery ? (
            <div className="h-full flex flex-col items-center justify-center opacity-30 gap-2 p-8 text-center">
              <SearchIcon size={32} strokeWidth={1} />
              <p className="text-[10px] font-black uppercase tracking-widest">No results found</p>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-20 gap-2 p-8 text-center">
              <SearchIcon size={32} strokeWidth={1} />
              <p className="text-[10px] font-black uppercase tracking-widest">Enter a search query</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSourceControl = () => (
    <div className="flex flex-col h-full overflow-hidden">
      <div className={cn("flex items-center justify-between px-4 py-3 border-b", themeClasses.border, themeClasses.bgSurface)}>
        <span className={cn("text-[10px] font-black uppercase tracking-widest", themeClasses.textTertiary)}>Source Control</span>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 text-center opacity-30 flex flex-col items-center justify-center gap-4">
        <GitBranch size={48} strokeWidth={1} className={themeClasses.textTertiary} />
        <div>
          <p className={cn("text-[11px] font-bold mb-1", themeClasses.text)}>Local Versioning</p>
          <p className={cn("text-[10px] leading-relaxed", themeClasses.textTertiary)}>Changes are automatically saved to your browser's local storage.</p>
        </div>
        <button className={cn("px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all", themeClasses.accent, themeClasses.accentBg, themeClasses.accentBorder, "hover:opacity-80")}>Initialize Repo</button>
      </div>
    </div>
  );

  const renderDebug = () => (
    <div className="flex flex-col h-full overflow-hidden">
      <div className={cn("flex items-center justify-between px-4 py-3 border-b", themeClasses.border, themeClasses.bgSurface)}>
        <span className={cn("text-[10px] font-black uppercase tracking-widest", themeClasses.textTertiary)}>Run and Debug</span>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col items-center justify-center gap-4 opacity-30">
        <Bug size={48} strokeWidth={1} className={themeClasses.textTertiary} />
        <p className={cn("text-[10px] font-black uppercase tracking-widest text-center", themeClasses.textTertiary)}>No configurations found</p>
        <button className={cn("w-full py-2 border rounded-xl text-[9px] font-black uppercase tracking-widest transition-all", themeClasses.info, themeClasses.accentBg, themeClasses.accentBorder, "hover:opacity-80")}>Add Configuration</button>
      </div>
    </div>
  );

  const renderExtensions = () => (
    <div className="flex flex-col h-full overflow-hidden">
      <div className={cn("flex items-center justify-between px-4 py-3 border-b", themeClasses.border, themeClasses.bgSurface)}>
        <span className={cn("text-[10px] font-black uppercase tracking-widest", themeClasses.textTertiary)}>Extensions</span>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {[
          { name: 'Python', desc: 'Linting, Debugging (multi-threaded)', author: 'CodeVisualizer', inst: 'Built-in' },
          { name: 'Java', desc: 'IntelliSense, Class Analysis', author: 'CodeVisualizer', inst: 'Built-in' },
          { name: 'C++', desc: 'Standard Template Library Support', author: 'CodeVisualizer', inst: 'Built-in' },
          { name: 'AI Mentor', desc: 'Powered by Llama 3.1 8B', author: 'OpenRouter', inst: 'Active' },
        ].map((ext, i) => (
          <div key={i} className={cn("p-3 rounded-xl transition-all group cursor-default", themeClasses.bgHover)}>
            <div className="flex items-start justify-between mb-1">
              <span className={cn("text-[11px] font-black group-hover:text-cyan-400 transition-colors", themeClasses.text)}>{ext.name}</span>
              <Badge variant="outline" className={cn("text-[8px] px-1.5 py-0 h-4 opacity-50", themeClasses.border)}>{ext.inst}</Badge>
            </div>
            <p className={cn("text-[10px] line-clamp-1", themeClasses.textTertiary)}>{ext.desc}</p>
            <div className="mt-2 text-[9px] text-cyan-500/50 font-bold uppercase tracking-wider">{ext.author}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const [forceShowLibrary, setForceShowLibrary] = React.useState(false);

  const renderProblem = () => (
    <div className="flex flex-col h-full overflow-hidden">
      <div className={cn("flex items-center justify-between px-4 py-3 border-b", themeClasses.border, themeClasses.bgSurface)}>
        <span className={cn("text-[10px] font-black uppercase tracking-widest", themeClasses.textTertiary)}>
          {forceShowLibrary || !initialProblem ? "Problem Library" : "Problem"}
        </span>
        {forceShowLibrary && initialProblem && (
          <button 
            onClick={() => setForceShowLibrary(false)}
            className="text-[9px] font-black uppercase tracking-widest text-cyan-500 hover:text-cyan-400 transition-colors"
          >
            Back to Description
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {initialProblem && !forceShowLibrary ? (
          <div className="pb-10">
            <ProblemDescription problem={initialProblem} />
            <div className="flex flex-col gap-3 mt-8">
              <button 
                onClick={() => onViewChange?.('explorer')}
                className="w-full py-4 bg-cyan-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-black hover:bg-cyan-400 transition-all shadow-2xl shadow-cyan-500/20 active:scale-[0.98]"
              >
                Solve Challenge Now
              </button>
              <button 
                onClick={() => setForceShowLibrary(true)}
                className={cn("w-full py-3 rounded-2xl border text-[9px] font-black uppercase tracking-[0.2em] transition-all", themeClasses.border, "text-cyan-500/60 border-cyan-500/10 hover:text-cyan-400 hover:bg-cyan-500/5 hover:border-cyan-500/20")}
              >
                Explore Other Challenges
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full">
            <div className={cn("p-2 border-b mb-4", themeClasses.border)}>
              <p className={cn("text-[10px] leading-relaxed", themeClasses.textTertiary)}>Select a problem to start coding and visualizing its execution.</p>
            </div>
            <CompactProblemLibrary onSelect={onProblemSelect} />
          </div>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeView) {
      case 'explorer':
        return renderExplorer();
      case 'problem':
        return renderProblem();
      case 'search':
        return renderSearch();
      case 'source-control':
        return renderSourceControl();
      case 'debug':
        return renderDebug();
      case 'extensions':
        return renderExtensions();
      case 'history':
        return (
          <div className="flex flex-col h-full overflow-hidden">
            <HistoryPanel items={historyItems} owner={historyOwner} onClear={onClearHistory} />
          </div>
        );
      default:
        return renderExplorer();
    }
  };

  return (
    <div className={cn("w-full h-full flex flex-col", themeClasses.bgSecondary)}>
      {renderContent()}
      
      {/* Git Import Modal */}
      <GitImportModal
        isOpen={showGitImport}
        onClose={() => setShowGitImport(false)}
        onImport={handleGitImport}
      />
    </div>
  );
}
