'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send, Loader2, Sparkles, Trash2, Zap, BookOpen,
  Copy, Check, Bug, Lightbulb,
  Brain, Cpu, User, ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileNode, ExecutionResult, SupportedLanguage } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { getLanguageConfig } from '@/lib/languageConfigs';
import { useThemeClasses } from '@/context/ThemeContext';
import { AI_TOOLS, AIToolMode } from '@/lib/aiTools';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  context?: {
    code?: string;
    language?: SupportedLanguage;
    error?: string;
    stepExplanation?: string;
  };
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

const AI_PERSONAS = [
  { id: 'mentor', name: 'Code Mentor', icon: Sparkles, description: 'Guides you through coding concepts' },
  { id: 'debugger', name: 'Debugger', icon: Bug, description: 'Helps find and fix errors' },
  { id: 'optimizer', name: 'Optimizer', icon: Zap, description: 'Improves code performance' },
  { id: 'explainer', name: 'Explainer', icon: BookOpen, description: 'Explains complex concepts' },
  { id: 'architect', name: 'Architect', icon: Cpu, description: 'Designs system architecture' }
] as const;

type ToolMode =
  | 'chat'
  | AIToolMode;

const QUICK_ACTIONS = [
  ...AI_TOOLS,
  { id: 'debug', name: 'Find Bugs', icon: Bug, mode: 'chat' as const, prompt: 'Find bugs, edge cases, and logic risks in this code.' },
  { id: 'hint', name: 'Get a Hint', icon: Lightbulb, mode: 'chat' as const, prompt: 'Give me a subtle hint without giving away the full solution.' },
] as const;

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

const INPUT_TIP = `> ⚠️ **Program Waiting for Input**
>
> Your program is trying to read from **Standard Input** (e.g., \`Scanner\`, \`input()\`).
>
> **Fix:**
> 1. Look for the **Program Input (stdin)** box.
> 2. Type your input values there.
> 3. Click **Run** again to execute with the input.`;

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code || '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <div className="relative group my-4">
      <div className="absolute top-0 right-0 p-2 z-10 flex items-center gap-2">
        <AnimatePresence>
          {copied && (
            <motion.span
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded border border-green-500/20 backdrop-blur-sm"
            >
              Copied!
            </motion.span>
          )}
        </AnimatePresence>
        <button
          onClick={handleCopy}
          className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-400 hover:text-white transition-all backdrop-blur-md"
        >
          {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
        </button>
      </div>
      <pre className="bg-black/40 border border-white/5 rounded-xl p-4 overflow-x-auto text-sm custom-scrollbar">
        <code className={`language-${language} font-mono`}>{code}</code>
      </pre>
    </div>
  );
}

