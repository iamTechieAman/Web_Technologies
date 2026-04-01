import { SupportedLanguage, ExecutionResult } from '@/types';
import { LANGUAGES } from './utils';
import { preprocessCode } from './preprocessor';

const PISTON_URL = 'https://emkc.org/api/v2/piston/execute';
const JUDGE0_CE_URL = 'https://ce.judge0.com';

/** Execute code using Piston API (primary — free, no key). */
async function executeWithPiston(language: SupportedLanguage, code: string, stdin?: string): Promise<ExecutionResult> {
  const cfg = LANGUAGES[language];
  const payload = {
    language: cfg.piston,
    version: cfg.pistonVersion,
    files: [{ name: `Main.${cfg.extension}`, content: code }],
    stdin: stdin || '',
  };

  // console.log('Piston payload stdin:', payload.stdin);

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
    return {
      success: false,
      error: stderr || run.output || 'Execution failed',
      engine: 'piston',
      run: { stdout, stderr, code: run.code, signal: run.signal, output: stderr || stdout },
    };
  }

  return {
    success: true,
    run: { stdout, stderr, code: run.code, signal: run.signal, output: stdout + (stderr ? '\n' + stderr : '') },
    engine: 'piston',
  };
}

/** Execute code using Judge0 Community Edition (fallback). */
async function executeWithJudge0(language: SupportedLanguage, code: string, stdin?: string): Promise<ExecutionResult> {
  const cfg = LANGUAGES[language];
  const payload = {
    language_id: cfg.judge0Id,
    source_code: code,
    stdin: stdin || '',
  };

  // console.log('Judge0 payload stdin:', payload.stdin);

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
    return {
      success: false,
      error: stderr || compileErr || data.status?.description || 'Execution failed',
      engine: 'judge0',
      executionTimeMs: parseFloat(data.time || '0') * 1000,
    };
  }

  return {
    success: true,
    run: { stdout, stderr, code: data.exit_code ?? null, signal: data.exit_signal ?? null, output: stdout + (stderr ? '\n' + stderr : '') },
    engine: 'judge0',
    executionTimeMs: parseFloat(data.time || '0') * 1000,
  };
}

const LOCAL_BACKEND_URL = 'http://localhost:3001/run-code';

/** Execute code with automatic fallback: Local Backend → Piston → Judge0. */
export async function executeCode(language: SupportedLanguage, code: string, stdin?: string): Promise<ExecutionResult> {
  // Pre-processing
  const effectiveCode = preprocessCode(code, language);

  // 1. Try Local Execution Server first
  try {
    const res = await fetch(LOCAL_BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, code: effectiveCode, stdin }),
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
  } catch (localErr) {}

  // 2. Try Piston as primary fallback
  try {
    return await executeWithPiston(language, effectiveCode, stdin);
  } catch (pistonErr) {
    // console.warn('[CodeVisualizer] Piston failed, trying Judge0 CE:', pistonErr);
  }

  // 3. Fallback to Judge0 CE
  try {
    return await executeWithJudge0(language, effectiveCode, stdin);
  } catch (judge0Err) {
    // console.error('[CodeVisualizer] All execution engines failed:', judge0Err);
    return {
      success: false,
      error: 'All execution engines are unavailable. Please ensure you have an internet connection.',
      engine: 'piston',
    };
  }
}
