import {
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { AlertColor } from '@mui/material';
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Switch,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  useColorScheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import type * as MonacoReactNs from '@monaco-editor/react';
import { DiffEditor, Editor } from '@monaco-editor/react';
import diff from 'fast-diff';
import type MonacoEditorNs from 'monaco-editor';
import { useDebounce } from 'use-debounce';

import { useEventHandlers } from '@/hooks/useEventHandlers';
import type { UseSaveShortcutProps } from '@/hooks/useSaveShortcut';
import { useSaveShortcut } from '@/hooks/useSaveShortcut';
import { configureMonacoLoader } from '@/monaco/configureMonacoLoader';
import prettierConfig from '@/prettier-config.mts';
import type { ImageId } from '@/schemas/config-schema';
import type {
  ActionableError,
  ConfigPipelineFailure,
} from '@/services/config/config-persistence';
import {
  loadEditorConfigJsonc,
  parseAndNormalizeConfigJsonc,
  saveConfigFromEditorJsonc,
} from '@/services/config/config-persistence';
import { subscribeToStoredConfigChanges } from '@/services/storage/config-storage';
import {
  loadStoredImages,
  subscribeToStoredImageChanges,
} from '@/services/storage/image-storage';

import { replaceActivePresetJsonc } from './active-preset-jsonc';
import { ImagesTab } from './ImagesTab';
import {
  collectCustomRequestHeaderNames,
  configureMonacoConfigSchema,
  OPTIONS_CONFIG_MODEL_URI,
  registerGlobExpressionHoverProvider,
  updateMonacoZodValidationMarkers,
} from './monaco-config-schema';

import madHeaderIconUrl from '@/icons/madheader-icon-v1.svg';

type Monaco = typeof MonacoEditorNs;
type CodeEditor = MonacoEditorNs.editor.IStandaloneCodeEditor;
type DiffCodeEditor = MonacoEditorNs.editor.IStandaloneDiffEditor;
type MonacoFormattingOptions =
  MonacoEditorNs.editor.IStandaloneEditorConstructionOptions;

configureMonacoLoader();

interface ToastState {
  id: number;
  open: boolean;
  message: string;
  severity: AlertColor;
}

type OptionsTab = 'presets' | 'images';

function isMonaco(value: unknown): value is Monaco {
  return !!value && typeof value === 'object' && 'languages' in value;
}

function toMonacoFormattingOptions(
  prettierOptions: typeof prettierConfig,
): MonacoFormattingOptions {
  return {
    detectIndentation: false,
    insertSpaces: !(prettierOptions.useTabs ?? false),
    tabSize: prettierOptions.tabWidth ?? 2,
    wordWrap: 'off',
    wordWrapColumn: prettierOptions.printWidth ?? 80,
  };
}

function formatActionableError(error: ActionableError): string {
  const locationParts: string[] = [];

  if (error.path) {
    locationParts.push(`path: ${error.path}`);
  }

  if (error.line !== undefined && error.column !== undefined) {
    locationParts.push(`line ${error.line}, col ${error.column}`);
  }

  const location =
    locationParts.length > 0 ? ` (${locationParts.join('; ')})` : '';
  return `${error.message}${location}`;
}

function formatPipelineFailure(failure: ConfigPipelineFailure): string {
  const first = failure.errors[0];
  if (!first) {
    return `Save failed (${failure.code})`;
  }

  return `Save failed: ${formatActionableError(first)}`;
}

function replaceEditorModelText(editor: CodeEditor | null, text: string): void {
  if (!editor) {
    return;
  }

  const model = editor.getModel();
  if (!model) {
    return;
  }

  const edits: MonacoEditorNs.editor.IIdentifiedSingleEditOperation[] = [];
  let oldOffset = 0;
  let editStartOffset: number | undefined;
  let deleteLength = 0;
  let replacementText = '';

  const pushPendingEdit = (): void => {
    if (editStartOffset === undefined) {
      return;
    }

    const startPosition = model.getPositionAt(editStartOffset);
    const endPosition = model.getPositionAt(editStartOffset + deleteLength);
    edits.push({
      range: {
        startLineNumber: startPosition.lineNumber,
        startColumn: startPosition.column,
        endLineNumber: endPosition.lineNumber,
        endColumn: endPosition.column,
      },
      text: replacementText,
      forceMoveMarkers: true,
    });

    editStartOffset = undefined;
    deleteLength = 0;
    replacementText = '';
  };

  for (const [operation, changedText] of diff(model.getValue(), text)) {
    if (operation === diff.EQUAL) {
      pushPendingEdit();
      oldOffset += changedText.length;
      continue;
    }

    editStartOffset ??= oldOffset;

    if (operation === diff.DELETE) {
      oldOffset += changedText.length;
      deleteLength += changedText.length;
    } else {
      replacementText += changedText;
    }
  }

  pushPendingEdit();
  if (edits.length === 0) {
    return;
  }

  editor.pushUndoStop();
  editor.executeEdits('madheader-options-editor-sync', edits);
  editor.pushUndoStop();
}

export function OptionsConfigPage(): React.ReactElement {
  const { mode, systemMode } = useColorScheme();
  const activeMode = mode === 'system' ? systemMode : mode;
  const vsTheme = (
    activeMode === 'dark' ? 'vs-dark' : 'light'
  ) satisfies MonacoReactNs.Theme;

  const monacoRef = useRef<Monaco | null>(null);
  const standaloneEditorRef = useRef<CodeEditor | null>(null);
  const diffEditorRef = useRef<DiffCodeEditor | null>(null);
  const diffModelChangeSubscriptionRef =
    useRef<MonacoEditorNs.IDisposable | null>(null);
  const globExpressionHoverProviderRef =
    useRef<MonacoEditorNs.IDisposable | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<OptionsTab>('presets');
  const [editorText, setEditorText] = useState<string>('');
  const [lastSavedText, setLastSavedText] = useState<string>('');
  const [savedImageIds, setSavedImageIds] = useState<ImageId[]>([]);
  const [showDiff, setShowDiff] = useState<boolean>(false);
  const [isToastFocused, setIsToastFocused] = useState<boolean>(false);
  const [isToastHovered, setIsToastHovered] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastState>({
    id: 0,
    open: false,
    message: '',
    severity: 'success',
  });
  const [debouncedEditorText] = useDebounce(editorText, 250);

  const isDirty = useMemo<boolean>(() => {
    return editorText !== lastSavedText;
  }, [editorText, lastSavedText]);

  useEventHandlers({
    beforeunload(event): void {
      if (!isDirty) {
        return;
      }
      // This has the effect of prompting the user to confirm whether they
      // want to "Leave" and discard unsaved changes, or "Cancel" and stay on
      // the page.
      event.preventDefault();
    },
  });

  const editorOptions = useMemo<
    MonacoEditorNs.editor.IStandaloneEditorConstructionOptions &
      MonacoEditorNs.editor.IDiffEditorConstructionOptions
  >(() => {
    return {
      ...toMonacoFormattingOptions(prettierConfig),
      renderSideBySide: true,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      automaticLayout: true,
    };
  }, []);

  const pushToast = useCallback(
    (message: string, severity: AlertColor): void => {
      setToast((previous) => ({
        id: previous.id + 1,
        open: true,
        message,
        severity,
      }));
    },
    [],
  );

  useEffect(() => {
    let isDisposed = false;

    void loadEditorConfigJsonc().then((result) => {
      if (isDisposed) {
        return;
      }

      setEditorText(result.jsonc);
      setLastSavedText(result.jsonc);

      if (result.warning) {
        pushToast(result.warning, 'warning');
      }

      setLoading(false);
    });

    return () => {
      isDisposed = true;
    };
  }, [pushToast]);

  useEffect(() => {
    let isDisposed = false;
    let imagesChangedAfterLoadStarted = false;
    const unsubscribe = subscribeToStoredImageChanges((images) => {
      imagesChangedAfterLoadStarted = true;
      setSavedImageIds(images.map(({ id }) => id));
    });

    void loadStoredImages().then(({ images }) => {
      if (!isDisposed && !imagesChangedAfterLoadStarted) {
        setSavedImageIds(images.map(({ id }) => id));
      }
    });

    return () => {
      isDisposed = true;
      unsubscribe();
    };
  }, []);

  const onEditorWillMount = useCallback<MonacoReactNs.BeforeMount>(
    (monaco) => {
      if (!isMonaco(monaco)) {
        return;
      }

      monacoRef.current = monaco;
      configureMonacoConfigSchema(monaco, [], savedImageIds);
      globExpressionHoverProviderRef.current ??=
        registerGlobExpressionHoverProvider(monaco);
    },
    [savedImageIds],
  );

  const updateZodValidationMarkers = useCallback((editor: CodeEditor): void => {
    const monaco = monacoRef.current;
    const model = editor.getModel();
    if (monaco && model) {
      updateMonacoZodValidationMarkers(monaco, model);
    }
  }, []);

  const onEditorMount = useCallback<MonacoReactNs.OnMount>(
    (editor) => {
      standaloneEditorRef.current = editor;
      updateZodValidationMarkers(editor);
    },
    [updateZodValidationMarkers],
  );

  const onDiffEditorMount = useCallback<NonNullable<MonacoReactNs.DiffOnMount>>(
    (editor) => {
      diffModelChangeSubscriptionRef.current?.dispose();
      diffEditorRef.current = editor;

      const modifiedEditor = editor.getModifiedEditor();
      updateZodValidationMarkers(modifiedEditor);
      const model = modifiedEditor.getModel();
      if (!model) {
        return;
      }

      diffModelChangeSubscriptionRef.current = model.onDidChangeContent(() => {
        setEditorText(model.getValue());
      });
    },
    [updateZodValidationMarkers],
  );

  useEffect(() => {
    const monaco = monacoRef.current;
    if (monaco) {
      configureMonacoConfigSchema(
        monaco,
        collectCustomRequestHeaderNames(debouncedEditorText),
        savedImageIds,
      );
    }

    const editor = showDiff
      ? diffEditorRef.current?.getModifiedEditor()
      : standaloneEditorRef.current;

    if (editor?.getValue() === debouncedEditorText) {
      updateZodValidationMarkers(editor);
    }
  }, [
    debouncedEditorText,
    savedImageIds,
    showDiff,
    updateZodValidationMarkers,
  ]);

  useEffect(() => {
    return () => {
      diffModelChangeSubscriptionRef.current?.dispose();
    };
  }, []);

  const syncLiveEditorText = useCallback((nextText: string): void => {
    const diffEditor = diffEditorRef.current;
    if (diffEditor) {
      replaceEditorModelText(diffEditor.getModifiedEditor(), nextText);
    }

    replaceEditorModelText(standaloneEditorRef.current, nextText);
  }, []);

  const onStoredConfigChange = useEffectEvent((storedJsonc: string): void => {
    const storedConfigResult = parseAndNormalizeConfigJsonc(storedJsonc);
    if (!storedConfigResult.ok) {
      return;
    }

    const { activePreset } = storedConfigResult.config;
    setLastSavedText((currentText) => {
      return replaceActivePresetJsonc(currentText, activePreset) ?? currentText;
    });

    const nextEditorText = replaceActivePresetJsonc(editorText, activePreset);
    if (nextEditorText === null || nextEditorText === editorText) {
      return;
    }

    setEditorText(nextEditorText);
    syncLiveEditorText(nextEditorText);
  });

  useEffect(() => {
    return subscribeToStoredConfigChanges((jsonc) => {
      onStoredConfigChange(jsonc);
    });
  }, []);

  const onDiscard = useCallback((): void => {
    setEditorText(lastSavedText);
    syncLiveEditorText(lastSavedText);
    pushToast('Discarded unsaved changes.', 'info');
  }, [lastSavedText, pushToast, syncLiveEditorText]);

  const onSave = useCallback(async (): Promise<void> => {
    setLoading(true);

    const result = await saveConfigFromEditorJsonc(editorText);
    if (!result.ok) {
      setLoading(false);
      pushToast(formatPipelineFailure(result), 'error');
      return;
    }

    setEditorText(result.normalizedJsonc);
    setLastSavedText(result.normalizedJsonc);
    syncLiveEditorText(result.normalizedJsonc);
    pushToast(`Saved to ${result.persistedTo} storage.`, 'success');

    setLoading(false);
  }, [editorText, pushToast, syncLiveEditorText]);

  const useSaveShortcutArgs = useMemo((): UseSaveShortcutProps => {
    return {
      disabled: activeTab !== 'presets',
      onSave: (_evt) => {
        void onSave();
      },
    };
  }, [activeTab, onSave]);

  const { saveButtonTooltipTitle } = useSaveShortcut(useSaveShortcutArgs);

  return (
    <Stack sx={{ height: '100vh', p: 2, gap: 1.5 }}>
      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between', alignItems: 'center' }}
      >
        <Stack direction="row" sx={{ placeItems: 'center', gap: 1 }}>
          <Box sx={{ display: 'flex' }}>
            <img src={madHeaderIconUrl} alt="Icon" width={32} height={32} />
          </Box>
          <Typography variant="h5">MadHeader Options</Typography>
        </Stack>

        <FormControlLabel
          control={
            <Switch
              checked={showDiff}
              size="small"
              onChange={(event) => {
                setShowDiff(event.target.checked);
              }}
            />
          }
          label="Diff view"
          sx={{ visibility: activeTab === 'presets' ? undefined : 'hidden' }}
        />
      </Stack>

      <Tabs
        value={activeTab}
        aria-label="Options sections"
        onChange={(_event, value: OptionsTab) => {
          setActiveTab(value);
        }}
      >
        <Tab
          value="presets"
          label="Presets"
          id="options-tab-presets"
          aria-controls="options-panel-presets"
        />
        <Tab
          value="images"
          label="Avatars"
          id="options-tab-images"
          aria-controls="options-panel-images"
        />
      </Tabs>

      <Box
        role="tabpanel"
        id="options-panel-presets"
        aria-labelledby="options-tab-presets"
        hidden={activeTab !== 'presets'}
        sx={{
          display: activeTab === 'presets' ? 'flex' : 'none',
          flex: 1,
          minHeight: 0,
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        <Paper
          variant="outlined"
          sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}
        >
          {showDiff ? (
            <DiffEditor
              language="json"
              original={lastSavedText}
              modified={editorText}
              originalModelPath={`${OPTIONS_CONFIG_MODEL_URI}?kind=original`}
              modifiedModelPath={OPTIONS_CONFIG_MODEL_URI}
              keepCurrentModifiedModel
              options={editorOptions}
              beforeMount={onEditorWillMount}
              onMount={onDiffEditorMount}
              theme={vsTheme}
            />
          ) : (
            <Editor
              path={OPTIONS_CONFIG_MODEL_URI}
              language="json"
              value={editorText}
              keepCurrentModel
              options={editorOptions}
              beforeMount={onEditorWillMount}
              onMount={onEditorMount}
              onChange={(value) => {
                setEditorText(value ?? '');
              }}
              theme={vsTheme}
            />
          )}
        </Paper>

        <Stack
          direction="row"
          sx={{ justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Typography
            variant="body2"
            color={isDirty ? 'warning.main' : 'text.secondary'}
          >
            {isDirty ? 'Unsaved changes' : 'All changes saved'}
          </Typography>

          <Stack direction="row" sx={{ gap: 1 }}>
            <Button
              variant="outlined"
              disabled={!isDirty || loading}
              onClick={onDiscard}
            >
              Discard
            </Button>

            <Tooltip title={saveButtonTooltipTitle}>
              <Button
                variant="contained"
                disabled={loading}
                onClick={() => {
                  void onSave();
                }}
              >
                Save
              </Button>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>

      <Box
        role="tabpanel"
        id="options-panel-images"
        aria-labelledby="options-tab-images"
        hidden={activeTab !== 'images'}
        sx={{
          display: activeTab === 'images' ? 'flex' : 'none',
          flex: 1,
          minHeight: 0,
        }}
      >
        <ImagesTab onNotify={pushToast} />
      </Box>

      <Snackbar
        key={toast.id}
        open={toast.open}
        autoHideDuration={isToastFocused || isToastHovered ? null : 5000}
        onClose={() => {
          setToast((previous) => ({ ...previous, open: false }));
        }}
        onFocus={() => {
          setIsToastFocused(true);
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsToastFocused(false);
          }
        }}
        onMouseEnter={() => {
          setIsToastHovered(true);
        }}
        onMouseLeave={() => {
          setIsToastHovered(false);
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Box>
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
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            }
          >
            {toast.message}
          </Alert>
        </Box>
      </Snackbar>
    </Stack>
  );
}
