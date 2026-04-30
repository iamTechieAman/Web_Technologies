/**
 * CodeVisualizer Error Interpreter
 * Translates raw compiler/runtime errors into clean, human-friendly messages.
 */

export interface FriendlyError {
  title: string;           // short error category
  message: string;         // human-readable explanation
  fix: string;             // actionable suggestion
  line?: number;           // line number if detected
  isInputError: boolean;   // whether it's a missing-stdin error
  raw: string;             // original error text (for collapsible panel)
}

// ── Regex helpers ─────────────────────────────────────────────────────────────

const JAVA_INPUT_ERRORS = /NoSuchElementException|InputMismatchException/i;
const PYTHON_INPUT_ERRORS = /EOFError|end of file/i;
const C_INPUT_ERRORS = /Segmentation fault|signal 11/i;
const TIMEOUT_ERRORS = /Time Limit|TLE|Killed|timeout/i;
const OOM_ERRORS = /Out of memory|MemoryError|memory limit/i;
const MODULE_ERRORS = /Cannot find module|ModuleNotFoundError|ImportError|require is not defined/i;
const STACK_OVERFLOW = /StackOverflowError|RecursionError|stack overflow/i;
const CLASS_NOT_FOUND = /NoClassDefFoundError|ClassNotFoundException/i;
const WRONG_CLASS = /wrong name|public class.*should be in a file/i;

// ── Language-specific line extractors ─────────────────────────────────────────

function extractLine(raw: string, language: string): number | undefined {
  let m: RegExpMatchArray | null;
  switch (language) {
    case 'java':
      m = raw.match(/Main\.java:(\d+)/);
      if (!m) m = raw.match(/\.java:(\d+)/);
      break;
    case 'python':
      m = raw.match(/line (\d+)/);
      break;
    case 'c':
    case 'cpp':
      m = raw.match(/:(\d+):\d+: error/);
      break;
    case 'javascript':
    case 'typescript':
      m = raw.match(/:(\d+):\d+/);
      break;
    case 'go':
      m = raw.match(/go:(\d+)/);
      break;
    case 'rust':
      m = raw.match(/rs:(\d+)/);
      break;
    default:
      m = raw.match(/line (\d+)/i);
  }
  return m ? parseInt(m[1], 10) : undefined;
}

// ── Main interpreter ──────────────────────────────────────────────────────────

export function interpretError(raw: string, language: string): FriendlyError {
  const base: FriendlyError = {
    title: 'Execution Error',
    message: 'An error occurred while running your code.',
    fix: 'Check your code for mistakes and try again.',
    isInputError: false,
    raw,
    line: extractLine(raw, language),
  };

  if (!raw || raw.trim() === '') return base;

  // ── Input errors (highest priority — most common) ─────────────────────────
  if (JAVA_INPUT_ERRORS.test(raw)) {
    return {
      ...base,
      title: '⌨️  Input Required',
      message: 'Your program is waiting for input but none (or not enough) was provided.',
      fix: 'Click the "Stdin" button in the editor, type your input values (one per line), then press Run again.',
      isInputError: true,
    };
  }
  if (PYTHON_INPUT_ERRORS.test(raw)) {
    return {
      ...base,
      title: '⌨️  Input Required',
      message: 'Your program called input() but stdin was empty.',
      fix: 'Type the expected value(s) in the Stdin box, then press Run.',
      isInputError: true,
    };
  }
  if (language === 'c' || language === 'cpp') {
    if (C_INPUT_ERRORS.test(raw) && raw.includes('scanf')) {
      return {
        ...base,
        title: '⌨️  Input Required',
        message: 'Your program crashed — likely because scanf/cin did not receive any input.',
        fix: 'Type the expected values in the Stdin box, then press Run.',
        isInputError: true,
      };
    }
  }

  // ── Timeout ───────────────────────────────────────────────────────────────
  if (TIMEOUT_ERRORS.test(raw)) {
    return {
      ...base,
      title: '⏱  Time Limit Exceeded',
      message: 'Your program took too long to finish (> 5 seconds). It may contain an infinite loop.',
      fix: 'Check your loop conditions. Make sure every loop has a valid exit condition.',
    };
  }

  // ── Out of memory ─────────────────────────────────────────────────────────
  if (OOM_ERRORS.test(raw)) {
    return {
      ...base,
      title: '💾  Memory Limit Exceeded',
      message: 'Your program used too much memory.',
      fix: 'Check for unintended infinite recursion or very large data structures.',
    };
  }

  // ── Stack overflow ────────────────────────────────────────────────────────
  if (STACK_OVERFLOW.test(raw)) {
    return {
      ...base,
      title: '🔁  Stack Overflow',
      message: 'Your program called itself recursively too many times.',
      fix: 'Ensure your recursive function has a valid base case that stops the recursion.',
    };
  }

  // ── Module / import errors ────────────────────────────────────────────────
  if (MODULE_ERRORS.test(raw)) {
    return {
      ...base,
      title: '📦  Module Not Found',
      message: 'Your code imports an external library that is not available in the sandbox.',
      fix: 'Use only built-in standard library modules. External packages (npm, pip) are not supported in the online runner.',
    };
  }

  // ── Java class naming ─────────────────────────────────────────────────────
  if (CLASS_NOT_FOUND.test(raw) || WRONG_CLASS.test(raw)) {
    return {
      ...base,
      title: '☕  Class Name Mismatch',
      message: 'Java requires the public class name to match the file name. CodeVisualizer expects "public class Main".',
      fix: 'Rename your class to "Main" or remove the package declaration.',
    };
  }

  // ── Language-specific compilation errors ─────────────────────────────────
  const compilationMatch =
    raw.match(/error: (.+)/i) ||
    raw.match(/Error: (.+)/i) ||
    raw.match(/SyntaxError: (.+)/i) ||
    raw.match(/TypeError: (.+)/i) ||
    raw.match(/ReferenceError: (.+)/i) ||
    raw.match(/ValueError: (.+)/i) ||
    raw.match(/NameError: (.+)/i);

  if (compilationMatch) {
    const errorMsg = compilationMatch[1].trim();
    const type = compilationMatch[0].split(':')[0].trim();

    return {
      ...base,
      title: `🔴  ${type}`,
      message: errorMsg.length > 120 ? errorMsg.slice(0, 117) + '…' : errorMsg,
      fix: base.line
        ? `Fix the issue at line ${base.line}. Check for typos, missing brackets, or wrong variable names.`
        : 'Check your code for syntax errors, typos, or undefined variables.',
    };
  }

  // ── Fallback ──────────────────────────────────────────────────────────────
  const firstLine = raw.split('\n').find(l => l.trim()) ?? raw;
  return {
    ...base,
    title: 'Runtime Error',
    message: firstLine.length > 150 ? firstLine.slice(0, 147) + '…' : firstLine,
    fix: 'Review your code logic. If the error persists, ask the AI Mentor for help.',
  };
}
