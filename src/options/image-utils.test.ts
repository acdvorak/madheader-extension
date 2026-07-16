import { describe, expect, it } from 'vitest';

import {
  createUniqueImageId,
  filesToBase64Images,
  fileToBase64Image,
  moveArrayItem,
} from './image-utils';

describe('image utilities', () => {
  it.each([
    [[1, 2, 3], 0, 2, [2, 3, 1]],
    [[1, 2, 3], 2, 0, [3, 1, 2]],
    [[1, 2, 3], 1, 1, [1, 2, 3]],
  ])(
    'moves an array item without mutating the source',
    (items, fromIndex, toIndex, expected) => {
      expect(moveArrayItem(items, fromIndex, toIndex)).toEqual(expected);
      expect(items).toEqual([1, 2, 3]);
    },
  );

  it.each([
    ['photo.png', [], 'photo.png'],
    ['photo.png', ['photo.png'], 'photo-2.png'],
    ['photo.png', ['photo.png', 'photo-2.png'], 'photo-3.png'],
    ['archive.tar.png', ['archive.tar.png'], 'archive.tar-2.png'],
    ['avatar', ['avatar'], 'avatar-2'],
    ['.avatar', ['.avatar'], '.avatar-2'],
  ])('creates a unique ID for %s', (filename, reserved, expected) => {
    expect(createUniqueImageId(filename, new Set(reserved))).toBe(expected);
  });

  it('serializes image bytes without a data URL prefix', async () => {
    const file = new File(['hello'], 'avatar.png', { type: 'image/png' });

    await expect(fileToBase64Image(file, 'avatar.png')).resolves.toEqual({
      id: 'avatar.png',
      base64Bytes: 'aGVsbG8=',
      mimeType: 'image/png',
    });
  });

  it('rejects unsupported file types', async () => {
    const file = new File(['GIF89a'], 'avatar.gif', { type: 'image/gif' });

    await expect(fileToBase64Image(file, 'avatar.gif')).rejects.toThrow(
      'Unsupported image type for "avatar.gif".',
    );
  });

  it('reserves IDs across one upload batch', async () => {
    const files = [
      new File(['first'], 'avatar.png', { type: 'image/png' }),
      new File(['second'], 'avatar.png', { type: 'image/png' }),
    ];

    const images = await filesToBase64Images(files, ['avatar.png']);
    expect(images.map(({ id }) => id)).toEqual([
      'avatar-2.png',
      'avatar-3.png',
    ]);
  });
});
