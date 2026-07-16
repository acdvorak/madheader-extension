import { parse } from 'jsonc-parser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  loadStoredConfigJsonc,
  saveStoredConfigJsonc,
} from '@/services/storage/config-storage';

import {
  type ConfigPipelineSuccess,
  loadEditorConfigJsonc,
  saveConfigFromEditorJsonc,
  type SaveConfigPipelineResult,
} from './config-persistence';

vi.mock('@/services/storage/config-storage', () => ({
  loadStoredConfigJsonc: vi.fn(),
  saveStoredConfigJsonc: vi.fn(),
}));

const unformattedJsonc = `{
// The selected preset.
"activePreset":null,
    /* Presets available to the extension. */
"presets":[]
}`;

const formattedJsonc = `{
  // The selected preset.
  "activePreset": null,
  /* Presets available to the extension. */
  "presets": [],
}\n`;

const unnormalizedJsonc = `{
// Keep this top-level comment.
"activePreset":"  Missing Preset  ",
"presets":[{
// Keep this preset comment.
"id":"  Support Team  ",
"name":"  Support Team  "
}]
}`;

const jsoncWithUnknownField = `{
// Keep this comment before the removed field.
"unknownField":true,
// Keep this comment before the next field.
"activePreset":null,
// Keep this comment before presets.
"presets":[]
}`;

const jsoncWithShorthandGlob = `{
  "activePreset": null,
  "presets": [
    {
      "name": "Shorthand glob",
      "reqHeaders": {
        "x-test": "enabled",
      },
      "include": {
        "globs": ["*.example.com"],
      },
    },
  ],
}\n`;

function expectJsoncToMatchConfig(jsonc: string, config: object): void {
  expect(parse(jsonc)).toEqual(config);
  expect(jsonc).toContain('  // Keep this top-level comment.');
  expect(jsonc).toContain('      // Keep this preset comment.');
}

function expectSuccessfulSave(
  result: SaveConfigPipelineResult,
): ConfigPipelineSuccess {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error('Expected configuration save to succeed');
  }

  return result;
}

describe('config JSONC persistence', () => {
  beforeEach(() => {
    vi.mocked(saveStoredConfigJsonc).mockResolvedValue('sync');
  });

  it('preserves and indents comments when saving editor text', async () => {
    const result = await saveConfigFromEditorJsonc(unformattedJsonc);

    expect(result).toMatchObject({
      ok: true,
      normalizedJsonc: formattedJsonc,
    });
    expect(saveStoredConfigJsonc).toHaveBeenCalledWith(formattedJsonc);
  });

  it('preserves and indents comments when loading stored editor text', async () => {
    vi.mocked(loadStoredConfigJsonc).mockResolvedValue({
      jsonc: unformattedJsonc,
      storageArea: 'sync',
    });

    const result = await loadEditorConfigJsonc();

    expect(result).toMatchObject({
      jsonc: formattedJsonc,
      source: 'sync',
    });
  });

  it('applies Zod normalization and defaults without removing comments when saving', async () => {
    const result = expectSuccessfulSave(
      await saveConfigFromEditorJsonc(unnormalizedJsonc),
    );

    expectJsoncToMatchConfig(result.normalizedJsonc, result.config);
  });

  it('applies Zod normalization and defaults without removing comments when loading', async () => {
    vi.mocked(loadStoredConfigJsonc).mockResolvedValue({
      jsonc: unnormalizedJsonc,
      storageArea: 'sync',
    });

    const result = await loadEditorConfigJsonc();

    expectJsoncToMatchConfig(result.jsonc, result.config);
  });

  it('preserves surrounding comments when Zod strips an unknown field', async () => {
    const result = expectSuccessfulSave(
      await saveConfigFromEditorJsonc(jsoncWithUnknownField),
    );

    expect(parse(result.normalizedJsonc)).toEqual(result.config);
    expect(result.normalizedJsonc).not.toContain('unknownField');
    expect(result.normalizedJsonc).toContain(
      '  // Keep this comment before the removed field.',
    );
    expect(result.normalizedJsonc).toContain(
      '  // Keep this comment before the next field.',
    );
    expect(result.normalizedJsonc).toContain(
      '  // Keep this comment before presets.',
    );
  });

  it('preserves shorthand globs when saving editor text', async () => {
    const result = expectSuccessfulSave(
      await saveConfigFromEditorJsonc(jsoncWithShorthandGlob),
    );

    expect(result.config.presets[0]?.include?.globs).toEqual(['*.example.com']);
    expect(result.normalizedJsonc).toContain('"*.example.com"');
    expect(result.normalizedJsonc).not.toContain('*://*.example.com/*');
    expect(saveStoredConfigJsonc).toHaveBeenCalledWith(result.normalizedJsonc);
  });
});
