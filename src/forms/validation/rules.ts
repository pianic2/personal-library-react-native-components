import type { Rule } from "./types.js";

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function lengthOf(value: unknown): number {
  return typeof value === "string" || Array.isArray(value) ? value.length : String(value).length;
}

/** Fails for `undefined`, `null`, blank strings and empty arrays. `0` and `false` are values. */
export const required =
  (msg?: string): Rule =>
  (value, { message }) =>
    isEmpty(value) ? (msg ?? message("validation.required")) : undefined;

/** Fails when a non-empty value is shorter than `n`. */
export const minLength =
  (n: number, msg?: string): Rule =>
  (value, { message }) =>
    isEmpty(value) || lengthOf(value) >= n ? undefined : (msg ?? message("validation.minLength", { min: n }));

/** Fails when a value is longer than `n`. */
export const maxLength =
  (n: number, msg?: string): Rule =>
  (value, { message }) =>
    isEmpty(value) || lengthOf(value) <= n ? undefined : (msg ?? message("validation.maxLength", { max: n }));

/** Fails when a non-empty string does not match `re` (a global or sticky `re` is tested statelessly). */
export const pattern =
  (re: RegExp, msg?: string): Rule =>
  (value, { message }) => {
    if (isEmpty(value)) return undefined;
    const safe = re.global || re.sticky ? new RegExp(re.source, re.flags.replace(/[gy]/g, "")) : re;
    return safe.test(String(value)) ? undefined : (msg ?? message("validation.pattern"));
  };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Fails when a non-empty value is not shaped like `name@domain.tld`. */
export const email =
  (msg?: string): Rule =>
  (value, { message }) =>
    isEmpty(value) || EMAIL.test(String(value).trim()) ? undefined : (msg ?? message("validation.email"));

function numeric(value: unknown): number {
  return typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : Number.NaN;
}

/**
 * Fails when a non-empty value is not a number or is below `n`. The catalog has no dedicated range key yet, so the
 * default text is `validation.number`; pass `msg` for a specific one.
 */
export const min =
  (n: number, msg?: string): Rule =>
  (value, { message }) => {
    if (isEmpty(value)) return undefined;
    const v = numeric(value);
    return v >= n ? undefined : (msg ?? message("validation.number"));
  };

/** Fails when a non-empty value is not a number or is above `n` (see `min` for the default text). */
export const max =
  (n: number, msg?: string): Rule =>
  (value, { message }) => {
    if (isEmpty(value)) return undefined;
    const v = numeric(value);
    return v <= n ? undefined : (msg ?? message("validation.number"));
  };

/**
 * Fails when the value differs from the value at `otherPath` (confirm password). The catalog has no dedicated key yet,
 * so the default text is `validation.pattern`; pass `msg` for a specific one.
 */
export const matches =
  (otherPath: string, msg?: string): Rule<unknown> =>
  (value, { values, message }) => {
    if (isEmpty(value) && isEmpty(readPath(values, otherPath))) return undefined;
    return Object.is(value, readPath(values, otherPath)) ? undefined : (msg ?? message("validation.pattern"));
  };

/** Wraps any check. Return the error message, or `undefined` when valid; may be async. */
export const custom = <T = unknown>(fn: Rule<T>): Rule<T> => fn;

/** Reads a dot path (`"address.city"`) from an object; `undefined` when a step is missing. */
export function readPath(source: unknown, path: string): unknown {
  let current = source;
  for (const key of path.split(".")) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}