// Memoized message item to prevent lag
const MessageItem = React.memo(({ 
  message, 
  currentLanguage 
}: { 
  message: Message; 
  currentLanguage: string; 
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [message.content]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "flex gap-4 group",
        message.role === 'user' ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div className={cn(
        "w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg transition-transform group-hover:scale-110",
        message.role === 'user' 
          ? "bg-gradient-to-br from-cyan-400 to-cyan-600 text-white" 
          : "bg-gradient-to-br from-[#A855F7] to-[#7C3AED] text-white"
      )}>
        {message.role === 'user' ? <User size={18} /> : <Brain size={18} />}
      </div>
      
      <div className={cn(
        "max-w-[85%] min-w-0 rounded-3xl p-5 relative transition-all duration-300 overflow-hidden",
        message.role === 'user'
          ? "bg-cyan-500/10 border border-cyan-500/20 text-white rounded-tr-none"
          : "bg-white/[0.03] border border-white/5 text-gray-200 backdrop-blur-md rounded-tl-none hover:bg-white/[0.05]"
      )}>
        <div className="text-[13px] leading-relaxed prose prose-invert prose-headings:text-white prose-p:text-inherit prose-code:text-cyan-400 prose-pre:bg-transparent max-w-none break-words">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code: ({ className, children, ...props }: { className?: string; children?: React.ReactNode }) => {
                const match = /language-(\w+)/.exec(className || '');
                const language = match ? match[1] : currentLanguage;
                const isInline = !className?.includes('language-');
                
                if (!isInline && children) {
                  return <CodeBlock code={String(children).replace(/\n$/, '')} language={language} />;
                }
                
                return (
                  <code className="bg-white/5 px-2 py-0.5 rounded-lg text-cyan-400 font-mono text-[12px] border border-white/5" {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        
        <div className={cn(
          "mt-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity",
          message.role === 'user' ? "flex-row-reverse" : "flex-row"
        )}>
          <span className="text-[8px] opacity-30 uppercase font-black tracking-widest">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {message.role === 'assistant' && (
            <div className="flex items-center gap-2">
              <button onClick={handleCopy} className="p-1 hover:text-cyan-400 transition-colors">
                {copied ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

MessageItem.displayName = 'MessageItem';

export default function EnhancedAIAssistant({
  files, activeFileCode, activeFileName, currentStepExplanation, lastResult, selectedCode, initialPrompt, onClearInitialPrompt
}: AIAssistantProps) {
  const themeClasses = useThemeClasses();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `# 🚀 Welcome to CodeVisualizer AI

I'm your coding workspace assistant. Pick a tool below and I will analyze the current file without changing or breaking your program:

- Code Explainer
- Code Simplifier
- Code Visualizer
- Logic Visualizer
- Documentation Generator
- Dependency Resolver
- Complexity Estimator
- Data Structure Designer
- AI Big-O Analyzer

The app also auto-detects language from file name and code content.`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [activePersona, setActivePersona] = useState('mentor');
  const [toolsOpen, setToolsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const getLanguageFromFileName = (filename?: string): SupportedLanguage => {
    if (!filename) return 'python';
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: Record<string, SupportedLanguage> = {
      'py': 'python', 'js': 'javascript', 'ts': 'typescript',
      'cpp': 'cpp', 'c': 'c', 'java': 'java', 'rs': 'rust',
      'go': 'go', 'cs': 'csharp', 'rb': 'ruby', 'php': 'php'
    };
    return langMap[ext || ''] || 'python';
  };

  const currentLanguage = getLanguageFromFileName(activeFileName);

  useEffect(() => {
    if (initialPrompt && initialPrompt !== input) {
      setInput(initialPrompt);
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [initialPrompt, onClearInitialPrompt]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingMessage]);

  useEffect(() => {
    if (!isInputError(lastResult)) return;
    const inputTipMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: INPUT_TIP,
      timestamp: new Date()
    };
    setMessages(prev => {
      if (prev.some(m => m.content === INPUT_TIP)) return prev;
      return [...prev, inputTipMessage];
    });
  }, [lastResult]);

  const buildContextPrompt = useCallback(() => {
    const languageConfig = getLanguageConfig(currentLanguage);
    const executionError = lastResult?.error || lastResult?.run?.stderr || '';
    const executionOutput = lastResult?.run?.stdout || '';
    
    let context = `# Code Context\n\n`;
    context += `**Language:** ${languageConfig.name} (${currentLanguage})\n`;
    context += `**Active File:** ${activeFileName || 'untitled'}\n\n`;
    
    if (activeFileCode) {
      context += `## Current Code\n\`\`\`${currentLanguage}\n${activeFileCode}\n\`\`\`\n\n`;
    }
    
    if (selectedCode) {
      context += `## Selected Code\n\`\`\`${currentLanguage}\n${selectedCode}\n\`\`\`\n\n`;
    }
    
    if (currentStepExplanation) {
      context += `## Current Execution Step\n${currentStepExplanation}\n\n`;
    }
    
    if (executionError) {
      context += `## Latest Error\n\`\`\`\n${executionError}\n\`\`\`\n\n`;
    }
    
    if (executionOutput) {
      context += `## Latest Output\n\`\`\`\n${executionOutput}\n\`\`\`\n\n`;
    }
    
    // Add file structure context
    if (files.length > 0) {
      context += `## Project Structure\n`;
      files.forEach(file => {
        if (file.type === 'file') {
          context += `- ${file.name} (${file.language || 'unknown'})\n`;
        }
      });
      context += '\n';
    }
    
    return context;
  }, [activeFileCode, activeFileName, selectedCode, currentStepExplanation, lastResult, files, currentLanguage]);

  const getPersonaPrompt = useCallback((persona: string) => {
    const personas = {
      mentor: `You are a friendly, knowledgeable, and encouraging coding friend. Your tone is conversational, supportive, and humanized. You want the user to succeed and feel confident in their coding journey. You explain things like a friend would over a cup of coffee.`,
      
      debugger: `You are a friendly debugging buddy. You're patient and helpful, helping the user find bugs without making them feel bad. You guide them through the debugging process with a positive attitude.`,
      
      optimizer: `You are a performance-obsessed but friendly friend. You love making things faster and more efficient, and you're excited to share your knowledge with your friend in a clear and helpful way.`,
      
      explainer: `You are a clear-thinking friend who is great at explaining complex things. You use simple language and helpful analogies, making sure your friend really "gets it".`,
      
      architect: `You are a visionary friend who loves thinking about the big picture. You're excited to help your friend design great systems and follow best practices.`
    };
    
    return personas[persona as keyof typeof personas] || personas.mentor;
  }, []);

  const handleSend = async (customPrompt?: string, mode: ToolMode = 'chat'): Promise<void> => {
    const text = customPrompt || input;
    if (!text?.trim() || loading) return;

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
      context: {
        code: activeFileCode,
        language: currentLanguage,
        error: lastResult?.error,
        stepExplanation: currentStepExplanation
      }
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setStreamingMessage('');

    try {
      const contextPrompt = buildContextPrompt();
      const personaPrompt = getPersonaPrompt(activePersona);
      
      const systemPrompt = `${personaPrompt}

${contextPrompt}

Please provide a helpful, detailed response that addresses the user's question while considering the provided context. Use markdown formatting for better readability. Include code examples where relevant.`;

      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.filter(m => m.role !== 'system').map(m => ({
              role: m.role,
              content: m.content
            })),
            { role: 'user', content: text }
          ],
          context: contextPrompt,
          mode,
          model: localStorage.getItem('codevisualizer-ai-model')?.includes('llama-3.1')
            ? 'openrouter/free'
            : localStorage.getItem('codevisualizer-ai-model') || 'openrouter/free',
          stream: true
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Connection failure. Ensure PUTER_API_KEY or OPENROUTER_API_KEY is configured in your environment.');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = '';

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            accumulatedResponse += chunk;
            setStreamingMessage(accumulatedResponse);
          }
        } finally {
          reader.releaseLock();
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: accumulatedResponse,
        timestamp: new Date(),
        context: {
          code: activeFileCode,
          language: currentLanguage,
          error: lastResult?.error,
          stepExplanation: currentStepExplanation
        }
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        // eslint-disable-next-line no-console
        console.log('Request aborted');
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `### ⚠️ Connection Interrupted\n\nI encountered an error: **${error instanceof Error ? error.message : String(error)}**.\n\n**Quick Fix:**\n- Ensure you have configured your environment variables.\n- Use **Puter Free OpenAI API** for unlimited access. Visit [Puter Dashboard](https://puter.com) to get your token and set it as \`PUTER_API_KEY\`.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setLoading(false);
      setStreamingMessage('');
      abortControllerRef.current = null;
    }
  };

  const handleQuickAction = (action: typeof QUICK_ACTIONS[number]): void => {
    setToolsOpen(false);
    handleSend(action.prompt, action.mode);
  };

  const handleClear = (): void => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: `# 🚀 Welcome to CodeVisualizer AI

Pick a tool below and I will analyze the active file without changing or breaking your program:

- Code Explainer
- Code Simplifier
- Code Visualizer
- Logic Visualizer
- Documentation Generator
- Dependency Resolver
- Complexity Estimator
- Data Structure Designer
- AI Big-O Analyzer

The app also auto-detects language from file name and code content.`,
        timestamp: new Date()
      }
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cn("h-full flex flex-col bg-[#0B0D17] border-l border-white/5", themeClasses.bg)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#A855F7]/20 rounded-xl text-[#A855F7]">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-tighter text-white">AI Mentor</h2>
            <p className="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em]">Always Online • GPT-4o</p>
          </div>
        </div>
        <button 
          onClick={handleClear}
          className="p-2 hover:bg-white/5 rounded-xl text-white/30 hover:text-red-400 transition-all"
          title="Clear Conversation"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar scroll-smooth">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full animate-pulse" />
              <div className="relative p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl">
                <Brain size={48} className="text-cyan-500" />
              </div>
            </div>
            <h3 className="text-lg font-black uppercase tracking-tighter text-white mb-2">Hello, I'm your Mentor</h3>
            <p className="text-xs text-white/40 max-w-[200px] leading-relaxed">
              Ask me anything about your code, algorithms, or even the weather. I'm here to help!
            </p>
          </div>
        )}
        
        {messages.map((message) => (
          <MessageItem 
            key={message.id} 
            message={message} 
            currentLanguage={currentLanguage}
          />
        ))}
        {streamingMessage && (
          <MessageItem 
            message={{
              id: 'streaming',
              role: 'assistant',
              content: streamingMessage,
              timestamp: new Date()
            }} 
            currentLanguage={currentLanguage}
          />
        )}
        {loading && !streamingMessage && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
              <Brain size={16} className="text-cyan-500 animate-pulse" />
            </div>
            <div className="bg-white/5 border border-white/5 h-12 w-24 rounded-2xl animate-pulse" />
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="px-4 pb-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action as any)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl whitespace-nowrap text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
            >
              <action.icon size={12} className="text-cyan-500" />
              {action.name}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 pt-2">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={1}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-4 pr-14 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 transition-all resize-none custom-scrollbar"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-xl transition-all",
              input.trim() 
                ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20 hover:scale-105" 
                : "bg-white/5 text-white/20"
            )}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
        <p className="mt-2 text-[8px] text-center font-black uppercase tracking-[0.3em] text-white/10">
          Powered by GPT-4o • Shift + Enter for new line
        </p>
      </div>
    </div>
  );
}
