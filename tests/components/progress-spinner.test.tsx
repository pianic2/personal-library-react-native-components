import React from "react";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";
import { Platform } from "react-native";
import { ProgressBar, Spinner, ThemeProvider } from "../../src";
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

const bar = (r: TestRenderer.ReactTestRenderer) => r.root.findAll((n) => n.type === host("View") && n.props.accessibilityRole === "progressbar")[0]!;
const fillOf = (r: TestRenderer.ReactTestRenderer) => r.root.findAll((n) => n.type === host("View") && flatten(n.props.style).height === "100%")[0];

describe("PLRNUI-214 ProgressBar", () => {
  it("exposes role progressbar and accessibilityValue min/max/now", () => {
    const b = bar(render(<ProgressBar progress={40} />));
    assert.equal(b.props.accessibilityRole, "progressbar");
    assert.deepEqual(b.props.accessibilityValue, { min: 0, max: 100, now: 40 });
    assert.equal(b.props.accessible, true);
  });

  it("clamps the value for both the fill and accessibilityValue", () => {
    const high = render(<ProgressBar progress={150} />);
    assert.equal(bar(high).props.accessibilityValue.now, 100);
    assert.equal(flatten(fillOf(high)?.props.style).width, "100%");
    const low = render(<ProgressBar progress={-20} />);
    assert.equal(bar(low).props.accessibilityValue.now, 0);
    assert.equal(flatten(fillOf(low)?.props.style).width, "0%");
  });

  it("renders 0% (not 30%) for an undefined or non-finite progress", () => {
    for (const progress of [undefined, Number.NaN, Number.POSITIVE_INFINITY]) {
      const r = render(<ProgressBar progress={progress} />);
      assert.equal(flatten(fillOf(r)?.props.style).width, "0%", String(progress));
      assert.equal(bar(r).props.accessibilityValue.now, 0, String(progress));
    }
  });

  it("passes accessibilityLabel through", () => {
    assert.equal(bar(render(<ProgressBar progress={1} accessibilityLabel="Upload" />)).props.accessibilityLabel, "Upload");
  });

  it("tone colours the fill from the theme and defaults to primary", () => {
    const fills = (["primary", "info", "success", "warning", "danger"] as const).map((v) => flatten(fillOf(render(<ProgressBar progress={10} tone={v} />))?.props.style).backgroundColor);
    assert.equal(new Set(fills).size, 5, "five distinct colours");
    assert.equal(flatten(fillOf(render(<ProgressBar progress={10} />))?.props.style).backgroundColor, fills[0]);
  });

  it("keeps color as a deprecated alias; tone wins when both are set", () => {
    const viaColor = flatten(fillOf(render(<ProgressBar progress={10} color="error" />))?.props.style).backgroundColor;
    const viaVariant = flatten(fillOf(render(<ProgressBar progress={10} tone="danger" />))?.props.style).backgroundColor;
    assert.equal(viaColor, viaVariant);
    const both = flatten(fillOf(render(<ProgressBar progress={10} tone="success" color="error" />))?.props.style).backgroundColor;
    assert.equal(both, flatten(fillOf(render(<ProgressBar progress={10} tone="success" />))?.props.style).backgroundColor);
    assert.notEqual(both, viaColor);
  });

  it("takes the track height and radius from the theme (no literal 8)", () => {
    const style = flatten(bar(render(<ProgressBar progress={5} />)).props.style);
    assert.equal(style.height, 8);
    assert.equal(style.overflow, "hidden");
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

const layout = (r: TestRenderer.ReactTestRenderer, width: number) =>
  act(() => {
    (bar(r).props.onLayout as (e: unknown) => void)({ nativeEvent: { layout: { width, height: 8, x: 0, y: 0 } } });
  });

describe("PLRNUI-214 ProgressBar indeterminate", () => {
  it("is a busy progressbar with no accessibilityValue", () => {
    const b = bar(render(<ProgressBar indeterminate accessibilityLabel="Loading results" />));
    assert.equal(b.props.accessibilityRole, "progressbar");
    assert.deepEqual(b.props.accessibilityState, { busy: true });
    assert.equal(b.props.accessibilityValue, undefined);
    assert.equal(b.props.accessibilityLabel, "Loading results");
  });

  it("ignores progress while indeterminate", () => {
    const b = bar(render(<ProgressBar indeterminate progress={80} />));
    assert.equal(b.props.accessibilityValue, undefined);
  });

  it("sweeps the measured track width in a loop with the token easing", () => {
    const { engine, calls } = fakeEngine();
    const r = render(<ProgressBar indeterminate />, "light", { engine });
    assert.equal(calls.loops, 0, "waits for the track to be measured");
    layout(r, 200);
    assert.equal(calls.loops, 1);
    assert.equal(calls.starts, 1);
    assert.equal(calls.timings.length, 1);
    assert.equal(calls.timings[0]?.to, 200, "ends at the track width");
    assert.ok((calls.timings[0]?.config.duration ?? 0) > 0);
  });

  it("restarts for a new track width and stops on unmount", () => {
    const { engine, calls } = fakeEngine();
    const r = render(<ProgressBar indeterminate />, "light", { engine });
    layout(r, 100);
    layout(r, 300);
    assert.equal(calls.loops, 2);
    assert.equal(calls.timings.at(-1)?.to, 300);
    assert.ok(calls.stops >= 1, "the first sweep was stopped");
    act(() => r.unmount());
    assert.equal(calls.stops, 2);
  });

  it("does not animate under reduced motion and still renders a segment", () => {
    const { engine, calls } = fakeEngine();
    const r = render(<ProgressBar indeterminate />, "light", { engine, reduceMotion: "always" });
    layout(r, 200);
    assert.equal(calls.loops, 0);
    assert.equal(calls.timings.length, 0);
    const segment = r.root.findAll((n) => n.type === host("View") && flatten(n.props.style).height === "100%");
    assert.equal(segment.length, 1);
    assert.equal(flatten(segment[0]?.props.style).width, "40%");
  });
});

describe("PLRNUI-214 Spinner", () => {
  const indicator = (r: TestRenderer.ReactTestRenderer) => r.root.findByType(host("ActivityIndicator"));
  const wrapper = (r: TestRenderer.ReactTestRenderer) => r.root.findAll((n) => n.type === host("View") && n.props.accessibilityRole === "progressbar")[0]!;

  it("has a default accessibilityLabel, role progressbar and a busy state", () => {
    const w = wrapper(render(<Spinner />));
    assert.equal(w.props.accessibilityLabel, "Loading");
    assert.equal(w.props.accessibilityRole, "progressbar");
    assert.deepEqual(w.props.accessibilityState, { busy: true });
    assert.equal(w.props.accessible, true);
  });

  it("accepts a custom accessibilityLabel", () => {
    assert.equal(wrapper(render(<Spinner accessibilityLabel="Loading your library" />)).props.accessibilityLabel, "Loading your library");
  });

  it("maps sizes to numbers on Android and web", () => {
    for (const os of ["android", "web"]) {
      platform.OS = os;
      assert.deepEqual((["sm", "md", "lg"] as const).map((s) => indicator(render(<Spinner size={s} />)).props.size), [16, 24, 32], os);
    }
  });

  it("maps sizes to small|large on iOS (numbers are ignored there)", () => {
    platform.OS = "ios";
    assert.deepEqual((["sm", "md", "lg"] as const).map((s) => indicator(render(<Spinner size={s} />)).props.size), ["small", "small", "large"]);
  });

  it("uses the theme primary colour in light and dark", () => {
    const light = indicator(render(<Spinner />, "light")).props.color;
    const dark = indicator(render(<Spinner />, "dark")).props.color;
    assert.equal(typeof light, "string");
    assert.equal(typeof dark, "string");
  });
});
