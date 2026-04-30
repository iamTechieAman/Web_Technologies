'use client';
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Send, Loader2, Sparkles,
  Trash2, Zap, Code,
  Bug, Lightbulb, Brain, Terminal as TerminalIcon,
  AlertTriangle,
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
  /** Latest execution result — used to auto-trigger input-error tip */
  lastResult?: ExecutionResult | null;
}

/** Detect whether the execution error is an "input required" error. */
function isInputError(result?: ExecutionResult | null): boolean {
  if (!result || result.success) return false;
  const msg = (result.error || result.run?.stderr || '').toLowerCase();
  return (
    msg.includes('nosuchelementexception') ||
    msg.includes('inputmismatchexception') ||
    msg.includes('eoferror') ||
    msg.includes('input required') ||
    msg.includes('waiting for input')
  );
}

const INPUT_TIP_MESSAGE = `> ⚠️ **Input Required**
>
> Your program is reading from **standard input** (e.g. \`Scanner\`, \`input()\`, \`scanf\`, \`cin\`) but no value was provided.

**How to fix it:**
1. Click the **Stdin** button in the editor toolbar (or press \`Ctrl+Shift+I\`).
2. Type the expected input in the box that appears (e.g. \`5\` or \`3.14\`).
3. Press **Run** again — your program will receive that value.

> 💡 Each space or newline in the stdin box is one token, matching how \`Scanner.nextInt()\`, \`scanf("%d")\`, or Python's \`int(input())\` reads values.`;

export default function AIAssistant({
  files,
  activeFileCode,
  activeFileName,
  currentStepExplanation,
  lastResult,
}: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hello! I'm your **CodeVisualizer AI Mentor**. I've analysed your project structure and I'm ready to help you optimise your algorithms. How can I assist you today? 🚀",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Auto-inject tip when an input error is detected
  useEffect(() => {
    if (!isInputError(lastResult)) return;
    // Avoid duplicate tips
    if (messages.some(m => m.content.includes('Input Required'))) return;
    setMessages(prev => [...prev, { role: 'assistant', content: INPUT_TIP_MESSAGE }]);
  }, [lastResult]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = async (customPrompt?: string) => {
    const text = customPrompt || input;
    if (!text.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    let contextData = `Active File (${activeFileName ?? 'untitled'}):\n\`\`\`\n${activeFileCode ?? ''}\n\`\`\``;
    if (currentStepExplanation) {
      contextData += `\nCurrent Execution Step: ${currentStepExplanation}`;
    }

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage], context: contextData }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        assistantContent += decoder.decode(value);
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], content: assistantContent };
          return updated;
        });
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `⚠️ **Mentor Alert:** ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      label: 'Analyze Complexity',
      icon: <Brain size={12} />,
      prompt:
        'What is the Time and Space complexity of this code? Provide a breakdown for each function.',
    },
    {
      label: 'Optimize Logic',
      icon: <Zap size={12} />,
      prompt:
        'Can you optimize this code for better performance? Suggest more efficient algorithms or data structures.',
    },
    {
      label: 'Explain Code',
      icon: <Lightbulb size={12} />,
      prompt: 'Explain this code line-by-line for a beginner. What are the key steps?',
    },
    {
      label: 'Debug Help',
      icon: <Bug size={12} />,
      prompt: 'I am getting an error. Can you analyse the code and the output to find the fix?',
    },
  ];

  return (
    <div className="h-full flex flex-col bg-[#0d0d10] relative overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/5 bg-black/40 backdrop-blur-2xl z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
              <Sparkles size={18} className="text-orange-500" />
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">AI Mentor</h3>
              <p className="text-[8px] font-bold text-gray-600 uppercase">Context-Aware Guidance</p>
            </div>
          </div>
          <button onClick={() => setMessages([])} className="p-2 text-gray-600 hover:text-white transition-colors">
            <Trash2 size={14} />
          </button>
        </div>

        {/* Input-error banner */}
        {isInputError(lastResult) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start gap-3"
          >
            <AlertTriangle size={14} className="text-yellow-500 shrink-0 mt-0.5" />
            <p className="text-[9px] font-bold text-yellow-200/80 leading-relaxed">
              Your program needs input. Enter values in the{' '}
              <span className="text-yellow-400 font-black">Stdin</span> box then re-run.
            </p>
          </motion.div>
        )}

        {currentStepExplanation && !isInputError(lastResult) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-orange-500/5 border border-orange-500/20 rounded-xl flex items-center gap-3"
          >
            <div className="w-6 h-6 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Zap size={12} className="text-orange-500" />
            </div>
            <p
              className="text-[9px] font-bold text-orange-200/70 truncate"
              dangerouslySetInnerHTML={{ __html: currentStepExplanation }}
            />
          </motion.div>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-6 space-y-6 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn('flex flex-col gap-2', m.role === 'user' ? 'items-end' : 'items-start')}
            >
              <div
                className={cn(
                  'max-w-[90%] p-4 rounded-2xl text-sm leading-relaxed',
                  m.role === 'user'
                    ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/20'
                    : 'glass-card border-white/5',
                )}
              >
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        const codeString = String(children).replace(/\n$/, '');

                        if (!inline && match) {
                          return (
                            <div className="relative group/code">
                              <button
                                onClick={() => navigator.clipboard.writeText(codeString)}
                                className="absolute right-2 top-2 p-1.5 bg-black/50 hover:bg-orange-500 rounded-lg text-white opacity-0 group-hover/code:opacity-100 transition-all z-10"
                                title="Copy code"
                              >
                                <Code size={12} />
                              </button>
                              <pre className={className} {...props}>
                                <code>{children}</code>
                              </pre>
                            </div>
                          );
                        }
                        return (
                          <code className={className} {...props}>
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
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-600 animate-pulse">
            <Loader2 size={12} className="animate-spin" /> Thinking...
          </div>
        )}
      </div>

      {/* Quick Actions & Input */}
      <div className="p-6 bg-black/40 backdrop-blur-2xl border-t border-white/5">
        <div className="grid grid-cols-2 gap-2 mb-4">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => handleSend(action.prompt)}
              className="flex items-center gap-2.5 p-2.5 glass-panel rounded-xl text-left hover:border-orange-500/30 group transition-all"
            >
              <div className="p-1.5 bg-white/5 rounded-lg text-gray-600 group-hover:text-orange-500 transition-colors">
                {action.icon}
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white">
                {action.label}
              </span>
            </button>
          ))}
        </div>
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask your mentor..."
            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-5 pr-12 py-3 text-xs text-white focus:outline-none focus:border-orange-500/50 transition-all"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all shadow-lg disabled:opacity-40"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
