import { SupportedLanguage, ExecutionResult } from '@/types';
import { LANGUAGES } from './utils';
import { preprocessCode } from './preprocessor';

const PISTON_URL = 'https://emkc.org/api/v2/piston/execute';
const JUDGE0_CE_URL = 'https://ce.judge0.com';

/**
 * Execute code using Piston API (primary — free, no key).
 * stdin is always included in the payload, even if empty string.
 */
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
    stdin,                  // ← always present
  };

  // console.log('[lib/piston] payload.stdin:', JSON.stringify(payload.stdin));
  // console.log('[lib/piston] language:', language, 'version:', cfg.pistonVersion);

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

  if (run.code !== 0 && run.code !== null) {
    let error = stderr || run.output || 'Execution failed';

    // Friendly error for missing stdin
    if (
      (language === 'java' && (error.includes('NoSuchElementException') || error.includes('InputMismatchException'))) ||
      (language === 'python' && error.includes('EOFError')) ||
      (language === 'c' && error.includes('Segmentation fault')) ||
      (language === 'cpp' && error.includes('Segmentation fault'))
    ) {
      error = `⚠️ Input Required: Your program is waiting for input but none was provided (or not enough tokens). Please enter values in the "Input (stdin)" box and run again.\n\nOriginal error:\n${stderr}`;
    }

    // Friendly error for external modules
    if (
      (language === 'javascript' || language === 'typescript') &&
      (error.includes('Cannot find module') || error.includes("require is not defined"))
    ) {
      error = "External modules/packages are not supported in the online visualizer. Use standard built-in libraries or run locally.";
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
    run: {
      stdout,
      stderr,
      code: run.code,
      signal: run.signal,
      output: stdout + (stderr ? '\n' + stderr : ''),
    },
    engine: 'piston',
  };
}

/**
 * Execute code using Judge0 Community Edition (fallback).
 * stdin is always included.
 */
async function executeWithJudge0(
  language: SupportedLanguage,
  code: string,
  stdin: string,
): Promise<ExecutionResult> {
  const cfg = LANGUAGES[language];

  const payload = {
    language_id: cfg.judge0Id,
    source_code: code,
    stdin,                  // ← always present
  };

  // console.log('[lib/judge0] payload.stdin:', JSON.stringify(payload.stdin));

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

    if (
      (language === 'javascript' || language === 'typescript') &&
      (error.includes('Cannot find module') || error.includes("require is not defined"))
    ) {
      error = "External modules/packages are not supported in the online visualizer. Use standard built-in libraries or run locally.";
    }

    return {
      success: false,
      error,
      engine: 'judge0',
      executionTimeMs: parseFloat(data.time || '0') * 1000,
    };
  }

  return {
    success: true,
    run: {
      stdout,
      stderr,
      code: data.exit_code ?? null,
      signal: data.exit_signal ?? null,
      output: stdout + (stderr ? '\n' + stderr : ''),
    },
    engine: 'judge0',
    executionTimeMs: parseFloat(data.time || '0') * 1000,
  };
}

const LOCAL_BACKEND_URL = 'http://localhost:3001/run-code';

/**
 * Execute code with automatic fallback: Local Backend → Piston → Judge0.
 * stdin is normalised to empty string (never undefined) before passing down.
 */
export async function executeCode(
  language: SupportedLanguage,
  code: string,
  stdin?: string,
): Promise<ExecutionResult> {
  // Normalise stdin — never let it be undefined so every engine always gets a string
  const normalisedStdin = (stdin ?? '').trimEnd();

  // console.log('[lib/executeCode] language:', language);
  // console.log('[lib/executeCode] stdin:', JSON.stringify(normalisedStdin));

  // Pre-process: remove package declarations, rename class to Main, inject headers, etc.
  const effectiveCode = preprocessCode(code, language);

  // console.log('[lib/executeCode] effectiveCode (first 200 chars):', effectiveCode.slice(0, 200));

  // 1. Try Local Execution Server (optional, for development)
  try {
    const res = await fetch(LOCAL_BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, code: effectiveCode, stdin: normalisedStdin }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: !data.error || data.output !== '',
        run: {
          stdout: data.output,
          stderr: data.error,
          code: data.error ? 1 : 0,
          signal: null,
          output: data.output + (data.error ? '\n' + data.error : ''),
        },
        engine: 'local',
        executionTimeMs: parseInt(data.time || '0'),
      };
    }
  } catch (_localErr) {
    // Local server not running — silent fall-through to Piston
  }

  // 2. Try Piston as primary cloud engine
  try {
    return await executeWithPiston(language, effectiveCode, normalisedStdin);
  } catch (pistonErr) {
    // console.warn('[lib] Piston failed, falling back to Judge0:', pistonErr);
  }

  // 3. Fallback to Judge0 CE
  try {
    return await executeWithJudge0(language, effectiveCode, normalisedStdin);
  } catch (judge0Err) {
    // console.error('[lib] All execution engines failed:', judge0Err);
    return {
      success: false,
      error: 'All execution engines are unavailable. Please check your internet connection.',
      engine: 'piston',
    };
  }
}
