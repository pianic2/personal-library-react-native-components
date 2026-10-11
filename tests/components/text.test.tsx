import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";
import { B, CodeInline, Heading, P, Small, Text, ThemeProvider, useTheme } from "../../src";

const host = (name: string) => name as unknown as React.ElementType;

function render(ui: React.ReactElement, mode: "light" | "dark" = "light"): TestRenderer.ReactTestRenderer {
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

function themeOf(): ReturnType<typeof useTheme> {
  let captured: ReturnType<typeof useTheme> | undefined;
  function Probe() {
    captured = useTheme();
    return null;
  }
  render(<Probe />);
  return captured as ReturnType<typeof useTheme>;
}

const flatten = (style: unknown): Record<string, any> => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));
const nodeOf = (r: TestRenderer.ReactTestRenderer) => r.root.findByType(host("Text"));

describe("PLRNUI-218 Text defaults", () => {
  it("the default Text has no textAlign justify (nor any textAlign)", () => {
    const style = flatten(nodeOf(render(<Text>hello</Text>)).props.style);
    assert.notEqual(style.textAlign, "justify");
    assert.equal("textAlign" in style, false);
  });

  it("an explicit align is applied, including justify", () => {
    for (const align of ["left", "center", "right", "justify"] as const) {
      assert.equal(flatten(nodeOf(render(<Text align={align}>x</Text>)).props.style).textAlign, align, align);
    }
  });

  it("applies the regular font family token, and a style fontFamily overrides it", () => {
    const { theme } = themeOf();
    assert.equal(flatten(nodeOf(render(<Text>x</Text>)).props.style).fontFamily, theme.typography.fontFamily.regular);
    assert.equal(flatten(nodeOf(render(<Text style={{ fontFamily: "Custom" }}>x</Text>)).props.style).fontFamily, "Custom");
  });

  it("components built on Text inherit the new defaults; P still aligns left and CodeInline keeps the mono family", () => {
    const { theme } = themeOf();
    for (const element of [<B key="b">x</B>, <Small key="s">x</Small>, <Heading key="h">x</Heading>]) {
      const style = flatten(nodeOf(render(element)).props.style);
      assert.equal("textAlign" in style, false);
      assert.equal(style.fontFamily, theme.typography.fontFamily.regular);
    }
    assert.equal(flatten(nodeOf(render(<P>x</P>)).props.style).textAlign, "left");
    assert.equal(flatten(nodeOf(render(<CodeInline>x</CodeInline>)).props.style).fontFamily, theme.typography.fontFamily.mono);
  });
});

describe("PLRNUI-218 Text lines", () => {
  it("has no line limit by default", () => {
    const node = nodeOf(render(<Text>x</Text>));
    assert.equal(node.props.numberOfLines, undefined);
    assert.equal(node.props.ellipsizeMode, undefined);
  });

  it("truncate limits to one line with a tail ellipsis", () => {
    const node = nodeOf(render(<Text truncate>x</Text>));
    assert.equal(node.props.numberOfLines, 1);
    assert.equal(node.props.ellipsizeMode, "tail");
  });

  it("lines limits to that many lines with a tail ellipsis", () => {
    const node = nodeOf(render(<Text lines={3}>x</Text>));
    assert.equal(node.props.numberOfLines, 3);
    assert.equal(node.props.ellipsizeMode, "tail");
  });

  it("precedence: numberOfLines beats lines, lines beats truncate; an explicit ellipsizeMode always wins", () => {
    assert.equal(nodeOf(render(<Text numberOfLines={2} lines={5} truncate>x</Text>)).props.numberOfLines, 2);
    assert.equal(nodeOf(render(<Text lines={4} truncate>x</Text>)).props.numberOfLines, 4);
    assert.equal(nodeOf(render(<Text truncate ellipsizeMode="middle">x</Text>)).props.ellipsizeMode, "middle");
    assert.equal(nodeOf(render(<Text lines={2} ellipsizeMode="clip">x</Text>)).props.ellipsizeMode, "clip");
  });

  it("numberOfLines alone (no truncate or lines) passes through with a tail ellipsis; 0 means no limit and no ellipsis", () => {
    const limited = nodeOf(render(<Text numberOfLines={2}>x</Text>));
    assert.equal(limited.props.numberOfLines, 2);
    assert.equal(limited.props.ellipsizeMode, "tail");
    const unlimited = nodeOf(render(<Text numberOfLines={0}>x</Text>));
    assert.equal(unlimited.props.numberOfLines, 0);
    assert.equal(unlimited.props.ellipsizeMode, undefined);
  });
});

describe("PLRNUI-218 Text accessibility and rendering", () => {
  it("passes accessibilityRole and other text props through", () => {
    const node = nodeOf(render(<Text accessibilityRole="header" accessibilityLabel="Title" testID="t" selectable>x</Text>));
    assert.equal(node.props.accessibilityRole, "header");
    assert.equal(node.props.accessibilityLabel, "Title");
    assert.equal(node.props.testID, "t");
    assert.equal(node.props.selectable, true);
  });

  it("renders in light and dark with no console output", () => {
    const calls: unknown[][] = [];
    const originalError = console.error;
    const originalWarn = console.warn;
    // react-test-renderer logs its own deprecation notice once per process; that notice is not a component error.
    console.error = (...args: unknown[]) => {
      if (!String(args[0]).includes("react-test-renderer is deprecated")) calls.push(args);
    };
    console.warn = (...args: unknown[]) => void calls.push(args);
    try {
      for (const mode of ["light", "dark"] as const) render(<Text lines={2} align="center">x</Text>, mode);
    } finally {
      console.error = originalError;
      console.warn = originalWarn;
    }
    assert.deepEqual(calls, []);
  });
});
