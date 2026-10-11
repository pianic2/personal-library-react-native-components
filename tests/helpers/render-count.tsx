import React, { Profiler } from "react";
import type { ReactNode } from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Commits seen by a `React.Profiler`, split by phase. `commits` is the sum of the phases. */
export interface RenderCounter {
  readonly commits: number;
  readonly mounts: number;
  readonly updates: number;
  readonly nestedUpdates: number;
  /** Zeroes every count, for example after the initial mount when only the updates are measured. */
  reset(): void;
  /** Wrap the subtree to measure. */
  Profile(props: { children?: ReactNode }): React.ReactElement;
}

/**
 * Counts the commits of a subtree with `React.Profiler` (deterministic: no timers, only the number of commits, never
 * durations). A commit is counted when the Profiler or anything inside it rendered, so a Profiler element that its
 * parent re-creates on every render commits on every parent render even if its children bail out; to measure whether a
 * component re-rendered use {@link createRenderProbe} inside it.
 */
export function createRenderCounter(id = "render-count"): RenderCounter {
  const counts = { mounts: 0, updates: 0, nestedUpdates: 0 };
  const onRender = (_id: string, phase: "mount" | "update" | "nested-update"): void => {
    if (phase === "mount") counts.mounts += 1;
    else if (phase === "update") counts.updates += 1;
    else counts.nestedUpdates += 1;
  };
  return {
    get commits() {
      return counts.mounts + counts.updates + counts.nestedUpdates;
    },
    get mounts() {
      return counts.mounts;
    },
    get updates() {
      return counts.updates;
    },
    get nestedUpdates() {
      return counts.nestedUpdates;
    },
    reset() {
      counts.mounts = 0;
      counts.updates = 0;
      counts.nestedUpdates = 0;
    },
    Profile({ children }) {
      return (
        <Profiler id={id} onRender={onRender}>
          {children}
        </Profiler>
      );
    },
  };
}

/** Counts how many times a component's render function ran (not commits): put it where a render is expected or not. */
export interface RenderProbe {
  readonly renders: number;
  reset(): void;
  Probe(props: { children?: ReactNode }): React.ReactElement;
}

export function createRenderProbe(): RenderProbe {
  const state = { renders: 0 };
  return {
    get renders() {
      return state.renders;
    },
    reset() {
      state.renders = 0;
    },
    Probe({ children }) {
      state.renders += 1;
      return <>{children}</>;
    },
  };
}

export interface Baseline {
  /** The recorded number of commits or renders. */
  count: number;
  /** Allowed relative deviation in both directions; defaults to {@link DEFAULT_TOLERANCE}. */
  tolerance?: number;
  /** What the scenario measures, shown in failures. */
  note?: string;
}

export const DEFAULT_TOLERANCE = 0.25;

/** The allowed band for a baseline: `[floor(count * (1 - tolerance)), ceil(count * (1 + tolerance))]`. */
export function baselineRange(baseline: Baseline): { min: number; max: number } {
  const tolerance = baseline.tolerance ?? DEFAULT_TOLERANCE;
  if (!Number.isFinite(baseline.count) || baseline.count < 0) throw new RangeError(`invalid baseline count: ${baseline.count}`);
  if (!Number.isFinite(tolerance) || tolerance < 0) throw new RangeError(`invalid baseline tolerance: ${tolerance}`);
  return { min: Math.floor(baseline.count * (1 - tolerance)), max: Math.ceil(baseline.count * (1 + tolerance)) };
}

/** True when `actual` lies inside the baseline's band (more renders than recorded is a regression, fewer an unrecorded change). */
export function isWithinBaseline(actual: number, baseline: Baseline): boolean {
  const { min, max } = baselineRange(baseline);
  return actual >= min && actual <= max;
}

export type Baselines = Record<string, Baseline>;

const BASELINES_FILE = resolve(import.meta.dirname, "../perf/baselines.json");

export function loadBaselines(file = BASELINES_FILE): Baselines {
  return JSON.parse(readFileSync(file, "utf8")) as Baselines;
}

/** Throws a descriptive error when `actual` is outside the recorded baseline of `name`, or when there is none. */
export function assertWithinBaseline(name: string, actual: number, baselines: Baselines = loadBaselines()): void {
  const baseline = baselines[name];
  if (baseline === undefined) throw new Error(`no baseline recorded for "${name}" in tests/perf/baselines.json (measured ${actual})`);
  const { min, max } = baselineRange(baseline);
  if (actual < min || actual > max) {
    throw new Error(
      `render-count baseline "${name}": measured ${actual}, recorded ${baseline.count} (allowed ${min}..${max})${baseline.note ? ` - ${baseline.note}` : ""}. ` +
        "More renders is a regression; fewer means the baseline should be updated on purpose in tests/perf/baselines.json.",
    );
  }
}
