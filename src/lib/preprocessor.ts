/**
 * CodeVisualizer Language-Aware Pre-processor
 * Automatically fixes language-specific boilerplate and entry point issues.
 */
export function preprocessCode(code: string, language: string): string {
  let processed = code.trim();
  const hasLine = (pattern: RegExp): boolean => pattern.test(processed);

  switch (language) {
    case 'java': {
      // 1. Remove package declarations
      processed = processed.replace(/^\s*package\s+[\w.]+;\s*$/gm, '');

      // 2. Extract imports to move to top
      const imports: string[] = [];
      processed = processed.replace(/^\s*import\s+[\w.*]+;\s*$/gm, (m) => {
        imports.push(m.trim());
        return '';
      }).trim();

      const importStr = imports.length > 0 ? imports.join('\n') + '\n\n' : 'import java.util.*;\n\n';

      // 3. Find any class definition (public or not) at the start of a line
      const classRegex = /^\s*(?:public\s+)?class\s+([a-zA-Z_$][a-zA-Z\d_$]*)/m;
      const match = processed.match(classRegex);

      if (match) {
        const originalClassName = match[1];
        if (originalClassName !== 'Main') {
          // Rename class and its constructors
          // Use a regex that matches the class definition strictly
          const renameRegex = new RegExp(`^(\\s*(?:public\\s+)?class\\s+)${originalClassName}\\b`, 'm');
          processed = processed.replace(renameRegex, '$1Main');
          
          // Rename constructors throughout the file
          processed = processed.replace(
            new RegExp(`\\b${originalClassName}\\s*\\(`, 'g'),
            'Main('
          );
        } else {
          // Ensure existing Main is public if it's at the start of a line
          processed = processed.replace(/^\s*class\s+Main/m, 'public class Main');
        }
        processed = importStr + processed;
      } else {
        // No class found at all, wrap as snippet
        if (!processed.includes('public static void main')) {
          processed = `${importStr}public class Main {\n    public static void main(String[] args) {\n        ${processed.split('\n').join('\n        ')}\n    }\n}`;
        } else {
          processed = `${importStr}public class Main {\n    ${processed.split('\n').join('\n    ')}\n}`;
        }
      }
      break;
    }

    case 'cpp': {
      const headers = ['iostream', 'vector', 'string', 'algorithm', 'map', 'unordered_map', 'set', 'queue', 'stack', 'cmath'];
      const missingHeaders = headers.filter(header => !new RegExp(`#include\\s*<${header}>`).test(processed));
      if (missingHeaders.length) {
        processed = `${missingHeaders.map(header => `#include <${header}>`).join('\n')}\n${processed}`;
      }
      if (!/\busing\s+namespace\s+std\s*;/.test(processed) && !/\bstd::/.test(processed)) {
        processed = `${processed.includes('#include') ? '' : '#include <iostream>\n'}using namespace std;\n\n${processed}`;
      }
      if (!processed.includes('int main') && !processed.includes('void main')) {
        processed = `${processed}\n\nint main() {\n    return 0;\n}`;
      }
      break;
    }

    case 'c': {
      const headers = ['stdio.h', 'stdlib.h', 'string.h', 'math.h', 'stdbool.h'];
      const missingHeaders = headers.filter(header => !new RegExp(`#include\\s*<${header.replace('.', '\\.')}>`).test(processed));
      if (missingHeaders.length) {
        processed = `${missingHeaders.map(header => `#include <${header}>`).join('\n')}\n\n${processed}`;
      }
      if (!processed.includes('int main') && !processed.includes('void main')) {
        processed = `${processed}\n\nint main() {\n    return 0;\n}`;
      }
      break;
    }

    case 'rust': {
      if (!processed.includes('fn main()')) {
        processed = `fn main() {\n    ${processed.split('\n').join('\n    ')}\n}`;
      }
      break;
    }

    case 'go': {
      if (!processed.includes('package main')) {
        processed = `package main\nimport "fmt"\n\n${processed}`;
      } else if (/\bfmt\./.test(processed) && !/import\s+(?:\(\s*)?"fmt"/.test(processed)) {
        processed = processed.replace(/package\s+main\s*/, 'package main\n\nimport "fmt"\n\n');
      }
      if (!processed.includes('func main()')) {
        processed = `${processed}\n\nfunc main() {\n}`;
      }
      break;
    }

    case 'csharp': {
      // 1. Remove namespace declarations
      processed = processed.replace(/^\s*namespace\s+[\w.]+;\s*$/gm, '');
      processed = processed.replace(/^\s*namespace\s+[\w.]+\s*\{([\s\S]*)\}\s*$/m, '$1').trim();

      // 2. If no class is present, wrap it
      if (!processed.includes('class ')) {
        processed = `using System;\nusing System.Collections.Generic;\nusing System.Linq;\n\npublic class Program {\n    public static void Main(string[] args) {\n        ${processed.split('\n').join('\n        ')}\n    }\n}`;
      }
      break;
    }

    case 'typescript':
    case 'javascript': {
      if (/\bfs\./.test(processed) && !/(?:require\(['"]fs['"]\)|from\s+['"]fs['"])/.test(processed)) {
        processed = `const fs = require('fs');\n${processed}`;
      }
      break;
    }

    case 'php': {
      if (!processed.startsWith('<?php')) {
        processed = `<?php\n\n${processed}`;
      }
      break;
    }

    case 'kotlin': {
      if (!processed.includes('fun main')) {
        processed = `fun main(args: Array<String>) {\n    ${processed.split('\n').join('\n    ')}\n}`;
      }
      break;
    }

    case 'python': {
      // Ensure common imports if missing
      const commonImports = ['math', 'collections', 'heapq', 'bisect', 'itertools', 'sys'];
      let importsToAdd = '';
      commonImports.forEach(imp => {
        if (processed.includes(`${imp}.`) && !hasLine(new RegExp(`(?:^|\\n)\\s*import\\s+${imp}\\b`))) {
          importsToAdd += `import ${imp}\n`;
        }
      });
      if (/\bdefaultdict\s*\(/.test(processed) && !/from\s+collections\s+import\s+.*defaultdict/.test(processed)) importsToAdd += 'from collections import defaultdict\n';
      if (/\bdeque\s*\(/.test(processed) && !/from\s+collections\s+import\s+.*deque/.test(processed)) importsToAdd += 'from collections import deque\n';
      if (/\bCounter\s*\(/.test(processed) && !/from\s+collections\s+import\s+.*Counter/.test(processed)) importsToAdd += 'from collections import Counter\n';
      if (importsToAdd) processed = importsToAdd + '\n' + processed;
      break;
    }

    case 'bash': {
      if (!processed.startsWith('#!')) {
        processed = `#!/bin/bash\n${processed}`;
      }
      break;
    }
  }

  return processed;
}
