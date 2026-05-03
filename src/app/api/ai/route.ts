import { NextRequest } from 'next/server';
import { 
  streamGroq, streamGemini, streamOpenRouter, AIProviderResponse 
} from '@/lib/aiProviders';

/**
 * AI Service Configuration
 */
const PROVIDERS_CONFIG = [
  { name: 'Groq', apiKey: process.env.GROQ_API_KEY, runner: streamGroq },
  { name: 'Google', apiKey: process.env.GOOGLE_API_KEY, runner: streamGemini },
  { name: 'OpenRouter', apiKey: process.env.OPENROUTER_API_KEY, runner: streamOpenRouter }
];

const SYSTEM_PROMPT = `You are CodeVisualizer AI, a world-class programming mentor and engineering partner. 
Your goal is to help users understand, debug, and optimize their code through friendly, insightful, and actionable advice.

CORE GUIDELINES:
1. **Friendly & Encouraging**: Speak like a senior developer who is also a close friend. Use a supportive, humanized tone.
2. **Context-Aware**: You have full access to the user's active file, project structure, and latest execution results. Reference these details naturally.
3. **Actionable Insights**: Don't just point out problems; suggest specific fixes. Provide code snippets that are clean, efficient, and well-commented.
4. **Visual Learning**: When explaining structure, mention the "Code Map" tab for a visual representation of relationships.
5. **No Restrictions**: Answer any technical or general question the user has. Be helpful without being preachy.
6. **Error Handling**: If an execution error is present in the context, explain it clearly and suggest how to fix it. If the error is input-related (e.g., Scanner waiting), remind them to use the Stdin box.

FORMATTING:
- Use Markdown for everything.
- Use bold text for key concepts.
- Use code blocks for all code snippets, specifying the language.
- Use tables or lists for complex comparisons or feature breakdowns.
- Keep responses concise but comprehensive.`;

type AIToolMode =
  | 'chat' | 'explain' | 'simplify' | 'code-visualizer' | 'logic-visualizer' 
  | 'documentation' | 'dependency-resolver' | 'complexity' | 'data-structure' 
  | 'big-o' | 'edit';

function extractContextField(context = '', heading: string): string {
  const pattern = new RegExp(`## ${heading}\\n(?:\\\`\\\`\\\`\\w*\\n)?([\\s\\S]*?)(?:\\n\\\`\\\`\\\`)?\\n\\n## |## ${heading}\\n(?:\\\`\\\`\\\`\\w*\\n)?([\\s\\S]*)`, 'i');
  const match = context.match(pattern);
  return (match?.[1] || match?.[2] || '').replace(/```\s*$/g, '').trim();
}

function getCurrentCode(context = ''): string {
  return extractContextField(context, 'Current Code') || extractContextField(context, 'Selected Code');
}

function estimateComplexityFromCode(code: string): { time: string; space: string; notes: string[] } {
  const normalized = code || '';
  const loopCount = (normalized.match(/\b(for|while)\b/g) || []).length;
  const hasNestedLoop = /\b(for|while)\b[\s\S]{0,500}\b(for|while)\b/.test(normalized);
  const hasCollection = /\b(list|dict|set|Map|HashMap|ArrayList|vector|unordered_map|Set|Record|Array)\b|[\[{]/.test(normalized);

  let time = loopCount > 0 ? (hasNestedLoop ? 'O(n^2)' : 'O(n)') : 'O(1)';
  const notes: string[] = [];
  if (hasNestedLoop) notes.push('Nested loop pattern detected.');
  else if (loopCount > 0) notes.push('Single-pass loop pattern detected.');

  return { time, space: hasCollection ? 'O(n)' : 'O(1)', notes };
}

function getLocalToolResponse(mode: AIToolMode, messages: any[], context = ''): string {
  const code = getCurrentCode(context);
  const complexity = estimateComplexityFromCode(code);
  const codeFence = code ? `\n\n\`\`\`\n${code.slice(0, 1000)}\n\`\`\`` : '';

  switch (mode) {
    case 'explain': return `## Code Explainer\n\nI'm analyzing your code statically right now. Run it to see real values change!${codeFence}`;
    case 'complexity': case 'big-o': return `## Complexity Analysis\n\n- Time: **${complexity.time}**\n- Space: **${complexity.space}**\n\n${complexity.notes.join('\n')}`;
    default: return `I'm your AI mentor! I'm currently in lightweight mode. To enable full AI power, ensure your API keys are correctly set in .env.local.`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages = [], context = '', mode = 'chat' } = await req.json();
    
    // Proactive hint detection
    let proactiveHint = '';
    if (context.toLowerCase().includes('nosuchelementexception') || context.toLowerCase().includes('scanner')) {
      proactiveHint = "\n\n💡 **Mentor Note:** Looks like your program is waiting for input! Just type your input in the terminal when it asks – it works exactly like your local terminal 😊";
    }

    const aiMessages = [
      { role: 'system' as const, content: `${SYSTEM_PROMPT}\n\nContext:\n${context}` },
      ...messages
    ];

    let response: AIProviderResponse | null = null;
    let lastError: any = null;

    // Try each provider in order
    for (const config of PROVIDERS_CONFIG) {
      if (!config.apiKey) continue;

      try {
        response = await config.runner(aiMessages, config.apiKey);
        console.log(`[AI] Success with ${config.name}`);
        break; 
      } catch (err: any) {
        lastError = err;
        console.warn(`[AI] ${config.name} failed:`, err.message);
      }
    }

    if (!response) {
      const fallback = getLocalToolResponse(mode as any, messages, context);
      return new Response(fallback + proactiveHint, {
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    return new Response(response.stream, {
      headers: {
        'X-AI-Provider': response.provider,
        'X-AI-Model': response.model
      }
    });

  } catch (error: any) {
    console.error('AI Route Error:', error);
    return new Response('AI is temporarily unavailable. Please try again in a moment.', { status: 500 });
  }
}
