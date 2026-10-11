import React from "react";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";
import { Platform } from "react-native";
import { ThemeProvider, useTheme, Quote, B } from "../../../src";

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


describe("PLRNUI-104 Quote", () => {
  it("draws a primary-coloured left rule with token padding and margin", () => {
    for (const mode of ["light", "dark"] as const) {
      const { theme, colors } = themeOf(mode);
      const style = flatten(render(<Quote>wise words</Quote>, mode).root.findByType(host("View")).props.style);
      assert.equal(style.borderLeftWidth, 4, mode);
      assert.equal(style.borderLeftColor, colors.primary, mode);
      assert.equal(style.paddingLeft, theme.space.md, mode);
      assert.equal(style.marginVertical, theme.space.md, mode);
    }
  });

  it("renders the quote as muted italic text", () => {
    const { colors } = themeOf();
    const node = render(<Quote>wise words</Quote>).root.findByType(host("Text"));
    const style = flatten(node.props.style);
    assert.equal(style.fontStyle, "italic");
    assert.equal(style.color, colors.textMuted);
    assert.equal(node.props.children, "wise words");
  });

  it("accepts rich children", () => {
    const r = render(
      <Quote>
        plain <B>bold</B>
      </Quote>,
    );
    assert.equal(r.root.findAllByType(host("Text")).length, 2);
  });

  it("renders exactly one View and one Text for plain text", () => {
    const r = render(<Quote>x</Quote>);
    assert.equal(r.root.findAllByType(host("View")).length, 1);
    assert.equal(r.root.findAllByType(host("Text")).length, 1);
  });
});
