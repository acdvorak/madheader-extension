import { useCallback, useMemo, useState } from 'react';
import type { SxProps, Theme } from '@mui/material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CodeIcon from '@mui/icons-material/Code';

import { JsonViewer } from './JsonViewer';

export interface JsonButtonProps {
  getDebugJsonObject: () => unknown;
  title?: React.ReactNode;
  sx?: SxProps<Theme>;
}

export const JsonButton: React.FC<JsonButtonProps> = ({
  getDebugJsonObject,
  title,
  sx,
}) => {
  const [open, setOpen] = useState(false);
  const rawJSON = useMemo(() => getDebugJsonObject(), [getDebugJsonObject]);

  const onClose = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <>
      <Tooltip title={title || 'View raw JSON data'}>
        <Button
          variant="outlined"
          sx={sx}
          onClick={() => {
            setOpen(true);
          }}
        >
          <Stack
            direction="row"
            sx={{ gap: 1, placeContent: 'center', placeItems: 'center' }}
          >
            <CodeIcon />
            <span>JSON</span>
          </Stack>
        </Button>
      </Tooltip>

      <Dialog open={open} onClose={onClose}>
        <DialogTitle>
          JSON Viewer
          <IconButton
            aria-label="Close JSON Viewer"
            edge="end"
            onClick={onClose}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <JsonViewer object={rawJSON} height="100%" />
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" color="inherit" onClick={onClose}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
