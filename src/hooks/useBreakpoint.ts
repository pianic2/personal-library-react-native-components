// src/hooks/useBreakpoint.ts

import { useContext } from "react";
import { useWindowDimensions } from "react-native";
import { ResponsiveContext, type BreakpointScale } from "../responsive/context.js";

/** `base` is the name of the range below `sm` (kept for backwards compatibility; the token for it is `xs`). */
export type Breakpoint = "base" | "sm" | "md" | "lg" | "xl";

const ORDER: readonly Breakpoint[] = ["base", "sm", "md", "lg", "xl"];

/** The breakpoint of a window `width` for `scale` (the highest one whose minimum width is reached). */
export function resolveBreakpoint(width: number, scale: BreakpointScale): Breakpoint {
  if (width >= scale.xl) return "xl";
  if (width >= scale.lg) return "lg";
  if (width >= scale.md) return "md";
  if (width >= scale.sm) return "sm";
  return "base";
}

export interface BreakpointInfo {
  bp: Breakpoint;
  width: number;
  height: number;
  /** True when the window is at least as wide as breakpoint `bp` (`base` is always reached). */
  isAtLeast(bp: Breakpoint): boolean;
  /** True when the window is narrower than breakpoint `bp` (`base` is never "below"). */
  isBelow(bp: Breakpoint): boolean;
}

/** The current breakpoint and the window size. Width based on every platform (a tablet is not a phone). */
export function useBreakpointInfo(): BreakpointInfo {
  const real = useWindowDimensions();
  const { breakpoints, window: fixed } = useContext(ResponsiveContext);
  const { width, height } = fixed ?? real;
  const bp = resolveBreakpoint(width, breakpoints);
  const rank = ORDER.indexOf(bp);
  return {
    bp,
    width,
    height,
    isAtLeast: (other) => rank >= ORDER.indexOf(other),
    isBelow: (other) => rank < ORDER.indexOf(other),
  };
}

export function useBreakpoint(): Breakpoint {
  return useBreakpointInfo().bp;
}
