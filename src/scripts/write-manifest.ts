import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { generateToolbarIcons } from './generate-toolbar-icons';

const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:\.\d+)?$/;

type BrowserTarget = 'chromium' | 'firefox';

interface PackageJson {
  version?: string;
}

type WebExtensionBackground =
  | {
      service_worker: string;
      type: 'module';
    }
  | {
      scripts: [string];
      type: 'module';
    };

interface WebExtensionManifest {
  manifest_version: 3;
  name: string;
  version: string;
  description: string;
  action: {
    default_title: string;
    default_popup: string;
    default_icon: Record<string, string>;
  };
  options_ui: {
    page: string;
    open_in_tab: boolean;
  };
  background: WebExtensionBackground;
  permissions: string[];
  host_permissions: string[];
  icons: Record<string, string>;
  browser_specific_settings?: {
    gecko: {
      id: string;
      strict_min_version: string;
    };
  };
  content_security_policy?: {
    extension_pages: string;
  };
}

function assertBrowserTarget(value: string | undefined): BrowserTarget {
  if (value === 'chromium' || value === 'firefox') {
    return value;
  }

  throw new Error('Expected browser target to be "chromium" or "firefox"');
}

function assertVersion(version: string | undefined): string {
  if (!version || !VERSION_PATTERN.test(version)) {
    throw new Error(
      `package.json version "${version ?? ''}" is invalid for extension manifests`,
    );
  }

  return version;
}

async function readPackageVersion(rootDir: string): Promise<string> {
  const packageJsonPath = join(rootDir, 'package.json');
  const packageJsonRaw = await readFile(packageJsonPath, 'utf8');
  const parsed = JSON.parse(packageJsonRaw) as PackageJson;

  return assertVersion(parsed.version);
}

function buildManifest(
  target: BrowserTarget,
  version: string,
): WebExtensionManifest {
  const extensionPagesCsp =
    target === 'chromium'
      ? "script-src 'self'; object-src 'self'; worker-src 'self'"
      : "script-src 'self'; object-src 'self'; worker-src 'self' blob:";

  const base: WebExtensionManifest = {
    manifest_version: 3,
    name: 'MadHeader',
    version,
    description:
      'Override HTTP request and response headers using preset configurations.',
    action: {
      default_title: 'MadHeader',
      default_popup: 'popup.html',
      default_icon: {
        '16': 'icons/madheader-icon-v2-grayscale-16.png',
        '32': 'icons/madheader-icon-v2-grayscale-32.png',
      },
    },
    options_ui: {
      page: 'options.html',
      open_in_tab: true,
    },
    background:
      target === 'chromium'
        ? {
            service_worker: 'background.js',
            type: 'module',
          }
        : {
            scripts: ['background.js'],
            type: 'module',
          },
    permissions: ['storage', 'declarativeNetRequestWithHostAccess', 'tabs'],
    host_permissions: ['<all_urls>'],
    icons: {
      '16': 'icons/madheader-icon-v2-16.png',
      '48': 'icons/madheader-icon-v2-48.png',
      '128': 'icons/madheader-icon-v2-128.png',
    },
    content_security_policy: {
      extension_pages: extensionPagesCsp,
    },
  };

  if (target === 'firefox') {
    base.browser_specific_settings = {
      gecko: {
        id: '{355f8e43-3d1d-4459-8edb-28dd85daf53d}',
        strict_min_version: '128.0',
      },
    };
  }

  return base;
}

async function copyIcons(rootDir: string, outDir: string): Promise<void> {
  const source = resolve(rootDir, 'src/icons');
  const destination = resolve(outDir, 'icons');

  await mkdir(destination, { recursive: true });
  await cp(source, destination, {
    recursive: true,
    force: true,
    filter: (sourcePath) => !basename(sourcePath).startsWith('.'),
  });
}

export async function writeManifest(
  target: BrowserTarget,
  outDir: string,
  rootDir: string,
): Promise<void> {
  const version = await readPackageVersion(rootDir);
  const manifest = buildManifest(target, version);

  await mkdir(outDir, { recursive: true });
  await writeFile(
    join(outDir, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );

  await copyIcons(rootDir, outDir);
  await generateToolbarIcons(rootDir, outDir);

  console.log(`Wrote manifest for ${target} to ${outDir}`);
}

async function main(): Promise<void> {
  const target = assertBrowserTarget(process.argv[2]);
  const outDir = resolve(process.argv[3] ?? `dist/${target}`);
  const rootDir = resolve(import.meta.dirname, '..', '..');

  await writeManifest(target, outDir, rootDir);
}

const entryPoint = process.argv[1];
if (
  entryPoint !== undefined &&
  pathToFileURL(resolve(entryPoint)).href === import.meta.url
) {
  void main();
}
