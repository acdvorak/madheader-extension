import { Color as ValidexColor } from '@validex/core';
import type { ArrayElement, LiteralUnion } from 'type-fest';
import z from 'zod';

import { isTruthy } from '../utils/global-utils';
import { matchPattern } from '../utils/match-pattern';

import {
  KnownHttpRequestHeaderMap,
  KnownHttpRequestHeaderName,
  KnownHttpResponseHeaderMap,
  KnownHttpResponseHeaderName,
} from './known-http-headers';

////////////////////////////////////////////////////////////////////////////////
// Colors
////////////////////////////////////////////////////////////////////////////////

export type HexColor = `#${string}`;
export type RgbColor = `rgb(${number}, ${number}, ${number})`;
export type HslColor =
  | `hsl(${number} ${number}% ${number}%)`
  | `hsl(${number} ${number}% ${number}% / ${number})`;

export type AnyColor = HexColor | RgbColor | HslColor;

export const AnyColor = ValidexColor({ format: 'any' }) as z.ZodType<
  AnyColor,
  AnyColor
>;

////////////////////////////////////////////////////////////////////////////////
// Images
////////////////////////////////////////////////////////////////////////////////

export const ImageMimeType = z.enum([
  'image/svg+xml',
  'image/png',
  'image/jpeg',
  'image/webp',
]);
export type ImageMimeType = z.output<typeof ImageMimeType>;

export const ImageId = z.string().trim().min(1);
export type ImageId = z.output<typeof ImageId>;

export const Base64Image = z.object({
  id: ImageId,

  /** Base64-encoded image bytes. */
  base64Bytes: z.base64().describe('Base64-encoded image bytes.'),

  /** Media type of the encoded image. */
  mimeType: ImageMimeType.describe('Media type of the encoded image.'),
});
export type Base64Image = z.output<typeof Base64Image>;

export const Base64Images = Base64Image.array().superRefine((images, ctx) => {
  const indexesById = new Map<ImageId, number[]>();
  images.forEach((image, imageIndex) => {
    const imageIndexes = indexesById.get(image.id) ?? [];
    imageIndexes.push(imageIndex);
    indexesById.set(image.id, imageIndexes);
  });

  indexesById.forEach((imageIndexes, id) => {
    if (imageIndexes.length < 2) {
      return;
    }

    imageIndexes.forEach((imageIndex) => {
      ctx.addIssue({
        code: 'custom',
        message: `Duplicate image ID "${id}"`,
        path: [imageIndex, 'id'],
      });
    });
  });
});
export type Base64Images = z.output<typeof Base64Images>;

////////////////////////////////////////////////////////////////////////////////
// Request headers
////////////////////////////////////////////////////////////////////////////////

export const ReqHeaderKey = z.union([
  KnownHttpRequestHeaderName,
  z.string().trim().slugify(),
]);
export type ReqHeaderKey = Satisfies<
  z.output<typeof ReqHeaderKey>,
  LiteralUnion<KnownHttpRequestHeaderName, Lowercase<string>>
>;

export const ReqHeaderValue = z.string().trim();
export type ReqHeaderValue = z.output<typeof ReqHeaderValue>;

const knownReqHeaderNamesByLowercase = new Map(
  KnownHttpRequestHeaderName.options.map((name) => [name.toLowerCase(), name]),
);

function normalizeKnownReqHeaderNames(value: unknown): Record<string, string> {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([name, headerValue]) => [
      knownReqHeaderNamesByLowercase.get(name.toLowerCase()) ?? name,
      headerValue,
    ]),
  );
}

export const ReqHeaderMap = z.preprocess(
  normalizeKnownReqHeaderNames,
  KnownHttpRequestHeaderMap.catchall(ReqHeaderValue),
);
export type ReqHeaderMap = z.output<typeof ReqHeaderMap>;

////////////////////////////////////////////////////////////////////////////////
// Response headers
////////////////////////////////////////////////////////////////////////////////

export const ResHeaderKey = z.union([KnownHttpResponseHeaderName, z.string()]);
export type ResHeaderKey = Satisfies<
  z.output<typeof ResHeaderKey>,
  LiteralUnion<KnownHttpResponseHeaderName, string>
>;

