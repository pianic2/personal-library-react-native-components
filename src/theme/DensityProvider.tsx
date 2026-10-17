// src/theme/DensityProvider.tsx
import React from "react";
import type { DensityLevel } from "./contract.js";
import { isDensityLevel } from "./ThemeScope.js";
import { DensityContext } from "./useDensity.js";

export interface DensityProviderProps {
  /** `compact`, `regular` or `comfortable`. A value that is not a level is ignored (the enclosing density stays). */
  level: DensityLevel;
  children?: React.ReactNode;
}

/**
 * Sets the density of a region for `useDensity`. It nests: the inner provider overrides the outer one for its
 * sub-tree. Without any provider `useDensity` returns the default density of the theme.
 */
export function DensityProvider({ level, children }: DensityProviderProps) {
  const outer = React.useContext(DensityContext);
  return <DensityContext.Provider value={isDensityLevel(level) ? level : outer}>{children}</DensityContext.Provider>;
}
