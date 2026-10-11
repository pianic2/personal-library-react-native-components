import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import TestRenderer, { act } from "react-test-renderer";
import { ThemeProvider } from "../../src";
import { Container, CONTAINER_WIDTHS } from "../../src/components/Container/index.js";
import { ResponsiveContext } from "../../src/responsive/context.js";
import { breakpoints } from "../../src/tokens/breakpoints.base.js";

const host = (name: string) => name as unknown as React.ElementType;
const root = resolve(import.meta.dirname, "../..");
const flatten = (style: unknown): Record<string, any> => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));

function render(ui: React.ReactElement, width = 1400, mode: "light" | "dark" = "light") {
  const errors: unknown[][] = [];
  const originalError = console.error;
  const originalWarn = console.warn;
  // react-test-renderer itself prints a one-off deprecation notice; everything else counts.
  const record = (...args: unknown[]) => void (String(args[0]).includes("react-test-renderer is deprecated") || errors.push(args));
  console.error = record;
  console.warn = record;
  let renderer!: TestRenderer.ReactTestRenderer;
  try {
    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider initialMode={mode} persistTheme={false}>
          <ResponsiveContext.Provider value={{ breakpoints, window: { width, height: 800 } }}>{ui}</ResponsiveContext.Provider>
        </ThemeProvider>,
      );
    });
  } finally {
    console.error = originalError;
    console.warn = originalWarn;
  }
  assert.deepEqual(errors, [], "no console.error or console.warn");
  return renderer;
}
const rootStyle = (r: TestRenderer.ReactTestRenderer) => flatten(r.root.findAllByType(host("View"))[0]!.props.style);

describe("PLRNUI-177 Container", () => {
  it("exports the named widths as constants", () => {
    assert.deepEqual({ ...CONTAINER_WIDTHS }, { sm: 480, md: 720, lg: 960, xl: 1200 });
  });

  it("caps the content width at the named size (the outer box adds both gutters)", () => {
    for (const [name, width] of Object.entries(CONTAINER_WIDTHS)) {
      const style = rootStyle(render(<Container size={name as keyof typeof CONTAINER_WIDTHS} />, 1500));
      assert.equal(style.maxWidth, width + 2 * style.paddingHorizontal, name);
      assert.equal(style.width, "100%");
    }
    assert.equal(rootStyle(render(<Container />, 1500)).maxWidth, 960 + 2 * 32, "default size is lg");
  });

  it("full has no maximum", () => {
    assert.equal(rootStyle(render(<Container size="full" />)).maxWidth, undefined);
  });

  it("a numeric size caps at that content width and centres: width 1400 gives a 1024 content area with equal margins", () => {
    const style = rootStyle(render(<Container size={1024} />, 1400));
    assert.equal(style.maxWidth - 2 * style.paddingHorizontal, 1024);
    assert.equal(style.alignSelf, "center", "equal margins on both sides");
  });

  it("width 400 uses the full width minus the gutters", () => {
    const style = rootStyle(render(<Container size={1024} />, 400));
    assert.equal(style.width, "100%");
    assert.equal(style.paddingHorizontal, 16);
  });

  it("center can be turned off", () => {
    assert.equal(rootStyle(render(<Container center={false} />)).alignSelf, undefined);
    assert.equal(rootStyle(render(<Container />)).alignSelf, "center");
  });

  it("gutters change at the breakpoints: 16 below md, 24 from md, 32 from lg", () => {
    const at = (width: number) => rootStyle(render(<Container />, width)).paddingHorizontal;
    assert.deepEqual([at(400), at(500), at(768), at(900), at(1024), at(1500)], [16, 16, 24, 24, 32, 32]);
  });

  it("gutter takes a theme.space key or a breakpoint map", () => {
    assert.equal(rootStyle(render(<Container gutter="xs" />, 1500)).paddingHorizontal, 4);
    const map = { base: "sm", lg: "xl" } as const;
    assert.equal(rootStyle(render(<Container gutter={map} />, 400)).paddingHorizontal, 8);
    assert.equal(rootStyle(render(<Container gutter={map} />, 1500)).paddingHorizontal, 30);
  });

  it("measure caps the content inside the gutters", () => {
    const r = render(
      <Container size="full" measure={600}>
        {React.createElement("Text", { testID: "content" }, "x")}
      </Container>,
    );
    const inner = r.root.findAllByType(host("View"))[1]!;
    assert.equal(flatten(inner.props.style).maxWidth, 600);
    assert.equal(r.root.findAllByType(host("View")).length, 2);
    assert.equal(render(<Container size="full" />).root.findAllByType(host("View")).length, 1, "no inner box without measure");
  });

  it("merges the caller style last", () => {
    const style = rootStyle(render(<Container style={{ backgroundColor: "transparent", paddingHorizontal: 1 }} />));
    assert.equal(style.paddingHorizontal, 1);
    assert.equal(style.backgroundColor, "transparent");
  });

  it("adds no accessibility role or props", () => {
    const props = render(<Container />).root.findAllByType(host("View"))[0]!.props;
    assert.equal(props.accessibilityRole, undefined);
    assert.equal(props.accessible, undefined);
  });

  it("renders in light and dark without console output", () => {
    render(<Container />, 1000, "light");
    render(<Container />, 1000, "dark");
  });

  it("uses no hard-coded colours", () => {
    assert.doesNotMatch(readFileSync(resolve(root, "src/components/Container/Container.tsx"), "utf8"), /#[0-9a-fA-F]{3,8}\b|rgba?\(/);
  });
});
