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
  /** Clears recorded calls and restores the default state (network, app state, keyboard, permissions, storage, clock). */
  reset(): void;
  clock: FakeClock;
  state: MockState;
  setNetwork(connected: boolean | null): void;
  setAppState(next: FakeAppState): void;
  setKeyboard(next: FakeKeyboard | boolean): void;
  setPermission(id: CapabilityId, permission: FakePermission): void;
}

type Ctx = { state: MockState };
type Defaults = { [K in CapabilityId]: (ctx: Ctx) => CapabilityMap[K] };

const denied = (ctx: Ctx, id: CapabilityId) => ctx.state.permissions[id] === "denied";
async function guard<T>(ctx: Ctx, id: CapabilityId, run: () => T): Promise<Awaited<T>> {
  if (denied(ctx, id)) throw new Error(`permission denied: ${id}`);
  return await run();
}

// Typed `{ [K in CapabilityId]: ... }`: a missing key is a compile error.
const defaults: Defaults = {
  clipboard: (ctx) => ({
    getString: () => guard(ctx, "clipboard", () => ctx.state.clipboard.value),
    setString: (value) =>
      guard(ctx, "clipboard", () => {
        ctx.state.clipboard.value = value;
      }),
  }),
  haptics: (ctx) => ({
    impact: () => guard(ctx, "haptics", () => undefined),
    notification: () => guard(ctx, "haptics", () => undefined),
    selection: () => guard(ctx, "haptics", () => undefined),
  }),
  share: (ctx) => ({ share: () => guard(ctx, "share", () => "shared" as const) }),
  storage: (ctx) => ({
    getItem: (key) => guard(ctx, "storage", () => ctx.state.storage.get(key) ?? null),
    setItem: (key, value) =>
      guard(ctx, "storage", () => {
        ctx.state.storage.set(key, value);
      }),
    removeItem: (key) =>
      guard(ctx, "storage", () => {
        ctx.state.storage.delete(key);
      }),
  }),
  biometric: (ctx) => ({
    isAvailable: () => guard(ctx, "biometric", () => true),
    authenticate: async () => !denied(ctx, "biometric"),
  }),
  network: (ctx) => ({ getStatus: () => guard(ctx, "network", () => ({ ...ctx.state.network.get() })) }),
};

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
    const api = { ...(defaults[id](ctx) as object), ...((overrides[id] as object | undefined) ?? {}) } as Record<string, unknown>;
    const recorded: Record<string, unknown> = {};
    for (const [method, impl] of Object.entries(api)) {
      recorded[method] =
        typeof impl === "function"
          ? (...args: unknown[]) => {
              calls.push({ id, method, args });
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
      state.network.set(fresh.network.get());
      state.appState.set(fresh.appState.get());
      state.keyboard.set(fresh.keyboard.get());
      state.permissions = fresh.permissions;
      state.storage.clear();
      state.clipboard.value = "";
      clock.advance(0);
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
export function toAdapters(set: MockAdapterSet): CapabilityAdapters {
  return set.adapters;
}
