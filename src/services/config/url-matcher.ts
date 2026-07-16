import type {
  GlobExpression,
  MadConfig,
  MadPreset,
  PresetId,
  RegexExpression,
} from '@/schemas/config-schema';
import { matchPattern } from '@/utils/match-pattern';

export interface CompiledUrlMatcher {
  kind: 'glob' | 'regex';
  expression: string;
  match: (url: string | URL) => boolean;
}

export interface CompiledPresetMatcher {
  presetId: PresetId;
  includeMatchers: CompiledUrlMatcher[];
  excludeMatchers: CompiledUrlMatcher[];
}

function compileGlobMatcher(expression: GlobExpression): CompiledUrlMatcher {
  const matcher = matchPattern(expression);
  if (!matcher.valid) {
    throw new TypeError(
      `Invalid glob pattern "${expression}": ${matcher.error.message}`,
    );
  }

  const validMatcher = matcher.assertValid();

  return {
    kind: 'glob',
    expression,
    match: (url: string | URL): boolean => validMatcher.match(url),
  };
}

function compileRegexMatcher(expression: RegexExpression): CompiledUrlMatcher {
  const regex = new RegExp(expression, 'iu');

  return {
    kind: 'regex',
    expression,
    match: (url: string | URL): boolean => {
      const candidate = typeof url === 'string' ? url : url.toString();
      return regex.test(candidate);
    },
  };
}

function implicitIncludeNoneMatcher(): CompiledUrlMatcher {
  return {
    kind: 'glob',
    expression: '',
    match: (_url: string | URL): boolean => false,
  };
}

export function compilePresetMatchers(
  preset: MadPreset,
): CompiledPresetMatcher {
  const includeMatchers: CompiledUrlMatcher[] = [
    ...(preset.include?.globs?.map(compileGlobMatcher) ?? []),
    ...(preset.include?.regexes?.map(compileRegexMatcher) ?? []),
  ];
  const excludeMatchers: CompiledUrlMatcher[] = [
    ...(preset.exclude?.globs?.map(compileGlobMatcher) ?? []),
    ...(preset.exclude?.regexes?.map(compileRegexMatcher) ?? []),
  ];

  return {
    presetId: preset.id,
    includeMatchers:
      includeMatchers.length > 0
        ? includeMatchers
        : [implicitIncludeNoneMatcher()],
    excludeMatchers,
  };
}

export function isUrlMatchedByPreset(
  url: string | URL,
  matcher: CompiledPresetMatcher,
): boolean {
  const included = matcher.includeMatchers.some((includeMatcher) => {
    return includeMatcher.match(url);
  });
  if (!included) {
    return false;
  }

  const excluded = matcher.excludeMatchers.some((excludeMatcher) => {
    return excludeMatcher.match(url);
  });

  return !excluded;
}

export function compileEnabledPresetMatchers(
  config: MadConfig,
): CompiledPresetMatcher[] {
  return config.presets
    .filter((preset) => !preset.disabled)
    .map((preset) => compilePresetMatchers(preset));
}
