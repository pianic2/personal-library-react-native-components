import { useCallback, useEffect, useRef, useState } from "react";

export interface UseControllableStateOptions<T> {
  /** Controlled value. When it is not `undefined` the hook never mutates its own state. */
  value?: T;
  /** Initial value used while uncontrolled. */
  defaultValue: T;
  /** Called with the next value, only when it differs from the current one (`Object.is`). */
  onChange?: (next: T) => void;
}

export type ControllableStateSetter<T> = (next: T | ((previous: T) => T)) => void;

/**
 * Single implementation of the controlled/uncontrolled value pattern.
 *
 * - Controlled (`value !== undefined`): the returned value is always `value`; the setter only calls `onChange`.
 * - Uncontrolled: the setter updates internal state and calls `onChange`.
 * - `onChange` fires only on a real change and functional updates receive the current value.
 * - In `__DEV__` it warns once per switch when a component changes between controlled and uncontrolled.
 *
 * The setter has a stable identity.
 */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: UseControllableStateOptions<T>): [T, ControllableStateSetter<T>] {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<T>(defaultValue);
  const current = isControlled ? (value as T) : internal;

  const latest = useRef({ current, isControlled, onChange });
  latest.current = { current, isControlled, onChange };

  const wasControlled = useRef(isControlled);
  useEffect(() => {
    if (typeof __DEV__ !== "undefined" && __DEV__ && wasControlled.current !== isControlled) {
      console.warn(
        `useControllableState: a component changed from ${wasControlled.current ? "controlled" : "uncontrolled"} to ${
          isControlled ? "controlled" : "uncontrolled"
        }. Decide between controlled and uncontrolled for the lifetime of the component.`
      );
    }
    wasControlled.current = isControlled;
  }, [isControlled]);

  const setValue = useCallback<ControllableStateSetter<T>>((next) => {
    const state = latest.current;
    const resolved = typeof next === "function" ? (next as (previous: T) => T)(state.current) : next;
    if (Object.is(resolved, state.current)) return;
    if (!state.isControlled) {
      latest.current = { ...state, current: resolved };
      setInternal(resolved);
    }
    state.onChange?.(resolved);
  }, []);

  return [current, setValue];
}
