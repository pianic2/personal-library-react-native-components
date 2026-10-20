import React from "react";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import TestRenderer, { act } from "react-test-renderer";
import { Platform } from "react-native";
import { ThemeProvider } from "../../src";
import { CircularProgress } from "../../src/components/CircularProgress/index.js";
import { MotionProvider } from "../../src/motion/MotionProvider.js";
import type { MotionEngine, MotionHandle, MotionValue, TimingConfig } from "../../src/motion/engine.js";
import { CapabilityProvider } from "../../src/native/core/index.js";
import { createMotionMocks } from "../helpers/motion.js";

const host = (name: string) => name as unknown as React.ElementType;
const platform = Platform as { OS: string };
const originalOS = platform.OS;
afterEach(() => {
  platform.OS = originalOS;
});

const flatten = (style: unknown): Record<string, any> => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));

function render(ui: React.ReactElement, mode: "light" | "dark" = "light", extra?: { engine?: MotionEngine; reduceMotion?: "system" | "always" | "never" }) {
  let renderer!: TestRenderer.ReactTestRenderer;
  const mocks = createMotionMocks(false);
  act(() => {
    renderer = TestRenderer.create(
      <CapabilityProvider adapters={mocks.adapters}>
        <MotionProvider engine={extra?.engine} reduceMotion={extra?.reduceMotion ?? "never"}>
          <ThemeProvider initialMode={mode} persistTheme={false}>
            {ui}
          </ThemeProvider>
        </MotionProvider>
      </CapabilityProvider>,
    );
  });
  return renderer;
}

const root = (r: TestRenderer.ReactTestRenderer) => r.root.findAll((n) => n.type === host("View") && n.props.accessibilityRole === "progressbar")[0]!;
const rotations = (r: TestRenderer.ReactTestRenderer) =>
  ["right", "left"].map((side) => {
    const half = r.root.findAll((n) => n.type === host("View") && n.props.testID === `cp-${side}`)[0]!;
    const arc = half.findAll((n) => n.type === host("View"))[1]!;
    return flatten(arc.props.style).transform[0].rotate as string;
  });

describe("PLRNUI-407 CircularProgress determinate", () => {
  it("exposes role progressbar and accessibilityValue min/max/now", () => {
    const b = root(render(<CircularProgress progress={40} accessibilityLabel="Goal" />));
    assert.equal(b.props.accessibilityRole, "progressbar");
    assert.deepEqual(b.props.accessibilityValue, { min: 0, max: 100, now: 40 });
    assert.equal(b.props.accessibilityLabel, "Goal");
    assert.equal(b.props.accessible, true);
  });

  it("clamps the value to 0-100 like ProgressBar", () => {
    for (const [input, now] of [[150, 100], [-20, 0], [Number.NaN, 0], [Number.POSITIVE_INFINITY, 0], [undefined, 0]] as const) {
      assert.equal(root(render(<CircularProgress progress={input} />)).props.accessibilityValue.now, now, String(input));
    }
  });

  it("rotates the two clipped halves from the value", () => {
    assert.deepEqual(rotations(render(<CircularProgress testID="cp" progress={0} />)), ["-135deg", "-315deg"]);
    assert.deepEqual(rotations(render(<CircularProgress testID="cp" progress={25} />)), ["-45deg", "-315deg"]);
    assert.deepEqual(rotations(render(<CircularProgress testID="cp" progress={50} />)), ["45deg", "-315deg"]);
    assert.deepEqual(rotations(render(<CircularProgress testID="cp" progress={75} />)), ["45deg", "-225deg"]);
    assert.deepEqual(rotations(render(<CircularProgress testID="cp" progress={100} />)), ["45deg", "-135deg"]);
  });

  it("clips each half to half the diameter", () => {
    const r = render(<CircularProgress testID="cp" progress={10} size="lg" />);
    const half = r.root.findAll((n) => n.type === host("View") && n.props.testID === "cp-right")[0]!;
    const s = flatten(half.props.style);
    assert.equal(s.overflow, "hidden");
    assert.equal(s.width, 32);
    assert.equal(s.height, 64);
  });

  it("takes size and thickness, and clamps thickness to the radius", () => {
    const ring = (r: TestRenderer.ReactTestRenderer) => flatten(r.root.findAll((n) => n.type === host("View"))[1]!.props.style);
    assert.equal(ring(render(<CircularProgress progress={5} size="sm" />)).width, 32);
    assert.equal(ring(render(<CircularProgress progress={5} thickness={6} />)).borderWidth, 6);
    assert.equal(ring(render(<CircularProgress progress={5} size="xs" thickness={99} />)).borderWidth, 10);
  });

  it("shows the label in the centre", () => {
    const r = render(<CircularProgress progress={5} label="5%" />);
    assert.ok(r.root.findAll((n) => n.type === host("Text") && n.props.children === "5%").length > 0);
  });

  it("colours the arc from the theme per tone, in light and dark, with no literal colours", () => {
    const arcColor = (tone: any, mode: "light" | "dark") => {
      const r = render(<CircularProgress progress={10} tone={tone} testID="cp" />, mode);
      const half = r.root.findAll((n) => n.type === host("View") && n.props.testID === "cp-right")[0]!;
      return flatten(half.findAll((n) => n.type === host("View"))[1]!.props.style).borderTopColor as string;
    };
    for (const mode of ["light", "dark"] as const) {
      const colors = (["primary", "info", "success", "warning", "danger"] as const).map((t) => arcColor(t, mode));
      assert.equal(new Set(colors).size, 5, mode);
      assert.equal(arcColor(undefined, mode), colors[0]);
    }
    assert.notEqual(arcColor("primary", "light"), arcColor("primary", "dark"));
  });
});

