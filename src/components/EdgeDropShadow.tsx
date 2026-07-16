import { Box } from '@mui/material';

export interface EdgeDropShadowProps {
  /**
   * Outer edge of the `<EdgeDropShadow>`'s ***parent element*** that the
   * drop shadow will ***radiate away from***.
   *
   * For example, the following HTML structure:
   *
   * ```html
   * <Box position="relative">
   *   <EdgeDropShadow outerEdge="top" />
   * </Box>
   * ```
   *
   * Will produce a drop shadow that emanates ***away from the top edge***
   * of the parent `<Box>` container element:
   *
   * ```
   * ┍┷┷┷┷┷┷┷┷┷┷┷┷┷┷┷┷┷┷┷┷┑ <---- <EdgeDropShadow outerEdge="top" />
   * │                    │
   * │   Parent Element   │
   * │         of         │
   * │  <EdgeDropShadow>  │
   * │                    │
   * └────────────────────┘
   * ```
   */
  outerEdge: 'top' | 'right' | 'bottom' | 'left';

  opacity: 0 | 1;
}

const TopEdgeDropShadow: React.FC<{ opacity: 0 | 1 }> = ({ opacity }) => {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: '-10px',
        right: '0',
        bottom: '100%',
        left: '0',
        overflow: 'hidden',

        pointerEvents: 'none',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          top: '10px',
          width: '100%',
          height: '100%',
          opacity,
          transition: 'all 0.1s ease-in-out',

          boxShadow:
            '0 0 4px 0 color-mix(in srgb, currentColor 50%, transparent)',
        }}
      />
    </Box>
  );
};

const BottomEdgeDropShadow: React.FC<{ opacity: 0 | 1 }> = ({ opacity }) => {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: '100%',
        right: '0',
        bottom: '-10px',
        left: '0',
        overflow: 'hidden',

        pointerEvents: 'none',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          top: '-10px',
          width: '100%',
          height: '100%',
          opacity,
          transition: 'all 0.1s ease-in-out',

          boxShadow:
            '0 0 4px 0 color-mix(in srgb, currentColor 50%, transparent)',
        }}
      />
    </Box>
  );
};

const LeftEdgeDropShadow: React.FC<{ opacity: 0 | 1 }> = ({ opacity }) => {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: '0',
        right: '100%',
        bottom: '0',
        left: '-10px',
        overflow: 'hidden',

        pointerEvents: 'none',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          left: '10px',
          width: '100%',
          height: '100%',
          opacity,
          transition: 'all 0.1s ease-in-out',

          boxShadow:
            '0 0 4px 0 color-mix(in srgb, currentColor 50%, transparent)',
        }}
      />
    </Box>
  );
};

const RightEdgeDropShadow: React.FC<{ opacity: 0 | 1 }> = ({ opacity }) => {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: '0',
        right: '-10px',
        bottom: '0',
        left: '100%',
        overflow: 'hidden',

        pointerEvents: 'none',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          left: '-10px',
          width: '100%',
          height: '100%',
          opacity,
          transition: 'all 0.1s ease-in-out',

          boxShadow:
            '0 0 4px 0 color-mix(in srgb, currentColor 50%, transparent)',
        }}
      />
    </Box>
  );
};

export const EdgeDropShadow: React.FC<EdgeDropShadowProps> = ({
  outerEdge,
  opacity,
}) => {
  switch (outerEdge) {
    case 'top':
      return <TopEdgeDropShadow opacity={opacity} />;
    case 'bottom':
      return <BottomEdgeDropShadow opacity={opacity} />;
    case 'left':
      return <LeftEdgeDropShadow opacity={opacity} />;
    case 'right':
      return <RightEdgeDropShadow opacity={opacity} />;
    default:
      throw new Error(`Unsupported "outerEdge" value: "${String(outerEdge)}"`);
  }
};
