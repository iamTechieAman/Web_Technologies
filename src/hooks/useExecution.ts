'use client';
import { useState, useCallback } from 'react';
import { generateExecutionSteps } from '@/lib/stepExecutor';
import { preprocessCode } from '@/lib/preprocessor';
import type { SupportedLanguage, ExecutionResult, ExecutionStep } from '@/types';

export function useExecution() {
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

      // Normalise stdin early — empty string, never undefined
      const normalisedStdin = (stdin ?? '').trimEnd();

      // console.log('[hook/useExecution] language:', language);
      // console.log('[hook/useExecution] stdin being sent:', JSON.stringify(normalisedStdin));

      // 1. Generate visual steps from preprocessed code (synchronous, client-side)
      const effectiveCode = preprocessCode(code, language);
      const visualSteps = generateExecutionSteps(effectiveCode, language, normalisedStdin);
      setSteps(visualSteps);

      try {
        const res = await fetch('/api/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Send original code — API route/execution.ts handles preprocessing
          body: JSON.stringify({ language, code, stdin: normalisedStdin }),
        });

        if (!res.ok) {
          throw new Error(`Execution service returned ${res.status}: ${res.statusText}`);
        }

        const data: ExecutionResult = await res.json();
        setResult(data);

        if (!data.success) {
          setError(data.error || 'Execution failed');
        }

        setLoading(false);
        return data;
      } catch (err: any) {
        // console.error('[hook/useExecution] Fetch error:', err);
        const fallback: ExecutionResult = {
          success: false,
          error: err.message || 'Network error during execution',
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

  const reset = useCallback(() => {
    setResult(null);
    setSteps([]);
    setError(null);
  }, []);

  return { run, result, setResult, steps, loading, error, reset };
}
