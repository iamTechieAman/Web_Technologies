import problemsData from '@/data/problems.json';
import type { Problem, SupportedLanguage } from '@/types';
import Fuse from 'fuse.js';

const problems = problemsData as Problem[];

const fuse = new Fuse(problems, {
  keys: ['title', 'tags', 'companies', 'description'],
  threshold: 0.3,
});

export function getAllProblems(): Problem[] {
  return problems;
}

export function getProblemBySlug(slug: string): Problem | undefined {
  const decodedSlug = decodeURIComponent(slug).toLowerCase();
  return problems.find((p) => 
    p.slug.toLowerCase() === decodedSlug || 
    p.id.toLowerCase() === decodedSlug ||
    p.slug === slug
  );
}

export function searchProblems(query: string): Problem[] {
  if (!query) return problems;
  return fuse.search(query).map((result) => result.item);
}

export function getSolutionCode(problem: Problem, language: SupportedLanguage): string {
  return problem.solutionCode?.[language] || '';
}

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return 'text-green-500 bg-green-500/10 border-green-500/20';
    case 'medium':
      return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    case 'hard':
      return 'text-red-500 bg-red-500/10 border-red-500/20';
    default:
      return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
  }
}
