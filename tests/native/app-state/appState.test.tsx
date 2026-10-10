import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { act } from "react-test-renderer";
import { createEmitter, createMockAdapters, renderWithCapabilities } from "../../../src/native/testing/index.js";
import { useAppState, useIsAppActive, useOnBackground, useOnForeground, createVisibilityAppState, createReactNativeAppState } from "../../../src/native/app-state/index.js";
import { CapabilityProvider } from "../../../src/native/core/index.js";
import type { AppStateApi, AppStateValue } from "../../../src/native/core/index.js";
import type { RNAppState } from "../../../src/native/app-state/index.js";

function Probe({ log, onFg, onBg }: { log: string[]; onFg?: () => void; onBg?: () => void }) {
  const s = useAppState();
  const active = useIsAppActive();
  useOnForeground(() => { log.push("fg"); onFg?.(); });
  useOnBackground(() => { log.push("bg"); onBg?.(); });
  log.push(`render:${s}:${active}`);
  return null;
}

function counting() {
  let subs = 0;
  let unsubs = 0;
  const mocks = createMockAdapters();
  const inner = mocks.adapters.appState.api;
  mocks.adapters.appState.api = {
    getState: () => inner.getState(),
    subscribe: (l) => { subs++; const off = inner.subscribe(l); return () => { unsubs++; off(); }; },
  };
  return { mocks, subs: () => subs, unsubs: () => unsubs };
}

describe("PLRNUI-172 app-state hooks", () => {
  it("reads and follows the state", () => {
    const mocks = createMockAdapters();
    const log: string[] = [];
    renderWithCapabilities(<Probe log={log} />, mocks);
    assert.equal(log.at(-1), "render:active:true");
    act(() => mocks.setAppState("background"));
    assert.equal(log.at(-1), "render:background:false");
  });

  it("callbacks fire only on transitions", () => {
    const mocks = createMockAdapters();
    const log: string[] = [];
    renderWithCapabilities(<Probe log={log} />, mocks);
    const events = () => log.filter((l) => l === "fg" || l === "bg");
    assert.deepEqual(events(), []); // not on mount
    act(() => mocks.setAppState("active")); // same state
    assert.deepEqual(events(), []);
    act(() => mocks.setAppState("inactive"));
    act(() => mocks.setAppState("background")); // inactive -> background: still not active
    act(() => mocks.setAppState("background")); // repeat
    assert.deepEqual(events(), ["bg"]);
    act(() => mocks.setAppState("active"));
    act(() => mocks.setAppState("active"));
    assert.deepEqual(events(), ["bg", "fg"]);
  });

  it("uses the latest callback without resubscribing", () => {
    const counted = counting();
    const seen: string[] = [];
    const r = renderWithCapabilities(<Probe log={[]} onBg={() => seen.push("a")} />, counted.mocks);
    assert.equal(counted.subs(), 4);
    act(() => r.update(<CapabilityProvider adapters={counted.mocks.adapters}><Probe log={[]} onBg={() => seen.push("b")} /></CapabilityProvider>));
    assert.equal(counted.subs(), 4, "no resubscription on rerender");
    assert.equal(counted.unsubs(), 0);
    act(() => counted.mocks.setAppState("background"));
    assert.deepEqual(seen, ["b"]);
  });

  it("inactive -> active is a foreground; active -> inactive is a background", () => {
    const mocks = createMockAdapters();
    const log: string[] = [];
    renderWithCapabilities(<Probe log={log} />, mocks);
    const ev = () => log.filter((l) => l === "fg" || l === "bg");
    act(() => mocks.setAppState("inactive"));
    assert.deepEqual(ev(), ["bg"]);
    act(() => mocks.setAppState("active"));
    assert.deepEqual(ev(), ["bg", "fg"]);
  });

  it("a blip active -> inactive -> active fires background then foreground once each", () => {
    const mocks = createMockAdapters();
    const log: string[] = [];
    renderWithCapabilities(<Probe log={log} />, mocks);
    act(() => mocks.setAppState("inactive"));
    act(() => mocks.setAppState("active"));
    act(() => mocks.setAppState("inactive"));
    act(() => mocks.setAppState("active"));
    assert.deepEqual(log.filter((l) => l === "fg" || l === "bg"), ["bg", "fg", "bg", "fg"]);
  });

  it("removes every listener on unmount", () => {
    const emitter = createEmitter<AppStateValue>("active");
    let subs = 0;
    let unsubs = 0;
    const mocks = createMockAdapters({
      appState: {
        getState: () => emitter.get(),
        subscribe: (l) => { subs++; const off = emitter.subscribe(l); return () => { unsubs++; off(); }; },
      },
    });
    const log: string[] = [];
    const r = renderWithCapabilities(<Probe log={log} />, mocks);
    assert.equal(subs, 4); // useAppState + useIsAppActive + useOnForeground + useOnBackground
    act(() => r.unmount());
    assert.equal(unsubs, subs);
    const before = log.length;
    emitter.set("background");
    assert.equal(log.length, before);
  });

  it("web: maps document.visibilitychange to active/background (mock emitter)", () => {
    const listeners = new Set<() => void>();
    const doc = {
      visibilityState: "visible",
      addEventListener: (_t: "visibilitychange", l: () => void) => void listeners.add(l),
      removeEventListener: (_t: "visibilitychange", l: () => void) => void listeners.delete(l),
    };
    const api = createVisibilityAppState(doc);
    const seen: AppStateValue[] = [];
    const off = api.subscribe((s) => seen.push(s));
    assert.equal(api.getState(), "active");
    doc.visibilityState = "hidden";
    listeners.forEach((l) => l());
    doc.visibilityState = "visible";
    listeners.forEach((l) => l());
    assert.deepEqual(seen, ["background", "active"]);
    off();
    assert.equal(listeners.size, 0);
  });

  it("without a provider falls back to web visibility when document exists, and never throws", () => {
    const g = globalThis as { document?: unknown };
    const listeners = new Set<() => void>();
    const doc = { visibilityState: "visible", addEventListener: (_: string, l: () => void) => void listeners.add(l), removeEventListener: (_: string, l: () => void) => void listeners.delete(l) };
    g.document = doc;
    try {
      const log: string[] = [];
      const r = renderWithCapabilities(<Probe log={log} />);
      doc.visibilityState = "hidden";
      act(() => listeners.forEach((l) => l()));
      assert.equal(log.at(-1), "render:background:false");
      assert.ok(log.includes("bg"));
      act(() => r.unmount());
      assert.equal(listeners.size, 0);
    } finally {
      delete g.document;
    }
    const log: string[] = [];
    renderWithCapabilities(<Probe log={log} />);
    assert.equal(log.at(-1), "render:active:true");
  });

  it("a denied appState permission degrades to always-active without crashing the tree", () => {
    const mocks = createMockAdapters();
    mocks.setPermission("appState", "denied");
    const log: string[] = [];
    const r = renderWithCapabilities(<Probe log={log} />, mocks);
    assert.equal(log.at(-1), "render:active:true");
    act(() => mocks.setAppState("background")); // the denied api never notifies
    assert.equal(log.at(-1), "render:active:true");
    assert.deepEqual(log.filter((l) => l === "fg" || l === "bg"), []);
    act(() => r.unmount());
  });

  it("only a noop adapter falls back; an unavailable adapter keeps its own api", () => {
    const g = globalThis as { document?: unknown };
    const listeners = new Set<() => void>();
    g.document = {
      visibilityState: "hidden",
      addEventListener: (_: string, l: () => void) => void listeners.add(l),
      removeEventListener: (_: string, l: () => void) => void listeners.delete(l),
    };
    const own: AppStateApi = { getState: () => "inactive", subscribe: () => () => undefined };
    const read = (status: "noop" | "unavailable") => {
      const log: string[] = [];
      renderWithCapabilities(<Probe log={log} />, { appState: { id: "appState", status, api: own } });
      return log.at(-1);
    };
    try {
      assert.equal(read("noop"), "render:background:false"); // web fallback (document hidden), own api ignored
      assert.equal(read("unavailable"), "render:inactive:false"); // own api used as given
    } finally {
      delete g.document;
    }
  });
});

