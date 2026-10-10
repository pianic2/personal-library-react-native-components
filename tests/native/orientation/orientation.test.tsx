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
    const lock = createExpoOrientationLock(fake as never);
    assert.equal(lock.status, "available");
    assert.equal(await lock.lock("landscape"), true);
    assert.equal(await lock.lock("portrait"), true);
    assert.equal(await lock.unlock(), true);
    assert.deepEqual(calls, [["lock", 5], ["lock", 3], ["unlock"]]);

    const failing = createExpoOrientationLock({ ...fake, lockAsync: async () => { throw new Error("no"); }, unlockAsync: async () => { throw new Error("no"); } } as never);
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
});
