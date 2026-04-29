import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || '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',
  defaultHeaders: {
    'HTTP-Referer': 'https://codevisualizer.dev',
    'X-Title': 'CodeVisualizer',
  }
});

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();

    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages must be an array' }, { status: 400 });
    }

    const systemPrompt = `You are the CodeVisualizer AI Mentor, a senior software architect and computer science professor. 
          Your goal is to help students understand DSA and software engineering through high-fidelity explanations.
          
          ${context ? `CONTEXT PROVIDED BY SYSTEM:\n${context}\n\n` : ''}
          
          Guidelines:
          1. Use clear, encouraging language.
          2. Break down complex problems into small, manageable steps.
          3. Provide line-by-line explanations for code snippets.
          4. Format your output with professional Markdown (bolding, code blocks).`;

    const response = await client.chat.completions.create({
      model: 'openai/gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        ...messages
      ],
      max_tokens: 1500,
      stream: true,
    });

    // Create a readable stream to pipe to the client
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content || '';
          controller.enqueue(new TextEncoder().encode(content));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (err: any) {
    console.error('[AI API Error]:', err);
    
    if (err?.status === 402) {
      return NextResponse.json({ 
        error: 'AI Mentor is currently resting (Balance exhausted). Please check back later!' 
      }, { status: 402 });
    }

    return NextResponse.json({ 
      error: 'AI Mentor is temporarily unavailable. Error: ' + (err.message || 'Unknown error')
    }, { status: 500 });
  }
}
