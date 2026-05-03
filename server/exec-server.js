#!/usr/bin/env node

const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const { spawn } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const url = require('url');

const START_EXEC_PORT = 5001;
const START_LIVE_PORT = 3100;
const MAX_PORT_ATTEMPTS = 100;

let ACTIVE_EXEC_PORT = START_EXEC_PORT;
let ACTIVE_LIVE_PORT = START_LIVE_PORT;

const TIME_LIMIT_MS = 15000;

function cleanupDir(dir) {
  if (dir && typeof dir === 'string' && fs.existsSync(dir) && dir.includes('codevis-')) {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
  }
}

function isSafeCode(code) {
  if (!code || typeof code !== 'string') return false;
  const dangerousPatterns = [/rm\s+-rf/, /mkfs/, /dd\s+if=/, /fork\(\)/, /: \(\) { : \| : & } ; :/];
  return !dangerousPatterns.some(p => p.test(code));
}

function startServerWithAutoPort(server, startPort) {
  return new Promise((resolve, reject) => {
    const maxPort = startPort + MAX_PORT_ATTEMPTS - 1;

    const tryPort = (port) => {
      console.log(`🚀 Trying port ${port}...`);

      const onError = (err) => {
        server.off('listening', onListening);
        if (err.code === 'EADDRINUSE') {
          const nextPort = port + 1;
          if (nextPort > maxPort) {
            console.error(`⚠️ No available ports in range ${startPort}-${maxPort}`);
            reject(err);
            return;
          }
          console.warn(`⚠️ Port ${port} is busy, trying ${nextPort}`);
          tryPort(nextPort);
          return;
        }
        console.error(`⚠️ Server listen error on port ${port}:`, err);
        reject(err);
      };

      const onListening = () => {
        server.off('error', onError);
        console.log(`🚀 Bound to port ${port}`);
        resolve(port);
      };

      server.once('error', onError);
      server.once('listening', onListening);
      server.listen(port);
    };

    tryPort(startPort);
  });
}

const liveSessions = new Map();

const liveServer = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.writeHead(204).end();

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  if (pathname === '/status') {
    console.log(`🔎 /status hit on live server`);
    return res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ status: 'ok', type: 'live' }));
  }

  if (pathname === '/sync-files' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        const sessionId = parsed?.sessionId;
        const files = parsed?.files;

        if (!sessionId || typeof sessionId !== 'string') throw new Error('Invalid sessionId');
        if (!Array.isArray(files)) throw new Error('Invalid files array');

        let sessionDir = liveSessions.get(sessionId);
        if (!sessionDir) {
          sessionDir = path.join(os.tmpdir(), `codevis-live-${sessionId.replace(/[^a-zA-Z0-9-]/g, '')}`);
          fs.mkdirSync(sessionDir, { recursive: true });
          liveSessions.set(sessionId, sessionDir);
        }

        const writeNodes = (nodes, currentPath) => {
          if (!Array.isArray(nodes)) return;
          for (const node of nodes) {
            if (!node?.name || typeof node.name !== 'string') continue;
            const safeName = path.basename(node.name);
            const nodePath = path.join(currentPath, safeName);
            
            if (node.type === 'folder') {
              if (!fs.existsSync(nodePath)) fs.mkdirSync(nodePath, { recursive: true });
              if (Array.isArray(node.children)) writeNodes(node.children, nodePath);
            } else {
              fs.writeFileSync(nodePath, typeof node.content === 'string' ? node.content : '', 'utf8');
            }
          }
        };
        
        writeNodes(files, sessionDir);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, url: `http://localhost:${ACTIVE_LIVE_PORT}/preview/${sessionId}/` }));
      } catch (err) {
        res.writeHead(400).end(JSON.stringify({ success: false, error: err.message || 'Unknown error' }));
      }
    });
    return;
  }

  const previewMatch = pathname?.match(/^\/preview\/([^/]+)\/(.*)$/);
  if (previewMatch) {
    const sessionId = previewMatch[1];
    const sessionDir = liveSessions.get(sessionId);
    if (!sessionDir) return res.writeHead(404).end('Session Expired');
    
    const filePath = previewMatch[2] || 'index.html';
    const safeFilePath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
    const fullPath = path.join(sessionDir, safeFilePath);
    
    if (!fullPath.startsWith(sessionDir)) return res.writeHead(403).end('Forbidden');
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      const ext = path.extname(fullPath).toLowerCase();
      const mimes = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css' };
      res.writeHead(200, { 'Content-Type': mimes[ext] || 'text/plain' });
      fs.createReadStream(fullPath).pipe(res);
    } else {
      res.writeHead(404).end('Not Found');
    }
    return;
  }
  if (pathname === '/run-code' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const { language, code, stdin } = JSON.parse(body);
        if (!code) throw new Error('No code provided');
        
        console.log(`[HTTP] Executing ${language}...`);
        const sessionId = crypto.randomUUID().slice(0, 8);
        const sessionDir = path.join(os.tmpdir(), `codevis-http-${sessionId}`);
        fs.mkdirSync(sessionDir, { recursive: true });

        const ext = { java:'java', python:'py', javascript:'js', cpp:'cpp', c:'c' }[language] || 'txt';
        const fileName = language === 'java' ? 'Main.java' : `main.${ext}`;
        fs.writeFileSync(path.join(sessionDir, fileName), code, 'utf8');

        const config = getLanguageConfig(language, fileName);
        if (config.setup) {
          for (const [cmd, args] of config.setup) {
            await new Promise((r, j) => {
              const p = spawn(cmd, args || [], { cwd: sessionDir, shell: true });
              p.on('close', c => c === 0 ? r() : j(new Error(`Setup failed with code ${c}`)));
            });
          }
        }

        const [cmd, args] = config.combined || config.run;
        const startTime = Date.now();
        let stdout = '', stderr = '';

        const proc = spawn(cmd, args || [], { 
          cwd: sessionDir, 
          shell: cmd.startsWith('./'), 
          env: { ...process.env, PYTHONUNBUFFERED: '1' } 
        });

        if (stdin) {
          proc.stdin.write(stdin.endsWith('\n') ? stdin : `${stdin}\n`);
          proc.stdin.end();
        }

        proc.stdout.on('data', d => stdout += d.toString());
        proc.stderr.on('data', d => stderr += d.toString());

        const exitCode = await new Promise(r => {
          const t = setTimeout(() => { proc.kill(); r(124); }, 15000);
          proc.on('close', c => { clearTimeout(t); r(c); });
        });

        const time = Date.now() - startTime;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ output: stdout, error: stderr, code: exitCode, time }));
        
        setTimeout(() => cleanupDir(sessionDir), 2000);
      } catch (err) {
        res.writeHead(500).end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }
  res.end('Live Server Active');
});

