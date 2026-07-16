const CONFIG_STORAGE_KEY = 'madHeaderConfigJsonc';

type StorageAreaName = 'sync' | 'local';

interface RuntimeErrorLike {
  message?: string;
}

interface RuntimeLike {
  lastError?: RuntimeErrorLike;
}

export type StorageItems = Record<string, unknown>;

interface StorageChange {
  newValue?: unknown;
}

type StorageChangeListener = (
  changes: Record<string, StorageChange | undefined>,
  areaName: string,
) => void;

interface StorageChangeEventLike {
  addListener: (listener: StorageChangeListener) => void;
  removeListener: (listener: StorageChangeListener) => void;
}

interface StorageAreaLike {
  get: (
    keys: string | string[] | StorageItems | null,
    callback?: (items: StorageItems) => void,
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  ) => Promise<StorageItems> | void;
  remove: (
    keys: string | string[],
    callback?: () => void,
  ) => Promise<void> | void;
  set: (items: StorageItems, callback?: () => void) => Promise<void> | void;
}

interface StorageLike {
  sync?: StorageAreaLike;
  local?: StorageAreaLike;
  onChanged?: StorageChangeEventLike;
}

interface ExtensionApiLike {
  runtime?: RuntimeLike;
  storage?: StorageLike;
}

interface GlobalApis {
  chrome?: ExtensionApiLike;
  browser?: ExtensionApiLike;
}

export interface LoadStoredConfigResult {
  jsonc: string | null;
  storageArea: StorageAreaName | null;
}

export type StoredConfigChangeListener = (
  jsonc: string,
  storageArea: StorageAreaName,
) => void;

export type StorageValueChangeListener = (
  value: unknown,
  storageArea: StorageAreaName,
) => void;

function getExtensionApi(): ExtensionApiLike | null {
  const globalApis = globalThis as typeof globalThis & GlobalApis;
  return globalApis.chrome ?? globalApis.browser ?? null;
}

function getStorageAreaOrThrow(storageAreaName: StorageAreaName): {
  api: ExtensionApiLike;
  area: StorageAreaLike;
} {
  const api = getExtensionApi();
  if (!api?.storage) {
    throw new Error('Extension storage API is not available in this runtime');
  }

  const area = api.storage[storageAreaName];
  if (!area) {
    throw new Error(
      `Extension storage area "${storageAreaName}" is not available`,
    );
  }

  return {
    api,
    area,
  };
}

function isPromiseLike<T>(value: unknown): value is PromiseLike<T> {
  return !!value && typeof value === 'object' && 'then' in value;
}

export function storageGet(
  storageAreaName: StorageAreaName,
  key: string,
): Promise<StorageItems> {
  const { api, area } = getStorageAreaOrThrow(storageAreaName);

  return new Promise<StorageItems>((resolve, reject) => {
    let settled = false;

    const finish = (error: unknown, items: StorageItems | null): void => {
      if (settled) {
        return;
      }

      settled = true;
      if (error) {
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        reject(error);
        return;
      }

      resolve(items ?? {});
    };

    try {
      const maybePromise = area.get(key, (items: StorageItems) => {
        const runtimeError = api.runtime?.lastError;
        if (runtimeError) {
          finish(
            new Error(
              runtimeError.message ?? 'Unknown extension runtime error',
            ),
            null,
          );
          return;
        }

        finish(null, items);
      });

      if (isPromiseLike<StorageItems>(maybePromise)) {
        void maybePromise.then(
          (items) => {
            finish(null, items);
          },
          (error: unknown) => {
            finish(error, null);
          },
        );
      }
    } catch (error: unknown) {
      finish(error, null);
    }
  });
}

