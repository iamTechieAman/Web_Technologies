import fs from 'fs';
import path from 'path';

const GITHUB_REPO_BASE = 'https://raw.githubusercontent.com/snehasishroy/leetcode-companywise-interview-questions/master';
const COMPANIES = ['amazon', 'google', 'facebook', 'microsoft', 'apple', 'netflix', 'uber', 'airbnb'];
const DATA_FILE = path.join(process.cwd(), 'src/data/problems.json');

interface RawProblem {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  companies: string[];
}

async function fetchCompanyProblems(company: string): Promise<RawProblem[]> {
  console.log(`[Fetch] Fetching problems for ${company}...`);
  try {
    const url = `${GITHUB_REPO_BASE}/${company}/all.csv`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}`);
    
    const text = await res.text();
    const lines = text.split('\n').slice(1);
    
    return lines.map(line => {
      const parts = line.split(',');
      if (parts.length < 4) return null;
      const rawUrl = parts[1]?.trim().replace(/"/g, '');
      const title = parts[2]?.trim().replace(/"/g, '');
      const difficulty = parts[3]?.trim().replace(/"/g, '');
      
      let slug = '';
      if (rawUrl && rawUrl.includes('/problems/')) {
        slug = rawUrl.split('/problems/')[1].split('/')[0];
      } else {
        slug = (title || '').toLowerCase().replace(/\s+/g, '-');
      }

      return { id: parts[0]?.trim(), title: title || slug, slug, difficulty: difficulty || 'Medium', companies: [company] };
    }).filter(p => p !== null && p.slug) as RawProblem[];
  } catch (err) {
    console.error(`Error fetching ${company}:`, err);
    return [];
  }
}

/** Call LeetCode GraphQL to get problem details */
async function fetchLeetCodeDetails(slug: string) {
  try {
    const query = `query getQuestionDetail($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        content
        difficulty
        topicTags { name slug }
        hints
        exampleTestcaseList
      }
    }`;

    const res = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Referer': 'https://leetcode.com' },
      body: JSON.stringify({ query, variables: { titleSlug: slug } }),
    });

    if (res.ok) {
      const json = await res.json();
      const q = json?.data?.question;
      if (q) {
        // Strip HTML for plain text description
        const desc = (q.content || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim().substring(0, 800);
        const tags = (q.topicTags || []).map((t: any) => t.name);
        const examples = q.exampleTestcaseList || [];
        return { description: desc || null, tags: tags.length > 0 ? tags : null, examples };
      }
    }
  } catch (e) {
    // Silently fail, use fallback
  }
  return { description: null, tags: null, examples: [] };
}

/** Built-in solution database for top 50 problems */
const SOLUTIONS: Record<string, {
  description: string; tags: string[]; time: string; space: string;
  approach: string[]; testCases: { id: string; input: string; expected: string }[];
  python: string; javascript: string;
}> = {
  'two-sum': {
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
    tags: ['Array', 'Hash Table'],
    time: 'O(N)', space: 'O(N)',
    approach: ['Create a hash map to store values and their indices', 'For each number, check if target - number exists in the map', 'If found, return both indices; otherwise add current number to map'],
    testCases: [
      { id: '1', input: '[2,7,11,15]\n9', expected: '[0, 1]' },
      { id: '2', input: '[3,2,4]\n6', expected: '[1, 2]' },
    ],
    python: `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []

