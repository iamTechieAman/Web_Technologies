import fs from 'fs';
import path from 'path';
import { callAI, buildHintPrompt } from '../src/lib/ai';

const PROBLEMS_FILE = path.join(process.cwd(), 'src/data/problems.json');
const API_KEY = process.env.OPENROUTER_API_KEY || '';

async function main() {
  if (!API_KEY) {
    console.error('OPENROUTER_API_KEY not found in environment.');
    return;
  }

  const problems = JSON.parse(fs.readFileSync(PROBLEMS_FILE, 'utf8'));
  console.log(`[Hints] Processing ${problems.length} problems...`);

  for (const problem of problems) {
    if (problem.hints && problem.hints.length > 0) continue;

    console.log(`[Hints] Generating for: ${problem.title}`);
    const prompt = buildHintPrompt(problem.title, problem.description);
    const res = await callAI(prompt, API_KEY);

    if (res.content) {
      // Very simple parsing of "Hint 1:", "Hint 2:", etc.
      const hints = res.content.split(/Hint \d:?/i).filter(h => h.trim()).map(h => h.trim());
      problem.hints = hints.slice(0, 3);
      console.log(`[Hints] Success for ${problem.title}`);
    }

    await new Promise(r => setTimeout(r, 1000)); // Rate limit
    
    // Save incrementally
    fs.writeFileSync(PROBLEMS_FILE, JSON.stringify(problems, null, 2));
  }
}

main();
