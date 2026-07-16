import React, {
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { CSSProperties } from '@mui/material';

import { deepEqual } from 'fast-equals';
import { useThrottledCallback } from 'use-debounce';

import { EdgeDropShadow } from '../components/EdgeDropShadow';
import { color } from '../theme/themeConstants';

import { UiLogger } from './ui-logger';
import { useIsClient } from './useIsClient';

/* eslint-disable @typescript-eslint/no-unused-vars */
const FALSE = Date.now() < 0;
const TRUE = Date.now() > 0;
/* eslint-enable @typescript-eslint/no-unused-vars */

const rootLogger = new UiLogger((...data) => {
  if (FALSE) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    console.debug(...data);
  }
}).hook('useHasScrollbar');

const debugLogger = new UiLogger((...data) => {
  if (FALSE) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    console.debug(...data);
  }
}).hook('useHasScrollbar');

type Source = 'handleResizeImmediate' | 'useEffect';

function log(
  source: Source,
  eventName: 'setup' | 'cleanup' | 'onScrollOrResize',
  methodName: 'observe' | 'unobserve' | null,
  ...args: unknown[]
): void {
  let logger: UiLogger = rootLogger.fn(source).event(eventName);
  if (methodName) {
    logger = logger.function(`resizeObserver.${methodName}`);
  }
  logger.log(...args);
}

export interface UseHasScrollbarArgs {
  /**
   * Scrollable content area that may or may not have a visible scrollbar,
   * depending on whether its children are overflowing its maximum bounds.
   */
  scrollableEl: HTMLElement | null | undefined;

  /**
   * If `true`, a `1px` solid `divider`-colored border will be displayed at
   * the top edge of the scrollable content area.
   *
   * This is useful when the header above the scroll area is a tab bar.
   *
   * Note that {@link UseHasScrollbarState.topShadowHeaderSx} MUST be applied
   * to the `sx` prop of the ***header element*** above the scroll area.
   */
  drawTopBorder: boolean;
}

export interface UseHasScrollbarState {
  /**
   * If `true`, a scrollbar is currently visible.
   */
  readonly hasScrollbar: boolean;

  /**
   * If `true`, the user's scroll position is at the very top of the
   * scrollable area.
   */
  readonly isAtTop: boolean;

  /**
   * If `true`, the user's scroll position is at the very bottom of the
   * scrollable area.
   */
  readonly isAtBottom: boolean;

  /**
   * If `true`, {@link topShadowEl} contains a React element can be inserted
   * into a header element above the scrollable element to render an
   * inset shadow at the top of the scroll area.
   *
   * If `false`, {@link topShadowEl} is `undefined`.
   */
  readonly isTopShadowVisible: boolean;

  /**
   * If `true`, {@link bottomShadowEl} contains a React element can be inserted
   * into a footer element below the scrollable element to render an
   * inset shadow at the bottom of the scroll area.
   *
   * If `false`, {@link bottomShadowEl} is `undefined`.
   */
  readonly isBottomShadowVisible: boolean;

  /**
   * If {@link isTopShadowVisible} is `true`, this field will contain
   * a React element can be inserted into a header element above the
   * scrollable element to render an inset shadow at the top of the
   * scroll area.
   *
   * If {@link isTopShadowVisible} is `false`, this field will be `undefined`.
   */
  readonly topShadowEl: ReactElement | undefined;

  /**
   * If {@link isBottomShadowVisible} is `true`, this field will contain
   * a React element can be inserted into a footer element below the
   * scrollable element to render an inset shadow at the bottom of the
   * scroll area.
   *
   * If {@link isBottomShadowVisible} is `false`, this field will be `undefined`.
   */
  readonly bottomShadowEl: ReactElement | undefined;

  /**
   * MUI `SxProps` that should be applied to a header element above the
   * scrollable element.
   */
  readonly topShadowHeaderSx: ShadowParentSx;