interface FakeValue extends MotionValue {
  current: number;
}

function fakeEngine() {
  const calls = { timings: [] as Array<{ to: number; config: TimingConfig }>, loops: 0, starts: 0, stops: 0 };
  const engine: MotionEngine = {
    createValue(initial) {
      const v: FakeValue = { current: initial, setValue(n) { v.current = n; } };
      return v;
    },
    timing(_value, to, config) {
      calls.timings.push({ to, config });
      return { start() {}, stop() {} };
    },
    spring: () => {
      throw new Error("no spring");
    },
    loop(handle: MotionHandle) {
      calls.loops += 1;
      return {
        start(cb) {
          calls.starts += 1;
          handle.start(cb);
        },
        stop() {
          calls.stops += 1;
          handle.stop();
        },
      };
    },
    stop() {},
  };
  return { engine, calls };
}

describe("PLRNUI-407 CircularProgress indeterminate", () => {
  it("is a busy progressbar with no accessibilityValue and ignores progress", () => {
    const b = root(render(<CircularProgress indeterminate progress={80} accessibilityLabel="Loading" />));
    assert.equal(b.props.accessibilityRole, "progressbar");
    assert.deepEqual(b.props.accessibilityState, { busy: true });
    assert.equal(b.props.accessibilityValue, undefined);
  });

  it("loops a timing animation with useNativeDriver true (spy assertion)", () => {
    platform.OS = "ios";
    const { engine, calls } = fakeEngine();
    const r = render(<CircularProgress indeterminate />, "light", { engine });
    assert.equal(calls.loops, 1);
    assert.equal(calls.starts, 1);
    assert.equal(calls.timings.length, 1);
    assert.equal(calls.timings[0]?.to, 360);
    assert.equal(calls.timings[0]?.config.useNativeDriver, true);
    act(() => r.unmount());
    assert.equal(calls.stops, 1);
  });

  it("does not animate under reduced motion and still renders a segment", () => {
    const { engine, calls } = fakeEngine();
    const r = render(<CircularProgress indeterminate />, "light", { engine, reduceMotion: "always" });
    assert.equal(calls.loops, 0);
    assert.equal(calls.timings.length, 0);
    assert.equal(root(r).findAll((n) => n.type === host("View")).length >= 3, true);
  });
});

describe("PLRNUI-407 CircularProgress source", () => {
  it("imports no svg or expo module and has no hard-coded colours", () => {
    const dir = join(process.cwd(), "src/components/CircularProgress");
    for (const file of readdirSync(dir)) {
      const text = readFileSync(join(dir, file), "utf8");
      assert.doesNotMatch(text, /react-native-svg|from ["']expo-/, file);
      assert.doesNotMatch(text, /#[0-9a-fA-F]{3,8}\b|rgba?\(/, file);
    }
  });
});
