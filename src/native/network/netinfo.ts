// Structural adapter for an injected `@react-native-community/netinfo` module (never imported here).
import type { NetworkApi, NetworkState } from "../core/types.js";
import { createCachedNetwork, pushFromRead } from "./cache.js";
import { toBool, toType } from "./map.js";

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
  return createCachedNetwork((push) => {
    let active = true;
    module.fetch().then(
      (s) => {
        if (active) pushFromRead(push, fromNetInfo(s));
      },
      () => undefined
    );
    let off: () => void;
    try {
      off = module.addEventListener((s) => {
        if (active) push(fromNetInfo(s));
      });
    } catch (error) {
      active = false; // the in-flight read must not write into a cache that start() is about to reset
      throw error;
    }
    return () => {
      active = false;
      off();
    };
  });
}
