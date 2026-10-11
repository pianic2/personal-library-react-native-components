// src/motion/presets.ts
//
// Enter/exit presets for `Presence`: for each preset, the hidden-state values of the four animated properties. The visible
// state is always `PRESENCE_VISIBLE`. Distances come from the motion tokens.
import type { MotionTokens } from "../tokens/motion.base.js";

export type PresencePreset = "fade" | "slide-up" | "slide-down" | "scale" | "collapse";

/** The animated properties of a presence transition. */
export interface PresenceValues {
  opacity: number;
  translateY: number;
  scale: number;
  scaleY: number;
}

export const PRESENCE_PRESETS: readonly PresencePreset[] = ["fade", "slide-up", "slide-down", "scale", "collapse"];

/** Scale a `scale` preset enters from and leaves to. */
export const PRESENCE_SCALE_FROM = 0.95;

export const PRESENCE_VISIBLE: PresenceValues = { opacity: 1, translateY: 0, scale: 1, scaleY: 1 };

/** True for a known preset name (guards untyped JS callers). */
export function isPresencePreset(value: unknown): value is PresencePreset {
  return typeof value === "string" && (PRESENCE_PRESETS as readonly string[]).includes(value);
}

/**
 * The hidden-state values of `preset`. `reduceMotion` collapses every preset to a plain fade: no translate, no scale.
 * `slide-up` rests below its final position (it moves up on entering), `slide-down` above it.
 */
export function presenceHidden(preset: PresencePreset, tokens: Pick<MotionTokens, "distance">, reduceMotion = false): PresenceValues {
  const hidden = { ...PRESENCE_VISIBLE, opacity: 0 };
  if (reduceMotion) return hidden;
  switch (preset) {
    case "slide-up":
      return { ...hidden, translateY: tokens.distance.md };
    case "slide-down":
      return { ...hidden, translateY: -tokens.distance.md };
    case "scale":
      return { ...hidden, scale: PRESENCE_SCALE_FROM };
    case "collapse":
      return { ...hidden, scaleY: 0 };
    default:
      return hidden;
  }
}
