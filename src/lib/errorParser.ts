export interface ParsedError {
  line?: number;
  type?: string;
  message: string;
  raw: string;
}

/**
 * Parses stderr output from various languages to extract line numbers and error types.
 */
export function parseError(stderr: string, language: string): ParsedError {
  const result: ParsedError = {
    message: stderr,
    raw: stderr
  };

  if (!stderr) return result;

  try {
    switch (language) {
      case 'java': {
        // Handle common remote execution errors
        if (stderr.includes('NoClassDefFoundError') && stderr.includes('wrong name')) {
          result.type = 'Structural Mismatch';
          result.message = 'CodeVisualizer detected a package declaration or class name mismatch. We have automatically adjusted your code to run as class "Main". Please remove "package" statements for single-file execution.';
          return result;
        }

        if (stderr.includes('java.util.NoSuchElementException')) {
          result.type = 'Input Error';
          result.message = 'Your program is waiting for input but none was provided. Use the "Input (stdin)" box in the editor panel to enter values before running.';
          return result;
        }

        const match = stderr.match(/Main\.java:(\d+): error: (.*)/);
        if (match) {
          result.line = parseInt(match[1]);
          result.message = match[2].trim();
          result.type = 'Compilation Error';
        } else {
          const runtimeMatch = stderr.match(/Exception in thread "main" ([\w.]+): (.*)/);
          if (runtimeMatch) {
            result.type = runtimeMatch[1];
            result.message = runtimeMatch[2];
            const lineMatch = stderr.match(/\(Main\.java:(\d+)\)/);
            if (lineMatch) result.line = parseInt(lineMatch[1]);
          }
        }
        break;
      }

      case 'python': {
        const match = stderr.match(/File ".*?", line (\d+)/);
        if (match) result.line = parseInt(match[1]);
        
        const lines = stderr.trim().split('\n');
        const lastLine = lines[lines.length - 1];
        if (lastLine.includes(':')) {
          const [type, ...msgParts] = lastLine.split(':');
          result.type = type.trim();
          result.message = msgParts.join(':').trim();
        }
        break;
      }

      case 'cpp':
      case 'c': {
        const match = stderr.match(/.*:(\d+):(\d+): error: (.*)/);
        if (match) {
          result.line = parseInt(match[1]);
          result.message = match[3].trim();
          result.type = 'Build Error';
        }
        break;
      }

      case 'javascript':
      case 'typescript': {
        const match = stderr.match(/:(\d+):(\d+)/);
        if (match) result.line = parseInt(match[1]);

        const lines = stderr.trim().split('\n');
        for (const line of lines) {
          if (line.includes('Error:') || line.includes('TypeError:') || line.includes('ReferenceError:')) {
            const [type, ...msgParts] = line.split(':');
            result.type = type.trim();
            result.message = msgParts.join(':').trim();
            break;
          }
        }
        break;
      }

      case 'go': {
        const match = stderr.match(/main\.go:(\d+):(\d+): (.*)/);
        if (match) {
          result.line = parseInt(match[1]);
          result.message = match[3].trim();
          result.type = 'Go Error';
        }
        break;
      }

      case 'rust': {
        const match = stderr.match(/--> main\.rs:(\d+):(\d+)/);
        if (match) result.line = parseInt(match[1]);
        
        const typeMatch = stderr.match(/error\[(.*?)\]: (.*)/);
        if (typeMatch) {
          result.type = `Rust Error ${typeMatch[1]}`;
          result.message = typeMatch[2].trim();
        }
        break;
      }
    }
  } catch (e) {
    console.error('[ErrorParser] Failed to parse:', e);
  }

  return result;
}
