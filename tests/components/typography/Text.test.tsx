import React from "react";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";
import { Platform } from "react-native";
import { ThemeProvider, useTheme, Text, type TextProps } from "../../../src";

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


const TextWithRef = Text as React.ComponentType<TextProps & { ref?: React.Ref<unknown> }>;
const textOf = (r: TestRenderer.ReactTestRenderer) => r.root.findByType(host("Text"));

describe("PLRNUI-104 Text", () => {
  it("defaults to medium, regular weight, the primary colour and the platform text alignment", () => {
    const { theme, colors } = themeOf();
    const style = flatten(textOf(render(<Text>hello</Text>)).props.style);
    assert.equal(style.fontSize, theme.typography.fontSize.md);
    assert.equal(style.fontWeight, theme.typography.fontWeight.regular);
    assert.equal(style.color, colors.textPrimary);
    assert.equal("textAlign" in style, false, "no textAlign by default (it used to be justify)");
    assert.equal(style.fontFamily, theme.typography.fontFamily.regular);
    assert.equal(style.lineHeight, theme.typography.fontSize.md * theme.typography.lineHeight.normal);
  });

  it("maps every variant to its colour token in light and dark", () => {
    for (const mode of ["light", "dark"] as const) {
      const { colors } = themeOf(mode);
      const expected = { default: colors.textPrimary, muted: colors.textMuted, danger: colors.error, success: colors.success };
      for (const variant of Object.keys(expected) as Array<keyof typeof expected>) {
        assert.equal(flatten(textOf(render(<Text variant={variant}>x</Text>, mode)).props.style).color, expected[variant], `${mode} ${variant}`);
      }
    }
  });

  it("resolves the size and weight tokens, and derives the line height from the size", () => {
    const { theme } = themeOf();
    for (const size of ["xs", "sm", "lg", "xxxl"] as const) {
      const style = flatten(textOf(render(<Text size={size}>x</Text>)).props.style);
      assert.equal(style.fontSize, theme.typography.fontSize[size], size);
      assert.equal(style.lineHeight, theme.typography.fontSize[size] * theme.typography.lineHeight.normal, size);
    }
    assert.equal(flatten(textOf(render(<Text weight="bold">x</Text>)).props.style).fontWeight, theme.typography.fontWeight.bold);
  });

  it("maps align and truncates to one line with a tail ellipsis", () => {
    assert.equal(flatten(textOf(render(<Text align="center">x</Text>)).props.style).textAlign, "center");
    const plain = textOf(render(<Text>x</Text>));
    assert.equal(plain.props.numberOfLines, undefined);
    assert.equal(plain.props.ellipsizeMode, undefined);
    const truncated = textOf(render(<Text truncate>x</Text>));
    assert.equal(truncated.props.numberOfLines, 1);
    assert.equal(truncated.props.ellipsizeMode, "tail");
  });

  it("lets the style prop override the token styles", () => {
    const style = flatten(textOf(render(<Text style={[{ color: "red" }, { fontSize: 99 }]}>x</Text>)).props.style);
    assert.equal(style.color, "red");
    assert.equal(style.fontSize, 99);
  });

  it("forwards text props and the ref, and renders its children", () => {
    const ref = React.createRef<unknown>();
    const r = render(<TextWithRef ref={ref} accessibilityRole="header" testID="t">hello</TextWithRef>);
    const node = textOf(r);
    assert.equal(node.props.accessibilityRole, "header");
    assert.equal(node.props.testID, "t");
    assert.deepEqual(node.props.children, "hello");
    assert.deepEqual(ref.current, { mock: true });
  });
});
