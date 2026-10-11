import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { act } from "react-test-renderer";
import { MotionProvider } from "../../src/motion/MotionProvider.js";
import type { MotionEngine, MotionValue, TimingConfig } from "../../src/motion/engine.js";
import { usePressFeedback, type PressFeedback, type PressFeedbackOptions } from "../../src/motion/usePressFeedback.js";
import { CapabilityProvider } from "../../src/native/core/index.js";
import { createFakeClock } from "../../src/native/testing/index.js";
import { motion } from "../../src/tokens/motion.base.js";
import { renderWithMotion } from "../helpers/motion.js";

interface FakeValue extends MotionValue {
  current: number;
}

function createFakeEngine() {
  const clock = createFakeClock();
  const timings: Array<{ to: number; config: TimingConfig }> = [];
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
    spring: () => {
      throw new Error("press feedback uses timing");
    },
    loop: (handle) => handle,
    stop() {},
  };
  return { engine, clock, timings };
}

function mount(options: PressFeedbackOptions, reduceMotion = false) {
  const { engine, clock, timings } = createFakeEngine();
  let feedback!: PressFeedback;
  function Probe() {
    feedback = usePressFeedback(options);
    return null;
  }
  const rendered = renderWithMotion(
    <MotionProvider engine={engine}>
      <Probe />
    </MotionProvider>,
    reduceMotion
  );
  const scale = () => (feedback.style.transform?.[0].scale as FakeValue | undefined)?.current;
  const opacity = () => (feedback.style.opacity as FakeValue).current;
  return { get feedback() { return feedback; }, clock, timings, scale, opacity, mocks: rendered.mocks, unmount: () => rendered.renderer.unmount() };
}

describe("PLRNUI-157 usePressFeedback", () => {
  it("pressing in animates the scale to the token value and releasing returns it to 1", () => {
    const m = mount({});
    assert.equal(m.scale(), 1);
    assert.equal(m.opacity(), 1);
    m.feedback.handlers.onPressIn();
    m.clock.advance(motion.duration.fast - 1);
    assert.equal(m.scale(), 1, "not there yet one millisecond before the end");
    m.clock.advance(1);
    assert.equal(m.scale(), motion.scale.press);
    assert.equal(m.scale(), 0.97);
    assert.equal(m.opacity(), 0.85);
    m.feedback.handlers.onPressOut();
    m.clock.advance(motion.duration.base);
    assert.equal(m.scale(), 1);
    assert.equal(m.opacity(), 1);
  });

  it("uses the fast duration to press in and the base duration to release, with the standard easing", () => {
    const m = mount({});
    m.feedback.handlers.onPressIn();
    m.feedback.handlers.onPressOut();
    assert.deepEqual(m.timings.map((t) => t.config.duration), [motion.duration.fast, motion.duration.fast, motion.duration.base, motion.duration.base]);
    assert.deepEqual(m.timings.map((t) => t.to), [0.97, 0.85, 1, 1]);
    assert.ok(m.timings.every((t) => t.config.easing(0) === 0 && t.config.easing(1) === 1));
  });

  it("custom scale and opacity are used; scale false removes the transform", () => {
    const custom = mount({ scale: 0.9, opacity: 0.5 });
    custom.feedback.handlers.onPressIn();
    custom.clock.advance(motion.duration.fast);
    assert.equal(custom.scale(), 0.9);
    assert.equal(custom.opacity(), 0.5);
    const noScale = mount({ scale: false });
    assert.equal(noScale.feedback.style.transform, undefined);
    noScale.feedback.handlers.onPressIn();
    noScale.clock.advance(motion.duration.fast);
    assert.equal(noScale.opacity(), 0.85);
  });

  it("a release in the middle of a press-in restarts from the current values and ends at 1", () => {
    const m = mount({});
    m.feedback.handlers.onPressIn();
    m.clock.advance(60);
    m.feedback.handlers.onPressOut();
    m.clock.advance(motion.duration.fast + motion.duration.base);
    assert.equal(m.scale(), 1);
    assert.equal(m.opacity(), 1);
    assert.equal(m.clock.pending(), 0);
  });
});

describe("PLRNUI-157 disabled", () => {
  it("disabled disables feedback: no animation, no ripple, values stay at 1", () => {
    const m = mount({ disabled: true, stateLayer: "rgba-from-theme" });
    m.feedback.handlers.onPressIn();
    m.clock.advance(1000);
    assert.equal(m.timings.length, 0);
    assert.equal(m.scale(), 1);
    assert.equal(m.opacity(), 1);
    assert.equal(m.feedback.android_ripple, undefined);
    m.feedback.handlers.onPressOut();
    assert.equal(m.timings.length, 0);
  });

  it("re-enabling restores feedback", () => {
    const { engine, clock, timings } = createFakeEngine();
    let feedback!: PressFeedback;
    function Probe({ disabled }: { disabled: boolean }) {
      feedback = usePressFeedback({ disabled });
      return null;
    }
    const tree = (mocks: ReturnType<typeof renderWithMotion>["mocks"], disabled: boolean) => (
      <CapabilityProvider adapters={mocks.adapters}>
        <MotionProvider engine={engine}>
          <Probe disabled={disabled} />
        </MotionProvider>
      </CapabilityProvider>
    );
    const { renderer, mocks } = renderWithMotion(
      <MotionProvider engine={engine}>
        <Probe disabled />
      </MotionProvider>,
      false
    );
    feedback.handlers.onPressIn();
    assert.equal(timings.length, 0);
    act(() => renderer.update(tree(mocks, false)));
    feedback.handlers.onPressIn();
    clock.advance(motion.duration.fast);
    assert.equal(timings.length, 2, "scale and opacity animate once enabled");
  });
});

