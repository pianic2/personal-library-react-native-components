// Mock adapters for every capability id, with jest-free call recording. The `defaults` table is typed against
// CapabilityMap, so adding a capability there fails typecheck here until it is mocked.
import type { AdapterFor, CapabilityAdapters, CapabilityId, CapabilityMap, CapabilityStatus } from "../core/types.js";
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
  setKeyboard(next: FakeKeyboard | boolean): void;
  setPermission(id: CapabilityId, permission: FakePermission): void;
}

type Ctx = { state: MockState };
const run = async <T,>(fn: () => T): Promise<Awaited<T>> => await fn();
type Defaults = { [K in CapabilityId]: (ctx: Ctx) => CapabilityMap[K] };

// Permission rule: when a capability is `denied`, EVERY method of that capability (defaults and overrides, biometric
// included) records the call and then rejects with `permission denied: <id>`; the implementation is not run.
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
  network: (ctx) => ({ getStatus: () =>  run(() => ({ ...ctx.state.network.get() })) }),
};

/** Capabilities whose api is synchronous: a denied permission throws instead of rejecting. */
const syncIds: ReadonlySet<CapabilityId> = new Set<CapabilityId>(["appState"]);

const ids = Object.keys(defaults) as CapabilityId[];

function initialState(): MockState {
  return {
    network: createEmitter<{ connected: boolean | null }>({ connected: true }),
    appState: createEmitter<FakeAppState>("active"),
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
              if (state.permissions[id] === "denied" && syncIds.has(id)) throw new Error(`permission denied: ${id}`);
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
