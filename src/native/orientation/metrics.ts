import { useCallback, useMemo, useRef, useSyncExternalStore } from "react";
import { useWindowDimensions } from "react-native";
import type { Orientation, WindowMetrics, WindowMetricsSource } from "./types.js";

/** Square windows count as portrait (width must be strictly greater to be landscape). */
export function orientationFromSize(width: number, height: number): Orientation {
  return width > height ? "landscape" : "portrait";
}

function sameMetrics(a: WindowMetrics, b: WindowMetrics): boolean {
  return a.width === b.width && a.height === b.height && a.scale === b.scale && a.fontScale === b.fontScale;
}

/** Injected-source path: one subscription, snapshot cached by value so a `get()` returning fresh objects is safe. */
function useSourceMetrics(source: WindowMetricsSource): WindowMetrics {
  const cache = useRef<WindowMetrics | null>(null);
  const read = useCallback(
    (get: () => WindowMetrics) => () => {
      const next = get();
      const prev = cache.current;
      if (prev !== null && sameMetrics(prev, next)) return prev;
      const stored = { width: next.width, height: next.height, scale: next.scale, fontScale: next.fontScale };
      cache.current = stored;
      return stored;
    },
    []
  );
  const getSnapshot = useMemo(() => read(() => source.get()), [read, source]);
  const getServerSnapshot = useMemo(() => read(() => (source.getServer ?? source.get)()), [read, source]);
  return useSyncExternalStore(source.subscribe, getSnapshot, getServerSnapshot);
}

/** Default path: react-native `useWindowDimensions()` (it subscribes to Dimensions itself). */
function useDefaultMetrics(): WindowMetrics {
  const { width, height, scale, fontScale } = useWindowDimensions();
  return useMemo(() => ({ width, height, scale, fontScale }), [width, height, scale, fontScale]);
}

// Whether a `source` is given must stay the same for the life of a component instance (rules of hooks): only one of
// the two subscription paths is active, so a source does not also subscribe to react-native Dimensions.
function useMetrics(source?: WindowMetricsSource): WindowMetrics {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return source ? useSourceMetrics(source) : useDefaultMetrics();
}

/**
 * Window width, height, pixel scale and font scale; re-renders when the window changes. The returned object keeps its
 * identity while the four values are unchanged. SSR/web safe.
 */
export function useWindowMetrics(source?: WindowMetricsSource): WindowMetrics {
  return useMetrics(source);
}

/** `portrait` or `landscape`, derived from the window size; follows window changes. Compose with `useBreakpoint`. */
export function useOrientation(source?: WindowMetricsSource): Orientation {
  const { width, height } = useMetrics(source);
  return orientationFromSize(width, height);
}
