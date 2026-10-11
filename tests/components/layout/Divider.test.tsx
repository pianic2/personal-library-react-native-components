import React from "react";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";
import { Platform } from "react-native";
import { ThemeProvider, useTheme, Divider } from "../../../src";

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


const rootView = (r: TestRenderer.ReactTestRenderer) => r.root.findByType(host("View"));

describe("PLRNUI-104 Divider", () => {
  it("is a full-width one-unit line with the divider colour and no margin by default", () => {
    const { colors } = themeOf();
    const style = flatten(rootView(render(<Divider />)).props.style);
    assert.deepEqual(style, { height: 1, backgroundColor: colors.divider, marginVertical: 0, width: "100%" });
  });

  it("takes the colour from the token of the current mode", () => {
    for (const mode of ["light", "dark"] as const) {
      const { colors } = themeOf(mode);
      assert.equal(flatten(rootView(render(<Divider />, mode)).props.style).backgroundColor, colors.divider, mode);
    }
  });

  it("sets the thickness", () => {
    assert.equal(flatten(rootView(render(<Divider thickness={4} />)).props.style).height, 4);
  });

  it("resolves the spacing token to a vertical margin", () => {
    const { theme } = themeOf();
    for (const spacing of ["xs", "md", "xxl"] as const) {
      assert.equal(flatten(rootView(render(<Divider spacing={spacing} />)).props.style).marginVertical, theme.space[spacing], spacing);
    }
  });

  it("lets the style prop (object or array) override the defaults", () => {
    assert.equal(flatten(rootView(render(<Divider style={{ height: 9 }} />)).props.style).height, 9);
    const style = flatten(rootView(render(<Divider style={[{ width: "50%" }, { opacity: 0.5 }]} />)).props.style);
    assert.equal(style.width, "50%");
    assert.equal(style.opacity, 0.5);
  });
});
