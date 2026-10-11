import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import TestRenderer, { act } from "react-test-renderer";
import { BottomBar, NavBar, NavProvider, ThemeProvider, TopBar } from "../../src";
import { height } from "../../src/tokens/size.base.js";
import { space } from "../../src/tokens/spacing.base.js";

const host = (name: string) => name as unknown as React.ElementType;
const root = resolve(import.meta.dirname, "../..");
const flatten = (style: unknown): Record<string, any> => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));

const items = [
  { label: "Home", href: "/" },
  { label: "Library", href: "/library", icon: "i-lib", activeIcon: "i-lib-active" },
  { label: "Settings", href: "/settings" },
];

function render(element: React.ReactElement, pathname = "/library"): TestRenderer.ReactTestRenderer {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <ThemeProvider persistTheme={false}>
        <NavProvider items={items} pathname={pathname} navigate={() => undefined}>
          {element}
        </NavProvider>
      </ThemeProvider>,
    );
  });
  return renderer;
}

const navigationRoot = (r: TestRenderer.ReactTestRenderer) => r.root.findAll((n) => n.type === host("View") && n.props.role === "navigation")[0];
const pressables = (r: TestRenderer.ReactTestRenderer) => r.root.findAllByType(host("Pressable"));
const rootStyle = (r: TestRenderer.ReactTestRenderer) => flatten(navigationRoot(r)?.props.style);

describe("PLRNUI-219 TopBar", () => {
  it("is a navigation landmark and its title is a header", () => {
    const r = render(<TopBar title="Library" />);
    assert.ok(navigationRoot(r), "role navigation");
    const header = r.root.findAll((n) => n.type === host("Text") && n.props.accessibilityRole === "header");
    assert.equal(header.length, 1);
  });

  it("marks only the active item as selected", () => {
    const r = render(<TopBar />, "/library");
    const states = pressables(r).map((p) => ({ label: p.findAllByType(host("Text"))[0]?.props.children, selected: p.props.accessibilityState.selected }));
    assert.deepEqual(states, [
      { label: "Home", selected: false },
      { label: "Library", selected: true },
      { label: "Settings", selected: false },
    ]);
  });

  it("the selected item follows the pathname", () => {
    const r = render(<TopBar />, "/settings");
    assert.deepEqual(pressables(r).map((p) => p.props.accessibilityState.selected), [false, false, true]);
  });

  it("is absolute by default and static on request", () => {
    assert.equal(rootStyle(render(<TopBar />)).position, "absolute");
    assert.equal(rootStyle(render(<TopBar />)).top, 0);
    const flow = rootStyle(render(<TopBar position="static" />));
    assert.equal(flow.position, undefined);
    assert.equal(flow.top, undefined);
  });

  it("adds the safe-area insets to the padding", () => {
    const plain = rootStyle(render(<TopBar />));
    const inset = rootStyle(render(<TopBar insets={{ top: 44, left: 3, right: 5, bottom: 2 }} />));
    assert.equal(inset.paddingTop, plain.paddingTop + 44);
    assert.equal(inset.paddingLeft, plain.paddingLeft + 3);
    assert.equal(inset.paddingRight, plain.paddingRight + 5);
    assert.equal(inset.paddingBottom, plain.paddingBottom + 2);
  });

  it("takes the row height from the size token", () => {
    const r = render(<TopBar />);
    const row = r.root.findAll((n) => n.type === host("View") && flatten(n.props.style).height === height.md);
    assert.ok(row.length >= 1);
  });

  it("renders a centerSlot instead of the items", () => {
    const r = render(<TopBar centerSlot={React.createElement("Text", { testID: "slot" }, "x")} />);
    assert.equal(pressables(r).length, 0);
  });
});

describe("PLRNUI-219 BottomBar", () => {
  it("is a navigation landmark with a tablist of tabs", () => {
    const r = render(<BottomBar />);
    assert.ok(navigationRoot(r), "role navigation");
    assert.equal(r.root.findAll((n) => n.props.accessibilityRole === "tablist" && n.type === host("View")).length, 1);
    assert.deepEqual(pressables(r).map((p) => p.props.accessibilityRole), ["tab", "tab", "tab"]);
  });

  it("marks only the active item as selected", () => {
    const r = render(<BottomBar />, "/library");
    assert.deepEqual(pressables(r).map((p) => p.props.accessibilityState.selected), [false, true, false]);
  });

  it("shows the active icon for the active item and the icon otherwise", () => {
    const active = render(<BottomBar />, "/library");
    assert.ok(JSON.stringify(active.toJSON()).includes("i-lib-active"));
    const other = render(<BottomBar />, "/");
    assert.ok(JSON.stringify(other.toJSON()).includes("i-lib"));
    assert.ok(!JSON.stringify(other.toJSON()).includes("i-lib-active"));
  });

  it("limits the visible items to maxItems", () => {
    assert.equal(pressables(render(<BottomBar maxItems={2} />)).length, 2);
    assert.equal(pressables(render(<BottomBar maxItems={0} />)).length, 0);
  });

  it("is absolute by default and static on request", () => {
    const abs = rootStyle(render(<BottomBar />));
    assert.equal(abs.position, "absolute");
    assert.equal(abs.bottom, 0);
    const flow = rootStyle(render(<BottomBar position="static" />));
    assert.equal(flow.position, undefined);
    assert.equal(flow.bottom, undefined);
    assert.equal(flow.left, undefined);
  });

  it("the bottom inset grows the padding and the height by the same amount", () => {
    const plain = rootStyle(render(<BottomBar />));
    const inset = rootStyle(render(<BottomBar insets={{ bottom: 34, left: 4, right: 6 }} />));
    assert.equal(inset.paddingBottom, plain.paddingBottom + 34);
    assert.equal(inset.height, plain.height + 34);
    assert.equal(inset.paddingLeft, 4);
    assert.equal(inset.paddingRight, 6);
  });

  it("derives the bar height from tokens (48 + 12 on the default theme)", () => {
    assert.equal(rootStyle(render(<BottomBar />)).height, height.lg + space.md);
  });
});

describe("PLRNUI-219 NavBar through the bars", () => {
  it("passes the selected state through the layout NavBar renders", () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider persistTheme={false}>
          <NavBar items={items} pathname="/settings" navigate={() => undefined} layout="bottom" />
        </ThemeProvider>,
      );
    });
    assert.deepEqual(pressables(renderer).map((p) => p.props.accessibilityState.selected), [false, false, true]);
  });
});

describe("PLRNUI-219 no hard-coded sizes", () => {
  for (const file of ["src/components/TopBar/TopBar.tsx", "src/components/BottomBar/BottomBar.tsx"]) {
    it(`${file} has no 40/60/90 literals`, () => {
      const source = readFileSync(resolve(root, file), "utf8");
      assert.doesNotMatch(source, /\b(40|60|90)\b/);
    });
  }
});
