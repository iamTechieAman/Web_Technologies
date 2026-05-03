'use client';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import DOMPurify from 'isomorphic-dompurify';
import { Badge } from '@/components/ui/badge';
import { Problem } from '@/types';
import { cn } from '@/lib/utils';
import { 
  AlertCircle, Clock, 
  BarChart3, Tags, Lightbulb 
} from 'lucide-react';
import { useTheme, useThemeClasses } from '@/context/ThemeContext';

interface ProblemDescriptionProps {
  problem: Problem;
}

export default function ProblemDescription({ problem }: ProblemDescriptionProps): React.ReactNode {
  const { isDark } = useTheme();
  const themeClasses = useThemeClasses();
  const sanitizedDescription = DOMPurify.sanitize(problem.descriptionHtml || problem.description || '');

  return (
    <div className="flex flex-col gap-5 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className={cn("text-2xl font-black tracking-tight", themeClasses.text)}>
            {problem.id}. {problem.title}
          </span>
          <Badge variant={problem.difficulty.toLowerCase() as 'default' | 'destructive' | 'outline' | 'secondary'}>
            {problem.difficulty}
          </Badge>
        </div>
        
        <div className={cn("flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-widest", themeClasses.textTertiary)}>
          <div className="flex items-center gap-1.5">
            <Tags size={12} className={themeClasses.accent} />
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
      <div className={cn("prose prose-sm max-w-none", isDark ? "prose-invert" : "")}>
        <div className={cn("markdown-container leading-relaxed space-y-4", themeClasses.textSecondary)}>
          <ReactMarkdown>
            {problem.description || ''}
          </ReactMarkdown>
        </div>
        {problem.descriptionHtml && (
          <div 
            className={cn("problem-content leading-relaxed space-y-4 mt-4", themeClasses.textSecondary)}
            dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
          />
        )}
      </div>

      {/* Constraints & Hints */}
      {(problem.constraints || problem.hints) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {problem.constraints && problem.constraints.length > 0 && (
            <div className={cn("border rounded-2xl p-6", themeClasses.bgHover, themeClasses.border)}>
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle size={16} className={themeClasses.accent} />
                <h3 className={cn("text-[10px] font-black uppercase tracking-widest", themeClasses.textTertiary)}>Constraints</h3>
              </div>
              <ul className="space-y-2">
                {Array.isArray(problem.constraints) ? problem.constraints.map((c, i) => (
                  <li key={i} className={cn("text-xs font-mono flex gap-2", themeClasses.textTertiary)}>
                    <span className={cn(themeClasses.accent, "opacity-50")}>•</span> {c}
                  </li>
                )) : (
                  <li className={cn("text-xs font-mono", themeClasses.textTertiary)}>{problem.constraints}</li>
                )}
              </ul>
            </div>
          )}

          {problem.hints && problem.hints.length > 0 && (
            <div className={cn("border rounded-2xl p-6", themeClasses.bgHover, themeClasses.border)}>
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb size={16} className="text-blue-500" />
                <h3 className={cn("text-[10px] font-black uppercase tracking-widest", themeClasses.textTertiary)}>Hints</h3>
              </div>
              <div className="space-y-4">
                {problem.hints.map((hint, i) => (
                  <details key={i} className={cn("group border-b pb-2 cursor-pointer", themeClasses.border)}>
                    <summary className={cn("text-xs transition-colors list-none flex items-center justify-between", themeClasses.textTertiary, "hover:text-cyan-500")}>
                      Hint {i + 1}
                      <ChevronDownIcon size={12} className="group-open:rotate-180 transition-transform" />
                    </summary>
                    <p className={cn("text-xs mt-2 pl-2 border-l leading-relaxed", themeClasses.textSecondary, "border-cyan-500/30")}>{hint}</p>
                  </details>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx global>{`
        .markdown-container pre, .problem-content pre {
          background: ${isDark ? '#0d0d10' : '#f8f9fa'} !important;
          border: 1px solid ${isDark ? '#1f2937' : '#e9ecef'} !important;
          padding: 1rem !important;
          border-radius: 0.75rem !important;
          overflow-x: auto;
        }
        .markdown-container code, .problem-content code {
          color: ${isDark ? '#f97316' : '#ea580c'} !important;
          background: ${isDark ? 'rgba(249, 115, 22, 0.1)' : 'rgba(234, 88, 12, 0.05)'} !important;
          padding: 0.1rem 0.3rem !important;
          border-radius: 0.25rem !important;
        }
        .problem-content strong {
          color: ${isDark ? '#fff' : '#000'} !important;
          font-weight: 900 !important;
        }
      `}</style>
    </div>
  );
}

function ChevronDownIcon({ size, className }: { size: number, className?: string }): React.ReactNode {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
