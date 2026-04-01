'use client';
import React, { useState } from 'react';
import { Play, CheckCircle2, XCircle, Loader2, Plus } from 'lucide-react';
import { TestCase } from '@/types';
import { cn } from '@/lib/utils';

interface TestRunnerProps {
  testCases: TestCase[];
  onRunTest: (testCase: TestCase) => Promise<{ success: boolean; actual: string; error?: string }>;
}

export default function TestRunner({ testCases, onRunTest }: TestRunnerProps) {
  const [results, setResults] = useState<Record<string, { status: 'idle' | 'running' | 'pass' | 'fail'; actual: string; error?: string }>>({});
  const [runningAll, setRunningAll] = useState(false);

  const runTest = async (tc: TestCase) => {
    setResults(prev => ({ ...prev, [tc.id]: { ...prev[tc.id], status: 'running', actual: '' } }));
    try {
      const res = await onRunTest(tc);
      setResults(prev => ({ 
        ...prev, 
        [tc.id]: { 
          status: res.success ? 'pass' : 'fail', 
          actual: res.actual, 
          error: res.error 
        } 
      }));
      return res.success;
    } catch (err: any) {
      setResults(prev => ({ 
        ...prev, 
        [tc.id]: { status: 'fail', actual: '', error: err.message } 
      }));
      return false;
    }
  };

  const runAll = async () => {
    setRunningAll(true);
    for (const tc of testCases) {
      await runTest(tc);
    }
    setRunningAll(false);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
          Test Cases
        </h3>
        <div className="flex gap-2">
          <button
            onClick={runAll}
            disabled={runningAll || testCases.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 disabled:opacity-50 transition-all"
          >
            {runningAll ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
            Run All Tests
          </button>
          <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {testCases.map((tc, index) => {
          const res = results[tc.id] || { status: 'idle', actual: '' };
          return (
            <div key={tc.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400">Case {index + 1}</span>
                  {res.status === 'pass' && <span className="flex items-center gap-1 text-[10px] font-bold text-green-500 uppercase"><CheckCircle2 size={12} /> Passed</span>}
                  {res.status === 'fail' && <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase"><XCircle size={12} /> Failed</span>}
                  {res.status === 'running' && <Loader2 size={12} className="animate-spin text-blue-500" />}
                </div>
                <button
                  onClick={() => runTest(tc)}
                  disabled={res.status === 'running'}
                  className="text-[10px] font-bold text-blue-500 hover:underline uppercase"
                >
                  Run Case
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Input</span>
                  <pre className="p-2 bg-gray-100 dark:bg-gray-950 rounded border border-gray-200 dark:border-gray-800 text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto">
                    {tc.input}
                  </pre>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Expected</span>
                  <pre className="p-2 bg-gray-100 dark:bg-gray-950 rounded border border-gray-200 dark:border-gray-800 text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto">
                    {tc.expected}
                  </pre>
                </div>
              </div>

              {(res.status === 'fail' || res.status === 'pass') && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actual Output</span>
                   <pre className={cn(
                     "mt-1 p-2 rounded text-xs font-mono overflow-x-auto border",
                     res.status === 'fail' ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400" : "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30 text-green-600 dark:text-green-400"
                   )}>
                     {res.error || res.actual || '(No output)'}
                   </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
