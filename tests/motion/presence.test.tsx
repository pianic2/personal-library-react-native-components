import React, { useEffect } from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";
import { MotionProvider } from "../../src/motion/MotionProvider.js";
import type { MotionEngine, MotionValue, SpringConfig, TimingConfig } from "../../src/motion/engine.js";
import { Presence, type PresenceProps } from "../../src/motion/Presence.js";
import { isPresencePreset, PRESENCE_PRESETS, PRESENCE_SCALE_FROM, PRESENCE_VISIBLE, presenceHidden } from "../../src/motion/presets.js";
import { CapabilityProvider } from "../../src/native/core/index.js";
import { createFakeClock } from "../../src/native/testing/index.js";
import { motion, type MotionTokens } from "../../src/tokens/motion.base.js";
import { createMotionMocks, renderWithMotion } from "../helpers/motion.js";

interface FakeValue extends MotionValue {
  current: number;
}

function createFakeEngine() {
  const clock = createFakeClock();
  const timings: Array<{ to: number; config: TimingConfig }> = [];
  const springs: Array<{ to: number; config: SpringConfig }> = [];
  const engine: MotionEngine = {
    createValue(initial) {
      const v: FakeValue = { current: initial, setValue(next) { v.current = next; } };
      return v;
    },
    timing(value, to, config) {
      timings.push({ to, config });
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
      springs.push({ to, config });
      let cancel: (() => void) | undefined;
      return {
        start(onEnd) {
          cancel = clock.setTimeout(() => {
            value.setValue(to);
            onEnd?.({ finished: true });
          }, 100);
        },
        stop() {
          cancel?.();
        },
      };
    },
    loop: (handle) => handle,
    stop() {},
  };
  return { engine, clock, timings, springs };
}

const mounts = { count: 0, unmounts: 0 };
function Child() {
  useEffect(() => {
    mounts.count += 1;
    return () => {
      mounts.unmounts += 1;
    };
  }, []);
  return React.createElement("Text", { testID: "child" }, "hello");
}

function setup(props: Partial<PresenceProps> & { visible: boolean }, reduceMotion: "system" | "always" | "never" = "never") {
  mounts.count = 0;
  mounts.unmounts = 0;
  const fake = createFakeEngine();
  const mocks = createMotionMocks(false);
  // The same wrapper on every update, otherwise the renderer would remount the whole tree.
  const ui = (p: Partial<PresenceProps> & { visible: boolean }) => (
    <CapabilityProvider adapters={mocks.adapters}>
      <MotionProvider engine={fake.engine} reduceMotion={reduceMotion}>
        <Presence {...p}>
          <Child />
        </Presence>
      </MotionProvider>
    </CapabilityProvider>
  );
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(ui(props));
  });
  const update = (next: Partial<PresenceProps> & { visible: boolean }) =>
    act(() => {
      renderer.update(ui(next));
    });
  const hasChild = (r: ReactTestRenderer = renderer) => r.root.findAll((n) => n.props.testID === "child" && typeof n.type === "string").length > 0;
  const wrapper = () => renderer.root.findAll((n) => String(n.type) === "View")[0];
  return { ...fake, renderer, update, hasChild, wrapper };
}

