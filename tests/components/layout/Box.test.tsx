import React from "react";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";
import { Platform } from "react-native";
import { ThemeProvider, useTheme, Box, type BoxProps } from "../../../src";

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


const BoxWithRef = Box as React.ComponentType<BoxProps & { ref?: React.Ref<unknown> }>;
const rootView = (r: TestRenderer.ReactTestRenderer) => r.root.findByType(host("View"));

describe("PLRNUI-104 Box", () => {
  it("defaults to a medium radius and no padding, margin, background, border or shadow", () => {
    const { theme } = themeOf();
    const style = flatten(rootView(render(<Box />)).props.style);
    assert.deepEqual(style, { borderRadius: theme.radius.md });
  });

  it("resolves padding, margin and radius tokens", () => {
    const { theme } = themeOf();
    const style = flatten(rootView(render(<Box padding="lg" margin="sm" radius="lg" />)).props.style);
    assert.equal(style.padding, theme.space.lg);
    assert.equal(style.margin, theme.space.sm);
    assert.equal(style.borderRadius, theme.radius.lg);
  });

  it("resolves the background colour and the border from the colour tokens of the current mode", () => {
    for (const mode of ["light", "dark"] as const) {
      const { colors } = themeOf(mode);
      const style = flatten(rootView(render(<Box bg="surface" border />, mode)).props.style);
      assert.equal(style.backgroundColor, colors.surface, mode);
      assert.equal(flatten(rootView(render(<Box bg="primary" />, mode)).props.style).backgroundColor, colors.primary, mode);
      assert.equal(style.borderWidth, 1, mode);
      assert.equal(style.borderColor, colors.border, mode);
    }
  });

  it("applies the shadow token natively and as a box-shadow string on web", () => {
    const { theme } = themeOf();
    assert.deepEqual(flatten(rootView(render(<Box shadow="md" />)).props.style).shadowOffset, theme.shadows.md.shadowOffset);
    platform.OS = "web";
    const web = flatten(rootView(render(<Box shadow="md" />)).props.style);
    const md = theme.shadows.md;
    assert.equal(web.boxShadow, `${md.shadowOffset.width}px ${md.shadowOffset.height}px ${md.shadowRadius}px rgba(0, 0, 0, ${md.shadowOpacity})`);
    assert.equal(flatten(rootView(render(<Box shadow="none" />)).props.style).boxShadow, "none");
  });

  it("lets the style prop override the token styles", () => {
    const style = flatten(rootView(render(<Box padding="lg" bg="surface" style={[{ padding: 1 }, { backgroundColor: "red" }]} />)).props.style);
    assert.equal(style.padding, 1);
    assert.equal(style.backgroundColor, "red");
  });

  it("forwards view props and children, and the ref to the View", () => {
    const ref = React.createRef<unknown>();
    const r = render(
      <BoxWithRef ref={ref} testID="box" accessibilityLabel="panel">
        <BoxWithRef testID="inner" />
      </BoxWithRef>,
    );
    const outer = r.root.findAllByType(host("View"))[0]!;
    assert.equal(outer.props.testID, "box");
    assert.equal(outer.props.accessibilityLabel, "panel");
    assert.equal(r.root.findAllByType(host("View")).length, 2);
    assert.deepEqual(ref.current, { mock: true });
  });
});
