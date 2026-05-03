'use client';
import React, { useState, useEffect } from 'react';
import Graphviz from 'graphviz-react';
import { 
  Maximize2, 
  RotateCcw, 
  Download, 
  Search, 
  SearchSlash, 
  RefreshCw,
  AlertTriangle,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThemeClasses } from '@/context/ThemeContext';

interface CodeMapViewProps {
  code: string;
  language: string;
  fileId?: string;
}

export default function CodeMapView({ code, language, fileId }: CodeMapViewProps) {
  const themeClasses = useThemeClasses();
  const [dot, setDot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cache, setCache] = useState<Record<string, string>>({});

  const generateMap = async (force = false) => {
    if (!code) return;
    
    // Check cache first
    if (!force && fileId && cache[fileId]) {
      setDot(cache[fileId]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/codemap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      if (data.dot) {
        setDot(data.dot);
        if (fileId) {
          setCache(prev => ({ ...prev, [fileId]: data.dot }));
        }
      } else {
        throw new Error('No DOT notation generated');
      }
    } catch (err: any) {
      console.error('[CodeMap View Error]:', err);
      setError(err.message || 'Failed to generate architectural map');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only auto-generate if we don't have a dot for this file yet
    if (fileId && !cache[fileId]) {
      generateMap();
    } else if (fileId && cache[fileId]) {
      setDot(cache[fileId]);
    }
  }, [fileId]);

  const downloadSvg = () => {
    const svg = document.querySelector('.graphviz-container svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `code-map-${fileId || 'export'}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="h-full flex flex-col bg-[#0B0D17] relative overflow-hidden">
      {/* Controls Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/5 bg-white/[0.02] z-10">
        <div className="flex items-center gap-2">
          <RefreshCw size={14} className="text-cyan-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Structural Architecture</span>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => generateMap(true)}
            disabled={loading}
            className={cn(
              "p-1.5 rounded-lg transition-all hover:bg-white/5 text-white/40 hover:text-white",
              loading && "animate-spin"
            )}
            title="Regenerate Map"
          >
            <RotateCcw size={14} />
          </button>
          <div className="w-[1px] h-4 bg-white/10 mx-1" />
          <button
            onClick={downloadSvg}
            disabled={!dot}
            className="p-1.5 rounded-lg transition-all hover:bg-white/5 text-white/40 hover:text-white"
            title="Download SVG"
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative group overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-20">
            <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500">Mapping Structural Relations...</p>
            <p className="text-[9px] text-white/30 mt-2">AI is analyzing logic, classes, and dependencies</p>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-20">
            <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20 mb-4">
              <AlertTriangle className="text-red-500" size={32} />
            </div>
            <h3 className="text-sm font-bold text-white mb-2">Architectural Mapping Failed</h3>
            <p className="text-[11px] text-white/40 max-w-xs leading-relaxed mb-6">
              {error}. 
              <br/><br/>
              <span className="text-cyan-500/80 italic">Tip: Ensure PUTER_API_KEY is configured in your environment for unlimited free analysis.</span>
            </p>
            <button 
              onClick={() => generateMap(true)}
              className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all"
            >
              Retry Analysis
            </button>
          </div>
        ) : dot ? (
          <div className="h-full w-full graphviz-container custom-scrollbar overflow-auto bg-[#0B0D17]">
            <div className="p-4 min-w-full min-h-full flex items-center justify-center">
              <Graphviz 
                dot={dot} 
                options={{
                  width: '100%',
                  height: '100%',
                  zoom: true,
                  fit: true,
                }}
              />
            </div>
            
            {/* Legend Overlay */}
            <div className="absolute bottom-4 left-4 p-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#add8e6]" />
                  <span className="text-[9px] font-bold text-white/60">Functions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#90ee90]" />
                  <span className="text-[9px] font-bold text-white/60">Classes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ffffe0]" />
                  <span className="text-[9px] font-bold text-white/60">Variables</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center opacity-40">
            <SearchSlash size={48} strokeWidth={1} className="mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest mb-4">No Map Generated</p>
            <button 
              onClick={() => generateMap(true)}
              className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all"
            >
              Analyze Structure
            </button>
          </div>
        )}
      </div>

      {/* Floating Info Overlay */}
      {!loading && !error && dot && (
        <div className="absolute top-16 right-4 z-20">
          <div className="bg-black/60 backdrop-blur-md border border-white/10 p-2 rounded-xl shadow-2xl flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Info size={12} className="text-cyan-500" />
            <span className="text-[9px] text-white/60 font-medium">Use mouse wheel to zoom, drag to pan</span>
          </div>
        </div>
      )}
    </div>
  );
}