export function storageSet(
  storageAreaName: StorageAreaName,
  items: StorageItems,
): Promise<void> {
  const { api, area } = getStorageAreaOrThrow(storageAreaName);

  return new Promise<void>((resolve, reject) => {
    let settled = false;

    const finish = (error: unknown): void => {
      if (settled) {
        return;
      }

      settled = true;
      if (error) {
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        reject(error);
        return;
      }

      resolve();
    };

    try {
      const maybePromise = area.set(items, () => {
        const runtimeError = api.runtime?.lastError;
        if (runtimeError) {
          finish(
            new Error(
              runtimeError.message ?? 'Unknown extension runtime error',
            ),
          );
          return;
        }

        finish(null);
      });

      // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
      if (isPromiseLike<void>(maybePromise)) {
        void maybePromise.then(
          () => {
            finish(null);
          },
          (error: unknown) => {
            finish(error);
          },
        );
      }
    } catch (error: unknown) {
      finish(error);
    }
  });
}

function storageRemove(
  storageAreaName: StorageAreaName,
  key: string,
): Promise<void> {
  const { api, area } = getStorageAreaOrThrow(storageAreaName);

  return new Promise<void>((resolve, reject) => {
    let settled = false;

    const finish = (error: unknown): void => {
      if (settled) {
        return;
      }

      settled = true;
      if (error) {
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        reject(error);
        return;
      }

      resolve();
    };

    try {
      const maybePromise = area.remove(key, () => {
        const runtimeError = api.runtime?.lastError;
        if (runtimeError) {
          finish(
            new Error(
              runtimeError.message ?? 'Unknown extension runtime error',
            ),
          );
          return;
        }

        finish(null);
      });

      // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
      if (isPromiseLike<void>(maybePromise)) {
        void maybePromise.then(
          () => {
            finish(null);
          },
          (error: unknown) => {
            finish(error);
          },
        );
      }
    } catch (error: unknown) {
      finish(error);
    }
  });
}

function getStoredJsonc(items: StorageItems): string | null {
  const value = items[CONFIG_STORAGE_KEY];
  return typeof value === 'string' ? value : null;
}

export async function loadStoredConfigJsonc(): Promise<LoadStoredConfigResult> {
  try {
    const syncItems = await storageGet('sync', CONFIG_STORAGE_KEY);
    const syncJsonc = getStoredJsonc(syncItems);
    if (syncJsonc) {
      return {
        jsonc: syncJsonc,
        storageArea: 'sync',
      };
    }
  } catch {
    // Gracefully continue to local storage fallback.
  }

  try {
    const localItems = await storageGet('local', CONFIG_STORAGE_KEY);
    const localJsonc = getStoredJsonc(localItems);
    if (localJsonc) {
      return {
        jsonc: localJsonc,
        storageArea: 'local',
      };
    }
  } catch {
    // Gracefully continue to null result.
  }

  return {
    jsonc: null,
    storageArea: null,
  };
}

export async function saveStoredConfigJsonc(
  jsonc: string,
): Promise<StorageAreaName> {
  const payload: StorageItems = {
    [CONFIG_STORAGE_KEY]: jsonc,
  };

  try {
    await storageSet('sync', payload);
    return 'sync';
  } catch {
    await storageSet('local', payload);
    await storageRemove('sync', CONFIG_STORAGE_KEY);
    return 'local';
  }
}

export function subscribeToStoredConfigChanges(
  listener: StoredConfigChangeListener,
): () => void {
  return subscribeToStorageValueChanges(CONFIG_STORAGE_KEY, (value, area) => {
    if (typeof value === 'string') {
      listener(value, area);
    }
  });
}

export function subscribeToStorageValueChanges(
  key: string,
  listener: StorageValueChangeListener,
  storageAreas: readonly StorageAreaName[] = ['sync', 'local'],
): () => void {
  const onChanged = getExtensionApi()?.storage?.onChanged;
  if (!onChanged) {
    return () => undefined;
  }

  const handleStorageChange: StorageChangeListener = (changes, areaName) => {
    if (
      (areaName !== 'sync' && areaName !== 'local') ||
      !storageAreas.includes(areaName) ||
      !(key in changes)
    ) {
      return;
    }

    listener(changes[key]?.newValue, areaName);
  };

  onChanged.addListener(handleStorageChange);
  return () => {
    onChanged.removeListener(handleStorageChange);
  };
}

export { CONFIG_STORAGE_KEY };
export type { StorageAreaName };
