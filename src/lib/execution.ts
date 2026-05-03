import { SupportedLanguage, ExecutionResult } from '@/types';
import { LANGUAGES } from './utils';
import { preprocessCode } from './preprocessor';
import { safeAsync, safeString } from './safe';

const PISTON_URL = 'https://emkc.org/api/v2/piston/execute';
const JUDGE0_CE_URL = 'https://ce.judge0.com';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Returns true when the error string signals a missing-stdin condition. */
function isInputStarvedError(stderr: string, language: SupportedLanguage): boolean {
  const msg = stderr.toLowerCase();
  if (language === 'java') return msg.includes('nosuchelementexception') || msg.includes('inputmismatchexception');
  if (language === 'python') return msg.includes('eoferror') || msg.includes('end of file');
  if (language === 'c' || language === 'cpp') return msg.includes('segmentation fault') || msg.includes('runtime error');
  return false;
}

/** Friendly message when stdin is missing. */
function inputRequiredMessage(raw: string): string {
  return `⚠️  INPUT REQUIRED\nYour program is waiting for input (e.g. via Scanner, input(), or scanf) but no values were provided.\n\nHow to fix:\n  1. Click the "Stdin" button in the editor toolbar.\n  2. Type the expected input (e.g. "5" or "3.14").\n  3. Press Run again.\n\nOriginal error:\n${raw}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Piston
// ─────────────────────────────────────────────────────────────────────────────

async function executeWithPiston(
  language: SupportedLanguage,
  code: string,
  stdin: string,
): Promise<ExecutionResult> {
  const cfg = LANGUAGES[language];

  const payload = {
    language: cfg.piston,
    version: cfg.pistonVersion,
    files: [{ name: `Main.${cfg.extension}`, content: code }],
    stdin,          // ← always a string, never undefined
  };

  const res = await fetch(PISTON_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Piston returned ${res.status}: ${await res.text()}`);

  const data = await safeAsync<Record<string, any> | null>(() => res.json(), null);
  const run = data?.run;
  if (!run) throw new Error('Piston returned no run data');

  const stdout = run.stdout || '';
  const stderr = run.stderr || '';

  if (run.code !== 0 && run.code !== null) {
    let error = stderr || run.output || 'Execution failed';

    if (isInputStarvedError(error, language)) {
      error = inputRequiredMessage(error);
    } else if (
      (language === 'javascript' || language === 'typescript') &&
      (error.includes('Cannot find module') || error.includes("require is not defined"))
    ) {
      error = 'External modules/packages are not supported. Use standard built-in libraries.';
    }

    return {
      success: false,
      error,
      engine: 'piston',
      run: { stdout, stderr, code: run.code, signal: run.signal, output: error },
    };
  }

  return {
    success: true,
    run: { stdout, stderr, code: run.code, signal: run.signal, output: stdout + (stderr ? '\n' + stderr : '') },
    engine: 'piston',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Judge0
// ─────────────────────────────────────────────────────────────────────────────

async function executeWithJudge0(
  language: SupportedLanguage,
  code: string,
  stdin: string,
): Promise<ExecutionResult> {
  const cfg = LANGUAGES[language];

  const payload = {
    language_id: cfg.judge0Id,
    source_code: code,
    stdin,          // ← always a string
  };

  const submitRes = await fetch(`${JUDGE0_CE_URL}/submissions?base64_encoded=false&wait=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!submitRes.ok) throw new Error(`Judge0 CE returned ${submitRes.status}`);

  const data = await safeAsync<Record<string, any> | null>(() => submitRes.json(), null);
  const stdout = safeString(data?.stdout);
  const stderr = safeString(data?.stderr);
  const compileErr = safeString(data?.compile_output);

  if ((data?.status?.id ?? 0) >= 6) {
    let error = stderr || compileErr || safeString(data?.status?.description, 'Execution failed');
    if (isInputStarvedError(error, language)) error = inputRequiredMessage(error);
    return { success: false, error, engine: 'judge0', executionTimeMs: parseFloat(safeString(data?.time, '0')) * 1000 };
  }

  return {
    success: true,
    run: { stdout, stderr, code: data?.exit_code ?? null, signal: data?.exit_signal ?? null, output: stdout + (stderr ? '\n' + stderr : '') },
    engine: 'judge0',
    executionTimeMs: parseFloat(safeString(data?.time, '0')) * 1000,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────────────────────────────────────────

const LOCAL_BACKEND_URL = 'http://localhost:5001/run-code';
const NON_EXECUTABLE_LANGUAGES = new Set<SupportedLanguage>([
  'html',
  'css',
  'json',
  'xml',
  'yaml',
  'markdown',
  'dockerfile',
  'nginx',
  'vue',
  'svelte',
  'terraform',
  'kubernetes',
]);

export async function executeCode(
  language: SupportedLanguage,
  code: string,
  stdin?: string,
): Promise<ExecutionResult> {
  // ① Normalise stdin — ALWAYS a non-undefined string
  const normalisedStdin: string = typeof stdin === 'string' ? stdin : '';

  // ② Pre-process code (strip package, rename class to Main, inject headers)
  const effectiveCode = preprocessCode(code, language);

  if (NON_EXECUTABLE_LANGUAGES.has(language)) {
    return {
      success: true,
      engine: 'local',
      run: {
        stdout: `${language.toUpperCase()} files are preview/analyze files in CodeVisualizer. Use Live Preview or the AI tools for this file type.`,
        stderr: '',
        code: 0,
        signal: null,
        output: `${language.toUpperCase()} preview/analyze mode: no remote runtime is required.`,
      },
    };
  }

  // ③ Try local dev server (optional, fast)
  try {
    const res = await fetch(LOCAL_BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, code: effectiveCode, stdin: normalisedStdin }),
    });
    if (res.ok) {
      const d = await safeAsync<Record<string, any> | null>(() => res.json(), null);
      return {
        success: !d?.error,
        run: {
          stdout: safeString(d?.output),
          stderr: safeString(d?.error),
          code: d?.error ? 1 : 0,
          signal: null,
          output: safeString(d?.output) + (d?.error ? '\n' + safeString(d?.error) : ''),
        },
        engine: 'local',
        executionTimeMs: parseInt(safeString(d?.time, '0')),
      };
    }
  } catch { /* no local server — fall through */ }

  // ④ Piston (primary cloud engine)
  try {
    return await executeWithPiston(language, effectiveCode, normalisedStdin);
  } catch (pistonErr) {
    console.warn('[lib/executeCode] ✗ Piston failed:', pistonErr);
  }

  // ⑤ Judge0 CE (fallback)
  try {
    return await executeWithJudge0(language, effectiveCode, normalisedStdin);
  } catch (judge0Err) {
    console.error('[lib/executeCode] ✗ All engines failed:', judge0Err);
    return { success: false, error: 'All execution engines are unavailable. Check your internet connection.', engine: 'piston' };
  }
}
