import * as ReactNative from "react-native";
import type { AdapterFor, CapabilityId } from "./types.js";

// What React Native core itself offers. Looked up on the namespace so a host without the member (web, test shims) simply
// has no fallback. Only members of `react-native` are used: no native package is imported.
export interface CoreHost {
  Vibration?: { vibrate(pattern?: number | number[]): void };
  Share?: { share(content: { message?: string; url?: string; title?: string }): Promise<{ action: string }>; dismissedAction?: string };
}

const cache = new Map<string, unknown>();

/**
 * The RN-core adapter for an id, or `undefined` when React Native core has nothing for it. Adapters are cached per id so
 * their identity is stable across renders. Haptics through `Vibration` ignores the impact style (fixed short pulses).
 */
export function coreFallback<K extends CapabilityId>(id: K, host: CoreHost = ReactNative as unknown as CoreHost): AdapterFor<K> | undefined {
  const cacheable = host === (ReactNative as unknown as CoreHost);
  if (cacheable && cache.has(id)) return cache.get(id) as AdapterFor<K> | undefined;
  let adapter: unknown;
  const { Vibration, Share } = host;
  if (id === "haptics" && typeof Vibration?.vibrate === "function") {
    const vibrate = (ms: number) => async () => Vibration.vibrate(ms);
    adapter = { id, status: "available", api: { impact: vibrate(10), notification: vibrate(30), selection: vibrate(5) } };
  } else if (id === "share" && typeof Share?.share === "function") {
    const dismissed = Share.dismissedAction ?? "dismissedAction";
    adapter = { id, status: "available", api: { share: async (content: object) => ((await Share.share(content)).action === dismissed ? "dismissed" : "shared") } };
  }
  if (cacheable) cache.set(id, adapter);
  return adapter as AdapterFor<K> | undefined;
}
