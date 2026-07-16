import { useMemo } from 'react';
import type { BoxProps, SxProps, Theme } from '@mui/material';
import { Box } from '@mui/material';

import { color } from '@/theme/themeConstants';
import { mergeSx } from '@/theme/themeTypes';

export interface InlineCodeProps extends Pick<BoxProps, 'onMouseOver'> {
  children: React.ReactNode;
  title?: string;
  inactive?: boolean;
  sx?: SxProps<Theme>;
}

export const C: React.FC<InlineCodeProps> = ({
  children,
  title,
  inactive,
  sx,
  ...props
}) => {
  const merged = useMemo((): SxProps<Theme> => {
    return mergeSx([
      inactive && {
        color: color('text.disabled'),

        // Simulate `text-decoration: line-through` with better
        // horizontal positioning.
        //
        // To lower the line: Increase the percentage values.
        //
        // To raise the line: Decrease the percentage values
        // (e.g., change 45% and 55% to 40% and 50%).
        backgroundImage:
          'linear-gradient(transparent 55%, currentColor 55%, currentColor 65%, transparent 65%)',
        backgroundSize: '100% 1em',
        backgroundRepeat: 'no-repeat',
      },

      sx,
    ]);
  }, [inactive, sx]);

  return (
    <Box
      component="code"
      title={title || (inactive ? 'Inactive' : undefined)}
      sx={merged}
      {...props}
    >
      {children}
    </Box>
  );
};
