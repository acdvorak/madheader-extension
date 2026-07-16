import type { Components, Theme } from '@mui/material/styles';

import { gray } from '../themeConstants';

export const inputCustomizations: Components<Theme> = {
  MuiInputBase: {
    styleOverrides: {
      root: {
        border: 'none',
      },
      input: {
        '&::placeholder': {
          opacity: 0.7,
          color: gray[500],
        },
      },
    },
  },

  MuiFormControl: {
    defaultProps: {
      size: 'small',
      variant: 'outlined',
    },
  },
};
