import { SupportedLanguage, LanguageConfig } from '@/types';

export const LANGUAGE_CONFIGS: Record<SupportedLanguage, LanguageConfig> = {
  python: {
    id: 'python',
    name: 'Python',
    monaco: 'python',
    piston: 'python',
    pistonVersion: '3.10.0',
    judge0Id: 71,
    extension: '.py',
    defaultCode: '# Python program\n\ndef main():\n    print("Hello, World!")\n\nif __name__ == "__main__":\n    main()'
  },
  javascript: {
    id: 'javascript',
    name: 'JavaScript',
    monaco: 'javascript',
    piston: 'javascript',
    pistonVersion: '18.15.0',
    judge0Id: 63,
    extension: '.js',
    defaultCode: '// JavaScript program\n\nfunction main() {\n    console.log("Hello, World!");\n}\n\nmain();'
  },
  typescript: {
    id: 'typescript',
    name: 'TypeScript',
    monaco: 'typescript',
    piston: 'typescript',
    pistonVersion: '5.0.0',
    judge0Id: 74,
    extension: '.ts',
    defaultCode: '// TypeScript program\n\nfunction main(): void {\n    console.log("Hello, World!");\n}\n\nmain();'
  },
  cpp: {
    id: 'cpp',
    name: 'C++',
    monaco: 'cpp',
    piston: 'cpp',
    pistonVersion: '10.2.0',
    judge0Id: 54,
    extension: '.cpp',
    defaultCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}'
  },
  c: {
    id: 'c',
    name: 'C',
    monaco: 'c',
    piston: 'c',
    pistonVersion: '10.2.0',
    judge0Id: 50,
    extension: '.c',
    defaultCode: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}'
  },
  java: {
    id: 'java',
    name: 'Java',
    monaco: 'java',
    piston: 'java',
    pistonVersion: '15.0.2',
    judge0Id: 62,
    extension: '.java',
    defaultCode: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}'
  },
  rust: {
    id: 'rust',
    name: 'Rust',
    monaco: 'rust',
    piston: 'rust',
    pistonVersion: '1.68.0',
    judge0Id: 73,
    extension: '.rs',
    defaultCode: 'fn main() {\n    println!("Hello, World!");\n}'
  },
  go: {
    id: 'go',
    name: 'Go',
    monaco: 'go',
    piston: 'go',
    pistonVersion: '1.19.0',
    judge0Id: 60,
    extension: '.go',
    defaultCode: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}'
  },
  csharp: {
    id: 'csharp',
    name: 'C#',
    monaco: 'csharp',
    piston: 'csharp',
    pistonVersion: '6.0.0',
    judge0Id: 51,
    extension: '.cs',
    defaultCode: 'using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}'
  },
  ruby: {
    id: 'ruby',
    name: 'Ruby',
    monaco: 'ruby',
    piston: 'ruby',
    pistonVersion: '3.1.0',
    judge0Id: 72,
    extension: '.rb',
    defaultCode: 'puts "Hello, World!"'
  },
  php: {
    id: 'php',
    name: 'PHP',
    monaco: 'php',
    piston: 'php',
    pistonVersion: '8.1.0',
    judge0Id: 68,
    extension: '.php',
    defaultCode: '<?php\n\necho "Hello, World!\\n";\n\n?>'
  },
  swift: {
    id: 'swift',
    name: 'Swift',
    monaco: 'swift',
    piston: 'swift',
    pistonVersion: '5.7.0',
    judge0Id: 83,
    extension: '.swift',
    defaultCode: 'print("Hello, World!")'
  },
  kotlin: {
    id: 'kotlin',
    name: 'Kotlin',
    monaco: 'kotlin',
    piston: 'kotlin',
    pistonVersion: '1.8.0',
    judge0Id: 77,
    extension: '.kt',
    defaultCode: 'fun main() {\n    println("Hello, World!")\n}'
  },
  dart: {
    id: 'dart',
    name: 'Dart',
    monaco: 'dart',
    piston: 'dart',
    pistonVersion: '2.19.0',
    judge0Id: 86,
    extension: '.dart',
    defaultCode: 'void main() {\n  print(\'Hello, World!\');\n}'
  },
  scala: {
    id: 'scala',
    name: 'Scala',
    monaco: 'scala',
    piston: 'scala',
    pistonVersion: '3.3.0',
    judge0Id: 81,
    extension: '.scala',
    defaultCode: 'object Main {\n  def main(args: Array[String]): Unit = {\n    println("Hello, World!")\n  }\n}'
  },
  r: {
    id: 'r',
    name: 'R',
    monaco: 'r',
    piston: 'r',
    pistonVersion: '4.2.0',
    judge0Id: 80,
    extension: '.r',
    defaultCode: 'cat("Hello, World!\\n")'
  },
  perl: {
    id: 'perl',
    name: 'Perl',
    monaco: 'perl',
    piston: 'perl',
    pistonVersion: '5.36.0',
    judge0Id: 79,
    extension: '.pl',
    defaultCode: 'print "Hello, World!\\n";'
  },
  lua: {
    id: 'lua',
    name: 'Lua',
    monaco: 'lua',
    piston: 'lua',
    pistonVersion: '5.4.0',
    judge0Id: 78,
    extension: '.lua',
    defaultCode: 'print("Hello, World!")'
  },
  bash: {
    id: 'bash',
    name: 'Bash',
    monaco: 'shell',
    piston: 'bash',
    pistonVersion: '5.1.0',
    judge0Id: 46,
    extension: '.sh',
    defaultCode: '#!/bin/bash\necho "Hello, World!"'
  },
  powershell: {
    id: 'powershell',
    name: 'PowerShell',
    monaco: 'powershell',
    piston: 'powershell',
    pistonVersion: '7.3.0',
    judge0Id: 85,
    extension: '.ps1',
    defaultCode: 'Write-Host "Hello, World!"'
  },
  sql: {
    id: 'sql',
    name: 'SQL',
    monaco: 'sql',
    piston: 'sql',
    pistonVersion: '5.7.0',
    judge0Id: 82,
    extension: '.sql',
    defaultCode: '-- SQL Query\nSELECT "Hello, World!" as message;'
  },
  html: {
    id: 'html',
    name: 'HTML',
    monaco: 'html',
    piston: 'html',
    pistonVersion: '0.0.1',
    judge0Id: 0,
    extension: '.html',
    defaultCode: '<!DOCTYPE html>\n<html>\n<head>\n    <title>Hello World</title>\n</head>\n<body>\n    <h1>Hello, World!</h1>\n</body>\n</html>'
  },
  css: {
    id: 'css',
    name: 'CSS',
    monaco: 'css',
    piston: 'css',
    pistonVersion: '0.0.1',
    judge0Id: 0,
    extension: '.css',
    defaultCode: 'body {\n    font-family: Arial, sans-serif;\n    display: flex;\n    justify-content: center;\n    align-items: center;\n    height: 100vh;\n    margin: 0;\n}\n\nh1 {\n    color: #333;\n}'
  },
  json: {
    id: 'json',
    name: 'JSON',
    monaco: 'json',
    piston: 'json',
    pistonVersion: '0.0.1',
    judge0Id: 0,
    extension: '.json',
    defaultCode: '{\n  "message": "Hello, World!",\n  "language": "JSON"\n}'
  },
  xml: {
    id: 'xml',
    name: 'XML',
    monaco: 'xml',
    piston: 'xml',
    pistonVersion: '0.0.1',
    judge0Id: 0,
    extension: '.xml',
    defaultCode: '<?xml version="1.0" encoding="UTF-8"?>\n<greeting>\n    <message>Hello, World!</message>\n</greeting>'
  },
  yaml: {
    id: 'yaml',
    name: 'YAML',
    monaco: 'yaml',
    piston: 'yaml',
    pistonVersion: '0.0.1',
    judge0Id: 0,
    extension: '.yaml',
    defaultCode: 'message: "Hello, World!"\nlanguage: YAML'
  },
  markdown: {
    id: 'markdown',
    name: 'Markdown',
    monaco: 'markdown',
    piston: 'markdown',
    pistonVersion: '0.0.1',
    judge0Id: 0,
    extension: '.md',
    defaultCode: '# Hello, World!\n\nThis is a **Markdown** file.'
  },
  dockerfile: {
    id: 'dockerfile',
    name: 'Dockerfile',
    monaco: 'dockerfile',
    piston: 'dockerfile',
    pistonVersion: '0.0.1',
    judge0Id: 0,
    extension: '.dockerfile',
    defaultCode: 'FROM alpine:latest\n\nCMD echo "Hello, World!"'
  },
  nginx: {
    id: 'nginx',
    name: 'Nginx',
    monaco: 'nginx',
    piston: 'nginx',
    pistonVersion: '0.0.1',
    judge0Id: 0,
    extension: '.conf',
    defaultCode: 'server {\n    listen 80;\n    server_name localhost;\n    \n    location / {\n        return 200 "Hello, World!";\n        add_header Content-Type text/plain;\n    }\n}'
  },
  vue: {
    id: 'vue',
    name: 'Vue',
    monaco: 'html',
    piston: 'vue',
    pistonVersion: '3.2.0',
    judge0Id: 0,
    extension: '.vue',
    defaultCode: '<template>\n  <div>\n    <h1>Hello, World!</h1>\n  </div>\n</template>\n\n<script>\nexport default {\n  name: "HelloWorld"\n}\n</script>'
  },
  svelte: {
    id: 'svelte',
    name: 'Svelte',
    monaco: 'html',
    piston: 'svelte',
    pistonVersion: '3.55.0',
    judge0Id: 0,
    extension: '.svelte',
    defaultCode: '<script>\n  let name = "World";\n</script>\n\n<h1>Hello, {name}!</h1>'
  },
  elixir: {
    id: 'elixir',
    name: 'Elixir',
    monaco: 'elixir',
    piston: 'elixir',
    pistonVersion: '1.14.0',
    judge0Id: 76,
    extension: '.ex',
    defaultCode: 'IO.puts "Hello, World!"'
  },
  haskell: {
    id: 'haskell',
    name: 'Haskell',
    monaco: 'haskell',
    piston: 'haskell',
    pistonVersion: '9.4.0',
    judge0Id: 61,
    extension: '.hs',
    defaultCode: 'main :: IO ()\nmain = putStrLn "Hello, World!"'
  },
  nim: {
    id: 'nim',
    name: 'Nim',
    monaco: 'nim',
    piston: 'nim',
    pistonVersion: '1.6.0',
    judge0Id: 84,
    extension: '.nim',
    defaultCode: 'echo "Hello, World!"'
  },
  zig: {
    id: 'zig',
    name: 'Zig',
    monaco: 'zig',
    piston: 'zig',
    pistonVersion: '0.10.0',
    judge0Id: 93,
    extension: '.zig',
    defaultCode: 'const std = @import("std");\n\npub fn main() !void {\n    const stdout = std.io.getStdOut().writer();\n    try stdout.print("Hello, World!\\n");\n}'
  },
  odin: {
    id: 'odin',
    name: 'Odin',
    monaco: 'odin',
    piston: 'odin',
    pistonVersion: '0.0.1',
    judge0Id: 0,
    extension: '.odin',
    defaultCode: 'package main\n\nimport "core:fmt"\n\nmain :: proc() {\n    fmt.println("Hello, World!");\n}'
  },
  julia: {
    id: 'julia',
    name: 'Julia',
    monaco: 'julia',
    piston: 'julia',
    pistonVersion: '1.9.0',
    judge0Id: 87,
    extension: '.jl',
    defaultCode: 'println("Hello, World!")'
  },
  matlab: {
    id: 'matlab',
    name: 'MATLAB',
    monaco: 'matlab',
    piston: 'matlab',
    pistonVersion: 'R2023a',
    judge0Id: 92,
    extension: '.m',
    defaultCode: 'disp("Hello, World!")'
  },
  octave: {
    id: 'octave',
    name: 'Octave',
    monaco: 'matlab',
    piston: 'octave',
    pistonVersion: '6.4.0',
    judge0Id: 91,
    extension: '.m',
    defaultCode: 'disp("Hello, World!")'
  },
  racket: {
    id: 'racket',
    name: 'Racket',
    monaco: 'scheme',
    piston: 'racket',
    pistonVersion: '8.7.0',
    judge0Id: 89,
    extension: '.rkt',
    defaultCode: '#lang racket\n\n(display "Hello, World!")'
  },
  scheme: {
    id: 'scheme',
    name: 'Scheme',
    monaco: 'scheme',
    piston: 'scheme',
    pistonVersion: '0.0.1',
    judge0Id: 0,
    extension: '.scm',
    defaultCode: '(display "Hello, World!")'
  },
  clojure: {
    id: 'clojure',
    name: 'Clojure',
    monaco: 'clojure',
    piston: 'clojure',
    pistonVersion: '1.11.0',
    judge0Id: 88,
    extension: '.clj',
    defaultCode: '(println "Hello, World!")'
  },
  fsharp: {
    id: 'fsharp',
    name: 'F#',
    monaco: 'fsharp',
    piston: 'fsharp',
    pistonVersion: '6.0.0',
    judge0Id: 75,
    extension: '.fs',
    defaultCode: 'printfn "Hello, World!"'
  },
  vbnet: {
    id: 'vbnet',
    name: 'VB.NET',
    monaco: 'vb',
    piston: 'vbnet',
    pistonVersion: '0.0.1',
    judge0Id: 0,
    extension: '.vb',
    defaultCode: 'Module Module1\n    Sub Main()\n        Console.WriteLine("Hello, World!")\n    End Sub\nEnd Module'
  },
  assembly: {
    id: 'assembly',
    name: 'Assembly',
    monaco: 'assembly',
    piston: 'assembly',
    pistonVersion: '0.0.1',
    judge0Id: 0,
    extension: '.asm',
    defaultCode: 'section .data\n    msg db "Hello, World!", 0x0A\n    len equ $ - msg\n\nsection .text\n    global _start\n\n_start:\n    mov rax, 1          ; syscall write\n    mov rdi, 1          ; stdout\n    mov rsi, msg        ; message\n    mov rdx, len        ; length\n    syscall\n    \n    mov rax, 60         ; syscall exit\n    xor rdi, rdi        ; exit code 0\n    syscall'
  },
  solidity: {
    id: 'solidity',
    name: 'Solidity',
    monaco: 'solidity',
    piston: 'solidity',
    pistonVersion: '0.8.19',
    judge0Id: 90,
    extension: '.sol',
    defaultCode: 'pragma solidity ^0.8.19;\n\ncontract HelloWorld {\n    function sayHello() public pure returns (string memory) {\n        return "Hello, World!";\n    }\n}'
  },
  terraform: {
    id: 'terraform',
    name: 'Terraform',
    monaco: 'terraform',
    piston: 'terraform',
    pistonVersion: '1.5.0',
    judge0Id: 0,
    extension: '.tf',
    defaultCode: 'output "hello_world" {\n  value = "Hello, World!"\n}'
  },
  kubernetes: {
    id: 'kubernetes',
    name: 'Kubernetes',
    monaco: 'yaml',
    piston: 'kubernetes',
    pistonVersion: '0.0.1',
    judge0Id: 0,
    extension: '.yaml',
    defaultCode: 'apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: hello-world\ndata:\n  message: "Hello, World!"'
  }
};

