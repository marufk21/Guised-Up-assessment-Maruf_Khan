import { spawn } from 'node:child_process';

import { getPort } from './ports.mjs';

const port = getPort('API_PORT', '8000');
const php = process.platform === 'win32' ? 'php.exe' : 'php';

const child = spawn(
  php,
  ['artisan', 'serve', '--host=127.0.0.1', `--port=${port}`],
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
