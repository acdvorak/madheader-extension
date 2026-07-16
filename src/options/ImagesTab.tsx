import { useCallback, useEffect, useRef, useState } from 'react';
import type { AlertColor } from '@mui/material';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import UploadFileIcon from '@mui/icons-material/UploadFile';

import { useSaveShortcut } from '@/hooks/useSaveShortcut';
import type { Base64Image } from '@/schemas/config-schema';
import { ImageMimeType } from '@/schemas/config-schema';
import {
  loadStoredImages,
  saveStoredImages,
} from '@/services/storage/image-storage';

import { filesToBase64Images, moveArrayItem } from './image-utils';

const IMAGE_ROW_DRAG_TYPE = 'application/x-madheader-image-row';

interface ImageRow {
  rowId: number;
  image: Base64Image;
  draftId: string;
}

export interface ImagesTabProps {
  onNotify: (message: string, severity: AlertColor) => void;
}

function imageDataUrl(image: Base64Image): string {
  return `data:${image.mimeType};base64,${image.base64Bytes}`;
}

function isImageRowDrag(event: React.DragEvent): boolean {
  return event.dataTransfer.types.includes(IMAGE_ROW_DRAG_TYPE);
}

function imageIdError(row: ImageRow, rows: ImageRow[]): string | undefined {
  const id = row.draftId.trim();
  if (!id) {
    return 'Image ID is required.';
  }

  if (
    rows.some(
      (otherRow) => otherRow.rowId !== row.rowId && otherRow.image.id === id,
    )
  ) {
    return `Image ID "${id}" is already in use.`;
  }

  return undefined;
}

