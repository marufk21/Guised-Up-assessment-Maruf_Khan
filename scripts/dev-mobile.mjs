import { spawn } from 'node:child_process';

import { getPort } from './ports.mjs';

const port = getPort('MOBILE_PORT', '8081');
const expoArgs = ['expo', 'start', '--port', port, ...process.argv.slice(2)];
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

// On Windows, use shell:true for .cmd batch files but pass the full command
// as a single string to avoid the DEP0190 deprecation warning
let child;
if (process.platform === 'win32') {
  const fullCmd = [npx, ...expoArgs].join(' ');
  child = spawn(fullCmd, [], {
    cwd: new URL('../apps/mobile/', import.meta.url),
    stdio: 'inherit',
    shell: true,
  });
} else {
  child = spawn(npx, expoArgs, {
    cwd: new URL('../apps/mobile/', import.meta.url),
    stdio: 'inherit',
  });
}

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
