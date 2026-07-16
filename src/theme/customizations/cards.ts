import type { Components, Theme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

import { gray } from '../themeConstants';

export const cardCustomizations: Components<Theme> = {
  MuiCard: {
    styleOverrides: {
      root: ({ theme }) => {
        const vars = theme.vars || theme;

        return {
          padding: 16,
          gap: 16,
          transition: 'all 100ms ease',
          backgroundColor: gray[50],
          borderRadius: vars.shape.borderRadius,
          border: `1px solid ${vars.palette.divider}`,
          boxShadow: 'none',
          ...theme.applyStyles('dark', {
            backgroundColor: gray[800],
          }),
          variants: [
            {
              props: {
                variant: 'outlined',
              },
              style: {
                border: `1px solid ${vars.palette.divider}`,
                boxShadow: 'none',
                background: 'hsl(0, 0%, 100%)',
                ...theme.applyStyles('dark', {
                  background: alpha(gray[900], 0.4),
                }),
              },
            },
          ],
        };
      },
    },
  },

  MuiCardContent: {
    styleOverrides: {
      root: {
        padding: 0,
        '&:last-child': { paddingBottom: 0 },
      },
    },
  },

  MuiCardHeader: {
    styleOverrides: {
      root: {
        padding: 0,
      },
    },
  },

  MuiCardActions: {
    styleOverrides: {
      root: {
        padding: 0,
      },
    },
  },
};
