import { useContext } from "react";
import { useReducedMotion } from "../native/accessibility/index.js";
import { MotionContext } from "./MotionProvider.js";

/**
 * True when motion should be reduced. `"always"` and `"never"` (set by `MotionProvider`) override the system value;
 * `"system"` (the default, also without a provider) reads `useReducedMotion` from the accessibility hooks, which is the
 * only implementation of that preference in the library.
 */
export function useMotionPreference(): boolean {
  const { reduceMotion } = useContext(MotionContext);
  const system = useReducedMotion();
  if (reduceMotion === "always") return true;
  if (reduceMotion === "never") return false;
  return system;
}
