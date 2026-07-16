/**
 * @fileoverview
 *
 * Forked from
 * https://github.com/ZeeCoder/use-resize-observer/blob/465fbc11c92e1b97a1dcb526b44ce4d889956951/src/utils/useResolvedElement.ts
 */

import { useCallback, useEffect, useRef } from 'react';
import type { RefCallback, RefObject } from 'react';

type SubscriberCleanupFunction = () => void;
// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
type SubscriberResponse = SubscriberCleanupFunction | void;

// This could've been more streamlined with internal state instead of abusing
// refs to such extent, but then composing hooks and components could not
// opt-out of unnecessary renders.
export function useResolvedElement<T extends Element>(
  subscriber: (element: T) => SubscriberResponse,
  refOrElement?: T | RefObject<T | null> | null,
): RefCallback<T> {
  const lastReportRef = useRef<{
    element: T | null;
    subscriber: typeof subscriber;
    cleanup?: SubscriberResponse;
  } | null>(null);
  const refOrElementRef = useRef<typeof refOrElement>(null);
  const cbElementRef = useRef<T | null>(null);

  const evaluateSubscription = useCallback(() => {
    const cbElement = cbElementRef.current;
    const refOrElement2 = refOrElementRef.current;
    // Ugly ternary. But smaller than an if-else block.
    const element: T | null =
      cbElement ||
      (refOrElement2
        ? refOrElement2 instanceof Element
          ? refOrElement2
          : refOrElement2.current
        : null);

    if (
      lastReportRef.current?.element === element &&
      lastReportRef.current.subscriber === subscriber
    ) {
      return;
    }

    if (lastReportRef.current?.cleanup) {
      lastReportRef.current.cleanup();
    }
    lastReportRef.current = {
      element,
      subscriber,
      // Only calling the subscriber, if there's an actual element to report.
      // Setting cleanup to undefined unless a subscriber returns one, as an
      // existing cleanup function would've been just called.
      cleanup: element ? subscriber(element) : undefined,
    };
  }, [subscriber]);

  // Keep the latest ref-or-element outside render, then re-evaluate.
  useEffect(() => {
    refOrElementRef.current = refOrElement;
    evaluateSubscription();
  }, [evaluateSubscription, refOrElement]);

  // making sure we call the cleanup function on unmount
  useEffect(() => {
    return () => {
      if (lastReportRef.current?.cleanup) {
        lastReportRef.current.cleanup();
        lastReportRef.current = null;
      }
    };
  }, []);

  return useCallback(
    (element) => {
      cbElementRef.current = element;
      evaluateSubscription();
    },
    [evaluateSubscription],
  );
}
