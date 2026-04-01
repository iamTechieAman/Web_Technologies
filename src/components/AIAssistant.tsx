'use client';
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Send, Bot, User, Loader2, Sparkles, 
  Trash2, Files, FileCode, Zap, Code,
  Bug, Lightbulb, MessageSquare, Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileNode } from '@/types';
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
}

export default function AIAssistant({ files, activeFileCode, activeFileName, currentStepExplanation }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: "Hello! I'm your **CodeVisualizer AI Mentor**. I've analyzed your project structure and am ready to help you optimize your algorithms. How can I assist you today? 🚀" 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<'file' | 'project'>('file');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (customPrompt?: string) => {
    const text = customPrompt || input;
    if (!text.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    let contextData = `Active File (${activeFileName}):\n\`\`\`\n${activeFileCode}\n\`\`\``;
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
          updated[updated.length - 1].content = assistantContent;
          return updated;
        });
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ **Mentor Alert:** ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { label: "Analyze Complexity", icon: <Brain size={12} />, prompt: "What is the Time and Space complexity of this code? Provide a breakdown for each function." },
    { label: "Optimize Logic", icon: <Zap size={12} />, prompt: "Can you optimize this code for better performance? Suggest more efficient algorithms or data structures." },
    { label: "Explain Code", icon: <Lightbulb size={12} />, prompt: "Explain this code line-by-line for a beginner. What are the key steps?" },
    { label: "Debug Help", icon: <Bug size={12} />, prompt: "I am getting an error. Can you analyze the code and output to find the fix?" },
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

        {currentStepExplanation && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-orange-500/5 border border-orange-500/20 rounded-xl flex items-center gap-3"
          >
            <div className="w-6 h-6 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Zap size={12} className="text-orange-500" />
            </div>
            <p className="text-[9px] font-bold text-orange-200/70 truncate">
              Currently analyzing: {currentStepExplanation}
            </p>
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
              className={cn("flex flex-col gap-2", m.role === 'user' ? "items-end" : "items-start")}
            >
              <div className={cn(
                "max-w-[90%] p-4 rounded-2xl text-sm leading-relaxed",
                m.role === 'user' ? "bg-orange-500 text-white shadow-xl shadow-orange-500/20" : "glass-card border-white/5"
              )}>
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
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
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask your mentor..."
            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-5 pr-12 py-3 text-xs text-white focus:outline-none focus:border-orange-500/50 transition-all"
          />
          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all shadow-lg"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
