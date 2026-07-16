import { watch } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { writeManifest } from './write-manifest';

type BrowserTarget = 'chromium' | 'firefox';

interface WatchContext {
  target: BrowserTarget;
  outDir: string;
  rootDir: string;
}

function assertBrowserTarget(value: string | undefined): BrowserTarget {
  if (value === 'chromium' || value === 'firefox') {
    return value;
  }

  throw new Error('Expected browser target to be "chromium" or "firefox"');
}

function shouldWatch(args: string[]): boolean {
  return args.includes('--watch');
}

async function writeAndReport(context: WatchContext): Promise<void> {
  await mkdir(context.outDir, { recursive: true });
  await writeManifest(context.target, context.outDir, context.rootDir);
  console.log(`[manifest] refreshed ${context.target} -> ${context.outDir}`);
}

function registerWatch(context: WatchContext): void {
  const packageJsonPath = resolve(context.rootDir, 'package.json');
  const iconPath = resolve(context.rootDir, 'src/icons/madheader-icon-v2.png');

  const onChange = (): void => {
    void writeAndReport(context);
  };

  watch(packageJsonPath, { persistent: true }, onChange);
  watch(iconPath, { persistent: true }, onChange);

  console.log(
    '[manifest] watching package.json and src/icons/madheader-icon-v2.png',
  );
}

async function main(): Promise<void> {
  const target = assertBrowserTarget(process.argv[2]);
  const outDir = resolve(process.argv[3] ?? `dist/${target}`);
  const watchMode = shouldWatch(process.argv.slice(4));
  const rootDir = resolve(import.meta.dirname, '..', '..');

  const context: WatchContext = {
    target,
    outDir,
    rootDir,
  };

  await writeAndReport(context);

  if (!watchMode) {
    return;
  }

  registerWatch(context);
}

void main();
