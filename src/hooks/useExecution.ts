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

  const run = useCallback(async (code: string, language: SupportedLanguage, stdin?: string): Promise<ExecutionResult> => {
    setLoading(true);
    setError(null);
    setResult(null);

    // 1. Generate visualizer steps (Synchronous simulation)
    // Always use preprocessed code for visualization to hide boilerplate
    const effectiveCode = preprocessCode(code, language);
    const visualSteps = generateExecutionSteps(effectiveCode, language, stdin);
    setSteps(visualSteps);

    try {
      // Temporary log for debugging stdin flow
      // console.log('Sending stdin:', stdin);
      
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code, stdin }), // Sending original code, API handles preprocessing
      });

      if (!res.ok) {
        throw new Error(`Execution failed: ${res.statusText}`);
      }

      const data: ExecutionResult = await res.json();
      setResult(data);

      if (!data.success) {
        setError(data.error || 'Execution failed');
      }

      setLoading(false);
      return data;
    } catch (err: any) {
      // console.error('[useExecution] Error:', err);
      const fallback: ExecutionResult = {
        success: false,
        error: err.message || 'Execution error',
        engine: 'piston',
      };
      setResult(fallback);
      setError(fallback.error || 'Error');
      setLoading(false);
      return fallback;
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setSteps([]);
    setError(null);
  }, []);

  return { run, result, setResult, steps, loading, error, reset };
}
