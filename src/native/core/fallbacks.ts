import * as ReactNative from "react-native";
import type { AdapterFor, CapabilityId } from "./types.js";

// What React Native core itself offers. Looked up on the namespace so a host without the member (web, test shims) simply
// has no fallback. Only members of `react-native` are used: no native package is imported.
const core = ReactNative as unknown as {
  Vibration?: { vibrate(pattern?: number | number[]): void };
  Share?: { share(content: { message?: string; url?: string; title?: string }): Promise<{ action: string }> };
};

/** The RN-core adapter for an id, or `undefined` when React Native core has nothing for it. */
export function coreFallback<K extends CapabilityId>(id: K): AdapterFor<K> | undefined {
  if (id === "haptics" && typeof core.Vibration?.vibrate === "function") {
    const vibrate = (ms: number) => async () => core.Vibration?.vibrate(ms);
    const api = { impact: vibrate(10), notification: vibrate(30), selection: vibrate(5) };
    return { id, status: "available", api } as unknown as AdapterFor<K>;
  }
  if (id === "share" && typeof core.Share?.share === "function") {
    const api = { share: async (content: object) => ((await core.Share?.share(content))?.action === "dismissedAction" ? "dismissed" : "shared") };
    return { id, status: "available", api } as unknown as AdapterFor<K>;
  }
  return undefined;
}
