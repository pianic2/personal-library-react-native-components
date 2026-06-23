import { useWindowDimensions, Platform } from "react-native";

export const BREAKPOINTS = {
  xs: 0,
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
};

export function useBreakpoint() {
  const { width } = useWindowDimensions();

  // Mobile (native) usa sempre layout mobile
  if (Platform.OS !== "web") {
    return { width, bp: "xs", isMobile: true, isTablet: false, isDesktop: false };
  }

  let bp: keyof typeof BREAKPOINTS = "xs";

  if (width >= BREAKPOINTS.xl) bp = "xl";
  else if (width >= BREAKPOINTS.lg) bp = "lg";
  else if (width >= BREAKPOINTS.md) bp = "md";
  else if (width >= BREAKPOINTS.sm) bp = "sm";

  return {
    width,
    bp,
    isMobile: bp === "xs" || bp === "sm",
    isTablet: bp === "md",
    isDesktop: bp === "lg" || bp === "xl",
  };
}
