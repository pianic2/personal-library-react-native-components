// Typed usage of the network hooks and adapters. Compiled by tsconfig.tests.json.
import type { NetworkApi, NetworkState, NetworkType } from "../../../src/native/core/types.js";
import { createExpoNetwork, createNetInfoNetwork, createWebNetwork, useIsOnline, useNetworkStatus } from "../../../src/native/network/index.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

export type HookState = Expect<Equal<ReturnType<typeof useNetworkStatus>, NetworkState>>;
export type HookOnline = Expect<Equal<ReturnType<typeof useIsOnline>, boolean | null>>;
export type UnknownIsNull = Expect<Equal<NetworkState["isConnected"], boolean | null>>;
export type Types = Expect<Equal<NetworkType, "wifi" | "cellular" | "ethernet" | "bluetooth" | "vpn" | "other" | "none" | "unknown">>;
export type Adapters = Expect<Equal<ReturnType<typeof createExpoNetwork>, NetworkApi>>;

// A realistic expo-network-shaped object is assignable without casts.
declare const expoLike: {
  getNetworkStateAsync(): Promise<{ type?: string; isConnected?: boolean; isInternetReachable?: boolean }>;
  addNetworkStateListener(l: (s: { type?: string; isConnected?: boolean; isInternetReachable?: boolean }) => void): { remove(): void };
};
export const fromExpo = createExpoNetwork(expoLike);
declare const netInfoLike: {
  fetch(): Promise<{ type: string; isConnected: boolean | null; isInternetReachable: boolean | null }>;
  addEventListener(l: (s: { type: string; isConnected: boolean | null; isInternetReachable: boolean | null }) => void): () => void;
};
export const fromNetInfo = createNetInfoNetwork(netInfoLike);
export const fromWeb = createWebNetwork({ addEventListener: () => undefined, removeEventListener: () => undefined });
