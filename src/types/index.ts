export type Theme = 'light' | 'dark';
export type Difficulty = 'Beginner' | 'Easy' | 'Medium' | 'Hard' | 'Expert';

export type SupportedLanguage =
  | 'python'
  | 'javascript'
  | 'typescript'
  | 'cpp'
  | 'c'
  | 'java'
  | 'rust'
  | 'go'
  | 'csharp'
  | 'ruby'
  | 'php'
  | 'swift'
  | 'kotlin';

export interface LanguageConfig {
  id: string;
  name: string;
  monaco: string;
  piston: string;
  pistonVersion: string;
  judge0Id: number;
  extension: string;
  defaultCode: string;
}

export interface TestCase {
  id: string;
  input: string;
  expected: string;
}

export interface Problem {
  id: string;
  slug: string;
  title: string;
  description?: string;
  descriptionHtml?: string;
  difficulty: Difficulty;
  tags: string[];
  companies?: string[];
  timeComplexity?: string;
  spaceComplexity?: string;
  approachSteps?: string[];
  solutionCode?: Partial<Record<SupportedLanguage, string>>;
  testCases?: TestCase[];
  exampleTestcases?: string | TestCase[];
  leetcodeUrl?: string;
  gfgUrl?: string;
  hints?: string[];
  source?: string;
  constraints?: string[];
  starterCode?: Partial<Record<SupportedLanguage, string>>;
}

export interface ExecutionStep {
  stepIndex: number;
  lineNumber: number;
  lineContent: string;
  event: 'statement' | 'assignment' | 'condition' | 'loop_start' | 'call' | 'return' | 'output';
  variables: Record<string, any>;
  explanation: string;
  stdout: string;
  // Visualizer structural data
  arraySnapshot?: any[];
  accessedIndices?: number[];
  updatedIndices?: number[];
  currentNode?: string;
  visitedNodes?: string[];
  callStack?: any[];
}

export interface ExecutionResult {
  success: boolean;
  run?: {
    stdout: string;
    stderr: string;
    code: number | null;
    signal: string | null;
    output: string;
  };
  error?: string;
  engine: 'piston' | 'judge0' | 'local';
  executionTimeMs?: number;
  memoryUsageBytes?: number;
  metadata?: {
    memoryLimit?: number | string;
    timeLimit?: string;
    token?: string;
    containerId?: string;
    timestamp?: string;
  };
}

export interface FlowChartNode {
  id: string;
  type: 'start' | 'end' | 'condition' | 'statement' | 'loop' | 'function' | 'return' | 'output' | 'action';
  label: string;
  lineNumber?: number;
}

export interface FlowChartEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
}

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  language?: SupportedLanguage;
  content?: string;
  children?: FileNode[];
  parentId?: string;
}

export interface ComplexityResult {
  time: string;
  space: string;
  reasoning: string;
  properties: string[];
}
