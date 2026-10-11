import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import TestRenderer, { act } from "react-test-renderer";
import { Platform } from "react-native";
import { animate, resolveUseNativeDriver, useAnimate, type AnimateOptions } from "../../src/motion/animate.js";
import { createDefaultEngine, createJumpEngine, type MotionEngine, type MotionEnd, type MotionHandle, type MotionValue, type SpringConfig, type TimingConfig } from "../../src/motion/engine.js";
import { MotionProvider } from "../../src/motion/MotionProvider.js";
import { useAnimatedValue } from "../../src/motion/useAnimatedValue.js";
import { createTheme } from "../../src/theme/createTheme.js";
import { CapabilityProvider } from "../../src/native/core/index.js";
import { createFakeClock } from "../../src/native/testing/index.js";
import { motion, toEasing } from "../../src/tokens/motion.base.js";
import { renderWithMotion } from "../helpers/motion.js";

interface FakeValue extends MotionValue {
  current: number;
}

// A fake engine driven by a fake clock: a timing animation finishes `duration` fake milliseconds after start.
function createFakeEngine(clock = createFakeClock()) {
  const calls: Array<{ kind: "timing" | "spring" | "loop"; to?: number; config?: TimingConfig | SpringConfig }> = [];
  const stopped: MotionValue[] = [];
  const engine: MotionEngine = {
    createValue(initial) {
      const v: FakeValue = { current: initial, setValue(next) { v.current = next; } };
      return v;
    },
    timing(value, to, config) {
      calls.push({ kind: "timing", to, config });
      let cancel: (() => void) | undefined;
      return {
        start(onEnd) {
          cancel = clock.setTimeout(() => {
            value.setValue(to);
            onEnd?.({ finished: true });
          }, config.duration);
        },
        stop() {
          cancel?.();
        },
      };
    },
    spring(value, to, config) {
      calls.push({ kind: "spring", to, config });
      return {
        start(onEnd) {
          value.setValue(to);
          onEnd?.({ finished: true });
        },
        stop() {},
      };
    },
    loop(handle) {
      calls.push({ kind: "loop" });
      return handle;
    },
    stop(value) {
      stopped.push(value);
    },
  };
  return { engine, calls, clock, stopped };
}

const val = (engine: MotionEngine, initial = 0): FakeValue => engine.createValue(initial) as FakeValue;

