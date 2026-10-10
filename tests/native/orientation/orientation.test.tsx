import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import TestRenderer, { act } from "react-test-renderer";

import { createExpoOrientationLock, createNoopOrientationLock, orientationFromSize, useOrientation, useWindowMetrics } from "../../../src/native/orientation/index.js";
import type { Orientation, WindowMetrics, WindowMetricsSource } from "../../../src/native/orientation/index.js";
import { createEmitter } from "../../../src/native/testing/index.js";
import { useBreakpoint } from "../../../src/hooks/useBreakpoint.js";

function mockSource(initial: WindowMetrics) {
  const emitter = createEmitter(initial);
  let subscribers = 0;
  const source: WindowMetricsSource = {
    get: emitter.get,
    subscribe(listener) {
      subscribers++;
      const off = emitter.subscribe(() => listener());
      return () => {
        subscribers--;
        off();
      };
    },
  };
  return { source, set: emitter.set, subscribers: () => subscribers };
}

const portrait: WindowMetrics = { width: 390, height: 844, scale: 3, fontScale: 1 };
const landscape: WindowMetrics = { width: 844, height: 390, scale: 3, fontScale: 1.2 };

function Probe({ source, out }: { source?: WindowMetricsSource; out: { o?: Orientation; m?: WindowMetrics; bp?: string } }) {
  out.o = useOrientation(source);
  out.m = useWindowMetrics(source);
  out.bp = useBreakpoint();
  return null;
}

// Fresh object on every get(): violates useSyncExternalStore's stable-snapshot rule on purpose.
function unstableSource(initial: WindowMetrics) {
  let current = initial;
  const listeners = new Set<() => void>();
  const source: WindowMetricsSource = {
    get: () => ({ ...current }),
    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };
  return {
    source,
    set(next: WindowMetrics) {
      current = next;
      for (const l of [...listeners]) l();
    },
    subscribers: () => listeners.size,
  };
}

