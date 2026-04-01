'use client';
import React, { useMemo } from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

interface FlowChartPanelProps {
  code: string;
  activeLine?: number;
}

export default function FlowChartPanel({ code, activeLine }: FlowChartPanelProps) {
  const { nodes, edges } = useMemo(() => {
    const lines = code.split('\n').filter(l => l.trim());
    const nodes: any[] = [];
    const edges: any[] = [];

    lines.forEach((line, i) => {
      const isCurrent = (i + 1) === activeLine;
      nodes.push({
        id: String(i),
        data: { label: line.trim() },
        position: { x: 250, y: i * 80 },
        style: {
          background: isCurrent ? '#f97316' : '#1e1e2e',
          color: '#fff',
          border: isCurrent ? '2px solid #fff' : '1px solid #334155',
          borderRadius: '8px',
          fontSize: '10px',
          fontFamily: 'monospace',
          width: 200,
        },
      });

      if (i > 0) {
        edges.push({
          id: `e${i-1}-${i}`,
          source: String(i-1),
          target: String(i),
          animated: isCurrent,
          style: { stroke: isCurrent ? '#f97316' : '#334155' },
        });
      }
    });

    return { nodes, edges };
  }, [code, activeLine]);

  return (
    <div className="h-full w-full bg-[#0d0d10]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        style={{ background: '#0d0d10' }}
      >
        <Background color="#334155" gap={20} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
