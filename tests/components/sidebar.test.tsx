import React from "react";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import TestRenderer, { act } from "react-test-renderer";
import { Platform } from "react-native";

import { NavProvider, SideBar, ThemeProvider } from "../../src";

// The react-native test shim exposes a mutable Platform; tests switch Platform.OS to cover both render paths.
const platform = Platform as { OS: string };
const originalOS = platform.OS;
afterEach(() => {
  platform.OS = originalOS;
});

const host = (name: string) => name as unknown as React.ElementType;
const root = resolve(import.meta.dirname, "../..");

const items = [
  { label: "Home", href: "/" },
  { label: "Settings", href: "/settings", icon: <React.Fragment>icon</React.Fragment> },
];

function render(element: React.ReactElement, pathname = "/settings") {
  let renderer: TestRenderer.ReactTestRenderer | undefined;
  act(() => {
    renderer = TestRenderer.create(
      <ThemeProvider>
        <NavProvider items={items} pathname={pathname} navigate={() => undefined}>
          {element}
        </NavProvider>
      </ThemeProvider>,
    );
  });
  return renderer as TestRenderer.ReactTestRenderer;
}

function flatten(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) return style.reduce<Record<string, unknown>>((merged, item) => ({ ...merged, ...flatten(item) }), {});
  return style && typeof style === "object" ? (style as Record<string, unknown>) : {};
}

function container(renderer: TestRenderer.ReactTestRenderer) {
  return renderer.root.findAllByType(host("View")).find((node) => flatten(node.props.style).borderRightWidth === 1);
}

// Links render Pressables too; the collapse control is the Pressable that shows the "<" / ">" chevron text.
function collapseButtons(renderer: TestRenderer.ReactTestRenderer) {
  return renderer.root
    .findAllByType(host("Pressable"))
    .filter((node) => node.findAllByType(host("Text")).some((text) => text.children.some((child) => child === "<" || child === ">")));
}

function labels(renderer: TestRenderer.ReactTestRenderer) {
  return renderer.root.findAllByType(host("Text")).flatMap((node) => node.children.filter((child): child is string => typeof child === "string"));
}

describe("PLRNUI-299 SideBar is one Platform.OS file", () => {
  it("has no SideBar.web.tsx and no `as any` in the component directory", () => {
    assert.equal(existsSync(resolve(root, "src/components/SideBar/SideBar.web.tsx")), false);
    const source = readFileSync(resolve(root, "src/components/SideBar/SideBar.tsx"), "utf8");
    assert.equal(/\bas any\b/.test(source), false);
  });

  it("defines the shared SideBarItem type exactly once", () => {
    const source = readFileSync(resolve(root, "src/components/SideBar/SideBar.tsx"), "utf8");
    assert.equal((source.match(/(interface|type) SideBarItem\b/g) ?? []).length, 1);
  });

  it("native path: embedded by default, no collapse button, items rendered", () => {
    platform.OS = "ios";
    const renderer = render(<SideBar />);
    const style = flatten(container(renderer)?.props.style);
    assert.equal(style.position, undefined, "native sidebar must not be positioned fixed");
    assert.equal(style.width, 280);
    assert.equal(collapseButtons(renderer).length, 0, "no collapse button on native");
    assert.deepEqual(labels(renderer).filter((label) => label === "Home" || label === "Settings"), ["Home", "Settings"]);
  });

  it("web path: fixed by default with a collapse button that shrinks the bar and hides labels", () => {
    platform.OS = "web";
    const renderer = render(<SideBar />);
    const style = flatten(container(renderer)?.props.style);
    assert.equal(style.position, "fixed");
    assert.equal(style.top, 0);
    assert.equal(style.bottom, 0);
    assert.equal(style.left, 0);
    assert.equal(style.width, 280);
    const buttons = collapseButtons(renderer);
    assert.equal(buttons.length, 1, "web has the collapse button");
    assert.ok(labels(renderer).includes("Home"));
    act(() => buttons[0].props.onPress());
    assert.equal(flatten(container(renderer)?.props.style).width, 72);
    assert.equal(labels(renderer).includes("Home"), false, "labels are hidden when collapsed");
  });

  it("web path: embedded variant is relative and stretches", () => {
    platform.OS = "web";
    const style = flatten(container(render(<SideBar variant="embedded" />))?.props.style);
    assert.equal(style.position, "relative");
    assert.equal(style.alignSelf, "stretch");
  });

  it("native path: an explicit fixed variant stretches and honors width", () => {
    platform.OS = "android";
    const style = flatten(container(render(<SideBar variant="fixed" width={200} />))?.props.style);
    assert.equal(style.alignSelf, "stretch");
    assert.equal(style.width, 200);
  });

  it("marks the active item bold on both paths", () => {
    for (const os of ["ios", "web"]) {
      platform.OS = os;
      const renderer = render(<SideBar />, "/settings");
      const text = (label: string) => renderer.root.findAllByType(host("Text")).find((node) => node.children.includes(label));
      assert.equal(flatten(text("Settings")?.props.style).fontWeight !== flatten(text("Home")?.props.style).fontWeight, true, os);
    }
  });
});
