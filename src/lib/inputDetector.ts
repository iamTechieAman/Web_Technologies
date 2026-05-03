/**
 * CodeVisualizer Input Detector
 * Analyses source code BEFORE execution to detect stdin requirements.
 */
export interface InputRequirement {
  required: boolean;
  count: number;          // estimated number of tokens required
  types: string[];        // 'number' | 'string'
  hints: string[];        // human-readable hints shown in the modal
}

/** Language-specific stdin patterns */
const PATTERNS: Record<string, RegExp[]> = {
  java: [
    /scanner\.nextInt\(\)/gi,
    /scanner\.nextLong\(\)/gi,
    /scanner\.nextDouble\(\)/gi,
    /scanner\.nextFloat\(\)/gi,
    /scanner\.next\(\)/gi,
    /scanner\.nextLine\(\)/gi,
    /System\.in/gi,
    /BufferedReader/gi,
    /InputStreamReader/gi,
    /Console\.readLine/gi,
  ],
  python: [
    /\binput\s*\(/gi,
    /sys\.stdin/gi,
    /sys\.stdin\.read/gi,
    /map\s*\(\s*int\s*,\s*input/gi,
    /raw_input\s*\(/gi,
    /fileinput\.input\(\)/gi,
  ],
  cpp: [
    /\bcin\s*>>/gi,
    /scanf\s*\(/gi,
    /getline\s*\(\s*cin/gi,
    /fgets\s*\(\s*.*\s*,\s*.*\s*,\s*stdin\)/gi,
    /std::getline\s*\(/gi,
    /cin\.get\s*\(/gi,
    /cin\.getline\s*\(/gi,
  ],
  c: [
    /scanf\s*\(/gi,
    /fgets\s*\(\s*.*,\s*.*,\s*stdin\)/gi,
    /gets\s*\(/gi,
    /getchar\s*\(/gi,
  ],
  javascript: [
    /readline\s*\(/gi,
    /process\.stdin/gi,
    /require\s*\(\s*['"]readline['"]\s*\)/gi,
    /prompt\s*\(/gi,
    /confirm\s*\(/gi,
  ],
  typescript: [
    /readline\s*\(/gi,
    /process\.stdin/gi,
    /prompt\s*\(/gi,
    /confirm\s*\(/gi,
    /require\s*\(\s*['"]readline['"]\s*\)/gi,
  ],
  go: [
    /fmt\.Scan/gi,
    /fmt\.Scanf/gi,
    /fmt\.Scanln/gi,
    /bufio\.NewScanner\s*\(\s*os\.Stdin\)/gi,
    /os\.Stdin/gi,
    /bufio.NewReader\s*\(\s*os\.Stdin\)/gi,
  ],
  rust: [
    /stdin\(\)/gi,
    /read_line/gi,
    /BufReader::new\(stdin\(\)\)/gi,
    /io::stdin\(\)/gi,
    /std::io::stdin\(\)/gi,
  ],
  csharp: [
    /Console\.Read/gi,
    /Console\.ReadLine/gi,
    /Console\.ReadKey/gi,
    /Console\.In/gi,
  ],
  ruby: [
    /\bgets\b/gi,
    /\$stdin/gi,
    /STDIN\.gets/gi,
    /STDIN\.read/gi,
    /STDIN\.readline/gi,
    /gets\.chomp/gi,
  ],
  php: [
    /fgets\s*\(\s*STDIN\)/gi,
    /readline\s*\(/gi,
    /fgetcsv\s*\(\s*STDIN/gi,
    /trim\s*\(\s*fgets\s*\(\s*STDIN\s*\)\s*\)/gi,
    /file_get_contents\s*\(\s*["']php:\/\/stdin["']\s*\)/gi,
  ],
};

/** Hint messages per read pattern */
function hintFor(match: string, _language: string): { hint: string; type: 'number' | 'string' } {
  const m = match.toLowerCase();
  if (m.includes('nextint') || m.includes('nextlong')) return { hint: 'Enter an integer (e.g. 5)', type: 'number' };
  if (m.includes('nextdouble') || m.includes('nextfloat')) return { hint: 'Enter a decimal number (e.g. 3.14)', type: 'number' };
  if (m.includes('scanf')) return { hint: 'Enter value(s) separated by spaces', type: 'number' };
  if (m.includes('cin')) return { hint: 'Enter value(s) separated by spaces or newlines', type: 'number' };
  if (m.includes('int(input') || m.includes('float(input')) return { hint: 'Enter a number (e.g. 42)', type: 'number' };
  if (m.includes('input')) return { hint: 'Enter a value and press Enter', type: 'string' };
  if (m.includes('readline') || m.includes('read_line') || m.includes('gets') || m.includes('readLine')) {
    return { hint: 'Enter a line of text', type: 'string' };
  }
  return { hint: 'Enter the required input value', type: 'string' };
}

export function detectInputRequirements(code: string, language: string): InputRequirement {
  const patterns = PATTERNS[language] ?? [];
  const allMatches: string[] = [];

  for (const pattern of patterns) {
    // Reset lastIndex for global regexes
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(code)) !== null) {
      allMatches.push(match[0]);
    }
  }

  if (allMatches.length === 0) {
    return { required: false, count: 0, types: [], hints: [] };
  }

  const hints: string[] = [];
  const types: string[] = [];

  for (const m of allMatches) {
    const { hint, type } = hintFor(m, language);
    hints.push(hint);
    types.push(type);
  }

  return {
    required: true,
    count: allMatches.length,
    types,
    hints: Array.from(new Set(hints)), // deduplicate
  };
}
