import { useEffect, useMemo, useState } from "react";
import { useCapability } from "../core/CapabilityProvider.js";
import type { NetworkApi, NetworkState } from "../core/types.js";
import { UNKNOWN_NETWORK } from "./cache.js";
import { resolveFallbackNetwork } from "./sources.js";

// Only an adapter whose status is exactly "noop" (nothing configured) falls back to the web source; an injected adapter
// ("available" or "unavailable") is used as given. A throwing api degrades to the unknown state (never "offline"); only
// `getState` and `subscribe` are guarded, an error thrown by a listener or by the returned unsubscribe is not.
function warnSwallowed(where: string, error: unknown): void {
  if ((globalThis as { __DEV__?: boolean }).__DEV__ === true && typeof console !== "undefined") {
    console.warn(`[network] ${where} threw and was ignored (degrading to unknown):`, error);
  }
}

function guard(api: NetworkApi): Pick<NetworkApi, "getState" | "subscribe"> {
  return {
    getState() {
      try {
        return api.getState();
      } catch (error) {
        warnSwallowed("getState", error);
        return UNKNOWN_NETWORK;
      }
    },
    subscribe(listener) {
      try {
        return api.subscribe(listener);
      } catch (error) {
        warnSwallowed("subscribe", error);
        return () => undefined;
      }
    },
  };
}

function useNetworkApi() {
  const adapter = useCapability("network");
  return useMemo(() => guard(adapter.status === "noop" ? resolveFallbackNetwork() : adapter.api), [adapter]);
}

const same = (a: NetworkState, b: NetworkState) =>
  a.isConnected === b.isConnected && a.isInternetReachable === b.isInternetReachable && a.type === b.type;

/**
 * The network state; re-renders on change. Unknown is `null` (never `false`). SSR/hydration-safe: the first render is
 * always the unknown state (the server has no connectivity), the effect then reads the real one. Result identity is
 * stable while the three fields are unchanged.
 */
export function useNetworkStatus(): NetworkState {
  const api = useNetworkApi();
  const [state, setState] = useState<NetworkState>(UNKNOWN_NETWORK);
  useEffect(() => {
    const set = (next: NetworkState) => setState((prev) => (same(prev, next) ? prev : next));
    set(api.getState());
    return api.subscribe(set);
  }, [api]);
  return state;
}

/** `true` online, `false` offline, `null` unknown. An unknown state is not offline. */
export function useIsOnline(): boolean | null {
  return useNetworkStatus().isConnected;
}
