import { createContext, useContext } from "react";
import { resolveBreakpoint, useBreakpointInfo, type Breakpoint } from "../hooks/useBreakpoint.js";
import { ResponsiveContext, type BreakpointScale } from "./context.js";

/** The measured size of a `Container`, or the window size outside one. */
export interface ContainerSize {
  readonly width: number;
  readonly height: number;
  /** `container` when read from the nearest `Container`, `window` outside any. */
  readonly source: "container" | "window";
}

/** What a `Container` provides: its measured size, starting from the window size until the first layout. */
export interface ContainerContextValue {
  readonly width: number;
  readonly height: number;
}

export const ContainerContext = createContext<ContainerContextValue | null>(null);

/** The size of the nearest `Container`, or of the window outside one. Re-renders when the container is resized by 1 or more. */
export function useContainerSize(): ContainerSize {
  const container = useContext(ContainerContext);
  const window = useBreakpointInfo();
  if (container) return { width: container.width, height: container.height, source: "container" };
  return { width: window.width, height: window.height, source: "window" };
}

/**
 * The breakpoint of the nearest `Container` width (or of the window width outside one). `map` replaces the breakpoint
 * scale (minimum width of each breakpoint, `xs` 0); by default the scale of the `ResponsiveContext` applies.
 */
export function useContainerBreakpoint(map?: Partial<BreakpointScale>): Breakpoint {
  const { width } = useContainerSize();
  const { breakpoints } = useContext(ResponsiveContext);
  return resolveBreakpoint(width, { ...breakpoints, ...map });
}