describe("PLRNUI-182 orientation and window metrics", () => {
  it("derives orientation from size", () => {
    assert.equal(orientationFromSize(390, 844), "portrait");
    assert.equal(orientationFromSize(844, 390), "landscape");
    assert.equal(orientationFromSize(500, 500), "portrait");
  });

  it("follows a window change from the source and unsubscribes on unmount", () => {
    const mock = mockSource(portrait);
    const out: { o?: Orientation; m?: WindowMetrics; bp?: string } = {};
    let r!: TestRenderer.ReactTestRenderer;
    act(() => {
      r = TestRenderer.create(<Probe source={mock.source} out={out} />);
    });
    assert.equal(out.o, "portrait");
    assert.deepEqual(out.m, portrait);
    assert.equal(mock.subscribers() > 0, true);
    act(() => mock.set(landscape));
    assert.equal(out.o, "landscape");
    assert.deepEqual(out.m, landscape);
    act(() => r.unmount());
    assert.equal(mock.subscribers(), 0);
  });

  it("falls back to react-native window dimensions without a source and composes with useBreakpoint", () => {
    const out: { o?: Orientation; m?: WindowMetrics; bp?: string } = {};
    act(() => {
      TestRenderer.create(<Probe out={out} />);
    });
    assert.equal(out.o, "landscape"); // test loader reports 1280x800
    assert.deepEqual(out.m, { width: 1280, height: 800, scale: 1, fontScale: 1 });
    assert.equal(typeof out.bp, "string");
  });

  it("noop lock resolves false and does not throw", async () => {
    const lock = createNoopOrientationLock();
    assert.equal(lock.status, "noop");
    assert.equal(await lock.lock("landscape"), false);
    assert.equal(await lock.unlock(), false);
  });

  it("expo adapter without the module is unavailable and resolves false", async () => {
    for (const missing of [undefined, null]) {
      const lock = createExpoOrientationLock(missing);
      assert.equal(lock.status, "unavailable");
      assert.equal(await lock.lock("portrait"), false);
      assert.equal(await lock.unlock(), false);
    }
  });

  it("expo adapter maps modes onto the injected module and swallows rejections", async () => {
    const calls: unknown[] = [];
    const fake = {
      OrientationLock: { PORTRAIT_UP: 3, LANDSCAPE: 5 },
      async lockAsync(v: unknown) {
        calls.push(["lock", v]);
      },
      async unlockAsync() {
        calls.push(["unlock"]);
      },
    };
    const lock = createExpoOrientationLock(fake);
    assert.equal(lock.status, "available");
    assert.equal(await lock.lock("landscape"), true);
    assert.equal(await lock.lock("portrait"), true);
    assert.equal(await lock.unlock(), true);
    assert.deepEqual(calls, [["lock", 5], ["lock", 3], ["unlock"]]);

    const failing = createExpoOrientationLock({ ...fake, lockAsync: async () => { throw new Error("no"); }, unlockAsync: async () => { throw new Error("no"); } });
    assert.equal(await failing.lock("portrait"), false);
    assert.equal(await failing.unlock(), false);
    assert.equal(createExpoOrientationLock({} as never).status, "unavailable");
  });

  it("owned sources import no expo-* module and do not require", () => {
    const dir = resolve(import.meta.dirname, "../../../src/native/orientation");
    for (const file of readdirSync(dir)) {
      const text = readFileSync(join(dir, file), "utf8");
      assert.doesNotMatch(text, /from\s+["']expo-|require\(|import\(["']expo-/, file);
    }
  });

  it("regression: a source whose get() returns a fresh object each call neither loops nor throws", () => {
    const mock = unstableSource(portrait);
    const out: { o?: Orientation; m?: WindowMetrics; bp?: string } = {};
    let r!: TestRenderer.ReactTestRenderer;
    act(() => {
      r = TestRenderer.create(<Probe source={mock.source} out={out} />);
    });
    assert.deepEqual(out.m, portrait);
    act(() => mock.set(landscape));
    assert.equal(out.o, "landscape");
    assert.deepEqual(out.m, landscape);
    act(() => r.unmount());
    assert.equal(mock.subscribers(), 0);
  });

  it("regression: swapping the source re-subscribes and reads the new one", () => {
    const a = mockSource(portrait);
    const b = mockSource(landscape);
    const out: { o?: Orientation; m?: WindowMetrics; bp?: string } = {};
    let r!: TestRenderer.ReactTestRenderer;
    act(() => {
      r = TestRenderer.create(<Probe source={a.source} out={out} />);
    });
    assert.equal(out.o, "portrait");
    act(() => r.update(<Probe source={b.source} out={out} />));
    assert.equal(out.o, "landscape");
    assert.equal(a.subscribers(), 0);
    assert.equal(b.subscribers() > 0, true);
    act(() => b.set(portrait));
    assert.equal(out.o, "portrait");
    act(() => r.unmount());
    assert.equal(b.subscribers(), 0);
  });

  it("regression: a source does not also subscribe to react-native window dimensions (its values win)", () => {
    const mock = mockSource({ width: 10, height: 20, scale: 2, fontScale: 3 });
    const out: { o?: Orientation; m?: WindowMetrics; bp?: string } = {};
    act(() => {
      TestRenderer.create(<Probe source={mock.source} out={out} />);
    });
    assert.deepEqual(out.m, { width: 10, height: 20, scale: 2, fontScale: 3 });
  });

  it("regression: useWindowMetrics keeps its identity across re-renders while the values are unchanged", () => {
    const mock = mockSource(portrait);
    const seen: WindowMetrics[] = [];
    function Metrics({ tick }: { tick: number; }) {
      void tick;
      seen.push(useWindowMetrics(mock.source));
      return null;
    }
    const noSource: WindowMetrics[] = [];
    function Default({ tick }: { tick: number }) {
      void tick;
      noSource.push(useWindowMetrics());
      return null;
    }
    let r!: TestRenderer.ReactTestRenderer;
    let d!: TestRenderer.ReactTestRenderer;
    act(() => {
      r = TestRenderer.create(<Metrics tick={0} />);
      d = TestRenderer.create(<Default tick={0} />);
    });
    act(() => {
      r.update(<Metrics tick={1} />);
      d.update(<Default tick={1} />);
    });
    assert.equal(seen.length >= 2, true);
    assert.equal(seen[seen.length - 1], seen[0]);
    assert.equal(noSource[noSource.length - 1], noSource[0]);
    act(() => mock.set(landscape));
    assert.notEqual(seen[seen.length - 1], seen[0]);
  });

  // SSR/web-safety limits: react-dom is not installed, so `getServerSnapshot` (used only while hydrating) cannot be
  // driven here; the injected-source path passes `source.getServer ?? source.get` for it. The react-native test shim
  // (tests/shims/react-native.tsx, not owned) only has a static `useWindowDimensions`, so a real Dimensions change
  // cannot be driven on the default path; that path is asserted to equal the shim's 1280x800 above.
  it("renders without a source and with a source via react-test-renderer", () => {
    const out: { o?: Orientation; m?: WindowMetrics; bp?: string } = {};
    act(() => {
      TestRenderer.create(<Probe out={out} />);
    });
    assert.equal(out.o, "landscape");
    const mock = mockSource(portrait);
    act(() => {
      TestRenderer.create(<Probe source={{ ...mock.source, getServer: () => landscape }} out={out} />);
    });
    assert.equal(out.o, "portrait");
  });

  it("expo adapter reports native rejections through onError and stays silent by default", async () => {
    const boom = new Error("boom");
    const mod = { OrientationLock: { PORTRAIT_UP: 3, LANDSCAPE: 5 }, lockAsync: async (_: number) => { throw boom; }, unlockAsync: async () => { throw boom; } };
    const seen: [unknown, string][] = [];
    const lock = createExpoOrientationLock(mod, { onError: (e, op) => void seen.push([e, op]) });
    assert.equal(await lock.lock("portrait"), false);
    assert.equal(await lock.unlock(), false);
    assert.deepEqual(seen, [[boom, "lock"], [boom, "unlock"]]);
    const throwing = createExpoOrientationLock(mod, { onError: () => { throw new Error("cb"); } });
    assert.equal(await throwing.lock("landscape"), false);
    assert.equal(await createExpoOrientationLock(mod).unlock(), false);
  });

  it("expo adapter with a truthy but incomplete module is unavailable", async () => {
    const full = { OrientationLock: { PORTRAIT_UP: 3, LANDSCAPE: 5 }, lockAsync: async (_: number) => undefined, unlockAsync: async () => undefined };
    const broken: unknown[] = [
      { ...full, lockAsync: "x" },
      { ...full, unlockAsync: undefined },
      { ...full, OrientationLock: undefined },
      { ...full, OrientationLock: { PORTRAIT_UP: 3 } },
      { ...full, OrientationLock: {} },
      "string",
      42,
    ];
    for (const m of broken) {
      const lock = createExpoOrientationLock(m as never);
      assert.equal(lock.status, "unavailable");
      assert.equal(await lock.lock("portrait"), false);
    }
  });
});
