import React from 'react';
import { buttonBaseClasses } from '@mui/material/ButtonBase';
import { dividerClasses } from '@mui/material/Divider';
import { menuItemClasses } from '@mui/material/MenuItem';
import type { Components, Theme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded';

import { gray } from '../themeConstants';

export const selectCustomizations: Components<Theme> = {
  MuiSelect: {
    defaultProps: {
      size: 'small',
      IconComponent: ({
        ref,
        ...props
      }: SvgIconProps & { ref?: React.RefObject<SVGSVGElement | null> }) => (
        <UnfoldMoreRoundedIcon fontSize="small" {...props} ref={ref} />
      ),
    },
  },

  MuiMenu: {
    styleOverrides: {
      list: {
        gap: '0px',
        [`&.${dividerClasses.root}`]: {
          margin: '0 -8px',
        },
      },

      paper: ({ theme }) => {
        const vars = theme.vars || theme;
        return {
          marginTop: '4px',
          borderRadius: vars.shape.borderRadius,
          border: `1px solid ${vars.palette.divider}`,
          backgroundImage: 'none',
          background: 'hsl(0, 0%, 100%)',
          boxShadow:
            'hsla(220, 30%, 5%, 0.07) 0px 4px 16px 0px, hsla(220, 25%, 10%, 0.07) 0px 8px 16px -5px',
          [`& .${buttonBaseClasses.root}`]: {
            '&.Mui-selected': {
              backgroundColor: alpha(theme.palette.action.selected, 0.3),
            },
          },
          ...theme.applyStyles('dark', {
            background: gray[900],
            boxShadow:
              'hsla(220, 30%, 5%, 0.7) 0px 4px 16px 0px, hsla(220, 25%, 10%, 0.8) 0px 8px 16px -5px',
          }),
        };
      },
    },
  },

  MuiMenuItem: {
    styleOverrides: {
      root: ({ theme }) => {
        const vars = theme.vars || theme;
        return {
          borderRadius: vars.shape.borderRadius,
          padding: '6px 8px',
          [`&.${menuItemClasses.focusVisible}`]: {
            backgroundColor: 'transparent',
          },
          [`&.${menuItemClasses.selected}`]: {
            [`&.${menuItemClasses.focusVisible}`]: {
              backgroundColor: alpha(theme.palette.action.selected, 0.3),
            },
          },
        };
      },
    },
  },
};
