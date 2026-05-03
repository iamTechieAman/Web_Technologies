/**
 * Centralized API client for CodeVisualizer external integrations
 */

export interface CarbonOptions {
  code: string;
  language?: string;
  theme?: string;
  backgroundColor?: string;
  dropShadow?: boolean;
  paddingVertical?: string;
  paddingHorizontal?: string;
}

const CARBON_API_URL = 'https://carbonara.vercel.app/api/cook';
const CODEFORCES_API_URL = 'https://codeforces.com/api';

export const apiClient = {
  /**
   * Export code as a beautiful image using Carbonara
   */
  async exportToImage(options: CarbonOptions): Promise<Blob> {
    try {
      const response = await fetch(CARBON_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: options.code,
          language: options.language || 'auto',
          theme: options.theme || 'seti',
          backgroundColor: options.backgroundColor || 'rgba(6, 182, 212, 0.1)',
          dropShadow: options.dropShadow ?? true,
          paddingVertical: options.paddingVertical || '56px',
          paddingHorizontal: options.paddingHorizontal || '56px',
        }),
      });

      if (!response.ok) {
        throw new Error(`Carbonara API error: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Failed to export image:', error);
      throw error;
    }
  },

  /**
   * Fetch random problems from Codeforces
   */
  async fetchCodeforcesProblems(count: number = 10) {
    try {
      const response = await fetch(`${CODEFORCES_API_URL}/problemset.problems`);
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error('Codeforces API returned an error');
      }

      // Filter and pick random problems
      const problems = data.result.problems
        .filter((p: any) => p.index === 'A' || p.index === 'B') // Easier problems for IDE demo
        .sort(() => 0.5 - Math.random())
        .slice(0, count);

      return problems.map((p: any) => ({
        id: p.contestId,
        title: p.name,
        slug: `cf-${p.contestId}-${p.index}`,
        difficulty: p.rating ? (p.rating < 1200 ? 'Easy' : p.rating < 1600 ? 'Medium' : 'Hard') : 'Unknown',
        tags: p.tags,
        url: `https://codeforces.com/contest/${p.contestId}/problem/${p.index}`
      }));
    } catch (error) {
      console.error('Failed to fetch Codeforces problems:', error);
      return [];
    }
  }
};
