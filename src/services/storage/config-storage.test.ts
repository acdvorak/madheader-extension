import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  CONFIG_STORAGE_KEY,
  loadStoredConfigJsonc,
  saveStoredConfigJsonc,
} from './config-storage';

describe('config storage fallback', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads the local fallback after a sync quota failure', async () => {
    const storedValues: Record<'local' | 'sync', Record<string, unknown>> = {
      sync: { [CONFIG_STORAGE_KEY]: '{"presets":[]}' },
      local: {},
    };
    const syncRemove = vi.fn((key: string) => {
      storedValues.sync = Object.fromEntries(
        Object.entries(storedValues.sync).filter(
          ([storedKey]) => storedKey !== key,
        ),
      );
      return Promise.resolve();
    });

    vi.stubGlobal('chrome', {
      storage: {
        sync: {
          get: vi.fn((key: string) =>
            Promise.resolve({
              [key]: storedValues.sync[key],
            }),
          ),
          set: vi.fn(() =>
            Promise.reject(new Error('QUOTA_BYTES_PER_ITEM quota exceeded')),
          ),
          remove: syncRemove,
        },
        local: {
          get: vi.fn((key: string) =>
            Promise.resolve({
              [key]: storedValues.local[key],
            }),
          ),
          set: vi.fn((items: Record<string, unknown>) => {
            Object.assign(storedValues.local, items);
            return Promise.resolve();
          }),
        },
      },
    });

    const jsoncWithImage = `{"image":"${'A'.repeat(10_000)}"}`;

    await expect(saveStoredConfigJsonc(jsoncWithImage)).resolves.toBe('local');
    await expect(loadStoredConfigJsonc()).resolves.toEqual({
      jsonc: jsoncWithImage,
      storageArea: 'local',
    });
    expect(syncRemove).toHaveBeenCalledWith(
      CONFIG_STORAGE_KEY,
      expect.any(Function),
    );
  });
});
