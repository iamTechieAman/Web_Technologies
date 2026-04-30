/**
 * CodeVisualizer Language-Aware Pre-processor
 * Automatically fixes language-specific boilerplate and entry point issues.
 */
export function preprocessCode(code: string, language: string): string {
  let processed = code.trim();

  switch (language) {
    case 'java': {
      // 1. Remove package declarations (anywhere in the file, with any whitespace)
      processed = processed.replace(/^\s*package\s+[\w.]+;\s*$/gm, '');

      // 2. Rename the first public class to 'Main'
      const publicClassRegex = /public\s+class\s+([a-zA-Z_$][a-zA-Z\d_$]*)/;
      const match = processed.match(publicClassRegex);
      if (match) {
        const originalClassName = match[1];
        if (originalClassName !== 'Main') {
          processed = processed.replace(
            new RegExp(`public\\s+class\\s+${originalClassName}`),
            'public class Main'
          );
          processed = processed.replace(
            new RegExp(`\\b${originalClassName}\\s*\\(`, 'g'),
            'Main('
          );
        }
      } else if (!processed.includes('class Main')) {
        // If no Main class exists, wrap it
        if (!processed.includes('public static void main')) {
           processed = `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        ${processed.split('\n').join('\n        ')}\n    }\n}`;
        } else {
           processed = `import java.util.*;\n\npublic class Main {\n    ${processed.split('\n').join('\n    ')}\n}`;
        }
      }
      break;
    }

    case 'cpp': {
      if (!processed.includes('#include <iostream>')) {
        processed = `#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\n#include <map>\nusing namespace std;\n\n${processed}`;
      }
      if (!processed.includes('int main') && !processed.includes('void main')) {
        processed = `${processed}\n\nint main() {\n    return 0;\n}`;
      }
      break;
    }

    case 'c': {
      if (!processed.includes('#include <stdio.h>')) {
        processed = `#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <math.h>\n\n${processed}`;
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
      }
      if (!processed.includes('func main()')) {
        processed = `${processed}\n\nfunc main() {\n}`;
      }
      break;
    }
  }

  return processed;
}
