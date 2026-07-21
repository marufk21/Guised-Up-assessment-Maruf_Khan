import { spawn } from 'node:child_process';

import { getPort } from './ports.mjs';

const port = getPort('API_PORT', '8000');
const host = process.env.API_HOST?.trim() || '0.0.0.0';
const php = process.platform === 'win32' ? 'php.exe' : 'php';

const child = spawn(
  php,
  ['artisan', 'serve', `--host=${host}`, `--port=${port}`],
  {
    cwd: new URL('../apps/api/', import.meta.url),
    stdio: 'inherit',
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
