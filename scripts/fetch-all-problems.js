const axios = require('axios');
const fs = require('fs');
const path = require('path');

const LEETCODE_GRAPHQL_URL = 'https://leetcode.com/graphql';
const OUTPUT_PATHS = [
  path.join(process.cwd(), 'src', 'data', 'problems.json'),
  path.join(process.cwd(), 'data', 'problems.json'),
];
const BATCH_SIZE = Number(process.env.LEETCODE_BATCH_SIZE || 100);
const DETAIL_DELAY_MS = Number(process.env.LEETCODE_DELAY_MS || 75);
const DETAIL_CONCURRENCY = Number(process.env.LEETCODE_CONCURRENCY || 6);
const MAX_PROBLEMS = process.env.LEETCODE_MAX_PROBLEMS
  ? Number(process.env.LEETCODE_MAX_PROBLEMS)
  : Number.POSITIVE_INFINITY;

const headers = {
  'Content-Type': 'application/json',
  'Referer': 'https://leetcode.com/problemset/',
  'User-Agent': 'CodeVisualizer Problem Importer',
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchProblemList(limit = 100, skip = 0) {
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

  const variables = { categorySlug: '', skip, limit, filters: {} };
  const res = await axios.post(LEETCODE_GRAPHQL_URL, { query, variables }, { headers, timeout: 30000 });
  return res.data.data.problemsetQuestionList;
}

async function fetchProblemDetails(titleSlug) {
  const query = `
    query questionData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionId
        questionFrontendId
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
      }
    }
  `;

  const variables = { titleSlug };
  const res = await axios.post(LEETCODE_GRAPHQL_URL, { query, variables }, {
    headers: { ...headers, Referer: `https://leetcode.com/problems/${titleSlug}/` },
    timeout: 30000,
  });
  return res.data.data.question;
}

async function main() {
  console.log('Starting LeetCode problem import...');
  const allQuestions = [];
  const allProblems = [];
  let skip = 0;
  let total = 1;

  while (skip < total && allQuestions.length < MAX_PROBLEMS) {
    console.log(`Fetching list skip=${skip}, queued=${allQuestions.length}`);
    const listData = await fetchProblemList(BATCH_SIZE, skip);
    if (!listData) break;

    total = listData.total;
    const questions = listData.questions.filter(q => !q.isPaidOnly);
    allQuestions.push(...questions.slice(0, Math.max(0, MAX_PROBLEMS - allQuestions.length)));
    skip += BATCH_SIZE;
  }

  let nextIndex = 0;
  async function worker(workerId) {
    while (nextIndex < allQuestions.length) {
      const index = nextIndex++;
      const q = allQuestions[index];
      try {
        console.log(`[${index + 1}/${allQuestions.length}] Fetching ${q.titleSlug}`);
        const details = await fetchProblemDetails(q.titleSlug);
        if (details) {
          const topicTags = details.topicTags || q.topicTags || [];
          allProblems[index] = {
            id: details.questionFrontendId || details.questionId,
            slug: q.titleSlug,
            titleSlug: q.titleSlug,
            title: details.title || q.title,
            difficulty: details.difficulty || q.difficulty,
            topicTags,
            tags: topicTags.map(tag => tag.name),
            descriptionHtml: details.content || '',
            description: '',
            exampleTestcases: details.exampleTestcases || '',
            hints: details.hints || [],
            leetcodeUrl: `https://leetcode.com/problems/${q.titleSlug}/`,
            source: 'leetcode',
            isPaidOnly: false,
          };
        }
      } catch (err) {
        console.error(`Worker ${workerId} failed ${q.titleSlug}:`, err.message || err);
      }
      await sleep(DETAIL_DELAY_MS);
    }
  }

  await Promise.all(
    Array.from({ length: Math.max(1, DETAIL_CONCURRENCY) }, (_, index) => worker(index + 1)),
  );

  const completedProblems = allProblems.filter(Boolean);

  for (const dataPath of OUTPUT_PATHS) {
    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
    fs.writeFileSync(dataPath, JSON.stringify(completedProblems, null, 2));
    console.log(`Saved ${completedProblems.length} problems to ${dataPath}`);
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
