import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { act, create } from "react-test-renderer";
import { createMockAdapters, renderWithCapabilities } from "../../../src/native/testing/index.js";
import {
  UNKNOWN_NETWORK,
  createExpoNetwork,
  createNetInfoNetwork,
  createWebNetwork,
  useIsOnline,
  useNetworkStatus,
} from "../../../src/native/network/index.js";
import type { ExpoNetworkModuleLike, NetInfoModuleLike, NetworkState, OnlineHost } from "../../../src/native/network/index.js";

function Probe({ log }: { log: string[] }) {
  const s = useNetworkStatus();
  const online = useIsOnline();
  log.push(`${s.isConnected}:${s.isInternetReachable}:${s.type}:${online}`);
  return null;
}

const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

function fakeHost(onLine: boolean | undefined) {
  const handlers = new Map<string, Set<() => void>>();
  const host = {
    navigator: { onLine },
    addEventListener: (t: string, l: () => void) => { (handlers.get(t) ?? handlers.set(t, new Set()).get(t)!).add(l); },
    removeEventListener: (t: string, l: () => void) => { handlers.get(t)?.delete(l); },
  };
  return {
    host: host as unknown as OnlineHost & { navigator: { onLine: boolean | undefined } },
    emit: (t: "online" | "offline") => handlers.get(t)?.forEach((l) => l()),
    count: () => [...handlers.values()].reduce((n, s) => n + s.size, 0),
  };
}

