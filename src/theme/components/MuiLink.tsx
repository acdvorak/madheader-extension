import { useMemo } from 'react';
import type { HTMLAttributeAnchorTarget } from 'react';
import type { SxProps, Theme } from '@mui/material';
import {
  Box,
  Link as StandardMuiLink,
  type LinkProps as StandardMuiLinkProps,
  useTheme,
} from '@mui/material';
import LaunchIcon from '@mui/icons-material/Launch';

import { mergeSx } from '@/theme/themeTypes';

import { brand } from '../themeConstants';

export type MuiLinkProps = StandardMuiLinkProps;

/**
 * MUI-themed hyperlink for standard browser navigation.
 */
export const MuiLink: React.FC<MuiLinkProps> = ({
  href,
  sx,
  target,
  children,
  ...props
}) => {
  const theme = useTheme();
  const hrefString = typeof href === 'string' ? href : '';
  const isExternal = hrefString.startsWith('http');

  const merged = useMemo((): SxProps<Theme> => {
    return mergeSx([
      {
        ...theme.applyStyles('dark', { color: brand[300] }),
        ...theme.applyStyles('light', { color: brand[500] }),

        '&:hover': {
          ...theme.applyStyles('dark', { color: brand[200] }),
          ...theme.applyStyles('light', { color: brand[300] }),
        },
      },

      {
        '&::before': {
          content: '""',
          position: 'absolute',
          width: '100%',
          height: '2px',
          bottom: 0,
          left: 0,
          backgroundColor: 'currentColor',
          opacity: 1.0,
          transition: 'width 0.3s ease, opacity 0.3s ease',
        },

        '&:hover::before': {
          width: 0,
        },
      },

      isExternal && {
        '&::before': {
          width: 'calc(100% - 1em - 2px)',
        },
      },
      sx,
    ]);
  }, [theme, isExternal, sx]);

  return (
    <StandardMuiLink
      href={href}
      target={
        target ||
        (isExternal
          ? ('_blank' satisfies HTMLAttributeAnchorTarget)
          : undefined)
      }
      sx={merged}
      {...props}
    >
      <Box component="span">{children}</Box>
      {isExternal && (
        <Box component="span" sx={{ fontSize: '75%', marginLeft: '0.5em' }}>
          <LaunchIcon fontSize="inherit" />
        </Box>
      )}
    </StandardMuiLink>
  );
};

/**
 * MUI-themed hyperlink for standard browser navigation.
 */
export const BasicLink: React.FC<MuiLinkProps> = ({
  href,
  sx,
  target,
  children,
  ...props
}) => {
  const hrefString = typeof href === 'string' ? href : '';
  const isExternal = hrefString.startsWith('http');

  return (
    <StandardMuiLink
      href={href}
      target={
        target ||
        (isExternal
          ? ('_blank' satisfies HTMLAttributeAnchorTarget)
          : undefined)
      }
      sx={sx}
      {...props}
    >
      {children}
    </StandardMuiLink>
  );
};
