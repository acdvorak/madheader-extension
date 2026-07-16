import { spawn } from 'node:child_process';
import { constants } from 'node:fs';
import { access, mkdir, readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

type BrowserTarget = 'chromium' | 'firefox';

type PackageTarget = BrowserTarget | 'all';

interface PackageJson {
  version?: string;
}

const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:\.\d+)?$/;

function assertPackageTarget(value: string | undefined): PackageTarget {
  if (value === 'chromium' || value === 'firefox' || value === 'all') {
    return value;
  }

  throw new Error(
    'Expected package target to be "chromium", "firefox", or "all"',
  );
}

function assertVersion(version: string | undefined): string {
  if (!version || !VERSION_PATTERN.test(version)) {
    throw new Error(
      `package.json version "${version ?? ''}" is invalid for packaging`,
    );
  }

  return version;
}

async function readPackageVersion(rootDir: string): Promise<string> {
  const packageJsonPath = resolve(rootDir, 'package.json');
  const packageJsonRaw = await readFile(packageJsonPath, 'utf8');
  const parsed = JSON.parse(packageJsonRaw) as PackageJson;

  return assertVersion(parsed.version);
}

async function assertDirExists(pathToDir: string): Promise<void> {
  await access(pathToDir, constants.F_OK);
}

function runZip(cwd: string, outputZipPath: string): Promise<void> {
  return new Promise<void>((resolvePromise, rejectPromise) => {
    const zip = spawn('zip', ['-r', '-q', outputZipPath, '.', '-x', '*.map'], {
      cwd,
      stdio: 'inherit',
    });

    zip.on('error', (error) => {
      rejectPromise(error);
    });

    zip.on('close', (exitCode) => {
      if (exitCode === 0) {
        resolvePromise();
        return;
      }

      rejectPromise(new Error(`zip exited with code ${String(exitCode)}`));
    });
  });
}

async function packageTarget(
  target: BrowserTarget,
  rootDir: string,
  version: string,
): Promise<void> {
  const distDir = resolve(rootDir, 'dist', target);
  const releaseDir = resolve(rootDir, 'release');
  const outputZipPath = resolve(
    releaseDir,
    `madheader-${target}-v${version}.zip`,
  );

  await assertDirExists(distDir);
  await mkdir(releaseDir, { recursive: true });
  await rm(outputZipPath, { force: true });

  await runZip(distDir, outputZipPath);
  console.log(`[package] created ${outputZipPath}`);
}

async function main(): Promise<void> {
  const target = assertPackageTarget(process.argv[2] ?? 'all');
  const rootDir = resolve(import.meta.dirname, '..', '..');
  const version = await readPackageVersion(rootDir);

  if (target === 'all') {
    await packageTarget('chromium', rootDir, version);
    await packageTarget('firefox', rootDir, version);
    return;
  }

  await packageTarget(target, rootDir, version);
}

void main();
