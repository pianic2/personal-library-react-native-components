import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import TestRenderer, { act } from "react-test-renderer";
import { Checkbox, RadioGroup, Switch, ThemeProvider } from "../../src";
import { MotionProvider } from "../../src/motion/MotionProvider.js";
import type { MotionEngine, MotionValue, TimingConfig } from "../../src/motion/engine.js";
import { CapabilityProvider } from "../../src/native/core/index.js";
import { createMotionMocks } from "../helpers/motion.js";

const host = (name: string) => name as unknown as React.ElementType;
const root = resolve(import.meta.dirname, "../..");
const flatten = (style: unknown): Record<string, any> => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));

function render(ui: React.ReactElement, extra?: { engine?: MotionEngine; reduceMotion?: "system" | "always" | "never" }) {
  let renderer!: TestRenderer.ReactTestRenderer;
  const mocks = createMotionMocks(false);
  act(() => {
    renderer = TestRenderer.create(
      <CapabilityProvider adapters={mocks.adapters}>
        <MotionProvider engine={extra?.engine} reduceMotion={extra?.reduceMotion ?? "never"}>
          <ThemeProvider persistTheme={false}>{ui}</ThemeProvider>
        </MotionProvider>
      </CapabilityProvider>,
    );
  });
  return renderer;
}
const pressables = (r: TestRenderer.ReactTestRenderer) => r.root.findAllByType(host("Pressable"));
const noop = () => undefined;

describe("PLRNUI-192 Checkbox", () => {
  const box = (r: TestRenderer.ReactTestRenderer) => r.root.findAllByType(host("Pressable"))[0]!;
  const boxStyle = (r: TestRenderer.ReactTestRenderer) => flatten(box(r).findAllByType(host("View"))[0]?.props.style);

  it("keeps the checked and unchecked semantics", () => {
    assert.deepEqual(box(render(<Checkbox label="A" checked onChange={noop} />)).props.accessibilityState, { checked: true, disabled: false });
    assert.deepEqual(box(render(<Checkbox label="A" checked={false} onChange={noop} />)).props.accessibilityState, { checked: false, disabled: false });
  });

  it("indeterminate reports checked: mixed and shows a dash instead of the check", () => {
    const r = render(<Checkbox label="All" checked={false} indeterminate onChange={noop} />);
    assert.deepEqual(box(r).props.accessibilityState, { checked: "mixed", disabled: false });
    const glyphs = r.root.findAllByType(host("Text")).map((t) => t.props.children);
    assert.ok(glyphs.includes("–"));
    assert.ok(!glyphs.includes("✓"));
  });

  it("indeterminate wins over checked, and pressing still toggles from the checked value", () => {
    const calls: boolean[] = [];
    const r = render(<Checkbox label="All" checked indeterminate onChange={(v) => calls.push(v)} />);
    assert.equal(box(r).props.accessibilityState.checked, "mixed");
    act(() => (box(r).props.onPress as () => void)());
    assert.deepEqual(calls, [false]);
  });

  it("disabled sets the state, dims the control and blocks presses", () => {
    const r = render(<Checkbox label="A" checked={false} disabled onChange={noop} />);
    assert.equal(box(r).props.accessibilityState.disabled, true);
    assert.equal(box(r).props.disabled, true);
    assert.equal(flatten(box(r).props.style).opacity, 0.5);
  });

  it("invalid recolours the border and the filled box with the theme error colour", () => {
    const normal = boxStyle(render(<Checkbox label="A" checked onChange={noop} />));
    const invalid = boxStyle(render(<Checkbox label="A" checked invalid onChange={noop} />));
    assert.notEqual(invalid.borderColor, normal.borderColor);
    assert.notEqual(invalid.backgroundColor, normal.backgroundColor);
    const invalidUnchecked = boxStyle(render(<Checkbox label="A" checked={false} invalid onChange={noop} />));
    assert.equal(invalidUnchecked.borderColor, invalid.borderColor);
    assert.equal(invalidUnchecked.backgroundColor, "transparent");
  });

  it("keeps a 44 point touch target", () => {
    const style = flatten(box(render(<Checkbox label="A" checked onChange={noop} />)).props.style);
    assert.equal(style.minWidth, 44);
    assert.equal(style.minHeight, 44);
  });

  it("a custom checkIcon replaces the check glyph", () => {
    const r = render(<Checkbox label="A" checked checkIcon={React.createElement("Text", { testID: "icon" }, "X")} onChange={noop} />);
    assert.ok(r.root.findAll((n) => n.props.testID === "icon").length > 0);
  });
});