  /**
   * MUI `SxProps` that should be applied to a footer element below the
   * scrollable element.
   */
  readonly bottomShadowFooterSx: ShadowParentSx;
}

export interface ShadowParentSx extends Readonly<
  Pick<
    CSSProperties,
    'borderBottomWidth' | 'borderBottomStyle' | 'borderBottomColor'
  >
> {
  /**
   * Allow child <EdgeDropShadow> elements to be positioned absolutely.
   */
  readonly position: 'relative';

  /**
   * Ensure that the shadow is painted on top of the scrollable body content.
   */
  readonly zIndex: 2;
}

const INITIAL_STATE: UseHasScrollbarState = {
  hasScrollbar: false,
  isAtTop: false,
  isAtBottom: false,
  isTopShadowVisible: false,
  isBottomShadowVisible: false,
  topShadowEl: undefined,
  bottomShadowEl: undefined,
  topShadowHeaderSx: {
    position: 'relative',
    zIndex: 2,
  },
  bottomShadowFooterSx: {
    position: 'relative',
    zIndex: 2,
  },
};

/**
 * ### Description
 *
 * Detects whether a scrollable element has a visible scrollbar, and if so,
 * whether the user is currently at the *top*, *bottom*, or *middle* of the
 * scrollable area.
 *
 * What's more, this hook also generates CSS styles (MUI `SxProps`) and
 * React elements to display a subtle shadow at the top and bottom of
 * the content area when the user has scrolled away from that edge.
 *
 * ### Why?
 *
 * A subtle shadow at the top and bottom edge of the content area is a helpful
 * visual aid to let the user know that they can scroll up or down to see more
 * content.
 *
 * Without these shadows, it is not always obvious that there is more content
 * hidden above or below.
 *
 * ### Important notes
 *
 * The shadow that **appears** to be an *inner* shadow inside the *top* of a
 * scrollable content area is actually an *outer* shadow protruding from the
 * *bottom edge* of a separate header element above the scrollable content.
 *
 * Likewise, the shadow that **appears** to be an *inner* shadow at the *bottom*
 * of a scrollable content area is actually an *outer* shadow protruding
 * from the *top edge* of a footer below the scrollable content.
 *
 * This is because the {@link EdgeDropShadow} component is designed to
 * ***radiates away from*** an outer edge of its parent component.
 *
 * ```
 * ┌─────────────────────────────────┐
 * │  Header w/ bottom drop shadow   │
 * │  is the `topShadowParent`       │
 * ┝┳┳┳┳┳┳┳┳┳┳┳┳┳┳┳┳┳┳┳┳┳┳┳┳┳┳┳┳┳┳┳┳┳┥
 * │   5. ...                        │
 * │   6. ...                     ┃┃ │
 * │   7. ...                     ┃┃ │
 * │   8. ...     Scrollable      ██ │
 * │   9. ...      Content        ┃┃ │
 * │  10. ...       Area          ┃┃ │
 * │  11. ...                     ┃┃ │
 * │  12. ...                     ┃┃ │
 * │  13. ...                        │
 * ┝┻┻┻┻┻┻┻┻┻┻┻┻┻┻┻┻┻┻┻┻┻┻┻┻┻┻┻┻┻┻┻┻┻┥
 * │  Footer w/ top drop shadow      │
 * │  is the `bottomShadowParent`    │
 * └─────────────────────────────────┘
 * ```
 */
