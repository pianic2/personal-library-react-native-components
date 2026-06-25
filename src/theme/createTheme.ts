// src/theme/createTheme.ts

import { defaultTheme } from "./defaultTheme";
import type { Theme } from "./types";

type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function mergeValue(targetValue: unknown, sourceValue: unknown): unknown {
  if (sourceValue === undefined) {
    return targetValue;
  }

  if (isPlainObject(targetValue)) {
    if (!isPlainObject(sourceValue)) {
      return targetValue;
    }

    return deepMerge(targetValue, sourceValue);
  }

  return sourceValue;
}

function deepMerge<T extends PlainObject>(target: T, source?: PlainObject): T {
  if (!source) return target;

  const output: PlainObject = { ...target };

  Object.keys(source).forEach((key) => {
    output[key] = mergeValue(target[key], source[key]);
  });

  return output as T;
}

export function createTheme(
  overrides?: Partial<Theme>,
  baseTheme: Theme = defaultTheme
): Theme {
  return deepMerge(
    baseTheme as unknown as PlainObject,
    overrides as PlainObject | undefined
  ) as unknown as Theme;
}
