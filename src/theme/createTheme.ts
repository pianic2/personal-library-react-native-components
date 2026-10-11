// src/theme/createTheme.ts

import { defaultTheme } from "./defaultTheme.js";
import type { Theme } from "./types.js";

type PlainObject = Record<string, unknown>;

/**
 * `T` with every nested object property optional. Arrays are kept whole because an array override replaces the array,
 * and numeric literal types are widened to `number` because the token scales are `as const` (an override such as
 * `radius.md: 13` is a valid number, not the literal `10`).
 */
export type DeepPartial<T> = T extends readonly unknown[]
  ? T
  : T extends (...args: never[]) => unknown
  ? T
  : T extends number
  ? number
  : T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

function isPlainObject(value: unknown): value is PlainObject {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isDev(): boolean {
  return (globalThis as { __DEV__?: boolean }).__DEV__ === true;
}

/** The kind compared by the strict merge: arrays, plain objects, null and the `typeof` of everything else. */
function kindOf(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (isPlainObject(value)) return "object";
  return typeof value;
}

function reportMismatch(path: string, expected: string, received: string): void {
  const message = `[ui/createTheme] override "${path}" must be ${expected} but received ${received}`;
  if (isDev()) throw new TypeError(message);
  console.warn(`${message}; ignored.`);
}

function mergeValue(targetValue: unknown, sourceValue: unknown, path: string): unknown {
  if (sourceValue === undefined) {
    return targetValue;
  }

  // An optional token that the base does not define yet (for example `variants`) takes the override as it is.
  if (targetValue === undefined || targetValue === null) {
    return sourceValue;
  }

  const expected = kindOf(targetValue);
  const received = kindOf(sourceValue);
  if (expected !== received) {
    reportMismatch(path, expected, received);
    return targetValue;
  }

  if (expected === "object") {
    return mergeLayer(targetValue as PlainObject, sourceValue as PlainObject, path);
  }

  // arrays and primitives: the override replaces the base value
  return sourceValue;
}

function mergeLayer<T extends PlainObject>(target: T, source: PlainObject | undefined, path = ""): T {
  if (!source) return target;

  const output: PlainObject = { ...target };

  Object.keys(source).forEach((key) => {
    // `output["__proto__"] = ...` would replace the prototype of the result instead of adding a token
    if (key === "__proto__") return;
    output[key] = mergeValue(target[key], source[key], path === "" ? key : `${path}.${key}`);
  });

  return output as T;
}

/**
 * Merges `layers` over `base` from left to right without mutating any of them (pure).
 *
 * - plain objects merge key by key; arrays replace the array; primitives replace the primitive;
 * - an `undefined` value never erases the value below it;
 * - a value of another kind than the one below it (an array where an object is expected, a string for a number, `null`)
 *   is a mismatch: it throws a `TypeError` in `__DEV__` and is ignored with a `console.warn` in production;
 * - a token that no lower layer defines is added as it is;
 * - a `__proto__` key in a layer is ignored.
 *
 * The result shares the untouched subtrees (and the arrays of the layers) with its inputs instead of copying them, so a
 * theme must be treated as immutable; nothing here freezes it.
 */
export function mergeThemes<T extends object>(base: T, ...layers: Array<DeepPartial<NoInfer<T>> | undefined>): T {
  return layers.reduce<PlainObject>(
    (merged, layer) => mergeLayer(merged, layer as PlainObject | undefined),
    base as unknown as PlainObject,
  ) as unknown as T;
}

export function createTheme(
  overrides?: DeepPartial<Theme>,
  baseTheme: Theme = defaultTheme
): Theme {
  return mergeThemes(baseTheme, overrides);
}