export function getLanguageConfig(language: SupportedLanguage): LanguageConfig {
  return LANGUAGE_CONFIGS[language] || LANGUAGE_CONFIGS.python;
}

export function getLanguageFromExtension(filename: string): SupportedLanguage {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  const extensionMap: Record<string, SupportedLanguage> = {
    'py': 'python',
    'js': 'javascript',
    'mjs': 'javascript',
    'cjs': 'javascript',
    'ts': 'typescript',
    'mts': 'typescript',
    'cts': 'typescript',
    'cpp': 'cpp',
    'cxx': 'cpp',
    'cc': 'cpp',
    'c': 'c',
    'h': 'c',
    'java': 'java',
    'rs': 'rust',
    'go': 'go',
    'cs': 'csharp',
    'rb': 'ruby',
    'php': 'php',
    'swift': 'swift',
    'kt': 'kotlin',
    'dart': 'dart',
    'scala': 'scala',
    'r': 'r',
    'pl': 'perl',
    'lua': 'lua',
    'sh': 'bash',
    'bash': 'bash',
    'zsh': 'bash',
    'ps1': 'powershell',
    'sql': 'sql',
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'json': 'json',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    'md': 'markdown',
    'dockerfile': 'dockerfile',
    'conf': 'nginx',
    'vue': 'vue',
    'svelte': 'svelte',
    'ex': 'elixir',
    'exs': 'elixir',
    'hs': 'haskell',
    'nim': 'nim',
    'zig': 'zig',
    'odin': 'odin',
    'jl': 'julia',
    'm': 'matlab',
    'rkt': 'racket',
    'scm': 'scheme',
    'clj': 'clojure',
    'fs': 'fsharp',
    'fsx': 'fsharp',
    'vb': 'vbnet',
    'asm': 'assembly',
    'sol': 'solidity',
    'tf': 'terraform',
    'tfvars': 'terraform'
  };
  
  return extensionMap[ext || ''] || 'python';
}

