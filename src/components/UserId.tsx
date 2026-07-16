import { useMemo } from 'react';
import type { MouseEvent } from 'react';
import type { CSSProperties, Theme } from '@mui/material';
import { Box, type SxProps } from '@mui/material';

import { MuiLink } from '@/theme/components/MuiLink';
import { mergeSx, type MuiPaletteColorName } from '@/theme/themeTypes';

import { ELLIPSIS_SX, onMouseOverEllipsis } from './component-utils';

function getOrCreateStyleEl(): HTMLStyleElement {
  let el = document.getElementById('acd-id-style') as HTMLStyleElement | null;
  if (el) {
    return el;
  }
  el = document.createElement('style');
  el.id = 'acd-id-style';
  document.head.appendChild(el);
  return el;
}

const onMouseOverHighlight = (evt: MouseEvent<HTMLElement>): void => {
  const targetEl = evt.currentTarget.closest<HTMLElement>(
    '[data-id-value-lower]',
  );
  const lower = targetEl?.getAttribute('data-id-value-lower');
  if (lower) {
    const styleEl = getOrCreateStyleEl();
    // TODO(advorak): Handle underline variant
    styleEl.innerHTML = `
      .acd-id-highlight[data-id-value-lower="${lower}"] {
        outline: 1px solid color-mix(in srgb, currentColor 50%, transparent);
        outline-offset: 1px;
      }
      .acd-id-highlight[data-id-value-lower="${lower}"]:hover {
        outline-color: currentColor
      }
    `;
  }
  onMouseOverEllipsis(evt);
};

const onMouseOutUnhighlight = (_evt: MouseEvent<HTMLElement>): void => {
  getOrCreateStyleEl().innerHTML = '';
};

interface BaseUserIdProps {
  prevValue?: string | null;
  inactive?: boolean;
  inert?: boolean;
  title?: string | null;
  getHref?: (id: string) => AnyUrl | null | undefined;
  sx?: SxProps<Theme>;
  maxWidth?: CSSProperties['maxWidth'];
}

export type UserIdProps = BaseUserIdProps &
  (
    | {
        value: string | null | undefined;
        children?: undefined;
      }
    | {
        value?: undefined;
        children: React.ReactNode;
      }
  );

export const UserId: React.FC<UserIdProps> = ({
  value,
  children,
  prevValue,
  inactive,
  inert,
  title,
  getHref,
  sx,
  maxWidth,
}) => {
  const asString: string | undefined = value
    ? value
    : typeof children === 'string'
      ? children
      : undefined;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  title = title || (inactive && 'Inactive') || asString;

  const lower: string | undefined = asString?.toLowerCase();

  let textColor: MuiPaletteColorName = 'text.primary';
  if (asString && asString.toLowerCase() === prevValue?.toLowerCase()) {
    textColor = 'text.secondary';
  } else if (inactive) {
    textColor = 'text.disabled';
  }

  const merged = useMemo((): SxProps<Theme> => {
    return mergeSx([
      {
        ...ELLIPSIS_SX,

        verticalAlign: 'middle',
        maxWidth,
        borderRadius: '0.25em',
        fontFamily: 'monospace',
        whiteSpace: 'nowrap',
        padding: '0 2px',
        color: textColor,

        '::before': {
          display: 'none',
        },
      },

      inactive && {
        // Simulate `text-decoration: line-through` with better
        // horizontal positioning.
        //
        // To lower the line: Increase the percentage values.
        //
        // To raise the line: Decrease the percentage values
        // (e.g., change 45% and 55% to 40% and 50%).
        backgroundImage:
          'linear-gradient(transparent 65%, currentColor 65%, currentColor 75%, transparent 75%)',
        backgroundSize: '100% 1em',
        backgroundRepeat: 'no-repeat',
      },

      sx,
    ]);
  }, [inactive, maxWidth, sx, textColor]);

  const href = useMemo((): AnyUrl | null => {
    if (!getHref || !asString) {
      return null;
    }
    return getHref(asString) ?? null;
  }, [asString, getHref]);

  if (!value && !children) {
    return undefined;
  }

  const nonBreakingSpaces = asString
    ?.split('')
    // Non-Breaking Space = U+00A0
    .map((ch) => (ch === ' ' ? '\u00A0' : ch))
    .join('');

  const content: React.ReactNode = nonBreakingSpaces || children;

  if (href) {
    return (
      <MuiLink
        href={href}
        sx={merged}
        data-title={title}
        data-id-value-lower={inert ? undefined : lower}
        onMouseOver={inert ? undefined : onMouseOverHighlight}
        onMouseOut={inert ? undefined : onMouseOutUnhighlight}
        className="acd-id-highlight"
      >
        {content}
      </MuiLink>
    );
  }

  return (
    <Box
      component="span"
      sx={merged}
      data-title={title}
      data-id-value-lower={inert ? undefined : lower}
      onMouseOver={inert ? undefined : onMouseOverHighlight}
      onMouseOut={inert ? undefined : onMouseOutUnhighlight}
      className="acd-id-highlight"
    >
      {content}
    </Box>
  );
};