export function ImagesTab({ onNotify }: ImagesTabProps): React.ReactElement {
  const nextRowIdRef = useRef(0);
  const rowsRef = useRef<ImageRow[]>([]);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const dragDepthRef = useRef(0);
  const isProcessingRef = useRef(false);

  const [rows, setRows] = useState<ImageRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ImageRow | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [draggingRowId, setDraggingRowId] = useState<number | null>(null);
  const [dragOverRowId, setDragOverRowId] = useState<number | null>(null);

  // Dummy event handler to prevent users from accidentally triggering the
  // browser's native "Save Page As" dialog.
  useSaveShortcut({ onSave: () => null });

  const createRows = useCallback((images: Base64Image[]): ImageRow[] => {
    return images.map((image) => ({
      rowId: nextRowIdRef.current++,
      image,
      draftId: image.id,
    }));
  }, []);

  const enqueueSave = useCallback(
    (nextRows: ImageRow[]): void => {
      const images = nextRows.map(({ image }) => image);
      saveQueueRef.current = saveQueueRef.current
        .catch(() => undefined)
        .then(async () => {
          await saveStoredImages(images);
        })
        .catch((error: unknown) => {
          onNotify(
            error instanceof Error
              ? `Unable to save images: ${error.message}`
              : 'Unable to save images.',
            'error',
          );
        });
    },
    [onNotify],
  );

  const commitRows = useCallback(
    (nextRows: ImageRow[]): void => {
      rowsRef.current = nextRows;
      setRows(nextRows);
      enqueueSave(nextRows);
    },
    [enqueueSave],
  );

  useEffect(() => {
    let isDisposed = false;

    void loadStoredImages().then((result) => {
      if (isDisposed) {
        return;
      }

      const loadedRows = createRows(result.images);
      rowsRef.current = loadedRows;
      setRows(loadedRows);
      setIsLoading(false);
      if (result.warning) {
        onNotify(result.warning, 'warning');
      }
    });

    return () => {
      isDisposed = true;
    };
  }, [createRows, onNotify]);

  const addFiles = useCallback(
    async (files: readonly File[]): Promise<void> => {
      if (isProcessingRef.current) {
        return;
      }

      const acceptedFiles = files.filter(
        (file) => ImageMimeType.safeParse(file.type).success,
      );
      const rejectedCount = files.length - acceptedFiles.length;
      if (rejectedCount > 0) {
        onNotify(
          `${rejectedCount} unsupported image ${rejectedCount === 1 ? 'file was' : 'files were'} ignored.`,
          'warning',
        );
      }

      if (acceptedFiles.length === 0) {
        return;
      }

      isProcessingRef.current = true;
      setIsProcessing(true);
      try {
        const images = await filesToBase64Images(
          acceptedFiles,
          rowsRef.current.map(({ image }) => image.id),
        );
        commitRows([...rowsRef.current, ...createRows(images)]);
      } catch (error: unknown) {
        onNotify(
          error instanceof Error
            ? `Unable to add images: ${error.message}`
            : 'Unable to add images.',
          'error',
        );
      } finally {
        isProcessingRef.current = false;
        setIsProcessing(false);
      }
    },
    [commitRows, createRows, onNotify],
  );

  const updateDraftId = useCallback(
    (rowId: number, draftId: string): void => {
      let nextRows = rowsRef.current.map((row) =>
        row.rowId === rowId ? { ...row, draftId } : row,
      );
      rowsRef.current = nextRows;
      setRows(nextRows);

      const editedRow = nextRows.find((row) => row.rowId === rowId);
      if (!editedRow || imageIdError(editedRow, nextRows)) {
        return;
      }

      const id = editedRow.draftId.trim();
      if (id === editedRow.image.id) {
        return;
      }

      nextRows = nextRows.map((row) =>
        row.rowId === rowId ? { ...row, image: { ...row.image, id } } : row,
      );
      commitRows(nextRows);
    },
    [commitRows],
  );

  const closeDeleteDialog = useCallback((): void => {
    setIsDeleteDialogOpen(false);
  }, []);

  const confirmDelete = useCallback((): void => {
    if (deleteTarget === null) {
      return;
    }

    commitRows(
      rowsRef.current.filter((row) => row.rowId !== deleteTarget.rowId),
    );
    closeDeleteDialog();
  }, [closeDeleteDialog, commitRows, deleteTarget]);

  const moveRow = useCallback(
    (rowId: number, targetRowId: number): void => {
      const fromIndex = rowsRef.current.findIndex((row) => row.rowId === rowId);
      const toIndex = rowsRef.current.findIndex(
        (row) => row.rowId === targetRowId,
      );
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
        return;
      }

      commitRows(moveArrayItem<ImageRow>(rowsRef.current, fromIndex, toIndex));
    },
    [commitRows],
  );

  const finishRowDrag = useCallback((): void => {
    setDraggingRowId(null);
    setDragOverRowId(null);
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent): void => {
      event.preventDefault();
      if (isImageRowDrag(event)) {
        finishRowDrag();
        return;
      }

      dragDepthRef.current = 0;
      setIsDragActive(false);
      void addFiles(Array.from(event.dataTransfer.files));
    },
    [addFiles, finishRowDrag],
  );

  return (
    <Paper
      variant="outlined"
      onDragEnter={(event) => {
        if (isImageRowDrag(event)) {
          return;
        }

        event.preventDefault();
        dragDepthRef.current += 1;
        setIsDragActive(true);
      }}
      onDragLeave={(event) => {
        if (isImageRowDrag(event)) {
          return;
        }

        event.preventDefault();
        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
        if (dragDepthRef.current === 0) {
          setIsDragActive(false);
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (isImageRowDrag(event)) {
          event.dataTransfer.dropEffect = 'move';
          return;
        }

        event.dataTransfer.dropEffect = 'copy';
      }}
      onDrop={onDrop}
      sx={{
        display: 'flex',
        flex: 1,
        minHeight: 0,
        flexDirection: 'column',
        overflow: 'hidden',
        borderColor: isDragActive ? 'primary.main' : undefined,
        borderWidth: isDragActive ? 2 : 1,
      }}
    >
      <Stack
        direction="row"
        sx={{
          minHeight: 56,
          px: 2,
          gap: 2,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {isDragActive
            ? 'Drop images'
            : `${rows.length} ${rows.length === 1 ? 'image' : 'images'}`}
        </Typography>

        <Button
          component="label"
          variant="contained"
          startIcon={<UploadFileIcon />}
          disabled={isLoading || isProcessing}
        >
          Upload images
          <Box
            component="input"
            type="file"
            accept="image/svg+xml,image/png,image/jpeg,image/webp"
            multiple
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              void addFiles(Array.from(event.currentTarget.files ?? []));
              event.currentTarget.value = '';
            }}
            sx={{
              position: 'absolute',
              width: 1,
              height: 1,
              p: 0,
              m: -1,
              overflow: 'hidden',
              clip: 'rect(0 0 0 0)',
              whiteSpace: 'nowrap',
              border: 0,
            }}
          />
        </Button>
      </Stack>

      <Divider />

      {isLoading ? (
        <Stack sx={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={28} />
        </Stack>
      ) : rows.length === 0 ? (
        <Stack sx={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="text.secondary">No images uploaded</Typography>
        </Stack>
      ) : (
        <List disablePadding sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          {rows.map((row, index) => {
            const error = imageIdError(row, rows);
            return (
              <Box key={row.rowId}>
                {index > 0 && <Divider component="li" />}
                <ListItem
                  onDragOver={(event) => {
                    if (!isImageRowDrag(event)) {
                      return;
                    }

                    event.preventDefault();
                    event.stopPropagation();
                    event.dataTransfer.dropEffect = 'move';
                    setDragOverRowId(
                      draggingRowId === row.rowId ? null : row.rowId,
                    );
                  }}
                  onDrop={(event) => {
                    if (!isImageRowDrag(event)) {
                      return;
                    }

                    event.preventDefault();
                    event.stopPropagation();
                    const rowId = Number(
                      event.dataTransfer.getData(IMAGE_ROW_DRAG_TYPE),
                    );
                    if (Number.isSafeInteger(rowId)) {
                      moveRow(rowId, row.rowId);
                    }
                    finishRowDrag();
                  }}
                  sx={{
                    minHeight: 88,
                    gap: 2,
                    pr: 8,
                    bgcolor:
                      dragOverRowId === row.rowId ? 'action.hover' : undefined,
                    opacity: draggingRowId === row.rowId ? 0.6 : 1,
                  }}
                  secondaryAction={
                    <Tooltip title="Delete image">
                      <IconButton
                        aria-label={`Delete ${row.image.id}`}
                        onClick={() => {
                          setDeleteTarget(row);
                          setIsDeleteDialogOpen(true);
                        }}
                        sx={{
                          padding: 1,
                          marginTop: -2.75,
                        }}
                      >
                        <DeleteOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <Tooltip title="Drag to reorder">
                    <IconButton
                      aria-label={`Reorder ${row.image.id}`}
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = 'move';
                        event.dataTransfer.setData(
                          IMAGE_ROW_DRAG_TYPE,
                          String(row.rowId),
                        );
                        setDraggingRowId(row.rowId);
                      }}
                      onDragEnd={finishRowDrag}
                      onKeyDown={(event) => {
                        if (
                          event.key !== 'ArrowUp' &&
                          event.key !== 'ArrowDown'
                        ) {
                          return;
                        }

                        const rowIndex = rowsRef.current.findIndex(
                          (candidate) => candidate.rowId === row.rowId,
                        );
                        const targetIndex =
                          rowIndex + (event.key === 'ArrowUp' ? -1 : 1);
                        const targetRow = rowsRef.current[targetIndex];
                        if (targetRow) {
                          event.preventDefault();
                          moveRow(row.rowId, targetRow.rowId);
                        }
                      }}
                      sx={{
                        flex: '0 0 auto',
                        cursor: 'grab',
                        '&:active': { cursor: 'grabbing' },
                      }}
                    >
                      <DragIndicatorIcon />
                    </IconButton>
                  </Tooltip>
                  <Box
                    component="img"
                    src={imageDataUrl(row.image)}
                    alt=""
                    draggable={false}
                    sx={{
                      width: 64,
                      height: 64,
                      flex: '0 0 64px',
                      objectFit: 'contain',
                      bgcolor: 'background.default',
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                    }}
                  />
                  <TextField
                    label="Image ID"
                    value={row.draftId}
                    error={!!error}
                    helperText={
                      error ??
                      `Identifier used to reference this image from a preset. Can be anything you want!`
                    }
                    fullWidth
                    onChange={(event) => {
                      updateDraftId(row.rowId, event.target.value);
                    }}
                    onBlur={() => {
                      if (!error) {
                        updateDraftId(row.rowId, row.draftId.trim());
                      }
                    }}
                  />
                </ListItem>
              </Box>
            );
          })}
        </List>
      )}

      <Dialog
        open={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        slotProps={{
          transition: {
            onExited: () => {
              setDeleteTarget(null);
            },
          },
        }}
      >
        <DialogTitle>Delete image?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete "{deleteTarget?.image.id ?? 'this image'}" from local
            storage?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button color="error" onClick={confirmDelete} autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