export interface LanguageDetectionResult {
  language: SupportedLanguage;
  confidence: number;
  reason: string;
}

const CODE_SIGNATURES: Array<{
  language: SupportedLanguage;
  reason: string;
  weight: number;
  patterns: RegExp[];
}> = [
  { language: 'python', reason: 'Python syntax', weight: 3, patterns: [/\bdef\s+\w+\s*\(/, /\bimport\s+\w+/, /\bfrom\s+\w+\s+import\b/, /\bprint\s*\(/, /\binput\s*\(/, /if\s+__name__\s*==\s*["']__main__["']/] },
  { language: 'javascript', reason: 'JavaScript syntax', weight: 3, patterns: [/\bconsole\.log\s*\(/, /\bfunction\s+\w+\s*\(/, /\b(?:const|let|var)\s+\w+\s*=/, /=>\s*[{(]/, /\brequire\s*\(/] },
  { language: 'typescript', reason: 'TypeScript syntax', weight: 4, patterns: [/\binterface\s+\w+/, /\btype\s+\w+\s*=/, /:\s*(?:string|number|boolean|void|unknown|any)\b/, /\bimplements\s+\w+/, /\bas\s+\w+/] },
  { language: 'java', reason: 'Java syntax', weight: 4, patterns: [/\bpublic\s+class\s+\w+/, /\bSystem\.out\.println\s*\(/, /\bpublic\s+static\s+void\s+main\s*\(/, /\bScanner\s+\w+/, /\bimport\s+java\./] },
  { language: 'cpp', reason: 'C++ syntax', weight: 4, patterns: [/#include\s*<iostream>/, /\busing\s+namespace\s+std\b/, /\bstd::/, /\bcout\s*<</, /\bcin\s*>>/] },
  { language: 'c', reason: 'C syntax', weight: 3, patterns: [/#include\s*<stdio\.h>/, /\bprintf\s*\(/, /\bscanf\s*\(/, /\bint\s+main\s*\(/] },
  { language: 'go', reason: 'Go syntax', weight: 4, patterns: [/\bpackage\s+main\b/, /\bfunc\s+main\s*\(/, /\bfmt\.Print/, /\bimport\s+\(/] },
  { language: 'rust', reason: 'Rust syntax', weight: 4, patterns: [/\bfn\s+main\s*\(/, /\blet\s+mut\s+/, /\bprintln!\s*\(/, /\buse\s+std::/] },
  { language: 'php', reason: 'PHP syntax', weight: 5, patterns: [/<\?php/, /\becho\s+["']/, /\$\w+\s*=/] },
  { language: 'ruby', reason: 'Ruby syntax', weight: 3, patterns: [/\bputs\s+["']/, /\bdef\s+\w+/, /\bend\b/, /\brequire\s+["']/] },
  { language: 'html', reason: 'HTML markup', weight: 5, patterns: [/<!doctype\s+html/i, /<html[\s>]/i, /<body[\s>]/i, /<\/\w+>/] },
  { language: 'css', reason: 'CSS rules', weight: 3, patterns: [/[.#]?[A-Za-z][\w-]*\s*\{[^}]*:/, /\bdisplay\s*:/, /\bcolor\s*:/, /\bfont-family\s*:/] },
  { language: 'json', reason: 'JSON structure', weight: 4, patterns: [/^\s*[{[][\s\S]*[}\]]\s*$/] },
  { language: 'sql', reason: 'SQL query', weight: 4, patterns: [/\bSELECT\b[\s\S]+\bFROM\b/i, /\bINSERT\s+INTO\b/i, /\bCREATE\s+TABLE\b/i, /\bUPDATE\b[\s\S]+\bSET\b/i] },
  { language: 'bash', reason: 'Shell script', weight: 4, patterns: [/^#!.*\b(?:bash|sh|zsh)\b/, /\becho\s+["']?/, /\bif\s+\[.*\];\s*then\b/, /\bfi\b/] },
  { language: 'markdown', reason: 'Markdown document', weight: 2, patterns: [/^#{1,6}\s+\S/m, /\[[^\]]+\]\([^)]+\)/, /```[\s\S]*```/] },
  { language: 'yaml', reason: 'YAML structure', weight: 2, patterns: [/^\s*[\w-]+:\s+.+$/m, /^\s*-\s+[\w-]+:/m] },
];

export function detectLanguageFromCode(code: string, filename = ''): LanguageDetectionResult {
  const trimmed = String(code || '').trim();
  const byExtension = getLanguageFromExtension(filename || '');

  if (!trimmed) {
    return { language: byExtension, confidence: filename ? 2 : 0, reason: filename ? 'File extension' : 'Empty file' };
  }

  const scores = new Map<SupportedLanguage, { score: number; reasons: string[] }>();
  const addScore = (language: SupportedLanguage, score: number, reason: string) => {
    const existing = scores.get(language) || { score: 0, reasons: [] };
    existing.score += score;
    existing.reasons.push(reason);
    scores.set(language, existing);
  };

  if (filename) addScore(byExtension, 2, 'File extension');

  for (const signature of CODE_SIGNATURES) {
    const hits = signature.patterns.filter(pattern => pattern.test(trimmed)).length;
    if (hits > 0) addScore(signature.language, signature.weight + hits, signature.reason);
  }

  let bestLanguage: SupportedLanguage | null = null;
  let bestScore = -1;
  let bestReasons: string[] = [];
  scores.forEach((value, key) => {
    if (value.score > bestScore) {
      bestLanguage = key;
      bestScore = value.score;
      bestReasons = value.reasons;
    }
  });
  if (!bestLanguage) return { language: byExtension, confidence: 1, reason: 'Default language' };

  return {
    language: bestLanguage,
    confidence: bestScore,
    reason: Array.from(new Set(bestReasons)).join(', '),
  };
}
