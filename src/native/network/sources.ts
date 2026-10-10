// Network sources: the web fallback used when no adapter is injected, plus structural adapters for expo-network and
// @react-native-community/netinfo. No expo-*, no netinfo and no native import: the app injects the modules.
import type { NetworkApi, NetworkState, NetworkType } from "../core/types.js";

/** The state reported when nothing can tell: unknown (null), never "offline". */
export const UNKNOWN_NETWORK: NetworkState = { isConnected: null, isInternetReachable: null, type: "unknown" };

/** The slice of `navigator` and `window` the web mapping needs. */
export interface OnlineHost {
  navigator?: { onLine?: boolean };
  addEventListener(type: "online" | "offline", listener: () => void): void;
  removeEventListener(type: "online" | "offline", listener: () => void): void;
}

const legacyStatus = (state: NetworkState) => async () => ({ connected: state.isConnected });

/** A synchronous cache with listeners: the shape every injected module is adapted to. */
function createCachedNetwork(initial: NetworkState, start: (push: (next: NetworkState) => void) => () => void): NetworkApi {
  let current = initial;
  const listeners = new Set<(state: NetworkState) => void>();
  let stop: (() => void) | undefined;
  const push = (next: NetworkState) => {
    current = next;
    for (const l of [...listeners]) l(next);
  };
  return {
    getStatus: async () => ({ connected: current.isConnected }),
    getState: () => current,
    subscribe(listener) {
      listeners.add(listener);
      if (listeners.size === 1) stop = start(push);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          stop?.();
          stop = undefined;
        }
      };
    },
  };
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

const TYPES: readonly NetworkType[] = ["wifi", "cellular", "ethernet", "bluetooth", "vpn", "other", "none", "unknown"];
const toType = (raw: unknown): NetworkType => {
  const t = typeof raw === "string" ? raw.toLowerCase() : "";
  return (TYPES as readonly string[]).includes(t) ? (t as NetworkType) : "unknown";
};
const toBool = (v: unknown): boolean | null => (typeof v === "boolean" ? v : null);

/** The slice of `expo-network` the adapter needs (structural: expo-network is never imported here). */
export interface ExpoNetworkModuleLike {
  getNetworkStateAsync(): Promise<{ isConnected?: boolean; isInternetReachable?: boolean; type?: string }>;
  addNetworkStateListener?(
    listener: (state: { isConnected?: boolean; isInternetReachable?: boolean; type?: string }) => void
  ): { remove(): void };
}

const fromExpo = (s: { isConnected?: boolean; isInternetReachable?: boolean; type?: string }): NetworkState => ({
  isConnected: toBool(s.isConnected),
  isInternetReachable: toBool(s.isInternetReachable),
  type: toType(s.type),
});

/**
 * Wraps an injected `expo-network` module. The state starts unknown (null) until the first read resolves; a rejected read
 * keeps it unknown. Without `addNetworkStateListener` the state is read once per first subscriber.
 */
export function createExpoNetwork(module: ExpoNetworkModuleLike): NetworkApi {
  return createCachedNetwork(UNKNOWN_NETWORK, (push) => {
    let active = true;
    module.getNetworkStateAsync().then(
      (s) => {
        if (active) push(fromExpo(s));
      },
      () => undefined
    );
    const sub = module.addNetworkStateListener?.((s) => {
      if (active) push(fromExpo(s));
    });
    return () => {
      active = false;
      sub?.remove();
    };
  });
}

/** The slice of `@react-native-community/netinfo` the adapter needs. */
export interface NetInfoModuleLike {
  fetch(): Promise<{ isConnected: boolean | null; isInternetReachable: boolean | null; type?: string }>;
  addEventListener(
    listener: (state: { isConnected: boolean | null; isInternetReachable: boolean | null; type?: string }) => void
  ): () => void;
}

const fromNetInfo = (s: { isConnected: boolean | null; isInternetReachable: boolean | null; type?: string }): NetworkState => ({
  isConnected: toBool(s.isConnected),
  isInternetReachable: toBool(s.isInternetReachable),
  type: toType(s.type),
});

/** Wraps an injected NetInfo module; same unknown-until-read behaviour as the expo adapter. */
export function createNetInfoNetwork(module: NetInfoModuleLike): NetworkApi {
  return createCachedNetwork(UNKNOWN_NETWORK, (push) => {
    let active = true;
    module.fetch().then(
      (s) => {
        if (active) push(fromNetInfo(s));
      },
      () => undefined
    );
    const off = module.addEventListener((s) => {
      if (active) push(fromNetInfo(s));
    });
    return () => {
      active = false;
      off();
    };
  });
}

const inert: NetworkApi = { getStatus: legacyStatus(UNKNOWN_NETWORK), getState: () => UNKNOWN_NETWORK, subscribe: () => () => undefined };

/** Fallback when no adapter was injected: the web mapping when `window` exists, else an inert always-unknown api. */
export function resolveFallbackNetwork(): NetworkApi {
  const host = (globalThis as { window?: Partial<OnlineHost> & { navigator?: { onLine?: boolean } } }).window;
  const nav = (globalThis as { navigator?: { onLine?: boolean } }).navigator;
  if (host && typeof host.addEventListener === "function" && typeof host.removeEventListener === "function")
    return createWebNetwork({ navigator: host.navigator ?? nav, addEventListener: host.addEventListener.bind(host), removeEventListener: host.removeEventListener.bind(host) } as OnlineHost);
  return inert;
}
