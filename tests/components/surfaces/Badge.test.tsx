import React from "react";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";
import { Platform } from "react-native";
import { ThemeProvider, useTheme, Badge, type BadgeProps } from "../../../src";
import { contrastRatio } from "../../../src/theme/contrast";

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


const BadgeWithRef = Badge as React.ComponentType<BadgeProps & { ref?: React.Ref<unknown> }>;
const textOf = (r: TestRenderer.ReactTestRenderer) => r.root.findByType(host("Text"));
// Native: outer View (alignment) > inner View (chip) > Text. Web: a single Text carries the chip styles.
const chipOf = (r: TestRenderer.ReactTestRenderer) => flatten(r.root.findAllByType(host("View"))[1]!.props.style);

describe("PLRNUI-104 Badge", () => {
  it("native: a centred View wrapping a rounded chip View and a bold Text", () => {
    const { theme, colors } = themeOf();
    const r = render(<Badge>New</Badge>);
    const views = r.root.findAllByType(host("View"));
    assert.equal(views.length, 2);
    assert.equal(flatten(views[0]!.props.style).alignSelf, "center");
    assert.deepEqual(flatten(views[0]!.props.style).transform, [{ translateY: 1 }]);
    const chip = chipOf(r);
    assert.equal(chip.backgroundColor, colors.primary);
    assert.equal(chip.borderRadius, theme.radius.full);
    assert.equal(chip.paddingHorizontal, theme.space.md);
    assert.equal(flatten(textOf(r).props.style).fontWeight, theme.typography.fontWeight.bold);
    assert.equal(textOf(r).props.children, "New");
  });

  it("maps every variant to its background and a readable text colour, in light and dark", () => {
    for (const mode of ["light", "dark"] as const) {
      const { colors } = themeOf(mode);
      const expected = { primary: colors.primary, success: colors.success, warning: colors.warning, danger: colors.error, info: colors.info };
      for (const variant of Object.keys(expected) as Array<keyof typeof expected>) {
        const r = render(<Badge variant={variant}>x</Badge>, mode);
        assert.equal(chipOf(r).backgroundColor, expected[variant], `${mode} ${variant}`);
        // PLRNUI-304: the text token with the higher contrast on the background (4.5:1 is asserted in tests/components/surfaces.test.tsx)
        const color = flatten(textOf(r).props.style).color;
        const other = color === colors.textInverted ? colors.textPrimary : colors.textInverted;
        assert.ok([colors.textInverted, colors.textPrimary].includes(color), `${mode} ${variant}`);
        assert.ok(contrastRatio(color, expected[variant]) >= contrastRatio(other, expected[variant]), `${mode} ${variant}`);
      }
    }
  });

  it("resolves the size token to the chip font size", () => {
    const { theme } = themeOf();
    assert.equal(chipOf(render(<Badge>x</Badge>)).fontSize, theme.typography.fontSize.md);
    assert.equal(chipOf(render(<Badge size="xs">x</Badge>)).fontSize, theme.typography.fontSize.xs);
  });

  it("web: a single Text carries the chip styles and a right margin", () => {
    const { theme, colors } = themeOf();
    platform.OS = "web";
    const r = render(<Badge variant="success">x</Badge>);
    assert.equal(r.root.findAllByType(host("View")).length, 0);
    const style = flatten(textOf(r).props.style);
    assert.equal(style.backgroundColor, colors.success);
    assert.equal(style.marginRight, theme.space.sm);
    assert.equal(style.borderRadius, theme.radius.full);
  });

  it("lets the style prop override the text styles and forwards text props and the ref", () => {
    const ref = React.createRef<unknown>();
    const r = render(<BadgeWithRef ref={ref} style={{ color: "red" }} testID="badge" accessibilityLabel="new">x</BadgeWithRef>);
    const node = textOf(r);
    assert.equal(flatten(node.props.style).color, "red");
    assert.equal(node.props.testID, "badge");
    assert.equal(node.props.accessibilityLabel, "new");
    assert.deepEqual(ref.current, { mock: true });
  });
});