function getLanguageConfig(language, fileName) {
  switch (language) {
    case 'python':     return { run: ['python3', [fileName]] };
    case 'javascript': return { run: ['node', [fileName]] };
    case 'typescript': return { combined: ['npx', ['ts-node', fileName]] };
    case 'java':       return { setup: [['javac', ['*.java', '-d', '.']]], run: ['java', ['Main']] };
    case 'cpp':        return { setup: [['g++', ['*.cpp', '-o', 'p', '-std=c++17']]], run: ['./p', []] };
    case 'c':          return { setup: [['gcc', ['*.c', '-o', 'p', '-std=c11', '-lm']]], run: ['./p', []] };
    case 'go':         return { run: ['go', ['run', '.']] };
    case 'rust':       return { setup: [['rustc', [fileName, '-o', 'p']]], run: ['./p', []] };
    default:           return { run: ['bash', ['-c', `echo "Language '${language || 'unknown'}' not supported"`]] };
  }
}

const execHttpServer = http.createServer((req, res) => {
  res.writeHead(200, { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', type: 'exec', livePort: ACTIVE_LIVE_PORT }));
});

const wss = new WebSocketServer({ server: execHttpServer });
wss.on('error', () => {});

wss.on('connection', (ws) => {
  console.log(`🔌 WebSocket client connected`);
  let activeProcess = null;
  const send = (msg) => {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
      }
    } catch {}
  };

  ws.on('message', async (raw) => {
    let msg;
    try {
      const payload = Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw ?? '');
      msg = JSON.parse(payload);
    } catch { 
      return; 
    }

    if (msg?.type === 'run' || msg?.type === 'start') {
      const code = msg?.code;
      const language = msg?.language;
      const stdin = typeof msg?.stdin === 'string' ? msg.stdin : '';
      console.log(`\n▶️ Execution requested for language: ${language || 'unknown'}`);
      console.log(`Code payload received (${code?.length || 0} bytes)`);
      
      
      if (activeProcess) { 
        try { activeProcess.kill(); } catch {} 
      }
      
      if (!isSafeCode(code)) {
        return send({ type: 'stderr', data: '\r\n\x1b[31mSafety Violation detected\x1b[0m\r\n' });
      }

      const sessionId = crypto.randomUUID().slice(0, 8);
      const sessionDir = path.join(os.tmpdir(), `codevis-exec-${sessionId}`);
      fs.mkdirSync(sessionDir, { recursive: true });

      const ext = { java:'java', python:'py', javascript:'js', cpp:'cpp', c:'c' }[language] || 'txt';
      const fileName = language === 'java' ? 'Main.java' : `main.${ext}`;
      fs.writeFileSync(path.join(sessionDir, fileName), code, 'utf8');

      const config = getLanguageConfig(language, fileName);
      if (config.setup) {
        for (const [cmd, args] of config.setup) {
          const ok = await new Promise(r => {
            const p = spawn(cmd, args || [], { cwd: sessionDir, shell: true });
            p.stderr.on('data', d => send({ type: 'stderr', data: d.toString() }));
            p.on('close', c => r(c === 0));
          });
          if (!ok) return send({ type: 'exit', code: 1 });
        }
      }

      const [cmd, args] = config.combined || config.run;
      console.log(`Starting process: ${cmd} ${args.join(' ')}`);
      activeProcess = spawn(cmd, args || [], { 
        cwd: sessionDir, 
        shell: cmd.startsWith('./'), 
        env: { ...process.env, PYTHONUNBUFFERED: '1' } 
      });
      
      activeProcess.on('error', (err) => {
        console.error(`⚠️ Process error: ${err.message}`);
        send({ type: 'stderr', data: `\r\n\x1b[31mProcess failed to start: ${err.message}\x1b[0m\r\n` });
      });

      send({ type: 'status', status: 'running' });

      if (stdin && activeProcess.stdin?.writable) {
        activeProcess.stdin.write(stdin.endsWith('\n') ? stdin : `${stdin}\n`);
        activeProcess.stdin.end();
      }

      const timer = setTimeout(() => { 
        if (activeProcess) {
          try { activeProcess.kill(); } catch {}
          send({ type: 'stderr', data: '\r\n\x1b[31mExecution Timed Out (15s)\x1b[0m\r\n' });
        }
      }, TIME_LIMIT_MS);

      activeProcess.stdout.on('data', d => {
        const out = d.toString();
        console.log(`STDOUT: ${out.trim()}`);
        send({ type: 'stdout', data: out });
      });
      
      activeProcess.stderr.on('data', d => {
        const err = d.toString();
        console.error(`STDERR: ${err.trim()}`);
        send({ type: 'stderr', data: err });
      });
      
      activeProcess.on('close', (code) => {
        console.log(`Process closed with code: ${code}`);
        clearTimeout(timer);
        send({ type: 'exit', code });
        setTimeout(() => cleanupDir(sessionDir), 5000);
      });
    }
    
    if (msg?.type === 'stdin' && activeProcess?.stdin?.writable) {
      try {
        activeProcess.stdin.write(typeof msg?.data === 'string' ? msg.data : '');
      } catch {}
    }
    
    if (msg?.type === 'kill' && activeProcess) {
      try { activeProcess.kill(); } catch {}
    }
  });

  ws.on('close', () => { 
    if (activeProcess) {
      try { activeProcess.kill(); } catch {}
    }
  });
});

async function init() {
  try {
    console.log('🚀 Starting CodeVisualizer execution services...');
    ACTIVE_LIVE_PORT = await startServerWithAutoPort(liveServer, START_LIVE_PORT);
    ACTIVE_EXEC_PORT = await startServerWithAutoPort(execHttpServer, START_EXEC_PORT);
    console.log('\n=============================================');
    console.log('✔ Frontend running on http://localhost:3000');
    console.log(`✔ Exec Server running on port ${ACTIVE_EXEC_PORT}`);
    console.log(`✔ Live Server running on port ${ACTIVE_LIVE_PORT}`);
    console.log('=============================================\n');
  } catch (e) {
    console.error('⚠️ Failed to start servers:', e);
    process.exit(1);
  }
}

init();

process.on('SIGINT', () => {
  for (const dir of liveSessions.values()) {
    cleanupDir(dir);
  }
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('⚠️ Uncaught Exception:', err?.stack || err);
});

process.on('unhandledRejection', (reason) => {
  console.error('⚠️ Unhandled Rejection:', reason?.stack || reason);
});
