// Mock adapters for every capability id, with jest-free call recording. The `defaults` table is typed against
// CapabilityMap, so adding a capability there fails typecheck here until it is mocked.
import type { AccessibilityPreferences, AdapterFor, CapabilityAdapters, CapabilityId, CapabilityMap, CapabilityStatus, NetworkState } from "../core/types.js";
import {
  createEmitter,
  createFakeClock,
  type Emitter,
  type FakeAppState,
  type FakeClock,
  type FakeKeyboard,
  type FakePermission,
} from "./emitters.js";

export interface MockCall {
  id: CapabilityId;
  method: string;
  args: readonly unknown[];
}

export type MockOverrides = { [K in CapabilityId]?: Partial<CapabilityMap[K]> };

export interface MockState {
  network: Emitter<{ connected: boolean | null }>;
  appState: Emitter<FakeAppState>;
  accessibility: Emitter<AccessibilityPreferences>;
  keyboard: Emitter<FakeKeyboard>;
  permissions: Record<CapabilityId, FakePermission>;
  storage: Map<string, string>;
  clipboard: { value: string };
}

export interface MockAdapterSet {
  /** One adapter per capability id, ready for `CapabilityProvider`. */
  adapters: { [K in CapabilityId]: AdapterFor<K> };
  /** Every api call so far, in order. */
  calls: MockCall[];
  callsOf(id: CapabilityId, method?: string): MockCall[];
  /**
   * Clears recorded calls and restores defaults (network, app state, keyboard, permissions, storage, clipboard, clock)
   * silently: no subscriber is notified and all emitter listeners are detached.
   */
  reset(): void;
  clock: FakeClock;
  state: MockState;
  setNetwork(connected: boolean | null): void;
  setAppState(next: FakeAppState): void;
  /** Merges `patch` into the accessibility preferences and notifies subscribers (a new snapshot object). */
  setAccessibility(patch: Partial<AccessibilityPreferences>): void;
  setKeyboard(next: FakeKeyboard | boolean): void;
  setPermission(id: CapabilityId, permission: FakePermission): void;
}

type Ctx = { state: MockState };
const run = async <T,>(fn: () => T): Promise<Awaited<T>> => await fn();
type Defaults = { [K in CapabilityId]: (ctx: Ctx) => CapabilityMap[K] };

// `connected` null is unknown; false is offline (type "none"); true is online with an unknown transport.
const toNetworkState = (v: { connected: boolean | null }): NetworkState => ({
  isConnected: v.connected,
  isInternetReachable: v.connected,
  type: v.connected === false ? "none" : "unknown",
});

// Permission rule: when a capability is `denied`, EVERY method of that capability (defaults and overrides, biometric
// included) records the call and then rejects with `permission denied: <id>`; the implementation is not run.
// Exception: a synchronous method (`syncMethods`: appState, accessibility and network getState/getPreferences/subscribe) cannot
// reject, so it records the call and then THROWS `permission denied: <id>` synchronously.
// Typed `{ [K in CapabilityId]: ... }`: a missing key is a compile error.
const defaults: Defaults = {
  clipboard: (ctx) => ({
    getString: () => run(() => ctx.state.clipboard.value),
    setString: (value) =>
       run(() => {
        ctx.state.clipboard.value = value;
      }),
  }),
  haptics: (ctx) => ({
    impact: () =>  run(() => undefined),
    notification: () =>  run(() => undefined),
    selection: () =>  run(() => undefined),
  }),
  share: (ctx) => ({ share: () =>  run(() => "shared" as const) }),
  storage: (ctx) => ({
    getItem: (key) =>  run(() => ctx.state.storage.get(key) ?? null),
    setItem: (key, value) =>
       run(() => {
        ctx.state.storage.set(key, value);
      }),
    removeItem: (key) =>
       run(() => {
        ctx.state.storage.delete(key);
      }),
  }),
  biometric: (ctx) => ({
    isAvailable: () =>  run(() => true),
    authenticate: () => run(() => true),
  }),
  // Synchronous api: a denied permission throws synchronously (a sync method cannot reject), see the rule above.
  appState: (ctx) => ({
    getState: () => ctx.state.appState.get(),
    subscribe: (listener) => ctx.state.appState.subscribe(listener),
  }),
  accessibility: (ctx) => ({
    getPreferences: () => ctx.state.accessibility.get(),
    subscribe: (listener) => ctx.state.accessibility.subscribe(listener),
  }),
  // getStatus is asynchronous; getState and subscribe are synchronous (see `syncMethods`).
  network: (ctx) => ({
    getStatus: () => run(() => ({ ...ctx.state.network.get() })),
    getState: () => toNetworkState(ctx.state.network.get()),
    subscribe: (listener) => ctx.state.network.subscribe((v) => listener(toNetworkState(v))),
  }),
};

