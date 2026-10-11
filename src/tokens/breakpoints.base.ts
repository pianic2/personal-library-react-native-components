// src/tokens/breakpoints.base.ts

// Minimum window width (dp) of each breakpoint. `sm` was 640 on web (hooks/useBreakpoint) and 480 in the unexported
// utils copy; the unified value is 480 (PLRNUI-137, see audit/migration/breaking-change-register.md).
export const breakpoints = {
  xs: 0,
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;
