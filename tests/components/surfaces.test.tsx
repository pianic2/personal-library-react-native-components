import React from "react";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";
import { Platform } from "react-native";
import { ThemeProvider, useTheme, Badge, Card, Text } from "../../src";
import { contrastRatio } from "../../src/theme/contrast";
import { register } from "node:module";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

// The example imports the public package name; map it to src for the test run (as tests/examples/render.test.tsx does).
const root = resolve(import.meta.dirname, "../..");
const srcEntry = pathToFileURL(join(root, "src", "index.ts")).href;
register(
  `data:text/javascript,${encodeURIComponent(`
    export function resolve(specifier, context, nextResolve) {
      if (specifier === "@personal-library/react-native-components") {
        return { shortCircuit: true, format: "module", url: ${JSON.stringify(srcEntry)} };
      }
      return nextResolve(specifier, context);
    }
  `)}`,
  import.meta.url,
);
(globalThis as { React?: typeof React }).React = React;

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

function flatten(style: unknown): Record<string, any> {
  return Object.assign({}, ...[style].flat(Infinity).filter(Boolean));
}

const cardStyle = (r: TestRenderer.ReactTestRenderer) => flatten(r.root.findByType(host("View")).props.style);
const badgeText = (r: TestRenderer.ReactTestRenderer) => r.root.findByType(host("Text"));
const badgeChip = (r: TestRenderer.ReactTestRenderer) => flatten(r.root.findAllByType(host("View"))[1]!.props.style);

describe("PLRNUI-304 surfaces example", () => {
  it("renders 3 Card variants and 5 Badge variants", async () => {
    const { SurfacesExample } = (await import(pathToFileURL(join(root, "examples", "surfaces.tsx")).href)) as {
      SurfacesExample: React.ComponentType;
    };
    const r = render(<SurfacesExample />);
    assert.equal(r.root.findAllByType(Card).length, 3);
    assert.equal(r.root.findAllByType(Badge).length, 5);
    assert.deepEqual(
      r.root.findAllByType(Card).map((c) => c.props.variant),
      ["default", "elevated", "outline"],
    );
    assert.deepEqual(
      r.root.findAllByType(Badge).map((b) => b.props.variant),
      ["primary", "success", "warning", "danger", "info"],
    );
  });
});

describe("PLRNUI-304 Card", () => {
  it("each variant produces its border and shadow (explicit shadow tokens, iOS)", () => {
    const { theme, colors } = themeOf();
    const expected = {
      default: { border: false, shadow: "sm" as const },
      elevated: { border: false, shadow: "md" as const },
      outline: { border: true, shadow: "none" as const },
    };
    for (const variant of Object.keys(expected) as Array<keyof typeof expected>) {
      const style = cardStyle(render(<Card variant={variant} shadow={expected[variant].shadow} />));
      assert.equal(style.borderWidth, expected[variant].border ? 1 : undefined, variant);
      assert.equal(style.borderColor, expected[variant].border ? colors.border : undefined, variant);
      assert.deepEqual(style.shadowOffset, theme.shadows[expected[variant].shadow].shadowOffset, variant);
      assert.equal(style.shadowOpacity, theme.shadows[expected[variant].shadow].shadowOpacity, variant);
    }
  });

  it("bgColor accepts a colour token key or a raw colour string", () => {
    const { colors } = themeOf();
    assert.equal(cardStyle(render(<Card bgColor="primary" />)).backgroundColor, colors.primary);
    assert.equal(cardStyle(render(<Card bgColor="#123456" />)).backgroundColor, "#123456");
    assert.equal(cardStyle(render(<Card bgColor="red" />)).backgroundColor, "red");
  });

  it("Android forwards the shadow colour next to the elevation", () => {
    const { theme } = themeOf();
    platform.OS = "android";
    const style = cardStyle(render(<Card shadow="lg" />));
    assert.equal(style.elevation, theme.shadows.lg.elevation);
    assert.equal(style.shadowColor, theme.shadows.lg.shadowColor);
  });
});

describe("PLRNUI-304 Badge", () => {
  const variants = { primary: "primary", success: "success", warning: "warning", danger: "error", info: "info" } as const;

  it("text colour reaches 4.5:1 on every variant background in light and dark", () => {
    for (const mode of ["light", "dark"] as const) {
      const { colors } = themeOf(mode);
      for (const variant of Object.keys(variants) as Array<keyof typeof variants>) {
        const r = render(<Badge variant={variant}>x</Badge>, mode);
        const background = badgeChip(r).backgroundColor;
        assert.equal(background, colors[variants[variant]], `${mode} ${variant}`);
        const ratio = contrastRatio(flatten(badgeText(r).props.style).color, background);
        assert.ok(ratio >= 4.5, `${mode} ${variant}: ${ratio.toFixed(2)}`);
      }
    }
  });

  it("a count-only Badge has a default accessibilityLabel that the prop overrides", () => {
    assert.equal(badgeText(render(<Badge>{3}</Badge>)).props.accessibilityLabel, "3");
    assert.equal(badgeText(render(<Badge>12</Badge>)).props.accessibilityLabel, "12");
    assert.equal(badgeText(render(<Badge accessibilityLabel="3 unread">{3}</Badge>)).props.accessibilityLabel, "3 unread");
    assert.equal(badgeText(render(<Badge>New</Badge>)).props.accessibilityLabel, undefined);
    platform.OS = "web";
    assert.equal(badgeText(render(<Badge>{7}</Badge>)).props.accessibilityLabel, "7");
  });
});
