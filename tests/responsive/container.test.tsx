import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";
import { Container } from "../../src/components/Container/index.js";
import { ResponsiveContext } from "../../src/responsive/context.js";
import { useContainerBreakpoint, useContainerSize } from "../../src/responsive/useContainerSize.js";
import { breakpoints } from "../../src/tokens/breakpoints.base.js";
import { ThemeProvider } from "../../src";

const host = (name: string) => name as unknown as React.ElementType;

function windowOf(width: number, height = 800) {
  return { breakpoints, window: { width, height } };
}

function render(ui: React.ReactElement, window = windowOf(1000)): TestRenderer.ReactTestRenderer {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <ThemeProvider persistTheme={false}>
        <ResponsiveContext.Provider value={window}>{ui}</ResponsiveContext.Provider>
      </ThemeProvider>,
    );
  });
  return renderer;
}

const layout = (r: TestRenderer.ReactTestRenderer, width: number, height = 100) =>
  act(() => {
    (r.root.findAllByType(host("View"))[0]!.props.onLayout as (e: unknown) => void)({ nativeEvent: { layout: { x: 0, y: 0, width, height } } });
  });

function Probe({ onRender }: { onRender: (size: ReturnType<typeof useContainerSize>, bp: string) => void }) {
  onRender(useContainerSize(), useContainerBreakpoint());
  return null;
}

describe("PLRNUI-177 container size context", () => {
  it("falls back to the window size outside a Container", () => {
    const seen: Array<ReturnType<typeof useContainerSize>> = [];
    render(<Probe onRender={(s) => seen.push(s)} />, windowOf(700, 500));
    assert.deepEqual(seen.at(-1), { width: 700, height: 500, source: "window" });
  });

  it("starts from the window width (capped by the maximum) before the first layout", () => {
    const seen: Array<ReturnType<typeof useContainerSize>> = [];
    render(
      <Container size="sm">
        <Probe onRender={(s) => seen.push(s)} />
      </Container>,
      windowOf(1000),
    );
    // a 1000 wide window is the md breakpoint (lg starts at 1024), so the gutter is 24: 480 content + 2 x 24
    assert.equal(seen[0]!.source, "container");
    assert.equal(seen[0]!.width, 480 + 2 * 24);
    const narrow: Array<ReturnType<typeof useContainerSize>> = [];
    render(
      <Container size="xl">
        <Probe onRender={(s) => narrow.push(s)} />
      </Container>,
      windowOf(400),
    );
    assert.equal(narrow[0]!.width, 400, "never wider than the window");
  });

  it("onLayout updates the context and consumers re-render", () => {
    const seen: Array<ReturnType<typeof useContainerSize>> = [];
    const r = render(
      <Container size="full">
        <Probe onRender={(s) => seen.push(s)} />
      </Container>,
    );
    const before = seen.length;
    layout(r, 640, 300);
    assert.ok(seen.length > before, "the consumer rendered again");
    assert.deepEqual(seen.at(-1), { width: 640, height: 300, source: "container" });
  });

  it("a change smaller than 1px does not re-render the consumers", () => {
    const seen: Array<ReturnType<typeof useContainerSize>> = [];
    const r = render(
      <Container size="full">
        <Probe onRender={(s) => seen.push(s)} />
      </Container>,
    );
    layout(r, 640, 300);
    const count = seen.length;
    layout(r, 640.4, 300.4);
    layout(r, 639.7, 300);
    assert.equal(seen.length, count, "sub-pixel changes are ignored");
    layout(r, 641.1, 300);
    assert.ok(seen.length > count, "a change of 1px or more is applied");
    assert.equal(seen.at(-1)!.width, 641.1);
  });

  it("nested Containers use the nearest one", () => {
    const seen: Array<ReturnType<typeof useContainerSize>> = [];
    let outer!: TestRenderer.ReactTestRenderer;
    outer = render(
      <Container size="full">
        <Container size="full">
          <Probe onRender={(s) => seen.push(s)} />
        </Container>
      </Container>,
    );
    const views = outer.root.findAllByType(host("View"));
    act(() => {
      (views[0]!.props.onLayout as (e: unknown) => void)({ nativeEvent: { layout: { x: 0, y: 0, width: 900, height: 10 } } });
    });
    act(() => {
      (views[1]!.props.onLayout as (e: unknown) => void)({ nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 20 } } });
    });
    assert.deepEqual(seen.at(-1), { width: 300, height: 20, source: "container" });
  });

  it("useContainerBreakpoint follows the container width with the default scale and with a custom map", () => {
    const seen: string[] = [];
    const custom: string[] = [];
    function CustomProbe() {
      custom.push(useContainerBreakpoint({ sm: 100, md: 200, lg: 300, xl: 400 }));
      return null;
    }
    const r = render(
      <Container size="full">
        <Probe onRender={(_s, bp) => seen.push(bp)} />
        <CustomProbe />
      </Container>,
    );
    layout(r, 500);
    assert.equal(seen.at(-1), "sm", "500 is >= sm (480) and < md (768)");
    assert.equal(custom.at(-1), "xl", "500 is >= the custom xl (400)");
    layout(r, 800);
    assert.equal(seen.at(-1), "md");
    layout(r, 300);
    assert.equal(seen.at(-1), "base");
  });

  it("outside a Container the breakpoint comes from the window width", () => {
    const seen: string[] = [];
    render(<Probe onRender={(_s, bp) => seen.push(bp)} />, windowOf(1100));
    assert.equal(seen.at(-1), "lg");
  });
});