describe("Presence (PLRNUI-149)", () => {
  it("renders the children visible without animating on the first render", () => {
    const t = setup({ visible: true });
    assert.equal(t.hasChild(), true);
    assert.equal(t.timings.length, 0);
    assert.equal(t.springs.length, 0);
  });

  it("renders nothing while hidden", () => {
    const t = setup({ visible: false });
    assert.equal(t.hasChild(), false);
    assert.equal(t.timings.length, 0);
  });

  it("unmounts the child only after the exit completes (fake timers)", () => {
    let exited = 0;
    const t = setup({ visible: true, onExited: () => (exited += 1) });
    t.update({ visible: false, onExited: () => (exited += 1) });
    assert.equal(t.hasChild(), true, "still mounted right after hiding");
    act(() => t.clock.advance(motion.duration.fast - 1));
    assert.equal(t.hasChild(), true, "still mounted one ms before the end");
    assert.equal(exited, 0);
    act(() => t.clock.advance(1));
    assert.equal(t.hasChild(), false);
    assert.equal(exited, 1);
    act(() => t.clock.advance(1000));
    assert.equal(exited, 1, "onExited fires once");
  });

  it("uses the duration prop (token name or milliseconds)", () => {
    const named = setup({ visible: true });
    named.update({ visible: false, duration: "slow" });
    assert.ok(named.timings.every((x) => x.config.duration === motion.duration.slow));
    act(() => named.clock.advance(motion.duration.slow - 1));
    assert.equal(named.hasChild(), true);
    act(() => named.clock.advance(1));
    assert.equal(named.hasChild(), false);

    const ms = setup({ visible: true });
    ms.update({ visible: false, duration: 50 });
    assert.ok(ms.timings.every((x) => x.config.duration === 50));
  });

  it("enters over the base duration and exits over the fast one by default", () => {
    const t = setup({ visible: false });
    t.update({ visible: true });
    assert.equal(t.hasChild(), true);
    assert.ok(t.timings.length > 0);
    assert.ok(t.timings.every((x) => x.config.duration === motion.duration.base));
    const entered = t.timings.length;
    t.update({ visible: false });
    assert.ok(t.timings.slice(entered).every((x) => x.config.duration === motion.duration.fast));
  });

  it("hides the exiting content from assistive technology and touches", () => {
    const t = setup({ visible: true });
    assert.equal(t.wrapper()?.props.accessibilityElementsHidden, undefined);
    t.update({ visible: false });
    const wrapper = t.wrapper();
    assert.equal(wrapper?.props.accessibilityElementsHidden, true);
    assert.equal(wrapper?.props.importantForAccessibility, "no-hide-descendants");
    assert.equal(wrapper?.props.pointerEvents, "none");
  });

  it("re-showing during the exit reverses without remounting the child", () => {
    let exited = 0;
    const t = setup({ visible: true, onExited: () => (exited += 1) });
    assert.equal(mounts.count, 1);
    t.update({ visible: false, onExited: () => (exited += 1) });
    act(() => t.clock.advance(60));
    t.update({ visible: true, onExited: () => (exited += 1) });
    assert.equal(t.wrapper()?.props.accessibilityElementsHidden, undefined, "no longer hidden once re-shown");
    act(() => t.clock.advance(5000));
    assert.equal(t.hasChild(), true);
    assert.equal(mounts.count, 1, "mounted once");
    assert.equal(mounts.unmounts, 0, "never unmounted");
    assert.equal(exited, 0, "an interrupted exit does not report onExited");
    assert.equal(t.clock.pending(), 0);
  });

  it("re-showing after a finished exit mounts the child again", () => {
    const t = setup({ visible: true });
    t.update({ visible: false });
    act(() => t.clock.advance(1000));
    assert.equal(t.hasChild(), false);
    t.update({ visible: true });
    assert.equal(t.hasChild(), true);
    assert.equal(mounts.count, 2);
  });

  it("hiding again after an interrupted exit still completes once", () => {
    let exited = 0;
    const onExited = () => (exited += 1);
    const t = setup({ visible: true, onExited });
    t.update({ visible: false, onExited });
    act(() => t.clock.advance(60));
    t.update({ visible: true, onExited });
    act(() => t.clock.advance(10));
    t.update({ visible: false, onExited });
    act(() => t.clock.advance(1000));
    assert.equal(t.hasChild(), false);
    assert.equal(exited, 1);
  });

  it("reduced motion unmounts immediately with no animation (and onExited fires)", () => {
    let exited = 0;
    const t = setup({ visible: true, preset: "slide-up", onExited: () => (exited += 1) }, "always");
    t.update({ visible: false, preset: "slide-up", onExited: () => (exited += 1) });
    assert.equal(t.hasChild(), false);
    assert.equal(exited, 1);
    assert.equal(t.timings.length, 0, "the engine is never asked to animate");
    assert.equal(t.clock.pending(), 0);
  });

  it("reduced motion also shows immediately", () => {
    const t = setup({ visible: false, preset: "scale" }, "always");
    t.update({ visible: true, preset: "scale" });
    assert.equal(t.hasChild(), true);
    assert.equal(t.timings.length, 0);
  });

  it("renders its children without a MotionProvider using the default motion tokens", () => {
    mounts.count = 0;
    const { renderer, mocks } = renderWithMotion(
      <Presence visible>
        <Child />
      </Presence>
    );
    assert.equal(renderer.root.findAll((n) => n.props.testID === "child" && typeof n.type === "string").length, 1);
    let exited = 0;
    act(() => {
      renderer.update(
        <CapabilityProvider adapters={mocks.adapters}>
          <Presence visible={false} onExited={() => (exited += 1)}>
            <Child />
          </Presence>
        </CapabilityProvider>
      );
    });
    // the default engine of a host without Animated jumps, so the exit ends on the spot
    assert.equal(renderer.root.findAll((n) => n.props.testID === "child" && typeof n.type === "string").length, 0);
    assert.equal(exited, 1);
  });

  it("animates each preset to its token-based hidden state on exit", () => {
    for (const preset of PRESENCE_PRESETS) {
      const t = setup({ visible: true, preset });
      t.update({ visible: false, preset });
      const hidden = presenceHidden(preset, motion);
      // order of the animated values: opacity, translateY, scale, scaleY
      assert.deepEqual(
        t.timings.map((x) => x.to),
        [hidden.opacity, hidden.translateY, hidden.scale, hidden.scaleY],
        preset
      );
    }
  });

  it("enters towards the visible state", () => {
    const t = setup({ visible: false, preset: "slide-down" });
    t.update({ visible: true, preset: "slide-down" });
    assert.deepEqual(
      t.timings.map((x) => x.to),
      [PRESENCE_VISIBLE.opacity, PRESENCE_VISIBLE.translateY, PRESENCE_VISIBLE.scale, PRESENCE_VISIBLE.scaleY]
    );
  });

  it("animates with a spring token when `spring` is set", () => {
    const t = setup({ visible: true, spring: "snappy" });
    t.update({ visible: false, spring: "snappy" });
    assert.equal(t.timings.length, 0);
    assert.equal(t.springs.length, 4);
    assert.equal(t.springs[0]?.config.stiffness, motion.spring.snappy.stiffness);
    act(() => t.clock.advance(100));
    assert.equal(t.hasChild(), false);
  });

  it("follows theme motion tokens passed through `tokens`", () => {
    const tokens = { ...motion, duration: { ...motion.duration, fast: 77 }, distance: { ...motion.distance, md: 40 } } as unknown as MotionTokens;
    const t = setup({ visible: true, preset: "slide-up", tokens });
    t.update({ visible: false, preset: "slide-up", tokens });
    assert.ok(t.timings.every((x) => x.config.duration === 77));
    assert.equal(t.timings[1]?.to, 40);
  });

  it("runs the enter animation on the first render with `appear`", () => {
    const t = setup({ visible: true, appear: true });
    assert.equal(t.hasChild(), true);
    assert.ok(t.timings.length > 0);
    assert.ok(t.timings.every((x) => x.config.duration === motion.duration.base));
  });

  it("falls back to fade for an unknown preset", () => {
    const t = setup({ visible: true, preset: "wiggle" as never });
    t.update({ visible: false, preset: "wiggle" as never });
    assert.deepEqual(
      t.timings.map((x) => x.to),
      [0, 0, 1, 1]
    );
  });

  it("stops its animations and skips onExited when unmounted mid-exit", () => {
    let exited = 0;
    const t = setup({ visible: true, onExited: () => (exited += 1) });
    t.update({ visible: false, onExited: () => (exited += 1) });
    assert.ok(t.clock.pending() > 0);
    act(() => t.renderer.unmount());
    assert.equal(t.clock.pending(), 0);
    act(() => t.clock.advance(1000));
    assert.equal(exited, 0);
  });

  it("applies the wrapper style", () => {
    const t = setup({ visible: true, style: { padding: 3 } });
    const style = t.wrapper()?.props.style as unknown[];
    assert.ok(style.some((s) => (s as { padding?: number } | undefined)?.padding === 3));
  });
});

describe("presence presets", () => {
  it("lists the five presets and recognises only those", () => {
    assert.deepEqual([...PRESENCE_PRESETS], ["fade", "slide-up", "slide-down", "scale", "collapse"]);
    assert.equal(isPresencePreset("fade"), true);
    assert.equal(isPresencePreset("spin"), false);
    assert.equal(isPresencePreset(undefined), false);
  });

  it("maps distances and scales to tokens", () => {
    assert.deepEqual(presenceHidden("fade", motion), { opacity: 0, translateY: 0, scale: 1, scaleY: 1 });
    assert.equal(presenceHidden("slide-up", motion).translateY, motion.distance.md);
    assert.equal(presenceHidden("slide-down", motion).translateY, -motion.distance.md);
    assert.equal(presenceHidden("scale", motion).scale, PRESENCE_SCALE_FROM);
    assert.equal(presenceHidden("collapse", motion).scaleY, 0);
  });

  it("reduces every preset to a plain fade under reduced motion", () => {
    for (const preset of PRESENCE_PRESETS) {
      assert.deepEqual(presenceHidden(preset, motion, true), { opacity: 0, translateY: 0, scale: 1, scaleY: 1 }, preset);
    }
  });
});
