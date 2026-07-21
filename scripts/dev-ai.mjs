import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { getPort } from './ports.mjs';

const port = getPort('AI_PORT', '8001');
const appDir = new URL('../apps/ai/', import.meta.url);
const venvPython = new URL(
  process.platform === 'win32' ? '.venv/Scripts/python.exe' : '.venv/bin/python',
  appDir,
);
const python = existsSync(fileURLToPath(venvPython))
  ? fileURLToPath(venvPython)
  : 'python';

const child = spawn(
  python,
  ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', port],
  {
    cwd: appDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      OTEL_SDK_DISABLED: 'true',
    },
  },
);

let terminating = false;

process.on('SIGINT', () => {
  terminating = true;
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  terminating = true;
  child.kill('SIGTERM');
});

child.on('exit', (code, signal) => {
  if (signal || terminating) {
    process.exit(0);
  }
  process.exit(code ?? 0);
});