describe("PLRNUI-192 RadioGroup", () => {
  const options = [
    { label: "A", value: "a" },
    { label: "B", value: "b", disabled: true },
    { label: "C", value: "c" },
  ];

  it("keeps the selected-option state exactly { selected, checked } for enabled options", () => {
    const r = render(<RadioGroup value="a" onChange={noop} options={options} />);
    assert.deepEqual(pressables(r)[0]!.props.accessibilityState, { selected: true, checked: true });
    assert.deepEqual(pressables(r)[2]!.props.accessibilityState, { selected: false, checked: false });
  });

  it("an option with disabled sets accessibilityState.disabled, dims and blocks only that option", () => {
    const calls: string[] = [];
    const r = render(<RadioGroup value="a" onChange={(v) => calls.push(v)} options={options} />);
    const [a, b, c] = pressables(r);
    assert.equal(b!.props.accessibilityState.disabled, true);
    assert.equal(b!.props.disabled, true);
    assert.equal(flatten(b!.props.style).opacity, 0.5);
    assert.equal(a!.props.accessibilityState.disabled, undefined);
    assert.equal(c!.props.disabled, false);
    act(() => (c!.props.onPress as () => void)());
    assert.deepEqual(calls, ["c"]);
  });

  it("a disabled group disables every option", () => {
    const r = render(<RadioGroup value="a" disabled onChange={noop} options={options} />);
    for (const p of pressables(r)) {
      assert.equal(p.props.accessibilityState.disabled, true);
      assert.equal(p.props.disabled, true);
    }
  });

  it("a disabled selected option stays selected", () => {
    const r = render(<RadioGroup value="b" onChange={noop} options={options} />);
    assert.deepEqual(pressables(r)[1]!.props.accessibilityState, { selected: true, checked: true, disabled: true });
  });

  it("names the group with accessibilityLabel", () => {
    const r = render(<RadioGroup accessibilityLabel="Plan" onChange={noop} options={options} />);
    const group = r.root.findAll((n) => n.type === host("View") && n.props.accessibilityRole === "radiogroup")[0]!;
    assert.equal(group.props.accessibilityLabel, "Plan");
  });

  it("keeps a 44 point touch target on every option", () => {
    for (const p of pressables(render(<RadioGroup onChange={noop} options={options} />))) {
      assert.equal(flatten(p.props.style).minHeight, 44);
    }
  });
});

interface FakeValue extends MotionValue {
  current: number;
}

function fakeEngine() {
  const timings: Array<{ to: number; config: TimingConfig }> = [];
  const stops = { count: 0 };
  const engine: MotionEngine = {
    createValue(initial) {
      const v: FakeValue = { current: initial, setValue(n) { v.current = n; } };
      return v;
    },
    timing(value, to, config) {
      timings.push({ to, config });
      return { start() { value.setValue(to); }, stop() { stops.count += 1; } };
    },
    spring: () => {
      throw new Error("no spring");
    },
    loop: (h) => h,
    stop() {},
  };
  return { engine, timings, stops };
}

