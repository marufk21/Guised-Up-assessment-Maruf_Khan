import { readFileSync } from 'node:fs';

const envUrl = new URL('../.env', import.meta.url);

function readRootEnv() {
  try {
    return Object.fromEntries(
      readFileSync(envUrl, 'utf8')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'))
        .map((line) => {
          const index = line.indexOf('=');
          return [line.slice(0, index), line.slice(index + 1)];
        })
        .filter(([key]) => key),
    );
  } catch {
    return {};
  }
}

export function getPort(name, fallback) {
  return process.env[name] || readRootEnv()[name] || fallback;
}
