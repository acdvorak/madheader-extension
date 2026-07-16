import type { Components, Theme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import CheckBoxOutlineBlankRoundedIcon from '@mui/icons-material/CheckBoxOutlineBlankRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';

import { brand, gray } from '../themeConstants';

export const checkboxCustomizations: Components<Theme> = {
  MuiCheckbox: {
    defaultProps: {
      disableRipple: true,
      icon: (
        <CheckBoxOutlineBlankRoundedIcon
          sx={{ color: 'hsla(210, 0%, 0%, 0.0)' }}
        />
      ),
      checkedIcon: <CheckRoundedIcon sx={{ height: 14, width: 14 }} />,
      indeterminateIcon: <RemoveRoundedIcon sx={{ height: 14, width: 14 }} />,
    },
    styleOverrides: {
      root: ({ theme }) => {
        return {
          margin: 10,
          height: 16,
          width: 16,
          borderRadius: 5,
          border: '1px solid ',
          borderColor: alpha(gray[300], 0.8),
          boxShadow: '0 0 0 1.5px hsla(210, 0%, 0%, 0.04) inset',
          backgroundColor: alpha(gray[100], 0.4),
          transition: 'border-color, background-color, 120ms ease-in',
          '&:hover': {
            borderColor: brand[300],
          },
          '&.Mui-focusVisible': {
            outline: `3px solid ${alpha(brand[500], 0.5)}`,
            outlineOffset: '2px',
            borderColor: brand[400],
          },
          '&.Mui-checked': {
            color: 'white',
            backgroundColor: brand[500],
            borderColor: brand[500],
            boxShadow: `none`,
            '&:hover': {
              backgroundColor: brand[600],
            },
          },
          ...theme.applyStyles('dark', {
            borderColor: alpha(gray[700], 0.8),
            boxShadow: '0 0 0 1.5px hsl(210, 0%, 0%) inset',
            backgroundColor: alpha(gray[900], 0.8),
            '&:hover': {
              borderColor: brand[300],
            },
            '&.Mui-focusVisible': {
              borderColor: brand[400],
              outline: `3px solid ${alpha(brand[500], 0.5)}`,
              outlineOffset: '2px',
            },
          }),
        };
      },
    },
  },
};
