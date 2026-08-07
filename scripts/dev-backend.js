const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');

// Detect Python executable in virtual environment or system
let pythonCmd = 'python';

const winVenv = path.join(backendDir, '.venv', 'Scripts', 'python.exe');
const unixVenv = path.join(backendDir, '.venv', 'bin', 'python');

if (fs.existsSync(winVenv)) {
  pythonCmd = winVenv;
} else if (fs.existsSync(unixVenv)) {
  pythonCmd = unixVenv;
}

console.log(`[BACKEND] Launching FastAPI using: ${pythonCmd}`);

const child = spawn(
  pythonCmd,
  ['-m', 'uvicorn', 'app.main:app', '--reload', '--host', '0.0.0.0', '--port', '8000', '--app-dir', backendDir],
  {
    cwd: rootDir,
    stdio: 'inherit',
    shell: false,
  }
);

child.on('error', (err) => {
  console.error('[BACKEND] Failed to start backend process:', err);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
