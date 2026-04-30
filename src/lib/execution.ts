import { SupportedLanguage, ExecutionResult } from '@/types';
import { LANGUAGES } from './utils';
import { preprocessCode } from './preprocessor';

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

  console.log('[lib/piston] ▶ language:', language, '| version:', cfg.pistonVersion);
  console.log('[lib/piston] ▶ stdin:', JSON.stringify(payload.stdin));

  const res = await fetch(PISTON_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Piston returned ${res.status}: ${await res.text()}`);

  const data = await res.json();
  const run = data.run;
  if (!run) throw new Error('Piston returned no run data');

  const stdout = run.stdout || '';
  const stderr = run.stderr || '';

  console.log('[lib/piston] ✓ exit code:', run.code, '| stdout:', stdout.slice(0, 80));

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

  console.log('[lib/judge0] ▶ stdin:', JSON.stringify(payload.stdin));

  const submitRes = await fetch(`${JUDGE0_CE_URL}/submissions?base64_encoded=false&wait=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!submitRes.ok) throw new Error(`Judge0 CE returned ${submitRes.status}`);

  const data = await submitRes.json();
  const stdout = data.stdout || '';
  const stderr = data.stderr || '';
  const compileErr = data.compile_output || '';

  if (data.status?.id >= 6) {
    let error = stderr || compileErr || data.status?.description || 'Execution failed';
    if (isInputStarvedError(error, language)) error = inputRequiredMessage(error);
    return { success: false, error, engine: 'judge0', executionTimeMs: parseFloat(data.time || '0') * 1000 };
  }

  return {
    success: true,
    run: { stdout, stderr, code: data.exit_code ?? null, signal: data.exit_signal ?? null, output: stdout + (stderr ? '\n' + stderr : '') },
    engine: 'judge0',
    executionTimeMs: parseFloat(data.time || '0') * 1000,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────────────────────────────────────────

const LOCAL_BACKEND_URL = 'http://localhost:3001/run-code';

export async function executeCode(
  language: SupportedLanguage,
  code: string,
  stdin?: string,
): Promise<ExecutionResult> {
  // ① Normalise stdin — ALWAYS a non-undefined string
  const normalisedStdin: string = typeof stdin === 'string' ? stdin : '';

  console.log('[lib/executeCode] ▶ language:', language);
  console.log('[lib/executeCode] ▶ stdin (normalised):', JSON.stringify(normalisedStdin));

  // ② Pre-process code (strip package, rename class to Main, inject headers)
  const effectiveCode = preprocessCode(code, language);

  console.log('[lib/executeCode] ▶ effectiveCode (first 150 chars):', effectiveCode.slice(0, 150).replace(/\n/g, '↵'));

  // ③ Try local dev server (optional, fast)
  try {
    const res = await fetch(LOCAL_BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, code: effectiveCode, stdin: normalisedStdin }),
    });
    if (res.ok) {
      const d = await res.json();
      console.log('[lib/executeCode] ✓ local backend responded');
      return {
        success: !d.error,
        run: { stdout: d.output, stderr: d.error, code: d.error ? 1 : 0, signal: null, output: d.output + (d.error ? '\n' + d.error : '') },
        engine: 'local',
        executionTimeMs: parseInt(d.time || '0'),
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
