import { useMemo } from 'react';
import type { SxProps, Theme } from '@mui/material';
import { Box, Tooltip, useTheme } from '@mui/material';

import { color, gray } from '@/theme/themeConstants';
import { mergeSx } from '@/theme/themeTypes';

export interface GenericBadgeProps {
  label: string;
  tooltip: React.ReactNode;
  sx?: SxProps<Theme>;
}

const BASE_SX: SxProps<Theme> = {
  display: 'inline-flex',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: '5px',
  width: '2em',
  fontWeight: 'bold',
  userSelect: 'none',

  'table &': {
    paddingTop: '0.15em',
  },
};

export const GenericBadge: React.FC<GenericBadgeProps> = ({
  label,
  tooltip,
  sx,
}) => {
  const lower = label.toLowerCase();
  const theme = useTheme();

  const merged = useMemo((): SxProps<Theme> => {
    return mergeSx([
      BASE_SX,

      {
        [`[data-highlight-badge-value-lower="${lower}"] &`]: {
          outline: `1px solid ${gray[400]}`,
          outlineOffset: '1px',

          '&:hover': {
            outline: '1px solid',
            outlineColor: color('text.primary'),
          },
        },
      },

      theme.applyStyles('dark', {
        textShadow: '1px 1px rgba(0, 0, 0, 0.5)',
      }),

      sx,
    ]);
  }, [lower, theme, sx]);

  return (
    <Tooltip
      title={tooltip}
      placement="right"
      slotProps={{
        tooltip: {
          sx: {
            maxWidth: 425,
          },
        },
      }}
    >
      <Box
        component="span"
        sx={merged}
        onMouseOver={() => {
          document.body.setAttribute('data-highlight-badge-value-lower', lower);
        }}
        onMouseOut={() => {
          document.body.removeAttribute('data-highlight-badge-value-lower');
        }}
      >
        {label}
      </Box>
    </Tooltip>
  );
};
