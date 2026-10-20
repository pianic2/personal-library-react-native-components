import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { act } from "react-test-renderer";
import { MotionProvider } from "../../src/motion/MotionProvider.js";
import type { MotionEngine, MotionValue } from "../../src/motion/engine.js";
import { useDrag, type UseDragOptions, type UseDragResult } from "../../src/gestures/useDrag.js";
import { Draggable } from "../../src/gestures/Draggable.js";
import { motion } from "../../src/tokens/motion.base.js";
import { renderWithMotion } from "../helpers/motion.js";

interface FakeValue extends MotionValue {
  current: number;
}

function createFakeEngine() {
  const springs: Array<{ to: number; stiffness: number; damping: number }> = [];
  const pending: Array<() => void> = [];
  const engine: MotionEngine = {
    createValue(initial) {
      const v: FakeValue = { current: initial, setValue(n) { v.current = n; } };
      return v;
    },
    timing: () => {
      throw new Error("drag uses springs");
    },
    spring(value, to, config) {
      springs.push({ to, stiffness: config.stiffness, damping: config.damping });
      return {
        start(onEnd) {
          pending.push(() => {
            value.setValue(to);
            onEnd?.({ finished: true });
          });
        },
        stop() {},
      };
    },
    loop: (h) => h,
    stop() {},
  };
  return { engine, springs, flush: () => pending.splice(0).forEach((f) => f()) };
}

function mount(options: UseDragOptions, reduceMotion = false) {
  const fake = createFakeEngine();
  let drag!: UseDragResult;
  function Probe() {
    drag = useDrag(options);
    return null;
  }
  renderWithMotion(
    <MotionProvider engine={fake.engine}>
      <Probe />
    </MotionProvider>,
    reduceMotion
  );
  const pos = () => ({ x: (drag.position.x as FakeValue).current, y: (drag.position.y as FakeValue).current });
  return { ...fake, drag: () => drag, pos };
}

describe("useDrag", () => {
  it("clamps the drag to bounds", () => {
    const h = mount({ bounds: { minX: -10, maxX: 50, minY: 0, maxY: 20 } });
    act(() => { h.drag().gesture.start(); h.drag().gesture.move(200, -40); });
    assert.deepEqual(h.pos(), { x: 50, y: 0 });
    act(() => h.drag().gesture.move(-200, 99));
    assert.deepEqual(h.pos(), { x: -10, y: 20 });
  });

  it("release picks the nearest snap point and springs with the spring token", () => {
    const onEnd: unknown[] = [];
    const h = mount({ axis: "x", snapPoints: [{ x: 0 }, { x: 100 }, { x: 300 }], onEnd: (p) => onEnd.push(p) });
    act(() => { h.drag().gesture.start(); h.drag().gesture.move(180, 0); h.drag().gesture.release(); });
    assert.equal(h.springs[0]?.to, 100);
    assert.equal(h.springs[0]?.stiffness, motion.spring.snappy.stiffness);
    assert.equal(onEnd.length, 0);
    act(() => h.flush());
    assert.deepEqual(h.pos(), { x: 100, y: 0 });
    assert.deepEqual(onEnd, [{ x: 100, y: 0 }]);
  });

  it("axis='x' ignores dy", () => {
    const h = mount({ axis: "x" });
    act(() => { h.drag().gesture.start(); h.drag().gesture.move(30, 70); });
    assert.deepEqual(h.pos(), { x: 30, y: 0 });
  });

  it("axis='y' ignores dx", () => {
    const h = mount({ axis: "y" });
    act(() => { h.drag().gesture.start(); h.drag().gesture.move(30, 70); });
    assert.deepEqual(h.pos(), { x: 0, y: 70 });
  });

  it("reduced motion snaps without animation", () => {
    const onEnd: unknown[] = [];
    const h = mount({ snapPoints: [{ x: 0, y: 0 }, { x: 100, y: 0 }], onEnd: (p) => onEnd.push(p) }, true);
    act(() => { h.drag().gesture.start(); h.drag().gesture.move(80, 5); h.drag().gesture.release(); });
    assert.equal(h.springs.length, 0);
    assert.deepEqual(h.pos(), { x: 100, y: 0 });
    assert.deepEqual(onEnd, [{ x: 100, y: 0 }]);
  });

  it("a second drag starts from the settled position", () => {
    const h = mount({ axis: "x" });
    act(() => { h.drag().gesture.start(); h.drag().gesture.move(40, 0); h.drag().gesture.release(); h.flush(); });
    act(() => { h.drag().gesture.start(); h.drag().gesture.move(10, 0); });
    assert.equal(h.pos().x, 50);
  });

  it("disabled ignores the gesture", () => {
    const h = mount({ disabled: true });
    act(() => { h.drag().gesture.start(); h.drag().gesture.move(10, 10); h.drag().gesture.release(); });
    assert.deepEqual(h.pos(), { x: 0, y: 0 });
    assert.equal(h.springs.length, 0);
  });
});

describe("Draggable", () => {
  it("renders its children", () => {
    const { renderer } = renderWithMotion(<Draggable testID="d" axis="x"><React.Fragment>child</React.Fragment></Draggable>);
    assert.ok(renderer.root.findAll((n) => n.props?.testID === "d").length > 0);
  });
});
