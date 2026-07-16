import { describe, expect, it } from 'vitest';

import { MadPreset } from '@/schemas/config-schema';

import { createRulesForPreset } from './dnr-rules';

function highestPriorityActionForUrl(
  rules: ReturnType<typeof createRulesForPreset>,
  url: string,
): string | null {
  const matchingRules = rules
    .filter((rule) => new RegExp(rule.condition.regexFilter, 'u').test(url))
    .toSorted((left, right) => right.priority - left.priority);

  return matchingRules[0]?.action.type ?? null;
}

describe('createRulesForPreset', () => {
  it.each([
    ['omitted', undefined],
    ['empty globs', { globs: [] }],
    ['empty regexes', { regexes: [] }],
  ])('creates no rules when include patterns are %s', (_label, include) => {
    const preset = MadPreset.parse({
      name: 'No includes',
      reqHeaders: { 'x-test': 'enabled' },
      include,
    });

    expect(createRulesForPreset(preset)).toEqual([]);
  });

  it('creates header rules when an include pattern is configured', () => {
    const preset = MadPreset.parse({
      name: 'Included URL',
      reqHeaders: { 'x-test': 'enabled' },
      include: { globs: ['https://example.com/*'] },
    });

    expect(createRulesForPreset(preset)).toMatchObject([
      {
        action: {
          requestHeaders: [
            { header: 'x-test', operation: 'set', value: 'enabled' },
          ],
        },
        condition: {
          regexFilter: '(?:(?:^https://example\\.com(?::\\d+)?/.*$))',
        },
      },
    ]);
  });

  /* Response header overrides are temporarily disabled.
  it('creates response header rules when an include pattern is configured', () => {
    const preset = MadPreset.parse({
      name: 'Included URL',
      reqHeaders: {},
      resHeaders: { 'x-test': 'enabled' },
      include: { globs: ['https://example.com/*'] },
    });

    expect(createRulesForPreset(preset)).toMatchObject([
      {
        action: {
          responseHeaders: [
            { header: 'x-test', operation: 'set', value: 'enabled' },
          ],
        },
        condition: {
          regexFilter: '(?:(?:^https://example\\.com(?::\\d+)?/.*$))',
        },
      },
    ]);
  });
  */

  it.each([
    {
      glob: '*.example.com',
      matches: [
        'http://example.com/',
        'https://sub.example.com/path',
        'https://deep.sub.example.com/path',
      ],
      misses: ['https://notexample.com/', 'https://example.org/'],
    },
    {
      glob: 'https://example.com/*',
      matches: ['https://example.com/', 'https://example.com:8443/path'],
      misses: ['http://example.com/', 'https://sub.example.com/'],
    },
    {
      glob: '*://example.com/*',
      matches: ['http://example.com/', 'https://example.com/path'],
      misses: ['ftp://example.com/', 'https://sub.example.com/'],
    },
    {
      glob: 'https://*.example.com/*',
      matches: [
        'https://example.com/',
        'https://sub.example.com/path',
        'https://deep.sub.example.com/path',
      ],
      misses: ['https://notexample.com/', 'https://example.org/'],
    },
    {
      glob: 'https://example.com/api/*',
      matches: [
        'https://example.com/api/',
        'https://example.com/api/users?page=2',
      ],
      misses: ['https://example.com/', 'https://example.com/v1/api/users'],
    },
  ])(
    'converts $glob using extension match semantics',
    ({ glob, matches, misses }) => {
      const preset = MadPreset.parse({
        name: 'Included URL',
        reqHeaders: { 'x-test': 'enabled' },
        // resHeaders: { 'x-test': 'enabled' },
        include: { globs: [glob] },
      });

      const [rule] = createRulesForPreset(preset);
      const urlRegex = new RegExp(rule?.condition.regexFilter ?? '(?!)', 'u');

      matches.forEach((url) => {
        expect(urlRegex.test(url), url).toBe(true);
      });
      misses.forEach((url) => {
        expect(urlRegex.test(url), url).toBe(false);
      });
    },
  );

  /* Response header overrides are temporarily disabled.
  it('applies response headers to every supported resource type', () => {
    const preset = MadPreset.parse({
      name: 'Included URL',
      reqHeaders: {},
      resHeaders: { 'x-test': 'enabled' },
      include: { globs: ['<all_urls>'] },
    });

    const [rule] = createRulesForPreset(preset);

    expect(rule?.condition.resourceTypes).toEqual(
      expect.arrayContaining([
        'stylesheet',
        'object',
        'csp_report',
        'media',
        'websocket',
      ]),
    );
  });
  */

  /* Response header overrides are temporarily disabled.
  it('assigns unique rule IDs to request and response header rules', () => {
    const preset = MadPreset.parse({
      name: 'Included URL',
      reqHeaders: { 'x-request-test': 'request' },
      resHeaders: { 'x-response-test': 'response' },
      include: { globs: ['<all_urls>'] },
    });

    const rules = createRulesForPreset(preset);

    expect(rules.map(({ id }) => id)).toEqual([1000, 1001]);
    expect(rules.map(({ action }) => action)).toMatchObject([
      {
        requestHeaders: [
          { header: 'x-request-test', operation: 'set', value: 'request' },
        ],
      },
      {
        responseHeaders: [
          { header: 'x-response-test', operation: 'set', value: 'response' },
        ],
      },
    ]);
  });
  */

  it('lets an exclude glob override a matching include glob', () => {
    const preset = MadPreset.parse({
      name: 'Excluded URL',
      reqHeaders: { 'x-test': 'enabled' },
      include: { globs: ['<all_urls>'] },
      exclude: { globs: ['https://example.com/private/*'] },
    });
    const rules = createRulesForPreset(preset);

    expect(
      highestPriorityActionForUrl(rules, 'https://example.com/public/page'),
    ).toBe('modifyHeaders');
    expect(
      highestPriorityActionForUrl(rules, 'https://example.com/private/page'),
    ).toBe('allow');
  });

  it('lets an unanchored exclude regex override a matching include regex', () => {
    const preset = MadPreset.parse({
      name: 'Excluded URL',
      reqHeaders: { 'x-test': 'enabled' },
      include: { regexes: ['^https://example\\.com/'] },
      exclude: { regexes: ['/admin(?:/|$)'] },
    });
    const rules = createRulesForPreset(preset);

    expect(
      highestPriorityActionForUrl(rules, 'https://example.com/account'),
    ).toBe('modifyHeaders');
    expect(
      highestPriorityActionForUrl(rules, 'https://example.com/admin/settings'),
    ).toBe('allow');
  });
});
