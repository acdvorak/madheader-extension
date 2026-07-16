import type { Components, Theme } from '@mui/material/styles';
import { tabClasses } from '@mui/material/Tab';

import { gray } from '../themeConstants';

export const tabCustomizations: Components<Theme> = {
  MuiTabs: {
    styleOverrides: {
      root: { minHeight: 'fit-content' },

      indicator: ({ theme }) => {
        const vars = theme.vars || theme;

        return {
          backgroundColor: vars.palette.grey[800],
          ...theme.applyStyles('dark', {
            backgroundColor: vars.palette.grey[200],
          }),
        };
      },
    },
  },

  MuiTab: {
    styleOverrides: {
      root: ({ theme }) => {
        const vars = theme.vars || theme;

        return {
          padding: '6px 8px',
          marginBottom: '8px',
          textTransform: 'none',
          minWidth: 'fit-content',
          minHeight: 'fit-content',
          color: vars.palette.text.secondary,
          borderRadius: vars.shape.borderRadius,
          border: '1px solid',
          borderColor: 'transparent',
          ':hover': {
            color: vars.palette.text.primary,
            backgroundColor: gray[100],
            borderColor: gray[200],
          },
          [`&.${tabClasses.selected}`]: {
            color: gray[900],
          },
          ':focus-visible': {
            outlineOffset: '-3px',
          },
          ...theme.applyStyles('dark', {
            ':hover': {
              color: vars.palette.text.primary,
              backgroundColor: gray[800],
              borderColor: gray[700],
            },
            [`&.${tabClasses.selected}`]: {
              color: '#fff',
            },
          }),
        };
      },
    },
  },
};