describe("PLRNUI-143 animate resolves tokens", () => {
  const durations: Array<[keyof typeof motion.duration, number]> = [
    ["instant", 0],
    ["fast", 120],
    ["base", 200],
    ["slow", 320],
    ["slower", 480],
  ];
  for (const [name, ms] of durations) {
    it(`duration "${name}" runs for ${ms} fake ms and then reaches the target`, () => {
      const { engine, calls, clock } = createFakeEngine();
      const value = val(engine);
      const ends: MotionEnd[] = [];
      animate(value, 1, { engine, duration: name }).start((r) => ends.push(r));
      assert.equal((calls[0]!.config as TimingConfig).duration, ms);
      if (ms > 0) {
        clock.advance(ms - 1);
        assert.equal(value.current, 0);
        assert.equal(ends.length, 0);
      }
      clock.advance(1);
      assert.equal(value.current, 1);
      assert.deepEqual(ends, [{ finished: true }]);
    });
  }

  it("defaults to the base duration and the standard easing", () => {
    const { engine, calls } = createFakeEngine();
    animate(val(engine), 1, { engine });
    const config = calls[0]!.config as TimingConfig;
    assert.equal(config.duration, motion.duration.base);
    assert.equal(config.easing(0), 0);
    assert.equal(config.easing(1), 1);
    assert.equal(config.easing(0.5), toEasing("standard")(0.5));
  });

  it("a number is used as milliseconds and an easing token or tuple selects the curve", () => {
    const { engine, calls } = createFakeEngine();
    animate(val(engine), 1, { engine, duration: 75, easing: "decelerate" });
    animate(val(engine), 1, { engine, duration: 0, easing: [0.1, 0.2, 0.3, 0.4] });
    assert.equal((calls[0]!.config as TimingConfig).duration, 75);
    assert.equal((calls[0]!.config as TimingConfig).easing(0.5), toEasing("decelerate")(0.5));
    assert.equal((calls[1]!.config as TimingConfig).duration, 0);
    assert.equal((calls[1]!.config as TimingConfig).easing(0.5), toEasing([0.1, 0.2, 0.3, 0.4])(0.5));
  });

  it("resolves from custom theme tokens (theme.motion)", () => {
    const theme = createTheme({ motion: { duration: { base: 999 } } as never });
    assert.equal(theme.motion.duration.base, 999);
    const { engine, calls } = createFakeEngine();
    animate(val(engine), 1, { engine, tokens: theme.motion });
    assert.equal((calls[0]!.config as TimingConfig).duration, 999);
  });

  it("springs use the spring token's stiffness, damping and mass", () => {
    const { engine, calls } = createFakeEngine();
    for (const name of ["gentle", "snappy", "bouncy"] as const) animate(val(engine), 1, { engine, spring: name });
    assert.deepEqual(
      calls.map((c) => ({ kind: c.kind, stiffness: (c.config as SpringConfig).stiffness, damping: (c.config as SpringConfig).damping, mass: (c.config as SpringConfig).mass })),
      (["gentle", "snappy", "bouncy"] as const).map((n) => ({ kind: "spring", ...motion.spring[n] }))
    );
  });

  it("unknown tokens and invalid durations throw a RangeError", () => {
    const { engine } = createFakeEngine();
    const v = val(engine);
    assert.throws(() => animate(v, 1, { engine, spring: "wobbly" as never }), RangeError);
    assert.throws(() => animate(v, 1, { engine, duration: "glacial" as never }), RangeError);
    assert.throws(() => animate(v, 1, { engine, duration: -5 }), RangeError);
    assert.throws(() => animate(v, 1, { engine, easing: "bouncy" as never }), RangeError);
  });

  it("inherited object keys are not tokens (toString, constructor, __proto__) and non-finite values are rejected", () => {
    const { engine } = createFakeEngine();
    const v = val(engine);
    for (const name of ["toString", "constructor", "hasOwnProperty", "__proto__"]) {
      assert.throws(() => animate(v, 1, { engine, duration: name as never }), RangeError, `duration ${name}`);
      assert.throws(() => animate(v, 1, { engine, easing: name as never }), RangeError, `easing ${name}`);
      assert.throws(() => animate(v, 1, { engine, spring: name as never }), RangeError, `spring ${name}`);
    }
    assert.throws(() => animate(v, 1, { engine, duration: Number.POSITIVE_INFINITY }), RangeError);
    assert.throws(() => animate(v, 1, { engine, duration: Number.NaN }), RangeError);
    assert.throws(() => animate(v, 1, { engine, easing: [0, 0, Number.NaN, 1] }), RangeError);
    assert.throws(() => animate(v, 1, { engine, easing: [0, 0, 1] as never }), RangeError);
  });

  it("stop cancels a running timing animation before it finishes", () => {
    const { engine, clock } = createFakeEngine();
    const value = val(engine);
    const handle = animate(value, 1, { engine, duration: "slow" });
    handle.start();
    clock.advance(100);
    handle.stop();
    clock.advance(1000);
    assert.equal(value.current, 0);
  });
});

