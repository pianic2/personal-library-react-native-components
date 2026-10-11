import { useBreakpoint } from "../hooks/useBreakpoint.js";
import { resolveResponsive, type ResponsiveValue } from "./resolve.js";

/** The value of a responsive map for the current breakpoint (see `resolveResponsive`). Re-renders when the breakpoint changes. */
export function useResponsiveValue<T>(value: ResponsiveValue<T>): T | undefined {
  return resolveResponsive(value, useBreakpoint());
}
