'use client';
import React, { useMemo } from 'react';
import ReactFlow, { Background, Controls, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';

interface GraphVisualizerProps {
  data: any;
  currentValue?: any;
}

export default function GraphVisualizer({ data }: GraphVisualizerProps) {
  const { nodes, edges } = useMemo(() => {
    const nodes: any[] = [];
    const edges: any[] = [];
    
    // Simple heuristic to parse a tree from a nested object
    const traverse = (obj: any, x = 400, y = 50, level = 0, parentId?: string) => {
      if (!obj || typeof obj !== 'object') return;

      const id = `node-${nodes.length}`;
      const label = obj.val !== undefined ? String(obj.val) : obj.value !== undefined ? String(obj.value) : 'node';

      nodes.push({
        id,
        position: { x, y },
        data: { label },
        style: {
          background: '#1e293b',
          color: '#f1f5f9',
          border: '2px solid #3b82f6',
          borderRadius: '50%',
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          fontWeight: 'bold',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        }
      });

      if (parentId) {
        edges.push({
          id: `edge-${parentId}-${id}`,
          source: parentId,
          target: id,
          markerEnd: { type: MarkerType.ArrowClosed, color: '#475569' },
          style: { stroke: '#475569', strokeWidth: 2 },
        });
      }

      const spread = 200 / (level + 1);
      if (obj.left) traverse(obj.left, x - spread, y + 80, level + 1, id);
      if (obj.right) traverse(obj.right, x + spread, y + 80, level + 1, id);
      
      // Also check children array for general graphs/trees
      if (Array.isArray(obj.children)) {
        obj.children.forEach((child: any, i: number) => {
          traverse(child, x - (obj.children.length - 1) * 40 + i * 80, y + 80, level + 1, id);
        });
      }
    };

    traverse(data);
    return { nodes, edges };
  }, [data]);

  if (nodes.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-700 opacity-50">
        <p className="text-xs font-black uppercase tracking-widest">No tree/graph structure detected</p>
        <p className="text-[10px] mt-2">Structure should have 'val', 'left', 'right' or 'children' properties.</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#0d0d10]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#16161a" gap={20} size={1} />
        <Controls className="!bg-gray-900 !border-gray-800" />
      </ReactFlow>
    </div>
  );
}
