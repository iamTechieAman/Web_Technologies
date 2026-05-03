'use client';
import React, { useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Handle,
  Position,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ExecutionStep } from '@/types';
import { motion } from 'framer-motion';
import { generateFlowchartData } from '@/lib/flowchartGenerator';
import { cn } from '@/lib/utils';

interface FlowchartProps {
  steps: ExecutionStep[];
  currentStep: number;
  /** Full preprocessed source code — used to build a complete CFG */
  code?: string;
}

// ── Custom node shapes ────────────────────────────────────────────────────────

const NodeTypeColors: Record<string, string> = {
  start:      'bg-green-500/10 border-green-500/40 text-green-400',
  end:        'bg-red-500/10 border-red-500/40 text-red-400',
  decision:   'bg-yellow-500/10 border-yellow-500/40 text-yellow-300',
  loop:       'bg-blue-500/10 border-blue-500/40 text-blue-300',
  output:     'bg-purple-500/10 border-purple-500/40 text-purple-300',
  input:      'bg-cyan-500/10 border-cyan-500/40 text-cyan-300',
  return:     'bg-cyan-500/10 border-cyan-500/40 text-cyan-300',
  process:    'bg-white/[0.03] border-white/10 text-gray-300',
};

interface NodeData {
  type: string;
  isActive: boolean;
  label: string;
}

const CodeNode = React.memo(({ data }: { data: NodeData }): React.ReactNode => {
  const colorClass = NodeTypeColors[data.type] || NodeTypeColors.process;

  return (
    <motion.div
      animate={{
        scale: data.isActive ? 1.06 : 1,
        boxShadow: data.isActive ? '0 0 24px rgba(249,115,22,0.4)' : 'none',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn(
        'px-4 py-2.5 rounded-xl border min-w-[160px] max-w-[220px] relative select-none',
        colorClass,
        data.isActive ? 'ring-2 ring-cyan-500/60' : '',
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-700 !w-1.5 !h-1.5 !border-0 !top-[-4px]" />
      <div className="flex items-center gap-2">
        <span className="text-[7px] font-black uppercase tracking-widest opacity-60 shrink-0">
          {data.type}
        </span>
        {data.isActive && <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse ml-auto" />}
      </div>
      <div className="text-[10px] font-mono mt-1 leading-tight break-words">
        {data.label}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-gray-700 !w-1.5 !h-1.5 !border-0 !bottom-[-4px]" />
    </motion.div>
  );
});
CodeNode.displayName = 'CodeNode';

const nodeTypes = { custom: CodeNode };

// ── Main component ────────────────────────────────────────────────────────────

export default function Flowchart({ steps, currentStep, code }: FlowchartProps): React.ReactNode {
  const currentLine = steps[currentStep]?.lineNumber;

  // Build CFG from full code when available; fall back to reconstructing from steps
  const sourceCode = useMemo(() => {
    if (code && code.trim().length > 0) return code;
    // Reconstruct from unique step lines in order
    const seen = new Set<number>();
    return steps
      .filter(s => { const ok = !seen.has(s.lineNumber); seen.add(s.lineNumber); return ok; })
      .map(s => s.lineContent)
      .join('\n');
  }, [code, steps]);

  const { nodes, edges } = useMemo(
    () => generateFlowchartData(sourceCode, currentLine),
    [sourceCode, currentLine],
  );

  if (nodes.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="text-gray-800 text-[10px] font-black uppercase tracking-widest">
          No flowchart data — run your code first.
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#050507] relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.1}
        maxZoom={3}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1e293b" gap={24} size={1} />
        <Controls
          className="[&>button]:bg-[#0d0d10] [&>button]:border-white/10 [&>button]:text-gray-400"
        />
        <MiniMap
          nodeColor={(n) => (n.data as NodeData).isActive ? '#f97316' : '#1e293b'}
          maskColor="rgba(0,0,0,0.6)"
          style={{ width: 110, height: 90, background: '#0d0d10', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}
        />
      </ReactFlow>

      {/* Active step legend */}
      <div className="absolute top-4 left-4 glass-panel px-3 py-1.5 rounded-xl pointer-events-none">
        <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">
          Line <span className="text-cyan-500">{currentLine ?? '—'}</span> active
        </span>
      </div>
    </div>
  );
}
