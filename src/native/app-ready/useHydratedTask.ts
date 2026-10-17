import { useCallback, useEffect, useRef } from "react";
import type { AppReadyTask } from "./types.js";

/**
 * A task for `useAppReady` / `AppReadyGate` that resolves once every flag is true, for example the `hydrated` flags of
 * `useStoredState` (theme or preference storage). The returned function is stable. The gate runs its tasks once, when
 * it mounts, so call this hook in the component that renders the gate (or above it).
 *
 * @example
 * const theme = useStoredState("theme", "light");
 * const hydrated = useHydratedTask(theme.hydrated);
 * <AppReadyGate tasks={[hydrated]}>…</AppReadyGate>
 */
export function useHydratedTask(...flags: boolean[]): AppReadyTask {
  const done = flags.every(Boolean);
  const state = useRef({ done, waiting: [] as Array<() => void> });
  state.current.done = done;

  useEffect(() => {
    if (!done) return;
    const waiting = state.current.waiting;
    state.current.waiting = [];
    for (const resolve of waiting) resolve();
  }, [done]);

  return useCallback<AppReadyTask>(
    () => (state.current.done ? Promise.resolve() : new Promise<void>((resolve) => void state.current.waiting.push(resolve))),
    []
  );
}
