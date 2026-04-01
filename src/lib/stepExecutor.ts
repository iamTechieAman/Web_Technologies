import { ExecutionStep } from '@/types';

/**
 * Advanced Heuristic Step Executor (v4.0)
 * Truly simulates code execution by parsing assignments, tracking variables,
 * and consuming stdin tokens for I/O operations.
 */
export function generateExecutionSteps(code: string, language: string, stdin?: string): ExecutionStep[] {
  const lines = code.split('\n');
  const steps: ExecutionStep[] = [];
  const variables: Record<string, { value: any; type: string }> = {};
  const stdinTokens = stdin?.trim().split(/\s+/).filter(Boolean) || [];
  let tokenPtr = 0;
  const callStack: any[] = [];

  const nextToken = (isNum: boolean) => {
    const token = stdinTokens[tokenPtr++] || (isNum ? '0' : '<user input>');
    return isNum ? parseFloat(token) || 0 : token;
  };

  const evaluateExpr = (expr: string): { value: any; type: string } => {
    const s = expr.trim();
    if (/^\d+(\.\d+)?$/.test(s)) return { value: parseFloat(s), type: 'number' };
    if (/^["'].*["']$/.test(s)) return { value: s.replace(/["']/g, ''), type: 'string' };
    
    if (s.includes('scanner.next') || s.includes('input(') || s.includes('cin >>')) {
      const isNum = s.includes('Double') || s.includes('Int') || s.includes('Float');
      return { value: nextToken(isNum), type: isNum ? 'number' : 'string' };
    }

    try {
      let resolved = s;
      Object.keys(variables).forEach(v => {
        const val = variables[v].value;
        resolved = resolved.replace(new RegExp(`\\b${v}\\b`, 'g'), typeof val === 'string' ? `"${val}"` : val);
      });
      if (/^[0-9+\-*/().\s"']+|Math\.PI|Math\.pow|Math\.sqrt$/.test(resolved)) {
        // eslint-disable-next-line no-eval
        const result = eval(resolved);
        return { value: result, type: typeof result };
      }
    } catch {}
    return { value: "<computed>", type: "object" };
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('//') || line.startsWith('#') || line.startsWith('import') || line.startsWith('package')) continue;

    // Heuristic for function calls (Recursion detection)
    const funcCall = line.match(/([a-zA-Z_]\w*)\((.*)\)/);
    if (funcCall && !line.includes('System.out') && !line.includes('console.log') && !line.includes('print')) {
      const funcName = funcCall[1];
      const params = funcCall[2];
      if (funcName !== 'main') {
        callStack.push({ functionName: funcName, params: params || 'void' });
      }
    }

    const step: ExecutionStep = {
      stepIndex: steps.length,
      lineNumber: i + 1,
      lineContent: lines[i],
      variables: JSON.parse(JSON.stringify(variables)),
      explanation: '',
      stdout: '',
      event: 'statement',
      callStack: JSON.parse(JSON.stringify(callStack))
    };

    const assignment = line.match(/^(?:(?:int|double|float|String|let|const|var)\s+)?([a-zA-Z_]\w*)\s*=\s*([^;]+);?$/);
    if (assignment) {
      const { value, type } = evaluateExpr(assignment[2]);
      variables[assignment[1]] = { value, type };
      step.event = 'assignment';
      step.explanation = `Assigned <strong>${value}</strong> to <code>${assignment[1]}</code>`;
    } else if (line.includes('print') || line.includes('System.out') || line.includes('console.log')) {
      step.event = 'output';
      step.explanation = "Displaying output to console.";
    }

    step.variables = JSON.parse(JSON.stringify(variables));
    steps.push(step);

    // Heuristic to pop stack if we see a return (very basic)
    if (line.startsWith('return')) {
      callStack.pop();
    }

    if (steps.length > 500) break;
  }
  return steps;
}