export const ResHeaderValue = z.string().trim();
export type ResHeaderValue = z.output<typeof ResHeaderValue>;

const knownResHeaderNamesByLowercase = new Map(
  KnownHttpResponseHeaderName.options.map((name) => [name.toLowerCase(), name]),
);

function normalizeKnownResHeaderNames(value: unknown): Record<string, string> {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([name, headerValue]) => [
      knownResHeaderNamesByLowercase.get(name.toLowerCase()) ?? name,
      headerValue,
    ]),
  );
}

export const ResHeaderMap = z.preprocess(
  normalizeKnownResHeaderNames,
  KnownHttpResponseHeaderMap.catchall(ResHeaderValue),
);
export type ResHeaderMap = z.output<typeof ResHeaderMap>;

////////////////////////////////////////////////////////////////////////////////
// URL patterns
////////////////////////////////////////////////////////////////////////////////

function validateRegex(expression: string): string | undefined {
  try {
    new RegExp(expression);
    return undefined;
  } catch (error) {
    let reason = String(error);
    if (!reason.endsWith('.')) {
      reason += '.';
    }

    return reason;
  }
}

function validateGlob(expression: string): string | undefined {
  const matcher = matchPattern(expression);

  let reason: string | undefined;
  if (matcher.error) {
    reason = String(matcher.error);
    if (!reason.endsWith('.')) {
      reason += '.';
    }
  }

  return matcher.valid
    ? undefined
    : [
        `Invalid glob syntax.`,
        reason,
        `See https://www.npmjs.com/package/browser-extension-url-match`,
      ]
        .filter(isTruthy)
        .join('\n');
}

const EXAMPLE_GLOB_PATTERNS = [
  '<all_urls>',
  '*.example.com',
  '*.example.com/foo?q=*',
  '*://*.example.com',
] as const;

export const GlobExpression = z
  .union([z.literal(EXAMPLE_GLOB_PATTERNS), z.string().trim().min(1)])
  .superRefine((expression, ctx) => {
    const errorMessage = validateGlob(expression);
    if (errorMessage) {
      ctx.addIssue({ code: 'custom', message: errorMessage });
    }
  });
export type GlobExpression = Satisfies<
  z.output<typeof GlobExpression>,
  LiteralUnion<ArrayElement<typeof EXAMPLE_GLOB_PATTERNS>, string>
>;

export const RegexExpression = z
  .string()
  .trim()
  .min(1)
  .superRefine((expression, ctx) => {
    const errorMessage = validateRegex(expression);
    if (errorMessage) {
      ctx.addIssue({ code: 'custom', message: errorMessage });
    }
  });
export type RegexExpression = z.output<typeof RegexExpression>;

export const UrlMatchers = z
  .object({
    /**
     * Glob patterns used to match request URLs.
     *
     * See https://www.npmjs.com/package/browser-extension-url-match for syntax.
     */
    globs: GlobExpression.array()
      .optional()
      .meta({
        description: [
          `Glob patterns used to match request URLs.`,
          `See https://www.npmjs.com/package/browser-extension-url-match for syntax.`,
        ].join('\n\n'),
        markdownDescription: [
          `Glob patterns used to match request URLs.`,
          'See [`browser-extension-url-match` docs](https://www.npmjs.com/package/browser-extension-url-match) for syntax.',
        ].join('\n\n'),
      } satisfies {
        /** Standard plain-text description field, supported everywhere. */
        description?: string;
        /** Non-standard JSON Schema extension, supported by Monaco. */
        markdownDescription?: string;
      }),

    /**
     * Regular expressions used to match request URLs.
     *
     * See
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions
     * for syntax.
     */
    regexes: RegexExpression.array()
      .optional()
      .meta({
        description: [
          `Regular expressions used to match request URLs.`,
          `See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions for syntax.`,
        ].join('\n\n'),
        markdownDescription: [
          `Regular expressions used to match request URLs.`,
          `See [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions) for syntax.`,
        ].join('\n\n'),
      } satisfies {
        /** Standard plain-text description field, supported everywhere. */
        description?: string;
        /** Non-standard JSON Schema extension, supported by Monaco. */
        markdownDescription?: string;
      }),
  })
  .refine((value) => Object.values(value).some(isTruthy), {
    error: `At least one matcher property must be specified`,
  });
