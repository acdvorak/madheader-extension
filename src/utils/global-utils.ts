import { Temporal } from '@js-temporal/polyfill';
import _ from 'lodash';
import natsortFactory from 'natsort';
import type { ArrayElement, EmptyObject, IntClosedRange } from 'type-fest';

const natsort = natsortFactory({ insensitive: true });

/**
 * Natural sort, case-INsensitive.
 *
 * Correctly handles sorting numbers inside strings.
 *
 * @example
 * ```ts
 * const unsorted = ["100", "200", "20", 1", "10", "2"]
 * unsorted.sort()
 * // --> ["1", "10", "100", "2", "20", "200"]
 * unsorted.sort(caseInsensitive)
 * // --> ["1", "2", "10", "20", "100", "200"]
 * ```
 */
export function caseInsensitive(
  a: string | null | undefined,
  b: string | null | undefined,
): number {
  return natsort(a || '', b || '');
}

export function isNotEmptyObject<T>(
  obj: T | EmptyObject | null | undefined,
): obj is Exclude<T, EmptyObject> {
  return !!obj && !_.isEmpty(obj);
}

/**
 * [Type predicate](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)
 * that determines if a given value is [truthy](https://mdn.io/Glossary/Truthy),
 * and if so, narrows its type to exclude `null` and `undefined`.
 *
 * Useful for filtering an array of values that might contain empty strings,
 * `null`, or `undefined`, before calling `.map()` or `.join()` on the array.
 *
 * Unlike lodash's {@link _.identity}, which returns _the value itself_ and does
 * not narrow the type of the value, this function returns a strict `boolean`
 * value as a _type predicate_, which _does_ narrow the type.
 *
 * @returns Type predicate of `true` if the {@link value} is
 * [truthy](https://mdn.io/Glossary/Truthy); otherwise `false`.
 *
 * @example
 * ```ts
 * const addressLines: Array<string | null | undefined> = [
 *   // Empty street address
 *   '',
 *   // Valid city, state, and ZIP code
 *   'Grafton, WI 53024',
 *   // Missing (undefined) country name
 *   undefined,
 * ];
 *
 * // ❌ Type is NOT narrowed.
 * const badArrayType: Array<string | null | undefined> = addressLines.filter(_.identity);
 *
 * // ✅ Type IS narrowed.
 * const goodArrayType: string[] = addressLines.filter(isTruthy);
 *
 * // ❌ Unwanted leading/trailing commas.
 * const badFormattedAddress: string = addressLines.join(', ');
 * // --> ", Grafton, WI 53024, "
 *
 * // ✅ No extra commas.
 * const goodFormattedAddress: string = goodArrayType.join(', ');
 * // --> "Grafton, WI 53024"
 * ```
 *
 * @example
 * ```ts
 * const elementsOrNull: Array<Element | null> =
 *   ['id_1', 'id_2', 'id_3'].map((id: string): Element | null => {
 *     return document.getElementById(id);
 *   });
 *
 * // ❌ Type is NOT narrowed.
 * const badArrayType: Array<Element | null> = elementsOrNull.filter(_.identity);
 *
 * // ✅ Type IS narrowed.
 * const goodArrayType: Element[] = elementsOrNull.filter(isTruthy);
 * ```
 */
export function isTruthy<T extends NonNullable<unknown>>(
  value: T | null | undefined,
): value is Exclude<
  T,
  // List of types comes from https://mdn.io/Glossary/Falsy
  // eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents
  -0 | 0 | 0n | false | '' | null | undefined
> {
  return !!value;
}

