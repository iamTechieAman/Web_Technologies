'use client';
import React, { useEffect, useState, useRef } from 'react';
import { RefreshCw, ExternalLink, Globe, Smartphone, Monitor, ShieldCheck, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileNode } from '@/types';
import { safeArray, safeAsync, safeString } from '@/lib/safe';

interface LivePreviewProps {
  files: FileNode[];
  activeFileId: string | null;
  onClose: () => void;
}

export default function LivePreview({ files, activeFileId: _activeFileId, onClose }: LivePreviewProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [livePort, setLivePort] = useState<number | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const sessionId = useRef(`session-${Math.random().toString(36).substring(7)}`);
  const syncLock = useRef(false);

  const fetchWithTimeout = (url: string, ms = 800) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), ms);
    return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(id));
  };

  const discoverPort = async (): Promise<number | null> => {
    for (let p = 3001; p <= 3010; p++) {
      try {
        const res = await fetchWithTimeout(`http://localhost:${p}`);
        if (res.ok) {
          const data = await safeAsync(() => res.json(), null);
          if (data && data.type === 'live') {
            setLivePort(p);
            return p;
          }
        }
      } catch {}
    }
    return null;
  };

  const syncAndRefresh = async () => {
    if (syncLock.current) return;
    syncLock.current = true;

    let port = livePort;
    if (!port) {
      port = await discoverPort();
      if (!port) {
        syncLock.current = false;
        return;
      }
    }

    setLoading(true);

    try {
      const res = await fetch(`http://localhost:${port}/sync-files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId: sessionId.current, 
          files: safeArray<FileNode>(files) 
        }),
      });

      const data = await safeAsync(() => res.json(), null);

      if (data?.success && data?.url) {
        const checkHtml = (nodes: FileNode[]): boolean => {
          return nodes.some(n => n.name.endsWith('.html') || (n.children && checkHtml(n.children)));
        };
        const hasHtml = checkHtml(files);
        if (!hasHtml) {
          setUrl(null);
          return;
        }

        const safeUrl = safeString(data.url);
        const base = safeUrl.endsWith('/') ? safeUrl : safeUrl + '/';
        const newUrl = `${base}index.html?t=${Date.now()}`;
        setUrl(newUrl);
      }
    } catch {
    } finally {
      setLoading(false);
      syncLock.current = false;
    }
  };

  useEffect(() => {
    syncAndRefresh();
  }, []);

  useEffect(() => {
    const timer = setTimeout(syncAndRefresh, 800);
    return () => clearTimeout(timer);
  }, [files, livePort]);

  return (
    <div className="h-full flex flex-col bg-[#050507]">
      <div className="h-12 border-b border-gray-800/50 flex items-center justify-between px-4 bg-[#0d0d10]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded text-green-500">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Live Server</span>
          </div>

          <div className="h-4 w-px bg-gray-800" />

          <div className="flex bg-gray-900 rounded-lg p-0.5 border border-gray-800">
            <button 
              onClick={() => setViewMode('desktop')}
              className={cn("p-1.5 rounded-md transition-all", viewMode === 'desktop' ? "bg-gray-800 text-white" : "text-gray-500")}
            >
              <Monitor size={14} />
            </button>

            <button 
              onClick={() => setViewMode('mobile')}
              className={cn("p-1.5 rounded-md transition-all", viewMode === 'mobile' ? "bg-gray-800 text-white" : "text-gray-500")}
            >
              <Smartphone size={14} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={syncAndRefresh}
            className={cn("p-2 text-gray-500 hover:text-white", loading && "animate-spin")}
          >
            <RefreshCw size={14} />
          </button>

          <a 
            href={url || '#'} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 text-gray-500 hover:text-white"
          >
            <ExternalLink size={14} />
          </a>

          <button onClick={onClose} className="p-2 text-gray-500 hover:text-red-500">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white/5 p-4 overflow-auto flex justify-center">
        <div className={cn(
          "bg-white shadow-2xl transition-all duration-500 relative",
          viewMode === 'desktop' ? "w-full h-full" : "w-[375px] h-[667px] rounded-[32px] border-[8px] border-gray-900"
        )}>
          {loading && !url && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-100 gap-4">
              <Globe size={32} className="text-cyan-500 animate-bounce" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Starting Live Server...</p>
            </div>
          )}

          {url ? (
            <iframe 
              ref={iframeRef}
              src={url} 
              className="w-full h-full border-none"
              title="Live Preview"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-gray-400 gap-4 p-8 text-center">
              <Globe size={48} className="text-gray-800" />
              <div>
                <h3 className="text-lg font-bold text-gray-900">No Preview</h3>
                <p className="text-sm">Create an index.html file to start live preview</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="h-8 border-t border-gray-800/50 flex items-center px-4 bg-[#0d0d10] gap-4 overflow-hidden">
        <div className="flex items-center gap-1.5 text-green-500/70 shrink-0">
          <ShieldCheck size={12} />
          <span className="text-[9px] font-bold uppercase">Secured</span>
        </div>
        <div className="flex-1 truncate">
          <span className="text-[9px] text-gray-600 font-mono">{url || 'http://localhost:3001/'}</span>
        </div>
      </div>
    </div>
  );
}