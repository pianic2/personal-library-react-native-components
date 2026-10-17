import React from "react";
import { useAppReady } from "./useAppReady.js";
import type { UseAppReadyOptions } from "./useAppReady.js";

export interface AppReadyGateProps extends UseAppReadyOptions {
  /** Rendered once the app is ready (including after a failure or a timeout). */
  children?: React.ReactNode;
  /** Rendered while waiting. Default: nothing, so the native splash stays visible. */
  fallback?: React.ReactNode;
}

/**
 * Renders `fallback` until the `tasks` are done, then `children`, and hides the splash once (see `useAppReady`). A task
 * failure or the timeout calls `onError` and still renders `children`. With no `splash` it calls no splash api.
 * The tasks run once, on mount; the props are read at that time.
 */
export function AppReadyGate({ children, fallback = null, ...options }: AppReadyGateProps): React.JSX.Element {
  const { ready } = useAppReady(options);
  return <>{ready ? children : fallback}</>;
}