export async function sleep(ms: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export type Usable<T> = Exclude<T, EmptyObject>;

export function sortAndFilter<T>(
  array: Array<T | null | undefined> | null | undefined,
  predicates: Array<(value: Usable<T>) => boolean>,
): Array<Usable<T>>;
export function sortAndFilter<T>(
  array: T[] | null | undefined,
  predicates: Array<(value: Usable<T>) => boolean>,
): Array<Usable<T>> {
  if (!array) {
    return [];
  }
  return _.orderBy(
    array.filter(isTruthy).filter(isNotEmptyObject),
    predicates.map((predicate) => {
      return (value) => {
        return predicate(value) ? -1 : 0;
      };
    }),
    'asc',
  );
}

export function toPlainIsoDate(
  maybeIsoLike: string | null | undefined,
): Temporal.PlainDate | null {
  if (!maybeIsoLike) {
    return null;
  }
  try {
    const parsed = Temporal.PlainDate.from(maybeIsoLike);
    return parsed;
  } catch (error: unknown) {
    console.error('toPlainIsoDate():', error);
    return null;
  }
}

export function toPlainIsoDateTime(
  maybeIsoLike: string | null | undefined,
): Temporal.PlainDateTime | null {
  if (!maybeIsoLike) {
    return null;
  }
  try {
    const parsed = Temporal.PlainDateTime.from(maybeIsoLike);
    return parsed;
  } catch (error: unknown) {
    console.error('toPlainIsoDateTime():', error);
    return null;
  }
}

export function isOutsideOfDateRange(
  rawStartDate: string | null | undefined,
  rawEndDate: string | null | undefined,
): boolean {
  const startDate: Temporal.PlainDateTime | null =
    toPlainIsoDateTime(rawStartDate);
  const endDate: Temporal.PlainDateTime | null = toPlainIsoDateTime(rawEndDate);

  const today = Temporal.Now.plainDateTimeISO();
  const isAlreadyEnded = endDate
    ? Temporal.PlainDateTime.compare(endDate, today) < 0
    : false;
  const startsInTheFuture = startDate
    ? Temporal.PlainDateTime.compare(startDate, today) > 0
    : false;

  if (isAlreadyEnded || startsInTheFuture) {
    return true;
  }

  return false;
}

/**
 * Base-10 SI (decimal).
 */
const DEC_UNITS = ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] as const;

/**
 * Base-2 IEC (binary).
 */
const BIN_UNITS = [
  'KiB',
  'MiB',
  'GiB',
  'TiB',
  'PiB',
  'EiB',
  'ZiB',
  'YiB',
] as const;

export type DecByteUnit = 'B' | ArrayElement<typeof DEC_UNITS>;
export type BinByteUnit = 'B' | ArrayElement<typeof DEC_UNITS>;

export function formatBytes(bytes: number): [`${number}`, DecByteUnit];
export function formatBytes(
  bytes: number,
  base2: true,
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  decimalPlaces?: IntClosedRange<0, 100>,
): [`${number}`, DecByteUnit];
export function formatBytes(
  bytes: number,
  base2: false,
  decimalPlaces?: IntClosedRange<0, 100>,
): [`${number}`, BinByteUnit];
export function formatBytes(
  bytes: number,
  base2 = true,
  decimalPlaces = 2,
): [`${number}`, DecByteUnit | BinByteUnit] {
  const threshold = base2 ? 1000 : 1024;

  if (Math.abs(bytes) < threshold) {
    return [`${bytes}`, 'B'];
  }

  const units = base2 ? DEC_UNITS : BIN_UNITS;

  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(threshold));
  const formattedValue = (bytes / Math.pow(threshold, i)).toFixed(
    decimalPlaces,
  ) as `${number}`;

  return [formattedValue, units[i]! as DecByteUnit | BinByteUnit];
}

export function logJsonByteSize(
  name: string,
  object: unknown,
  minByteSize?: number,
): void {
  const json = JSON.stringify(object);
  const byteCount = new TextEncoder().encode(json).byteLength;
  const [number, unit] = formatBytes(byteCount);
  if (minByteSize && byteCount < minByteSize) {
    return;
  }
  console.log(`${name}:`, Number(number), unit);
}
