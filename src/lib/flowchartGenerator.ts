import { Node, Edge, MarkerType } from 'reactflow';

export interface FlowGraph {
  nodes: Node[];
  edges: Edge[];
}

/**
 * High-Fidelity Flowchart Generator (v2.3)
 * Maps source code logic into a structured control-flow diagram.
 */
export function generateFlowchartData(code: string, currentLine?: number): FlowGraph {
  // Filter out boilerplate and empty lines
  const lines = code.split('\n')
    .map((l, idx) => ({ content: l.trim(), originalIndex: idx + 1 }))
    .filter(l => l.content && !l.content.startsWith('import') && !l.content.startsWith('package') && l.content !== '{' && l.content !== '}');

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  let yOffset = 0;
  const nodeGap = 120;
  const centerX = 250;

  const addNode = (id: string, label: string, type: 'default' | 'decision' | 'io' | 'start' | 'end' | 'loop' | 'terminator', lineNum: number) => {
    const isActive = lineNum === currentLine;
    nodes.push({
      id,
      data: { 
        label: label.length > 50 ? label.substring(0, 47) + '...' : label,
        isActive,
        type,
        lineNum
      },
      position: { x: centerX, y: yOffset },
      type: 'custom',
    });
    yOffset += nodeGap;
  };

  addNode('start', 'START', 'start', -1);
  let prevId = 'start';

  lines.forEach((l, i) => {
    const nodeId = `node-${i}`;
    const content = l.content;
    let type: 'default' | 'decision' | 'io' | 'loop' | 'terminator' = 'default';
    let label = content;

    // Node Classification
    if (content.startsWith('if') || content.startsWith('else if')) {
      type = 'decision';
      label = `Condition: ${content}`;
    } else if (content.startsWith('for') || content.startsWith('while')) {
      type = 'loop';
      label = `Loop: ${content}`;
    } else if (content.includes('print') || content.includes('System.out') || content.includes('console.log') || content.includes('cout') || content.includes('printf')) {
      type = 'io';
      label = `Output: ${content}`;
    } else if (content.includes('Scanner') || content.includes('input(') || content.includes('cin') || content.includes('scanf')) {
      type = 'io';
      label = `Input: ${content}`;
    } else if (content.startsWith('return')) {
      type = 'terminator';
      label = `Return: ${content}`;
    } else if (content.includes('=')) {
      label = `Process: ${content}`;
    }

    addNode(nodeId, label, type, l.originalIndex);

    edges.push({
      id: `e-${prevId}-${nodeId}`,
      source: prevId,
      target: nodeId,
      animated: nodes.find(n => n.id === nodeId)?.data.isActive,
      style: { 
        stroke: nodes.find(n => n.id === nodeId)?.data.isActive ? '#f97316' : '#1e293b',
        strokeWidth: nodes.find(n => n.id === nodeId)?.data.isActive ? 2 : 1
      },
      markerEnd: { 
        type: MarkerType.ArrowClosed, 
        color: nodes.find(n => n.id === nodeId)?.data.isActive ? '#f97316' : '#1e293b' 
      }
    });

    prevId = nodeId;
  });

  addNode('end', 'END', 'end', -2);
  edges.push({
    id: `e-${prevId}-end`,
    source: prevId,
    target: 'end',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#1e293b' }
  });

  return { nodes, edges };
}
