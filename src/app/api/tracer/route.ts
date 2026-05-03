import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function POST(req: NextRequest) {
  try {
    const { code, language } = await req.json();

    if (language !== 'python') {
      return NextResponse.json({ error: 'Real tracer only supports Python currently.' }, { status: 400 });
    }

    // Create a temporary file with the tracer logic
    const tempDir = os.tmpdir();
    const fileName = `trace_${Date.now()}.py`;
    const filePath = path.join(tempDir, fileName);

    const tracerCode = `
import sys
import json
import traceback

class Tracer:
    def __init__(self):
        self.steps = []
        self.stdout = []
        self.variables = {}

    def trace_calls(self, frame, event, arg):
        if event != 'line':
            return self.trace_calls
        
        # Capture line info
        line_no = frame.f_lineno
        line_content = ""
        # Variables (filter out builtins)
        vars_snapshot = {}
        for k, v in frame.f_locals.items():
            if k.startswith('__'): continue
            try:
                # Try to capture as JSON serializable if it's a simple structure
                if isinstance(v, (list, dict, str, int, float, bool)) or v is None:
                    json.dumps(v)
                    vars_snapshot[k] = v
                else:
                    vars_snapshot[k] = str(v)
            except:
                vars_snapshot[k] = str(v)
        
        self.steps.append({
            "lineNumber": line_no,
            "variables": vars_snapshot,
            "event": "statement"
        })
        return self.trace_calls

def run_code():
    code_to_run = ${JSON.stringify(code)}
    tracer = Tracer()
    
    # Redirect stdout
    import io
    from contextlib import redirect_stdout
    
    f = io.StringIO()
    with redirect_stdout(f):
        try:
            sys.settrace(tracer.trace_calls)
            exec(code_to_run, {})
            sys.settrace(None)
        except Exception as e:
            sys.settrace(None)
            print(f"Error: {e}")
            # traceback.print_exc()

    output = f.getvalue()
    for i, step in enumerate(tracer.steps):
        step["stepIndex"] = i
        step["stdout"] = output
        
    print(json.dumps(tracer.steps))

if __name__ == "__main__":
    run_code()
`;

    fs.writeFileSync(filePath, tracerCode);

    return new Promise<NextResponse>((resolve) => {
      const pythonProcess = spawn('python3', [filePath]);
      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        fs.unlinkSync(filePath); // Cleanup
        if (code !== 0) {
          resolve(NextResponse.json({ success: false, error: stderr || 'Execution failed' }));
        } else {
          try {
            // Find the JSON part in stdout
            const lines = stdout.split('\n').filter(l => l.trim().startsWith('['));
            const steps = JSON.parse(lines[lines.length - 1]);
            resolve(NextResponse.json({ success: true, steps }));
          } catch (e) {
            resolve(NextResponse.json({ success: false, error: 'Failed to parse trace output', raw: stdout }));
          }
        }
      });
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
