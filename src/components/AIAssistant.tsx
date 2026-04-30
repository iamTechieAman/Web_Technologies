'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Send, Loader2, Sparkles, Trash2, Zap,
  Copy, Check, Bug, Lightbulb, Brain, AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileNode, ExecutionResult } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIAssistantProps {
  files: FileNode[];
  activeFileCode?: string;
  activeFileName?: string;
  currentStepExplanation?: string;
  lastResult?: ExecutionResult | null;
}

function isInputError(result?: ExecutionResult | null): boolean {
  if (!result || result.success) return false;
  const msg = (result.error || result.run?.stderr || '').toLowerCase();
  return (
    msg.includes('nosuchelementexception') ||
    msg.includes('inputmismatchexception') ||
    msg.includes('eoferror') ||
    msg.includes('input required')
  );
}

const INPUT_TIP =
  `> ⚠️ **Input Required**
>
> Your program reads from **standard input** (\`Scanner\`, \`input()\`, \`scanf\`, \`cin\`) but no value was provided.

**Fix:**
1. Click the **Stdin** button in the editor toolbar.
2. Type your input (e.g. \`5\` or \`3.14\`).
3. Press **Run** again.

> 💡 Each whitespace-separated token = one call to \`nextInt()\` / \`input()\` / \`scanf\`.`;

// ── Copy button with toast ────────────────────────────────────────────────────

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [code]);

  return (
    <button
      onClick={handleCopy}
      title={copied ? 'Copied!' : 'Copy code'}
      className={cn(
        'absolute right-2 top-2 z-10 flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all',
        copied
          ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
          : 'bg-black/50 hover:bg-orange-500 text-gray-300 hover:text-white opacity-0 group-hover/code:opacity-100',
      )}
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AIAssistant({
  files, activeFileCode, activeFileName, currentStepExplanation, lastResult,
}: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hello! I'm your **CodeVisualizer AI Mentor**. I've analysed your project and I'm ready to help you master algorithms. 🚀",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Auto-inject input tip on input errors
  useEffect(() => {
    if (!isInputError(lastResult)) return;
    if (messages.some(m => m.content.includes('Input Required'))) return;
    setMessages(prev => [...prev, { role: 'assistant', content: INPUT_TIP }]);
  }, [lastResult]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = async (customPrompt?: string) => {
    const text = customPrompt || input;
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const ctx = `Active File (${activeFileName ?? 'untitled'}):\n\`\`\`\n${activeFileCode ?? ''}\n\`\`\`` +
      (currentStepExplanation ? `\nCurrent Step: ${currentStepExplanation}` : '');

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg], context: ctx }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let content = '';
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        content += decoder.decode(value);
        setMessages(prev => {
          const upd = [...prev];
          upd[upd.length - 1] = { ...upd[upd.length - 1], content };
          return upd;
        });
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ **Error:** ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { label: 'Analyze Complexity', icon: <Brain size={12} />, prompt: 'What is the Time and Space complexity of this code?' },
    { label: 'Optimize',           icon: <Zap size={12} />,   prompt: 'Can you optimize this code for better performance?' },
    { label: 'Explain',            icon: <Lightbulb size={12} />, prompt: 'Explain this code line-by-line for a beginner.' },
    { label: 'Debug Help',         icon: <Bug size={12} />,   prompt: 'I am getting an error. Find the fix.' },
  ];

  return (
    <div className="h-full flex flex-col bg-[#0d0d10] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-black/40 backdrop-blur-xl shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
              <Sparkles size={16} className="text-orange-500" />
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">AI Mentor</h3>
              <p className="text-[8px] font-bold text-gray-600 uppercase">Context-Aware Guidance</p>
            </div>
          </div>
          <button onClick={() => setMessages([])} className="p-1.5 text-gray-600 hover:text-white transition-colors">
            <Trash2 size={13} />
          </button>
        </div>

        {/* Input-error banner */}
        {isInputError(lastResult) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 p-2.5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start gap-2"
          >
            <AlertTriangle size={13} className="text-yellow-500 shrink-0 mt-0.5" />
            <p className="text-[9px] font-bold text-yellow-200/80 leading-relaxed">
              Your program needs input. Enter values in the{' '}
              <span className="text-yellow-400 font-black">Stdin</span> box and re-run.
            </p>
          </motion.div>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[88%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
                  m.role === 'user'
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 rounded-br-sm'
                    : 'glass-card border-white/5 rounded-bl-sm',
                )}
              >
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const lang = /language-(\w+)/.exec(className || '')?.[1];
                        const codeStr = String(children).replace(/\n$/, '');

                        if (!inline && lang) {
                          return (
                            <div className="relative group/code my-2">
                              <CopyButton code={codeStr} />
                              <pre className={cn('rounded-xl overflow-x-auto', className)} {...props}>
                                <code>{children}</code>
                              </pre>
                            </div>
                          );
                        }
                        return (
                          <code
                            className="bg-orange-500/10 text-orange-400 px-1 py-0.5 rounded text-xs font-mono"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-600 animate-pulse pl-1">
            <Loader2 size={11} className="animate-spin" /> Thinking…
          </div>
        )}
      </div>

      {/* Quick actions + input */}
      <div className="p-4 bg-black/40 backdrop-blur-xl border-t border-white/5 shrink-0">
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          {quickActions.map((a, i) => (
            <button
              key={i}
              onClick={() => handleSend(a.prompt)}
              className="flex items-center gap-2 p-2 glass-panel rounded-xl text-left hover:border-orange-500/30 group transition-all"
            >
              <div className="p-1 bg-white/5 rounded-lg text-gray-600 group-hover:text-orange-500 transition-colors shrink-0">
                {a.icon}
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white leading-tight">
                {a.label}
              </span>
            </button>
          ))}
        </div>
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask your mentor…"
            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-4 pr-11 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500/50 transition-all"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all shadow-lg disabled:opacity-40"
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
