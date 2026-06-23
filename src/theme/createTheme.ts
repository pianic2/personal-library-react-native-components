// src/theme/createTheme.ts

import { defaultTheme } from "./defaultTheme";
import type { Theme } from "./types";

function deepMerge<T>(target: T, source?: Partial<T>): T {
  if (!source) return target;

  const output = { ...target } as any;

  Object.keys(source).forEach((key) => {
    const value = (source as any)[key];

    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      output[key] = deepMerge(output[key], value);
    } else if (value !== undefined) {
      output[key] = value;
    }
  });

  return output;
}

export function createTheme(
  overrides?: Partial<Theme>,
  baseTheme: Theme = defaultTheme
): Theme {
  return deepMerge(baseTheme, overrides);
}
