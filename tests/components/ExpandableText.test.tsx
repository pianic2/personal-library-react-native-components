import React from "react";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import TestRenderer, { act } from "react-test-renderer";
import { ThemeProvider } from "../../src";
import { ExpandableText } from "../../src/components/ExpandableText/index.js";

type Mode = "light" | "dark";
const originalError = console.error;
const originalWarn = console.warn;
afterEach(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

function wrap(ui: React.ReactElement, mode: Mode) {
  return (
    <ThemeProvider initialMode={mode} persistTheme={false}>
      {ui}
    </ThemeProvider>
  );
}
function render(ui: React.ReactElement, mode: Mode = "light"): TestRenderer.ReactTestRenderer {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(wrap(ui, mode));
  });
  return renderer;
}

const LONG = "A long review text that spans many lines.";
const measure = (r: TestRenderer.ReactTestRenderer) => r.root.findAll((n) => n.props.testID === "t-measure" && typeof n.type !== "string")[0]!;
const layout = (r: TestRenderer.ReactTestRenderer, lines: number) =>
  act(() => void measure(r).props.onTextLayout({ nativeEvent: { lines: Array.from({ length: lines }, () => ({})) } }));
const toggles = (r: TestRenderer.ReactTestRenderer) => r.root.findAll((n) => typeof n.type === "string" && n.props.accessibilityRole === "button");
const visibleLimit = (r: TestRenderer.ReactTestRenderer) =>
  r.root.findAll((n) => typeof n.type === "string" && n.props.children === LONG && n.props.onTextLayout === undefined)[0]!.props.numberOfLines;

describe("PLRNUI-334 ExpandableText", () => {
  it("shows the toggle only when the measured text has more lines than numberOfLines", () => {
    const r = render(<ExpandableText testID="t" numberOfLines={3}>{LONG}</ExpandableText>);
    assert.equal(toggles(r).length, 0);
    layout(r, 3);
    assert.equal(toggles(r).length, 0);
    layout(r, 5);
    assert.equal(toggles(r).length, 1);
    layout(r, 2);
    assert.equal(toggles(r).length, 0);
  });

  it("clamps while collapsed, expands uncontrolled and reports the next value", () => {
    const seen: boolean[] = [];
    const r = render(<ExpandableText testID="t" onExpandedChange={(v) => seen.push(v)}>{LONG}</ExpandableText>);
    layout(r, 6);
    assert.equal(visibleLimit(r), 3);
    const toggle = toggles(r)[0]!;
    assert.equal(toggle.props.accessibilityLabel, "Read more");
    assert.deepEqual(toggle.props.accessibilityState, { expanded: false });
    act(() => void toggle.props.onPress({}));
    assert.deepEqual(seen, [true]);
    assert.equal(visibleLimit(r), undefined);
    assert.equal(toggles(r)[0]!.props.accessibilityLabel, "Show less");
    assert.deepEqual(toggles(r)[0]!.props.accessibilityState, { expanded: true });
    act(() => void toggles(r)[0]!.props.onPress({}));
    assert.deepEqual(seen, [true, false]);
    assert.equal(visibleLimit(r), 3);
  });

  it("honours defaultExpanded and custom labels", () => {
    const r = render(<ExpandableText testID="t" defaultExpanded moreLabel="More" lessLabel="Less">{LONG}</ExpandableText>);
    assert.equal(toggles(r)[0]!.props.accessibilityLabel, "Less");
    act(() => void toggles(r)[0]!.props.onPress({}));
    assert.equal(toggles(r).length, 0);
    layout(r, 9);
    assert.equal(toggles(r)[0]!.props.accessibilityLabel, "More");
  });

  it("is controlled by expanded and only calls onExpandedChange", () => {
    const seen: boolean[] = [];
    const ui = (expanded: boolean) => (
      <ExpandableText testID="t" expanded={expanded} onExpandedChange={(v) => seen.push(v)}>{LONG}</ExpandableText>
    );
    const r = render(ui(false));
    layout(r, 4);
    act(() => void toggles(r)[0]!.props.onPress({}));
    assert.deepEqual(seen, [true]);
    assert.equal(visibleLimit(r), 3);
    act(() => r.update(wrap(ui(true), "light")));
    assert.equal(visibleLimit(r), undefined);
    assert.equal(toggles(r)[0]!.props.accessibilityLabel, "Show less");
  });

  it("hides the measuring copy from assistive technology", () => {
    const r = render(<ExpandableText testID="t">{LONG}</ExpandableText>);
    const m = measure(r);
    assert.equal(m.props.accessibilityElementsHidden, true);
    assert.equal(m.props.importantForAccessibility, "no-hide-descendants");
  });

  it("renders in light and dark with no console.error or console.warn", () => {
    const calls: unknown[][] = [];
    // react-test-renderer logs its own deprecation notice; that notice is not a component error.
    console.error = (...a: unknown[]) => {
      if (!String(a[0]).includes("react-test-renderer is deprecated")) calls.push(a);
    };
    console.warn = (...a: unknown[]) => void calls.push(a);
    for (const mode of ["light", "dark"] as const) {
      for (const size of ["sm", "md", "lg"] as const) {
        const r = render(<ExpandableText testID="t" size={size}>{LONG}</ExpandableText>, mode);
        layout(r, 5);
        act(() => void toggles(r)[0]!.props.onPress({}));
      }
    }
    assert.deepEqual(calls, []);
  });

  it("uses no hardcoded colours", () => {
    const dir = join(process.cwd(), "src/components/ExpandableText");
    for (const file of readdirSync(dir)) {
      assert.doesNotMatch(readFileSync(join(dir, file), "utf8"), /#[0-9a-fA-F]{3,8}\b/, file);
    }
  });
});