describe("PLRNUI-172 React Native AppState mapping", () => {
  function fakeHost(currentState?: string) {
    const listeners = new Set<(s: string) => void>();
    let removed = 0;
    const host: RNAppState = {
      currentState,
      addEventListener: (_t, l) => {
        listeners.add(l);
        return { remove: () => { removed++; listeners.delete(l); } };
      },
    };
    return { host, emit: (s: string) => [...listeners].forEach((l) => l(s)), size: () => listeners.size, removed: () => removed };
  }

  it("reads the initial currentState and maps known strings", () => {
    for (const s of ["active", "background", "inactive"] as const) assert.equal(createReactNativeAppState(fakeHost(s).host).getState(), s);
  });

  it("maps unknown strings and a missing currentState to active", () => {
    assert.equal(createReactNativeAppState(fakeHost("unknown").host).getState(), "active"); // iOS 'extension' and friends
    assert.equal(createReactNativeAppState(fakeHost(undefined).host).getState(), "active");
    const f = fakeHost("active");
    const seen: AppStateValue[] = [];
    createReactNativeAppState(f.host).subscribe((s) => seen.push(s));
    f.emit("extension");
    f.emit("background");
    assert.deepEqual(seen, ["active", "background"]);
  });

  it("calls remove() on unsubscribe and stops notifying", () => {
    const f = fakeHost("active");
    const seen: AppStateValue[] = [];
    const off = createReactNativeAppState(f.host).subscribe((s) => seen.push(s));
    assert.equal(f.size(), 1);
    off();
    assert.equal(f.removed(), 1);
    assert.equal(f.size(), 0);
    f.emit("background");
    assert.deepEqual(seen, []);
  });

  it("propagates a listener error to the emitter and keeps the subscription", () => {
    const f = fakeHost("active");
    createReactNativeAppState(f.host).subscribe(() => { throw new Error("boom"); });
    assert.throws(() => f.emit("background"), /boom/);
    assert.equal(f.size(), 1);
  });
});
