// src/motion/useStagger.ts
//
// Per-index entrance delays for siblings. Delay = index * step, with every delay capped at `max` so a long list is not slow.
// Reduced motion returns all zeros.
import { useMemo } from "react";
import { motion, type MotionTokens } from "../tokens/motion.base.js";
import { useMotionPreference } from "./useMotionPreference.js";

/** Stagger token name (`theme.motion.stagger`). */
export type MotionStaggerName = keyof MotionTokens["stagger"];

/** Default cap on a single delay, in milliseconds. */
export const STAGGER_MAX_DELAY = 400;

export interface StaggerOptions {
  /** Step between neighbours: a stagger token name or milliseconds. Default `"base"`. */
  delay?: MotionStaggerName | number;
  /** Cap on any one delay in milliseconds. Default 400. */
  max?: number;
  /** Pass `theme.motion` to follow theme overrides. */
  tokens?: MotionTokens;
}

function finite(value: number, fallback: number): number {
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

/** Pure delay computation: `min(index * step, max)` for each index. */
export function staggerDelays(count: number, step: number, max: number = STAGGER_MAX_DELAY): number[] {
  const n = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
  const s = finite(step, 0);
  const cap = finite(max, STAGGER_MAX_DELAY);
  return Array.from({ length: n }, (_, i) => Math.min(i * s, cap));
}

/**
 * Delays in milliseconds, one per index. The returned array is memoised: the same inputs give the same array instance.
 * Under reduced motion every delay is 0.
 */
export function useStagger(count: number, options: StaggerOptions = {}): readonly number[] {
  const { delay = "base", max = STAGGER_MAX_DELAY, tokens } = options;
  const reduceMotion = useMotionPreference();
  const resolved = tokens ?? motion;
  const step = typeof delay === "number" ? delay : (resolved.stagger[delay] ?? 0);
  return useMemo(() => (reduceMotion ? staggerDelays(count, 0, max) : staggerDelays(count, step, max)), [count, step, max, reduceMotion]);
}
