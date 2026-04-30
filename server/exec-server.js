#!/usr/bin/env node
/**
 * CodeVisualizer Interactive Execution Server
 * ============================================
 * A standalone WebSocket server that spawns real child processes and
 * pipes their stdio bidirectionally — enabling true interactive terminal
 * behavior (prompts, user typing, real-time output) for Java, Python, C++, JS.
 *
 * Runs on port 8765 alongside `npm run dev`.
 * Frontend connects via WebSocket; falls back to Piston batch mode if not running.
 *
 * Start: node server/exec-server.js
 *        (or: npm run exec-server)
 */

const http       = require('http');
const { WebSocketServer } = require('ws');
const { spawn }  = require('child_process');
const os         = require('os');
const path       = require('path');
const fs         = require('fs');
const crypto     = require('crypto');

const PORT = 8765;

// ── Language execution configs ────────────────────────────────────────────────

/**
 * Returns { setup, run } where:
 *   setup(srcPath) → array of [cmd, args] pairs to compile (may be empty)
 *   run(srcPath)   → [cmd, args] to execute
 */
function getLanguageConfig(language, srcPath, srcDir) {
  const base = path.basename(srcPath, path.extname(srcPath));

  switch (language) {
    case 'python':
      return {
        setup: [],
        run: ['python3', [srcPath]],
      };

    case 'javascript':
      return {
        setup: [],
        run: ['node', [srcPath]],
      };

    case 'typescript': {
      const jsOut = srcPath.replace('.ts', '.js');
      return {
        setup: [['npx', ['ts-node', srcPath]]],  // ts-node handles compile+run
        run: null,  // ts-node does both
        combined: ['npx', ['ts-node', srcPath]],
      };
    }

    case 'java': {
      const outDir = srcDir;
      return {
        setup: [['javac', [srcPath, '-d', outDir]]],
        run: ['java', ['-cp', outDir, 'Main']],
      };
    }

    case 'cpp': {
      const outBin = path.join(srcDir, 'program');
      return {
        setup: [['g++', [srcPath, '-o', outBin, '-std=c++17']]],
        run: [outBin, []],
      };
    }

    case 'c': {
      const outBin = path.join(srcDir, 'program');
      return {
        setup: [['gcc', [srcPath, '-o', outBin, '-std=c11', '-lm']]],
        run: [outBin, []],
      };
    }

    case 'go':
      return {
        setup: [],
        run: ['go', ['run', srcPath]],
      };

    case 'rust': {
      const outBin = path.join(srcDir, 'program');
      return {
        setup: [['rustc', [srcPath, '-o', outBin]]],
        run: [outBin, []],
      };
    }

    case 'csharp':
      // Requires dotnet CLI
      return {
        setup: [],
        run: ['dotnet', ['script', srcPath]],
      };

    case 'ruby':
      return {
        setup: [],
        run: ['ruby', [srcPath]],
      };

    case 'php':
      return {
        setup: [],
        run: ['php', [srcPath]],
      };

    default:
      return {
        setup: [],
        run: ['bash', ['-c', `echo "Language '${language}' not supported in local mode"`]],
      };
  }
}

/** Write source file to a temp directory. Returns { srcPath, srcDir }. */
function writeTempFile(code, language) {
  const extensions = {
    python: 'py', javascript: 'js', typescript: 'ts',
    java: 'java', cpp: 'cpp', c: 'c', go: 'go',
    rust: 'rs', csharp: 'cs', ruby: 'rb', php: 'php',
  };
  const ext = extensions[language] || 'txt';

  // Java requires Main.java exactly
  const fileName = language === 'java' ? 'Main.java' : `main.${ext}`;

  const sessionId = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  const srcDir    = path.join(os.tmpdir(), `codevis-${sessionId}`);
  fs.mkdirSync(srcDir, { recursive: true });

  const srcPath = path.join(srcDir, fileName);
  fs.writeFileSync(srcPath, code, 'utf8');

  return { srcPath, srcDir, sessionId };
}

/** Run a compilation step synchronously. Returns error string or null. */
function compileSync(cmd, args, cwd, onData) {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, { cwd, stdio: 'pipe' });
    let stderr = '';

    proc.stdout.on('data', d => { onData({ type: 'stdout', data: d.toString() }); });
    proc.stderr.on('data', d => {
      const s = d.toString();
      stderr += s;
      onData({ type: 'stderr', data: s });
    });

    proc.on('close', (code) => {
      resolve(code !== 0 ? stderr || `Compilation failed (exit ${code})` : null);
    });
    proc.on('error', (e) => resolve(`Cannot run compiler: ${e.message}. Is it installed?`));
  });
}

// ── WebSocket server ──────────────────────────────────────────────────────────

