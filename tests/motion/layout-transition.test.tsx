import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { act } from "react-test-renderer";
import { MotionProvider } from "../../src/motion/MotionProvider.js";
import { CapabilityProvider } from "../../src/native/core/index.js";
import {
  animateNextLayout,
  layoutConfigFor,
  useLayoutTransition,
  type LayoutAnimationConfig,
  type LayoutPreset,
  type LayoutTransitionHost,
} from "../../src/motion/layoutTransition.js";
import { motion } from "../../src/tokens/motion.base.js";
import { renderWithMotion } from "../helpers/motion.js";

function fakeHost(os = "ios") {
  const configs: LayoutAnimationConfig[] = [];
  const flagCalls: boolean[] = [];
  const host: LayoutTransitionHost = {
    LayoutAnimation: { configureNext: (config) => void configs.push(config) },
    UIManager: { setLayoutAnimationEnabledExperimental: (enabled) => void flagCalls.push(enabled) },
    Platform: { OS: os },
  };
  return { host, configs, flagCalls };
}

describe("PLRNUI-171 animateNextLayout", () => {
  const durations: Array<[LayoutPreset, number]> = [
    ["ease", motion.duration.base],
    ["spring", motion.duration.slow],
    ["fade", motion.duration.fast],
  ];
  for (const [preset, duration] of durations) {
    it(`${preset}: configureNext is called once with the token duration ${duration}`, () => {
      const { host, configs } = fakeHost();
      assert.equal(animateNextLayout(preset, { host }), true);
      assert.equal(configs.length, 1);
      assert.equal(configs[0]!.duration, duration);
      assert.deepEqual(configs[0], layoutConfigFor(preset));
    });
  }

  it("the spring preset derives its damping ratio from the gentle spring token, inside 0..1", () => {
    const config = layoutConfigFor("spring");
    const { stiffness, damping, mass } = motion.spring.gentle;
    const expected = damping / (2 * Math.sqrt(stiffness * mass));
    assert.ok(Math.abs(config.update!.springDamping! - expected) < 1e-9);
    assert.ok(config.update!.springDamping! > 0 && config.update!.springDamping! <= 1);
  });

  it("is not called under reduced motion and returns false", () => {
    const { host, configs } = fakeHost();
    assert.equal(animateNextLayout("ease", { host, reduceMotion: true }), false);
    assert.equal(configs.length, 0);
  });

  it("is not called on web", () => {
    const { host, configs } = fakeHost("web");
    assert.equal(animateNextLayout("fade", { host }), false);
    assert.equal(configs.length, 0);
  });

  it("a missing LayoutAnimation, a missing configureNext, a missing UIManager and a missing Platform do not throw", () => {
    assert.equal(animateNextLayout("ease", { host: {} }), false);
    assert.equal(animateNextLayout("ease", { host: { LayoutAnimation: {} } }), false);
    const configs: LayoutAnimationConfig[] = [];
    const android: LayoutTransitionHost = { LayoutAnimation: { configureNext: (c) => void configs.push(c) }, Platform: { OS: "android" } };
    assert.equal(animateNextLayout("ease", { host: android }), true, "android without UIManager still animates");
    assert.equal(configs.length, 1);
  });

  it("a throwing configureNext is swallowed and reported as false", () => {
    const host: LayoutTransitionHost = {
      LayoutAnimation: {
        configureNext: () => {
          throw new Error("native failure");
        },
      },
      Platform: { OS: "ios" },
    };
    assert.equal(animateNextLayout("ease", { host }), false);
  });

  it("android: enables the legacy experimental flag once per UIManager when the New Architecture is off", () => {
    const g = globalThis as { nativeFabricUIManager?: unknown };
    const saved = g.nativeFabricUIManager;
    delete g.nativeFabricUIManager;
    try {
      const { host, flagCalls } = fakeHost("android");
      animateNextLayout("ease", { host });
      animateNextLayout("fade", { host });
      assert.deepEqual(flagCalls, [true]);
    } finally {
      if (saved !== undefined) g.nativeFabricUIManager = saved;
    }
  });

  it("android under the New Architecture: the experimental flag is not called but the transition still is", () => {
    const g = globalThis as { nativeFabricUIManager?: unknown };
    const saved = g.nativeFabricUIManager;
    g.nativeFabricUIManager = {};
    try {
      const { host, flagCalls, configs } = fakeHost("android");
      assert.equal(animateNextLayout("ease", { host }), true);
      assert.deepEqual(flagCalls, []);
      assert.equal(configs.length, 1);
    } finally {
      if (saved === undefined) delete g.nativeFabricUIManager;
      else g.nativeFabricUIManager = saved;
    }
  });

  it("ios never touches the android flag", () => {
    const { host, flagCalls } = fakeHost("ios");
    animateNextLayout("ease", { host });
    assert.deepEqual(flagCalls, []);
  });

  it("a throwing android flag does not stop the transition", () => {
    const g = globalThis as { nativeFabricUIManager?: unknown };
    const saved = g.nativeFabricUIManager;
    delete g.nativeFabricUIManager;
    try {
      const configs: LayoutAnimationConfig[] = [];
      const host: LayoutTransitionHost = {
        LayoutAnimation: { configureNext: (c) => void configs.push(c) },
        UIManager: {
          setLayoutAnimationEnabledExperimental: () => {
            throw new Error("stripped");
          },
        },
        Platform: { OS: "android" },
      };
      assert.equal(animateNextLayout("ease", { host }), true);
      assert.equal(configs.length, 1);
    } finally {
      if (saved !== undefined) g.nativeFabricUIManager = saved;
    }
  });

  it("with the real react-native test shim (no LayoutAnimation) it does not throw", () => {
    assert.equal(animateNextLayout("ease"), false);
  });
});

