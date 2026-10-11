import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { motion, toEasing, type MotionEasingName } from "../../src/tokens/motion.base.js";
import { createTheme } from "../../src/theme/createTheme.js";
import { defaultTheme } from "../../src/theme/defaultTheme.js";

const easingNames = Object.keys(motion.easing) as MotionEasingName[];

test("motion durations are non-negative numbers in non-decreasing order", () => {
  const values = Object.values(motion.duration);
  assert.deepEqual(Object.keys(motion.duration), ["instant", "fast", "base", "slow", "slower"]);
  for (const value of values) {
    assert.equal(typeof value, "number");
    assert.ok(value >= 0);
  }
  for (let i = 1; i < values.length; i += 1) {
    assert.ok(values[i]! >= values[i - 1]!, `duration ${i} must not be below duration ${i - 1}`);
  }
  assert.equal(motion.duration.instant, 0);
});

test("motion exposes the specified durations, springs, stagger, distance and press scale", () => {
  assert.deepEqual(motion.duration, { instant: 0, fast: 120, base: 200, slow: 320, slower: 480 });
  assert.deepEqual(motion.stagger, { fast: 30, base: 50 });
  assert.deepEqual(motion.distance, { sm: 8, md: 16, lg: 32 });
  assert.equal(motion.scale.press, 0.97);
  assert.deepEqual(Object.keys(motion.spring), ["gentle", "snappy", "bouncy"]);
  for (const spring of Object.values(motion.spring)) {
    assert.ok(spring.stiffness > 0 && spring.damping > 0 && spring.mass > 0);
  }
});

test("every easing is a cubic-bezier tuple with x control points in [0, 1]", () => {
  assert.deepEqual(easingNames, ["standard", "decelerate", "accelerate", "emphasized"]);
  for (const name of easingNames) {
    const tuple = motion.easing[name];
    assert.equal(tuple.length, 4);
    assert.ok(tuple.every((n) => typeof n === "number" && Number.isFinite(n)));
    assert.ok(tuple[0] >= 0 && tuple[0] <= 1 && tuple[2] >= 0 && tuple[2] <= 1, `${name} x control points`);
  }
});

test("toEasing returns a function that maps 0 to 0 and 1 to 1 for every easing", () => {
  for (const name of easingNames) {
    const fn = toEasing(name);
    assert.equal(typeof fn, "function");
    assert.equal(fn(0), 0, `${name}(0)`);
    assert.equal(fn(1), 1, `${name}(1)`);
    const mid = fn(0.5);
    assert.ok(mid > 0 && mid < 1, `${name}(0.5) stays inside (0, 1)`);
  }
});

test("toEasing accepts a tuple and agrees with the named token", () => {
  assert.equal(toEasing([0.4, 0, 0.2, 1])(0.3), toEasing("standard")(0.3));
});

test("theme.motion is defined for the light and dark themes", () => {
  assert.equal(defaultTheme.motion, motion);
  assert.equal(createTheme({ mode: "dark" }).motion.duration.base, 200);
  assert.equal(createTheme({ mode: "light" }).motion.easing.standard[3], 1);
});

test("the motion tokens do not import react-native-reanimated", () => {
  const source = readFileSync(new URL("../../src/tokens/motion.base.ts", import.meta.url), "utf8");
  assert.ok(!/reanimated/i.test(source));
});

test("toEasing is monotonic for the standard curves and matches known samples", () => {
  const standard = toEasing("standard");
  let previous = 0;
  for (let i = 1; i <= 20; i += 1) {
    const value = standard(i / 20);
    assert.ok(value >= previous, `standard is non-decreasing at ${i / 20}`);
    previous = value;
  }
  // Independent reference: dense parametric sampling of the Bezier for each curve.
  for (const name of easingNames) {
    const [x1, y1, x2, y2] = motion.easing[name];
    const point = (u: number, p1: number, p2: number): number => 3 * (1 - u) ** 2 * u * p1 + 3 * (1 - u) * u ** 2 * p2 + u ** 3;
    const fn = toEasing(name);
    for (const t of [0.1, 0.25, 0.5, 0.75, 0.9]) {
      let best = 0;
      let distance = Infinity;
      for (let i = 0; i <= 20000; i += 1) {
        const u = i / 20000;
        const d = Math.abs(point(u, x1, x2) - t);
        if (d < distance) {
          distance = d;
          best = u;
        }
      }
      assert.ok(Math.abs(fn(t) - point(best, y1, y2)) < 0.002, `${name}(${t})`);
    }
  }
  assert.equal(toEasing([0, 0, 1, 1])(0.5) > 0.499 && toEasing([0, 0, 1, 1])(0.5) < 0.501, true);
  assert.equal(standard(-1), 0);
  assert.equal(standard(2), 1);
});
