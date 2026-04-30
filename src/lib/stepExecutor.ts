import { ExecutionStep } from '@/types';

/**
 * CodeVisualizer Step Executor v6.0
 * Fully stdin-aware heuristic execution engine.
 * Tracks variables, consumes stdin tokens, classifies events accurately.
 */
export function generateExecutionSteps(code: string, language: string, stdin?: string): ExecutionStep[] {
  const lines = code.split('\n');
  const steps: ExecutionStep[] = [];
  // Deep-clone mutable variable store: name → { value, type }
  const variables: Record<string, { value: any; type: string }> = {};

  // Tokenize stdin: split on whitespace/newlines, filter empties
  const stdinTokens: string[] = (stdin || '').trim().split(/\s+/).filter(Boolean);
  let tokenPtr = 0;

  const callStack: Array<{ functionName: string; params: string }> = [];

  /** Consume one stdin token, returning a typed value. */
  const consumeToken = (expectNumber: boolean): any => {
    if (tokenPtr >= stdinTokens.length) return expectNumber ? 0 : '';
    const raw = stdinTokens[tokenPtr++];
    if (expectNumber) {
      const n = parseFloat(raw);
      return isNaN(n) ? 0 : n;
    }
    return raw;
  };

  /**
   * Determine if an expression represents a stdin read operation,
   * and if so whether it reads a number or string.
   */
  const isStdinRead = (expr: string): false | 'number' | 'string' => {
    const e = expr.trim().toLowerCase();
    // Java Scanner
    if (e.includes('scanner.nextint') || e.includes('scanner.nextlong') ||
        e.includes('scanner.nextdouble') || e.includes('scanner.nextfloat')) return 'number';
    if (e.includes('scanner.next')) return 'string';
    // Python input()
    if (e.match(/^int\s*\(.*input\s*\(/) || e.match(/^float\s*\(.*input\s*\(/)) return 'number';
    if (e.match(/^input\s*\(/)) return 'string';
    // C scanf — handled separately via whole-line detection
    // C++ cin
    if (e.includes('cin >>')) return 'number'; // treat as number by default for cin
    return false;
  };

  /**
   * Evaluate a right-hand-side expression to a concrete value.
   * Respects stdin consumption.
   */
  const evaluateExpr = (expr: string): { value: any; type: string } => {
    const s = expr.trim();

    // Check stdin read patterns first
    const stdinKind = isStdinRead(s);
    if (stdinKind !== false) {
      const val = consumeToken(stdinKind === 'number');
      return { value: val, type: typeof val === 'number' ? 'number' : 'string' };
    }

    // Numeric literal
    if (/^-?\d+(\.\d+)?$/.test(s)) {
      return { value: parseFloat(s), type: 'number' };
    }
    // String literal
    if (/^["'].*["']$/.test(s)) {
      return { value: s.slice(1, -1), type: 'string' };
    }
    // Boolean
    if (s === 'true' || s === 'True') return { value: true, type: 'boolean' };
    if (s === 'false' || s === 'False') return { value: false, type: 'boolean' };
    // Array / list literal
    if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('{') && s.endsWith('}'))) {
      try {
        const normalized = s.replace(/{/g, '[').replace(/}/g, ']');
        const items = JSON.parse(normalized);
        if (Array.isArray(items)) return { value: items, type: 'array' };
      } catch { /* fall through */ }
    }

    // Variable substitution + simple arithmetic
    try {
      let resolved = s;
      const sortedKeys = Object.keys(variables).sort((a, b) => b.length - a.length);
      for (const k of sortedKeys) {
        const v = variables[k].value;
        const rep = typeof v === 'string' ? `"${v}"` : Array.isArray(v) ? JSON.stringify(v) : String(v);
        resolved = resolved.replace(new RegExp(`\\b${k}\\b`, 'g'), rep);
      }
      // Only eval safe numeric/boolean expressions
      if (/^[\d\s+\-*/%().!&|<>="'[\],]+$/.test(resolved)) {
        // eslint-disable-next-line no-eval
        const result = eval(resolved);
        return { value: result, type: Array.isArray(result) ? 'array' : typeof result };
      }
    } catch { /* fall through */ }

    return { value: '<computed>', type: 'object' };
  };

  /** Snapshot of current variable state (deep clone). */
  const snapshot = (): Record<string, { value: any; type: string }> =>
    JSON.parse(JSON.stringify(variables));

  // ──────────────────────────────────────────────────────────────
  // Line-by-line parsing
  // ──────────────────────────────────────────────────────────────
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Skip blanks, comments, braces-only, import/package lines
    if (
      !line ||
      line === '{' || line === '}' || line === '};' ||
      line.startsWith('//') || line.startsWith('#!') ||
      line.startsWith('/*') || line.startsWith('*') ||
      line.startsWith('import ') ||
      line.startsWith('package ') ||
      line.startsWith('using ')
    ) continue;

    // ── Function/method declaration detection ──
    const funcMatch = line.match(
      /(?:public|private|protected|static|async|def|fn|func|function)\s+(?:(?:static|async|void|int|double|float|String|bool|auto)\s+)?([a-zA-Z_]\w*)\s*\(/
    );
    if (funcMatch && funcMatch[1] !== 'main') {
      callStack.push({ functionName: funcMatch[1], params: '...' });
    }

    // Build base step
    const step: ExecutionStep = {
      stepIndex: steps.length,
      lineNumber: i + 1,
      lineContent: rawLine,
      variables: snapshot(),
      explanation: 'Executing statement.',
      stdout: '',
      event: 'statement',
      callStack: JSON.parse(JSON.stringify(callStack)),
    };

    // ─────────────────────────────────────────────────────────────
    // Pattern matching — order matters
    // ─────────────────────────────────────────────────────────────

    // 1. C/C++ scanf — reads directly into variable
    // e.g.: scanf("%d", &n);  or  scanf("%lf", &radius);
    const scanfMatch = line.match(/scanf\s*\(\s*"([^"]+)"\s*,\s*&([a-zA-Z_]\w*)\s*\)/);
    if (scanfMatch) {
      const fmt = scanfMatch[1];
      const varName = scanfMatch[2];
      const isNum = fmt.includes('d') || fmt.includes('f') || fmt.includes('lf') || fmt.includes('i');
      const val = consumeToken(isNum);
      variables[varName] = { value: val, type: isNum ? 'number' : 'string' };
      step.variables = snapshot();
      step.event = 'assignment';
      step.explanation = `<code>scanf</code> reads stdin → <code>${varName}</code> = <strong>${val}</strong>`;
      steps.push(step);
      continue;
    }

    // 2. C++ cin >> var (possibly chained: cin >> a >> b)
    const cinMatch = line.match(/cin\s*((?:>>\s*[a-zA-Z_]\w*\s*)+)/);
    if (cinMatch) {
      const varNames = cinMatch[1].match(/[a-zA-Z_]\w*/g) || [];
      for (const varName of varNames) {
        const val = consumeToken(true);
        variables[varName] = { value: val, type: 'number' };
      }
      step.variables = snapshot();
      step.event = 'assignment';
      step.explanation = `<code>cin</code> reads stdin → ${varNames.map(v => `<code>${v}</code>`).join(', ')} = <strong>${varNames.map(v => variables[v]?.value).join(', ')}</strong>`;
      steps.push(step);
      continue;
    }

    // 3. Assignment with optional type prefix
    // Patterns: `int n = scanner.nextInt();`, `let x = 5`, `x = input()`, `double r = 3.14`
    const assignMatch = line.match(
      /^(?:(?:int|long|double|float|short|byte|char|String|bool|boolean|var|let|const|auto|val)\s+)?([a-zA-Z_]\w*)\s*(?::\s*\w+\s*)?=\s*(.+?)(?:;|\s*$)/
    );
    if (assignMatch) {
      const varName = assignMatch[1];
      const expr = assignMatch[2].trim().replace(/;$/, '');

      // Skip non-variable patterns (e.g. class declarations, ==)
      if (!['if', 'while', 'for', 'return', 'else', 'case', 'switch', 'catch', 'Scanner', 'new', 'class'].includes(varName)) {
        const { value, type } = evaluateExpr(expr);
        variables[varName] = { value, type };
        step.variables = snapshot();
        step.event = 'assignment';
        const displayVal = Array.isArray(value)
          ? `[${value.join(', ')}]`
          : String(value);
        step.explanation = `Variable <code>${varName}</code> assigned <strong>${displayVal}</strong>`;
        steps.push(step);
        continue;
      }
    }

    // 4. Python input() on its own (e.g. `n = int(input())`)
    const pyInputMatch = line.match(/^([a-zA-Z_]\w*)\s*=\s*(int|float|str)?\s*\(?\s*input\s*\([^)]*\)\s*\)?/);
    if (pyInputMatch) {
      const varName = pyInputMatch[1];
      const cast = pyInputMatch[2];
      const val = consumeToken(cast === 'int' || cast === 'float');
      variables[varName] = { value: val, type: typeof val === 'number' ? 'number' : 'string' };
      step.variables = snapshot();
      step.event = 'assignment';
      step.explanation = `<code>input()</code> reads stdin → <code>${varName}</code> = <strong>${val}</strong>`;
      steps.push(step);
      continue;
    }

    // 5. Output statements
    const isOutput =
      line.includes('System.out.print') ||
      line.includes('console.log') ||
      line.includes('print(') ||
      line.startsWith('printf') ||
      line.includes('cout <<') ||
      line.includes('fmt.Print');
    if (isOutput) {
      step.event = 'output';
      // Try to extract what's being printed
      const printContentMatch =
        line.match(/System\.out\.print\w*\s*\((.+)\)/) ||
        line.match(/console\.log\s*\((.+)\)/) ||
        line.match(/print\s*\((.+)\)/) ||
        line.match(/printf\s*\("([^"]+)"/) ||
        line.match(/cout\s*<<\s*(.+)/);
      const what = printContentMatch ? printContentMatch[1].trim().replace(/;$/, '') : '...';
      step.explanation = `Outputs <code>${what}</code> to console.`;
      steps.push(step);
      continue;
    }

    // 6. Conditionals
    if (line.startsWith('if') || line.startsWith('else if') || line.startsWith('elif')) {
      step.event = 'condition';
      const condMatch = line.match(/if\s*\((.+)\)/) || line.match(/if\s+(.+):/);
      step.explanation = `Evaluating condition: <code>${condMatch ? condMatch[1] : line}</code>`;
      steps.push(step);
      continue;
    }

    // 7. Loops
    if (line.startsWith('for') || line.startsWith('while')) {
      step.event = 'loop_start';
      step.explanation = `${line.startsWith('for') ? 'For' : 'While'} loop iteration.`;
      steps.push(step);
      continue;
    }

    // 8. Return
    if (line.startsWith('return')) {
      step.event = 'return';
      const retVal = line.replace(/^return\s*/, '').replace(/;$/, '');
      step.explanation = `Returning <code>${retVal || 'void'}</code> from function.`;
      if (callStack.length > 0) callStack.pop();
      steps.push(step);
      continue;
    }

    // 9. Function calls / other statements
    step.explanation = `Executing: <code>${line.length > 60 ? line.slice(0, 57) + '...' : line}</code>`;
    steps.push(step);

    if (steps.length >= 500) break;
  }

  // Always return at least one step
  if (steps.length === 0) {
    steps.push({
      stepIndex: 0,
      lineNumber: 1,
      lineContent: code.split('\n')[0] || '',
      variables: {},
      explanation: 'Ready. Press Run to execute and visualize your code.',
      stdout: '',
      event: 'statement',
      callStack: [],
    });
  }

  return steps;
}