/** Methods that are synchronous: a denied permission makes them throw instead of rejecting. */
const syncMethods: { readonly [K in CapabilityId]?: ReadonlySet<string> } = {
  appState: new Set(["getState", "subscribe"]),
  accessibility: new Set(["getPreferences", "subscribe"]),
  network: new Set(["getState", "subscribe"]),
};

const ids = Object.keys(defaults) as CapabilityId[];

const defaultPreferences = (): AccessibilityPreferences => ({
  reduceMotion: false,
  reduceTransparency: false,
  screenReader: false,
  boldText: false,
  grayscale: false,
  invertColors: false,
  fontScale: 1,
});

function initialState(): MockState {
  return {
    network: createEmitter<{ connected: boolean | null }>({ connected: true }),
    appState: createEmitter<FakeAppState>("active"),
    accessibility: createEmitter<AccessibilityPreferences>(defaultPreferences()),
    keyboard: createEmitter<FakeKeyboard>({ visible: false, height: 0 }),
    permissions: Object.fromEntries(ids.map((id) => [id, "granted"])) as Record<CapabilityId, FakePermission>,
    storage: new Map(),
    clipboard: { value: "" },
  };
}

export function createMockAdapters(overrides: MockOverrides = {}, status: CapabilityStatus = "available"): MockAdapterSet {
  const state = initialState();
  const clock = createFakeClock();
  const calls: MockCall[] = [];
  const ctx: Ctx = { state };

  const adapters = {} as Record<string, unknown>;
  for (const id of ids) {
    for (const [method, impl] of Object.entries((overrides[id] as object | undefined) ?? {}))
      if (impl === undefined) throw new Error(`createMockAdapters: override ${id}.${method} is undefined; omit it to keep the default`);
    const api = { ...(defaults[id](ctx) as object), ...((overrides[id] as object | undefined) ?? {}) } as Record<string, unknown>;
    const recorded: Record<string, unknown> = {};
    for (const [method, impl] of Object.entries(api)) {
      recorded[method] =
        typeof impl === "function"
          ? (...args: unknown[]) => {
              calls.push({ id, method, args });
              if (state.permissions[id] === "denied" && syncMethods[id]?.has(method)) throw new Error(`permission denied: ${id}`);
              if (state.permissions[id] === "denied") return Promise.reject(new Error(`permission denied: ${id}`));
              return (impl as (...a: unknown[]) => unknown)(...args);
            }
          : impl;
    }
    adapters[id] = { id, status, api: recorded };
  }

  return {
    adapters: adapters as MockAdapterSet["adapters"],
    calls,
    callsOf: (id, method) => calls.filter((c) => c.id === id && (method === undefined || c.method === method)),
    reset() {
      calls.length = 0;
      const fresh = initialState();
      state.network.reset(fresh.network.get());
      state.appState.reset(fresh.appState.get());
      state.accessibility.reset(fresh.accessibility.get());
      state.keyboard.reset(fresh.keyboard.get());
      state.permissions = fresh.permissions;
      state.storage.clear();
      state.clipboard.value = "";
      clock.reset();
    },
    clock,
    state,
    setNetwork: (connected) => state.network.set({ connected }),
    setAppState: (next) => state.appState.set(next),
    setAccessibility: (patch) => state.accessibility.set({ ...state.accessibility.get(), ...patch }),
    setKeyboard: (next) =>
      state.keyboard.set(typeof next === "boolean" ? { visible: next, height: next ? 300 : 0 } : next),
    setPermission: (id, permission) => {
      state.permissions[id] = permission;
    },
  };
}

/** Narrow helper for tests that only need the adapters bag. */
/** Runtime list of mocked ids, taken from the exhaustively typed defaults table. */
export const mockedCapabilityIds: readonly CapabilityId[] = ids;

export function toAdapters(set: MockAdapterSet): CapabilityAdapters {
  return set.adapters;
}
