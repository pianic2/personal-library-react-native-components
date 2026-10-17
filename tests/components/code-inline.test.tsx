import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";
import { ThemeProvider, useTheme, CodeInline } from "../../src";

const host = (name: string) => name as unknown as React.ElementType;

function render(ui: React.ReactElement): TestRenderer.ReactTestRenderer {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <ThemeProvider initialMode="light" persistTheme={false}>
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

/** Merges a style array (nested arrays, falsy entries) into one object; later entries win, like React Native. */
function flatten(style: unknown): Record<string, any> {
  return Object.assign({}, ...[style].flat(Infinity).filter(Boolean));
}

const styleOf = (ui: React.ReactElement) => flatten(render(ui).root.findByType(host("Text")).props.style);

describe("PLRNUI-290 CodeInline caller props", () => {
  it("keeps the mono font and border when a caller style is passed, with the caller style applied last", () => {
    const { theme, colors } = themeOf();
    const style = styleOf(<CodeInline style={{ color: "red" }}>x</CodeInline>);
    assert.equal(style.color, "red");
    assert.equal(style.fontFamily, theme.typography.fontFamily.mono);
    assert.equal(style.borderWidth, 1);
    assert.equal(style.borderColor, colors.border);
    assert.equal(style.backgroundColor, colors.surface);
    assert.equal(style.paddingHorizontal, theme.space.sm);
  });

  it("lets the caller style override a computed value", () => {
    const style = styleOf(<CodeInline style={{ borderWidth: 3 }}>x</CodeInline>);
    assert.equal(style.borderWidth, 3);
  });

  it("accepts an array style", () => {
    const { theme } = themeOf();
    const style = styleOf(<CodeInline style={[{ marginTop: 3 }, { marginLeft: 2 }]}>x</CodeInline>);
    assert.equal(style.marginTop, 3);
    assert.equal(style.marginLeft, 2);
    assert.equal(style.fontFamily, theme.typography.fontFamily.mono);
  });

  it("changes fontSize and lineHeight with the size prop", () => {
    const { theme } = themeOf();
    const sm = styleOf(<CodeInline size="sm">x</CodeInline>);
    const lg = styleOf(<CodeInline size="lg">x</CodeInline>);
    assert.equal(sm.fontSize, theme.typography.fontSize.sm);
    assert.equal(lg.fontSize, theme.typography.fontSize.lg);
    assert.equal(lg.lineHeight, theme.typography.fontSize.lg * theme.typography.lineHeight.normal);
    assert.notEqual(sm.lineHeight, lg.lineHeight);
  });

  it("keeps size and the chip styles together with a caller style", () => {
    const { theme } = themeOf();
    const style = styleOf(<CodeInline size="lg" style={{ marginTop: 1 }}>x</CodeInline>);
    assert.equal(style.fontSize, theme.typography.fontSize.lg);
    assert.equal(style.fontFamily, theme.typography.fontFamily.mono);
    assert.equal(style.marginTop, 1);
  });

  it("still forwards other text props", () => {
    const node = render(<CodeInline testID="c" style={{ color: "red" }}>x</CodeInline>).root.findByType(host("Text"));
    assert.equal(node.props.testID, "c");
  });
});
