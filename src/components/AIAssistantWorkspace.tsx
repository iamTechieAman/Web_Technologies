'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, MessageSquare, Zap, Brain, Loader2, Send, Bot, User, Trash2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
}

interface AIAssistantProps {
  code: string;
  language: string;
  problemTitle?: string;
  problemDescription?: string;
}

export default function AIAssistantWorkspace({ code, language, problemTitle, problemDescription }: AIAssistantProps) {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamAI = async (payload: any) => {
    setLoading(true);
    let currentResponse = '';
    
    // Add empty assistant message to be filled
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'AI credits exhausted. Please try a simpler request or upgrade your plan.' }));
        throw new Error(errorData.error || 'AI request failed');
      }

      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        currentResponse += chunk;
        
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last) last.content = currentResponse;
          return updated;
        });
      }
    } catch (err: any) {
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last) {
          last.content = err.message;
          last.isError = true;
        }
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    
    streamAI({
      messages: messages.filter(m => !m.isError).map(m => ({ role: m.role, content: m.content })),
      code,
      language,
      problemStatement: problemTitle ? `${problemTitle}\n${problemDescription || ''}` : undefined
    });
    
    setInput('');
  };

  const runAction = (action: 'explain' | 'optimize' | 'analyze') => {
    setMessages(prev => [...prev, { role: 'user', content: `${action.toUpperCase()} this code.` }]);
    streamAI({
      action,
      messages: [], 
      code,
      language,
      problemStatement: problemTitle ? `${problemTitle}\n${problemDescription || ''}` : undefined
    });
  };

  return (
    <div className="h-full flex flex-col bg-[#0d0d10]">
      <div className="p-3 border-b border-gray-800/50 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-cyan-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">AI Assistant</span>
          </div>
          <button onClick={() => setMessages([])} className="text-gray-600 hover:text-red-500 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="xs" onClick={() => runAction('explain')} className="text-[9px] h-8 border-gray-800 hover:border-blue-500/50 bg-gray-900/50">
            <MessageSquare size={12} className="mr-1 text-blue-500" /> Explain
          </Button>
          <Button variant="outline" size="xs" onClick={() => runAction('optimize')} className="text-[9px] h-8 border-gray-800 hover:border-green-500/50 bg-gray-900/50">
            <Zap size={12} className="mr-1 text-green-500" /> Optimize
          </Button>
          <Button variant="outline" size="xs" onClick={() => runAction('analyze')} className="text-[9px] h-8 border-gray-800 hover:border-purple-500/50 bg-gray-900/50">
            <Brain size={12} className="mr-1 text-purple-500" /> Analyze
          </Button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-4 scroll-smooth custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
            <Bot size={48} className="text-gray-800 mb-4" />
            <p className="text-xs font-medium text-gray-600 max-w-[200px]">Ask me to explain, optimize, or debug your DSA code.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={cn(
            "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
            msg.role === 'user' ? "flex-row-reverse" : "flex-row"
          )}>
            <div className={cn(
              "w-6 h-6 rounded-lg flex items-center justify-center shrink-0",
              msg.role === 'user' ? "bg-cyan-500/20 text-cyan-500" : "bg-blue-500/20 text-blue-400"
            )}>
              {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
            </div>
            <div className={cn(
              "max-w-[85%] rounded-2xl p-3 text-[11px] leading-relaxed whitespace-pre-wrap",
              msg.role === 'user' 
                ? "bg-cyan-500 text-white rounded-tr-none" 
                : cn("bg-gray-900 border text-gray-300 rounded-tl-none", msg.isError ? "border-red-500/50 text-red-400" : "border-gray-800")
            )}>
              {msg.isError && <AlertCircle size={10} className="inline mr-2 text-red-500" />}
              {msg.content || <div className="flex gap-1 animate-pulse"><div className="w-1 h-1 bg-gray-500 rounded-full" /><div className="w-1 h-1 bg-gray-500 rounded-full" /><div className="w-1 h-1 bg-gray-500 rounded-full" /></div>}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-gray-800/50 bg-[#0a0a0c]">
        <form onSubmit={handleSend} className="relative">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI anything..."
            className="w-full bg-[#050507] border border-gray-800 rounded-xl py-2.5 pl-4 pr-12 text-xs text-gray-300 focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-gray-700"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || loading}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-cyan-500 text-white flex items-center justify-center hover:bg-cyan-600 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </form>
      </div>
    </div>
  );
}
