import React, { useMemo } from 'react';
import { Box, dialogClasses } from '@mui/material';

import type { EventName } from './ui-logger';
import { UiLogger } from './ui-logger';
import type { ClientHints } from './useClientHints';
import { useClientHints } from './useClientHints';
import type { EventListenerMap } from './useEventHandlers';
import { useEventHandlers } from './useEventHandlers';

const rootLogger = new UiLogger((...data) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  console.debug(...data);
}).hook('useSaveShortcut', 'bright');

function logEvent(event: EventName, source: string, ...args: unknown[]): void {
  let logger: UiLogger = rootLogger.event(event);
  if (source.startsWith('on')) {
    logger = logger.event(source as EventName, 'normal');
  } else {
    logger = logger.state(source, 'normal');
  }
  logger.log(...args);
}

export interface UseSaveShortcutProps {
  rootEl?: HTMLElement | null;
  disabled?: boolean;
  ignoreInDialogs?: boolean;
  eventHandlerOptions?: boolean | AddEventListenerOptions;
  onSave: (evt: KeyboardEvent) => void;
}

export interface UseSaveShortcutResult {
  saveButtonTooltipTitle: React.ReactElement<'div'>;
}

export function useSaveShortcut({
  rootEl,
  disabled,
  ignoreInDialogs,
  eventHandlerOptions,
  onSave,
}: UseSaveShortcutProps): UseSaveShortcutResult {
  const clientHints: ClientHints = useClientHints();
  const { isApple, metaKeyName } = clientHints;

  const saveButtonTooltipTitle = useMemo<React.ReactElement<'div'>>(
    () => (
      <Box sx={{ marginY: 0.75 }}>
        <kbd>{metaKeyName}</kbd>+<kbd>S</kbd>
      </Box>
    ),
    [metaKeyName],
  );

  const handlers: EventListenerMap =
    typeof window === 'undefined'
      ? {}
      : {
          keydown(evt: KeyboardEvent): void {
            const { ctrlKey, metaKey, altKey, shiftKey, key, target } = evt;
            const isCtrlOrCmd = (!isApple && ctrlKey) || (isApple && metaKey);
            const isAltOrCtrl = (!isApple && altKey) || (isApple && ctrlKey);

            if (isCtrlOrCmd && !isAltOrCtrl && !shiftKey && key === 's') {
              if (disabled) {
                logEvent('keydown', 'disabled', 'ignoring');
                return;
              }

              evt.preventDefault();

              const dialogRootEl = (target as HTMLElement).closest(
                `.${dialogClasses.root}`,
              );

              // Ignore Ctrl+S when a dialog is open.
              if (ignoreInDialogs && dialogRootEl) {
                logEvent('keydown', 'dialog', 'ignoring');
                return;
              }

              logEvent('keydown', 'onSave');

              onSave(evt);
            }
          },
        };

  useEventHandlers(rootEl, handlers, eventHandlerOptions);

  return {
    saveButtonTooltipTitle,
  };
}
