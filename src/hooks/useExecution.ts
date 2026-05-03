'use client';
import { useState, useCallback } from 'react';
import { generateExecutionSteps } from '@/lib/stepExecutor';
import { preprocessCode } from '@/lib/preprocessor';
import type { SupportedLanguage, ExecutionResult, ExecutionStep } from '@/types';
import { safeAsync, safeString } from '@/lib/safe';

export function useExecution(): {
  run: (code: string, language: SupportedLanguage, stdin?: string) => Promise<ExecutionResult>;
  result: ExecutionResult | null;
  setResult: React.Dispatch<React.SetStateAction<ExecutionResult | null>>;
  steps: ExecutionStep[];
  loading: boolean;
  error: string | null;
  reset: () => void;
} {
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (
      code: string,
      language: SupportedLanguage,
      stdin?: string,
    ): Promise<ExecutionResult> => {
      setLoading(true);
      setError(null);
      setResult(null);

      // Normalise stdin — never undefined, trimEnd to remove trailing newlines
      const normalisedStdin = typeof stdin === 'string' ? stdin.trimEnd() : '';

      // Yield to the browser so the UI can update the loading state before synchronous heavy work
      await new Promise(resolve => setTimeout(resolve, 10));

      // 1. Generate visual steps synchronously from preprocessed code
      const effectiveCode = preprocessCode(code, language);
      const visualSteps = generateExecutionSteps(effectiveCode, language, normalisedStdin);
      setSteps(visualSteps);

      try {
        const payload = { language, code, stdin: normalisedStdin };

        const res = await fetch(`${window.location.origin}/api/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error(`Execution service returned ${res.status}: ${res.statusText}`);
        }

        const data = await safeAsync<ExecutionResult | null>(() => res.json(), null);
        const safeData: ExecutionResult = data ?? {
          success: false,
          error: 'Invalid execution response',
          engine: 'piston',
        };
        setResult(safeData);

        if (!safeData.success) {
          setError(safeData.error || 'Execution failed');
        }

        setLoading(false);
        return safeData;
      } catch (err: unknown) {
        // eslint-disable-next-line no-console
        console.error('[hook/useExecution] ✗ Fetch error:', err);
        const fallback: ExecutionResult = {
          success: false,
          error: safeString(err instanceof Error ? err.message : String(err), 'Network error during execution'),
          engine: 'piston',
        };
        setResult(fallback);
        setError(fallback.error ?? null);
        setLoading(false);
        return fallback;
      }
    },
    [],
  );

  const reset = useCallback((): void => {
    setResult(null);
    setSteps([]);
    setError(null);
  }, []);

  return { run, result, setResult, steps, loading, error, reset };
}
