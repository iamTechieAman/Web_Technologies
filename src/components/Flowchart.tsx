'use client';
import React, { useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MarkerType,
  Handle,
  Position,
  MiniMap
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ExecutionStep } from '@/types';
import { motion } from 'framer-motion';
import { generateFlowchartData } from '@/lib/flowchartGenerator';
import { cn } from '@/lib/utils';

interface FlowchartProps {
  steps: ExecutionStep[];
  currentStep: number;
}

// Custom Node component for premium aesthetics
const CodeNode = ({ data }: any) => {
  const isDecision = data.type === 'decision';
  const isIO = data.type === 'io';

  return (
    <motion.div 
      initial={false}
      animate={{ 
        scale: data.isActive ? 1.05 : 1,
        borderColor: data.isActive ? '#f97316' : 'rgba(255, 255, 255, 0.05)'
      }}
      className={cn(
        "px-5 py-3 rounded-2xl border bg-[#0d0d10] shadow-2xl transition-all duration-500 min-w-[180px] relative",
        data.isActive ? "ring-4 ring-orange-500/10 shadow-orange-500/20" : "",
        isDecision ? "rounded-none rotate-45" : "", // Diamond-ish for decision
        isIO ? "skew-x-12" : "" // Parallelogram-ish for I/O
      )}
    >
      {/* Handles */}
      <Handle type="target" position={Position.Top} className="!bg-gray-800 !w-2 !h-2 !border-0" />
      
      <div className={cn(
        "flex flex-col gap-1.5",
        isDecision ? "-rotate-45" : "",
        isIO ? "-skew-x-12" : ""
      )}>
        <div className="flex items-center justify-between">
          <div className="text-[7px] font-black uppercase tracking-[0.2em] text-gray-600">
            {data.type || 'Instruction'}
          </div>
          {data.isActive && (
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
          )}
        </div>
        
        <div className={cn(
          "text-[10px] font-mono font-medium truncate max-w-[140px]",
          data.isActive ? "text-orange-400" : "text-gray-300"
        )}>
          {data.label}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-gray-800 !w-2 !h-2 !border-0" />
      
      {data.isActive && (
        <motion.div 
          layoutId="node-glow"
          className="absolute inset-0 bg-orange-500/5 rounded-2xl blur-xl -z-10"
        />
      )}
    </motion.div>
  );
};

const nodeTypes = {
  custom: CodeNode,
};

export default function Flowchart({ steps, currentStep }: FlowchartProps) {
  const currentLine = steps[currentStep]?.lineNumber;
  
  // Re-generate flow data from current steps if available, or full code
  // For this implementation, we'll use the steps to identify current line
  const { nodes, edges } = useMemo(() => {
    // We'll use the first step's code if possible, but VisualizerPanel only passes steps.
    // So we'll heuristic-ally build from steps line numbers.
    return generateFlowchartData(steps.map(s => s.lineContent).join('\n'), currentLine);
  }, [steps, currentLine]);

  return (
    <div className="h-full bg-[#050507] relative group overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
      >
        <Background color="#1e293b" gap={25} size={1} />
        <Controls className="bg-[#0d0d10] border-white/5 fill-gray-500 rounded-xl" />
        <MiniMap 
          nodeColor={(n) => (n.data as any).isActive ? '#f97316' : '#1e293b'}
          maskColor="rgba(0, 0, 0, 0.5)"
          className="bg-[#0d0d10] border-white/5 rounded-2xl"
          style={{ width: 120, height: 120 }}
        />
      </ReactFlow>

      {/* Interaction Help Overlay */}
      <div className="absolute bottom-6 left-6 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-500">
        <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
          <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Topology Visualization Sync</span>
        </div>
      </div>
    </div>
  );
}
