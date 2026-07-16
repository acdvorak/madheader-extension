import { afterEach, describe, expect, it, vi } from 'vitest';

import { CONFIG_STORAGE_KEY } from './config-storage';
import {
  IMAGES_STORAGE_KEY,
  loadStoredImages,
  saveStoredImages,
  subscribeToStoredImageChanges,
} from './image-storage';

describe('image storage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads an empty list when no images have been stored', async () => {
    vi.stubGlobal('chrome', {
      storage: {
        local: {
          get: vi.fn(() => Promise.resolve({})),
        },
      },
    });

    await expect(loadStoredImages()).resolves.toEqual({ images: [] });
  });

  it('ignores malformed stored images with a warning', async () => {
    vi.stubGlobal('chrome', {
      storage: {
        local: {
          get: vi.fn(() =>
            Promise.resolve({ [IMAGES_STORAGE_KEY]: [{ id: '' }] }),
          ),
        },
      },
    });

    await expect(loadStoredImages()).resolves.toEqual({
      images: [],
      warning: 'Stored images were invalid and were ignored.',
    });
  });

  it('uses only local storage and preserves a local config', async () => {
    const storedValues: Record<string, unknown> = {
      [CONFIG_STORAGE_KEY]: '{"presets":[]}',
    };
    const localSet = vi.fn((items: Record<string, unknown>) => {
      Object.assign(storedValues, items);
      return Promise.resolve();
    });
    const syncGet = vi.fn();
    const syncSet = vi.fn();
    vi.stubGlobal('chrome', {
      storage: {
        sync: { get: syncGet, set: syncSet },
        local: {
          get: vi.fn((key: string) =>
            Promise.resolve({ [key]: storedValues[key] }),
          ),
          set: localSet,
        },
      },
    });

    const images = [
      {
        id: ' avatar.png ',
        base64Bytes: 'aGVsbG8=',
        mimeType: 'image/png' as const,
      },
    ];
    await expect(saveStoredImages(images)).resolves.toEqual([
      { ...images[0], id: 'avatar.png' },
    ]);
    await expect(loadStoredImages()).resolves.toEqual({
      images: [{ ...images[0], id: 'avatar.png' }],
    });

    expect(storedValues[CONFIG_STORAGE_KEY]).toBe('{"presets":[]}');
    expect(localSet).toHaveBeenCalledWith(
      { [IMAGES_STORAGE_KEY]: [{ ...images[0], id: 'avatar.png' }] },
      expect.any(Function),
    );
    expect(syncGet).not.toHaveBeenCalled();
    expect(syncSet).not.toHaveBeenCalled();
  });

  it('rejects duplicate IDs before writing', async () => {
    const localSet = vi.fn(() => Promise.resolve());
    vi.stubGlobal('chrome', {
      storage: {
        local: {
          set: localSet,
        },
      },
    });

    await expect(
      saveStoredImages([
        { id: 'same', base64Bytes: 'YQ==', mimeType: 'image/png' },
        { id: 'same', base64Bytes: 'Yg==', mimeType: 'image/png' },
      ]),
    ).rejects.toThrow('Images must have valid, unique IDs.');
    expect(localSet).not.toHaveBeenCalled();
  });

  it('subscribes to validated local image changes', () => {
    const addListener = vi.fn();
    const removeListener = vi.fn();
    vi.stubGlobal('chrome', {
      storage: { onChanged: { addListener, removeListener } },
    });
    const listener = vi.fn();

    const unsubscribe = subscribeToStoredImageChanges(listener);
    const handleStorageChange = addListener.mock.calls[0]?.[0] as (
      changes: Record<string, { newValue?: unknown }>,
      areaName: string,
    ) => void;
    const images = [
      { id: 'avatar.png', base64Bytes: 'YQ==', mimeType: 'image/png' },
    ];

    handleStorageChange(
      { [IMAGES_STORAGE_KEY]: { newValue: images } },
      'local',
    );
    handleStorageChange(
      { [IMAGES_STORAGE_KEY]: { newValue: [{ id: '' }] } },
      'local',
    );
    handleStorageChange({ [IMAGES_STORAGE_KEY]: { newValue: images } }, 'sync');

    expect(listener).toHaveBeenNthCalledWith(1, images);
    expect(listener).toHaveBeenNthCalledWith(2, []);
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    expect(removeListener).toHaveBeenCalledWith(handleStorageChange);
  });
});
