import { Groq } from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

/**
 * AI Provider Interface
 */
export interface AIProviderResponse {
  stream: ReadableStream;
  provider: string;
  model: string;
}

/**
 * Groq Provider (Native SDK)
 */
export async function streamGroq(messages: any[], apiKey: string): Promise<AIProviderResponse> {
  const groq = new Groq({ apiKey });
  const model = 'llama-3.3-70b-versatile';
  
  const completion = await groq.chat.completions.create({
    messages,
    model,
    stream: true,
    temperature: 0.2,
    max_tokens: 2048,
  });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) controller.enqueue(encoder.encode(content));
        }
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });

  return { stream, provider: 'Groq', model };
}

/**
 * Google Gemini Provider (Native SDK)
 */
export async function streamGemini(messages: any[], apiKey: string): Promise<AIProviderResponse> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = 'gemini-1.5-flash';
  const model = genAI.getGenerativeModel({ model: modelName });

  // Convert messages to Gemini format
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const result = await model.generateContentStream({
    contents,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 2048,
    },
  });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of result.stream) {
          const content = chunk.text();
          if (content) controller.enqueue(encoder.encode(content));
        }
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });

  return { stream, provider: 'Gemini', model: modelName };
}

/**
 * OpenRouter Provider (via OpenAI SDK)
 */
export async function streamOpenRouter(messages: any[], apiKey: string): Promise<AIProviderResponse> {
  const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey,
    defaultHeaders: {
      'HTTP-Referer': 'https://codevisualizer.dev',
      'X-Title': 'CodeVisualizer',
    }
  });

  const model = 'meta-llama/llama-3.2-3b-instruct:free';
  
  const completion = await openai.chat.completions.create({
    messages,
    model,
    stream: true,
    temperature: 0.2,
    max_tokens: 2048,
  });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) controller.enqueue(encoder.encode(content));
        }
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });

  return { stream, provider: 'OpenRouter', model };
}
