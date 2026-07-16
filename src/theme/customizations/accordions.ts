import type { Components, Theme } from '@mui/material/styles';

import { gray } from '../themeConstants';

export const accordionCustomizations: Components<Theme> = {
  MuiAccordion: {
    defaultProps: {
      elevation: 0,
      disableGutters: true,
      slotProps: {
        transition: { timeout: 250 },
      },
    },
    styleOverrides: {
      root: ({ theme }) => {
        const vars = theme.vars || theme;

        return {
          padding: 4,
          overflow: 'clip',
          backgroundColor: vars.palette.background.default,
          border: '1px solid',
          borderColor: vars.palette.divider,
          ':before': {
            backgroundColor: 'transparent',
          },
          '&:not(:last-of-type)': {
            borderBottom: 'none',
          },
          '&:first-of-type': {
            borderTopLeftRadius: vars.shape.borderRadius,
            borderTopRightRadius: vars.shape.borderRadius,
          },
          '&:last-of-type': {
            borderBottomLeftRadius: vars.shape.borderRadius,
            borderBottomRightRadius: vars.shape.borderRadius,
          },
        };
      },
    },
  },

  MuiAccordionSummary: {
    styleOverrides: {
      root: ({ theme }) => {
        return {
          border: 'none',
          borderRadius: 8,
          '&:hover': { backgroundColor: gray[50] },
          '&:focus-visible': { backgroundColor: 'transparent' },
          ...theme.applyStyles('dark', {
            '&:hover': { backgroundColor: gray[800] },
          }),
        };
      },
    },
  },

  MuiAccordionDetails: {
    styleOverrides: {
      root: { mb: 20, border: 'none' },
    },
  },
};
