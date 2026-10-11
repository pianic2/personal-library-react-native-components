import { useContext, useMemo } from "react";
import { useBreakpointInfo } from "../hooks/useBreakpoint.js";
import { ResponsiveContext, type SizeClassSteps, type SizeClassThresholds } from "./context.js";

/** Semantic size class of one window axis. */
export type SizeClass = "compact" | "medium" | "expanded";

export interface WindowSizeClass {
  width: SizeClass;
  height: SizeClass;
}

/** Default steps: width 600/840 and height 480/900 dp. */
export const DEFAULT_SIZE_CLASS_THRESHOLDS: { readonly width: SizeClassSteps; readonly height: SizeClassSteps } = {
  width: { medium: 600, expanded: 840 },
  height: { medium: 480, expanded: 900 },
};

/** `compact` below `steps.medium`, `medium` from there up to `steps.expanded`, `expanded` from `steps.expanded`. */
export function classifySize(size: number, steps: SizeClassSteps): SizeClass {
  if (size >= steps.expanded) return "expanded";
  if (size >= steps.medium) return "medium";
  return "compact";
}

function stepsFor(override: Partial<SizeClassSteps> | undefined, defaults: SizeClassSteps): SizeClassSteps {
  return {
    medium: typeof override?.medium === "number" ? override.medium : defaults.medium,
    expanded: typeof override?.expanded === "number" ? override.expanded : defaults.expanded,
  };
}

/** Resolves the size classes of a window, applying the `thresholds` override on top of the defaults. */
export function resolveWindowSizeClass(width: number, height: number, thresholds?: SizeClassThresholds): WindowSizeClass {
  return {
    width: classifySize(width, stepsFor(thresholds?.width, DEFAULT_SIZE_CLASS_THRESHOLDS.width)),
    height: classifySize(height, stepsFor(thresholds?.height, DEFAULT_SIZE_CLASS_THRESHOLDS.height)),
  };
}

/**
 * Semantic size classes of the window (compact / medium / expanded) for width and height. Thresholds default to 600/840
 * (width) and 480/900 (height) and can be overridden through `ResponsiveContext`. The result keeps its identity while
 * both classes are unchanged.
 */
export function useWindowSizeClass(): WindowSizeClass {
  const { width, height } = useBreakpointInfo();
  const { sizeClassThresholds } = useContext(ResponsiveContext);
  const widthSteps = stepsFor(sizeClassThresholds?.width, DEFAULT_SIZE_CLASS_THRESHOLDS.width);
  const heightSteps = stepsFor(sizeClassThresholds?.height, DEFAULT_SIZE_CLASS_THRESHOLDS.height);
  const widthClass = classifySize(width, widthSteps);
  const heightClass = classifySize(height, heightSteps);
  return useMemo(() => ({ width: widthClass, height: heightClass }), [widthClass, heightClass]);
}

// The single orientation implementation lives in src/native/orientation (PLRNUI-182); re-exported, not copied.
export { useOrientation } from "../native/orientation/index.js";
