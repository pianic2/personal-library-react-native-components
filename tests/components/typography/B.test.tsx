import React from "react";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";
import { Platform } from "react-native";
import { ThemeProvider, useTheme, B, type BProps } from "../../../src";

// The react-native test shim exposes a mutable Platform and host components that are plain strings ("View", "Text").
const platform = Platform as { OS: string };
const originalOS = platform.OS;
afterEach(() => {
  platform.OS = originalOS;
});

const host = (name: string) => name as unknown as React.ElementType;
type Mode = "light" | "dark";

function render(ui: React.ReactElement, mode: Mode = "light"): TestRenderer.ReactTestRenderer {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    // host refs are null in the test renderer unless nodes are mocked
    renderer = TestRenderer.create(
      <ThemeProvider initialMode={mode} persistTheme={false}>
        {ui}
      </ThemeProvider>,
      { createNodeMock: () => ({ mock: true }) },
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

/** Merges a style array (nested arrays, falsy entries) into one object; later entries win, like React Native. */
function flatten(style: unknown): Record<string, any> {
  return Object.assign({}, ...[style].flat(Infinity).filter(Boolean));
}


const BWithRef = B as React.ComponentType<BProps & { ref?: React.Ref<unknown> }>;
const textOf = (r: TestRenderer.ReactTestRenderer) => r.root.findByType(host("Text"));

describe("PLRNUI-104 B", () => {
  it("renders bold text at the default size and colour", () => {
    const { theme, colors } = themeOf();
    const style = flatten(textOf(render(<B>bold</B>)).props.style);
    assert.equal(style.fontWeight, theme.typography.fontWeight.bold);
    assert.equal(style.fontSize, theme.typography.fontSize.md);
    assert.equal(style.color, colors.textPrimary);
  });

  it("lets an explicit weight win over the bold default", () => {
    const { theme } = themeOf();
    assert.equal(flatten(textOf(render(<B weight="regular">x</B>)).props.style).fontWeight, theme.typography.fontWeight.regular);
  });

  it("passes size, variant and style through", () => {
    const { theme, colors } = themeOf();
    const style = flatten(textOf(render(<B size="xl" variant="muted" style={{ letterSpacing: 1 }}>x</B>)).props.style);
    assert.equal(style.fontSize, theme.typography.fontSize.xl);
    assert.equal(style.color, colors.textMuted);
    assert.equal(style.letterSpacing, 1);
    assert.equal(style.fontWeight, theme.typography.fontWeight.bold);
  });

  it("renders its children inline and forwards text props and the ref", () => {
    const ref = React.createRef<unknown>();
    const node = textOf(render(<BWithRef ref={ref} testID="b">strong</BWithRef>));
    assert.equal(node.props.children, "strong");
    assert.equal(node.props.testID, "b");
    assert.deepEqual(ref.current, { mock: true });
  });
});
