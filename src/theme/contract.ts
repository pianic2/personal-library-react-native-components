// src/theme/contract.ts
// Theme contract v2 helper types (ADR 0004).

import type { ThemeMode } from "./types.js";

/** User-facing theme choice. "system" follows the OS; resolved to a ThemeMode. */
export type ThemePreference = ThemeMode | "system";

/** Named theme preset identifier carried by a resolved theme. */
export type ThemePreset = "base" | (string & {});

/** Density levels supported by the density token layer. */
export type DensityLevel = "compact" | "regular" | "comfortable";

/** Recursive partial used for typed theme overrides. */
export type DeepPartial<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepPartial<U>>
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T;
