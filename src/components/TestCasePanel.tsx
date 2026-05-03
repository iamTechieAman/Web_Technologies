'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Play, Trash2, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';
import { TestCase } from '@/types';

interface TestCasePanelProps {
  testCases: TestCase[];
  onRunTest?: (tc: TestCase) => Promise<{ success: boolean; actual: string; error?: string }>;
}

export default function TestCasePanel({ testCases: initialTestCases, onRunTest }: TestCasePanelProps) {
  const { isDark } = useTheme();
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [results, setResults] = useState<Record<string, { status: 'idle' | 'running' | 'pass' | 'fail'; actual: string; error?: string }>>({});

  useEffect(() => {
    if (initialTestCases && initialTestCases.length > 0) {
      setTestCases(initialTestCases);
    } else {
      setTestCases([{ id: 'default', input: '', expected: '' }]);
    }
  }, [initialTestCases]);

  const addTestCase = () => {
    setTestCases([...testCases, { 
      id: Date.now().toString(), 
      input: '', 
      expected: ''
    }]);
  };

  const removeTestCase = (id: string) => {
    setTestCases(testCases.filter(tc => tc.id !== id));
  };

  const runTest = async (tc: TestCase) => {
    if (!onRunTest) return;
    setResults(prev => ({ ...prev, [tc.id]: { status: 'running', actual: '' } }));
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
    } catch (err: any) {
      setResults(prev => ({ 
        ...prev, 
        [tc.id]: { status: 'fail', actual: '', error: err.message } 
      }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Test Scenarios</h3>
        <Button variant="ghost" size="xs" onClick={addTestCase} className="text-gray-400 hover:text-cyan-500 border border-gray-800">
          <Plus size={14} className="mr-1" /> Add Case
        </Button>
      </div>

      <div className="grid gap-3">
        {testCases.map((tc, index) => {
          const res = results[tc.id] || { status: 'idle', actual: '' };
          return (
            <div key={tc.id} className={cn(
              "group relative border rounded-xl p-4 transition-all shadow-xl",
              isDark ? "bg-[#111118] border-gray-800 hover:border-gray-700" : "bg-white border-gray-200 hover:border-gray-300 shadow-gray-200/20"
            )}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-tighter">Scenario {index + 1}</span>
                  {res.status === 'pass' && <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[9px] font-black uppercase"><CheckCircle2 size={12} /> Accepted</div>}
                  {res.status === 'fail' && <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[9px] font-black uppercase"><XCircle size={12} /> Wrong Answer</div>}
                  {res.status === 'running' && <Loader2 size={12} className="animate-spin text-cyan-500" />}
                </div>
                <button onClick={() => removeTestCase(tc.id)} className="p-1.5 text-gray-700 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                  <Trash2 size={14} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-blue-500" /> Input
                  </label>
                  <textarea 
                    className={cn(
                      "w-full border rounded-lg p-3 text-[11px] focus:outline-none focus:border-blue-500/50 resize-none h-20 font-mono leading-relaxed",
                      isDark ? "bg-[#0a0a0c] border-gray-800 text-gray-400" : "bg-gray-50 border-gray-200 text-gray-800"
                    )}
                    value={tc.input}
                    onChange={(e) => {
                      const newCases = [...testCases];
                      newCases[index].input = e.target.value;
                      setTestCases(newCases);
                    }}
                    placeholder="Enter test input..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-green-500" /> Expected
                  </label>
                  <textarea 
                    className={cn(
                      "w-full border rounded-lg p-3 text-[11px] focus:outline-none focus:border-green-500/50 resize-none h-20 font-mono leading-relaxed",
                      isDark ? "bg-[#0a0a0c] border-gray-800 text-gray-400" : "bg-gray-50 border-gray-200 text-gray-800"
                    )}
                    value={tc.expected}
                    onChange={(e) => {
                      const newCases = [...testCases];
                      newCases[index].expected = e.target.value;
                      setTestCases(newCases);
                    }}
                    placeholder="Expected output..."
                  />
                </div>
              </div>

              {(res.status === 'pass' || res.status === 'fail') && (
                <div className="mt-4 pt-4 border-t border-gray-800 space-y-2 animate-in fade-in slide-in-from-top-2">
                  <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Actual Result</label>
                  <pre className={cn(
                    "p-3 rounded-lg text-[11px] font-mono border",
                    res.status === 'pass' ? "bg-green-500/5 border-green-500/20 text-green-400" : "bg-red-500/5 border-red-500/20 text-red-400"
                  )}>
                    {res.error || res.actual || '(Empty Output)'}
                  </pre>
                </div>
              )}
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => runTest(tc)}
                disabled={res.status === 'running'}
                className={cn(
                  "w-full mt-4 border hover:border-cyan-500/50 hover:bg-cyan-500/10 hover:text-cyan-500 text-[10px] font-black uppercase tracking-widest py-5 gap-2 group/btn",
                  isDark ? "bg-gray-900/50 border-gray-800" : "bg-gray-100/50 border-gray-200 text-gray-700"
                )}
              >
                {res.status === 'running' ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} className="group-hover/btn:fill-current transition-all" />}
                Run Scenario {index + 1}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
