import { resolve } from 'node:path';

import { type Command, runCommandsSequentially } from './process-runner';

const rootDir = resolve(import.meta.dirname, '..', '..');
const commands: Command[] = [
  {
    executable: 'npm',
    args: ['run', 'clean'],
  },
  {
    executable: 'vite',
    args: ['build', '--config', 'vite.config.ts', '--outDir', 'dist/chromium'],
  },
  {
    executable: 'tsx',
    args: ['src/scripts/write-manifest.ts', 'chromium', 'dist/chromium'],
  },
  {
    executable: 'tsx',
    args: ['src/scripts/package-extension.ts', 'chromium'],
  },
  {
    executable: 'vite',
    args: ['build', '--config', 'vite.config.ts', '--outDir', 'dist/firefox'],
  },
  {
    executable: 'tsx',
    args: ['src/scripts/write-manifest.ts', 'firefox', 'dist/firefox'],
  },
  {
    executable: 'tsx',
    args: ['src/scripts/package-extension.ts', 'firefox'],
  },
];

async function main(): Promise<void> {
  process.exitCode = await runCommandsSequentially(commands, rootDir);
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
