// Pure snap logic of the BottomSheet: no React, no React Native. Heights are in density-independent pixels.

/** A snap point: a height in pixels, a share of the container ("50%") or "content" (the height of the sheet content). */
export type SnapPoint = number | `${number}%` | "content";

/** Pixels per millisecond (the unit of `PanResponder`'s `vy`) from which a release counts as a fling. */
export const FLING_VELOCITY = 0.5;
/** A release below this share of the lowest snap height dismisses the sheet. */
export const DISMISS_RATIO = 0.5;

export type SnapDecision = { type: "snap"; index: number } | { type: "dismiss" };

/**
 * Resolves the snap points to pixel heights, sorted ascending and clamped to `containerHeight`. Invalid points
 * (negative, NaN, unparsable) are dropped; "content" needs a measured `contentHeight` and is dropped until then.
 */
export function resolveSnapHeights(points: readonly SnapPoint[], containerHeight: number, contentHeight?: number): number[] {
  const heights: number[] = [];
  for (const point of points) {
    let h: number;
    if (point === "content") h = contentHeight ?? Number.NaN;
    else if (typeof point === "number") h = point;
    else if (typeof point === "string" && /^\d+(\.\d+)?%$/.test(point)) h = (parseFloat(point) / 100) * containerHeight;
    else h = Number.NaN;
    if (Number.isFinite(h) && h > 0) heights.push(Math.min(h, containerHeight));
  }
  return heights.sort((a, b) => a - b);
}

export interface ResolveSnapInput {
  /** Snap heights, ascending (see `resolveSnapHeights`). */
  heights: readonly number[];
  /** Height of the sheet when the finger was released. */
  currentHeight: number;
  /** Vertical velocity in px/ms, positive downwards (the sign of `PanResponder`'s `vy`). */
  velocity: number;
  flingVelocity?: number;
  dismissRatio?: number;
}

/**
 * Where a released drag ends. A fling (|velocity| >= flingVelocity) goes to the next snap in its direction from the
 * current height, and dismisses when it goes down from the lowest. A slow release goes to the nearest snap, and dismisses
 * when the sheet is below `dismissRatio` of the lowest snap.
 */
export function resolveSnap({ heights, currentHeight, velocity, flingVelocity = FLING_VELOCITY, dismissRatio = DISMISS_RATIO }: ResolveSnapInput): SnapDecision {
  if (heights.length === 0) return { type: "dismiss" };
  if (Math.abs(velocity) >= flingVelocity) {
    if (velocity > 0) {
      for (let i = heights.length - 1; i >= 0; i -= 1) {
        if (heights[i]! < currentHeight) return { type: "snap", index: i };
      }
      return { type: "dismiss" };
    }
    for (let i = 0; i < heights.length; i += 1) {
      if (heights[i]! > currentHeight) return { type: "snap", index: i };
    }
    return { type: "snap", index: heights.length - 1 };
  }
  if (currentHeight < heights[0]! * dismissRatio) return { type: "dismiss" };
  let nearest = 0;
  for (let i = 1; i < heights.length; i += 1) {
    if (Math.abs(heights[i]! - currentHeight) < Math.abs(heights[nearest]! - currentHeight)) nearest = i;
  }
  return { type: "snap", index: nearest };
}
