// Network sources used when no adapter is injected (web mapping and the inert fallback). No expo-*, netinfo or native import.
import type { NetworkApi, NetworkState } from "../core/types.js";
import { UNKNOWN_NETWORK } from "./cache.js";

export { UNKNOWN_NETWORK };

/** The slice of `navigator` and `window` the web mapping needs. */
export interface OnlineHost {
  navigator?: { onLine?: boolean };
  addEventListener(type: "online" | "offline", listener: () => void): void;
  removeEventListener(type: "online" | "offline", listener: () => void): void;
}

/** Web mapping: `navigator.onLine` plus the window `online`/`offline` events. A missing `onLine` is unknown (null). */
export function createWebNetwork(host: OnlineHost): NetworkApi {
  const read = (): NetworkState => {
    const online = host.navigator?.onLine;
    if (typeof online !== "boolean") return UNKNOWN_NETWORK;
    // The browser cannot prove reachability: online is "connected, reachability unknown", offline is certain.
    return { isConnected: online, isInternetReachable: online ? null : false, type: online ? "unknown" : "none" };
  };
  return {
    // Live: web and the mock read the current state on every call (the cached native adapters reflect their cache).
    getStatus: async () => ({ connected: read().isConnected }),
    getState: read,
    subscribe(listener) {
      const onChange = () => listener(read());
      host.addEventListener("online", onChange);
      host.addEventListener("offline", onChange);
      return () => {
        host.removeEventListener("online", onChange);
        host.removeEventListener("offline", onChange);
      };
    },
  };
}

const inert: NetworkApi = { getStatus: async () => ({ connected: null }), getState: () => UNKNOWN_NETWORK, subscribe: () => () => undefined };

/** Fallback when no adapter was injected: the web mapping when `window` exists, else an inert always-unknown api. */
export function resolveFallbackNetwork(): NetworkApi {
  const host = (globalThis as { window?: Partial<OnlineHost> & { navigator?: { onLine?: boolean } } }).window;
  const nav = (globalThis as { navigator?: { onLine?: boolean } }).navigator;
  if (host && typeof host.addEventListener === "function" && typeof host.removeEventListener === "function")
    return createWebNetwork({
      navigator: host.navigator ?? nav,
      addEventListener: host.addEventListener.bind(host),
      removeEventListener: host.removeEventListener.bind(host),
    } as OnlineHost);
  return inert;
}
