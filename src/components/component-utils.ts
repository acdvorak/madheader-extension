import type { MouseEvent } from 'react';
import type { CSSProperties } from '@mui/material';

import type { ScalarSx } from '@/theme/themeTypes';

export const ELLIPSIS_SX = {
  display: 'inline-block',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  verticalAlign: 'center' satisfies CSSProperties['verticalAlign'],
} as const satisfies ScalarSx;

function simplify(str: string): string {
  return str.replace(/\s+/g, '').toLowerCase();
}

export function onMouseOverEllipsis<T extends HTMLElement>(
  evt: MouseEvent<T>,
): void {
  const titleEl = (evt.target as Element).closest<T>('[data-title]');
  if (!titleEl) {
    return;
  }

  const hasOverflow = titleEl.scrollWidth > titleEl.clientWidth;
  const titleValue = titleEl.getAttribute('data-title') ?? '';
  const titleEqualsContent =
    simplify(titleValue) === simplify(titleEl.textContent);
  if (hasOverflow || !titleEqualsContent) {
    titleEl.title = titleValue;
  } else {
    titleEl.removeAttribute('title');
  }
}