export const useHasScrollbar = ({
  scrollableEl,
  drawTopBorder,
}: UseHasScrollbarArgs): UseHasScrollbarState => {
  const isClient = useIsClient();
  const [state, setState] = useState<UseHasScrollbarState>(INITIAL_STATE);
  const el = scrollableEl ?? null;

  debugLogger.log('el:', el);

  const handleResizeImmediate = useCallback(() => {
    if (!el) {
      debugLogger
        .fn('handleResizeImmediate')
        .hook('useCallback')
        .log('el is null');
      return;
    }

    const clientHeight = el.clientHeight;
    const scrollHeight = el.scrollHeight;
    const scrollTop = el.scrollTop;
    const scrollBottom = scrollTop + clientHeight;

    const hasScrollbar = scrollHeight > clientHeight;
    const isAtTop = scrollTop <= 0;
    // Subtract one pixel from scrollHeight to account for the browser
    // rounding down fractional subpixel values.
    const isAtBottom = scrollBottom >= scrollHeight - 1;

    const isTopShadowVisible = hasScrollbar && !isAtTop;
    const isBottomShadowVisible = hasScrollbar && !isAtBottom;

    // This might seem backwards, but it's correct: The
    // "top inner content" shadow is actually implemented as a
    // "bottom outer header" shadow.
    const topShadow = (
      <EdgeDropShadow outerEdge="bottom" opacity={isTopShadowVisible ? 1 : 0} />
    );

    // This might seem backwards, but it's correct: The
    // "bottom inner content" shadow is actually implemented as a
    // "top outer footer" shadow.
    const bottomShadow = (
      <EdgeDropShadow outerEdge="top" opacity={isBottomShadowVisible ? 1 : 0} />
    );

    const topShadowParentSx: ShadowParentSx = {
      position: 'relative',
      zIndex: 2,
    };

    const bottomShadowParentSx: ShadowParentSx = {
      position: 'relative',
      zIndex: 2,
    };

    if (drawTopBorder) {
      Object.assign(topShadowParentSx, {
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
        borderBottomColor: isTopShadowVisible
          ? color('divider')
          : 'transparent',
      } satisfies Partial<ShadowParentSx>);
    }

    const newState: UseHasScrollbarState = {
      hasScrollbar,
      isAtTop,
      isAtBottom,
      isTopShadowVisible,
      isBottomShadowVisible,
      topShadowEl: topShadow,
      bottomShadowEl: bottomShadow,
      topShadowHeaderSx: topShadowParentSx,
      bottomShadowFooterSx: bottomShadowParentSx,
    };

    const details = {
      clientHeight,
      scrollHeight,
      scrollTop: el.scrollTop,
      scrollBottom: el.scrollTop + clientHeight,
    };

    debugLogger.log(
      'handleResizeImmediate',
      'onScrollOrResize',
      null,
      newState,
      details,
    );

    setState((oldState: UseHasScrollbarState): UseHasScrollbarState => {
      // Don't set a new object reference if the values haven't changed.
      return deepEqual(oldState, newState) ? oldState : newState;
    });
  }, [drawTopBorder, el]);

  const handleResizeThrottled = useThrottledCallback(
    handleResizeImmediate,
    100,
    {
      leading: true,
      trailing: true,
    },
  );

  const resizeObserver: ResizeObserver | undefined = useMemo(() => {
    return isClient ? new ResizeObserver(handleResizeThrottled) : undefined;
  }, [handleResizeThrottled, isClient]);

  useEffect(() => {
    if (!el) {
      debugLogger.hook('useEffect').log('el is null');
      return () => undefined;
    }
    if (!resizeObserver) {
      debugLogger.hook('useEffect').log('resizeObserver is null');
      return () => undefined;
    }

    log('useEffect', 'setup', 'observe', el);

    // Check for scrollbars every `N` milliseconds whenever the element is
    // resized or scrolled.
    resizeObserver.observe(el);
    el.addEventListener('scroll', handleResizeThrottled);

    // Check for scrollbars immediately, without throttling, on the next tick.
    setTimeout(handleResizeImmediate);

    return () => {
      log('useEffect', 'cleanup', 'unobserve', el);
      resizeObserver.unobserve(el);
      el.removeEventListener('scroll', handleResizeThrottled);
    };
  }, [el, handleResizeImmediate, handleResizeThrottled, resizeObserver]);

  return el ? state : INITIAL_STATE;
};
