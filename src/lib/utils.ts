import { SupportedLanguage, LanguageConfig } from '@/types';

export const LANGUAGES: Record<SupportedLanguage, LanguageConfig> = {
  python: {
    id: 'python', name: 'Python', piston: 'python', pistonVersion: '3.10.0',
    judge0Id: 71, monaco: 'python', extension: 'py',
    defaultCode: `# Two Sum — CodeVisualizer
def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []

result = two_sum([2, 7, 11, 15], 9)
print("Result:", result)`,
  },
  javascript: {
    id: 'javascript', name: 'JavaScript', piston: 'javascript', pistonVersion: '18.15.0',
    judge0Id: 63, monaco: 'javascript', extension: 'js',
    defaultCode: `// Binary Search
function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}
console.log("Index:", binarySearch([1,3,5,7,9,11], 7));`,
  },
  typescript: {
    id: 'typescript', name: 'TypeScript', piston: 'typescript', pistonVersion: '5.0.3',
    judge0Id: 74, monaco: 'typescript', extension: 'ts',
    defaultCode: `function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
console.log("fib(10) =", fibonacci(10));`,
  },
  c: {
    id: 'c', name: 'C', piston: 'c', pistonVersion: '10.2.0',
    judge0Id: 50, monaco: 'c', extension: 'c',
    defaultCode: `#include <stdio.h>
int main() {
    int arr[] = {64, 25, 12, 22, 11};
    int n = 5;
    for (int i = 0; i < n-1; i++)
        for (int j = 0; j < n-i-1; j++)
            if (arr[j] > arr[j+1]) {
                int t = arr[j]; arr[j] = arr[j+1]; arr[j+1] = t;
            }
    for (int i = 0; i < n; i++) printf("%d ", arr[i]);
    return 0;
}`,
  },
  cpp: {
    id: 'cpp', name: 'C++', piston: 'c++', pistonVersion: '10.2.0',
    judge0Id: 54, monaco: 'cpp', extension: 'cpp',
    defaultCode: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    vector<int> v = {5, 2, 8, 1, 9};
    sort(v.begin(), v.end());
    for (int x : v) cout << x << " ";
    return 0;
}`,
  },
  java: {
    id: 'java', name: 'Java', piston: 'java', pistonVersion: '15.0.2',
    judge0Id: 62, monaco: 'java', extension: 'java',
    defaultCode: `public class Main {
    public static void main(String[] args) {
        int[] arr = {3, 1, 4, 1, 5, 9};
        java.util.Arrays.sort(arr);
        for (int x : arr) System.out.print(x + " ");
    }
}`,
  },
  go: {
    id: 'go', name: 'Go', piston: 'go', pistonVersion: '1.16.2',
    judge0Id: 60, monaco: 'go', extension: 'go',
    defaultCode: `package main
import "fmt"
func main() {
    arr := []int{5, 3, 8, 1, 2}
    fmt.Println(arr)
}`,
  },
  rust: {
    id: 'rust', name: 'Rust', piston: 'rust', pistonVersion: '1.68.2',
    judge0Id: 73, monaco: 'rust', extension: 'rs',
    defaultCode: `fn main() {\n    let mut arr = vec![5, 2, 8, 1, 9];\n    arr.sort();\n    println!("{:?}", arr);\n}`,
  },
  csharp: {
    id: 'csharp', name: 'C#', piston: 'csharp', pistonVersion: '6.12.0',
    judge0Id: 51, monaco: 'csharp', extension: 'cs',
    defaultCode: `using System;\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello C#");\n    }\n}`,
  },
  ruby: {
    id: 'ruby', name: 'Ruby', piston: 'ruby', pistonVersion: '3.0.1',
    judge0Id: 72, monaco: 'ruby', extension: 'rb',
    defaultCode: `arr = [5, 2, 8, 1, 9]\nputs arr.sort.inspect`,
  },
  php: {
    id: 'php', name: 'PHP', piston: 'php', pistonVersion: '8.0.2',
    judge0Id: 68, monaco: 'php', extension: 'php',
    defaultCode: `<?php\n$arr = [5, 2, 8, 1, 9];\nsort($arr);\nprint_r($arr);`,
  },
  swift: {
    id: 'swift', name: 'Swift', piston: 'swift', pistonVersion: '5.3.3',
    judge0Id: 83, monaco: 'swift', extension: 'swift',
    defaultCode: `var arr = [5, 2, 8, 1, 9]\narr.sort()\nprint(arr)`,
  },
  kotlin: {
    id: 'kotlin', name: 'Kotlin', piston: 'kotlin', pistonVersion: '1.4.31',
    judge0Id: 78, monaco: 'kotlin', extension: 'kt',
    defaultCode: `fun main() {\n    val arr = intArrayOf(5, 2, 8, 1, 9)\n    arr.sort()\n    println(arr.joinToString())\n}`,
  },
};

export const LANGUAGE_LIST = Object.entries(LANGUAGES).map(([key, cfg]) => ({
  value: key as SupportedLanguage,
  label: cfg.name,
}));

export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getLanguageFromExtension(filename: string): SupportedLanguage {
  const ext = filename.split('.').pop()?.toLowerCase();
  const found = Object.values(LANGUAGES).find(lang => lang.extension === ext);
  return (found?.id as SupportedLanguage) || 'python';
}