export type UrlMatchers = z.output<typeof UrlMatchers>;

////////////////////////////////////////////////////////////////////////////////
// Presets
////////////////////////////////////////////////////////////////////////////////

export const PresetId = z.string().trim().min(1).slugify();
export type PresetId = z.output<typeof PresetId>;

export const PresetName = z.string().trim().min(1);
export type PresetName = z.output<typeof PresetName>;

export const PresetInitials = z.string().trim().max(3);
export type PresetInitials = z.output<typeof PresetInitials>;

const PresetIdInput = z
  .union([PresetId, z.string().trim().length(0)])
  .default('');

function derivePresetId(name: string): PresetId {
  const result = PresetId.safeParse(name);
  return result.success && result.data ? result.data : 'preset';
}

const PresetIdentity = z
  .object({
    id: PresetIdInput,
    name: PresetName,
  })
  .overwrite((preset) => ({
    ...preset,
    id: preset.id || derivePresetId(preset.name),
  }));

export interface DuplicatePresetId {
  id: PresetId;
  presetIndexes: number[];
}

export function findDuplicatePresetIds(value: unknown): DuplicatePresetId[] {
  const result = PresetIdentity.array().safeParse(value);
  if (!result.success) {
    return [];
  }

  const indexesById = new Map<PresetId, number[]>();
  result.data.forEach((preset, presetIndex) => {
    const presetIndexes = indexesById.get(preset.id) ?? [];
    presetIndexes.push(presetIndex);
    indexesById.set(preset.id, presetIndexes);
  });

  return Array.from(indexesById, ([id, presetIndexes]) => ({
    id,
    presetIndexes,
  })).filter(({ presetIndexes }) => presetIndexes.length > 1);
}

function makePresetIdsUnique(presets: MadPreset[]): MadPreset[] {
  const reservedIds = new Set(presets.map((preset) => preset.id));
  const usedIds = new Set<PresetId>();

  return presets.map((preset) => {
    if (!usedIds.has(preset.id)) {
      usedIds.add(preset.id);
      return preset;
    }

    const nameId = derivePresetId(preset.name);
    let uniqueId = nameId;
    for (let suffix = 2; reservedIds.has(uniqueId); suffix += 1) {
      uniqueId = `${nameId}-${suffix}`;
    }

    reservedIds.add(uniqueId);
    usedIds.add(uniqueId);
    return { ...preset, id: uniqueId };
  });
}

