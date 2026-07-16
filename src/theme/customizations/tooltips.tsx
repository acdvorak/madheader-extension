import { tooltipClasses } from '@mui/material';
import { alpha, type Components, type Theme } from '@mui/material/styles';

import { gray } from '../themeConstants';

export const tooltipCustomizations: Components<Theme> = {
  MuiTooltip: {
    defaultProps: {
      enterDelay: 500,
      arrow: true,
    },

    styleOverrides: {
      tooltip: ({ theme }) => {
        return {
          [`.${tooltipClasses.arrow}`]: {
            fontSize: '18px',
          },

          ...theme.applyStyles('light', {
            color: 'black',
            backgroundColor: alpha(gray[200], 0.98),
            boxShadow: `0 0 10px ${gray[400]}`,

            [`&, & .${tooltipClasses.arrow}::before`]: {
              border: '1px solid',
              borderColor: gray[300],
            },
          }),

          ...theme.applyStyles('dark', {
            color: 'white',
            backgroundColor: alpha(gray[700], 0.98),
            boxShadow: `0 0 10px ${gray[600]}`,

            [`&, & .${tooltipClasses.arrow}::before`]: {
              border: '1px solid',
              borderColor: gray[600],
            },
          }),
        };
      },
    },
  },
};
