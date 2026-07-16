import { describe, expect, it } from 'vitest';

import { matchPattern } from './match-pattern';

describe('matchPattern', () => {
  it.each([
    ['*.example.com', '*://*.example.com/*'],
    ['example.com/path/*', '*://example.com/path/*'],
    ['https://example.com', 'https://example.com/*'],
    ['https://example.com/path/*', 'https://example.com/path/*'],
    ['<all_urls>', '<all_urls>'],
  ])('normalizes %s to %s in memory', (input, expected) => {
    const matcher = matchPattern(input).assertValid();

    expect(matcher.patterns).toEqual([expected]);
  });

  it('matches host-only shorthand across schemes and paths', () => {
    const matcher = matchPattern('*.example.com').assertValid();

    expect(matcher.match('http://example.com/')).toBe(true);
    expect(matcher.match('https://sub.example.com/path')).toBe(true);
    expect(matcher.match('https://example.org/')).toBe(false);
  });

  it.each([
    [
      'https://example.com/path',
      ['https://example.com/path', 'https://example.com/path?*'],
    ],
    ['example.com/path', ['*://example.com/path', '*://example.com/path?*']],
  ])('matches query strings for exact path pattern %s', (input, expected) => {
    const matcher = matchPattern(input).assertValid();

    expect(matcher.patterns).toEqual(expected);
    expect(matcher.match('https://example.com/path')).toBe(true);
    expect(matcher.match('https://example.com/path?key=value')).toBe(true);
    expect(matcher.match('https://example.com/other?key=value')).toBe(false);
  });

  it('normalizes array inputs without mutating the caller array', () => {
    const patterns = ['example.com', 'https://example.org/path/*'];
    const matcher = matchPattern(patterns).assertValid();

    expect(patterns).toEqual(['example.com', 'https://example.org/path/*']);
    expect(matcher.patterns).toEqual([
      '*://example.com/*',
      'https://example.org/path/*',
    ]);
  });

  it('forwards options to the original matcher', () => {
    const matcher = matchPattern('*://example.com', {
      schemeStarMatchesWs: true,
    }).assertValid();

    expect(matcher.match('wss://example.com/socket')).toBe(true);
    expect(matcher.config.schemeStarMatchesWs).toBe(true);
  });

  it('delegates invalid normalized patterns to the original matcher', () => {
    const matcher = matchPattern('https://exa mple.com');

    expect(matcher.valid).toBe(false);
  });
});
