import { toggleButtonClasses, toggleButtonGroupClasses } from '@mui/material';
import type { Components, Theme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

export const buttonCustomizations: Components<Theme> = {
  MuiButtonBase: {
    defaultProps: {
      disableTouchRipple: true,
      disableRipple: true,
    },
    styleOverrides: {
      root: ({ theme }) => {
        return {
          boxSizing: 'border-box',
          transition: 'all 100ms ease-in',
          outline: `0px solid ${alpha(theme.palette.primary.main, 0.5)}`,
          outlineOffset: '2px',
          '&:focus-visible': {
            outlineWidth: '3px',
          },
        };
      },
    },
  },

  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: 'none',
      },
    },
  },

  MuiIconButton: {
    styleOverrides: {
      root: ({ theme }) => {
        return {
          '&, &.MuiIconButton-root.MuiIconButton-root': {
            width: 40,
            height: 40,
            borderRadius: '100%',
          },
          '& svg, & .MuiSvgIcon-root.MuiSvgIcon-root': {
            width: '100%',
            height: '100%',
          },
        };
      },
    },

    /*
    styleOverrides: {
      root: ({ theme }) => {
        const vars = theme.vars || theme;

        return {
          boxShadow: 'none',
          borderRadius: vars.shape.borderRadius,
          textTransform: 'none',
          fontWeight: theme.typography.fontWeightMedium,
          letterSpacing: 0,
          color: vars.palette.text.primary,
          border: '1px solid ',
          borderColor: gray[200],
          backgroundColor: alpha(gray[50], 0.3),
          '&:hover': {
            backgroundColor: gray[100],
            borderColor: gray[300],
          },
          '&:active': {
            backgroundColor: gray[200],
          },
          ...theme.applyStyles('dark', {
            backgroundColor: gray[800],
            borderColor: gray[700],
            '&:hover': {
              backgroundColor: gray[900],
              borderColor: gray[600],
            },
            '&:active': {
              backgroundColor: gray[900],
            },
          }),
          variants: [
            {
              props: {
                size: 'small',
              },
              style: {
                width: '2.25rem',
                height: '2.25rem',
                padding: '0.25rem',
                [`& .${svgIconClasses.root}`]: { fontSize: '1rem' },
              },
            },
            {
              props: {
                size: 'medium',
              },
              style: {
                width: '2.5rem',
                height: '2.5rem',
              },
            },
          ],
        };
      },
    },
    */
  },

  MuiToggleButton: {
    styleOverrides: {
      root: {
        outlineOffset: '0',
        textTransform: 'none',
        [`&.${toggleButtonClasses.root}`]: {
          borderRadius: '0',
        },
        // NOTE: `first` is a CUSTOM CSS class added in TSX!
        [`&.${toggleButtonClasses.root}.first`]: {
          borderRadius: '0.5em 0 0 0.5em',
        },
        // NOTE: `last` is a CUSTOM CSS class added in TSX!
        [`&.${toggleButtonClasses.root}.last`]: {
          borderRadius: '0 0.5em 0.5em 0',
        },
      },
    },
  },

  MuiToggleButtonGroup: {
    styleOverrides: {
      root: ({ theme }) => {
        const group = toggleButtonGroupClasses;
        const button = toggleButtonClasses;
        const color = theme.alpha(theme.vars?.palette.text.primary ?? '', 0.5);
        return {
          [`&.${group.root}`]: {
            gap: 0,
          },
          [`&.${group.horizontal} .${button.selected}`]: {
            boxShadow: `inset 0px -2px 0 0 ${color}`,
          },
          [`&.${group.vertical} .${button.selected}`]: {
            boxShadow: `inset -3px 0 0 0 ${color}`,
          },
        };
      },
    },
  },
};
