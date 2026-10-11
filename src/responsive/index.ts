// src/responsive/index.ts
//
// The responsive area barrel (E10). It is not re-exported from `src/index.ts` yet (the wiring tickets own the root);
// import from here. Internal helpers (`breakpointScaleProblem`, `sizeClassProblem`, `ContainerContext`) stay unexported.

// Breakpoints (E10-01): the hook lives in src/hooks, the scale and the override context here.
export { useBreakpoint, useBreakpointInfo, resolveBreakpoint } from "../hooks/useBreakpoint.js";
export type { Breakpoint, BreakpointInfo } from "../hooks/useBreakpoint.js";
export { ResponsiveContext } from "./context.js";
export type { BreakpointScale, ResponsiveContextValue, SizeClassSteps, SizeClassThresholds } from "./context.js";

// Size classes and orientation (E10-02).
export { useWindowSizeClass, resolveWindowSizeClass, classifySize, DEFAULT_SIZE_CLASS_THRESHOLDS, useOrientation } from "./useWindowSizeClass.js";
export type { SizeClass, WindowSizeClass } from "./useWindowSizeClass.js";

// Responsive values (E10-03).
export { resolveResponsive } from "./resolve.js";
export type { ResponsiveValue } from "./resolve.js";
export { useResponsiveValue } from "./useResponsiveValue.js";

// Show, Hide and Responsive (E10-04).
export { Show, Hide, matchesCondition } from "./Show.js";
export type { ShowProps, ShowCondition } from "./Show.js";
export { Responsive } from "./Responsive.js";
export type { ResponsiveProps } from "./Responsive.js";

// Provider for overrides (E10-05).
export { ResponsiveProvider } from "./ResponsiveProvider.js";
export type { ResponsiveProviderProps } from "./ResponsiveProvider.js";

// Container and container size (E10-06).
export { Container, CONTAINER_WIDTHS } from "../components/Container/index.js";
export type { ContainerProps, ContainerSizeName } from "../components/Container/index.js";
export { useContainerSize, useContainerBreakpoint } from "./useContainerSize.js";
export type { ContainerSize, ContainerContextValue } from "./useContainerSize.js";

// Device class and foldables (E10-08).
export {
  useDeviceClass,
  useAspectPosture,
  resolveDeviceClass,
  resolveAspectPosture,
  TABLET_MIN_SHORTEST_SIDE,
  DESKTOP_MIN_WIDTH,
  useFoldState,
  FoldAdapterProvider,
  defaultFoldAdapter,
} from "./useDeviceClass.js";
export type { DeviceClass, AspectPosture, PlatformLike, FoldAdapter, FoldState, HingeBounds } from "./useDeviceClass.js";
export type { FoldAdapterProviderProps } from "./FoldAdapter.js";

// Master-detail layout (E10-10).
export { SplitView, SPLIT_VIEW_DEFAULTS, resolvePrimaryWidth } from "./SplitView.js";
export type { SplitViewProps } from "./SplitView.js";

// Large text (E10-12).
export { useIsLargeText, LARGE_TEXT_THRESHOLD } from "./useIsLargeText.js";
export { StackOnLargeText } from "./StackOnLargeText.js";
export type { StackOnLargeTextProps } from "./StackOnLargeText.js";
