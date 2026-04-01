'use client';
import { useMemo } from 'react';
import { generateFlowChart } from '@/lib/codeParser';
import type { Node, Edge } from 'reactflow';

const NODE_COLORS: Record<string, { bg: string; border: string }> = {
  start:     { bg: '#10b981', border: '#059669' },
  end:       { bg: '#ef4444', border: '#dc2626' },
  statement: { bg: '#3b82f6', border: '#2563eb' },
  condition: { bg: '#f59e0b', border: '#d97706' },
  loop:      { bg: '#8b5cf6', border: '#7c3aed' },
  function:  { bg: '#06b6d4', border: '#0891b2' },
  return:    { bg: '#ec4899', border: '#db2777' },
  output:    { bg: '#14b8a6', border: '#0d9488' },
};

export function useFlowChart(code: string, currentStep: number) {
  return useMemo(() => {
    if (!code.trim()) return { nodes: [], edges: [] };

    const { nodes: rawNodes, edges: rawEdges } = generateFlowChart(code);

    const nodes: Node[] = rawNodes.map((n, i) => {
      const colors = NODE_COLORS[n.type] || NODE_COLORS.statement;
      const isActive = currentStep >= 0 && rawNodes[currentStep]?.id === n.id;

      return {
        id: n.id,
        position: { x: 200, y: i * 100 },
        data: {
          label: n.label,
        },
        style: {
          background: colors.bg,
          border: `2px solid ${isActive ? '#fff' : colors.border}`,
          borderRadius: n.type === 'condition' ? '0' : n.type === 'start' || n.type === 'end' ? '50px' : '8px',
          color: '#fff',
          padding: '8px 16px',
          fontSize: '12px',
          fontWeight: isActive ? 700 : 500,
          boxShadow: isActive ? '0 0 20px rgba(255,255,255,0.5)' : 'none',
          transform: n.type === 'condition' ? 'rotate(45deg)' : undefined,
          minWidth: '120px',
          textAlign: 'center' as const,
        },
      };
    });

    const edges: Edge[] = rawEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      animated: e.animated ?? false,
      style: { stroke: '#64748b', strokeWidth: 2 },
      labelStyle: { fill: '#94a3b8', fontSize: 10 },
    }));

    return { nodes, edges };
  }, [code, currentStep]);
}