describe("PLRNUI-171 useLayoutTransition", () => {
  function Probe({ host, run }: { host: LayoutTransitionHost; run: (fn: ReturnType<typeof useLayoutTransition>) => void }) {
    run(useLayoutTransition({ host }));
    return null;
  }

  it("calls configureNext before the update callback", () => {
    const order: string[] = [];
    const host: LayoutTransitionHost = { LayoutAnimation: { configureNext: () => void order.push("configure") }, Platform: { OS: "ios" } };
    let transition!: ReturnType<typeof useLayoutTransition>;
    renderWithMotion(<Probe host={host} run={(fn) => (transition = fn)} />, false);
    transition("ease", () => order.push("update"));
    assert.deepEqual(order, ["configure", "update"]);
  });

  it("under the system reduced-motion setting it skips configureNext but still runs the update", () => {
    const order: string[] = [];
    const host: LayoutTransitionHost = { LayoutAnimation: { configureNext: () => void order.push("configure") }, Platform: { OS: "ios" } };
    let transition!: ReturnType<typeof useLayoutTransition>;
    renderWithMotion(<Probe host={host} run={(fn) => (transition = fn)} />, true);
    transition("ease", () => order.push("update"));
    assert.deepEqual(order, ["update"]);
  });

  it("follows the MotionProvider override ('always' skips, 'never' animates over a system true) and a live system change", () => {
    const order: string[] = [];
    const host: LayoutTransitionHost = { LayoutAnimation: { configureNext: () => void order.push("configure") }, Platform: { OS: "ios" } };
    let transition!: ReturnType<typeof useLayoutTransition>;
    renderWithMotion(
      <MotionProvider reduceMotion="never">
        <Probe host={host} run={(fn) => (transition = fn)} />
      </MotionProvider>,
      true
    );
    transition("fade", () => order.push("update"));
    assert.deepEqual(order, ["configure", "update"]);

    order.length = 0;
    renderWithMotion(
      <MotionProvider reduceMotion="always">
        <Probe host={host} run={(fn) => (transition = fn)} />
      </MotionProvider>,
      false
    );
    transition("fade", () => order.push("update"));
    assert.deepEqual(order, ["update"]);

    order.length = 0;
    const live = renderWithMotion(<Probe host={host} run={(fn) => (transition = fn)} />, false);
    transition("fade", () => order.push("update"));
    assert.deepEqual(order, ["configure", "update"]);
    order.length = 0;
    act(() => live.mocks.setAccessibility({ reduceMotion: true }));
    transition("fade", () => order.push("update"));
    assert.deepEqual(order, ["update"]);
  });

  it("returns a stable function while the preference and the host are unchanged", () => {
    const host: LayoutTransitionHost = { Platform: { OS: "ios" } };
    const seen: unknown[] = [];
    const { renderer, mocks } = renderWithMotion(<Probe host={host} run={(fn) => seen.push(fn)} />, false);
    act(() => renderer.update(<CapabilityProvider adapters={mocks.adapters}><Probe host={host} run={(fn) => seen.push(fn)} /></CapabilityProvider>));
    assert.ok(seen.length >= 2);
    assert.equal(seen.at(-1), seen[0]);
    act(() => mocks.setAccessibility({ reduceMotion: true }));
    assert.notEqual(seen.at(-1), seen[0], "a changed preference gives a new function");
  });
});
