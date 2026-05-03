'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send, Loader2, Sparkles, Trash2, Zap, BookOpen,
  Copy, Check, Bug, Lightbulb, Brain, Terminal as TerminalIcon,
  RefreshCw, ChevronDown, User, Bot, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileNode, ExecutionResult } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { safeArray, safeString } from '@/lib/safe';
import { useTheme, useThemeClasses } from '@/context/ThemeContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
}

interface AIAssistantProps {
  files: FileNode[];
  activeFileCode?: string;
  activeFileName?: string;
  currentStepExplanation?: string;
  lastResult?: ExecutionResult | null;
  selectedCode?: string;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
}

/**
 * Typewriter Effect Component
 */
function TypewriterContent({ content, speed = 5 }: { content: string; speed?: number }) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < content.length) {
      const timer = setTimeout(() => {
        setDisplayedContent(prev => prev + content[index]);
        setIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timer);
    }
  }, [content, index, speed]);

  // If content was updated externally (e.g. streaming finished), snap to it if we're too far behind
  useEffect(() => {
    if (content.length > displayedContent.length + 50) {
      // Catch up slightly if we're falling behind
      setDisplayedContent(content.slice(0, displayedContent.length + 20));
      setIndex(displayedContent.length + 20);
    }
  }, [content, displayedContent.length]);

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {displayedContent}
    </ReactMarkdown>
  );
}

const markdownComponents = {
  code({ node, inline, className, children, ...props }: any) {
    if (!inline) {
      return (
        <div className="relative group/code my-4">
          <pre className="overflow-x-auto p-4 rounded-xl bg-black/40 border border-white/5 font-mono text-[12px] leading-relaxed">
            <code {...props}>{children}</code>
          </pre>
          <div className="absolute right-2 top-2 opacity-0 group-hover/code:opacity-100 transition-opacity">
            <CopyButton code={String(children)} />
          </div>
        </div>
      );
    }
    return (
      <code className="px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-500 text-xs font-mono" {...props}>
        {children}
      </code>
    );
  }
};

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className={cn(
        "p-1.5 rounded-lg border transition-all",
        copied ? "bg-green-500/10 border-green-500/30 text-green-500" : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
      )}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

