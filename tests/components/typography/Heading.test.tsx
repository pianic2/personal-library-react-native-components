import React from "react";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";
import { Platform } from "react-native";
import { ThemeProvider, useTheme, Heading, type HeadingProps } from "../../../src";

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


const HeadingWithRef = Heading as React.ComponentType<HeadingProps & { ref?: React.Ref<unknown> }>;
const textOf = (r: TestRenderer.ReactTestRenderer) => r.root.findByType(host("Text"));

describe("PLRNUI-104 Heading", () => {
  it("maps level 1 to 6 to the xxxl, xxl, xl, lg, md and sm font sizes", () => {
    const { theme } = themeOf();
    const sizes = { 1: "xxxl", 2: "xxl", 3: "xl", 4: "lg", 5: "md", 6: "sm" } as const;
    for (const level of [1, 2, 3, 4, 5, 6] as const) {
      const style = flatten(textOf(render(<Heading level={level}>Title</Heading>)).props.style);
      assert.equal(style.fontSize, theme.typography.fontSize[sizes[level]], `level ${level}`);
    }
  });

  it("defaults to level 1 and is always bold", () => {
    const { theme } = themeOf();
    const style = flatten(textOf(render(<Heading>Title</Heading>)).props.style);
    assert.equal(style.fontSize, theme.typography.fontSize.xxxl);
    assert.equal(style.fontWeight, theme.typography.fontWeight.bold);
  });

  it("keeps the level size and bold weight even when size or weight props are passed", () => {
    const { theme } = themeOf();
    const props = { size: "xs", weight: "regular" } as unknown as Partial<HeadingProps>;
    const style = flatten(textOf(render(<Heading level={2} {...props}>Title</Heading>)).props.style);
    assert.equal(style.fontSize, theme.typography.fontSize.xxl);
    assert.equal(style.fontWeight, theme.typography.fontWeight.bold);
  });

  it("passes variant, align and style through to Text", () => {
    const { colors } = themeOf();
    const style = flatten(textOf(render(<Heading variant="danger" align="center" style={{ letterSpacing: 2 }}>Title</Heading>)).props.style);
    assert.equal(style.color, colors.error);
    assert.equal(style.textAlign, "center");
    assert.equal(style.letterSpacing, 2);
  });

  it("renders its text and forwards props and the ref", () => {
    const ref = React.createRef<unknown>();
    const node = textOf(render(<HeadingWithRef ref={ref} testID="h" accessibilityRole="header">Title</HeadingWithRef>));
    assert.equal(node.props.children, "Title");
    assert.equal(node.props.testID, "h");
    assert.equal(node.props.accessibilityRole, "header");
    assert.notEqual(ref.current, null);
  });
});
