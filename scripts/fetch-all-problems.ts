import axios from 'axios';
import fs from 'fs';
import path from 'path';

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
    const res = await axios.post(LEETCODE_GRAPHQL_URL, { query, variables });
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
    const res = await axios.post(LEETCODE_GRAPHQL_URL, { query, variables });
    return res.data.data.question;
  } catch (err) {
    console.error(`Error fetching details for ${titleSlug}:`, err);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting LeetCode problem scraper...');
  
  const allProblems: any[] = [];
  const limit = 100;
  let skip = 0;
  let total = 1;

  // For demo/dev purposes, we'll fetch the first 300 problems
  // In production, we'd loop until skip >= total
  const MAX_PROBLEMS = 300; 

  while (skip < total && allProblems.length < MAX_PROBLEMS) {
    console.log(`📦 Fetching list (skip: ${skip})...`);
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
          ...q,
          ...details,
          descriptionHtml: details.content
        });
      }
      // Delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    skip += limit;
  }

  const dataPath = path.join(process.cwd(), 'data', 'problems.json');
  fs.writeFileSync(dataPath, JSON.stringify(allProblems, null, 2));
  console.log(`✅ Successfully saved ${allProblems.length} problems to ${dataPath}`);
}

main().catch(console.error);
