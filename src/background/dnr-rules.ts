import type { MadPreset, UrlMatchers } from '@/schemas/config-schema';
import { matchPattern } from '@/utils/match-pattern';

interface DeclarativeNetRequestHeaderOperation {
  header: string;
  operation: 'set';
  value: string;
}

interface DeclarativeNetRequestCondition {
  regexFilter: string;
  resourceTypes: string[];
}

export interface DeclarativeNetRequestRule {
  id: number;
  priority: number;
  action:
    | {
        type: 'allow';
      }
    | {
        type: 'modifyHeaders';
        requestHeaders?: DeclarativeNetRequestHeaderOperation[];
        responseHeaders?: DeclarativeNetRequestHeaderOperation[];
      };
  condition: DeclarativeNetRequestCondition;
}

const DNR_RULE_START_ID = 1000;
const MODIFY_HEADERS_PRIORITY = 1;
const EXCLUDE_PRIORITY = 2;
const RESOURCE_TYPES = [
  'main_frame',
  'sub_frame',
  'stylesheet',
  'script',
  'image',
  'font',
  'object',
  'xmlhttprequest',
  'ping',
  'csp_report',
  'media',
  'websocket',
  'other',
] as const;

function escapeRegexLiteral(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function globToRegex(globPattern: string): string {
  const [normalizedPattern] = matchPattern(globPattern).assertValid().patterns;
  if (!normalizedPattern) {
    throw new TypeError(
      `Glob pattern "${globPattern}" could not be normalized`,
    );
  }

  if (normalizedPattern === '<all_urls>') {
    return '^https?://.+$';
  }

  const schemeEndIndex = normalizedPattern.indexOf('://') + 3;
  const pathStartIndex = normalizedPattern.indexOf('/', schemeEndIndex);
  const scheme = normalizedPattern.slice(0, schemeEndIndex - 3);
  const host = normalizedPattern.slice(schemeEndIndex, pathStartIndex);
  const path = normalizedPattern.slice(pathStartIndex);
  const escapedScheme = scheme === '*' ? 'https?' : escapeRegexLiteral(scheme);
  const escapedHost = host.startsWith('*.')
    ? `(?:[^./]+\\.)*${escapeRegexLiteral(host.slice(2))}`
    : escapeRegexLiteral(host).replaceAll('\\*', '[^/]+');
  const escapedPath = escapeRegexLiteral(path).replaceAll('\\*', '.*');
  const optionalPort = scheme === 'file' ? '' : '(?::\\d+)?';

  return `^${escapedScheme}://${escapedHost}${optionalPort}${escapedPath}$`;
}

function matcherFragments(matchers: UrlMatchers | undefined): string[] {
  if (!matchers) {
    return [];
  }

  const globs: string[] =
    matchers.globs?.map((expression) => `(?:${globToRegex(expression)})`) ?? [];
  const regexes: string[] =
    matchers.regexes?.map((expression) => `(?:${expression})`) ?? [];

  return [...globs, ...regexes];
}

function createUrlRegex(matchers: UrlMatchers | undefined): string | null {
  const patterns = matcherFragments(matchers);
  if (patterns.length === 0) {
    return null;
  }

  return `(?:${patterns.join('|')})`;
}

function createModifyHeadersRule(
  id: number,
  headerType: 'requestHeaders' | 'responseHeaders',
  header: string,
  value: string,
  urlRegex: string,
): DeclarativeNetRequestRule {
  return {
    id,
    priority: MODIFY_HEADERS_PRIORITY,
    action: {
      type: 'modifyHeaders',
      [headerType]: [
        {
          header,
          operation: 'set',
          value,
        },
      ],
    },
    condition: {
      regexFilter: urlRegex,
      resourceTypes: [...RESOURCE_TYPES],
    },
  };
}

function createExcludeRule(
  id: number,
  urlRegex: string,
): DeclarativeNetRequestRule {
  return {
    id,
    priority: EXCLUDE_PRIORITY,
    action: {
      type: 'allow',
    },
    condition: {
      regexFilter: urlRegex,
      resourceTypes: [...RESOURCE_TYPES],
    },
  };
}

export function createRulesForPreset(
  preset: MadPreset,
): DeclarativeNetRequestRule[] {
  const includeRegex = createUrlRegex(preset.include);
  if (!includeRegex) {
    return [];
  }

  const modifyHeadersRules = Object.entries(preset.reqHeaders).map(
    ([header, value], index) => {
      return createModifyHeadersRule(
        DNR_RULE_START_ID + index,
        'requestHeaders',
        header,
        value,
        includeRegex,
      );
    },
  );
  // Response header overrides are temporarily disabled because they are not
  // applied reliably in Chrome. Keep the rule generation ready to restore.
  // const responseHeaderRules = Object.entries(preset.resHeaders).map(
  //   ([header, value], index) => {
  //     return createModifyHeadersRule(
  //       DNR_RULE_START_ID + modifyHeadersRules.length + index,
  //       'responseHeaders',
  //       header,
  //       value,
  //       includeRegex,
  //     );
  //   },
  // );
  // modifyHeadersRules.push(...responseHeaderRules);
  const excludeRegex = createUrlRegex(preset.exclude);

  return excludeRegex && modifyHeadersRules.length > 0
    ? [
        ...modifyHeadersRules,
        createExcludeRule(
          DNR_RULE_START_ID + modifyHeadersRules.length,
          excludeRegex,
        ),
      ]
    : modifyHeadersRules;
}