describe("PLRNUI-143 reduced motion", () => {
  it("forces the final value synchronously, before start, and start reports the end at once", () => {
    const { engine, calls, clock } = createFakeEngine();
    const value = val(engine, 0);
    const handle = animate(value, 7, { engine, reduceMotion: true, duration: "slower" });
    assert.equal(value.current, 7, "jumped before start");
    assert.equal(calls.length, 0, "the engine was not asked to animate");
    const ends: MotionEnd[] = [];
    handle.start((r) => ends.push(r));
    handle.start((r) => ends.push(r));
    assert.deepEqual(ends, [{ finished: true }], "ends once, synchronously");
    assert.equal(clock.pending(), 0);
  });

  it("a springs request is also skipped under reduced motion", () => {
    const { engine, calls } = createFakeEngine();
    const value = val(engine);
    animate(value, 3, { engine, reduceMotion: true, spring: "bouncy" });
    assert.equal(value.current, 3);
    assert.equal(calls.length, 0);
  });

  it("useAnimate follows the system setting and the MotionProvider override", () => {
    const { engine, calls } = createFakeEngine();
    let run!: ReturnType<typeof useAnimate>;
    function Probe() {
      run = useAnimate();
      return null;
    }
    const { mocks } = renderWithMotion(
      <MotionProvider engine={engine}>
        <Probe />
      </MotionProvider>,
      false
    );
    const value = val(engine);
    run(value, 1).start();
    assert.equal(calls.length, 1, "animates when motion is not reduced");
    act(() => mocks.setAccessibility({ reduceMotion: true }));
    const jumped = val(engine);
    run(jumped, 5);
    assert.equal(jumped.current, 5, "jumps once the system asks to reduce motion");
    assert.equal(calls.length, 1);
  });

  it("an explicit undefined option does not erase the hook's reduced-motion preference", () => {
    const { engine, calls } = createFakeEngine();
    let run!: ReturnType<typeof useAnimate>;
    function Probe() {
      run = useAnimate();
      return null;
    }
    renderWithMotion(<MotionProvider engine={engine}><Probe /></MotionProvider>, true);
    const v = val(engine);
    run(v, 4, { reduceMotion: undefined, tokens: undefined, engine: undefined });
    assert.equal(v.current, 4, "still jumps under the system setting");
    assert.equal(calls.length, 0);
  });

  it("MotionProvider reduceMotion='never' animates over a system true; 'always' jumps over a system false", () => {
    const { engine, calls } = createFakeEngine();
    let run!: ReturnType<typeof useAnimate>;
    function Probe() {
      run = useAnimate();
      return null;
    }
    renderWithMotion(<MotionProvider engine={engine} reduceMotion="never"><Probe /></MotionProvider>, true);
    run(val(engine), 1);
    assert.equal(calls.length, 1);
    renderWithMotion(<MotionProvider engine={engine} reduceMotion="always"><Probe /></MotionProvider>, false);
    const v = val(engine);
    run(v, 9);
    assert.equal(v.current, 9);
    assert.equal(calls.length, 1);
  });
});

describe("PLRNUI-143 native driver", () => {
  const cases: Array<[string, Pick<AnimateOptions, "useNativeDriver" | "property">, boolean]> = [
    ["ios", {}, true],
    ["android", { property: "opacity" }, true],
    ["ios", { property: "translateX" }, true],
    ["ios", { property: "width" }, false],
    ["ios", { property: "backgroundColor" }, false],
    ["ios", { useNativeDriver: false }, false],
    ["web", {}, false],
    ["web", { useNativeDriver: true, property: "opacity" }, false],
  ];
  for (const [os, options, expected] of cases) {
    it(`${os} ${JSON.stringify(options)} -> ${expected}`, () => {
      assert.equal(resolveUseNativeDriver(options, os), expected);
    });
  }

  it("animate passes the resolved flag to the engine, off on a web platform mock and for layout properties", () => {
    const platform = Platform as unknown as { OS: string };
    const saved = platform.OS;
    const { engine, calls } = createFakeEngine();
    try {
      platform.OS = "web";
      animate(val(engine), 1, { engine, property: "opacity" });
      platform.OS = "ios";
      animate(val(engine), 1, { engine, property: "opacity" });
      animate(val(engine), 1, { engine, property: "height" });
    } finally {
      platform.OS = saved;
    }
    assert.deepEqual(calls.map((c) => (c.config as TimingConfig).useNativeDriver), [false, true, false]);
  });

  it("no console warning is emitted on web", () => {
    const platform = Platform as unknown as { OS: string };
    const saved = platform.OS;
    const warnings: unknown[] = [];
    const warn = console.warn;
    console.warn = (...args: unknown[]) => void warnings.push(args);
    try {
      platform.OS = "web";
      const { engine } = createFakeEngine();
      animate(val(engine), 1, { engine, useNativeDriver: true, property: "opacity" }).start();
    } finally {
      platform.OS = saved;
      console.warn = warn;
    }
    assert.deepEqual(warnings, []);
  });
});

