import { createContext } from "react";
import { breakpoints } from "../tokens/breakpoints.base.js";

export type BreakpointScale = { readonly [K in keyof typeof breakpoints]: number };

/** Minimum sizes (dp) at which the `medium` and `expanded` size classes start; below `medium` is `compact`. */
export interface SizeClassSteps {
  medium: number;
  expanded: number;
}

/** Size-class thresholds; a missing axis or step keeps its default (width 600/840, height 480/900). */
export interface SizeClassThresholds {
  width?: Partial<SizeClassSteps>;
  height?: Partial<SizeClassSteps>;
}

export interface ResponsiveContextValue {
  /** Minimum window width of each breakpoint; `xs` must be 0. */
  breakpoints: BreakpointScale;
  /** Pins the orientation used by responsive helpers; `undefined` follows the window. */
  orientationLock?: "portrait" | "landscape";
  /**
   * Fixed window size used instead of `useWindowDimensions()`: server rendering, previews and tests (the react-native
   * test shim has a static window). `undefined` follows the real window.
   */
  window?: { readonly width: number; readonly height: number };
  /** Overrides the size-class thresholds used by `useWindowSizeClass`. */
  sizeClassThresholds?: SizeClassThresholds;
}

/** Defaults to the token scale. A provider (a later ticket) can override it; without one the defaults apply (SSR/test-safe). */
export const ResponsiveContext = createContext<ResponsiveContextValue>({ breakpoints });
