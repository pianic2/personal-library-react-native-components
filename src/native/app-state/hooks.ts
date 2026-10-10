import { useEffect, useMemo, useRef, useState } from "react";
import { useCapability } from "../core/CapabilityProvider.js";
import type { AppStateApi, AppStateValue } from "../core/types.js";
import { resolveFallbackAppState } from "./sources.js";

// Resolves the api once per adapter. ONLY an adapter whose status is exactly "noop" (nothing configured) falls back to
// the web/React Native source; an injected adapter with status "available" or "unavailable" is used as given (an
// "unavailable" one is the caller's explicit choice and keeps its own api).
// A throwing api (for example a denied permission in the mocks) must not crash the tree: reads degrade to "active" and
// subscribing to a no-op, so the app behaves as if it were always in the foreground.
function guard(api: AppStateApi): AppStateApi {
  return {
    getState() {
      try {
        return api.getState();
      } catch {
        return "active";
      }
    },
    subscribe(listener) {
      try {
        return api.subscribe(listener);
      } catch {
        return () => undefined;
      }
    },
  };
}

function useAppStateApi(): AppStateApi {
  const adapter = useCapability("appState");
  return useMemo(() => guard(adapter.status === "noop" ? resolveFallbackAppState() : adapter.api), [adapter]);
}

/** The current app state ("active", "background" or "inactive"); re-renders on change. SSR-safe: renders "active". */
export function useAppState(): AppStateValue {
  const api = useAppStateApi();
  const [state, setState] = useState<AppStateValue>(() => api.getState());
  useEffect(() => {
    setState(api.getState());
    return api.subscribe(setState);
  }, [api]);
  return state;
}

/** True while the app is in the foreground. */
export function useIsAppActive(): boolean {
  return useAppState() === "active";
}

function useTransition(match: (prev: AppStateValue, next: AppStateValue) => boolean, callback: () => void): void {
  const api = useAppStateApi();
  const cb = useRef(callback);
  cb.current = callback;
  const matcher = useRef(match);
  matcher.current = match;
  useEffect(() => {
    let prev = api.getState();
    return api.subscribe((next) => {
      const before = prev;
      prev = next;
      if (before !== next && matcher.current(before, next)) cb.current();
    });
  }, [api]);
}

/** Runs `callback` when the app moves from background/inactive to active. Not called on mount. */
export function useOnForeground(callback: () => void): void {
  useTransition((_, next) => next === "active", callback);
}

/** Runs `callback` when the app leaves active for background/inactive. Not called on mount. */
export function useOnBackground(callback: () => void): void {
  useTransition((prev, next) => prev === "active" && next !== "active", callback);
}