const httpServer = http.createServer((req, res) => {
  // Health check endpoint
  res.writeHead(200, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
  res.end('CodeVisualizer Exec Server OK');
});

const wss = new WebSocketServer({ server: httpServer });

console.log('\n🚀 CodeVisualizer Interactive Exec Server');
console.log(`   WebSocket: ws://localhost:${PORT}`);
console.log(`   Health:    http://localhost:${PORT}\n`);

wss.on('connection', (ws, req) => {
  console.log(`[exec-server] Client connected (${req.socket.remoteAddress})`);

  let activeProcess = null;
  let sessionDir    = null;

  // Helper: send a typed message to the client
  const send = (msg) => {
    try { ws.send(JSON.stringify(msg)); } catch {}
  };

  ws.on('message', async (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }

    // ── RUN ────────────────────────────────────────────────────────────────
    if (msg.type === 'run') {
      const { code, language } = msg;

      // Kill any previously running process
      if (activeProcess) {
        try { activeProcess.kill('SIGKILL'); } catch {}
        activeProcess = null;
      }

      send({ type: 'status', status: 'starting' });

      // Write source file
      let srcPath, srcDir;
      try {
        ({ srcPath, srcDir } = writeTempFile(code, language));
        sessionDir = srcDir;
      } catch (e) {
        send({ type: 'error', message: `Failed to create temp file: ${e.message}` });
        return;
      }

      const config = getLanguageConfig(language, srcPath, srcDir);

      // ── Compilation phase ────────────────────────────────────────────────
      if (config.setup && config.setup.length > 0) {
        send({ type: 'stdout', data: `\x1b[2m⚙ Compiling ${language}...\x1b[0m\r\n` });

        for (const [compileCmd, compileArgs] of config.setup) {
          const compileErr = await compileSync(
            compileCmd, compileArgs, srcDir,
            (d) => {
              if (d.type === 'stderr') {
                send({ type: 'stderr', data: d.data });
              }
            }
          );

          if (compileErr) {
            send({ type: 'compile_error', message: compileErr });
            send({ type: 'exit', code: 1 });
            return;
          }
        }
        send({ type: 'stdout', data: `\x1b[2m✓ Compiled successfully\x1b[0m\r\n\r\n` });
      }

      // ── Execution phase ─────────────────────────────────────────────────
      const [runCmd, runArgs] = config.combined
        ? config.combined
        : config.run;

      console.log(`[exec-server] Spawning: ${runCmd} ${runArgs.join(' ')}`);

      try {
        activeProcess = spawn(runCmd, runArgs, {
          cwd: srcDir,
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...process.env, PYTHONUNBUFFERED: '1' }, // Python: don't buffer output
        });
      } catch (spawnErr) {
        send({ type: 'error', message: `Cannot start ${language} runtime: ${spawnErr.message}. Is it installed?` });
        return;
      }

      send({ type: 'status', status: 'running', pid: activeProcess.pid });

      // Timeout: kill after 10 seconds
      const killTimer = setTimeout(() => {
        if (activeProcess) {
          activeProcess.kill('SIGKILL');
          send({ type: 'stdout', data: '\r\n\x1b[31m⏱ Process killed: 10s time limit exceeded\x1b[0m\r\n' });
        }
      }, 10_000);

      activeProcess.stdout.on('data', (data) => {
        send({ type: 'stdout', data: data.toString() });
      });

      activeProcess.stderr.on('data', (data) => {
        send({ type: 'stderr', data: data.toString() });
      });

      activeProcess.on('close', (code, signal) => {
        clearTimeout(killTimer);
        activeProcess = null;
        send({ type: 'exit', code, signal });
        console.log(`[exec-server] Process exited: code=${code} signal=${signal}`);

        // Cleanup temp files after a delay
        setTimeout(() => {
          try { fs.rmSync(srcDir, { recursive: true, force: true }); } catch {}
        }, 5000);
      });

      activeProcess.on('error', (err) => {
        clearTimeout(killTimer);
        send({ type: 'error', message: err.message });
        activeProcess = null;
      });
    }

    // ── STDIN — user typed something in the terminal ────────────────────────
    if (msg.type === 'stdin') {
      if (activeProcess && activeProcess.stdin.writable) {
        activeProcess.stdin.write(msg.data);
      }
    }

    // ── KILL ───────────────────────────────────────────────────────────────
    if (msg.type === 'kill') {
      if (activeProcess) {
        activeProcess.kill('SIGKILL');
        activeProcess = null;
        send({ type: 'stdout', data: '\r\n\x1b[31m■ Process terminated by user\x1b[0m\r\n' });
      }
    }

    // ── RESIZE (for pty support if added later) ────────────────────────────
    if (msg.type === 'resize') {
      // TODO: node-pty support for full TTY (colors, cursor control)
    }
  });

  ws.on('close', () => {
    console.log('[exec-server] Client disconnected');
    if (activeProcess) {
      try { activeProcess.kill('SIGKILL'); } catch {}
      activeProcess = null;
    }
  });

  ws.on('error', (e) => {
    console.error('[exec-server] WS error:', e.message);
  });
});

httpServer.listen(PORT, () => {
  console.log(`   Listening on port ${PORT} ✓\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[exec-server] Shutting down...');
  wss.close(() => process.exit(0));
});
process.on('SIGTERM', () => {
  wss.close(() => process.exit(0));
});
