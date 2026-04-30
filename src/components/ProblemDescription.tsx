'use client';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import DOMPurify from 'isomorphic-dompurify';
import { Badge } from '@/components/ui/badge';
import { Problem } from '@/types';
import { cn } from '@/lib/utils';
import { 
  AlertCircle, CheckCircle2, Clock, 
  BarChart3, Tags, Lightbulb 
} from 'lucide-react';

interface ProblemDescriptionProps {
  problem: Problem;
}

export default function ProblemDescription({ problem }: ProblemDescriptionProps) {
  const sanitizedDescription = DOMPurify.sanitize(problem.descriptionHtml || problem.description || '');

  return (
    <div className="flex flex-col gap-8 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black text-white tracking-tight">
            {problem.id}. {problem.title}
          </span>
          <Badge variant={problem.difficulty.toLowerCase() as any}>
            {problem.difficulty}
          </Badge>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
          <div className="flex items-center gap-1.5">
            <Tags size={12} className="text-orange-500" />
            {(problem.tags || problem.topicTags?.map(t => t.name) || []).join(', ')}
          </div>
          <div className="flex items-center gap-1.5">
            <BarChart3 size={12} className="text-blue-500" />
            Accuracy: 45.2%
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-green-500" />
            Avg. Time: 25m
          </div>
        </div>
      </div>

      {/* Description Content */}
      <div className="prose prose-invert prose-sm max-w-none">
        <div className="markdown-container text-gray-300 leading-relaxed space-y-4">
          <ReactMarkdown>
            {problem.description || ''}
          </ReactMarkdown>
        </div>
        {problem.descriptionHtml && (
          <div 
            className="problem-content text-gray-300 leading-relaxed space-y-4 mt-4"
            dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
          />
        )}
      </div>

      {/* Constraints & Hints */}
      {(problem.constraints || problem.hints) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {problem.constraints && problem.constraints.length > 0 && (
            <div className="bg-white/5 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle size={16} className="text-orange-500" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Constraints</h3>
              </div>
              <ul className="space-y-2">
                {Array.isArray(problem.constraints) ? problem.constraints.map((c, i) => (
                  <li key={i} className="text-xs text-gray-500 font-mono flex gap-2">
                    <span className="text-orange-500/50">•</span> {c}
                  </li>
                )) : (
                  <li className="text-xs text-gray-500 font-mono">{problem.constraints}</li>
                )}
              </ul>
            </div>
          )}

          {problem.hints && problem.hints.length > 0 && (
            <div className="bg-white/5 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb size={16} className="text-blue-500" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Hints</h3>
              </div>
              <div className="space-y-4">
                {problem.hints.map((hint, i) => (
                  <details key={i} className="group border-b border-gray-800/50 pb-2 cursor-pointer">
                    <summary className="text-xs text-gray-500 hover:text-white transition-colors list-none flex items-center justify-between">
                      Hint {i + 1}
                      <ChevronDown size={12} className="group-open:rotate-180 transition-transform" />
                    </summary>
                    <p className="text-xs text-gray-400 mt-2 pl-2 border-l border-blue-500/30 leading-relaxed">{hint}</p>
                  </details>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx global>{`
        .markdown-container pre {
          background: #0d0d10 !important;
          border: 1px solid #1f2937 !important;
          padding: 1rem !important;
          border-radius: 0.75rem !important;
          overflow-x: auto;
        }
        .markdown-container code {
          color: #f97316 !important;
          background: rgba(249, 115, 22, 0.1) !important;
          padding: 0.1rem 0.3rem !important;
          border-radius: 0.25rem !important;
        }
        .problem-content pre {
          background: #0d0d10 !important;
          border: 1px solid #1f2937 !important;
          padding: 1rem !important;
          border-radius: 0.75rem !important;
          font-family: 'JetBrains Mono', monospace !important;
        }
        .problem-content code {
          color: #f97316 !important;
          background: rgba(249, 115, 22, 0.1) !important;
          padding: 0.1rem 0.3rem !important;
          border-radius: 0.25rem !important;
        }
        .problem-content strong {
          color: #fff !important;
          font-weight: 900 !important;
        }
      `}</style>
    </div>
  );
}

function ChevronDown({ size, className }: { size: number, className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
