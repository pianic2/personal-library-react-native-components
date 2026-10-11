import { createContext } from "react";
import { breakpoints } from "../tokens/breakpoints.base.js";

export type BreakpointScale = { readonly [K in keyof typeof breakpoints]: number };

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
}

/** Defaults to the token scale. A provider (a later ticket) can override it; without one the defaults apply (SSR/test-safe). */
export const ResponsiveContext = createContext<ResponsiveContextValue>({ breakpoints });
