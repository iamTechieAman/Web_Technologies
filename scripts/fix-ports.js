const { execSync } = require('child_process');
const os = require('os');

console.log('🧹 Scanning and fixing port conflicts for ranges: 3000-3050, 3100-3200, 5000-5100...');

const ranges = [
  [3000, 3050],
  [3100, 3200],
  [5000, 5100]
];

const platform = os.platform();

for (const [start, end] of ranges) {
  if (platform === 'darwin' || platform === 'linux') {
    try {
      // Fast batch kill for unix
      const command = `lsof -ti:${start}-${end}`;
      const pids = execSync(command, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
      if (pids) {
        const pidList = pids.split('\n').filter(Boolean).join(' ');
        execSync(`kill -9 ${pidList}`, { stdio: 'ignore' });
      }
    } catch (e) {}
  } else if (platform === 'win32') {
    for (let port = start; port <= end; port++) {
      try {
        const out = execSync(`netstat -ano | findstr :${port}`).toString();
        const pids = out.split('\n')
          .map(line => line.trim().split(/\s+/))
          .filter(parts => parts.length >= 5 && parts[1].includes(`:${port}`))
          .map(parts => parts[parts.length - 1]);
        
        for (const pid of new Set(pids)) {
          if (pid && pid !== '0') {
            try { execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' }); } catch (e) {}
          }
        }
      } catch (e) {}
    }
  }
}

console.log('✅ Ports fixed and ready.');
