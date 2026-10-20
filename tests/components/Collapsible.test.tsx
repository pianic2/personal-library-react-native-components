import React from "react";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import TestRenderer, { act } from "react-test-renderer";
import { Text, ThemeProvider } from "../../src";
import { Collapsible } from "../../src/components/Collapsible/index.js";
import type { CollapsibleProps } from "../../src/components/Collapsible/index.js";
import { MotionProvider } from "../../src/motion/MotionProvider.js";
import type { MotionEngine, MotionEnd, MotionHandle, MotionValue } from "../../src/motion/engine.js";

const host = (name: string) => name as unknown as React.ElementType;
type Mode = "light" | "dark";
const OwnView = host("View");

const originalError = console.error;
const originalWarn = console.warn;
afterEach(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

/** An engine whose animations only end when the test says so. */
function manualEngine() {
  const timings: Array<{ to: number; duration: number; finish: () => void }> = [];
  const engine: MotionEngine = {
    createValue(initial) {
      let current = initial;
      return { setValue: (v: number) => void (current = v), get current() { return current; } } as MotionValue;
    },
    timing(value, to, config): MotionHandle {
      let cb: ((r: MotionEnd) => void) | undefined;
      const entry = {
        to,
        duration: config.duration,
        finish: () => {
          value.setValue(to);
          cb?.({ finished: true });
        },
      };
      timings.push(entry);
      return { start: (onEnd) => void (cb = onEnd), stop: () => void (cb = undefined) };
    },
    spring: () => ({ start: () => undefined, stop: () => undefined }),
    loop: (handle) => handle,
    stop: () => undefined,
  };
  return { engine, timings };
}

function render(ui: React.ReactElement, options: { mode?: Mode; engine?: MotionEngine; reduceMotion?: "always" | "never" | "system" } = {}) {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <ThemeProvider initialMode={options.mode ?? "light"} persistTheme={false}>
        <MotionProvider engine={options.engine} reduceMotion={options.reduceMotion ?? "never"}>
          {ui}
        </MotionProvider>
      </ThemeProvider>,
    );
  });
  return renderer;
}

function Example(props: CollapsibleProps) {
  return (
    <Collapsible {...props}>
      <Collapsible.Trigger testID="trigger">
        <Text>Toggle</Text>
      </Collapsible.Trigger>
      <Collapsible.Content testID="content">
        <Text>Body</Text>
      </Collapsible.Content>
    </Collapsible>
  );
}

const trigger = (r: TestRenderer.ReactTestRenderer) => r.root.findAll((n) => n.props.testID === "trigger" && typeof n.type === "string")[0]!;
const content = (r: TestRenderer.ReactTestRenderer) => r.root.findAll((n) => n.props.testID === "content" && typeof n.type === "string");
const region = (r: TestRenderer.ReactTestRenderer) => r.root.findAll((n) => n.type === host("View") && typeof n.props.nativeID === "string" && "importantForAccessibility" in n.props)[0];
const press = (r: TestRenderer.ReactTestRenderer) => act(() => void trigger(r).props.onPress({}));
const layout = (r: TestRenderer.ReactTestRenderer, height: number) =>
  act(() => void content(r)[0]!.props.onLayout({ nativeEvent: { layout: { x: 0, y: 0, width: 100, height } } }));
const flatten = (style: unknown): Record<string, any> => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));

describe("PLRNUI-340 Collapsible state", () => {
  it("is closed by default and unmounts the content", () => {
    const r = render(<Example />);
    assert.equal(content(r).length, 0);
    assert.equal(trigger(r).props.accessibilityState.expanded, false);
    assert.equal(trigger(r).props["aria-expanded"], false);
  });

  it("starts open with defaultOpen and reports expanded", () => {
    const r = render(<Example defaultOpen />);
    assert.equal(content(r).length, 1);
    assert.equal(trigger(r).props.accessibilityState.expanded, true);
    assert.equal(trigger(r).props.accessibilityRole, "button");
  });

  it("toggles when uncontrolled and calls onOpenChange with the next state", () => {
    const calls: boolean[] = [];
    const r = render(<Example animated={false} onOpenChange={(o) => calls.push(o)} />);
    press(r);
    assert.deepEqual(calls, [true]);
    assert.equal(content(r).length, 1);
    assert.equal(trigger(r).props.accessibilityState.expanded, true);
    press(r);
    assert.deepEqual(calls, [true, false]);
    assert.equal(content(r).length, 0);
  });

  it("follows the open prop when controlled and only reports the request", () => {
    const calls: boolean[] = [];
    const r = render(<Example open={false} animated={false} onOpenChange={(o) => calls.push(o)} />);
    press(r);
    assert.deepEqual(calls, [true]);
    assert.equal(content(r).length, 0, "a controlled Collapsible does not open by itself");
    act(() => {
      r.update(
        <ThemeProvider initialMode="light" persistTheme={false}>
          <MotionProvider reduceMotion="never">
            <Example open animated={false} onOpenChange={(o) => calls.push(o)} />
          </MotionProvider>
        </ThemeProvider>,
      );
    });
    assert.equal(content(r).length, 1);
    assert.equal(trigger(r).props.accessibilityState.expanded, true);
  });

  it("keeps the content mounted but hidden from screen readers when closed with keepMounted", () => {
    const r = render(<Example keepMounted />);
    assert.equal(content(r).length, 1);
    const hidden = region(r)!;
    assert.equal(hidden.props.importantForAccessibility, "no-hide-descendants");
    assert.equal(hidden.props.accessibilityElementsHidden, true);
    assert.equal(hidden.props["aria-hidden"], true);
    assert.equal(hidden.props.pointerEvents, "none");
    assert.equal(flatten(hidden.props.style).height, 0);
    assert.equal(flatten(hidden.props.style).overflow, "hidden");
  });

  it("exposes the open content to screen readers", () => {
    const r = render(<Example defaultOpen />);
    const shown = region(r)!;
    assert.equal(shown.props.importantForAccessibility, "auto");
    assert.equal(shown.props.accessibilityElementsHidden, false);
    assert.equal(shown.props.nativeID, trigger(r).props["aria-controls"]);
  });

  it("supports asChild by merging the trigger props into the child", () => {
    const calls: boolean[] = [];
    const r = render(
      <Collapsible animated={false} onOpenChange={(o) => calls.push(o)}>
        <Collapsible.Trigger asChild>
          <OwnView testID="own" />
        </Collapsible.Trigger>
      </Collapsible>,
    );
    const own = r.root.findAll((n) => n.props.testID === "own" && typeof n.type === "string")[0]!;
    assert.equal(own.props.accessibilityRole, "button");
    assert.equal(own.props.accessibilityState.expanded, false);
    act(() => void own.props.onPress({}));
    assert.deepEqual(calls, [true]);
  });

  it("throws when a part is used outside a Collapsible", () => {
    console.error = () => undefined;
    assert.throws(() => render(<Collapsible.Content />), /Collapsible\.Content must be rendered inside <Collapsible>/);
    assert.throws(() => render(<Collapsible.Trigger />), /Collapsible\.Trigger must be rendered inside <Collapsible>/);
  });
});

