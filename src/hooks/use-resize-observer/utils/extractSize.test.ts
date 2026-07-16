import { describe, expect, it } from 'vitest';

import { extractSize } from './extractSize';

type BoxProperty = Parameters<typeof extractSize>[1];

function createEntry(
  boxSizes: Partial<
    Record<BoxProperty, ResizeObserverSize | readonly ResizeObserverSize[]>
  > = {},
  contentRect: Pick<DOMRectReadOnly, 'width' | 'height'> = {
    width: 0,
    height: 0,
  },
): ResizeObserverEntry {
  return { ...boxSizes, contentRect } as ResizeObserverEntry;
}

describe('extractSize', () => {
  it('returns the requested size from the first array entry', () => {
    const entry = createEntry({
      borderBoxSize: [
        { inlineSize: 120, blockSize: 60 },
        { inlineSize: 80, blockSize: 40 },
      ],
    });

    expect(extractSize(entry, 'borderBoxSize', 'inlineSize')).toBe(120);
    expect(extractSize(entry, 'borderBoxSize', 'blockSize')).toBe(60);
  });

  it('supports Firefox returning a size object instead of an array', () => {
    const entry = createEntry({
      contentBoxSize: { inlineSize: 100, blockSize: 50 },
    });

    expect(extractSize(entry, 'contentBoxSize', 'inlineSize')).toBe(100);
    expect(extractSize(entry, 'contentBoxSize', 'blockSize')).toBe(50);
  });

  it.each([
    ['inlineSize', 320],
    ['blockSize', 180],
  ] as const)(
    'falls back to contentRect for missing contentBoxSize %s',
    (sizeType, expected) => {
      const entry = createEntry({}, { width: 320, height: 180 });

      expect(extractSize(entry, 'contentBoxSize', sizeType)).toBe(expected);
    },
  );

  it.each([
    'borderBoxSize',
    'devicePixelContentBoxSize',
  ] as const)('returns undefined when %s is unavailable', (boxProperty) => {
    expect(extractSize(createEntry(), boxProperty, 'inlineSize')).toBeUndefined();
  });

  it('returns undefined for an empty size array', () => {
    const entry = createEntry({ borderBoxSize: [] });

    expect(extractSize(entry, 'borderBoxSize', 'inlineSize')).toBeUndefined();
  });
});