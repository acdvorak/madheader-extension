import type { SecChUaPlatform } from './client-hint-types';

export function guessPlatform(
  ua: string | null | undefined = typeof navigator !== 'undefined'
    ? navigator.userAgent
    : undefined,
): SecChUaPlatform {
  if (!ua) {
    return 'Unknown';
  }
  if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iOS')) {
    return 'iOS';
  }
  if (ua.includes('CrOS') || ua.includes('CrKey') || ua.includes('Chrome OS')) {
    return 'Chrome OS';
  }
  if (ua.includes('Android')) {
    return 'Android';
  }
  if (ua.includes('Mac OS X') || ua.includes('macOS')) {
    return 'macOS';
  }
  if (ua.includes('Windows')) {
    return 'Windows';
  }
  if (ua.includes('Linux')) {
    return 'Linux';
  }
  return 'Unknown';
}

export function guessMobile(
  ua: string | null | undefined = typeof navigator !== 'undefined'
    ? navigator.userAgent
    : undefined,
): boolean {
  switch (guessPlatform(ua)) {
    case 'Android':
    case 'iOS':
      return true;
    default:
      return false;
  }
}
