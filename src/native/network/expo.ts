// Structural adapter for an injected `expo-network` module (expo-network is never imported here).
import type { NetworkApi, NetworkState } from "../core/types.js";
import { createCachedNetwork, pushFromRead } from "./cache.js";
import { toBool, toType } from "./map.js";

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
  return createCachedNetwork((push) => {
    let active = true;
    module.getNetworkStateAsync().then(
      (s) => {
        if (active) pushFromRead(push, fromExpo(s));
      },
      () => undefined
    );
    let sub: { remove(): void } | undefined;
    try {
      sub = module.addNetworkStateListener?.((s) => {
        if (active) push(fromExpo(s));
      });
    } catch (error) {
      active = false; // the in-flight read must not write into a cache that start() is about to reset
      throw error;
    }
    return () => {
      active = false;
      sub?.remove();
    };
  });
}
