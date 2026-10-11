import React from "react";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";
import { Platform } from "react-native";
import { ThemeProvider, useTheme, Small, type SmallProps } from "../../../src";

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


const SmallWithRef = Small as React.ComponentType<SmallProps & { ref?: React.Ref<unknown> }>;
const textOf = (r: TestRenderer.ReactTestRenderer) => r.root.findByType(host("Text"));

describe("PLRNUI-104 Small", () => {
  it("is small and muted by default, in light and dark", () => {
    for (const mode of ["light", "dark"] as const) {
      const { theme, colors } = themeOf(mode);
      const style = flatten(textOf(render(<Small>fine print</Small>, mode)).props.style);
      assert.equal(style.fontSize, theme.typography.fontSize.sm, mode);
      assert.equal(style.color, colors.textMuted, mode);
    }
  });

  it("lets size and variant props override its defaults", () => {
    const { theme, colors } = themeOf();
    const style = flatten(textOf(render(<Small size="lg" variant="danger">x</Small>)).props.style);
    assert.equal(style.fontSize, theme.typography.fontSize.lg);
    assert.equal(style.color, colors.error);
  });

  it("supports weight, align and a style override", () => {
    const { theme } = themeOf();
    const style = flatten(textOf(render(<Small weight="bold" align="right" style={{ marginTop: 2 }}>x</Small>)).props.style);
    assert.equal(style.fontWeight, theme.typography.fontWeight.bold);
    assert.equal(style.textAlign, "right");
    assert.equal(style.marginTop, 2);
  });

  it("forwards text props and the ref", () => {
    const ref = React.createRef<unknown>();
    const node = textOf(render(<SmallWithRef ref={ref} testID="s" truncate>x</SmallWithRef>));
    assert.equal(node.props.testID, "s");
    assert.equal(node.props.numberOfLines, 1);
    assert.notEqual(ref.current, null);
  });
});
