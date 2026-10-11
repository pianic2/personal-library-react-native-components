import type { AdapterFor, CapabilityAdapters, CapabilityId, CapabilityMap } from "./types.js";

const none = async (): Promise<void> => undefined;

const noopApis: CapabilityMap = {
  clipboard: { getString: async () => "", setString: none },
  haptics: { impact: none, notification: none, selection: none },
  share: { share: async () => "dismissed" },
  storage: { getItem: async () => null, setItem: none, removeItem: none },
  biometric: { isAvailable: async () => false, authenticate: async () => false },
  network: {
    getStatus: async () => ({ connected: null }),
    getState: () => ({ isConnected: null, isInternetReachable: null, type: "unknown" }),
    subscribe: () => () => undefined,
  },
  appState: { getState: () => "active", subscribe: () => () => undefined },
};

/** The api of a capability that does nothing and never throws. */
export function noopApi<K extends CapabilityId>(id: K): CapabilityMap[K] {
  return noopApis[id] as CapabilityMap[K];
}

/** One `noop` adapter per capability: the last step of the resolution order. */
export function createNoopAdapters(): Required<CapabilityAdapters> {
  const adapters: Record<string, unknown> = {};
  for (const id of Object.keys(noopApis) as CapabilityId[]) adapters[id] = { id, status: "noop", api: noopApis[id] } satisfies AdapterFor<typeof id>;
  return adapters as Required<CapabilityAdapters>;
}
