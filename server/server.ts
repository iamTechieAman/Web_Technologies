import { WebSocketServer, WebSocket } from 'ws';
import * as pty from 'node-pty';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { randomUUID } from 'crypto';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5001;
const wss = new WebSocketServer({ port: PORT });

console.log(`PTY Server running on port ${PORT}`);

interface StartMessage {
  type: 'start';
  language: string;
  code: string;
  stdin?: string;
  cols?: number;
  rows?: number;
}

interface InputMessage {
  type: 'input';
  data: string;
}

interface ResizeMessage {
  type: 'resize';
  cols: number;
  rows: number;
}

type Message = StartMessage | InputMessage | ResizeMessage;

wss.on('connection', (ws: WebSocket) => {
  let ptyProcess: pty.IPty | null = null;
  let tempDir: string | null = null;

  console.log('New client connected');

  ws.on('message', async (message: string | Buffer) => {
    try {
      const payload = Buffer.isBuffer(message) ? message.toString('utf8') : message;
      const msg: Message = JSON.parse(payload);

      if (msg.type === 'start') {
        if (ptyProcess) {
          ptyProcess.kill();
        }

        const { language, code, stdin = '', cols, rows } = msg;
        tempDir = path.join(os.tmpdir(), `codevis-${randomUUID()}`);
        fs.mkdirSync(tempDir, { recursive: true });

        const { command, args, fileName } = getRunConfig(language, code, tempDir);
        
        if (fileName) {
          fs.writeFileSync(path.join(tempDir, fileName), code);
        }

        ptyProcess = pty.spawn(command, args, {
          name: 'xterm-color',
          cols: cols || 80,
          rows: rows || 24,
          cwd: tempDir,
          env: process.env as any,
        });

        ptyProcess.onData((data) => {
          ws.send(JSON.stringify({ type: 'output', data }));
        });

        if (stdin && ptyProcess) {
          ptyProcess.write(stdin.endsWith('\n') ? stdin : `${stdin}\n`);
        }

        ptyProcess.onExit(({ exitCode, signal }) => {
          ws.send(JSON.stringify({ type: 'exit', exitCode, signal }));
          cleanup();
        });

      } else if (msg.type === 'input') {
        if (ptyProcess) {
          ptyProcess.write(msg.data);
        }
      } else if (msg.type === 'resize') {
        if (ptyProcess) {
          ptyProcess.resize(msg.cols, msg.rows);
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
      ws.send(JSON.stringify({ type: 'output', data: `\r\nError: ${error instanceof Error ? error.message : String(error)}\r\n` }));
    }
  });

  const cleanup = () => {
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (err) {
        console.error('Cleanup error:', err);
      }
      tempDir = null;
    }
  };

  ws.on('close', () => {
    console.log('Client disconnected');
    if (ptyProcess) {
      ptyProcess.kill();
      ptyProcess = null;
    }
    cleanup();
  });
});

function getRunConfig(language: string, code: string, dir: string): { command: string; args: string[]; fileName?: string } {
  const lang = language.toLowerCase();
  
  switch (lang) {
    case 'python':
    case 'python3':
      return { command: 'python3', args: ['-u', '-c', code], fileName: 'script.py' };
    case 'javascript':
    case 'typescript':
    case 'node':
      return { command: 'node', args: ['-e', code], fileName: 'index.js' };
    case 'java': {
      // Find class name
      const match = code.match(/class\s+(\w+)/);
      const className = match ? match[1] : 'Main';
      const fileName = `${className}.java`;
      return { 
        command: 'bash', 
        args: ['-c', `javac ${fileName} && java ${className}`], 
        fileName 
      };
    }
    case 'cpp':
    case 'c++':
      return { 
        command: 'bash', 
        args: ['-c', `g++ -o solution solution.cpp && ./solution`], 
        fileName: 'solution.cpp' 
      };
    case 'c':
      return { 
        command: 'bash', 
        args: ['-c', `gcc -o solution solution.c && ./solution`], 
        fileName: 'solution.c' 
      };
    case 'go':
      return { command: 'go', args: ['run', 'main.go'], fileName: 'main.go' };
    case 'rust':
      return { 
        command: 'bash', 
        args: ['-c', `rustc main.rs && ./main`], 
        fileName: 'main.rs' 
      };
    case 'ruby':
      return { command: 'ruby', args: ['-e', code], fileName: 'script.rb' };
    default:
      return { command: 'bash', args: ['-c', 'echo "Unsupported language"'] };
  }
}
