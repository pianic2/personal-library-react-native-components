import React from "react";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";
import { Platform } from "react-native";
import { ThemeProvider, useTheme, P, Text, type PProps } from "../../../src";

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


const PWithRef = P as React.ComponentType<PProps & { ref?: React.Ref<unknown> }>;
const textOf = (r: TestRenderer.ReactTestRenderer) => r.root.findByType(host("Text"));

describe("PLRNUI-104 P", () => {
  it("is a medium, regular, left-aligned paragraph", () => {
    const { theme, colors } = themeOf();
    const style = flatten(textOf(render(<P>para</P>)).props.style);
    assert.equal(style.fontSize, theme.typography.fontSize.md);
    assert.equal(style.fontWeight, theme.typography.fontWeight.regular);
    assert.equal(style.textAlign, "left");
    assert.equal(style.color, colors.textPrimary);
  });

  it("differs from Text only by its left alignment", () => {
    const paragraph = flatten(textOf(render(<P>x</P>)).props.style);
    const text = flatten(textOf(render(<Text>x</Text>)).props.style);
    assert.deepEqual({ ...text, textAlign: "left" }, paragraph);
  });

  it("lets props override its defaults", () => {
    const { theme } = themeOf();
    const style = flatten(textOf(render(<P size="lg" weight="bold" align="center">x</P>)).props.style);
    assert.equal(style.fontSize, theme.typography.fontSize.lg);
    assert.equal(style.fontWeight, theme.typography.fontWeight.bold);
    assert.equal(style.textAlign, "center");
  });

  it("supports variants and a style override", () => {
    const { colors } = themeOf();
    const style = flatten(textOf(render(<P variant="success" style={{ marginTop: 4 }}>x</P>)).props.style);
    assert.equal(style.color, colors.success);
    assert.equal(style.marginTop, 4);
  });

  it("forwards text props and the ref", () => {
    const ref = React.createRef<unknown>();
    const node = textOf(render(<PWithRef ref={ref} testID="p" truncate>x</PWithRef>));
    assert.equal(node.props.testID, "p");
    assert.equal(node.props.numberOfLines, 1);
    assert.notEqual(ref.current, null);
  });
});