nums = list(map(int, input().strip('[]').split(',')))
target = int(input())
print(two_sum(nums, target))`,
    javascript: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) return [map.get(diff), i];
    map.set(nums[i], i);
  }
  return [];
}
const nums = JSON.parse(require('readline').question?.() || '[2,7,11,15]');
console.log(twoSum(nums, 9));`,
  },
  'add-two-numbers': {
    description: 'You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.',
    tags: ['Linked List', 'Math', 'Recursion'],
    time: 'O(max(M,N))', space: 'O(max(M,N))',
    approach: ['Traverse both lists simultaneously', 'Add corresponding digits plus carry', 'Create new node for each sum digit', 'Handle remaining carry at the end'],
    testCases: [{ id: '1', input: '[2,4,3]\n[5,6,4]', expected: '[7,0,8]' }],
    python: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def addTwoNumbers(l1, l2):
    dummy = ListNode(0)
    curr = dummy
    carry = 0
    while l1 or l2 or carry:
        v1 = l1.val if l1 else 0
        v2 = l2.val if l2 else 0
        total = v1 + v2 + carry
        carry = total // 10
        curr.next = ListNode(total % 10)
        curr = curr.next
        l1 = l1.next if l1 else None
        l2 = l2.next if l2 else None
    return dummy.next

# Test
result = addTwoNumbers(
    ListNode(2, ListNode(4, ListNode(3))),
    ListNode(5, ListNode(6, ListNode(4)))
)
out = []
while result:
    out.append(result.val)
    result = result.next
print(out)`,
    javascript: `class ListNode {
  constructor(val = 0, next = null) { this.val = val; this.next = next; }
}
function addTwoNumbers(l1, l2) {
  let dummy = new ListNode(0), curr = dummy, carry = 0;
  while (l1 || l2 || carry) {
    let sum = (l1?.val || 0) + (l2?.val || 0) + carry;
    carry = Math.floor(sum / 10);
    curr.next = new ListNode(sum % 10);
    curr = curr.next;
    l1 = l1?.next; l2 = l2?.next;
  }
  return dummy.next;
}
let r = addTwoNumbers(new ListNode(2, new ListNode(4, new ListNode(3))), new ListNode(5, new ListNode(6, new ListNode(4))));
let out = []; while(r) { out.push(r.val); r = r.next; }
console.log(out);`,
  },
  'longest-substring-without-repeating-characters': {
    description: 'Given a string s, find the length of the longest substring without repeating characters.',
    tags: ['Hash Table', 'String', 'Sliding Window'],
    time: 'O(N)', space: 'O(min(M,N))',
    approach: ['Use sliding window with two pointers', 'Track character positions in a hash set/map', 'When duplicate found, shrink window from left', 'Track maximum length throughout'],
    testCases: [
      { id: '1', input: 'abcabcbb', expected: '3' },
      { id: '2', input: 'bbbbb', expected: '1' },
    ],
    python: `def lengthOfLongestSubstring(s):
    seen = {}
    left = 0
    max_len = 0
    for right, char in enumerate(s):
        if char in seen and seen[char] >= left:
            left = seen[char] + 1
        seen[char] = right
        max_len = max(max_len, right - left + 1)
    return max_len

print(lengthOfLongestSubstring("abcabcbb"))`,
    javascript: `function lengthOfLongestSubstring(s) {
  const seen = new Map();
  let left = 0, max = 0;
  for (let right = 0; right < s.length; right++) {
    if (seen.has(s[right]) && seen.get(s[right]) >= left)
      left = seen.get(s[right]) + 1;
    seen.set(s[right], right);
    max = Math.max(max, right - left + 1);
  }
  return max;
}
console.log(lengthOfLongestSubstring("abcabcbb"));`,
  },
  'median-of-two-sorted-arrays': {
    description: 'Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays. The overall run time complexity should be O(log (m+n)).',
    tags: ['Array', 'Binary Search', 'Divide and Conquer'],
    time: 'O(log(min(M,N)))', space: 'O(1)',
    approach: ['Use binary search on the smaller array', 'Partition both arrays such that left half has correct elements', 'Adjust partition based on max of left vs min of right', 'Calculate median from partition boundaries'],
    testCases: [{ id: '1', input: '[1,3]\n[2]', expected: '2.0' }],
    python: `def findMedianSortedArrays(nums1, nums2):
    if len(nums1) > len(nums2):
        nums1, nums2 = nums2, nums1
    m, n = len(nums1), len(nums2)
    lo, hi = 0, m
    while lo <= hi:
        i = (lo + hi) // 2
        j = (m + n + 1) // 2 - i
        left1 = nums1[i-1] if i > 0 else float('-inf')
        right1 = nums1[i] if i < m else float('inf')
        left2 = nums2[j-1] if j > 0 else float('-inf')
        right2 = nums2[j] if j < n else float('inf')
        if left1 <= right2 and left2 <= right1:
            if (m + n) % 2 == 0:
                return (max(left1, left2) + min(right1, right2)) / 2
            return max(left1, left2)
        elif left1 > right2:
            hi = i - 1
        else:
            lo = i + 1

print(findMedianSortedArrays([1, 3], [2]))`,
    javascript: `function findMedianSortedArrays(nums1, nums2) {
  if (nums1.length > nums2.length) [nums1, nums2] = [nums2, nums1];
  const m = nums1.length, n = nums2.length;
  let lo = 0, hi = m;
  while (lo <= hi) {
    const i = Math.floor((lo + hi) / 2);
    const j = Math.floor((m + n + 1) / 2) - i;
    const l1 = i > 0 ? nums1[i-1] : -Infinity;
    const r1 = i < m ? nums1[i] : Infinity;
    const l2 = j > 0 ? nums2[j-1] : -Infinity;
    const r2 = j < n ? nums2[j] : Infinity;
    if (l1 <= r2 && l2 <= r1) {
      return (m+n) % 2 === 0 ? (Math.max(l1,l2) + Math.min(r1,r2)) / 2 : Math.max(l1,l2);
    } else if (l1 > r2) hi = i - 1;
    else lo = i + 1;
  }
}
console.log(findMedianSortedArrays([1,3], [2]));`,
  },
  'longest-palindromic-substring': {
    description: 'Given a string s, return the longest palindromic substring in s.',
    tags: ['String', 'Dynamic Programming'],
    time: 'O(N²)', space: 'O(1)',
    approach: ['Expand around center for each character', 'Check both odd and even length palindromes', 'Track the longest found so far'],
    testCases: [{ id: '1', input: 'babad', expected: 'bab' }],
    python: `def longestPalindrome(s):
    res = ""
    for i in range(len(s)):
        for l, r in [(i, i), (i, i+1)]:
            while l >= 0 and r < len(s) and s[l] == s[r]:
                l -= 1
                r += 1
            if r - l - 1 > len(res):
                res = s[l+1:r]
    return res

print(longestPalindrome("babad"))`,
    javascript: `function longestPalindrome(s) {
  let res = "";
  for (let i = 0; i < s.length; i++) {
    for (const [a, b] of [[i,i],[i,i+1]]) {
      let l = a, r = b;
      while (l >= 0 && r < s.length && s[l] === s[r]) { l--; r++; }
      if (r - l - 1 > res.length) res = s.slice(l+1, r);
    }
  }
  return res;
}
console.log(longestPalindrome("babad"));`,
  },
  'reverse-integer': {
    description: 'Given a signed 32-bit integer x, return x with its digits reversed. If reversing x causes the value to go outside the signed 32-bit integer range [-2^31, 2^31 - 1], then return 0.',
    tags: ['Math'],
    time: 'O(log N)', space: 'O(1)',
    approach: ['Extract digits one by one using modulo', 'Build reversed number by multiplying by 10 and adding digit', 'Check for 32-bit overflow before each step'],
    testCases: [{ id: '1', input: '123', expected: '321' }, { id: '2', input: '-123', expected: '-321' }],
    python: `def reverse(x):
    sign = -1 if x < 0 else 1
    x = abs(x)
    rev = 0
    while x > 0:
        rev = rev * 10 + x % 10
        x //= 10
    rev *= sign
    if rev < -2**31 or rev > 2**31 - 1:
        return 0
    return rev

print(reverse(123))
print(reverse(-123))`,
    javascript: `function reverse(x) {
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  let rev = 0;
  while (x > 0) {
    rev = rev * 10 + x % 10;
    x = Math.floor(x / 10);
  }
  rev *= sign;
  return rev < -(2**31) || rev > 2**31 - 1 ? 0 : rev;
}
console.log(reverse(123));
console.log(reverse(-123));`,
  },
  'valid-parentheses': {
    description: 'Given a string s containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid. An input string is valid if open brackets are closed by the same type and in the correct order.',
    tags: ['String', 'Stack'],
    time: 'O(N)', space: 'O(N)',
    approach: ['Use a stack to track opening brackets', 'For each closing bracket, check if it matches the top of stack', 'Return true if stack is empty at the end'],
    testCases: [{ id: '1', input: '()', expected: 'true' }, { id: '2', input: '([)]', expected: 'false' }],
    python: `def isValid(s):
    stack = []
    pairs = {')': '(', '}': '{', ']': '['}
    for char in s:
        if char in pairs:
            if not stack or stack[-1] != pairs[char]:
                return False
            stack.pop()
        else:
            stack.append(char)
    return len(stack) == 0

print(isValid("()"))
print(isValid("()[]{}"))
print(isValid("([)]"))`,
    javascript: `function isValid(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  for (const c of s) {
    if (map[c]) {
      if (!stack.length || stack[stack.length-1] !== map[c]) return false;
      stack.pop();
    } else stack.push(c);
  }
  return stack.length === 0;
}
console.log(isValid("()"));
console.log(isValid("()[]{}"));
console.log(isValid("([)]"));`,
  },
  'merge-two-sorted-lists': {
    description: 'You are given the heads of two sorted linked lists list1 and list2. Merge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists. Return the head of the merged linked list.',
    tags: ['Linked List', 'Recursion'],
    time: 'O(N+M)', space: 'O(1)',
    approach: ['Use a dummy head node', 'Compare current nodes of both lists', 'Attach the smaller one and advance that pointer', 'Attach remaining nodes when one list is exhausted'],
    testCases: [{ id: '1', input: '[1,2,4]\n[1,3,4]', expected: '[1,1,2,3,4,4]' }],
    python: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def mergeTwoLists(l1, l2):
    dummy = ListNode(0)
    curr = dummy
    while l1 and l2:
        if l1.val <= l2.val:
            curr.next = l1
            l1 = l1.next
        else:
            curr.next = l2
            l2 = l2.next
        curr = curr.next
    curr.next = l1 or l2
    return dummy.next

# Build and test
def build(arr):
    dummy = ListNode(0)
    c = dummy
    for v in arr:
        c.next = ListNode(v)
        c = c.next
    return dummy.next

r = mergeTwoLists(build([1,2,4]), build([1,3,4]))
out = []
while r: out.append(r.val); r = r.next
print(out)`,
    javascript: `class ListNode {
  constructor(val=0, next=null) { this.val=val; this.next=next; }
}
function mergeTwoLists(l1, l2) {
  const dummy = new ListNode(0);
  let curr = dummy;
  while (l1 && l2) {
    if (l1.val <= l2.val) { curr.next = l1; l1 = l1.next; }
    else { curr.next = l2; l2 = l2.next; }
    curr = curr.next;
  }
  curr.next = l1 || l2;
  return dummy.next;
}
function build(arr) { let d = new ListNode(0), c = d; for (const v of arr) { c.next = new ListNode(v); c = c.next; } return d.next; }
let r = mergeTwoLists(build([1,2,4]), build([1,3,4]));
let out = []; while(r) { out.push(r.val); r = r.next; }
console.log(out);`,
  },
  'maximum-subarray': {
    description: 'Given an integer array nums, find the subarray with the largest sum, and return its sum.',
    tags: ['Array', 'Divide and Conquer', 'Dynamic Programming'],
    time: 'O(N)', space: 'O(1)',
    approach: ['Use Kadane\'s algorithm', 'Track current sum and max sum', 'Reset current sum to 0 if it becomes negative', 'Update max sum at each step'],
    testCases: [{ id: '1', input: '[-2,1,-3,4,-1,2,1,-5,4]', expected: '6' }],
    python: `def maxSubArray(nums):
    max_sum = nums[0]
    curr_sum = 0
    for num in nums:
        curr_sum = max(num, curr_sum + num)
        max_sum = max(max_sum, curr_sum)
    return max_sum

print(maxSubArray([-2,1,-3,4,-1,2,1,-5,4]))`,
    javascript: `function maxSubArray(nums) {
  let maxSum = nums[0], curr = 0;
  for (const num of nums) {
    curr = Math.max(num, curr + num);
    maxSum = Math.max(maxSum, curr);
  }
  return maxSum;
}
console.log(maxSubArray([-2,1,-3,4,-1,2,1,-5,4]));`,
  },
  'climbing-stairs': {
    description: 'You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
    tags: ['Math', 'Dynamic Programming', 'Memoization'],
    time: 'O(N)', space: 'O(1)',
    approach: ['This is a Fibonacci-like sequence', 'dp[i] = dp[i-1] + dp[i-2]', 'Only need two variables instead of full array'],
    testCases: [{ id: '1', input: '5', expected: '8' }],
    python: `def climbStairs(n):
    if n <= 2: return n
    a, b = 1, 2
    for _ in range(3, n + 1):
        a, b = b, a + b
    return b

print(climbStairs(5))`,
    javascript: `function climbStairs(n) {
  if (n <= 2) return n;
  let a = 1, b = 2;
  for (let i = 3; i <= n; i++) [a, b] = [b, a + b];
  return b;
}
console.log(climbStairs(5));`,
  },
};

