import { useEffect, useRef, useState } from "react";
import type { AppReadyTask, SplashAdapter } from "./types.js";

export const DEFAULT_APP_READY_TIMEOUT_MS = 10_000;

/** The error given to `onError` when the tasks did not finish within `timeoutMs`. */
export class AppReadyTimeoutError extends Error {
  readonly timeoutMs: number;
  constructor(timeoutMs: number) {
    super(`App ready tasks did not finish within ${timeoutMs} ms`);
    this.name = "AppReadyTimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

export interface UseAppReadyOptions {
  /** Steps to wait for. They start together when the hook mounts; later changes of this array are ignored. */
  tasks?: AppReadyTask[];
  /** How long to wait, in milliseconds. Default 10000. A value that is not a finite number falls back to the default. */
  timeoutMs?: number;
  /** The splash screen to keep visible while waiting and hide once. Without it no splash api is called. */
  splash?: SplashAdapter;
  /** Called once if a task rejects or the timeout is reached. The app still becomes ready: it is never left blank. */
  onError?: (error: unknown) => void;
}

export interface AppReadyState {
  /** True once all tasks resolved, or after the first failure or timeout. */
  ready: boolean;
  /** The first task rejection or the `AppReadyTimeoutError`, or null. */
  error: unknown;
  timedOut: boolean;
}

function startTask(task: AppReadyTask): Promise<unknown> {
  try {
    return Promise.resolve(task());
  } catch (failure) {
    return Promise.reject(failure);
  }
}

/**
 * Waits for the tasks and hides the splash exactly once, on whichever comes first: all tasks resolved, a task rejected,
 * or the timeout. Failure and timeout still end in `ready: true` (with `error` set and `onError` called once), so a
 * broken task can not leave the app on a blank screen. `splash.preventAutoHide` is called once on mount. The splash is
 * hidden even when the component unmounts first; no state is set after unmount. With no tasks it is ready after the
 * first effect.
 */
export function useAppReady(options: UseAppReadyOptions = {}): AppReadyState {
  const [state, setState] = useState<AppReadyState>({ ready: false, error: null, timedOut: false });
  const latest = useRef(options);
  latest.current = options;

  useEffect(() => {
    let settled = false;
    let mounted = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const { tasks = [], splash } = latest.current;
    const requested = latest.current.timeoutMs;
    const timeoutMs = typeof requested === "number" && Number.isFinite(requested) ? Math.max(0, requested) : DEFAULT_APP_READY_TIMEOUT_MS;

    const settle = (outcome: { error: unknown; failed: boolean; timedOut: boolean }) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (outcome.failed) {
        try {
          latest.current.onError?.(outcome.error);
        } catch {
          // the callback must not keep the app from starting
        }
      }
      if (splash) void Promise.resolve(splash.hide()).catch(() => undefined);
      if (mounted) setState({ ready: true, error: outcome.failed ? outcome.error : null, timedOut: outcome.timedOut });
    };

    if (splash) void Promise.resolve(splash.preventAutoHide()).catch(() => undefined);
    timer = setTimeout(() => settle({ error: new AppReadyTimeoutError(timeoutMs), failed: true, timedOut: true }), timeoutMs);
    Promise.all(tasks.map(startTask)).then(
      () => settle({ error: null, failed: false, timedOut: false }),
      (failure: unknown) => settle({ error: failure ?? new Error("App ready task failed"), failed: true, timedOut: false })
    );

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  return state;
}
