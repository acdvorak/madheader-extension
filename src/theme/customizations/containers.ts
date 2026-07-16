import type { Components, Theme } from '@mui/material/styles';

export const containerCustomizations: Components<Theme> = {
  MuiPaper: {
    defaultProps: {
      elevation: 0,
    },
  },

  MuiStack: {
    defaultProps: {
      useFlexGap: true,
    },
  },
};