describe("PLRNUI-340 Collapsible animation", () => {
  it("animates the height to the measured height and rests at auto height when open", () => {
    const { engine, timings } = manualEngine();
    const r = render(<Example duration={150} />, { engine });
    press(r);
    assert.equal(timings.length, 0, "waits for the measurement");
    layout(r, 80);
    assert.equal(timings.length, 1);
    assert.equal(timings[0]!.to, 80);
    assert.equal(timings[0]!.duration, 150);
    assert.equal(flatten(region(r)!.props.style).overflow, "hidden");
    act(() => timings[0]!.finish());
    assert.equal(flatten(region(r)!.props.style).height, undefined, "auto height at rest");
    assert.equal(content(r).length, 1);
  });

  it("uses 200 ms by default", () => {
    const { engine, timings } = manualEngine();
    const r = render(<Example />, { engine });
    press(r);
    layout(r, 40);
    assert.equal(timings[0]!.duration, 200);
  });

  it("animates the height down to 0 and unmounts the content when it ends", () => {
    const { engine, timings } = manualEngine();
    const r = render(<Example defaultOpen />, { engine });
    layout(r, 60);
    press(r);
    assert.equal(timings.length, 1);
    assert.equal(timings[0]!.to, 0);
    assert.equal(content(r).length, 1, "still mounted while animating");
    assert.equal(region(r)!.props.importantForAccessibility, "no-hide-descendants", "hidden as soon as it closes");
    act(() => timings[0]!.finish());
    assert.equal(content(r).length, 0);
  });

  it("keeps the content mounted after closing with keepMounted", () => {
    const { engine, timings } = manualEngine();
    const r = render(<Example defaultOpen keepMounted />, { engine });
    layout(r, 60);
    press(r);
    act(() => timings[0]!.finish());
    assert.equal(content(r).length, 1);
    assert.equal(flatten(region(r)!.props.style).height, 0);
  });

  it("reverses an animation that is interrupted", () => {
    const { engine, timings } = manualEngine();
    const r = render(<Example />, { engine });
    press(r);
    layout(r, 50);
    press(r);
    assert.equal(timings.length, 2);
    assert.equal(timings[1]!.to, 0);
    act(() => timings[0]!.finish());
    assert.equal(content(r).length, 1, "the stopped opening no longer ends the state");
    act(() => timings[1]!.finish());
    assert.equal(content(r).length, 0);
  });

  it("changes instantly with reduced motion, without starting an animation", () => {
    const { engine, timings } = manualEngine();
    const r = render(<Example />, { engine, reduceMotion: "always" });
    press(r);
    assert.equal(content(r).length, 1);
    assert.equal(flatten(region(r)!.props.style).height, undefined);
    press(r);
    assert.equal(content(r).length, 0);
    assert.equal(timings.length, 0);
  });

  it("changes instantly with animated={false}", () => {
    const { engine, timings } = manualEngine();
    const r = render(<Example animated={false} />, { engine });
    press(r);
    assert.equal(content(r).length, 1);
    press(r);
    assert.equal(content(r).length, 0);
    assert.equal(timings.length, 0);
  });
});

describe("PLRNUI-340 Collapsible theming", () => {
  it("renders in light and dark with no console.error or console.warn", () => {
    const calls: unknown[][] = [];
    // react-test-renderer logs its own deprecation notice once per process; that notice is not a component error.
    console.error = (...args: unknown[]) => {
      if (!String(args[0]).includes("react-test-renderer is deprecated")) calls.push(args);
    };
    console.warn = (...args: unknown[]) => void calls.push(args);
    for (const mode of ["light", "dark"] as const) {
      const closed = render(<Example keepMounted />, { mode });
      assert.equal(content(closed).length, 1);
      const open = render(<Example defaultOpen />, { mode });
      assert.equal(content(open).length, 1);
    }
    assert.deepEqual(calls, []);
  });

  it("has no hardcoded colours in its source", () => {
    const dir = join(import.meta.dirname, "../../src/components/Collapsible");
    for (const file of readdirSync(dir)) {
      assert.doesNotMatch(readFileSync(join(dir, file), "utf8"), /#[0-9a-fA-F]{3,8}\b/, file);
    }
  });
});
