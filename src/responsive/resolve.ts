import type { Breakpoint } from "../hooks/useBreakpoint.js";

/** A plain value, or a map from breakpoint to value (mobile-first: a key applies up to the next defined key). */
export type ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>;

const ORDER: readonly Breakpoint[] = ["base", "sm", "md", "lg", "xl"];

function isResponsiveMap<T>(value: ResponsiveValue<T>): value is Partial<Record<Breakpoint, T>> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) return false;
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every((key) => (ORDER as readonly string[]).includes(key));
}

/**
 * Resolves a responsive value for breakpoint `bp`. A plain value is returned unchanged. A map (a plain object whose keys
 * are all breakpoint names) resolves to the value of `bp` or, when that key is missing, of the nearest smaller defined
 * key (mobile-first); a key set to `undefined` counts as missing. When no key at or below `bp` is defined the result is
 * `undefined`. The result is the stored value itself, so it keeps its identity while the inputs are unchanged.
 *
 * A plain object value (for example a style object) is returned as is unless every one of its keys is a breakpoint name;
 * a value of that exact shape is read as a map. An empty object `{}` is a plain value (returned as is, not `undefined`), and
 * an object from another realm (iframe, vm context) has a different `Object.prototype` and is also returned as is.
 */
export function resolveResponsive<T>(value: ResponsiveValue<T>, bp: Breakpoint): T | undefined {
  if (!isResponsiveMap(value)) return value as T;
  for (let i = ORDER.indexOf(bp); i >= 0; i -= 1) {
    const candidate = value[ORDER[i]!];
    if (candidate !== undefined) return candidate;
  }
  return undefined;
}
