import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { createSwipeConfig, type UseSwipeOptions } from "../../src/gestures/useSwipe.js";

type Cfg = {
  onMoveShouldSetPanResponder(e: unknown, g: unknown): boolean;
  onPanResponderRelease(e: unknown, g: unknown): void;
};
const g = (dx: number, dy: number, vx = 0, vy = 0) => ({ dx, dy, vx, vy });

function setup(extra: Partial<UseSwipeOptions> = {}) {
  const calls: string[] = [];
  const opts: UseSwipeOptions = {
    onSwipeLeft: () => calls.push("left"),
    onSwipeRight: () => calls.push("right"),
    onSwipeUp: () => calls.push("up"),
    onSwipeDown: () => calls.push("down"),
    ...extra,
  };
  const cfg = createSwipeConfig(() => opts) as unknown as Cfg;
  return { calls, cfg };
}

describe("PLRNUI-252 useSwipe", () => {
  it("fires the matching callback once for pans beyond the threshold", () => {
    const { calls, cfg } = setup();
    cfg.onPanResponderRelease({}, g(-80, 5));
    cfg.onPanResponderRelease({}, g(80, -5));
    cfg.onPanResponderRelease({}, g(3, -90));
    cfg.onPanResponderRelease({}, g(-3, 90));
    assert.deepEqual(calls, ["left", "right", "up", "down"]);
  });

  it("fires nothing below the threshold, and honours a custom threshold", () => {
    const { calls, cfg } = setup();
    cfg.onPanResponderRelease({}, g(-47, 0));
    assert.deepEqual(calls, []);
    const custom = setup({ threshold: 20 });
    custom.cfg.onPanResponderRelease({}, g(25, 0));
    assert.deepEqual(custom.calls, ["right"]);
  });

  it("completes a short swipe only when it is fast enough", () => {
    const { calls, cfg } = setup({ velocity: 0.5 });
    cfg.onPanResponderRelease({}, g(-20, 0, -0.2));
    assert.deepEqual(calls, []);
    cfg.onPanResponderRelease({}, g(-20, 0, -0.9));
    assert.deepEqual(calls, ["left"]);
  });

  it("horizontal-only mode does not claim the responder for a vertical move", () => {
    const { calls, cfg } = setup({ directionLock: "horizontal" });
    assert.equal(cfg.onMoveShouldSetPanResponder({}, g(2, 60)), false);
    assert.equal(cfg.onMoveShouldSetPanResponder({}, g(30, 4)), true);
    cfg.onPanResponderRelease({}, g(2, 90));
    assert.deepEqual(calls, []);
  });

  it("vertical-only mode ignores horizontal moves", () => {
    const { cfg } = setup({ directionLock: "vertical" });
    assert.equal(cfg.onMoveShouldSetPanResponder({}, g(60, 2)), false);
    assert.equal(cfg.onMoveShouldSetPanResponder({}, g(2, 60)), true);
  });

  it("does not claim taps and ignores everything when disabled", () => {
    const { calls, cfg } = setup();
    assert.equal(cfg.onMoveShouldSetPanResponder({}, g(3, 2)), false);
    const off = setup({ disabled: true });
    assert.equal(off.cfg.onMoveShouldSetPanResponder({}, g(90, 0)), false);
    off.cfg.onPanResponderRelease({}, g(90, 0));
    assert.deepEqual(off.calls, []);
    assert.deepEqual(calls, []);
  });

  it("reads the latest options at release time", () => {
    let opts: UseSwipeOptions = { onSwipeLeft: () => calls.push("old") };
    const calls: string[] = [];
    const cfg = createSwipeConfig(() => opts) as unknown as Cfg;
    opts = { onSwipeLeft: () => calls.push("new") };
    cfg.onPanResponderRelease({}, g(-90, 0));
    assert.deepEqual(calls, ["new"]);
  });
});
