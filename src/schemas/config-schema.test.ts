import { describe, expect, it } from 'vitest';
import type z from 'zod';

import {
  AnyColor,
  Base64Image,
  Base64Images,
  findDuplicatePresetIds,
  GlobExpression,
  ImageId,
  MadConfig,
  MadPreset,
  PresetId,
  PresetInitials,
  PresetName,
  RegexExpression,
  ReqHeaderMap,
  ReqHeaderValue,
  ResHeaderMap,
  ResHeaderValue,
} from './config-schema';

describe('config schema normalization', () => {
  it.each([
    ['colors', AnyColor, '#A1B2C3', '#a1b2c3'],
    [
      'request header values',
      ReqHeaderValue,
      '  header value  ',
      'header value',
    ],
    [
      'response header values',
      ResHeaderValue,
      '  header value  ',
      'header value',
    ],
    [
      'glob expressions',
      GlobExpression,
      '  https://*.example.com/*  ',
      'https://*.example.com/*',
    ],
    [
      'regular expressions',
      RegexExpression,
      '  ^https://example\\.com/  ',
      '^https://example\\.com/',
    ],
    ['image IDs', ImageId, '  avatar.png  ', 'avatar.png'],
    ['preset IDs', PresetId, '  Support Team_ID  ', 'support-team-id'],
    ['preset names', PresetName, '  Support Team  ', 'Support Team'],
    ['preset initials', PresetInitials, '  ST  ', 'ST'],
  ] satisfies Array<[string, z.ZodType<string, string>, string, string]>)(
    'normalizes %s',
    (_description, schema, input, expected) => {
      expect(schema.parse(input)).toBe(expected);
    },
  );

  it('accepts glob shorthand without expanding the schema output', () => {
    expect(GlobExpression.parse('*.example.com')).toBe('*.example.com');
  });

  it('validates base64 images', () => {
    expect(
      Base64Image.parse({
        id: ' avatar.png ',
        base64Bytes: 'aGVsbG8=',
        mimeType: 'image/png',
      }),
    ).toEqual<Base64Image>({
      id: 'avatar.png',
      base64Bytes: 'aGVsbG8=',
      mimeType: 'image/png',
    });
  });

  it('rejects empty and duplicate image IDs at each duplicate path', () => {
    const emptyIdResult = ImageId.safeParse('   ');
    expect(emptyIdResult.success).toBe(false);

    const duplicateResult = Base64Images.safeParse([
      { id: ' avatar.png ', base64Bytes: 'YQ==', mimeType: 'image/png' },
      { id: 'avatar.png', base64Bytes: 'Yg==', mimeType: 'image/png' },
    ]);
    expect(duplicateResult.success).toBe(false);
    expect(
      duplicateResult.success
        ? []
        : duplicateResult.error.issues.map(({ path }) => path),
    ).toEqual([
      [0, 'id'],
      [1, 'id'],
    ]);
  });

  it('canonicalizes known request header names and trims custom values', () => {
    expect(
      ReqHeaderMap.parse({
        authorization: 'Bearer token',
        'X-Request-ID': '  request-123  ',
      }),
    ).toEqual<ReqHeaderMap>({
      Authorization: 'Bearer token',
      'X-Request-ID': 'request-123',
    });
  });

  it('canonicalizes known response header names and trims custom values', () => {
    expect(
      ResHeaderMap.parse({
        'content-type': 'text/plain',
        'X-Response-ID': '  response-123  ',
      }),
    ).toEqual<ResHeaderMap>({
      'Content-Type': 'text/plain',
      'X-Response-ID': 'response-123',
    });
  });

  it.each([
    [{ name: 'Support Team' }, 'support-team'],
    [{ id: '', name: 'Support Team' }, 'support-team'],
    [{ id: '   ', name: 'Support Team' }, 'support-team'],
    [{ id: 'Custom ID', name: 'Support Team' }, 'custom-id'],
  ])('derives and normalizes preset IDs', (input, expectedId) => {
    expect(MadPreset.parse(input).id).toBe(expectedId);
  });

  it('reports an empty preset name without throwing during ID derivation', () => {
    expect(() =>
      MadConfig.safeParse({ presets: [{ name: '' }] }),
    ).not.toThrow();

    const result = MadConfig.safeParse({ presets: [{ name: '' }] });
    expect(result.success).toBe(false);
    const issuePaths = result.success
      ? []
      : result.error.issues.map(({ path }) => path);
    expect(issuePaths).toContainEqual(['presets', 0, 'name']);
  });

  it('finds duplicate normalized and derived preset IDs', () => {
    expect(
      findDuplicatePresetIds([
        { id: ' Shared ID ', name: 'First' },
        { id: 'shared_id', name: 'Second' },
        { name: 'Shared ID' },
      ]),
    ).toEqual([
      {
        id: 'shared-id',
        presetIndexes: [0, 1, 2],
      },
    ]);
  });

  it('derives unique duplicate IDs from preset names', () => {
    expect(
      MadConfig.parse({
        presets: [
          { id: 'shared', name: 'First preset' },
          { id: 'shared', name: 'Second preset' },
        ],
      }).presets.map(({ id }) => id),
    ).toEqual(['shared', 'second-preset']);
  });

  it('appends numeric suffixes when name-derived IDs are unavailable', () => {
    expect(
      MadConfig.parse({
        presets: [
          { id: 'shared', name: 'Shared' },
          { id: 'shared', name: 'Shared' },
          { id: 'shared', name: 'Shared' },
        ],
      }).presets.map(({ id }) => id),
    ).toEqual(['shared', 'shared-2', 'shared-3']);
  });

  it('does not consume IDs belonging to later presets', () => {
    expect(
      MadConfig.parse({
        presets: [
          { id: 'shared', name: 'First preset' },
          { id: 'shared', name: 'Reserved' },
          { id: 'reserved', name: 'Third preset' },
        ],
      }).presets.map(({ id }) => id),
    ).toEqual(['shared', 'reserved-2', 'reserved']);
  });

  it('clears the active preset when the referenced preset is disabled', () => {
    expect(
      MadConfig.parse({
        activePreset: 'disabled',
        presets: [{ id: 'disabled', name: 'Disabled', disabled: true }],
      }).activePreset,
    ).toBeNull();
  });

  it('normalizes values throughout a config', () => {
    expect(
      MadConfig.parse({
        activePreset: '  Support Team  ',
        presets: [
          {
            id: '  Support Team  ',
            name: '  Support Team  ',
            initials: '  ST  ',
            notes: '  Use the support identity  ',
            reqHeaders: {
              'X-Environment': '  staging  ',
            },
            // resHeaders: {
            //   'content-type': 'application/json',
            // },
            include: {
              globs: ['  https://*.example.com/*  '],
              regexes: ['  ^https://example\\.com/  '],
            },
            exclude: {
              globs: ['  https://admin.example.com/*  '],
            },
          },
        ],
      } satisfies MadConfig),
    ).toEqual<MadConfig>({
      activePreset: 'support-team',
      presets: [
        {
          id: 'support-team',
          name: 'Support Team',
          initials: 'ST',
          notes: 'Use the support identity',
          reqHeaders: {
            'X-Environment': 'staging',
          },
          // resHeaders: {
          //   'Content-Type': 'application/json',
          // },
          include: {
            globs: ['https://*.example.com/*'],
            regexes: ['^https://example\\.com/'],
          },
          exclude: {
            globs: ['https://admin.example.com/*'],
          },
        },
      ],
    });
  });

  it('applies config and preset defaults', () => {
    expect(
      MadConfig.parse({
        presets: [{ id: 'default', name: 'Default' }],
      }),
    ).toEqual<MadConfig>({
      activePreset: null,
      presets: [
        {
          id: 'default',
          name: 'Default',
          reqHeaders: {
            'x-foo-bar': 'Baz Qux',
          },
          // resHeaders: {},
          include: {
            globs: [],
          },
        },
      ],
    });
  });
});
