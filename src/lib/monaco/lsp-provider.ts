import { Monaco } from '@monaco-editor/react';

/**
 * Supercharged IntelliSense Provider
 * Simulates a Language Server Protocol (LSP) for DSA patterns and common libraries.
 */
export function registerLSPProviders(monaco: Monaco) {
  // 1. Common DSA Snippets and Autocomplete
  const dsaCompletions = [
    {
      label: 'twoSum',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'def two_sum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in seen:\n            return [seen[diff], i]\n        seen[num] = i\n    return []',
      detail: 'Standard Two Sum Implementation (O(n))',
    },
    {
      label: 'binarySearch',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'def binary_search(arr, target):\n    l, r = 0, len(arr) - 1\n    while l <= r:\n        m = (l + r) // 2\n        if arr[m] == target: return m\n        if arr[m] < target: l = m + 1\n        else: r = m - 1\n    return -1',
      detail: 'Iterative Binary Search',
    },
    {
      label: 'bfs_graph',
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: 'from collections import deque\n\ndef bfs(graph, start):\n    visited = {start}\n    queue = deque([start])\n    while queue:\n        node = queue.popleft()\n        print(node)\n        for neighbor in graph[node]:\n            if neighbor not in visited:\n                visited.add(neighbor)\n                queue.append(neighbor)',
      detail: 'Breadth-First Search for Graph',
    }
  ];

  const provider = {
    provideCompletionItems: (model: any, position: any) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      return {
        suggestions: dsaCompletions.map(c => ({
          ...c,
          range,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        }))
      };
    },
  };

  // Register for common languages
  monaco.languages.registerCompletionItemProvider('python', provider);
  monaco.languages.registerCompletionItemProvider('javascript', provider);
  monaco.languages.registerCompletionItemProvider('typescript', provider);

  console.log('[CodeVisualizer LSP] Providers registered successfully');
}
