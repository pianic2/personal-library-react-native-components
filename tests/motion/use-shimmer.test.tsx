import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { act } from "react-test-renderer";
import { MotionProvider } from "../../src/motion/MotionProvider.js";
import type { MotionEngine, MotionHandle, MotionValue, TimingConfig } from "../../src/motion/engine.js";
import { useShimmer, type ShimmerOptions } from "../../src/motion/useShimmer.js";
import { motion } from "../../src/tokens/motion.base.js";
import { renderWithMotion } from "../helpers/motion.js";

interface FakeValue extends MotionValue {
  current: number;
}

function createFakeEngine() {
  const calls = { timing: [] as Array<{ to: number; config: TimingConfig }>, loop: [] as Array<number | undefined>, started: 0, stopped: 0, stopValue: 0 };
  const engine: MotionEngine = {
    createValue(initial) {
      const v: FakeValue = { current: initial, setValue(next) { v.current = next; } };
      return v;
    },
    timing(_value, to, config) {
      calls.timing.push({ to, config });
      return { start() {}, stop() {} };
    },
    spring: () => {
      throw new Error("shimmer uses timing");
    },
    loop(handle, config) {
      calls.loop.push(config?.iterations);
      const looped: MotionHandle = {
        start() {
          calls.started += 1;
          handle.start();
        },
        stop() {
          calls.stopped += 1;
        },
      };
      return looped;
    },
    stop() {
      calls.stopValue += 1;
    },
  };
  return { engine, calls };
}

function mount(options: ShimmerOptions = {}, reduceMotion = false) {
  const { engine, calls } = createFakeEngine();
  let value!: FakeValue;
  function Probe() {
    value = useShimmer(options) as FakeValue;
    return null;
  }
  const rendered = renderWithMotion(
    <MotionProvider engine={engine}>
      <Probe />
    </MotionProvider>,
    reduceMotion
  );
  return { get value() { return value; }, calls, mocks: rendered.mocks, unmount: () => act(() => rendered.renderer.unmount()) };
}

describe("PLRNUI-165 useShimmer", () => {
  it("returns an engine value that loops one sweep between from and to, forever, with token duration and easing", () => {
    const m = mount({ from: 0.3, to: 0.9 });
    assert.equal(m.calls.timing.length, 1);
    assert.equal(m.calls.timing[0]!.to, 0.9);
    assert.equal(m.calls.timing[0]!.config.duration, motion.duration.slower);
    assert.equal(m.calls.timing[0]!.config.useNativeDriver, true);
    assert.deepEqual(m.calls.loop, [-1]);
    assert.equal(m.calls.started, 1);
    assert.equal(m.value.current, 0.3);
  });

  it("defaults the bounds to 0 and 1", () => {
    const m = mount();
    assert.equal(m.value.current, 0);
    assert.equal(m.calls.timing[0]!.to, 1);
  });

  it("accepts a duration token, milliseconds and theme tokens; layout properties turn the native driver off", () => {
    assert.equal(mount({ duration: "slow" }).calls.timing[0]!.config.duration, motion.duration.slow);
    assert.equal(mount({ duration: 900 }).calls.timing[0]!.config.duration, 900);
    const tokens = { ...motion, duration: { ...motion.duration, slower: 777 } } as unknown as typeof motion;
    assert.equal(mount({ tokens }).calls.timing[0]!.config.duration, 777);
    assert.equal(mount({ property: "width" }).calls.timing[0]!.config.useNativeDriver, false);
  });

  it("non-finite bounds fall back to 0 and 1", () => {
    const m = mount({ from: Number.NaN, to: Number.POSITIVE_INFINITY });
    assert.equal(m.value.current, 0);
    assert.equal(m.calls.timing[0]!.to, 1);
  });

  it("under reduced motion the engine is not invoked and the value is static at `to`", () => {
    const m = mount({ from: 0.2, to: 0.8 }, true);
    assert.equal(m.calls.timing.length, 0);
    assert.deepEqual(m.calls.loop, []);
    assert.equal(m.calls.started, 0);
    assert.equal(m.value.current, 0.8);
  });

  it("MotionProvider reduceMotion=always also gives the static value", () => {
    const { engine, calls } = createFakeEngine();
    let value!: FakeValue;
    function Probe() {
      value = useShimmer({ to: 0.7 }) as FakeValue;
      return null;
    }
    renderWithMotion(
      <MotionProvider engine={engine} reduceMotion="always">
        <Probe />
      </MotionProvider>
    );
    assert.equal(calls.timing.length, 0);
    assert.equal(value.current, 0.7);
  });

  it("switching to reduced motion stops the loop and settles on `to`; switching back restarts it", () => {
    const m = mount({ from: 0, to: 1 });
    assert.equal(m.calls.started, 1);
    act(() => m.mocks.setAccessibility({ reduceMotion: true }));
    assert.equal(m.calls.stopped, 1);
    assert.equal(m.value.current, 1);
    act(() => m.mocks.setAccessibility({ reduceMotion: false }));
    assert.equal(m.calls.started, 2);
    assert.equal(m.value.current, 0);
  });

  it("keeps the same value across renders and stops the loop on unmount", () => {
    const m = mount();
    const first = m.value;
    assert.ok(m.value === first);
    assert.equal(m.calls.stopped, 0);
    m.unmount();
    assert.equal(m.calls.stopped, 1);
    assert.equal(m.calls.stopValue, 1);
  });

  it("an unknown duration token throws a RangeError, as animate() does", () => {
    assert.throws(() => mount({ duration: "nope" as never }), RangeError);
  });
});