async function main() {
  const allProblemsMap: Record<string, RawProblem> = {};

  for (const company of COMPANIES) {
    const problems = await fetchCompanyProblems(company);
    for (const p of problems) {
      if (allProblemsMap[p.slug]) {
        if (!allProblemsMap[p.slug].companies.includes(company)) {
          allProblemsMap[p.slug].companies.push(company);
        }
      } else {
        allProblemsMap[p.slug] = p;
      }
    }
  }

  const slugs = Object.keys(allProblemsMap).slice(0, 50);
  const finalProblems = [];

  console.log(`[Fetch] Enriching ${slugs.length} problems...`);

  for (const slug of slugs) {
    const raw = allProblemsMap[slug];
    const builtIn = SOLUTIONS[slug];
    
    // Try LeetCode GraphQL for description + tags
    const lc = await fetchLeetCodeDetails(slug);
    await new Promise(r => setTimeout(r, 200)); // Rate limit

    const description = builtIn?.description || lc.description || `Solve the "${raw.title}" problem. Check LeetCode for the full description.`;
    const tags = builtIn?.tags || lc.tags || ['Algorithm', 'Data Structure'];
    
    finalProblems.push({
      id: raw.id,
      slug: raw.slug,
      title: raw.title,
      description,
      difficulty: raw.difficulty,
      tags,
      companies: Array.from(new Set(raw.companies)),
      timeComplexity: builtIn?.time || 'O(N)',
      spaceComplexity: builtIn?.space || 'O(1)',
      approachSteps: builtIn?.approach || ['Analyze the problem constraints', 'Choose an optimal data structure', 'Implement the solution'],
      testCases: builtIn?.testCases || [{ id: '1', input: 'example', expected: 'result' }],
      solutionCode: {
        python: builtIn?.python || `# ${raw.title}\n# Write your solution here\ndef solve():\n    pass\n\nsolve()`,
        javascript: builtIn?.javascript || `// ${raw.title}\nfunction solve() {\n  // Write your solution here\n}\nsolve();`,
      },
      leetcodeUrl: `https://leetcode.com/problems/${slug}/`,
    });
  }

  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(finalProblems, null, 2));
  console.log(`[Success] Saved ${finalProblems.length} problems to ${DATA_FILE}`);
}

main().catch(console.error);
