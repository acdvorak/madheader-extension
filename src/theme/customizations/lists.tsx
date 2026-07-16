import { buttonBaseClasses } from '@mui/material/ButtonBase';
import type { Components, Theme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import { svgIconClasses } from '@mui/material/SvgIcon';
import { typographyClasses } from '@mui/material/Typography';

export const listCustomizations: Components<Theme> = {
  MuiList: {
    styleOverrides: {
      root: {
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      },
    },
  },

  MuiListItem: {
    styleOverrides: {
      root: ({ theme }) => {
        const vars = theme.vars || theme;
        return {
          [`& .${svgIconClasses.root}`]: {
            width: '1rem',
            height: '1rem',
            color: vars.palette.text.secondary,
          },
          [`& .${typographyClasses.root}`]: {
            fontWeight: 500,
          },
          [`& .${buttonBaseClasses.root}`]: {
            display: 'flex',
            gap: 8,
            padding: '2px 8px',
            borderRadius: vars.shape.borderRadius,
            opacity: 0.7,
            '&.Mui-selected': {
              opacity: 1,
              backgroundColor: alpha(theme.palette.action.selected, 0.3),
              [`& .${svgIconClasses.root}`]: {
                color: vars.palette.text.primary,
              },
              '&:focus-visible': {
                backgroundColor: alpha(theme.palette.action.selected, 0.3),
              },
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.selected, 0.5),
              },
            },
            '&:focus-visible': {
              backgroundColor: 'transparent',
            },
          },
        };
      },
    },
  },

  MuiListItemText: {
    styleOverrides: {
      primary: ({ theme }) => {
        return {
          fontSize: theme.typography.body2.fontSize,
          fontWeight: 500,
          lineHeight: theme.typography.body2.lineHeight,
        };
      },
      secondary: ({ theme }) => {
        return {
          fontSize: theme.typography.caption.fontSize,
          lineHeight: theme.typography.caption.lineHeight,
        };
      },
    },
  },

  MuiListSubheader: {
    styleOverrides: {
      root: ({ theme }) => {
        return {
          backgroundColor: 'transparent',
          padding: '4px 8px',
          fontSize: theme.typography.caption.fontSize,
          fontWeight: 500,
          lineHeight: theme.typography.caption.lineHeight,
        };
      },
    },
  },

  MuiListItemIcon: {
    styleOverrides: {
      root: {
        minWidth: 0,
      },
    },
  },
};
