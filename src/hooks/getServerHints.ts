import type { ClientHints, SecChHeaders } from './client-hint-types';
import { guessMobile, guessPlatform } from './guessUserAgent';

function getHeaderValue<Name extends keyof SecChHeaders>(
  headers: Headers | undefined,
  key: Name,
): SecChHeaders[Name] | null {
  // Remove leading/trailing double quotes (needed for `Sec-Ch-Ua-Platform`).
  const value: string | null = headers?.get(key)?.replace(/^"|"$/g, '') ?? null;
  return value as SecChHeaders[Name] | null;
}

export function getServerHints(headers?: Headers): ClientHints {
  const ua = headers?.get('User-Agent') ?? null;
  const headerPlatform = getHeaderValue(headers, 'Sec-Ch-Ua-Platform');
  const headerMobile = getHeaderValue(headers, 'Sec-Ch-Ua-Mobile');
  const headerColor = getHeaderValue(headers, 'Sec-Ch-Prefers-Color-Scheme');
  const headerMotion = getHeaderValue(headers, 'Sec-Ch-Prefers-Reduced-Motion');

  const platform = headerPlatform || guessPlatform(ua);
  const mobile =
    headerMobile === '?1'
      ? true
      : headerMobile === '?0'
        ? false
        : guessMobile(platform);
  const prefersColorScheme = headerColor || 'light';
  const prefersReducedMotion = headerMotion === 'reduce';
  const isApple: boolean = platform === 'iOS' || platform === 'macOS';
  const metaKeyName = isApple ? 'Cmd' : 'Ctrl';
  const altKeyName = isApple ? 'Option' : 'Alt';

  const hints: ClientHints = {
    mobile,
    platform,
    prefersColorScheme,
    prefersReducedMotion,
    isApple,
    metaKeyName,
    altKeyName,
  };

  // console.debug('Server-generated ClientHints:', hints);

  return hints;
}
