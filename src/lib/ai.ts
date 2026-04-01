/** AI integration via OpenRouter API */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  error?: string;
}

export async function callAI(
  messages: AIMessage[],
  apiKey: string,
  model: string = 'google/gemini-2.0-flash-001'
): Promise<AIResponse> {
  if (!apiKey || apiKey === 'your_key_here') {
    return { content: '', error: 'No OpenRouter API key configured. Add it in Settings.' };
  }

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://codevisualizer.dev',
        'X-Title': 'CodeVisualizer',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 2048,
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { content: '', error: `AI API error (${res.status}): ${errText}` };
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    return { content };
  } catch (err: any) {
    return { content: '', error: `AI request failed: ${err.message}` };
  }
}

/** Explain code line by line for beginners */
export function buildExplainPrompt(code: string, language: string): AIMessage[] {
  return [
    {
      role: 'system',
      content: 'You are a friendly coding tutor. Explain code step by step in very simple language that a beginner can understand. Use analogies and examples. Format your response with numbered lines.',
    },
    {
      role: 'user',
      content: `Explain this ${language} code line by line:\n\n\`\`\`${language}\n${code}\n\`\`\``,
    },
  ];
}

/** Optimize code */
export function buildOptimizePrompt(code: string, language: string): AIMessage[] {
  return [
    {
      role: 'system',
      content: 'You are an algorithm optimization expert. Analyze the given code and suggest improvements for time and space complexity. Provide the optimized code.',
    },
    {
      role: 'user',
      content: `Optimize this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``,
    },
  ];
}

/** Analyze complexity with AI */
export function buildComplexityPrompt(code: string, language: string): AIMessage[] {
  return [
    {
      role: 'system',
      content: 'You are a complexity analysis expert. Analyze the given code and return the time complexity, space complexity, and a brief explanation. Format: Time: O(...), Space: O(...), Explanation: ...',
    },
    {
      role: 'user',
      content: `Analyze the complexity of this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``,
    },
  ];
}

/** Generate hints for a problem */
export function buildHintPrompt(problemTitle: string, problemDescription: string, userCode?: string): AIMessage[] {
  return [
    {
      role: 'system',
      content: 'You are an educational AI. Generate 3 progressive hints for the given problem. Hint 1: High-level approach. Hint 2: Key observation or pseudo-code. Hint 3: Almost full implementation logic. Do NOT provide the full final code. Be encouraging.',
    },
    {
      role: 'user',
      content: `Generate hints for the problem "${problemTitle}".\n\nDescription:\n${problemDescription}\n\n${userCode ? `Current User Code:\n${userCode}` : ''}`,
    },
  ];
}

/** Code Review */
export function buildCodeReviewPrompt(code: string, language: string): AIMessage[] {
  return [
    {
      role: 'system',
      content: 'You are an elite code reviewer. Review the given code for style, efficiency, edge cases, and best practices. Provide a concise summary and specific suggestions.',
    },
    {
      role: 'user',
      content: `Review this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``,
    },
  ];
}
