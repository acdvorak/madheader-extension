/**
 * @fileoverview Retrieve the `width` or `height` of a
 * {@link ResizeObserverEntry}.
 *
 * Forked from
 * https://github.com/ZeeCoder/use-resize-observer/blob/465fbc11c92e1b97a1dcb526b44ce4d889956951/src/utils/extractSize.ts
 */

export function extractSize(
  entry: ResizeObserverEntry,
  boxProp: 'borderBoxSize' | 'contentBoxSize' | 'devicePixelContentBoxSize',
  sizeType: keyof ResizeObserverSize,
): number | undefined {
  /**
   * The {@link ResizeObserverEntry} type definition follows the spec,
   * which does ***not*** reflect Firefox's current behavior of returning
   * _objects_ instead of _arrays_ for `borderBoxSize` and `contentBoxSize`.
   */
  const sizes = entry[boxProp] as
    ResizeObserverSize[] | ResizeObserverSize | undefined;

  if (!sizes) {
    if (boxProp === 'contentBoxSize') {
      /**
       * The dimensions in `contentBoxSize` and `contentRect` are equivalent
       * according to the spec.
       *
       * See the
       * [6th step in the description for the `ResizeObserverEntry` algorithm](https://drafts.csswg.org/resize-observer/#create-and-populate-resizeobserverentry-h):
       *
       * > Set `this.contentRect` to logical `this.contentBoxSize` given
       * > `target` and `observedBox` of "content-box".
       *
       * In real browser implementations, of course, these objects differ,
       * but the `width`/`height` values should be equivalent.
       */
      const value: number =
        entry.contentRect[sizeType === 'inlineSize' ? 'width' : 'height'];

      return value;
    }

    return undefined;
  }

  if (Array.isArray(sizes)) {
    /**
     * We're only using the first element of the size sequences, until future
     * versions of the spec solidify on how exactly it'll be used for fragments
     * in multi-column scenarios.
     *
     * From the [`ResizeObserverEntry` interface spec](https://drafts.csswg.org/resize-observer/#resize-observer-entry-interface):
     *
     * > The box size properties are exposed as `FrozenArray` in order to
     * > support elements that have multiple fragments, which occur in
     * > multi-column scenarios.
     * >
     * > However, the current definitions of "content rect" and "border box"
     * > do not mention how those boxes are affected by multi-column layout.
     * >
     * > In this spec, there will only be a single `ResizeObserverSize` returned
     * > in the `FrozenArray`, which will correspond to the dimensions of the
     * > first column.
     * >
     * > A future version of this spec will extend the returned `FrozenArray`
     * > to contain the per-fragment size information.
     *
     *
     * Also, testing these new box options revealed that in both Chrome and FF
     * everything is returned in the callback, regardless of the `box` option.
     *
     * The
     * [`ResizeObserver` spec](https://drafts.csswg.org/resize-observer/#resize-observer-interface)
     * states the following on this:
     *
     * > This does not have any impact on which box dimensions are returned
     * > to the defined callback when the event is fired, it solely defines
     * > which box the author wishes to observe layout changes on.
     *
     * I'm not exactly clear on what this means, especially when you consider
     * a later section states the following:
     *
     * > This section is non-normative. An author may desire to observe
     * > more than one CSS box. In this case, author will need to use multiple
     * > `ResizeObserver`s.
     *
     * Which is clearly not how current browser implementations behave,
     * and seems to contradict the previous quote.
     *
     * For this reason I decided to only return the requested size,
     * even though it seems we have access to results for all box types.
     *
     * This also means that we get to keep the current API, being able to
     * return a simple `{ width, height }` pair, regardless of box option.
     */
    const firstSize = sizes[0];

    return firstSize?.[sizeType];
  }

  // Firefox
  return sizes[sizeType];
}
