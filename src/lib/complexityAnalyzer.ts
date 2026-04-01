import { ComplexityResult } from '@/types';

/**
 * Rule-based complexity analyzer.
 * Detects common patterns in source code and infers Big-O.
 */
export function analyzeComplexity(code: string): ComplexityResult {
  const lines = code.split('\n');
  const trimmed = code.replace(/\s+/g, ' ');

  let nestingDepth = 0;
  let maxNesting = 0;
  let hasRecursion = false;
  let hasSorting = false;
  let hasBinarySearch = false;
  let hasHashMap = false;
  let loopCount = 0;

  const properties: string[] = [];

  // Detect function names for recursion check
  const funcNames: string[] = [];
  const funcDefRegex = /(?:def |function |fn |func |static\s+\w+\s+)(\w+)/g;
  let funcMatch;
  while ((funcMatch = funcDefRegex.exec(code)) !== null) {
    funcNames.push(funcMatch[1]);
  }

  for (const line of lines) {
    const t = line.trim();

    // Count loops
    if (/^(for|while)\b/.test(t) || /\bfor\s*\(/.test(t) || /\bwhile\s*\(/.test(t)) {
      loopCount++;
      nestingDepth++;
      maxNesting = Math.max(maxNesting, nestingDepth);
    }

    if (t === '}' || t === 'end' || t === '') {
      if (nestingDepth > 0) nestingDepth--;
    }

    // Recursion
    for (const fn of funcNames) {
      if (t.includes(`${fn}(`) && !t.startsWith('def ') && !t.startsWith('function ')) {
        hasRecursion = true;
      }
    }

    // Sorting
    if (/\b(sort|sorted|Arrays\.sort|Collections\.sort|std::sort)\b/.test(t)) {
      hasSorting = true;
    }

    // Binary search
    if (/\b(mid|binary.?search|bisect)\b/i.test(t)) {
      hasBinarySearch = true;
    }

    // HashMap/dictionary
    if (/\b(dict|Map|HashMap|hash|seen|{}\s*$|new Map)\b/.test(t)) {
      hasHashMap = true;
    }
  }

  // Determine time complexity
  let time = 'O(N)';
  let space = 'O(1)';
  let reasoning = '';

  if (hasSorting) {
    time = 'O(N log N)';
    reasoning = 'Code uses a built-in sort which is O(N log N).';
    properties.push('Uses built-in sort');
  } else if (hasBinarySearch) {
    time = 'O(log N)';
    reasoning = 'Binary search pattern detected, halving the search space.';
    properties.push('Divide and conquer');
  } else if (hasRecursion && maxNesting === 0) {
    time = 'O(2^N)';
    reasoning = 'Recursive calls without memoization suggest exponential growth.';
    properties.push('Recursive');
  } else if (maxNesting >= 3) {
    time = 'O(N³)';
    reasoning = `Detected ${maxNesting} nested loops.`;
  } else if (maxNesting === 2) {
    time = 'O(N²)';
    reasoning = 'Two nested loops iterating over input.';
  } else if (loopCount >= 1) {
    time = 'O(N)';
    reasoning = 'Single-pass loop over the input.';
  } else {
    time = 'O(1)';
    reasoning = 'No loops or recursive calls detected.';
  }

  if (hasHashMap) {
    space = 'O(N)';
    properties.push('Uses hash map for O(1) lookups');
  }

  if (hasRecursion) {
    space = space === 'O(1)' ? 'O(N)' : space;
    properties.push('Recursive — call stack contributes to space');
  }

  if (loopCount > 0 && !hasRecursion) properties.push('Iterative');
  if (!hasRecursion && loopCount <= 1) properties.push('In-place (likely)');

  return { time, space, reasoning, properties };
}
