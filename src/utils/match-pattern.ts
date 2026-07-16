import { matchPattern as originalMatchPattern } from 'browser-extension-url-match';
import type {
  MatcherOrInvalid,
  MatchPatternOptions,
} from 'browser-extension-url-match/dist/types';

import type { GlobExpression } from '@/schemas/config-schema';

function normalizeBasePattern(pattern: string): GlobExpression {
  if (pattern === '<all_urls>') {
    return pattern;
  }

  const patternWithScheme = pattern.includes('://')
    ? pattern
    : `*://${pattern}`;
  const authorityStartIndex = patternWithScheme.indexOf('://') + 3;
  const hasPath = patternWithScheme.includes('/', authorityStartIndex);

  return hasPath ? patternWithScheme : `${patternWithScheme}/*`;
}

function normalizePatternWithQueryString(pattern: string): GlobExpression[] {
  const base = normalizeBasePattern(pattern);
  if (base.includes('?') || base.endsWith('*') || base === '<all_urls>') {
    return [base];
  }
  const withQs = `${base}?*`;
  return [base, withQs];
}

export function matchPattern(
  pattern: string | string[],
  options?: Partial<MatchPatternOptions>,
): MatcherOrInvalid {
  const normalizedPatterns: GlobExpression[] = Array.isArray(pattern)
    ? pattern.flatMap(normalizePatternWithQueryString)
    : normalizePatternWithQueryString(pattern);
  return originalMatchPattern(normalizedPatterns, options);
}
