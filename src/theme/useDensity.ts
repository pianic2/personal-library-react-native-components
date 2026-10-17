// src/theme/useDensity.ts
//
// Density runtime (PLRNUI-274). The context lives here (not in DensityProvider.tsx) so the provider and the hook share it
// without a circular import. Not exported from the package root yet: the wiring tickets own that.
import { createContext, useContext, useMemo } from "react";
import { density as densityTokens } from "../tokens/density.base.js";
import type { DensityLevel } from "./contract.js";
import { isDensityLevel } from "./ThemeScope.js";
import { useTheme } from "./useTheme.js";

/** The smallest interactive area, in points. `control` never returns less. */
export const MIN_HIT_TARGET = 44;

export type ControlSizeKey = keyof ReturnType<typeof useTheme>["theme"]["size"]["height"];

export interface Density {
  /** The current level. */
  level: DensityLevel;
  /** The factor of the level (`compact` 0.875, `regular` 1, `comfortable` 1.125). */
  factor: number;
  /**
   * Multiplies a height, padding or gap by the factor of the level (rounded to two decimals): `scale(40)` is 35 at
   * `compact` and 45 at `comfortable`. Font sizes are not scaled: do not pass them. A value that is not a finite
   * number is returned unchanged.
   */
  scale(n: number): number;
  /**
   * The interactive height of a control of that size: its scaled height, and never less than 44 points
   * (`MIN_HIT_TARGET`). Use it for `minHeight` or `hitSlop`, while `scale` gives the visible height.
   */
  control(sizeKey: ControlSizeKey): number;
}

/** The level set by the nearest `DensityProvider`, or `null` when there is none. */
export const DensityContext = createContext<DensityLevel | null>(null);

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * The density of the current region: the level of the nearest `DensityProvider` (inner ones override outer ones), and
 * without a provider the default level of the theme (`theme.density.default`). Must be used inside `ThemeProvider`.
 */
export function useDensity(): Density {
  const { theme } = useTheme();
  const provided = useContext(DensityContext);
  const level = provided ?? theme.density.default;
  const heights = theme.size.height;
  return useMemo<Density>(() => {
    const factor = densityTokens.scale[isDensityLevel(level) ? level : theme.density.default] ?? 1;
    const scale = (n: number) => (Number.isFinite(n) ? round2(n * factor) : n);
    return {
      level,
      factor,
      scale,
      control: (sizeKey) => Math.max(MIN_HIT_TARGET, scale(heights[sizeKey])),
    };
  }, [level, heights, theme.density.default]);
}
