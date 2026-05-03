/**
 * Generalized Scraper Utilities
 */
import { safeArray, safeAsync } from './safe';

export interface ScrapedProblem {
  title: string;
  slug: string;
  difficulty: 'Beginner' | 'Easy' | 'Medium' | 'Hard' | 'Expert';
  tags: string[];
  companies: string[];
  description: string;
  hints: string[];
  exampleTestcases: string[];
  constraints: string[];
  templates: Record<string, string>;
  source: string;
  sourceUrl: string;
}

export async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3, delay = 1000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 429) {
        const wait = delay * Math.pow(2, i);
        console.warn(`[Scraper] 429 Rate Limit on ${url}. Waiting ${wait}ms...`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      return response;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error(`Failed to fetch ${url} after ${retries} retries`);
}

export async function fetchLeetCodeProblems(limit = 100) {
  const query = `
    query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
      problemsetQuestionList: questionList(
        categorySlug: $categorySlug
        limit: $limit
        skip: $skip
        filters: $filters
      ) {
        total: totalNum
        questions: data {
          id: questionId
          title
          titleSlug
          difficulty
          topicTags { name }
        }
      }
    }
  `;

  const res = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      variables: { categorySlug: "", limit, skip: 0, filters: {} }
    })
  });
  const data = await safeAsync<Record<string, any> | null>(() => res.json(), null);
  return safeArray(data?.data?.problemsetQuestionList?.questions);
}

export async function fetchLeetCodeProblemDetails(titleSlug: string) {
  const query = `
    query questionData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionId
        questionFrontendId
        title
        titleSlug
        content
        difficulty
        topicTags { name }
        hints
        exampleTestcases
        codeSnippets {
          lang
          langSlug
          code
        }
      }
    }
  `;

  const res = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { titleSlug } })
  });
  const data = await safeAsync<Record<string, any> | null>(() => res.json(), null);
  return data?.data?.question ?? null;
}

export function cleanHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_m, p1) => `\n\`\`\`\n${p1.replace(/<[^>]+>/g, '')}\n\`\`\`\n`)
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, ' `$1` ')
    .replace(/<p[^>]*>/gi, '\n\n')
    .replace(/<br[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}
