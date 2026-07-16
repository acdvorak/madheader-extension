import type { FormControlProps } from '@mui/material';
import type {
  Color as MuiColorSet,
  Palette as MuiPalette,
  PaletteMode,
  Theme,
} from '@mui/material/styles';
import type { SxProps, SystemStyleObject } from '@mui/system';

import stringify from 'fast-json-stable-stringify';
import murmur from 'murmurhash3js-revisited';

import { isTruthy } from '@/utils/global-utils';

/* eslint-disable @typescript-eslint/no-unused-vars */
const TRUE = Date.now() > 0;
const FALSE = Date.now() < 0;
/* eslint-enable @typescript-eslint/no-unused-vars */

/**
 * Recursively checks if an object or value contains any functions.
 * Necessary because JSON stringification silently drops or ignores functions.
 */
function hasFunctions(value: unknown): boolean {
  if (typeof value === 'function') {
    return true;
  }

  if (value && typeof value === 'object') {
    // Handle arrays
    if (Array.isArray(value)) {
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < value.length; i++) {
        if (hasFunctions(value[i])) {
          return true;
        }
      }
      return false;
    }

    // Handle plain objects
    const keys = Object.keys(value);
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < keys.length; i++) {
      if (hasFunctions((value as Record<string, unknown>)[keys[i]!])) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Generates a stable, 128-bit MurmurHash3 string for a merged sx object.
 *
 * @param sxValue - The deeply merged sx property value (object, array, primitive).
 * @returns A 128-bit hex string hash, or `null` if the value cannot be safely hashed (e.g., contains functions).
 */
function hashSxProps(sxValue: unknown): string | null {
  // 1. Instantly eject if the input is a theme callback function or contains one
  if (hasFunctions(sxValue)) {
    return null;
  }

  try {
    // 2. Deterministically stringify the sorted keys
    const stableString = stringify(sxValue);

    // 3. Fallback check for empty or completely un-serializable structures
    if (!stableString) {
      return null;
    }

    console.log('stableString:', stableString);

    // 4. Return the highly collision-resistant 128-bit hash
    return murmur.x86.hash128(new TextEncoder().encode(stableString));
  } catch {
    // Guard against edge cases like circular references
    return null;
  }
}

declare module '@mui/material/Paper' {
  interface PaperPropsVariantOverrides {
    highlighted: true;
  }
}

declare module '@mui/material/styles' {
  interface Palette {
    baseShadow: string;
  }
}

export type ScalarSx =
  SystemStyleObject<Theme> | ((theme: Theme) => SystemStyleObject<Theme>);

export type SxArray = ScalarSx[];

export type MaybeSx = SxProps<Theme> | ScalarSx | boolean | null | undefined;

const sxCache = new Map<string, ScalarSx[]>();

export function mergeSx(
  ...styles: Array<MaybeSx | MaybeSx[] | MaybeSx[][]>
): ScalarSx[] {
  const merged: ScalarSx[] = styles
    .flatMap((curSx: MaybeSx | MaybeSx[] | MaybeSx[][]): ScalarSx[] => {
      if (Array.isArray(curSx)) {
        return (curSx as ScalarSx[]).flat();
      }
      if (typeof curSx === 'object') {
        return [curSx as ScalarSx].flat();
      }
      return [];
    })
    .filter(isTruthy);

  // Disable custom `sx` caching; let MUI handle it.
  if (FALSE) {
    const hashKey = hashSxProps(merged);
    if (hashKey) {
      const cached = sxCache.get(hashKey);
      if (cached) {
        // console.log(hashKey);
        return cached;
      }
      sxCache.set(hashKey, merged);
    }
  }

  return merged;
}

export type ThemeColorSet = Record<
  Exclude<keyof MuiColorSet, `A${string}`>,
  | `hsl(${number}, ${number}%, ${number}%)`
  | `rgb(${number}, ${number}, ${number})`
  | `rgba(${number}, ${number}, ${number}, ${number})`
  | `#${string}`
>;

type MuiPaletteIgnoredKeys = KeysOfType<
  MuiPalette,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ((...args: any[]) => any) | number | PaletteMode
>;
type MuiPaletteObjectKeys = KeysOfType<MuiPalette, object | string>;
type MuiPaletteColorKeys = Exclude<MuiPaletteObjectKeys, MuiPaletteIgnoredKeys>;
type MuiPaletteSlim = Pick<MuiPalette, MuiPaletteColorKeys>;
type AllMuiPalettePaths = DotPaths<MuiPaletteSlim>;
type MuiPaletteLeafPathsWithGrey = AllMuiPalettePaths &
  ('divider' | `${string}.${string}`);
// TODO(advorak): Remove `grey` from allowed colors and fix existing usages
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type MuiPaletteLeafPathsWithoutGrey = Exclude<
  MuiPaletteLeafPathsWithGrey,
  `grey.${number}`
>;
type StringPrototypeKeys = keyof string & string;
type PathWithStringFunction = `${string}.${StringPrototypeKeys}`;

export type MuiPaletteColorName = Exclude<
  MuiPaletteLeafPathsWithGrey,
  PathWithStringFunction
>;

export type MuiFormColorName = FormControlProps['color'];
