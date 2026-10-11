import { useContext, useRef } from "react";
import { getDefaultEngine, type MotionValue } from "./engine.js";
import { MotionContext } from "./MotionProvider.js";


/**
 * A stable animated value, created once per component instance by the engine of the nearest `MotionProvider` (default:
 * the `Animated` engine). The value keeps its identity across renders; `initial` is only read on the first render, and a
 * later engine swap does not recreate the value.
 */
export function useAnimatedValue(initial: number): MotionValue {
  const { engine } = useContext(MotionContext);
  const ref = useRef<MotionValue | null>(null);
  if (ref.current === null) {
    ref.current = (engine ?? getDefaultEngine()).createValue(initial);
  }
  return ref.current;
}