describe("PLRNUI-157 lifecycle and robustness", () => {
  it("unmounting mid-animation stops the running animations", () => {
    const m = mount({});
    m.feedback.handlers.onPressIn();
    assert.equal(m.clock.pending(), 2);
    act(() => m.unmount());
    assert.equal(m.clock.pending(), 0, "both animations were cancelled");
  });

  it("a control that becomes disabled while pressed returns to rest and stops its animation", () => {
    const { engine, clock } = createFakeEngine();
    let feedback!: PressFeedback;
    function Probe({ disabled }: { disabled: boolean }) {
      feedback = usePressFeedback({ disabled });
      return null;
    }
    const tree = (mocks: ReturnType<typeof renderWithMotion>["mocks"], disabled: boolean) => (
      <CapabilityProvider adapters={mocks.adapters}>
        <MotionProvider engine={engine}>
          <Probe disabled={disabled} />
        </MotionProvider>
      </CapabilityProvider>
    );
    const { renderer, mocks } = renderWithMotion(<MotionProvider engine={engine}><Probe disabled={false} /></MotionProvider>, false);
    feedback.handlers.onPressIn();
    clock.advance(motion.duration.fast);
    const scale = () => (feedback.style.transform?.[0].scale as FakeValue).current;
    const opacity = () => (feedback.style.opacity as FakeValue).current;
    assert.equal(scale(), 0.97);
    assert.equal(opacity(), 0.85);
    act(() => renderer.update(tree(mocks, true)));
    assert.equal(scale(), 1);
    assert.equal(opacity(), 1);
    assert.equal(clock.pending(), 0);
  });

  it("an in-flight press-in is cancelled when the control becomes disabled", () => {
    const { engine, clock } = createFakeEngine();
    let feedback!: PressFeedback;
    function Probe({ disabled }: { disabled: boolean }) {
      feedback = usePressFeedback({ disabled });
      return null;
    }
    const { renderer, mocks } = renderWithMotion(<MotionProvider engine={engine}><Probe disabled={false} /></MotionProvider>, false);
    feedback.handlers.onPressIn();
    clock.advance(50);
    act(() =>
      renderer.update(
        <CapabilityProvider adapters={mocks.adapters}>
          <MotionProvider engine={engine}>
            <Probe disabled />
          </MotionProvider>
        </CapabilityProvider>
      )
    );
    clock.advance(1000);
    assert.equal((feedback.style.opacity as FakeValue).current, 1, "the cancelled animation never lands on the pressed value");
  });

  it("switching to reduced motion mid-press resets the scale so it is not stuck when motion returns", () => {
    const m = mount({}, false);
    m.feedback.handlers.onPressIn();
    m.clock.advance(motion.duration.fast);
    assert.equal(m.scale(), 0.97);
    act(() => m.mocks.setAccessibility({ reduceMotion: true }));
    act(() => m.mocks.setAccessibility({ reduceMotion: false }));
    assert.equal(m.scale(), 1);
  });

  it("invalid scale and opacity options fall back to the defaults", () => {
    for (const bad of [Number.NaN, 0, -1, 2, Number.POSITIVE_INFINITY]) {
      const m = mount({ scale: bad, opacity: bad });
      m.feedback.handlers.onPressIn();
      m.clock.advance(motion.duration.fast);
      assert.equal(m.scale(), 0.97, `scale ${bad}`);
      assert.equal(m.opacity(), 0.85, `opacity ${bad}`);
    }
  });

  it("the mid-press release restarts from the current value and ends at rest", () => {
    const m = mount({});
    m.feedback.handlers.onPressIn();
    m.clock.advance(60);
    assert.equal(m.scale(), 1, "the fake engine lands only at the end of a timing");
    m.feedback.handlers.onPressOut();
    assert.deepEqual(m.timings.slice(-2).map((t) => t.to).sort(), [1, 1]);
    m.clock.advance(motion.duration.base);
    assert.equal(m.scale(), 1);
    assert.equal(m.opacity(), 1);
  });
});

describe("PLRNUI-157 reduced motion", () => {
  it("with reduced motion mocked the style changes opacity only: no transform, no scale animation", () => {
    const m = mount({}, true);
    assert.equal(m.feedback.style.transform, undefined);
    m.feedback.handlers.onPressIn();
    assert.equal(m.opacity(), 0.85, "opacity changes at once");
    assert.equal(m.timings.length, 0, "nothing is animated");
    m.feedback.handlers.onPressOut();
    assert.equal(m.opacity(), 1);
    assert.equal(m.feedback.style.transform, undefined);
  });

  it("follows the system setting live", () => {
    const m = mount({}, false);
    assert.ok(m.feedback.style.transform);
    act(() => m.mocks.setAccessibility({ reduceMotion: true }));
    assert.equal(m.feedback.style.transform, undefined);
    act(() => m.mocks.setAccessibility({ reduceMotion: false }));
    assert.ok(m.feedback.style.transform);
  });
});

describe("PLRNUI-157 Android ripple and no PressableScale", () => {
  it("android_ripple uses the semantic state-layer color when given and enabled", () => {
    const m = mount({ stateLayer: "state-layer-color" });
    assert.deepEqual(m.feedback.android_ripple, { color: "state-layer-color", borderless: false });
    assert.equal(mount({}).feedback.android_ripple, undefined);
  });

  it("there is no PressableScale component (Touchable is the only press primitive)", () => {
    assert.equal(existsSync("src/motion/PressableScale.tsx"), false);
  });
});
