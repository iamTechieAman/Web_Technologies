import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

/**
 * CodeMap API Service
 * Specializes in generating DOT notation for architectural visualization.
 */
const PROVIDERS = [
  {
    name: 'Groq',
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']
  },
  {
    name: 'Google',
    apiKey: process.env.GOOGLE_API_KEY,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    models: ['gemini-1.5-flash']
  },
  {
    name: 'OpenRouter',
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    models: ['meta-llama/llama-3.2-3b-instruct:free', 'google/gemma-2-9b-it:free']
  }
];

const CODEMAP_SYSTEM_PROMPT = `You are a code analysis expert. Analyze the following code and produce a valid DOT notation graph that visualizes its structure and relationships.

Rules:
- Create nodes for each function, class, module, and important variable.
- Create edges for function calls, inheritance, and data flow.
- Use clusters (subgraph cluster_X) to group related elements.
- Use colors: functions=lightblue, classes=lightgreen, variables=lightyellow.
- Output ONLY the DOT code, nothing else — no explanations, no markdown fences.
- Ensure the output is valid DOT syntax that can be rendered by Graphviz.`;

function generateLocalDot(code: string, language = 'code'): string {
  const lines = (code || '').split('\n').filter(l => l.trim());
  const nodes = ['  root [label="Program Entry", shape=Mdiamond, style=filled, fillcolor="#0ea5e9", fontcolor=white];'];
  const edges: string[] = [];
  
  // Basic heuristic analysis
  const matches = [
    { type: 'class', regex: /\b(?:class|interface)\s+([A-Z]\w*)/g, color: '#22c55e' },
    { type: 'function', regex: /\b(?:function|def|fn)\s+([a-z_]\w*)/g, color: '#3b82f6' }
  ];

  matches.forEach(m => {
    let match;
    while ((match = m.regex.exec(code)) !== null) {
      const id = `node_${Math.random().toString(36).slice(2, 7)}`;
      nodes.push(`  ${id} [label="${m.type}: ${match[1]}", shape=rect, style="filled,rounded", fillcolor="${m.color}1a", color="${m.color}", fontcolor=white];`);
      edges.push(`  root -> ${id} [color="#334155"];`);
    }
  });

  return `digraph CodeMap {\n  rankdir=LR;\n  bgcolor="#0B0D17";\n  node [fontname="Inter", fontsize=10];\n${nodes.join('\n')}\n${edges.join('\n')}\n}`;
}

export async function POST(req: NextRequest) {
  try {
    const { code, language } = await req.json();
    if (!code) return NextResponse.json({ error: 'Code is required' }, { status: 400 });

    let dotOutput = '';

    for (const provider of PROVIDERS) {
      if (!provider.apiKey) continue;

      const client = new OpenAI({ 
        baseURL: provider.baseURL, 
        apiKey: provider.apiKey 
      });

      for (const model of provider.models) {
        try {
          const response = await client.chat.completions.create({
            model: model,
            messages: [
              { role: 'system', content: CODEMAP_SYSTEM_PROMPT },
              { role: 'user', content: `Language: ${language}\n\nCode:\n${code}` }
            ],
            temperature: 0.1,
            max_tokens: 1500
          });

          dotOutput = response.choices[0]?.message?.content || '';
          if (dotOutput.includes('digraph')) break;
        } catch (err) {
          console.warn(`[CodeMap] ${provider.name} failed:`, (err as Error).message);
        }
      }
      if (dotOutput.includes('digraph')) break;
    }

    // Cleanup and validation
    dotOutput = dotOutput.replace(/```dot/g, '').replace(/```gv/g, '').replace(/```/g, '').trim();
    
    if (!dotOutput.includes('digraph')) {
      return NextResponse.json({ dot: generateLocalDot(code, language) });
    }

    return NextResponse.json({ dot: dotOutput });
  } catch (error: any) {
    console.error('[CodeMap API Error]:', error);
    return NextResponse.json({ error: 'Failed to generate map' }, { status: 500 });
  }
}
