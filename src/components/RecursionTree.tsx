import React, { useMemo, useRef, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Share2, Network, Maximize, MousePointer2, Info, Zap } from 'lucide-react';
import { ExecutionStep } from '@/types';
import { cn } from '@/lib/utils';

interface RecursionTreeProps {
  steps: ExecutionStep[];
  currentStep: number;
}

export default function RecursionTree({ steps, currentStep }: RecursionTreeProps) {
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
      graphRef.current.zoomToFit(400);
    }
  }, [graphData]);

  if (callStack.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <Share2 size={48} className="text-gray-800 mb-4 opacity-40" />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Call Stack Empty</p>
        <p className="text-[9px] text-gray-600 mt-2 max-w-[220px] leading-relaxed">
          Write a recursive function (e.g. fibonacci, factorial) and step through execution — the call tree will appear here.
        </p>
      </div>
    );
  }

  if (!mounted) return <div className="h-full bg-[#050507]" />;

  return (
    <div className="h-full relative flex flex-col group overflow-hidden bg-[#050507]">
      {/* HUD */}
      <div className="absolute top-4 left-4 z-10 space-y-2">
        <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-3">
          <div className="p-1.5 bg-orange-500/20 rounded-lg">
            <Zap size={16} className="text-orange-500" />
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Recursion Tree</h4>
            <p className="text-[8px] font-bold text-gray-500 uppercase">Depth: {callStack.length}</p>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          nodeLabel="label"
          nodeColor={(node: any) => node.isActive ? '#f97316' : '#334155'}
          linkColor={() => '#1e293b'}
          nodeCanvasObject={(node: any, ctx, globalScale) => {
            const label = node.label;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px JetBrains Mono`;
            
            // Draw circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, 6 / globalScale, 0, 2 * Math.PI, false);
            ctx.fillStyle = node.isActive ? '#f97316' : '#1e293b';
            ctx.fill();
            ctx.strokeStyle = node.isActive ? '#fb923c' : '#334155';
            ctx.lineWidth = 1.5 / globalScale;
            ctx.stroke();

            // Active glow
            if (node.isActive) {
              ctx.shadowColor = '#f97316';
              ctx.shadowBlur = 10;
            }

            // Text
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = node.isActive ? '#fff' : '#94a3b8';
            ctx.fillText(label, node.x, node.y + (12 / globalScale));
          }}
          cooldownTicks={100}
        />
      </div>
    </div>
  );
}
