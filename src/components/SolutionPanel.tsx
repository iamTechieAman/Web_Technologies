'use client';
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, AlertTriangle, CheckCircle2, Copy, Sparkles, Brain } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { Problem, SupportedLanguage } from '@/types';

interface SolutionPanelProps {
  problem?: Problem;
  language?: SupportedLanguage;
}

export default function SolutionPanel({ problem, language = 'python' }: SolutionPanelProps) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reset reveal state when problem changes
  useEffect(() => {
    setRevealed(false);
    setCopied(false);
  }, [problem?.id]);

  if (!problem) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
        <Brain size={48} className="text-gray-800 mb-4" />
        <p className="text-xs font-black uppercase tracking-widest text-gray-600">Select a problem to see the solution</p>
      </div>
    );
  }

  const solutionCode = problem.solutionCode?.[language] || problem.starterCode?.[language] || "No solution available for this language.";

  const handleCopy = () => {
    navigator.clipboard.writeText(solutionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-orange-500" />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Optimal Solution</h3>
        </div>
        <div className="flex items-center gap-2 px-2 py-1 bg-gray-900 rounded text-[9px] font-black text-gray-600 uppercase tracking-tighter">
          {problem.source || 'Verified'}
        </div>
      </div>

      {!revealed ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-gray-800/50 rounded-3xl bg-[#0d0d10]/50 space-y-6 transition-all group hover:border-orange-500/30">
          <div className="w-20 h-20 rounded-3xl bg-orange-500/10 flex items-center justify-center text-orange-500 transform transition-transform group-hover:scale-110 duration-500 shadow-2xl shadow-orange-500/5">
            <AlertTriangle size={40} strokeWidth={1.5} />
          </div>
          <div className="space-y-3">
            <h4 className="text-lg font-black text-gray-200 tracking-tight">Wait! Learning is in the struggle.</h4>
            <p className="text-xs text-gray-500 max-w-[280px] leading-relaxed font-medium">Viewing the solution now might stop you from truly mastering this algorithm. Have you tried all the hints?</p>
          </div>
          <Button 
            onClick={() => setRevealed(true)} 
            className="h-12 px-10 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-orange-500/20 active:scale-95 transition-all"
          >
            <Eye size={16} className="mr-2" /> Show Me The Path
          </Button>
        </div>
      ) : (
        <div className="flex-1 space-y-8 overflow-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12 custom-scrollbar">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-green-500">
              <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-600">Approach Found</h4>
                <p className="text-xs font-black text-gray-200 uppercase tracking-wider">{problem.title} Optimal Approach</p>
              </div>
            </div>
            {problem.approachSteps && (
              <ul className="space-y-3">
                {problem.approachSteps.map((step, i) => (
                  <li key={i} className="flex gap-4 p-4 bg-gray-900/40 border border-gray-800 rounded-2xl">
                    <span className="text-[10px] font-black text-orange-500 opacity-50 mt-0.5">{i + 1}.</span>
                    <p className="text-xs text-gray-400 leading-relaxed font-medium">{step}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Implementation ({language})</h5>
              <button 
                onClick={handleCopy}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  copied ? "text-green-500 bg-green-500/10" : "text-gray-500 hover:text-orange-500 bg-gray-900"
                )}
              >
                {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy Code'}
              </button>
            </div>
            <div className="relative group">
              <pre className="p-6 bg-[#050507] rounded-2xl border border-gray-800 font-mono text-[11px] text-orange-400/90 leading-relaxed overflow-x-auto shadow-2xl">
                <code>{solutionCode}</code>
              </pre>
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Sparkles size={16} className="text-gray-800" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[#111118] border border-gray-800 rounded-2xl space-y-1 group hover:border-orange-500/20 transition-colors">
              <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Time Complexity</span>
              <p className="text-sm font-black text-gray-200 tracking-tight">{problem.timeComplexity || 'O(N)'}</p>
            </div>
            <div className="p-4 bg-[#111118] border border-gray-800 rounded-2xl space-y-1 group hover:border-orange-500/20 transition-colors">
              <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Space Complexity</span>
              <p className="text-sm font-black text-gray-200 tracking-tight">{problem.spaceComplexity || 'O(1)'}</p>
            </div>
          </div>
          
          <button 
            onClick={() => setRevealed(false)} 
            className="w-full py-4 text-gray-700 hover:text-gray-500 uppercase text-[9px] font-black tracking-[0.2em] transition-all border border-dashed border-gray-800/50 rounded-2xl hover:border-gray-700"
          >
            <EyeOff size={14} className="inline mr-2 mb-0.5" /> Re-lock Solution
          </button>
        </div>
      )}
    </div>
  );
}
