import React, { useMemo, useRef, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Share2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme, useThemeClasses } from '@/context/ThemeContext';
import { ExecutionStep } from '@/types';

interface RecursionTreeProps {
  steps: ExecutionStep[];
  currentStep: number;
}

export default function RecursionTree({ steps, currentStep }: RecursionTreeProps): React.ReactNode {
  const { isDark } = useTheme();
  const themeClasses = useThemeClasses();
  // eslint-disable-next-line
  const graphRef = useRef<any>(null);
  const callStack = steps[currentStep]?.callStack || [];

  const graphData = useMemo(() => {
    if (callStack.length === 0) return { nodes: [], links: [] };

    const nodes: any[] = [];
    const links: any[] = [];

    callStack.forEach((frame, i) => {
      const nodeId = `frame-${i}`;
      nodes.push({ 
        id: nodeId, 
        label: `${frame.functionName}(${frame.params})`,
        isActive: i === callStack.length - 1,
        depth: i
      });

      if (i > 0) {
        links.push({ source: `frame-${i-1}`, target: nodeId });
      }
    });

    return { nodes, links };
  }, [callStack]);

  const [mounted, setMounted] = React.useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (graphRef.current) {
      // eslint-disable-next-line
      graphRef.current.zoomToFit(400);
    }
  }, [graphData]);

  if (callStack.length === 0) {
    return (
      <div className={cn("h-full flex flex-col items-center justify-center text-center p-8", isDark ? "" : "bg-gray-50/30")}>
        <Share2 size={48} className={cn("mb-4 opacity-40", isDark ? "text-gray-800" : "text-gray-400")} />
        <p className={cn("text-[10px] font-black uppercase tracking-widest", isDark ? "text-gray-500" : "text-gray-400")}>Call Stack Empty</p>
        <p className={cn("text-[9px] mt-2 max-w-[220px] leading-relaxed", isDark ? "text-gray-600" : "text-gray-500")}>
          Write a recursive function (e.g. fibonacci, factorial) and step through execution — the call tree will appear here.
        </p>
      </div>
    );
  }

  if (!mounted) return <div className={cn("h-full", themeClasses.bgSecondary)} />;

  return (
    <div className={cn("h-full relative flex flex-col group overflow-hidden rounded-[2rem]", themeClasses.bgSecondary)}>
      {/* HUD */}
      <div className="absolute top-6 left-6 z-10 space-y-3 pointer-events-none">
        <div className={cn(
          "px-6 py-3 rounded-2xl flex items-center gap-4 border backdrop-blur-3xl shadow-2xl ring-1",
          isDark ? "bg-[#141725]/40 border-white/5 ring-white/5" : "bg-white/90 border-gray-200 ring-black/5 shadow-gray-200/50"
        )}>
          <div className="p-2.5 bg-cyan-500/20 rounded-xl shadow-inner">
            <Zap size={20} className="text-cyan-500 animate-pulse" />
          </div>
          <div>
            <h4 className={cn("text-[10px] font-black uppercase tracking-[0.2em]", isDark ? "text-white/90" : "text-gray-900")}>Trace Engine v4</h4>
            <p className="text-[9px] font-bold text-cyan-500/60 uppercase">Nodes Active: {callStack.length}</p>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          nodeLabel="label"
          nodeColor={(node: any) => (node as { isActive?: boolean }).isActive ? '#22d3ee' : '#1e293b'}
          linkColor={() => isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
          nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
            const label = (node as { label: string }).label;
            const isActive = (node as { isActive?: boolean }).isActive;
            const fontSize = 11 / globalScale;
            
            // Draw node base
            ctx.beginPath();
            ctx.arc(node.x as number, node.y as number, 8 / globalScale, 0, 2 * Math.PI, false);
            
            if (isActive) {
              const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 10 / globalScale);
              gradient.addColorStop(0, '#22d3ee');
              gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
              ctx.fillStyle = gradient;
              ctx.fill();
              
              // Core
              ctx.beginPath();
              ctx.arc(node.x, node.y, 4 / globalScale, 0, 2 * Math.PI, false);
              ctx.fillStyle = '#fff';
              ctx.fill();
              
              ctx.shadowColor = '#06b6d4';
              ctx.shadowBlur = 15;
            } else {
              ctx.fillStyle = isDark ? '#1e293b' : '#e2e8f0';
              ctx.fill();
              ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
              ctx.lineWidth = 1 / globalScale;
              ctx.stroke();
            }

            // Text
            ctx.shadowBlur = 0;
            ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = isActive ? '#22d3ee' : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)');
            ctx.fillText(label, node.x as number, (node.y as number) + (16 / globalScale));
          }}
          cooldownTicks={100}
        />
      </div>
    </div>
  );
}