export const MadPreset = z
  .object({
    /** Identifier used to reference the preset. */
    id: PresetIdInput.describe('Identifier used to reference the preset.'),

    /** Display name for the preset. */
    name: PresetName.describe('Display name for the preset.'),

    /** Up to three characters shown in the preset avatar. */
    initials: PresetInitials.nullable()
      .optional()
      .describe('Up to three characters shown in the preset avatar.'),

    /** Supplemental long-form text with information about the preset. */
    notes: z
      .string()
      .trim()
      .nullable()
      .optional()
      .describe(
        'Supplemental long-form text with information about the preset.',
      ),

    /** Background color of the preset's avatar. */
    bgcolor: AnyColor.nullable()
      .optional()
      .meta({
        description: [
          "Background color of the preset's avatar, IFF no `imageId` is specified.",
          'Formats: CSS hex, `rgb()`, and `hsl()`.',
        ].join('\n\n'),
        markdownDescription: [
          "Background color of the preset's avatar, **_IFF no `imageId` is specified_**.",
          'Formats: CSS hex, `rgb()`, and `hsl()`.',
        ].join('\n\n'),
      } satisfies {
        /** Standard plain-text description field, supported everywhere. */
        description?: string;
        /** Non-standard JSON Schema extension, supported by Monaco. */
        markdownDescription?: string;
      }),

    /** Image shown in the preset avatar. */
    imageId: ImageId.nullable()
      .optional()
      .describe('Image shown in the preset avatar.'),

    /**
     * Request headers to override on matching URLs.
     *
     * Header names are case-INsensitive.
     */
    reqHeaders: ReqHeaderMap.default({
      'x-foo-bar': 'Baz Qux',
    }).describe(
      [
        `HTTP request headers to override on matching URLs.`,
        `Header names are case-INsensitive.`,
      ].join('\n\n'),
    ),

    // Response header overrides are temporarily disabled because they are not
    // applied reliably in Chrome. Keep the schema ready for re-enablement.
    // /**
    //  * Response headers to override on matching URLs.
    //  *
    //  * Header names are case-INsensitive.
    //  */
    // resHeaders: ResHeaderMap.default({}).describe(
    //   [
    //     `HTTP response headers to override on matching URLs.`,
    //     `Header names are case-INsensitive.`,
    //   ].join('\n\n'),
    // ),

    /**
     * URLs that match any of these patterns will have their headers
     * modified, IFF the URL does not also match an `exclude` pattern.
     *
     * `include` patterns are evaluated first, before `exclude` patterns.
     *
     * If no `include` patterns are specified, no URLs will be modified.
     */
    include: UrlMatchers.default({ globs: [] })
      .optional()
      .meta({
        description: [
          `URLs that match any of these patterns will have their headers ` +
            `modified, IFF the URL does not match any 'exclude' patterns.`,
          `'include' patterns are evaluated first, before 'exclude' patterns.`,
          `ℹ️ If no 'include' patterns are specified, no URLs will be modified.`,
        ].join('\n\n'),
        markdownDescription: [
          'URLs that match any of these patterns will have their headers ' +
            'modified, IFF the URL does not match any `exclude` patterns.',
          '`include` patterns are evaluated first, before `exclude` patterns.',
          'ℹ️ If no `include` patterns are specified, no URLs will be modified.',
        ].join('\n\n'),
      } satisfies {
        /** Standard plain-text description field, supported everywhere. */
        description?: string;
        /** Non-standard JSON Schema extension, supported by Monaco. */
        markdownDescription?: string;
      }),

    /**
     * URLs that match any of these patterns will NOT have their headers
     * modified, even if the URL matches an `include` pattern.
     *
     * `include` patterns are evaluated first, before `exclude` patterns.
     *
     * If no `exclude` patterns are specified, all URLs matched by at least one
     * `include` pattern will be modified.
     */
    exclude: UrlMatchers.optional().meta({
      description: [
        `URLs that match any of these patterns will NOT have their headers ` +
          `modified, even if the URL matches an 'include' pattern.`,
        `'include' patterns are evaluated first, before 'exclude' patterns.`,
        `If no 'exclude' patterns are specified, all URLs matched by`,
        `at least one 'include' pattern will be modified.`,
      ].join('\n\n'),
      markdownDescription: [
        'URLs that match any of these patterns will NOT have their headers ' +
          'modified, even if the URL matches an `include` pattern.',
        '`include` patterns are evaluated first, before `exclude` patterns.',
        'If no `exclude` patterns are specified, all URLs matched by ',
        'at least one `include` pattern will be modified.',
      ].join('\n\n'),
    } satisfies {
      /** Standard plain-text description field, supported everywhere. */
      description?: string;
      /** Non-standard JSON Schema extension, supported by Monaco. */
      markdownDescription?: string;
    }),

    /** Whether the preset is ignored without being deleted. */
    disabled: z
      .boolean()
      .optional()
      .describe('Whether the preset is ignored without being deleted.'),
  })
  .overwrite((preset) => ({
    ...preset,
    id: preset.id || derivePresetId(preset.name),
  }));
export type MadPreset = z.output<typeof MadPreset>;

////////////////////////////////////////////////////////////////////////////////

export const MadConfig = z
  .object({
    /** Identifier of the active preset, or null when none is active. */
    activePreset: PresetId.nullable()
      .default(null)
      .describe(
        'Identifier of the active preset, or null when none is active.',
      ),

    /** Presets available for request header modification. */
    presets: MadPreset.array().describe(
      'Presets available for request header modification.',
    ),
  })
  .overwrite((config) => {
    const presets = makePresetIdsUnique(config.presets);
    const activePreset = presets.find(
      (preset) => preset.id === config.activePreset,
    );

    return {
      ...config,
      activePreset: activePreset?.disabled ? null : config.activePreset,
      presets,
    };
  });
export type MadConfig = z.output<typeof MadConfig>;
