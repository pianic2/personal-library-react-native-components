import React from "react";
import { ResponsiveContext } from "../../src/responsive/context.js";
import { breakpoints } from "../../src/tokens/breakpoints.base.js";

/**
 * Wraps `ui` so hooks that read the window size see `size` instead of `useWindowDimensions()`. The react-native test
 * shim (tests/shims, not owned by this ticket) has a static window, so the size is injected through the responsive
 * context. `scale` overrides the breakpoint scale for tests of custom scales.
 */
export function withWindowSize(
  ui: React.ReactElement,
  size: { width: number; height?: number },
  scale: typeof breakpoints = breakpoints
): React.ReactElement {
  return React.createElement(
    ResponsiveContext.Provider,
    { value: { breakpoints: scale, window: { width: size.width, height: size.height ?? 800 } } },
    ui
  );
}
