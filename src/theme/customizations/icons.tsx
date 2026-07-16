import type { Components, Theme } from '@mui/material/styles';

export const iconCustomizations: Components<Theme> = {
  MuiIcon: {
    defaultProps: {
      fontSize: 'small',
    },
    styleOverrides: {
      root: {
        variants: [
          {
            props: {
              fontSize: 'small',
            },
            style: {
              fontSize: '1rem',
            },
          },
        ],
      },
    },
  },
};
