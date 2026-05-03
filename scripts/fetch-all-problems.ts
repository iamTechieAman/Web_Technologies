import axios from 'axios';
import fs from 'fs';
import path from 'path';

const LEETCODE_GRAPHQL_URL = 'https://leetcode.com/graphql';
const OUTPUT_PATHS = [
  path.join(process.cwd(), 'src', 'data', 'problems.json'),
  path.join(process.cwd(), 'data', 'problems.json'),
];
const BATCH_SIZE = Number(process.env.LEETCODE_BATCH_SIZE || 100);
const DETAIL_DELAY_MS = Number(process.env.LEETCODE_DELAY_MS || 75);
const MAX_PROBLEMS = process.env.LEETCODE_MAX_PROBLEMS
  ? Number(process.env.LEETCODE_MAX_PROBLEMS)
  : Number.POSITIVE_INFINITY;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchProblemList(limit = 100, skip = 0) {
  const query = `
    query questionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
      questionList(
        categorySlug: $categorySlug
        limit: $limit
        skip: $skip
        filters: $filters
      ) {
        totalNum
        questions {
          title
          titleSlug
          difficulty
          status
          isPaidOnly
          topicTags {
            name
            slug
          }
        }
      }
    }
  `;

  const variables = {
    categorySlug: '',
    skip,
    limit,
    filters: {}
  };

  try {
    const res = await axios.post(LEETCODE_GRAPHQL_URL, { query, variables }, {
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com/problemset/',
        'User-Agent': 'CodeVisualizer Problem Importer',
      },
      timeout: 30000,
    });
    return res.data.data.questionList;
  } catch (err) {
    console.error('Error fetching problem list:', err);
    return null;
  }
}

async function fetchProblemDetails(titleSlug: string) {
  const query = `
    query questionData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionId
        title
        titleSlug
        content
        difficulty
        exampleTestcases
        topicTags {
          name
          slug
        }
        hints
        stats
      }
    }
  `;

  const variables = { titleSlug };

  try {
    const res = await axios.post(LEETCODE_GRAPHQL_URL, { query, variables }, {
      headers: {
        'Content-Type': 'application/json',
        'Referer': `https://leetcode.com/problems/${titleSlug}/`,
        'User-Agent': 'CodeVisualizer Problem Importer',
      },
      timeout: 30000,
    });
    return res.data.data.question;
  } catch (err) {
    console.error(`Error fetching details for ${titleSlug}:`, err);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting LeetCode problem scraper...');
  
  const allProblems: any[] = [];
  const limit = BATCH_SIZE;
  let skip = 0;
  let total = 1;

  while (skip < total && allProblems.length < MAX_PROBLEMS) {
    console.log(`📦 Fetching list (skip: ${skip}, collected: ${allProblems.length})...`);
    const listData = await fetchProblemList(limit, skip);
    if (!listData) break;

    total = listData.totalNum;
    const questions = listData.questions.filter((q: any) => !q.isPaidOnly);

    for (const q of questions) {
      if (allProblems.length >= MAX_PROBLEMS) break;
      
      console.log(`🔍 Fetching details: ${q.titleSlug}...`);
      const details = await fetchProblemDetails(q.titleSlug);
      if (details) {
        allProblems.push({
          id: details.questionFrontendId || details.questionId,
          slug: q.titleSlug,
          titleSlug: q.titleSlug,
          title: details.title || q.title,
          difficulty: details.difficulty || q.difficulty,
          topicTags: details.topicTags || q.topicTags || [],
          tags: (details.topicTags || q.topicTags || []).map((tag: any) => tag.name),
          descriptionHtml: details.content || '',
          description: '',
          exampleTestcases: details.exampleTestcases || '',
          hints: details.hints || [],
          leetcodeUrl: `https://leetcode.com/problems/${q.titleSlug}/`,
          source: 'leetcode',
          isPaidOnly: false,
        });
      }
      await sleep(DETAIL_DELAY_MS);
    }

    skip += limit;
  }

  for (const dataPath of OUTPUT_PATHS) {
    const dataDir = path.dirname(dataPath);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(dataPath, JSON.stringify(allProblems, null, 2));
    console.log(`✅ Saved ${allProblems.length} problems to ${dataPath}`);
  }
}

main().catch(console.error);
