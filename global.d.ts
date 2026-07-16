declare type Satisfies<Base, T extends Base> = T;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare type AnyFunction = (...args: any[]) => Promise<any>;

/**
 * @example "2025-12-29"
 */
declare type SimpleIsoDate = `${number}-${number}-${number}`;

declare type StringLiteralMembers<T> = T extends string
  ? string extends T
    ? never
    : T
  : never;

declare type AtLeastOne<T> = [T, ...T[]];

/**
 * Mapped type that returns all keys in type {@link T} whose values are
 * assignable (that is, _extend_) {@link V}.
 *
 * @example
 * // This:
 * type ElementGetter = KeysOfType<
 *   Document,
 *   (str: string) => HTMLElement | null
 * >;
 *
 * // Is equivalent to:
 * type ElementGetter = 'createElement' | 'getElementById' | 'querySelector';
 */
declare type KeysOfType<T, V> = keyof {
  [P in keyof T as T[P] extends V ? P : never]: P;
};

/**
 * Mapped type that returns the names of all properties and sub-properties
 * from type {@link T} in dot notation, recursively.
 *
 * @example
 * // This:
 * type DotPath = DotPaths<{
 *   a: 'foo';
 *   b: {
 *     c: 'bar';
 *     d: false;
 *     e: {
 *       f: 3;
 *       g: null;
 *       h: undefined,
 *     };
 *   };
 * }>;
 *
 * // Is equivalent to:
 * type DotPath = 'a' | 'b' | 'b.c' | 'b.d' | 'b.e' | 'b.e.f' | 'b.e.g';
 */
declare type DotPaths<T> = T extends object
  ? {
      [K in keyof T]: `${Exclude<K, symbol>}${'' | `.${DotPaths<T[K]>}`}`;
    }[keyof T]
  : never;

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
declare type DeepConst<T> = NonNullable<import('type-fest').ReadonlyDeep<T>>;

declare type SetNullable<T extends object, K extends keyof T> = {
  [P in keyof T]: P extends K ? T[P] | null : T[P];
};

declare type Without<
  T,
  K extends (T extends object ? keyof T : T),
> = T extends object
  ? Omit<T, Satisfies<keyof T, K>>
  : Exclude<T, Satisfies<keyof T, K>>;

declare type SpaceToUnder<S extends string> =
  S extends `${infer First} ${infer Rest}`
    ? `${First}_${SpaceToUnder<Rest>}`
    : S;

declare type HyphenToUnder<S extends string> =
  S extends `${infer First}-${infer Rest}`
    ? `${First}_${HyphenToUnder<Rest>}`
    : S;

declare type PeriodToUnder<S extends string> =
  S extends `${infer First}.${infer Rest}`
    ? `${First}_${PeriodToUnder<Rest>}`
    : S;

declare type TitleToSnakeCase<S extends string> = PeriodToUnder<
  SpaceToUnder<HyphenToUnder<Lowercase<S>>>
>;

declare type ScreamingSnakeToSimpleTitleCase<S extends string> =
  S extends `${infer Head}_${infer Tail}`
    ? `${Capitalize<Lowercase<Head>>} ${ScreamingSnakeToSimpleTitleCase<Tail>}`
    : Capitalize<Lowercase<S>>;

declare type AnyUrl = `https://${string}`;

declare type IsoDateTimeNoZone =
  | `${SimpleIsoDate}T${number}:${number}:${number}`
  | `${SimpleIsoDate}T${number}:${number}:${number}.${number}`;

declare type IsoDateTimeUtc = `${IsoDateTimeNoZone}Z`;

type HHMMSS = `${number}:${number}:${number}`;

type TZOffset = `${'-' | '+'}${number}:${number}`;

type TZName = `[${string}/${string}]`;

declare type TemporalDateTimeWithZone =
  `${SimpleIsoDate}T${HHMMSS}${TZOffset}${TZName}`;
