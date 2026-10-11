import React from "react";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";
import { ThemeProvider, useTheme } from "../../src";
import { Label, type LabelProps } from "../../src/components/Label/index.js";

const host = (name: string) => name as unknown as React.ElementType;
type Mode = "light" | "dark";

const originalError = console.error;
const originalWarn = console.warn;
afterEach(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

function render(ui: React.ReactElement, mode: Mode = "light"): TestRenderer.ReactTestRenderer {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <ThemeProvider initialMode={mode} persistTheme={false}>
        {ui}
      </ThemeProvider>,
    );
  });
  return renderer;
}

function themeOf(mode: Mode = "light"): ReturnType<typeof useTheme> {
  let captured: ReturnType<typeof useTheme> | undefined;
  function Probe() {
    captured = useTheme();
    return null;
  }
  render(<Probe />, mode);
  return captured as ReturnType<typeof useTheme>;
}

function flatten(style: unknown): Record<string, any> {
  return Object.assign({}, ...[style].flat(Infinity).filter(Boolean));
}

/** The outer label Text (the first Text host in the tree). */
const labelOf = (r: TestRenderer.ReactTestRenderer) => r.root.findAllByType(host("Text"))[0]!;
const textsOf = (r: TestRenderer.ReactTestRenderer) => r.root.findAllByType(host("Text"));

describe("PLRNUI-210 Label", () => {
  it("renders the text in the primary colour at the medium size by default, without marker or press handler", () => {
    const { theme, colors } = themeOf();
    const r = render(<Label>Name</Label>);
    const node = labelOf(r);
    const style = flatten(node.props.style);
    assert.equal(style.color, colors.textPrimary);
    assert.equal(style.fontSize, theme.typography.fontSize.md);
    assert.equal(style.textAlign, "left");
    assert.equal(textsOf(r).length, 1);
    assert.equal(node.props.accessibilityLabel, undefined);
    assert.equal(node.props.onPress, undefined);
  });

  it("size sm uses the small font size", () => {
    const { theme } = themeOf();
    assert.equal(flatten(labelOf(render(<Label size="sm">Name</Label>)).props.style).fontSize, theme.typography.fontSize.sm);
  });

  it("required shows a * in the error colour and adds ', required' to the accessibility label", () => {
    for (const mode of ["light", "dark"] as const) {
      const { colors } = themeOf(mode);
      const r = render(<Label required>Name</Label>, mode);
      const [outer, marker] = textsOf(r);
      assert.equal(outer!.props.accessibilityLabel, "Name, required", mode);
      assert.equal(marker!.props.children, " *", mode);
      assert.equal(flatten(marker!.props.style).color, colors.error, mode);
      assert.equal(marker!.props.accessibilityElementsHidden, true, mode);
      assert.equal(marker!.props.importantForAccessibility, "no-hide-descendants", mode);
    }
  });

  it("an explicit accessibilityLabel is the base of the required suffix", () => {
    const r = render(<Label required accessibilityLabel="Full name">Name</Label>);
    assert.equal(labelOf(r).props.accessibilityLabel, "Full name, required");
    assert.equal(labelOf(render(<Label accessibilityLabel="Full name">Name</Label>)).props.accessibilityLabel, "Full name");
  });

  it("optional appends a muted (optional); required wins when both are set", () => {
    const { colors } = themeOf();
    const optional = render(<Label optional>Nickname</Label>);
    const [, hint] = textsOf(optional);
    assert.equal(hint!.props.children, " (optional)");
    assert.equal(flatten(hint!.props.style).color, colors.textMuted);
    assert.equal(labelOf(optional).props.accessibilityLabel, undefined);
    const both = render(<Label required optional>Nickname</Label>);
    assert.equal(textsOf(both)[1]!.props.children, " *");
    assert.equal(textsOf(both).length, 2);
  });

  it("disabled mutes the text, sets accessibilityState.disabled and ignores presses", () => {
    const { colors } = themeOf();
    let pressed = 0;
    const focused: string[] = [];
    const target = { current: { focus: () => void focused.push("focus") } };
    const r = render(<Label disabled onPress={() => void (pressed += 1)} htmlFor={target} accessibilityState={{ selected: true }}>Name</Label>);
    const node = labelOf(r);
    assert.equal(flatten(node.props.style).color, colors.textMuted);
    assert.deepEqual(node.props.accessibilityState, { selected: true, disabled: true });
    assert.equal(node.props.onPress, undefined);
    assert.equal(pressed, 0);
    assert.deepEqual(focused, []);
  });

  it("pressing focuses the referenced control and then calls onPress", () => {
    const order: string[] = [];
    const target = { current: { focus: () => void order.push("focus") } };
    const r = render(<Label htmlFor={target} onPress={() => void order.push("press")}>Name</Label>);
    act(() => labelOf(r).props.onPress());
    assert.deepEqual(order, ["focus", "press"]);
  });

  it("pressing with only htmlFor focuses the control; an empty ref or onPress alone does not throw", () => {
    const focused: string[] = [];
    const target = { current: { focus: () => void focused.push("focus") } };
    const withRef = render(<Label htmlFor={target}>Name</Label>);
    act(() => labelOf(withRef).props.onPress());
    assert.deepEqual(focused, ["focus"]);
    const emptyRef = render(<Label htmlFor={{ current: null }}>Name</Label>);
    act(() => labelOf(emptyRef).props.onPress());
    let pressed = 0;
    const onlyPress = render(<Label onPress={() => void (pressed += 1)}>Name</Label>);
    act(() => labelOf(onlyPress).props.onPress());
    assert.equal(pressed, 1);
  });

  it("passes nativeID and text props through so controls can reference the label", () => {
    const r = render(<Label nativeID="name-label" testID="label" truncate>Name</Label>);
    const node = labelOf(r);
    assert.equal(node.props.nativeID, "name-label");
    assert.equal(node.props.testID, "label");
    assert.equal(node.props.numberOfLines, 1);
  });

  it("builds the accessibility text from string and number children only", () => {
    const props: LabelProps = { required: true, children: ["Item ", 2, <React.Fragment key="x">!</React.Fragment>] };
    assert.equal(labelOf(render(<Label {...props} />)).props.accessibilityLabel, "Item 2, required");
  });

  it("leaves the accessibility label to the screen reader when required but there is no plain text to speak", () => {
    const r = render(
      <Label required>
        <React.Fragment>rich</React.Fragment>
      </Label>,
    );
    assert.equal(labelOf(r).props.accessibilityLabel, undefined);
    assert.equal(textsOf(r)[1]!.props.children, " *");
  });

  it("renders in light and dark under ThemeProvider with no console.error or console.warn", () => {
    const calls: unknown[][] = [];
    // react-test-renderer logs its own deprecation notice once per process; that notice is not a component error.
    console.error = (...args: unknown[]) => {
      if (!String(args[0]).includes("react-test-renderer is deprecated")) calls.push(args);
    };
    console.warn = (...args: unknown[]) => void calls.push(args);
    for (const mode of ["light", "dark"] as const) {
      render(<Label required disabled optional size="sm">Name</Label>, mode);
      render(<Label>Name</Label>, mode);
    }
    assert.deepEqual(calls, []);
  });
});
