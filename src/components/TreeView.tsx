'use client';
import React, { useMemo, useRef, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { GitBranch, Network, Maximize, MousePointer2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TreeViewProps {
  variables: Record<string, { value: any, type: string }>;
}

export default function TreeView({ variables }: TreeViewProps) {
  const graphRef = useRef<any>(null);

  const treeEntry = Object.entries(variables).find(([_, val]) => 
    val.type === 'object' && (val.value.left !== undefined || val.value.right !== undefined || val.value.children !== undefined)
  );

  const graphData = useMemo(() => {
    if (!treeEntry) return { nodes: [], links: [] };

    const nodes: any[] = [];
    const links: any[] = [];
    const visited = new Set();

    const traverse = (obj: any, name: string) => {
      if (!obj || typeof obj !== 'object' || visited.has(obj)) return;
      visited.add(obj);

      const nodeId = obj.id || obj.name || name;
      nodes.push({ 
        id: nodeId, 
        label: obj.value !== undefined ? String(obj.value) : name,
        isRoot: name === treeEntry[0]
      });

      if (obj.left) {
        const leftId = obj.left.id || obj.left.name || `${nodeId}-left`;
        links.push({ source: nodeId, target: leftId, type: 'left' });
        traverse(obj.left, `${name}.left`);
      }
      if (obj.right) {
        const rightId = obj.right.id || obj.right.name || `${nodeId}-right`;
        links.push({ source: nodeId, target: rightId, type: 'right' });
        traverse(obj.right, `${name}.right`);
      }
      if (Array.isArray(obj.children)) {
        obj.children.forEach((child: any, i: number) => {
          const childId = child.id || child.name || `${nodeId}-child-${i}`;
          links.push({ source: nodeId, target: childId, type: 'child' });
          traverse(child, `${name}.child[${i}]`);
        });
      }
    };

    traverse(treeEntry[1].value, treeEntry[0]);
    return { nodes, links };
  }, [treeEntry]);

  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400);
    }
  }, [graphData]);

  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!treeEntry || graphData.nodes.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <GitBranch size={48} className="text-gray-800 mb-4 opacity-40" />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">No Tree Structure Found</p>
        <p className="text-[9px] text-gray-600 mt-2 max-w-[220px] leading-relaxed">
          Create an object with <code className="text-orange-500">left</code>,{' '}
          <code className="text-orange-500">right</code>, or{' '}
          <code className="text-orange-500">children</code> fields to visualise a tree graph here.
        </p>
      </div>
    );
  }

  if (!mounted) return <div className="h-full bg-[#050507]" />;

  return (
    <div className="h-full relative flex flex-col group overflow-hidden">
      {/* HUD Overlays */}
      <div className="absolute top-4 left-4 z-10 space-y-2">
        <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-3">
          <div className="p-1.5 bg-orange-500/20 rounded-lg">
            <Network size={16} className="text-orange-500" />
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Dynamic Tree Model</h4>
            <p className="text-[8px] font-bold text-gray-500 uppercase">Live Structure Mapping</p>
          </div>
        </div>
        
        <div className="glass-panel px-3 py-2 rounded-xl flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-[8px] font-black text-gray-500 uppercase">Parent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[8px] font-black text-gray-500 uppercase">Child</span>
          </div>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button 
          onClick={() => graphRef.current?.zoomToFit(400)}
          className="p-2.5 glass-panel rounded-xl text-gray-400 hover:text-white transition-all"
        >
          <Maximize size={16} />
        </button>
      </div>

      <div className="flex-1 bg-[#050507]">
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          nodeLabel="label"
          nodeColor={(node: any) => node.isRoot ? '#f97316' : '#3b82f6'}
          linkColor={() => '#334155'}
          linkDirectionalArrowLength={3.5}
          linkDirectionalArrowRelPos={1}
          nodeCanvasObject={(node: any, ctx, globalScale) => {
            const label = node.label;
            const fontSize = 14 / globalScale;
            ctx.font = `${fontSize}px JetBrains Mono`;
            const textWidth = ctx.measureText(label).width;
            const padding = 4 / globalScale;
            const bckgDimensions = [textWidth + padding * 2, fontSize + padding * 2];

            // Node Circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, 8 / globalScale, 0, 2 * Math.PI, false);
            ctx.fillStyle = node.isRoot ? '#f97316' : '#3b82f6';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1 / globalScale;
            ctx.stroke();

            // Glow
            if (node.isRoot) {
              ctx.shadowColor = '#f97316';
              ctx.shadowBlur = 15;
            }

            // Label text
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.fillText(label, node.x, node.y + (15 / globalScale));
          }}
          cooldownTicks={100}
        />
      </div>

      {/* Interaction Help */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="glass-panel p-3 rounded-2xl flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white/5 rounded-lg">
              <MousePointer2 size={12} className="text-gray-400" />
            </div>
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
              Drag to pan • Scroll to zoom • Click to focus
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-px bg-white/10" />
            <Info size={14} className="text-gray-700" />
          </div>
        </div>
      </div>
    </div>
  );
}
