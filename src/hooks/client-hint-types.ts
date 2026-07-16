export type SecChPrefersColorScheme = 'light' | 'dark';
export type SecChPrefersReducedMotion = 'no-preference' | 'reduce';
export type SecChUaMobile = '?0' | '?1';

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Sec-CH-UA-Platform
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Client_hints
 * @see https://developer.mozilla.org/en-US/docs/Web/API/User-Agent_Client_Hints_API
 */
export type SecChUaPlatform =
  | 'Android'
  | 'Chrome OS'
  | 'Chromium OS'
  | 'iOS'
  | 'Linux'
  | 'macOS'
  | 'Windows'
  | 'Unknown';

export interface SecChHeaders {
  'Sec-Ch-Prefers-Color-Scheme': SecChPrefersColorScheme;
  'Sec-Ch-Prefers-Reduced-Motion': SecChPrefersReducedMotion;
  'Sec-Ch-Ua-Mobile': SecChUaMobile;
  'Sec-Ch-Ua-Platform': SecChUaPlatform;
}

export interface ClientHints {
  /**
   * @see https://mdn.io/Web/API/NavigatorUAData/mobile
   */
  mobile: boolean;

  /**
   * @see https://mdn.io/Web/API/NavigatorUAData/platform
   */
  platform: SecChUaPlatform;

  /**
   * @see https://mdn.io/Web/HTTP/Sec-CH-Prefers-Color-Scheme
   */
  prefersColorScheme: SecChPrefersColorScheme;

  /**
   * @see https://mdn.io/Web/HTTP/Sec-CH-Prefers-Reduced-Motion
   */
  prefersReducedMotion: boolean;

  isApple: boolean;

  metaKeyName: 'Ctrl' | 'Cmd';

  altKeyName: 'Alt' | 'Option';
}
