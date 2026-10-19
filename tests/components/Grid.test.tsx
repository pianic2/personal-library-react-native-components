import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import TestRenderer, { act } from "react-test-renderer";
import { ThemeProvider } from "../../src";
import { Grid } from "../../src/components/Grid/index.js";
import { ResponsiveContext } from "../../src/responsive/context.js";
import { ContainerContext } from "../../src/responsive/useContainerSize.js";
import { breakpoints } from "../../src/tokens/breakpoints.base.js";
import { space } from "../../src/tokens/spacing.base.js";

const host = (name: string) => name as unknown as React.ElementType;
const root = resolve(import.meta.dirname, "../..");
const flatten = (style: unknown): Record<string, any> => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));

function render(ui: React.ReactElement, width = 800, mode: "light" | "dark" = "light", container?: number) {
  const errors: unknown[][] = [];
  const originalError = console.error;
  const originalWarn = console.warn;
  const record = (...args: unknown[]) => void (String(args[0]).includes("react-test-renderer is deprecated") || errors.push(args));
  console.error = record;
  console.warn = record;
  let renderer!: TestRenderer.ReactTestRenderer;
  try {
    act(() => {
      const body = container === undefined ? ui : <ContainerContext.Provider value={{ width: container, height: 600 }}>{ui}</ContainerContext.Provider>;
      renderer = TestRenderer.create(
        <ThemeProvider initialMode={mode} persistTheme={false}>
          <ResponsiveContext.Provider value={{ breakpoints, window: { width, height: 800 } }}>{body}</ResponsiveContext.Provider>
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

/** The cells (direct children of the grid root) as { width %, content width for a grid of `total` px, left, right }. */
function cells(r: TestRenderer.ReactTestRenderer, total = 1000) {
  const views = r.root.findAllByType(host("View"));
  const rootView = views[0]!;
  return rootView.children
    .filter((c): c is TestRenderer.ReactTestInstance => typeof c !== "string")
    .map((cell) => {
      const s = flatten(cell.props.style);
      const pct = parseFloat(s.width);
      return { pct, left: s.paddingLeft as number, right: s.paddingRight as number, content: (pct / 100) * total - s.paddingLeft - s.paddingRight };
    });
}
const items = (n: number) => Array.from({ length: n }, (_, i) => <Grid.Item key={i} />);
const close = (a: number, b: number, msg?: string) => assert.ok(Math.abs(a - b) < 1e-9, `${msg ?? ""} ${a} != ${b}`);

describe("PLRNUI-329 Grid width math", () => {
  for (const n of [2, 3, 4]) {
    it(`${n} columns with a gap: equal content widths, gap between items only`, () => {
      const gap = space.lg;
      const total = 1000;
      const c = cells(render(<Grid columns={n} gap="lg">{items(n)}</Grid>), total);
      const expected = (total - (n - 1) * gap) / n;
      c.forEach((cell, i) => {
        close(cell.pct, 100 / n, "percentage");
        close(cell.content, expected, `content ${i}`);
        // Item i starts at i * (content + gap): the space before it is its left padding plus the preceding cells.
        close(i * (total / n) + cell.left, i * (expected + gap), `start ${i}`);
      });
      // The gap between neighbours is exactly `gap`, and nothing is added at the outer edges.
      for (let i = 1; i < n; i += 1) close(c[i - 1]!.right + c[i]!.left, gap, `gap ${i}`);
      assert.equal(c[0]!.left, 0);
      assert.equal(c[n - 1]!.right, 0);
    });
  }

  it("without a gap the cells have no padding", () => {
    for (const cell of cells(render(<Grid columns={3}>{items(3)}</Grid>))) assert.deepEqual([cell.left, cell.right], [0, 0]);
  });

  it("the grid is a left-aligned wrapping row, so a remainder row is left-aligned", () => {
    const r = render(<Grid columns={3} gap="md">{items(4)}</Grid>);
    const style = flatten(r.root.findAllByType(host("View"))[0]!.props.style);
    assert.equal(style.flexDirection, "row");
    assert.equal(style.flexWrap, "wrap");
    assert.equal(style.justifyContent, "flex-start");
    assert.equal(style.rowGap, space.md);
    const c = cells(r);
    // The fourth item starts a new row at column 0: same padding as the first.
    assert.deepEqual([c[3]!.left, c[3]!.right], [c[0]!.left, c[0]!.right]);
  });

  it("rowGap and columnGap override gap per axis", () => {
    const r = render(<Grid columns={2} gap="xs" rowGap="xl" columnGap="lg">{items(2)}</Grid>);
    assert.equal(flatten(r.root.findAllByType(host("View"))[0]!.props.style).rowGap, space.xl);
    const c = cells(r);
    close(c[0]!.right + c[1]!.left, space.lg);
  });

  it("preserves children order and adds no role", () => {
    const r = render(
      <Grid columns={2}>
        <Grid.Item testID="a" />
        <Grid.Item testID="b" />
        <Grid.Item testID="c" />
      </Grid>,
    );
    assert.deepEqual(r.root.findAll((n) => typeof n.props.testID === "string" && n.type === host("View")).map((n) => n.props.testID), ["a", "b", "c"]);
    for (const v of r.root.findAllByType(host("View"))) {
      assert.equal(v.props.role, undefined);
      assert.equal(v.props.accessibilityRole, undefined);
    }
  });
});

describe("PLRNUI-329 Grid responsive columns", () => {
  const map = { base: 1, md: 2, lg: 4 };
  const countAt = (width: number) => Math.round(100 / cells(render(<Grid columns={map}>{items(4)}</Grid>, width))[0]!.pct);

  it("follows the map at 400, 800 and 1100 px", () => {
    assert.equal(countAt(400), 1);
    assert.equal(countAt(800), 2);
    assert.equal(countAt(1100), 4);
  });

  it("a span map is resolved by breakpoint too", () => {
    const at = (w: number) => cells(render(<Grid columns={4}><Grid.Item span={{ base: 4, lg: 2 }} /></Grid>, w))[0]!.pct;
    assert.equal(at(400), 100);
    assert.equal(at(1100), 50);
  });
});

describe("PLRNUI-329 Grid span", () => {
  it("a span widens the cell and keeps the content width of the spanned columns plus gaps", () => {
    const gap = space.md;
    const total = 1000;
    const c = cells(render(<Grid columns={4} gap="md"><Grid.Item span={2} /><Grid.Item /><Grid.Item /></Grid>), total);
    const w = (total - 3 * gap) / 4;
    close(c[0]!.pct, 50);
    close(c[0]!.content, 2 * w + gap);
    close(c[1]!.content, w);
    close(c[2]!.content, w);
  });

  it("clamps a span to the number of columns and to at least 1", () => {
    const c = cells(render(<Grid columns={3}><Grid.Item span={9} /><Grid.Item span={0} /></Grid>));
    assert.equal(c[0]!.pct, 100);
    close(c[1]!.pct, 100 / 3);
  });

  it("an item that does not fit the rest of the row starts the next row", () => {
    const c = cells(render(<Grid columns={3} gap="md"><Grid.Item /><Grid.Item span={3} /><Grid.Item /></Grid>));
    assert.deepEqual([c[1]!.left, c[1]!.right], [0, 0]);
    assert.equal(c[2]!.left, 0);
  });
});

describe("PLRNUI-329 Grid minItemWidth", () => {
  const count = (container: number, props: Record<string, unknown> = {}) =>
    Math.round(100 / cells(render(<Grid minItemWidth={160} {...props}>{items(6)}</Grid>, 1400, "light", container))[0]!.pct);

  it("160 in a 500 px container gives 3 columns", () => {
    assert.equal(count(500), 3);
  });

  it("the gap counts towards the fit, and columns caps the count", () => {
    assert.equal(count(500, { gap: "xxl" }), 2); // floor((500 + 80) / (160 + 80)) = 2
    assert.equal(count(500, { columns: 2 }), 2);
    assert.equal(count(500, { columns: 8 }), 3);
  });
});

describe("PLRNUI-329 Grid contract", () => {
  it("uses the window width outside a Container", () => {
    const r = render(<Grid minItemWidth={160}>{items(6)}</Grid>, 500);
    assert.equal(Math.round(100 / cells(r)[0]!.pct), 3);
  });

  it("renders in light and dark mode identically (layout only)", () => {
    const light = render(<Grid columns={2} gap="md">{items(3)}</Grid>, 800, "light");
    const dark = render(<Grid columns={2} gap="md">{items(3)}</Grid>, 800, "dark");
    assert.deepEqual(cells(light), cells(dark));
  });

  it("has no hardcoded colours and no use of CSS grid", () => {
    const src = readFileSync(resolve(root, "src/components/Grid/Grid.tsx"), "utf8");
    assert.equal(/#[0-9a-fA-F]{3,8}\b/.test(src), false);
    assert.equal(/display:\s*["']grid/.test(src), false);
  });
});
