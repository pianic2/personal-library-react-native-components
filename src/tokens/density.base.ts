// src/tokens/density.base.ts

import type { DensityLevel } from "../theme/contract.js";

export const density = {
  default: "regular" as DensityLevel,
  scale: {
    compact: 0.875,
    regular: 1,
    comfortable: 1.125,
  } satisfies Record<DensityLevel, number>,
} as const;
