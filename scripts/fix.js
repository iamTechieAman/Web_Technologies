const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const EXTS = new Set(['.js', '.jsx', '.ts', '.tsx']);
const SKIP = new Set(['node_modules', '.next', '.git']);

function walk(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, out);
      continue;
    }
    if (EXTS.has(path.extname(entry.name))) {
      out.push(fullPath);
    }
  }
  return out;
}

function applyFixes(source) {
  let updated = source;
  updated = updated.replace(/await\s+([A-Za-z0-9_$.]+)\.json\(\)(?!\s*\.catch\()/g, 'await $1.json().catch(() => null)');
  updated = updated.replace(/(\b[A-Za-z0-9_$.]+)\.send\(([^;\n]+)\);/g, 'if ($1.readyState === WebSocket.OPEN) $1.send($2);');
  updated = updated.replace(/if\s*\(\s*([A-Za-z0-9_$.]+)\.children\s*\)/g, 'if (Array.isArray($1.children))');
  return updated;
}

function run() {
  const files = walk(ROOT);
  for (const file of files) {
    const original = fs.readFileSync(file, 'utf8');
    const fixed = applyFixes(original);
    if (fixed !== original) {
      fs.writeFileSync(file, fixed, 'utf8');
    }
  }
}

run();