describe("PLRNUI-178 network status", () => {
  it("renders the unknown state (null, never false) with nothing injected", () => {
    const log: string[] = [];
    act(() => { create(<Probe log={log} />); });
    assert.equal(log.at(-1), "null:null:unknown:null");
    assert.equal(UNKNOWN_NETWORK.isConnected, null);
  });

  it("follows the mock network state and distinguishes unknown from offline", () => {
    const mocks = createMockAdapters();
    const log: string[] = [];
    renderWithCapabilities(<Probe log={log} />, mocks);
    assert.equal(log.at(-1), "true:true:unknown:true");
    act(() => mocks.setNetwork(false));
    assert.equal(log.at(-1), "false:false:none:false");
    act(() => mocks.setNetwork(null));
    assert.equal(log.at(-1), "null:null:unknown:null");
  });

  it("subscribes once per hook and removes every listener on unmount", () => {
    let subs = 0;
    let unsubs = 0;
    const mocks = createMockAdapters();
    const inner = mocks.adapters.network.api;
    mocks.adapters.network.api = { ...inner, subscribe: (l) => { subs++; const off = inner.subscribe(l); return () => { unsubs++; off(); }; } };
    const log: string[] = [];
    const r = renderWithCapabilities(<Probe log={log} />, mocks);
    assert.equal(subs, 2); // useNetworkStatus + the one inside useIsOnline
    act(() => mocks.setNetwork(false));
    act(() => r.unmount());
    assert.equal(unsubs, 2);
    const before = log.length;
    act(() => mocks.setNetwork(true));
    assert.equal(log.length, before, "no render after unmount");
  });

  it("keeps the result identity while the fields are unchanged", () => {
    const mocks = createMockAdapters();
    const seen: NetworkState[] = [];
    function Id() { seen.push(useNetworkStatus()); return null; }
    renderWithCapabilities(<Id />, mocks);
    act(() => mocks.setNetwork(true)); // same value
    assert.ok(seen.every((s) => s === seen[0]));
  });

  it("degrades to unknown when the api throws (denied permission), never to offline", () => {
    const mocks = createMockAdapters();
    mocks.setPermission("network", "denied");
    const log: string[] = [];
    renderWithCapabilities(<Probe log={log} />, mocks);
    assert.equal(log.at(-1), "null:null:unknown:null");
  });

  it("maps navigator.onLine and the online/offline events (web)", () => {
    const f = fakeHost(true);
    const api = createWebNetwork(f.host);
    assert.deepEqual(api.getState(), { isConnected: true, isInternetReachable: null, type: "unknown" });
    const seen: boolean[] = [];
    const off = api.subscribe((s) => seen.push(s.isConnected as boolean));
    f.host.navigator.onLine = false;
    f.emit("offline");
    assert.deepEqual(api.getState(), { isConnected: false, isInternetReachable: false, type: "none" });
    f.host.navigator.onLine = true;
    f.emit("online");
    assert.deepEqual(seen, [false, true]);
    off();
    assert.equal(f.count(), 0);
  });

  it("treats a missing navigator.onLine as unknown (null)", async () => {
    const api = createWebNetwork(fakeHost(undefined).host);
    assert.deepEqual(api.getState(), UNKNOWN_NETWORK);
    assert.deepEqual(await api.getStatus(), { connected: null });
  });

  it("expo adapter: unknown until the first read, then follows the listener, removes it on the last unsubscribe", async () => {
    let removed = 0;
    let listener: ((s: { isConnected?: boolean; isInternetReachable?: boolean; type?: string }) => void) | undefined;
    const mod: ExpoNetworkModuleLike = {
      getNetworkStateAsync: async () => ({ isConnected: true, isInternetReachable: true, type: "WIFI" }),
      addNetworkStateListener: (l) => { listener = l; return { remove: () => { removed++; } }; },
    };
    const api = createExpoNetwork(mod);
    assert.deepEqual(api.getState(), UNKNOWN_NETWORK);
    const seen: NetworkState[] = [];
    const a = api.subscribe((s) => seen.push(s));
    const b = api.subscribe(() => undefined);
    await flush();
    assert.deepEqual(api.getState(), { isConnected: true, isInternetReachable: true, type: "wifi" });
    listener?.({ isConnected: false, type: "NONE" });
    assert.deepEqual(api.getState(), { isConnected: false, isInternetReachable: null, type: "none" });
    a();
    assert.equal(removed, 0, "still one subscriber");
    b();
    assert.equal(removed, 1);
    assert.equal(seen.length, 2);
  });

  it("expo adapter: a rejected read keeps the state unknown (null, not offline) and a module without listeners works", async () => {
    const api = createExpoNetwork({ getNetworkStateAsync: async () => { throw new Error("boom"); } });
    const off = api.subscribe(() => undefined);
    await flush();
    assert.deepEqual(api.getState(), UNKNOWN_NETWORK);
    off();
    const api2 = createExpoNetwork({ getNetworkStateAsync: async () => ({ isConnected: true, type: "weird" }) });
    const off2 = api2.subscribe(() => undefined);
    await flush();
    assert.deepEqual(api2.getState(), { isConnected: true, isInternetReachable: null, type: "unknown" });
    off2();
  });

  it("a late read after the last unsubscribe is ignored", async () => {
    let resolve!: (v: { isConnected: boolean }) => void;
    const api = createExpoNetwork({ getNetworkStateAsync: () => new Promise((r) => { resolve = r as typeof resolve; }) });
    const off = api.subscribe(() => undefined);
    off();
    resolve({ isConnected: false });
    await flush();
    assert.deepEqual(api.getState(), UNKNOWN_NETWORK);
  });

  it("netinfo adapter maps fetch and listener and unsubscribes", async () => {
    let off = 0;
    let push: ((s: { isConnected: boolean | null; isInternetReachable: boolean | null; type?: string }) => void) | undefined;
    const mod: NetInfoModuleLike = {
      fetch: async () => ({ isConnected: true, isInternetReachable: null, type: "cellular" }),
      addEventListener: (l) => { push = l; return () => { off++; }; },
    };
    const api = createNetInfoNetwork(mod);
    const un = api.subscribe(() => undefined);
    await flush();
    assert.deepEqual(api.getState(), { isConnected: true, isInternetReachable: null, type: "cellular" });
    push?.({ isConnected: false, isInternetReachable: false, type: "none" });
    assert.deepEqual(api.getState(), { isConnected: false, isInternetReachable: false, type: "none" });
    un();
    assert.equal(off, 1);
  });

  it("source files import no expo-* or netinfo package", async () => {
    const { readdirSync, readFileSync } = await import("node:fs");
    const dir = new URL("../../../src/native/network/", import.meta.url);
    for (const f of readdirSync(dir)) {
      const text = readFileSync(new URL(f, dir), "utf8");
      assert.ok(!/from\s*["'`](expo|@expo\/|@react-native-community\/)|import\s*\(\s*["'`](expo|@react-native-community)|require\s*\(/.test(text), f);
    }
  });
});
