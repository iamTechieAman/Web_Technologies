export const PISTON_URL = 'https://emkc.org/api/v2/piston/execute';
export const JUDGE0_CE_URL = 'https://ce.judge0.com';
export const LEETCODE_GRAPHQL_URL = 'https://leetcode.com/graphql';

export const AI_CONFIG = {
  defaultModel: 'openai/gpt-3.5-turbo',
  maxTokens: 1500,
  systemPrompt: `You are CodeVisualizer AI, a senior software engineer and competitive programmer.
Your goal is to help users master Data Structures and Algorithms.
Provide clean, optimized code examples. Explain time and space complexity.
When helping with a bug, guide the user to the solution rather than just giving it.`,
};

export const UI_CONFIG = {
  themes: ['dark', 'light'] as const,
  defaultTheme: 'dark',
};
