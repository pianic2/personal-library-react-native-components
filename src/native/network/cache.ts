// A synchronous cache with listeners: the shape every injected native module is adapted to.
import type { NetworkApi, NetworkState } from "../core/types.js";

export const UNKNOWN_NETWORK: NetworkState = { isConnected: null, isInternetReachable: null, type: "unknown" };

/**
 * `start(push)` begins talking to the native module (called by the FIRST subscriber) and returns its stop function
 * (called when the LAST subscriber leaves). Rules:
 * - the cache starts, and is reset on the last unsubscribe, to the unknown state (null, never "offline"), so a stale
 *   value from an earlier session is never shown after a restart;
 * - a `start` that throws leaves no subscriber behind and the next subscribe tries again; the error is rethrown;
 * - every listener is called even if one throws; the first error is rethrown after the loop;
 * - the same function subscribed twice is two subscriptions.
 * `getStatus` reflects the cache: without a subscriber it is `{ connected: null }`.
 */
export function createCachedNetwork(start: (push: (next: NetworkState) => void) => () => void): NetworkApi {
  let current = UNKNOWN_NETWORK;
  const subs = new Set<{ fn: (state: NetworkState) => void }>();
  let stop: (() => void) | undefined;
  const push = (next: NetworkState) => {
    current = next;
    let failed = false;
    let firstError: unknown;
    for (const sub of [...subs]) {
      if (!subs.has(sub)) continue;
      try {
        sub.fn(next);
      } catch (error) {
        if (!failed) {
          failed = true;
          firstError = error;
        }
      }
    }
    if (failed) throw firstError;
  };
  return {
    getStatus: async () => ({ connected: current.isConnected }),
    getState: () => current,
    subscribe(listener) {
      const sub = { fn: listener };
      subs.add(sub);
      if (subs.size === 1) {
        try {
          stop = start(push);
        } catch (error) {
          subs.delete(sub);
          current = UNKNOWN_NETWORK;
          throw error;
        }
      }
      return () => {
        if (!subs.delete(sub)) return;
        if (subs.size === 0) {
          const s = stop;
          stop = undefined;
          current = UNKNOWN_NETWORK;
          s?.();
        }
      };
    },
  };
}

/**
 * For the one-shot asynchronous read: a listener error must not become an unhandled rejection, so it is reported in
 * development only. (Errors from the native event callback path propagate to the module, see `createCachedNetwork`.)
 */
export function pushFromRead(push: (next: NetworkState) => void, next: NetworkState): void {
  try {
    push(next);
  } catch (error) {
    if ((globalThis as { __DEV__?: boolean }).__DEV__ === true && typeof console !== "undefined") {
      console.warn("[network] a listener threw while the first state was delivered:", error);
    }
  }
}
