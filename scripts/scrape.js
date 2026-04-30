const axios = require('axios');
const fs = require('fs');
const path = require('path');

const LEETCODE_GRAPHQL_URL = 'https://leetcode.com/graphql';

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
        data {
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

  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://leetcode.com/problemset/all/'
  };

  try {
    const res = await axios.post(LEETCODE_GRAPHQL_URL, { query, variables }, { headers });
    return res.data.data.questionList;
  } catch (err) {
    console.error('Error fetching problem list:', err.message);
    if (err.response) console.error('Response data:', err.response.data);
    return null;
  }
}

async function fetchProblemDetails(titleSlug) {
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
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': `https://leetcode.com/problems/${titleSlug}/`
  };

  try {
    const res = await axios.post(LEETCODE_GRAPHQL_URL, { query, variables }, { headers });
    return res.data.data.question;
  } catch (err) {
    console.error(`Error fetching details for ${titleSlug}:`, err.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting LeetCode problem scraper...');
  
  const allProblems = [];
  const limit = 50;
  let skip = 0;
  let total = 1;
  const MAX_PROBLEMS = 50; 

  while (skip < total && allProblems.length < MAX_PROBLEMS) {
    console.log(`📦 Fetching list (skip: ${skip})...`);
    const listData = await fetchProblemList(limit, skip);
    if (!listData) break;

    total = listData.totalNum;
    const questions = listData.data.filter(q => !q.isPaidOnly);

    for (const q of questions) {
      if (allProblems.length >= MAX_PROBLEMS) break;
      
      console.log(`🔍 Fetching details: ${q.titleSlug}...`);
      const details = await fetchProblemDetails(q.titleSlug);
      if (details) {
        allProblems.push({
          ...q,
          ...details,
          descriptionHtml: details.content,
          slug: q.titleSlug
        });
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    skip += limit;
  }

  const dataDir = path.join(process.cwd(), 'src', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  
  const dataPath = path.join(dataDir, 'problems.json');
  fs.writeFileSync(dataPath, JSON.stringify(allProblems, null, 2));
  console.log(`✅ Successfully saved ${allProblems.length} problems to ${dataPath}`);
}

main().catch(console.error);
