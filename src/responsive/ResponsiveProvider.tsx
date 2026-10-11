import React, { useContext, useMemo } from "react";
import { ResponsiveContext, type BreakpointScale, type ResponsiveContextValue, type SizeClassThresholds } from "./context.js";
import { DEFAULT_SIZE_CLASS_THRESHOLDS } from "./useWindowSizeClass.js";

export interface ResponsiveProviderProps {
  /** Overrides of the breakpoint scale (minimum widths); missing keys keep the enclosing provider's (or the token) values. */
  breakpoints?: Partial<BreakpointScale>;
  /** Overrides of the size-class thresholds used by `useWindowSizeClass`; merged per axis and per step. */
  sizeClasses?: SizeClassThresholds;
  /** Pins the orientation used by responsive helpers. */
  orientationLock?: ResponsiveContextValue["orientationLock"];
  /** Fixed window size used instead of the real window (server rendering, previews, tests). */
  window?: ResponsiveContextValue["window"];
  children?: React.ReactNode;
}

const BREAKPOINT_ORDER = ["xs", "sm", "md", "lg", "xl"] as const;

function isDev(): boolean {
  return (globalThis as { __DEV__?: boolean }).__DEV__ === true;
}

/** An error message when the (merged) breakpoint scale is not usable, else undefined. */
export function breakpointScaleProblem(scale: BreakpointScale): string | undefined {
  for (const key of BREAKPOINT_ORDER) {
    if (typeof scale[key] !== "number" || !Number.isFinite(scale[key])) return `breakpoint "${key}" must be a finite number`;
  }
  if (scale.xs !== 0) return `breakpoint "xs" must be 0, got ${scale.xs}`;
  for (let i = 1; i < BREAKPOINT_ORDER.length; i += 1) {
    const prev = BREAKPOINT_ORDER[i - 1]!;
    const key = BREAKPOINT_ORDER[i]!;
    if (!(scale[key] > scale[prev])) return `breakpoints must be strictly ascending: "${key}" (${scale[key]}) is not above "${prev}" (${scale[prev]})`;
  }
  return undefined;
}

type Steps = { medium?: number; expanded?: number } | undefined;

// A step that is not set takes the default, exactly as `useWindowSizeClass` does, so the ordering is checked on the
// effective steps: `{ medium: 900 }` alone is rejected because the default `expanded` is 840.
function stepsProblem(axis: "width" | "height", steps: Steps): string | undefined {
  if (!steps) return undefined;
  for (const key of ["medium", "expanded"] as const) {
    const value = steps[key];
    if (value !== undefined && (typeof value !== "number" || !Number.isFinite(value) || value <= 0)) return `${axis} size class "${key}" must be a positive finite number`;
  }
  const defaults = DEFAULT_SIZE_CLASS_THRESHOLDS[axis];
  const medium = steps.medium ?? defaults.medium;
  const expanded = steps.expanded ?? defaults.expanded;
  if (!(expanded > medium)) return `${axis} size classes must be strictly ascending: expanded (${expanded}) is not above medium (${medium})`;
  return undefined;
}

/** An error message when the size-class thresholds are not usable (set values positive and finite, effective steps ascending), else undefined. */
export function sizeClassProblem(thresholds: SizeClassThresholds | undefined): string | undefined {
  return stepsProblem("width", thresholds?.width) ?? stepsProblem("height", thresholds?.height);
}

/** The entries of `own` whose value is not `undefined` (`{ md: config.md }` with an unset `md` must not erase the enclosing value). */
function definedEntries<T extends object>(own: T | undefined): Partial<T> {
  const out: Partial<T> = {};
  if (own) for (const key of Object.keys(own) as Array<keyof T>) if (own[key] !== undefined) out[key] = own[key];
  return out;
}

function mergeSteps(parent: Steps, own: Steps): Steps {
  const merged = { ...definedEntries(parent), ...definedEntries(own) };
  return Object.keys(merged).length === 0 ? undefined : merged;
}

/**
 * Fills `ResponsiveContext` for the subtree: breakpoint scale, size-class thresholds, orientation lock and fixed window.
 * Nested providers merge with the enclosing one (a key not set, or set to `undefined`, keeps the enclosing value). Invalid
 * values (a scale that is not strictly ascending from `xs` = 0, size classes that are not positive or whose effective steps,
 * including the defaults for steps not set, are not ascending) throw when `__DEV__` is true; otherwise the invalid part is ignored and the enclosing values stay in force.
 */
export function ResponsiveProvider({ breakpoints, sizeClasses, orientationLock, window, children }: ResponsiveProviderProps): React.ReactElement {
  const parent = useContext(ResponsiveContext);
  // Inline object props are new on every render; the context value is keyed on their content so consumers do not re-render
  // for equal inputs.
  const breakpointsKey = JSON.stringify(breakpoints ?? null);
  const sizeClassesKey = JSON.stringify(sizeClasses ?? null);
  const windowWidth = window?.width;
  const windowHeight = window?.height;

  // eslint-disable-next-line react-hooks/exhaustive-deps -- the content keys stand in for the object props
  const value = useMemo<ResponsiveContextValue>(() => {
    const dev = isDev();

    let scale: BreakpointScale = parent.breakpoints;
    if (breakpoints) {
      const merged: BreakpointScale = { ...parent.breakpoints, ...definedEntries(breakpoints) };
      const problem = breakpointScaleProblem(merged);
      if (problem) {
        if (dev) throw new Error(`ResponsiveProvider: ${problem}`);
      } else scale = merged;
    }

    let thresholds: SizeClassThresholds | undefined = parent.sizeClassThresholds;
    if (sizeClasses) {
      const width = mergeSteps(parent.sizeClassThresholds?.width, sizeClasses.width);
      const height = mergeSteps(parent.sizeClassThresholds?.height, sizeClasses.height);
      const merged: SizeClassThresholds = {};
      if (width) merged.width = width;
      if (height) merged.height = height;
      const problem = sizeClassProblem(merged);
      if (problem) {
        if (dev) throw new Error(`ResponsiveProvider: ${problem}`);
      } else thresholds = merged;
    }

    const next: ResponsiveContextValue = { breakpoints: scale };
    const lock = orientationLock ?? parent.orientationLock;
    if (lock !== undefined) next.orientationLock = lock;
    const fixed = windowWidth !== undefined && windowHeight !== undefined ? { width: windowWidth, height: windowHeight } : parent.window;
    if (fixed !== undefined) next.window = fixed;
    if (thresholds !== undefined) next.sizeClassThresholds = thresholds;
    return next;
  }, [parent, breakpointsKey, sizeClassesKey, orientationLock, windowWidth, windowHeight]);

  return <ResponsiveContext.Provider value={value}>{children}</ResponsiveContext.Provider>;
}
