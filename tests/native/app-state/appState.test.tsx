import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { act } from "react-test-renderer";
import { createEmitter, createMockAdapters, renderWithCapabilities } from "../../../src/native/testing/index.js";
import { useAppState, useIsAppActive, useOnBackground, useOnForeground, createVisibilityAppState } from "../../../src/native/app-state/index.js";
import { CapabilityProvider } from "../../../src/native/core/index.js";
import type { AppStateValue } from "../../../src/native/core/index.js";

function Probe({ log, onFg, onBg }: { log: string[]; onFg?: () => void; onBg?: () => void }) {
  const s = useAppState();
  const active = useIsAppActive();
  useOnForeground(() => { log.push("fg"); onFg?.(); });
  useOnBackground(() => { log.push("bg"); onBg?.(); });
  log.push(`render:${s}:${active}`);
  return null;
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
    const mocks = createMockAdapters();
    const seen: string[] = [];
    const r = renderWithCapabilities(<Probe log={[]} onBg={() => seen.push("a")} />, mocks);
    act(() => r.update(<CapabilityProvider adapters={mocks.adapters}><Probe log={[]} onBg={() => seen.push("b")} /></CapabilityProvider>));
    act(() => mocks.setAppState("background"));
    assert.deepEqual(seen, ["b"]);
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
    assert.ok(subs >= 3);
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
});
