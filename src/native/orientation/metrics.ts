import { useSyncExternalStore } from "react";
import { useWindowDimensions } from "react-native";
import type { Orientation, WindowMetrics, WindowMetricsSource } from "./types.js";

/** Square windows count as portrait (width must be strictly greater to be landscape). */
export function orientationFromSize(width: number, height: number): Orientation {
  return width > height ? "landscape" : "portrait";
}

const emptyMetrics: WindowMetrics = { width: 0, height: 0, scale: 1, fontScale: 1 };
const idleSource: WindowMetricsSource = { get: () => emptyMetrics, subscribe: () => () => undefined };

function useMetrics(source?: WindowMetricsSource): WindowMetrics {
  const own = useWindowDimensions();
  const external = useSyncExternalStore(
    (source ?? idleSource).subscribe,
    (source ?? idleSource).get,
    (source ?? idleSource).get
  );
  return source ? external : { width: own.width, height: own.height, scale: own.scale, fontScale: own.fontScale };
}

/** Window width, height, pixel scale and font scale; re-renders when the window changes. SSR/web safe. */
export function useWindowMetrics(source?: WindowMetricsSource): WindowMetrics {
  const m = useMetrics(source);
  return { width: m.width, height: m.height, scale: m.scale, fontScale: m.fontScale };
}

/** `portrait` or `landscape`, derived from the window size; follows window changes. Compose with `useBreakpoint`. */
export function useOrientation(source?: WindowMetricsSource): Orientation {
  const { width, height } = useMetrics(source);
  return orientationFromSize(width, height);
}