export default function AIAssistant({
  activeFileCode, activeFileName, currentStepExplanation, lastResult, selectedCode, initialPrompt, onClearInitialPrompt
}: AIAssistantProps) {
  const { isDark } = useTheme();
  const themeClasses = useThemeClasses();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPrompt) {
      setInput(initialPrompt);
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [initialPrompt, onClearInitialPrompt]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (text?: string) => {
    const promptText = text || input;
    if (!promptText.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: promptText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setActiveProvider(null);

    const ctx = `Active File: ${activeFileName}\nCode:\n${activeFileCode}\n${selectedCode ? `Selection:\n${selectedCode}` : ''}\n${currentStepExplanation ? `Step Explanation: ${currentStepExplanation}` : ''}`;

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, context: ctx }),
      });

      if (!res.ok) throw new Error('AI request failed');
      
      const provider = res.headers.get('X-AI-Provider');
      setActiveProvider(provider);

      if (!res.body) throw new Error('No streaming body');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '', provider: provider || undefined }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantContent += decoder.decode(value);
        setMessages(prev => {
          const upd = [...prev];
          upd[upd.length - 1].content = assistantContent;
          return upd;
        });
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "⚠️ **Failed to generate response.** Please check your API keys or try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("h-full flex flex-col", themeClasses.bgSurface)}>
      {/* Header */}
      <div className={cn("px-4 py-3 border-b flex items-center justify-between", themeClasses.border, isDark ? "bg-white/5" : "bg-gray-50")}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-500/10 rounded-lg">
            <Sparkles size={14} className="text-cyan-500" />
          </div>
          <span className={cn("text-xs font-black uppercase tracking-widest", themeClasses.text)}>AI Mentor</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setMessages([])} 
            className={cn("p-1.5 rounded-md hover:bg-white/10 transition-colors", themeClasses.textTertiary)}
            title="Clear Chat"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-grid-pattern">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
            <Brain size={48} className={themeClasses.textTertiary} />
            <p className={cn("mt-4 text-xs font-bold uppercase tracking-widest", themeClasses.textSecondary)}>AI Mentor is ready</p>
            <p className={cn("mt-2 text-[10px] max-w-[200px] leading-relaxed", themeClasses.textTertiary)}>Ask about your code, Big-O complexity, or logic visualizer.</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex flex-col gap-2", m.role === 'user' ? "items-end" : "items-start")}
            >
              <div className="flex items-center gap-2 px-1">
                {m.role === 'assistant' ? (
                  <>
                    <Bot size={12} className="text-cyan-500" />
                    <span className={cn("text-[9px] font-black uppercase tracking-widest text-cyan-500/60")}>AI Mentor {m.provider && `• ${m.provider}`}</span>
                  </>
                ) : (
                  <>
                    <span className={cn("text-[9px] font-black uppercase tracking-widest text-purple-500/60")}>You</span>
                    <User size={12} className="text-purple-500" />
                  </>
                )}
              </div>
              <div className={cn(
                "px-4 py-3 rounded-2xl text-[13px] leading-relaxed shadow-sm ring-1",
                m.role === 'user' 
                  ? "bg-purple-500/10 border-purple-500/20 text-purple-200 ring-purple-500/5 ml-12" 
                  : cn("border max-w-[90%] ring-white/5", themeClasses.bgSecondary, themeClasses.border, themeClasses.textSecondary)
              )}>
                {m.role === 'assistant' && i === messages.length - 1 && isLoading ? (
                  <TypewriterContent content={m.content} />
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {m.content}
                  </ReactMarkdown>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && !messages[messages.length-1]?.content && (
          <div className="flex flex-col gap-2 items-start animate-pulse">
            <div className="flex items-center gap-2 px-1">
              <Bot size={12} className="text-cyan-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-cyan-500/60">Thinking...</span>
            </div>
            <div className={cn("w-32 h-10 rounded-2xl border flex items-center justify-center", themeClasses.bgSecondary, themeClasses.border)}>
              <Loader2 size={16} className="animate-spin text-cyan-500/50" />
            </div>
          </div>
        )}
      </div>

      {/* Suggested Actions */}
      {messages.length === 0 && !isLoading && (
        <div className={cn("px-4 py-3 border-t flex gap-2 overflow-x-auto no-scrollbar", themeClasses.border)}>
          {[
            { label: 'Explain Code', prompt: 'Can you explain what this code does in simple terms?', icon: <BookOpen size={10} /> },
            { label: 'Complexity', prompt: 'What is the time and space complexity of this code?', icon: <Zap size={10} /> },
            { label: 'Find Bugs', prompt: 'Are there any potential bugs or edge cases in this code?', icon: <Bug size={10} /> }
          ].map((act, i) => (
            <button
              key={i}
              onClick={() => handleSend(act.prompt)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-tight transition-all whitespace-nowrap",
                isDark ? "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10" : "bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200"
              )}
            >
              {act.icon}
              {act.label}
            </button>
          ))}
        </div>
      )}

      {/* Provider Indicator */}
      {activeProvider && (
        <div className="px-4 pt-2">
          <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest opacity-40">
            <Zap size={10} className="text-cyan-500" />
            <span>Powered by {activeProvider}</span>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className={cn("p-4 border-t", themeClasses.border)}>
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-2xl border transition-all focus-within:ring-2 focus-within:ring-cyan-500/20",
            isDark ? "bg-black/20 border-white/10 focus-within:border-cyan-500/50" : "bg-gray-50 border-gray-200 focus-within:border-blue-500/50"
          )}
        >
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your mentor anything..."
            className="flex-1 bg-transparent border-none focus:outline-none text-sm placeholder:text-gray-600"
            disabled={isLoading}
          />
          <button 
            type="submit"
            disabled={isLoading || !input.trim()}
            className={cn(
              "p-2 rounded-xl transition-all",
              input.trim() ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20" : "text-gray-600 cursor-not-allowed"
            )}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
        {messages.length > 0 && !isLoading && messages[messages.length-1].content.includes("⚠️") && (
          <button 
            onClick={() => handleSend(messages[messages.length-2].content)}
            className="mt-3 w-full py-2 rounded-xl border border-red-500/30 bg-red-500/5 text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500/10 transition-all"
          >
            <RefreshCw size={12} /> Retry Response
          </button>
        )}
      </div>
    </div>
  );
}