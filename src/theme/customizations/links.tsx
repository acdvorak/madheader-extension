import type { Components, Theme } from '@mui/material/styles';

export const linkCustomizations: Components<Theme> = {
  MuiLink: {
    defaultProps: {
      underline: 'none',
    },
    styleOverrides: {
      root: {
        fontWeight: 500,
        position: 'relative',
        textDecoration: 'none',
        width: 'fit-content',

        outline: `3px solid transparent`,
        outlineOffset: '4px',
        borderRadius: '2px',

        '&:focus-visible': {
          outlineColor: 'currentColor',
        },
      },
    },
  },
};
