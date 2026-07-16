import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import sharp from 'sharp';

const TOOLBAR_ICON_SIZES = [16, 32, 48, 128] as const;

function outputFileName(size: number, grayscale: boolean): string {
  const variant = grayscale ? '-grayscale' : '';
  return `madheader-icon-v2${variant}-${String(size)}.png`;
}

export async function generateToolbarIcons(
  rootDir: string,
  outDir: string,
): Promise<void> {
  const sourcePath = resolve(rootDir, 'src/icons/madheader-icon-v2.png');
  const outputDir = resolve(outDir, 'icons');

  await mkdir(outputDir, { recursive: true });
  await Promise.all(
    TOOLBAR_ICON_SIZES.flatMap((size) => {
      const resizeOptions = {
        width: size,
        height: size,
        fit: 'fill' as const,
      };

      return [
        sharp(sourcePath)
          .resize(resizeOptions)
          .png()
          .toFile(resolve(outputDir, outputFileName(size, false))),
        sharp(sourcePath)
          .resize(resizeOptions)
          .grayscale()
          .toColourspace('srgb')
          .ensureAlpha()
          .png()
          .toFile(resolve(outputDir, outputFileName(size, true))),
      ];
    }),
  );
}
