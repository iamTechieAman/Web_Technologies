import axios from 'axios';

const LEETCODE_GQL_URL = 'https://leetcode.com/graphql';

export async function fetchAllLeetCodeProblems(limit = 100, skip = 0) {
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
          acRate
          difficulty
          freqBar
          questionFrontendId
          isFavor
          isPaidOnly
          status
          title
          titleSlug
          topicTags {
            name
            id
            slug
          }
          hasSolution
          hasVideoSolution
        }
      }
    }
  `;

  const variables = {
    categorySlug: "",
    skip,
    limit,
    filters: {}
  };

  try {
    const res = await axios.post(LEETCODE_GQL_URL, { query, variables });
    return res.data.data.problemsetQuestionList;
  } catch (err) {
    console.error('LeetCode GQL Error:', err);
    return { questions: [], total: 0 };
  }
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
        topicTags {
          name
        }
        hints
        exampleTestcases
        codeSnippets {
          lang
          langSlug
          code
        }
        stats
      }
    }
  `;

  try {
    const res = await axios.post(LEETCODE_GQL_URL, { query, variables: { titleSlug } });
    return res.data.data.question;
  } catch (err) {
    console.error(`Error fetching details for ${titleSlug}:`, err);
    return null;
  }
}
