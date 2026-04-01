import axios from 'axios';

const LEETCODE_GQL_URL = 'https://leetcode.com/graphql';

export const fetchProblemList = async (limit: number = 100, skip: number = 0) => {
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
          hasVideoSolution
          hasSolution
        }
      }
    }
  `;

  const variables = {
    categorySlug: "",
    skip: skip,
    limit: limit,
    filters: {}
  };

  const response = await axios.post(LEETCODE_GQL_URL, { query, variables });
  return response.data.data.problemsetQuestionList;
};

export const fetchProblemDetails = async (titleSlug: string) => {
  const query = `
    query questionData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionId
        questionFrontendId
        boundTopicId
        title
        titleSlug
        content
        translatedTitle
        translatedContent
        isPaidOnly
        difficulty
        likes
        dislikes
        isLiked
        similarQuestions
        exampleTestcases
        categoryTitle
        topicTags {
          name
          slug
          translatedName
        }
        stats
        hints
        solution {
          id
          canSeeDetail
          paidOnly
          hasVideoSolution
          paidOnlyVideo
        }
        status
        sampleTestCase
        enableRunCode
        enableTestMode
        enableDebugger
        envInfo
        libraryPath
        adminConfig {
          maxCpuTime
          maxMemory
          enableRunCode
          enableTestMode
          enableDebugger
        }
        challengeQuestion {
          id
          date
          incomplete
          stopClick
        }
      }
    }
  `;

  const variables = { titleSlug };
  const response = await axios.post(LEETCODE_GQL_URL, { query, variables });
  return response.data.data.question;
};
