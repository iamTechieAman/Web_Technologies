import type { FlowChartNode, FlowChartEdge, ExecutionStep } from '@/types';

/**
 * Universal Heuristic-based Control Flow Graph (CFG) Generator.
 * Improved for multiple languages and better visual structure.
 */
export function generateFlowChart(code: string): { nodes: FlowChartNode[]; edges: FlowChartEdge[] } {
  const lines = code.split('\n');
  const nodes: FlowChartNode[] = [];
  const edges: FlowChartEdge[] = [];
  let nodeId = 0;

  const mkId = () => `n${nodeId++}`;
  const startId = mkId();
  nodes.push({ id: startId, type: 'start', label: 'Start' });

  let currentParents: string[] = [startId];
  const blockStack: { type: string; entryId: string; exitNodes: string[] }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const t = raw.trim();
    if (!t || /^(import |from |#|include|using |package |namespace )/.test(t)) continue;
    if (t.startsWith('//') || t.startsWith('/*') || t === '*/') continue;

    const id = mkId();
    let type: FlowChartNode['type'] = 'statement';
    let label = t;

    // Detect Block Starts (If, For, While)
    if (/^(if |elif |else if|for |while )/.test(t)) {
      type = (t.startsWith('if') || t.startsWith('elif') || t.startsWith('else if')) ? 'condition' : 'loop';
      label = t.replace(/:$/, '').replace(/\{$/, '').trim();
      nodes.push({ id, type, label, lineNumber: i + 1 });
      
      currentParents.forEach(p => edges.push({ id: `e${p}-${id}`, source: p, target: id, animated: false }));
      
      blockStack.push({ type: type === 'condition' ? 'if' : 'loop', entryId: id, exitNodes: [] });
      currentParents = [id];
      continue;
    }

    // Detect Output
    if (/\b(print|console\.log|cout|printf|println|System\.out\.print)/.test(t)) {
      type = 'output';
    }

    // Detect Return
    if (t.startsWith('return')) {
      type = 'return';
    }

    // Detect Block End (Closing brace) - Heuristic
    if (t === '}' || t === 'end' || t === 'fi') {
      const block = blockStack.pop();
      if (block) {
        if (block.type === 'loop') {
          // Add back-edge for loops
          edges.push({ id: `e${currentParents[0]}-${block.entryId}`, source: currentParents[0], target: block.entryId, label: 'back', animated: true });
          currentParents = [block.entryId]; // After loop, parent is the loop header itself (for exit branch)
        } else {
          // Collect exit nodes for if/else
          block.exitNodes.push(...currentParents);
          currentParents = block.exitNodes;
        }
      }
      continue;
    }

    nodes.push({ id, type, label, lineNumber: i + 1 });
    currentParents.forEach(p => edges.push({ id: `e${p}-${id}`, source: p, target: id, animated: false }));
    currentParents = [id];
  }

  const endId = mkId();
  nodes.push({ id: endId, type: 'end', label: 'End' });
  currentParents.forEach(p => edges.push({ id: `e${p}-${endId}`, source: p, target: endId, animated: false }));

  return { nodes, edges };
}

/**
 * Universal Simulation-based Step Trace.
 * Refined for real-time visualization.
 */
export function generateSteps(code: string): ExecutionStep[] {
  const lines = code.split('\n');
  const steps: ExecutionStep[] = [];
  const variables: Record<string, any> = {};
  let stdout = '';
  let stepIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const t = raw.trim();

    if (!t || /^(import |from |#|include|using |package |namespace |static |public |class )/.test(t)) continue;
    if (t === '{' || t === '}') continue;

    let event: ExecutionStep['event'] = 'statement';
    let explanation = '';

    // Assignment Heuristic
    const assignMatch = t.match(/^(?:(?:let |const |var |int |float |double |string |auto |val |mut )?)\s*(\w+)\s*=\s*(.+?)(?:;?)$/);
    if (assignMatch && !t.includes('==') && !/^(if|for|while)/.test(t)) {
      const name = assignMatch[1];
      const val = assignMatch[2].trim();
      variables[name] = val;
      explanation = `Set ${name} to ${val}`;
      event = 'assignment';
    } 
    else if (/^(if|elif|else if)/.test(t)) {
      event = 'condition';
      explanation = `Branching check: ${t}`;
    }
    else if (/^(for|while)/.test(t)) {
      event = 'loop_start';
      explanation = `Entering loop: ${t}`;
    }
    else if (/^return/.test(t)) {
      event = 'return';
      explanation = `Returning: ${t.replace('return', '').trim()}`;
    }
    else if (/\b(print|console\.log|printf|cout|println)/.test(t)) {
      event = 'output';
      explanation = `Sending to output...`;
    }

    steps.push({
      stepIndex: stepIndex++,
      lineNumber: i + 1,
      lineContent: t,
      event,
      variables: { ...variables },
      explanation: explanation || `Executing: ${t}`,
      stdout,
    });
  }

  return steps;
}
