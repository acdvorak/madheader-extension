import { useCallback, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Alert,
  alertClasses,
  Avatar,
  Box,
  Button,
  CircularProgress,
  IconButton,
  List,
  ListItemButton,
  listItemButtonClasses,
  ListItemText,
  Paper,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import {
  CheckCircle as CheckCircleIcon,
  CircleOutlined as CircleOutlinedIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
} from '@Mui/icons-material';

import type { Base64Image } from '@/schemas/config-schema';
import { color } from '@/theme/themeConstants';

import {
  loadPopupPresetList,
  type PopupPreset,
  togglePopupPreset,
} from './preset-toggle';

const ALLOWED_TAGS = [
  'abbr',
  'b',
  'br',
  'cite',
  'code',
  'del',
  'dfn',
  'div',
  'em',
  'i',
  'img',
  'ins',
  'kbd',
  'mark',
  'p',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'time',
  'u',
  'var',
  'wbr',
] satisfies Array<keyof HTMLElementTagNameMap>;

interface PopupToast {
  id: number;
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info';
}

interface WebExtensionApi {
  runtime: {
    openOptionsPage(): Promise<void>;
  };
}

function presetInitials(preset: PopupPreset): string {
  if (preset.initials && preset.initials.trim().length > 0) {
    return preset.initials.trim().slice(0, 3).toUpperCase();
  }

  return (
    preset.name
      .toUpperCase()
      .replace(/[^A-Z]+/g, ' ')
      .trim()
      .split(/\s+/g)
      // Starts with a letter
      .filter((word) => /^[A-Z]/.test(word))
      .slice(0, 3)
      .map((word) => word.slice(0, 1))
      .join('')
  );
}

function presetImageDataUrl(
  image: Base64Image | undefined,
): string | undefined {
  return image
    ? `data:${image.mimeType};base64,${image.base64Bytes}`
    : undefined;
}

export function PopupPresetToggleList(): React.ReactElement {
  const theme = useTheme();

  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [updatingPresetId, setUpdatingPresetId] = useState<string | null>(null);
  const [presets, setPresets] = useState<PopupPreset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [toast, setToast] = useState<PopupToast>({
    id: 0,
    open: false,
    message: '',
    severity: 'success',
  });

  const showToast = useCallback(
    (message: string, severity: PopupToast['severity']): void => {
      setToast((previous) => ({
        id: previous.id + 1,
        open: true,
        message,
        severity,
      }));
    },
    [],
  );

  const openOptionsPage = useCallback(async (): Promise<void> => {
    const extensionGlobals = globalThis as typeof globalThis & {
      browser?: WebExtensionApi;
      chrome?: WebExtensionApi;
    };
    const extensionApi = extensionGlobals.browser ?? extensionGlobals.chrome;

    if (!extensionApi) {
      throw new Error('WebExtension API is unavailable');
    }

    await extensionApi.runtime.openOptionsPage();
  }, []);

  useEffect(() => {
    let isDisposed = false;

    void loadPopupPresetList().then((list) => {
      if (isDisposed) {
        return;
      }

      setPresets(list.presets);
      setActivePresetId(list.activePresetId);
      setIsInitialLoading(false);
    });

    return () => {
      isDisposed = true;
    };
  }, []);

  const onToggle = useCallback(
    async (preset: PopupPreset): Promise<void> => {
      if (updatingPresetId !== null) {
        return;
      }

      setUpdatingPresetId(preset.id);

      try {
        const result = await togglePopupPreset(preset.id);
        if (!result.saveResult.ok) {
          const firstError = result.saveResult.errors[0];
          showToast(
            firstError?.message ?? 'Unable to update preset state',
            'error',
          );
          return;
        }

        setActivePresetId(result.activePresetId);
        showToast(
          result.activePresetId
            ? `Activated "${preset.name}"`
            : 'Deactivated active preset',
          'success',
        );
      } finally {
        setUpdatingPresetId(null);
      }
    },
    [showToast, updatingPresetId],
  );

  return (
    <Stack
      sx={{
        p: 1.5,
        gap: 1.25,
        minWidth: 400,
      }}
    >
      <Stack
        direction="row"
        sx={{ alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Typography variant="h6">HTTP header override presets</Typography>

        <Tooltip title="Options">
          <IconButton
            aria-label="Options"
            onClick={() => {
              void openOptionsPage();
            }}
          >
            <SettingsIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      <Paper
        variant="outlined"
        aria-busy={updatingPresetId !== null}
        sx={{ minHeight: 220, maxHeight: 480, overflow: 'auto' }}
      >
        {isInitialLoading ? (
          <Stack
            sx={{ height: 220, alignItems: 'center', justifyContent: 'center' }}
          >
            <CircularProgress size={24} />
          </Stack>
        ) : (
          <List dense disablePadding>
            {presets.map((preset) => {
              const isActive = preset.id === activePresetId;
              const avatarBackground =
                preset.bgcolor ?? theme.palette.background.default;
              const avatarColor =
                theme.palette.getContrastText(avatarBackground);

              return (
                <ListItemButton
                  key={preset.id}
                  selected={isActive}
                  onClick={() => {
                    void onToggle(preset);
                  }}
                  sx={{
                    gap: 2,

                    padding: 1,

                    borderRadius: '5px',
                    border: '3px solid transparent',

                    [`&.${listItemButtonClasses.selected}`]: {
                      borderColor: preset.matchesCurrentPage
                        ? color('success.main')
                        : color('divider'),
                    },
                  }}
                >
                  <Box sx={{ display: 'flex' }}>
                    {isActive ? (
                      <CheckCircleIcon
                        color={
                          preset.matchesCurrentPage ? 'success' : undefined
                        }
                      />
                    ) : (
                      <CircleOutlinedIcon color="disabled" />
                    )}
                  </Box>

                  <Avatar
                    alt={preset.name}
                    src={presetImageDataUrl(preset.image)}
                    sx={{
                      bgcolor: avatarBackground,
                      color: avatarColor,
                      width: 36,
                      height: 36,
                      fontSize: 12,
                    }}
                  >
                    {presetInitials(preset)}
                  </Avatar>

                  <ListItemText
                    primary={
                      <ReactMarkdown
                        allowedElements={ALLOWED_TAGS}
                        unwrapDisallowed
                      >
                        {preset.name}
                      </ReactMarkdown>
                    }
                    secondary={
                      <ReactMarkdown
                        allowedElements={ALLOWED_TAGS}
                        unwrapDisallowed
                      >
                        {preset.notes ||
                          (isActive
                            ? 'Click to deactivate'
                            : 'Click to activate')}
                      </ReactMarkdown>
                    }
                    sx={{
                      margin: 0,
                      '& p': {
                        margin: 0,
                      },
                    }}
                  />
                </ListItemButton>
              );
            })}

            {presets.length === 0 && (
              <Stack sx={{ p: 2, gap: 1, alignItems: 'flex-start' }}>
                <Typography variant="body2" color="text.secondary">
                  No enabled presets available.
                </Typography>

                <Button
                  variant="outlined"
                  onClick={() => {
                    void openOptionsPage();
                  }}
                >
                  Add a preset
                </Button>
              </Stack>
            )}
          </List>
        )}
      </Paper>

      <Snackbar
        key={toast.id}
        open={toast.open}
        autoHideDuration={3500}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        onClose={() => {
          setToast((previous) => ({ ...previous, open: false }));
        }}
        sx={{
          // This has the EFFECT of being `max-width: calc(100% - 4em)`
          width: '100%',
          paddingX: '4em',
          left: 'unset',
          right: 'unset',
          transform: 'unset',
          // Ensure that the user can click on page content
          // behind the invisible margins/padding.
          pointerEvents: 'none',
        }}
      >
        <Box sx={{ pointerEvents: 'auto' }}>
          <Alert
            severity={toast.severity}
            variant="filled"
            action={
              <IconButton
                aria-label="Close notification"
                color="inherit"
                size="small"
                onClick={() => {
                  setToast((previous) => ({ ...previous, open: false }));
                }}
                sx={{ p: 0.25 }}
              >
                <CloseIcon />
              </IconButton>
            }
            sx={{
              px: 1,
              py: 0.25,
              fontSize: '0.75rem',
              [`& .${alertClasses.message}`]: {
                py: 0.25,
                display: 'flex',
                placeItems: 'center',
              },
              [`& .${alertClasses.action}`]: {
                py: 0,
                pr: 0.25,
                pl: 0.75,
                mr: 0,
                display: 'flex',
                placeItems: 'center',
              },
            }}
          >
            {toast.message || 'Foo bar baz'}
          </Alert>
        </Box>
      </Snackbar>
    </Stack>
  );
}
