import type { Base64Image, ImageMimeType } from '@/schemas/config-schema';
import { ImageMimeType as ImageMimeTypeSchema } from '@/schemas/config-schema';

const BYTE_CHUNK_SIZE = 0x8000;

export function moveArrayItem<Item>(
  items: readonly Item[],
  fromIndex: number,
  toIndex: number,
): Item[] {
  const nextItems = [...items];
  const [item] = nextItems.splice(fromIndex, 1);
  if (item === undefined) {
    return nextItems;
  }

  nextItems.splice(toIndex, 0, item);
  return nextItems;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += BYTE_CHUNK_SIZE) {
    binary += String.fromCharCode(
      ...bytes.subarray(offset, offset + BYTE_CHUNK_SIZE),
    );
  }

  return btoa(binary);
}

function splitFilename(filename: string): { base: string; extension: string } {
  const extensionIndex = filename.lastIndexOf('.');
  if (extensionIndex <= 0) {
    return { base: filename, extension: '' };
  }

  return {
    base: filename.slice(0, extensionIndex),
    extension: filename.slice(extensionIndex),
  };
}

export function createUniqueImageId(
  filename: string,
  reservedIds: ReadonlySet<string>,
): string {
  const initialId = filename.trim() || 'image';
  if (!reservedIds.has(initialId)) {
    return initialId;
  }

  const { base, extension } = splitFilename(initialId);
  for (let suffix = 2; ; suffix += 1) {
    const candidate = `${base}-${suffix}${extension}`;
    if (!reservedIds.has(candidate)) {
      return candidate;
    }
  }
}

export async function fileToBase64Image(
  file: File,
  id: string,
): Promise<Base64Image> {
  const mimeTypeResult = ImageMimeTypeSchema.safeParse(file.type);
  if (!mimeTypeResult.success) {
    throw new Error(`Unsupported image type for "${file.name}".`);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  return {
    id,
    base64Bytes: bytesToBase64(bytes),
    mimeType: mimeTypeResult.data satisfies ImageMimeType,
  };
}

export async function filesToBase64Images(
  files: readonly File[],
  existingIds: Iterable<string>,
): Promise<Base64Image[]> {
  const reservedIds = new Set(existingIds);
  const pendingImages = files.map((file) => {
    const id = createUniqueImageId(file.name, reservedIds);
    reservedIds.add(id);
    return fileToBase64Image(file, id);
  });

  return Promise.all(pendingImages);
}
