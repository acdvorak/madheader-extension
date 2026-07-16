import { useMemo } from 'react';
import type { SxProps, TooltipProps } from '@mui/material';
import {
  Box,
  Divider,
  Stack,
  type Theme,
  Tooltip,
  Typography,
} from '@mui/material';

import type { Property } from 'csstype';

import { color, gray } from '@/theme/themeConstants';
import { mergeSx } from '@/theme/themeTypes';

export const DefinitionDivider: React.FC = () => {
  return (
    <Divider
      sx={{
        color: color('text.secondary'),
        borderColor: 'color-mix(in srgb, currentColor 50%, transparent)',
        marginY: 1,
      }}
    />
  );
};

export interface DefinitionProps extends Pick<TooltipProps, 'arrow' | 'open'> {
  /**
   * Abbreviation or initialism (e.g., `ChFC`).
   */
  label: React.ReactNode;

  heading?: React.ReactNode;

  /**
   * Tooltip definition of {@link label}.
   */
  children: React.ReactNode;

  /**
   * @default "dim"
   */
  variant?: 'dim' | 'bright';

  labelSx?: SxProps<Theme>;
  tooltipSx?: SxProps<Theme>;

  labelClassName?: string;

  tooltipPlacement?: TooltipProps['placement'];
}

/**
 * Inline-block `<abbr>` element with an MUI {@link Tooltip} that is pre-styled
 * specifically for definitions of abbreviations, acronyms, initialisms, and
 * other terms that may be unfamiliar to the user.
 */
export const Definition: React.FC<DefinitionProps> = ({
  label,
  heading,
  children,
  variant,
  labelSx,
  tooltipSx,
  labelClassName,
  tooltipPlacement = 'right',
  ...tooltipProps
}) => {
  const underlineColor =
    variant === 'bright'
      ? ('currentColor' satisfies Property.Color)
      : gray[400];

  const mergedLabelSx = useMemo((): SxProps<Theme> => {
    return mergeSx([
      {
        display: 'inline-block',
        lineHeight: 1,
        textDecoration:
          `${underlineColor} underline dashed auto` satisfies Property.TextDecoration,
      },
      labelSx,
    ]);
  }, [labelSx, underlineColor]);

  const mergedTooltipSx = useMemo((): SxProps<Theme> => {
    return mergeSx([
      {
        gap: 1,
        paddingX: 0.5,
        paddingY: 0.75,

        '& ul, & ol, & li, & p': {
          margin: 0,
        },
        '& ul': {
          paddingLeft: 2,
        },
        '& ol': {
          paddingLeft: 3,
        },
        blockquote: {
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          marginLeft: 1,
          paddingLeft: 2,
          marginY: 0.5,
          borderLeft: `3px solid color-mix(in srgb, currentColor 20%, transparent)`,
        },
        u: {
          fontWeight: 'bold',
        },
        em: {
          fontWeight: 'bold',
          textDecoration: 'underline',
        },
      },
      tooltipSx,
    ]);
  }, [tooltipSx]);

  return (
    <Tooltip
      title={
        <Stack sx={mergedTooltipSx}>
          {heading && <Typography variant="h6">{heading}</Typography>}
          {children}
        </Stack>
      }
      placement={tooltipPlacement}
      {...tooltipProps}
      slotProps={{
        tooltip: {
          sx: {
            maxWidth: 400,
          },
        },
      }}
    >
      <Box component="abbr" sx={mergedLabelSx} className={labelClassName}>
        {label}
      </Box>
    </Tooltip>
  );
};
