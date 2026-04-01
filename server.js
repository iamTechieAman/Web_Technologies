const express = require('express');
const cors = require('cors');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

const TEMP_DIR = path.join(__dirname, 'temp_code');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR);
}

const TIMEOUT = 10000; // 10 seconds

app.post('/run-code', async (req, res) => {
  const { language, code, stdin } = req.body;
  const id = crypto.randomUUID();
  const folderPath = path.join(TEMP_DIR, id);
  fs.mkdirSync(folderPath);

  let fileName = '';
  let compileCmd = '';
  let runCmd = '';

  try {
    switch (language) {
      case 'javascript':
        fileName = 'solution.js';
        runCmd = `node ${fileName}`;
        break;
      case 'python':
        fileName = 'solution.py';
        runCmd = `python3 ${fileName}`;
        break;
      case 'java':
        fileName = 'Main.java';
        compileCmd = `javac ${fileName}`;
        runCmd = `java Main`;
        break;
      case 'cpp':
        fileName = 'solution.cpp';
        compileCmd = `g++ ${fileName} -o solution`;
        runCmd = `./solution`;
        break;
      default:
        return res.status(400).json({ error: 'Unsupported language' });
    }

    const filePath = path.join(folderPath, fileName);
    fs.writeFileSync(filePath, code);

    // Compilation step
    if (compileCmd) {
      await new Promise((resolve, reject) => {
        exec(compileCmd, { cwd: folderPath, timeout: TIMEOUT }, (error, stdout, stderr) => {
          if (error) reject(stderr || stdout || error.message);
          else resolve();
        });
      });
    }

    // Execution step
    const start = Date.now();
    const child = exec(runCmd, { cwd: folderPath, timeout: TIMEOUT }, (error, stdout, stderr) => {
      const duration = Date.now() - start;
      
      // Cleanup
      try {
        fs.rmSync(folderPath, { recursive: true, force: true });
      } catch (e) {}

      if (error && error.killed) {
        return res.json({ 
          output: '', 
          error: 'Execution Timed Out (Possible Infinite Loop)', 
          time: `${duration}ms` 
        });
      }

      res.json({
        output: stdout,
        error: stderr,
        time: `${duration}ms`
      });
    });

    if (stdin) {
      child.stdin.write(stdin);
      child.stdin.end();
    }

  } catch (err) {
    // Cleanup on error
    try {
      fs.rmSync(folderPath, { recursive: true, force: true });
    } catch (e) {}

    res.json({
      output: '',
      error: err.toString(),
      time: '0ms'
    });
  }
});

// Web Preview Sync
const PREVIEW_DIR = path.join(__dirname, 'previews');
if (!fs.existsSync(PREVIEW_DIR)) fs.mkdirSync(PREVIEW_DIR);

app.post('/sync-files', (req, res) => {
  const { sessionId, files } = req.body;
  const sessionPath = path.join(PREVIEW_DIR, sessionId);
  
  if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath);

  // Simple deep recursive file writing
  const writeFiles = (nodes, currentPath) => {
    nodes.forEach(node => {
      const nodePath = path.join(currentPath, node.name);
      if (node.type === 'folder') {
        if (!fs.existsSync(nodePath)) fs.mkdirSync(nodePath);
        if (node.children) writeFiles(node.children, nodePath);
      } else {
        fs.writeFileSync(nodePath, node.content || '');
      }
    });
  };

  try {
    writeFiles(files, sessionPath);
    res.json({ success: true, url: `http://localhost:3001/preview/${sessionId}/` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/preview', express.static(PREVIEW_DIR));

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`CodeVisualizer Engine (Execution + Web Preview) running on http://localhost:${PORT}`);
});
