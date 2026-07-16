import { useEffect, useEffectEvent } from 'react';

import { UiLogger } from './ui-logger';

const rootLogger = new UiLogger((...data) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  console.debug(...data);
});

export type EventListenerMap<
  EventMap extends GlobalEventHandlersEventMap = WindowEventMap,
> = {
  [EventType in keyof EventMap]?: EventType extends string
    ? ((evt: EventMap[EventType]) => void) | null
    : never;
};

// TODO(advorak): Use `null` `element` to indicate "don't listen to events"

/**
 * Registers event handlers on the `window`.
 *
 * Handlers are automatically unregistered when the parent React component
 * unmounts.
 *
 * For compatibility, the {@link options} argument can be a `boolean`,
 * which is equivalent to setting `options.capture`.
 *
 * When set to `true`, `options.capture` prevents callbacks from being
 * invoked when the event's `eventPhase` attribute value is `BUBBLING_PHASE`.
 * When `false` (or not present), callbacks will not be invoked when the
 * event's `eventPhase` attribute value is `CAPTURING_PHASE`.
 * Either way, callbacks _will_ be invoked if the event's `eventPhase`
 * attribute value is `AT_TARGET`.
 *
 * When set to `true`, `options.passive` indicates that callbacks ***will not
 * cancel the event*** by invoking `preventDefault()`. This is used to enable
 * performance optimizations as described in § 2.8 "Observing event listeners".
 *
 * When set to `true`, `options.once` indicates that callbacks will only be
 * invoked once, after which the event listener will be removed.
 *
 * If an `AbortSignal` is passed for `options.signal`, then event listeners
 * will be removed when `signal` is aborted.
 *
 * Each event listener is appended to target's event listener list, but is not
 * appended if the same type, callback, and capture have already been added.
 */
export function useEventHandlers<
  EventMap extends GlobalEventHandlersEventMap = WindowEventMap,
>(
  listeners: EventListenerMap<EventMap>,
  options?: boolean | AddEventListenerOptions,
): void;

/**
 * Registers event handlers on the given {@link element} (if it is truthy) or
 * the `window` (if {@link element} is `undefined`). If {@link element} is
 * `null`, no event handlers are registered.
 *
 * Handlers are automatically unregistered when the parent React component
 * unmounts.
 *
 * For compatibility, the {@link options} argument can be a `boolean`,
 * which is equivalent to setting `options.capture`.
 *
 * When set to `true`, `options.capture` prevents callbacks from being
 * invoked when the event's `eventPhase` attribute value is `BUBBLING_PHASE`.
 * When `false` (or not present), callbacks will not be invoked when the
 * event's `eventPhase` attribute value is `CAPTURING_PHASE`.
 * Either way, callbacks _will_ be invoked if the event's `eventPhase`
 * attribute value is `AT_TARGET`.
 *
 * When set to `true`, `options.passive` indicates that callbacks ***will not
 * cancel the event*** by invoking `preventDefault()`. This is used to enable
 * performance optimizations as described in § 2.8 "Observing event listeners".
 *
 * When set to `true`, `options.once` indicates that callbacks will only be
 * invoked once, after which the event listener will be removed.
 *
 * If an `AbortSignal` is passed for `options.signal`, then event listeners
 * will be removed when `signal` is aborted.
 *
 * Each event listener is appended to target's event listener list, but is not
 * appended if the same type, callback, and capture have already been added.
 */
export function useEventHandlers<
  EventMap extends GlobalEventHandlersEventMap = WindowEventMap,
>(
  element: HTMLElement | Window | Document | undefined | null,
  listeners: EventListenerMap<EventMap>,
  options?: boolean | AddEventListenerOptions,
): void;

/**
 * Registers event handlers on an `HTMLElement`, `Document`, or `Window`.
 *
 * Handlers are automatically unregistered when the parent React component
 * unmounts.
 *
 * For compatibility, the {@link options} argument can be a `boolean`,
 * which is equivalent to setting `options.capture`.
 *
 * When set to `true`, `options.capture` prevents callbacks from being
 * invoked when the event's `eventPhase` attribute value is `BUBBLING_PHASE`.
 * When `false` (or not present), callbacks will not be invoked when the
 * event's `eventPhase` attribute value is `CAPTURING_PHASE`.
 * Either way, callbacks _will_ be invoked if the event's `eventPhase`
 * attribute value is `AT_TARGET`.
 *
 * When set to `true`, `options.passive` indicates that callbacks ***will not
 * cancel the event*** by invoking `preventDefault()`. This is used to enable
 * performance optimizations as described in § 2.8 "Observing event listeners".
 *
 * When set to `true`, `options.once` indicates that callbacks will only be
 * invoked once, after which the event listener will be removed.
 *
 * If an `AbortSignal` is passed for `options.signal`, then event listeners
 * will be removed when `signal` is aborted.
 *
 * Each event listener is appended to target's event listener list, but is not
 * appended if the same type, callback, and capture have already been added.
 */
export function useEventHandlers<
  EventMap extends GlobalEventHandlersEventMap = WindowEventMap,
>(
  one:
    | HTMLElement
    | Window
    | Document
    | undefined
    | null
    | EventListenerMap<EventMap>,
  two?: EventListenerMap<EventMap> | boolean | AddEventListenerOptions,
  three: boolean | AddEventListenerOptions = false,
): void {
  const hasElementArgument =
    one == null ||
    (typeof one === 'object' &&
      'addEventListener' in one &&
      'removeEventListener' in one);
  const element = hasElementArgument ? one : undefined;
  const listeners = (
    hasElementArgument ? two : one
  ) as EventListenerMap<EventMap>;
  const options = (hasElementArgument ? three : two) as
    boolean | AddEventListenerOptions;
  const listenerTypesKey = JSON.stringify(Object.keys(listeners).sort());

  const getListenerTypes = useEffectEvent(
    (): Array<keyof EventMap & string> => {
      return Object.keys(listeners).sort() as Array<keyof EventMap & string>;
    },
  );

  const dispatchEvent = useEffectEvent(
    (type: keyof EventMap & string, evt: Event): void => {
      const listener = listeners[type] as EventListener | null | undefined;
      listener?.(evt);
    },
  );

  useEffect(() => {
    if (element === null) {
      rootLogger
        .hook('useEventHandlers', getListenerTypes())
        .hook('useEffect')
        .log('ignoring null element');
      return () => undefined;
    }

    const eventTarget = element ?? window;
    const keys = getListenerTypes();
    const log = (...args: unknown[]): void => {
      rootLogger
        .hook('useEventHandlers', keys)
        .hook('useEffect')
        .log(...args);
    };

    if (keys.length === 0) {
      log('no handlers; ignoring');
      return () => undefined;
    }

    const entries = keys.map((type) => {
      const listener: EventListener = (evt) => {
        dispatchEvent(type, evt);
      };
      eventTarget.addEventListener(type, listener, options);
      return [type, listener] as const;
    });

    log('registering');

    return () => {
      log('unregistering');
      entries.forEach(([type, listener]) => {
        eventTarget.removeEventListener(type, listener, options);
      });
    };
  }, [element, listenerTypesKey, options]);
}
