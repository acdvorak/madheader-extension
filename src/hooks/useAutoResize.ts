import { useCallback, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';

import { useResizeObserver } from './use-resize-observer';

export interface UseAutoResizeResult {
  scrollContainerRef: RefObject<HTMLElement | null>;
  scrollDimensions: {
    width: number;
    height: number;
  };
}

export const useAutoResize = (): UseAutoResizeResult => {
  const scrollContainerRef = useRef<HTMLElement>(null);
  const [scrollDimensions, setScrollDimensions] = useState<{
    width: number;
    height: number;
  }>({
    width: 0,
    height: 0,
  });

  const handleResize = useCallback(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) {
      return;
    }

    const containerClientWidth = scrollContainer.clientWidth;
    const containerClientHeight = scrollContainer.clientHeight;

    setScrollDimensions({
      width: containerClientWidth,
      height: containerClientHeight,
    });
  }, []);

  const resizeObserverArgs = useMemo(() => {
    return {
      ref: scrollContainerRef,
      onResize: (): void => {
        handleResize();
      },
    };
  }, [handleResize]);

  useResizeObserver(resizeObserverArgs);

  return { scrollContainerRef, scrollDimensions };
};
