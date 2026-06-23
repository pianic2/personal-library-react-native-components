// ui/hooks/useBreakpoint.ts

import { Platform, useWindowDimensions } from "react-native";

export type Breakpoint = "base" | "sm" | "md" | "lg" | "xl";

const BREAKPOINTS: Record<Exclude<Breakpoint, "base">, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

export function useBreakpoint(): Breakpoint {
  const { width } = useWindowDimensions();

  if (Platform.OS !== "web") return "base";

  if (width >= BREAKPOINTS.xl) return "xl";
  if (width >= BREAKPOINTS.lg) return "lg";
  if (width >= BREAKPOINTS.md) return "md";
  if (width >= BREAKPOINTS.sm) return "sm";

  return "base";
}
