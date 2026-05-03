import {
  BarChart3,
  BookOpen,
  Boxes,
  Cpu,
  FileText,
  GitGraph,
  Network,
  Wand2,
  Workflow,
} from 'lucide-react';

export type AIToolMode =
  | 'explain'
  | 'simplify'
  | 'code-visualizer'
  | 'logic-visualizer'
  | 'documentation'
  | 'dependency-resolver'
  | 'complexity'
  | 'data-structure'
  | 'big-o';

export const AI_TOOLS = [
  { id: 'explain', name: 'Code Explainer', icon: BookOpen, mode: 'explain' as const, prompt: 'Explain this code clearly, including the flow, variables, functions, edge cases, and output.' },
  { id: 'simplify', name: 'Code Simplifier', icon: Wand2, mode: 'simplify' as const, prompt: 'Simplify this code without changing its behavior. Keep the same input/output behavior.' },
  { id: 'code-visualizer', name: 'Code Visualizer', icon: GitGraph, mode: 'code-visualizer' as const, prompt: 'Visualize this code as execution state: functions, variables, memory, arrays, calls, and outputs.' },
  { id: 'logic-visualizer', name: 'Logic Visualizer', icon: Workflow, mode: 'logic-visualizer' as const, prompt: 'Visualize the logic of this program as branches, loops, conditions, and state transitions.' },
  { id: 'documentation', name: 'Documentation Generator', icon: FileText, mode: 'documentation' as const, prompt: 'Generate documentation for this code, including purpose, inputs, outputs, usage, edge cases, and complexity.' },
  { id: 'dependency-resolver', name: 'Dependency Resolver', icon: Network, mode: 'dependency-resolver' as const, prompt: 'Analyze imports and dependencies. Identify missing packages, runtime requirements, and safer standard-library alternatives.' },
  { id: 'complexity', name: 'Complexity Estimator', icon: BarChart3, mode: 'complexity' as const, prompt: 'Estimate time and space complexity for this code and explain the reasoning.' },
  { id: 'data-structure', name: 'Data Structure Designer', icon: Boxes, mode: 'data-structure' as const, prompt: 'Recommend the best data structures for this code or problem and explain the tradeoffs.' },
  { id: 'big-o', name: 'AI Big-O Analyzer', icon: Cpu, mode: 'big-o' as const, prompt: 'Analyze the Big-O time and space complexity carefully and state assumptions.' },
] as const;
