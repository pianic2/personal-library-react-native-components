import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";
import { ThemeProvider } from "../../src";
import { Container } from "../../src/components/Container/index.js";
import { ResponsiveContext } from "../../src/responsive/context.js";
import { resolvePrimaryWidth, SplitView, SPLIT_VIEW_DEFAULTS, type SplitViewProps } from "../../src/responsive/SplitView.js";
import { breakpoints } from "../../src/tokens/breakpoints.base.js";
import { lightColors, darkColors } from "../../src/tokens/colors.base.js";

const host = (name: string) => name as unknown as React.ElementType;
const flatten = (style: unknown): Record<string, any> => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));

const Primary = () => React.createElement(host("Text"), { testID: "primary" }, "list");
const Secondary = () => React.createElement(host("Text"), { testID: "secondary" }, "detail");

function render(props: Partial<SplitViewProps>, width: number, mode: "light" | "dark" = "light", wrap: (el: React.ReactElement) => React.ReactElement = (el) => el) {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <ThemeProvider initialMode={mode} persistTheme={false}>
        <ResponsiveContext.Provider value={{ breakpoints, window: { width, height: 800 } }}>
          {wrap(<SplitView primary={<Primary />} secondary={<Secondary />} {...props} />)}
        </ResponsiveContext.Provider>
      </ThemeProvider>,
    );
  });
  return renderer;
}

const has = (r: TestRenderer.ReactTestRenderer, id: string) => r.root.findAll((n) => n.props?.testID === id).length > 0;
const regions = (r: TestRenderer.ReactTestRenderer) => r.root.findAll((n) => n.type === host("View") && n.props.role === "region");

describe("PLRNUI-188 SplitView", () => {
  it("renders both panes side by side at width 1024", () => {
    const r = render({}, 1024);
    assert.ok(has(r, "primary") && has(r, "secondary"));
    assert.equal(flatten(r.root.findAllByType(host("View"))[0]!.props.style).flexDirection, "row");
  });

  it("at width 400 renders only the primary pane, or only the secondary when showSecondary is set", () => {
    const a = render({}, 400);
    assert.ok(has(a, "primary") && !has(a, "secondary"));
    const b = render({ showSecondary: true }, 400);
    assert.ok(!has(b, "primary") && has(b, "secondary"));
  });

  it("showSecondary has no effect when both panes fit", () => {
    const r = render({ showSecondary: true }, 1024);
    assert.ok(has(r, "primary") && has(r, "secondary"));
  });

  it("primary comes before secondary, and each pane is a region", () => {
    const r = render({}, 1024);
    const [first, second] = regions(r);
    assert.equal(regions(r).length, 2);
    assert.ok(first!.findAll((n) => n.props?.testID === "primary").length > 0);
    assert.ok(second!.findAll((n) => n.props?.testID === "secondary").length > 0);
  });

  it("pane widths respect the min and max clamp", () => {
    const widthOf = (r: TestRenderer.ReactTestRenderer) => flatten(regions(r)[0]!.props.style).width;
    assert.equal(widthOf(render({}, 1024)), 1024 * SPLIT_VIEW_DEFAULTS.ratio);
    assert.equal(widthOf(render({ ratio: 0.9 }, 1024)), 420);
    assert.equal(widthOf(render({ ratio: 0.1 }, 1024)), 320);
    assert.equal(widthOf(render({ ratio: 0.5, minPrimary: 100, maxPrimary: 300 }, 1024)), 300);
    assert.equal(widthOf(render({ ratio: 0.1, minPrimary: 250, maxPrimary: 300 }, 1024)), 250);
  });

  it("resolvePrimaryWidth: invalid values fall back, max below min is raised, never wider than the width", () => {
    assert.equal(resolvePrimaryWidth(1000, Number.NaN, -5, 0), 350);
    assert.equal(resolvePrimaryWidth(1000, 0.5, 400, 300), 400);
    assert.equal(resolvePrimaryWidth(300, 0.5, 320, 420), 300);
    assert.equal(resolvePrimaryWidth(1000, 7, undefined, 5000), 1000);
  });

  it("the divider is the border colour in light and in dark", () => {
    for (const [mode, palette] of [["light", lightColors], ["dark", darkColors]] as const) {
      const r = render({}, 1024, mode);
      const divider = r.root.findAll((n) => n.type === host("View") && flatten(n.props.style).backgroundColor !== undefined);
      assert.equal(divider.length, 1);
      assert.equal(flatten(divider[0]!.props.style).backgroundColor, palette.border);
    }
  });

  it("the divider is hidden from assistive technology", () => {
    const r = render({}, 1024);
    const divider = r.root.findAll((n) => n.type === host("View") && n.props.accessibilityElementsHidden === true);
    assert.equal(divider.length, 1);
  });

  it("a back button shows only for the secondary pane at compact width and calls onBack", () => {
    let backs = 0;
    const withBack = render({ showSecondary: true, onBack: () => (backs += 1) }, 400);
    const button = withBack.root.findAll((n) => n.props?.accessibilityRole === "button");
    assert.equal(button.length > 0, true);
    assert.equal(button[0]!.props.accessibilityLabel, "Back");
    act(() => button[0]!.props.onPress());
    assert.equal(backs, 1);
    for (const props of [{ onBack: () => {} }, { showSecondary: true }] as Partial<SplitViewProps>[]) {
      assert.equal(render(props, 400).root.findAll((n) => n.props?.accessibilityRole === "button").length, 0);
    }
    assert.equal(render({ showSecondary: true, onBack: () => {} }, 1024).root.findAll((n) => n.props?.accessibilityRole === "button").length, 0);
    assert.equal(render({ showSecondary: true, onBack: () => {}, backLabel: "Indietro" }, 400).root.findAll((n) => n.props?.accessibilityRole === "button")[0]!.props.accessibilityLabel, "Indietro");
  });

  it("follows the Container width instead of the window width", () => {
    // wide window, narrow Container: compact, so only the primary pane
    const r = render({}, 1400, "light", (el) => <Container size={400}>{el}</Container>);
    assert.ok(has(r, "primary") && !has(r, "secondary"));
  });

  it("follows a custom size-class threshold from the ResponsiveContext", () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider persistTheme={false}>
          <ResponsiveContext.Provider value={{ breakpoints, window: { width: 700, height: 800 }, sizeClassThresholds: { width: { medium: 800, expanded: 1000 } } }}>
            <SplitView primary={<Primary />} secondary={<Secondary />} />
          </ResponsiveContext.Provider>
        </ThemeProvider>,
      );
    });
    assert.ok(has(renderer, "primary") && !has(renderer, "secondary"));
  });
});
