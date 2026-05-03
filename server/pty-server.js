const http = require('http');
const { WebSocketServer } = require('ws');
const pty = require('node-pty');
const os = require('os');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 5001;
const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

const server = http.createServer();
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('New terminal session started');

  let ptyProcess = null;

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'start') {
      const { command, args, cwd, env } = data;
      
      ptyProcess = pty.spawn(command || shell, args || [], {
        name: 'xterm-color',
        cols: data.cols || 80,
        rows: data.rows || 24,
        cwd: cwd || process.cwd(),
        env: { ...process.env, ...env }
      });

      ptyProcess.onData((data) => {
        ws.send(JSON.stringify({ type: 'output', data }));
      });

      ptyProcess.onExit(({ exitCode, signal }) => {
        ws.send(JSON.stringify({ type: 'exit', exitCode, signal }));
        ws.close();
      });
    } else if (data.type === 'input') {
      if (ptyProcess) {
        ptyProcess.write(data.data);
      }
    } else if (data.type === 'resize') {
      if (ptyProcess) {
        ptyProcess.resize(data.cols, data.rows);
      }
    }
  });

  ws.on('close', () => {
    if (ptyProcess) {
      ptyProcess.kill();
      console.log('Terminal session closed');
    }
  });
});

server.listen(PORT, () => {
  console.log(`PTY Server running on port ${PORT}`);
});
