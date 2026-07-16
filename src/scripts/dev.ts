import { resolve } from 'node:path';

import { type Command, runCommandsConcurrently } from './process-runner';

const rootDir = resolve(import.meta.dirname, '..', '..');
const commands: Command[] = [
  {
    executable: 'vite',
    args: [
      'build',
      '--watch',
      '--emptyOutDir',
      'false',
      '--config',
      'vite.config.ts',
      '--outDir',
      'dist/chromium',
    ],
  },
  {
    executable: 'tsx',
    args: [
      'src/scripts/dev-manifest-watch.ts',
      'chromium',
      'dist/chromium',
      '--watch',
    ],
  },
  {
    executable: 'vite',
    args: [
      'build',
      '--watch',
      '--emptyOutDir',
      'false',
      '--config',
      'vite.config.ts',
      '--outDir',
      'dist/firefox',
    ],
  },
  {
    executable: 'tsx',
    args: [
      'src/scripts/dev-manifest-watch.ts',
      'firefox',
      'dist/firefox',
      '--watch',
    ],
  },
];

async function main(): Promise<void> {
  process.exitCode = await runCommandsConcurrently(commands, rootDir);
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