describe("PLRNUI-192 Switch", () => {
  const sw = (r: TestRenderer.ReactTestRenderer) => pressables(r)[0]!;
  const withMotion = (value: boolean, extra: Parameters<typeof render>[1]) => {
    const ui = (v: boolean) => (
      <CapabilityProvider adapters={mocks.adapters}>
        <MotionProvider engine={extra?.engine} reduceMotion={extra?.reduceMotion ?? "never"}>
          <ThemeProvider persistTheme={false}>
            <Switch label="S" value={v} onChange={noop} />
          </ThemeProvider>
        </MotionProvider>
      </CapabilityProvider>
    );
    const mocks = createMotionMocks(false);
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(ui(value));
    });
    return { renderer, set: (v: boolean) => act(() => renderer.update(ui(v))) };
  };

  it("keeps the switch semantics and the 44 point touch target", () => {
    const r = render(<Switch label="S" value onChange={noop} />);
    assert.equal(sw(r).props.accessibilityRole, "switch");
    assert.deepEqual(sw(r).props.accessibilityState, { checked: true, disabled: false });
    assert.equal(flatten(sw(r).props.style).minWidth, 44);
    assert.equal(flatten(sw(r).props.style).minHeight, 44);
  });

  it("disabled dims the control and blocks presses", () => {
    const calls: boolean[] = [];
    const r = render(<Switch label="S" value={false} disabled onChange={(v) => calls.push(v)} />);
    assert.equal(sw(r).props.disabled, true);
    assert.equal(flatten(sw(r).props.style).opacity, 0.5);
  });

  it("pressing calls onChange with the opposite value", () => {
    const calls: boolean[] = [];
    const r = render(<Switch label="S" value={false} onChange={(v) => calls.push(v)} />);
    act(() => (sw(r).props.onPress as () => void)());
    assert.deepEqual(calls, [true]);
  });

  it("does not animate on the first render", () => {
    const { engine, timings } = fakeEngine();
    withMotion(true, { engine });
    assert.equal(timings.length, 0);
  });

  it("slides the thumb to the travel distance when turned on and back to 0 when turned off", () => {
    const { engine, timings } = fakeEngine();
    const m = withMotion(false, { engine });
    m.set(true);
    assert.equal(timings.length, 1);
    assert.equal(timings[0]?.to, 20);
    assert.equal(timings[0]?.config.duration, 120);
    m.set(false);
    assert.equal(timings[1]?.to, 0);
    m.set(false);
    assert.equal(timings.length, 2, "an unchanged value does not animate");
  });

  it("jumps without an animation under reduced motion", () => {
    const { engine, timings } = fakeEngine();
    const m = withMotion(false, { engine, reduceMotion: "always" });
    m.set(true);
    assert.equal(timings.length, 0);
  });

  it("stops a running slide when unmounted", () => {
    const { engine, stops } = fakeEngine();
    const m = withMotion(false, { engine });
    m.set(true);
    act(() => m.renderer.unmount());
    assert.equal(stops.count, 1);
  });

  it("the thumb snaps to the right position without Animated", () => {
    const off = render(<Switch label="S" value={false} onChange={noop} />);
    const on = render(<Switch label="S" value onChange={noop} />);
    const thumb = (r: TestRenderer.ReactTestRenderer) => flatten(r.root.findAllByType(host("View")).find((n) => flatten(n.props.style).borderRadius === 20 && flatten(n.props.style).width === 20)?.props.style);
    assert.deepEqual(thumb(off).transform, [{ translateX: 0 }]);
    assert.deepEqual(thumb(on).transform, [{ translateX: 20 }]);
  });
});

describe("PLRNUI-192 no inline literals", () => {
  for (const file of ["src/components/Checkbox/Checkbox.tsx", "src/components/Switch/Switch.tsx", "src/components/RadioGroup/RadioGroup.tsx"]) {
    it(`${file} uses named constants for sizes and opacity`, () => {
      const source = readFileSync(resolve(root, file), "utf8");
      const body = source.split("\n").filter((l) => !/^(const|\s*\/\/|\s*\/\*|\s*\*)/.test(l)).join("\n");
      assert.doesNotMatch(body, /(opacity|width|height|minWidth|minHeight|borderRadius)\s*:\s*\d{2}\b/);
      assert.doesNotMatch(body, /\bopacity\s*:\s*0\.\d/);
    });
  }
});
