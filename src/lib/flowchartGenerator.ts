import { Node, Edge, MarkerType } from 'reactflow';

export interface FlowGraph {
  nodes: Node[];
  edges: Edge[];
}

/**
 * CodeVisualizer Flowchart Generator v4.0
 * Produces a rich, labelled control-flow graph from source code.
 * Highlights the currently executing node.
 */
export function generateFlowchartData(code: string, currentLine?: number): FlowGraph {
  const allLines = code.split('\n');

  // Filter boilerplate but keep meaningful content
  const filteredLines = allLines
    .map((content, idx) => ({ content: content.trim(), originalLine: idx + 1 }))
    .filter(({ content }) => {
      if (!content) return false;
      if (content === '{' || content === '}' || content === '};') return false;
      if (content.startsWith('//') || content.startsWith('/*') || content.startsWith('*')) return false;
      if (content.startsWith('import ') || content.startsWith('package ') || content.startsWith('using ')) return false;
      if (/^(?:public\s+)?class\s+\w+\s*\{?$/.test(content)) return false;
      if (/^(?:public\s+)?static\s+void\s+main\s*\(/.test(content)) return false;
      return true;
    });

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  let yOffset = 0;
  const NODE_GAP = 90;
  const CENTER_X = 220;

  /** Check if a line is the currently active one. */
  const isActive = (lineNum: number) => lineNum === currentLine;

  /** Create a flowchart node. */
  const makeNode = (
    id: string,
    label: string,
    type: string,
    lineNum: number,
    xOverride?: number,
  ): Node => {
    const active = isActive(lineNum);
    const node: Node = {
      id,
      data: {
        label: label.length > 50 ? label.slice(0, 47) + '…' : label,
        isActive: active,
        type,
        lineNum,
      },
      position: { x: xOverride ?? CENTER_X, y: yOffset },
      type: 'custom',
    };
    yOffset += NODE_GAP;
    return node;
  };

  /** Create an edge between two nodes. */
  const makeEdge = (
    source: string,
    target: string,
    label?: string,
    highlighted = false,
  ): Edge => ({
    id: `e-${source}-${target}`,
    source,
    target,
    label,
    animated: highlighted,
    style: {
      stroke: highlighted ? '#f97316' : '#334155',
      strokeWidth: highlighted ? 2.5 : 1.5,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: highlighted ? '#f97316' : '#475569',
    },
    labelStyle: { fill: '#94a3b8', fontSize: 9, fontWeight: 700 },
    labelBgStyle: { fill: '#0f172a', fillOpacity: 0.8 },
  });

  // ── START node ──────────────────────────────────────────────
  const startNode = makeNode('start', 'START', 'start', -1);
  nodes.push(startNode);
  let prevId = 'start';

  // ── Process each meaningful line ─────────────────────────────
  filteredLines.forEach((l, i) => {
    const id = `node-${i}`;
    const { content, originalLine } = l;
    const active = isActive(originalLine);
    let type = 'process';
    let label = content;

    if (content.startsWith('if') || content.startsWith('else if') || content.startsWith('elif')) {
      type = 'decision';
      const cond = content.match(/\((.+)\)/)?.[1] || content.replace(/^(elif|else if|if)\s*/, '').replace(/:$/, '');
      label = `IF  ${cond.length > 40 ? cond.slice(0, 37) + '…' : cond}`;
    } else if (content.startsWith('else') || content.startsWith('default')) {
      type = 'decision';
      label = 'ELSE';
    } else if (content.startsWith('for') || content.startsWith('while') || content.startsWith('do')) {
      type = 'loop';
      const inner = content.replace(/^(for|while|do)\s*/, '');
      label = `LOOP  ${inner.length > 35 ? inner.slice(0, 32) + '…' : inner}`;
    } else if (
      content.includes('System.out.print') ||
      content.includes('console.log') ||
      content.includes('cout <<') ||
      content.includes('printf') ||
      content.startsWith('print(')
    ) {
      type = 'output';
      const inner =
        content.match(/System\.out\.print\w*\((.+)\)/)?.[1] ||
        content.match(/console\.log\((.+)\)/)?.[1] ||
        content.match(/cout\s*<<\s*(.+)/)?.[1] ||
        content.match(/printf\("([^"]+)"/)?.[1] ||
        content.match(/print\((.+)\)/)?.[1] ||
        '…';
      label = `PRINT  ${inner.length > 40 ? inner.slice(0, 37) + '…' : inner}`;
    } else if (
      content.includes('scanner.next') ||
      content.includes('input(') ||
      content.includes('cin >>') ||
      content.includes('scanf')
    ) {
      type = 'input';
      label = 'READ  stdin';
    } else if (content.startsWith('return')) {
      type = 'return';
      label = `RETURN  ${content.replace(/^return\s*/, '').replace(/;$/, '')}`;
    } else {
      // Generic: show truncated statement
      label = content.replace(/;$/, '');
    }

    const node = makeNode(id, label, type, originalLine);
    nodes.push(node);

    const edge = makeEdge(prevId, id, undefined, active);
    edges.push(edge);

    // For IF/ELSE branch nodes, add a visual Y-branch hint
    if (type === 'decision') {
      // Placeholder: the "true" path continues downward (prevId → id already added above)
      // The "false" path label is shown on the straight edge
      const lastEdge = edges[edges.length - 1];
      lastEdge.label = 'true';
    }

    prevId = id;
  });

  // ── END node ────────────────────────────────────────────────
  const endNode = makeNode('end', 'END', 'end', -2);
  nodes.push(endNode);
  edges.push(makeEdge(prevId, 'end'));

  return { nodes, edges };
}
