import type { Base64Image } from '@/schemas/config-schema';
import { Base64Images } from '@/schemas/config-schema';

import {
  storageGet,
  storageSet,
  subscribeToStorageValueChanges,
} from './config-storage';

const IMAGES_STORAGE_KEY = 'madHeaderImages';

export interface LoadStoredImagesResult {
  images: Base64Image[];
  warning?: string;
}

function formatInvalidImagesWarning(): string {
  return 'Stored images were invalid and were ignored.';
}

export async function loadStoredImages(): Promise<LoadStoredImagesResult> {
  let items: Record<string, unknown>;
  try {
    items = await storageGet('local', IMAGES_STORAGE_KEY);
  } catch (error: unknown) {
    return {
      images: [],
      warning:
        error instanceof Error
          ? `Unable to load stored images: ${error.message}`
          : 'Unable to load stored images.',
    };
  }

  const storedValue = items[IMAGES_STORAGE_KEY];
  if (storedValue === undefined) {
    return { images: [] };
  }

  const result = Base64Images.safeParse(storedValue);
  if (!result.success) {
    return {
      images: [],
      warning: formatInvalidImagesWarning(),
    };
  }

  return { images: result.data };
}

export async function saveStoredImages(
  images: Base64Image[],
): Promise<Base64Image[]> {
  const result = Base64Images.safeParse(images);
  if (!result.success) {
    throw new Error('Images must have valid, unique IDs.');
  }

  await storageSet('local', {
    [IMAGES_STORAGE_KEY]: result.data,
  });
  return result.data;
}

export function subscribeToStoredImageChanges(
  listener: (images: Base64Image[]) => void,
): () => void {
  return subscribeToStorageValueChanges(
    IMAGES_STORAGE_KEY,
    (value) => {
      const result = Base64Images.safeParse(value);
      listener(result.success ? result.data : []);
    },
    ['local'],
  );
}

export { IMAGES_STORAGE_KEY };