describe("PLRNUI-143 engine is swappable", () => {
  it("a fake engine injected through the MotionProvider prop drives useAnimatedValue and useAnimate", () => {
    const { engine, calls } = createFakeEngine();
    let value!: MotionValue;
    let run!: ReturnType<typeof useAnimate>;
    function Probe() {
      value = useAnimatedValue(0.25);
      run = useAnimate();
      return null;
    }
    renderWithMotion(<MotionProvider engine={engine}><Probe /></MotionProvider>, false);
    assert.equal((value as FakeValue).current, 0.25, "created by the fake engine");
    run(value, 1, { duration: "fast" }).start();
    assert.equal(calls.length, 1);
    assert.equal((calls[0]!.config as TimingConfig).duration, 120);
  });

  it("useAnimatedValue keeps one value across re-renders", () => {
    const seen: MotionValue[] = [];
    function Probe() {
      seen.push(useAnimatedValue(1));
      return null;
    }
    const { renderer, mocks } = renderWithMotion(<Probe />, false);
    act(() => renderer.update(<CapabilityProvider adapters={mocks.adapters}><Probe /></CapabilityProvider>));
    assert.ok(seen.length >= 2);
    assert.equal(seen.at(-1), seen[0]);
  });

  it("without a provider the default engine falls back to a jump engine when Animated is missing (test shim)", () => {
    const engine = createDefaultEngine();
    const value = engine.createValue(0);
    const ends: MotionEnd[] = [];
    animate(value, 4, { engine, duration: "slow" }).start((r) => ends.push(r));
    assert.deepEqual(ends, [{ finished: true }]);
    assert.equal((value as unknown as { value: number }).value, 4);
  });

  it("the default engine maps timing, spring, loop and stop onto Animated", () => {
    const log: Array<[string, unknown]> = [];
    class Value {
      constructor(public initial: number) {}
      setValue() {}
      stopAnimation() {
        log.push(["stopAnimation", this.initial]);
      }
    }
    const make = (name: string) => (value: unknown, config: Record<string, unknown>) => {
      log.push([name, config]);
      return { start: (cb?: (r: MotionEnd) => void) => cb?.({ finished: true }), stop() {} };
    };
    const engine = createDefaultEngine({
      Animated: { Value: Value as never, timing: make("timing"), spring: make("spring"), loop: (h: unknown, c?: Record<string, unknown>) => (log.push(["loop", c]), h as never) },
    });
    const v = engine.createValue(2);
    engine.timing(v, 1, { duration: 50, easing: toEasing("standard"), useNativeDriver: false }).start();
    engine.spring(v, 1, { stiffness: 1, damping: 2, mass: 3, useNativeDriver: true });
    const composite = { start() {}, stop() {}, reset() {} } as MotionHandle;
    engine.loop(composite, { iterations: 3 });
    engine.loop(composite);
    engine.stop(v);
    assert.equal((log[0]![1] as Record<string, unknown>).toValue, 1);
    assert.equal((log[0]![1] as Record<string, unknown>).duration, 50);
    assert.deepEqual(log[1], ["spring", { toValue: 1, stiffness: 1, damping: 2, mass: 3, useNativeDriver: true }]);
    assert.deepEqual(log[2], ["loop", { iterations: 3 }]);
    assert.deepEqual(log[3], ["loop", { iterations: -1 }]);
    assert.deepEqual(log[4], ["stopAnimation", 2]);
  });

  it("the default engine returns a handle without Animated's reset() unchanged instead of crashing in loop", () => {
    const engine = createDefaultEngine({
      Animated: {
        Value: class { setValue() {} } as never,
        timing: () => ({ start() {}, stop() {} }),
        spring: () => ({ start() {}, stop() {} }),
        loop: () => {
          throw new Error("Animated.loop must not receive a foreign handle");
        },
      },
    });
    const reduced = animate(engine.createValue(0), 1, { engine, reduceMotion: true });
    assert.equal(engine.loop(reduced), reduced);
    const composite = { start() {}, stop() {}, reset() {} } as MotionHandle;
    assert.throws(() => engine.loop(composite), /must not receive/, "a real composite is passed to Animated.loop");
  });

  it("the jump engine never loops and stop is a no-op", () => {
    const engine = createJumpEngine();
    const handle: MotionHandle = engine.timing(engine.createValue(0), 1, { duration: 1, easing: (t) => t, useNativeDriver: false });
    assert.equal(engine.loop(handle), handle);
    assert.doesNotThrow(() => engine.stop(engine.createValue(0)));
  });
});

describe("PLRNUI-143 no reanimated", () => {
  it("none of the motion sources import react-native-reanimated", () => {
    for (const file of ["engine.ts", "animate.ts", "useAnimatedValue.ts"]) {
      const text = readFileSync(`src/motion/${file}`, "utf8");
      for (const m of text.matchAll(/(?:from|import|require)\s*\(?\s*["']([^"']+)["']/g)) assert.ok(!/reanimated/i.test(m[1]!), `${file} imports ${m[1]}`);
    }
  });
});
