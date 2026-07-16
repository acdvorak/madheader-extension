import type { ParseError } from 'jsonc-parser';
import { parse, printParseErrorCode } from 'jsonc-parser';
import type z from 'zod';

import type {
  GlobExpression,
  MadConfig as MadConfigType,
} from '@/schemas/config-schema';
import { MadConfig } from '@/schemas/config-schema';
import { normalizeConfig } from '@/services/config/normalize-config';
import type { CompiledPresetMatcher } from '@/services/config/url-matcher';
import { compileEnabledPresetMatchers } from '@/services/config/url-matcher';
import type { StorageAreaName } from '@/services/storage/config-storage';
import {
  loadStoredConfigJsonc,
  saveStoredConfigJsonc,
} from '@/services/storage/config-storage';
import {
  formatJsonWithComments,
  formatNormalizedJsoncWithComments,
} from '@/utils/json-utils';

export type SaveConfigErrorCode =
  'jsonc-parse' | 'config-validation' | 'storage';

export interface ActionableError {
  message: string;
  path?: string;
  jsonPath?: Array<string | number>;
  isCustomValidation?: boolean;
  line?: number;
  column?: number;
}

export interface ConfigPipelineFailure {
  ok: false;
  code: SaveConfigErrorCode;
  errors: ActionableError[];
}

export interface ConfigPipelineSuccess {
  ok: true;
  config: MadConfigType;
  normalizedJsonc: string;
  compiledMatchers: CompiledPresetMatcher[];
  persistedTo: StorageAreaName;
}

export type SaveConfigPipelineResult =
  ConfigPipelineFailure | ConfigPipelineSuccess;

export interface LoadEditorConfigResult {
  jsonc: string;
  source: StorageAreaName | 'default';
  config: MadConfigType;
  warning?: string;
}

function toLineAndColumn(
  text: string,
  offset: number,
): {
  line: number;
  column: number;
} {
  const safeOffset = Math.max(0, Math.min(offset, text.length));
  const before = text.slice(0, safeOffset);
  const lines = before.split('\n');
  const lastLine = lines.at(-1) ?? '';

  return {
    line: lines.length,
    column: lastLine.length + 1,
  };
}

function formatJsoncParseErrors(
  text: string,
  parseErrors: ParseError[],
): ActionableError[] {
  return parseErrors.map((parseError) => {
    const { line, column } = toLineAndColumn(text, parseError.offset);

    return {
      message: printParseErrorCode(parseError.error),
      line,
      column,
    };
  });
}

function formatZodIssues(issues: z.core.$ZodIssue[]): ActionableError[] {
  return issues.map((issue) => {
    const jsonPath = issue.path.filter(
      (pathPart): pathPart is string | number =>
        typeof pathPart === 'string' || typeof pathPart === 'number',
    );
    const path = jsonPath.map((pathPart) => String(pathPart)).join('.');

    return {
      message: issue.message,
      path: path.length > 0 ? path : undefined,
      jsonPath,
      isCustomValidation: issue.code === 'custom',
    };
  });
}

function defaultConfig(): MadConfigType {
  return MadConfig.parse({
    activePreset: null,
    presets: [
      {
        id: 'example-all-sites',
        name: 'Example: All Sites',
        reqHeaders: { 'X-Foo-Bar': 'Baz Qux' },
        include: { globs: ['<all_urls>'] satisfies GlobExpression[] },
      },
    ],
  } satisfies MadConfig);
}

export function parseAndNormalizeConfigJsonc(text: string):
  | {
      ok: true;
      config: MadConfigType;
      compiledMatchers: CompiledPresetMatcher[];
    }
  | ConfigPipelineFailure {
  const parseErrors: ParseError[] = [];
  const parsed = parse(text, parseErrors, {
    allowTrailingComma: true,
    disallowComments: false,
  }) as unknown;

  if (parseErrors.length > 0) {
    return {
      ok: false,
      code: 'jsonc-parse',
      errors: formatJsoncParseErrors(text, parseErrors),
    };
  }

  const configResult = MadConfig.safeParse(parsed);
  if (!configResult.success) {
    return {
      ok: false,
      code: 'config-validation',
      errors: formatZodIssues(configResult.error.issues),
    };
  }

  const config = normalizeConfig(configResult.data);

  try {
    const compiledMatchers = compileEnabledPresetMatchers(config);
    return {
      ok: true,
      config,
      compiledMatchers,
    };
  } catch (error: unknown) {
    return {
      ok: false,
      code: 'config-validation',
      errors: [
        {
          message:
            error instanceof Error
              ? error.message
              : 'Failed to compile URL matchers',
        },
      ],
    };
  }
}

export async function saveConfigFromEditorJsonc(
  text: string,
): Promise<SaveConfigPipelineResult> {
  const normalizedResult = parseAndNormalizeConfigJsonc(text);
  if (!normalizedResult.ok) {
    return normalizedResult;
  }

  const normalizedJsonc = await formatNormalizedJsoncWithComments(
    text,
    normalizedResult.config,
  );

  try {
    const persistedTo = await saveStoredConfigJsonc(normalizedJsonc);

    return {
      ok: true,
      config: normalizedResult.config,
      normalizedJsonc,
      compiledMatchers: normalizedResult.compiledMatchers,
      persistedTo,
    };
  } catch (error: unknown) {
    return {
      ok: false,
      code: 'storage',
      errors: [
        {
          message:
            error instanceof Error
              ? error.message
              : 'Failed to persist configuration',
        },
      ],
    };
  }
}

export async function saveConfig(
  config: MadConfigType,
): Promise<SaveConfigPipelineResult> {
  const configResult = MadConfig.safeParse(config);
  if (!configResult.success) {
    return {
      ok: false,
      code: 'config-validation',
      errors: formatZodIssues(configResult.error.issues),
    };
  }

  const normalized = normalizeConfig(configResult.data);
  let compiledMatchers: CompiledPresetMatcher[];
  try {
    compiledMatchers = compileEnabledPresetMatchers(normalized);
  } catch (error: unknown) {
    return {
      ok: false,
      code: 'config-validation',
      errors: [
        {
          message:
            error instanceof Error
              ? error.message
              : 'Failed to compile URL matchers',
        },
      ],
    };
  }

  const normalizedJsonc = await formatJsonWithComments(normalized);

  try {
    const persistedTo = await saveStoredConfigJsonc(normalizedJsonc);

    return {
      ok: true,
      config: normalized,
      normalizedJsonc,
      compiledMatchers,
      persistedTo,
    };
  } catch (error: unknown) {
    return {
      ok: false,
      code: 'storage',
      errors: [
        {
          message:
            error instanceof Error
              ? error.message
              : 'Failed to persist configuration',
        },
      ],
    };
  }
}

export async function loadEditorConfigJsonc(): Promise<LoadEditorConfigResult> {
  const stored = await loadStoredConfigJsonc();
  if (stored.jsonc) {
    const normalizedResult = parseAndNormalizeConfigJsonc(stored.jsonc);
    if (normalizedResult.ok) {
      const jsonc = await formatNormalizedJsoncWithComments(
        stored.jsonc,
        normalizedResult.config,
      );
      return {
        jsonc,
        source: stored.storageArea ?? 'default',
        config: normalizedResult.config,
      };
    }
  }

  const config = defaultConfig();
  const jsonc = await formatJsonWithComments(config);

  return {
    jsonc,
    source: 'default',
    config,
    warning: stored.jsonc
      ? 'Stored configuration was invalid and was replaced with the default schema.'
      : undefined,
  };
}
