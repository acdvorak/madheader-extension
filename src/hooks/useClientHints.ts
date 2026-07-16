import { useCallback, useMemo, useSyncExternalStore } from 'react';

import type {
  ClientHints,
  SecChPrefersColorScheme,
  SecChUaPlatform,
} from './client-hint-types';
import { getServerHints } from './getServerHints';
import { guessMobile, guessPlatform } from './guessUserAgent';
import { UiLogger } from './ui-logger';

export type { ClientHints, SecChPrefersColorScheme };

const rootLogger = new UiLogger((...data) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  console.debug(...data);
}).hook('useClientHints');

type Source = 'onColorChange' | 'onMotionChange';

function log(source: Source, ...args: unknown[]): void {
  rootLogger.fn(source).log(...args);
}

function subscribeToNothing(): () => void {
  return () => undefined;
}

function getClientAvailabilitySnapshot(): boolean {
  return true;
}

function getServerAvailabilitySnapshot(): boolean {
  return false;
}

function useMediaQuerySnapshot(
  mediaQuery: MediaQueryList | null,
  serverMatches: boolean,
  source: Source,
): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void): (() => void) => {
      if (!mediaQuery) {
        return subscribeToNothing();
      }

      const onChange = (evt: MediaQueryListEvent): void => {
        log(source, `${mediaQuery.media} =`, evt.matches);
        onStoreChange();
      };

      mediaQuery.addEventListener('change', onChange);
      return () => {
        mediaQuery.removeEventListener('change', onChange);
      };
    },
    [mediaQuery, source],
  );

  const getSnapshot = useCallback(
    (): boolean => mediaQuery?.matches ?? serverMatches,
    [mediaQuery, serverMatches],
  );
  const getServerSnapshot = useCallback(
    (): boolean => serverMatches,
    [serverMatches],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useClientHints(serverHints?: ClientHints): ClientHints {
  const serverSnapshot = useMemo<ClientHints>(
    () => serverHints ?? getServerHints(),
    [serverHints],
  );
  const isClient = useSyncExternalStore(
    subscribeToNothing,
    getClientAvailabilitySnapshot,
    getServerAvailabilitySnapshot,
  );

  const colorQuery: MediaQueryList | null = useMemo(
    () => (isClient ? window.matchMedia('(prefers-color-scheme: dark)') : null),
    [isClient],
  );

  const motionQuery: MediaQueryList | null = useMemo(
    () => (isClient ? window.matchMedia('(prefers-reduced-motion)') : null),
    [isClient],
  );

  const prefersColorScheme: SecChPrefersColorScheme = useMediaQuerySnapshot(
    colorQuery,
    serverSnapshot.prefersColorScheme === 'dark',
    'onColorChange',
  )
    ? 'dark'
    : 'light';
  const prefersReducedMotion = useMediaQuerySnapshot(
    motionQuery,
    serverSnapshot.prefersReducedMotion,
    'onMotionChange',
  );

  return useMemo<ClientHints>(() => {
    const uaData: UALowEntropyJSON | undefined = isClient
      ? navigator.userAgentData
      : undefined;
    const platform = isClient
      ? // `navigator.userAgentData.platform` can be an empty string!
        ((uaData?.platform || guessPlatform()) as SecChUaPlatform)
      : serverSnapshot.platform;
    const mobile = isClient
      ? (uaData?.mobile ?? guessMobile(platform))
      : serverSnapshot.mobile;
    const isApple: boolean = platform === 'iOS' || platform === 'macOS';
    const metaKeyName = isApple ? 'Cmd' : 'Ctrl';
    const altKeyName = isApple ? 'Option' : 'Alt';

    return {
      mobile,
      platform,
      prefersColorScheme,
      prefersReducedMotion,
      isApple,
      metaKeyName,
      altKeyName,
    };
  }, [isClient, prefersColorScheme, prefersReducedMotion, serverSnapshot]);
}
