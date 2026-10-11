import React from "react";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";
import { Platform } from "react-native";
import { ThemeProvider, useTheme, Card, Text } from "../../../src";

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

describe("PLRNUI-104 Card", () => {
  it("default variant: surface background, token radius and padding, small shadow", () => {
    const { theme, colors } = themeOf();
    const style = flatten(rootView(render(<Card><Text>x</Text></Card>)).props.style);
    assert.equal(style.width, "100%");
    assert.equal(style.backgroundColor, colors.surface);
    assert.equal(style.borderRadius, theme.components.card?.radius ?? theme.radius.lg);
    assert.equal(style.padding, theme.components.card?.padding ?? theme.space.md);
    assert.equal(style.margin, theme.space.none);
    assert.equal(style.borderWidth, undefined);
    assert.deepEqual(style.shadowOffset, theme.shadows[theme.components.card!.shadow!].shadowOffset);
  });

  it("outline variant: transparent background and a border; elevated keeps the surface background", () => {
    const { colors } = themeOf();
    const outline = flatten(rootView(render(<Card variant="outline"><Text>x</Text></Card>)).props.style);
    assert.equal(outline.backgroundColor, "transparent");
    assert.equal(outline.borderWidth, 1);
    assert.equal(outline.borderColor, colors.border);
    const elevated = flatten(rootView(render(<Card variant="elevated"><Text>x</Text></Card>)).props.style);
    assert.equal(elevated.backgroundColor, colors.surface);
    assert.equal(elevated.borderWidth, undefined);
  });

  it("the card shadow token of the theme wins over the variant default; an explicit shadow prop wins over both", () => {
    // The default theme sets components.card.shadow, and theme overrides cannot unset it, so the variant-based
    // fallback (outline none, elevated md, default sm) is not reachable through ThemeProvider.
    const { theme } = themeOf();
    const token = theme.shadows[theme.components.card!.shadow!];
    for (const variant of ["default", "outline", "elevated"] as const) {
      const style = flatten(rootView(render(<Card variant={variant} />)).props.style);
      assert.deepEqual(style.shadowOffset, token.shadowOffset, variant);
      assert.equal(style.shadowOpacity, token.shadowOpacity, variant);
    }
    const explicit = flatten(rootView(render(<Card variant="outline" shadow="lg" />)).props.style);
    assert.deepEqual(explicit.shadowOffset, theme.shadows.lg.shadowOffset);
    assert.equal(explicit.shadowRadius, theme.shadows.lg.shadowRadius);
  });

  it("takes the surface colour from the current mode", () => {
    for (const mode of ["light", "dark"] as const) {
      const { colors } = themeOf(mode);
      assert.equal(flatten(rootView(render(<Card />, mode)).props.style).backgroundColor, colors.surface, mode);
    }
  });

  it("resolves padding and margin tokens and the radius and bgColor overrides", () => {
    const { theme } = themeOf();
    const style = flatten(rootView(render(<Card padding="xl" margin="sm" radius={3} bgColor="red" />)).props.style);
    assert.equal(style.padding, theme.space.xl);
    assert.equal(style.margin, theme.space.sm);
    assert.equal(style.borderRadius, 3);
    assert.equal(style.backgroundColor, "red");
  });

  it("applies an explicit shadow token natively, as elevation on Android and as a box-shadow on web", () => {
    const { theme } = themeOf();
    const native = flatten(rootView(render(<Card shadow="lg" />)).props.style);
    assert.deepEqual(native.shadowOffset, theme.shadows.lg.shadowOffset);
    platform.OS = "android";
    assert.equal(flatten(rootView(render(<Card shadow="lg" />)).props.style).elevation, theme.shadows.lg.elevation);
    platform.OS = "web";
    const lg = theme.shadows.lg;
    assert.equal(
      flatten(rootView(render(<Card shadow="lg" />)).props.style).boxShadow,
      `${lg.shadowOffset.width}px ${lg.shadowOffset.height}px ${lg.shadowRadius}px rgba(0, 0, 0, ${lg.shadowOpacity})`,
    );
    assert.equal(flatten(rootView(render(<Card shadow="none" />)).props.style).boxShadow, "none");
  });

  it("lets the style prop override and renders its children", () => {
    const r = render(
      <Card style={[{ padding: 1 }, { width: 50 }]}>
        <Text>inside</Text>
      </Card>,
    );
    const style = flatten(rootView(r).props.style);
    assert.equal(style.padding, 1);
    assert.equal(style.width, 50);
    assert.equal(r.root.findByType(host("Text")).props.children, "inside");
  });
});
