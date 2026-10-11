import React from "react";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import TestRenderer, { act } from "react-test-renderer";
import { Platform } from "react-native";
import { Link, NavProvider, ThemeProvider } from "../../src";

const host = (name: string) => name as unknown as React.ElementType;
type Mode = "light" | "dark";

const platform = Platform as { OS: string };
const originalOS = platform.OS;
const originalWarn = console.warn;
const originalError = console.error;
afterEach(() => {
  platform.OS = originalOS;
  console.warn = originalWarn;
  console.error = originalError;
});

function render(ui: React.ReactElement, mode: Mode = "light"): TestRenderer.ReactTestRenderer {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <ThemeProvider initialMode={mode} persistTheme={false}>
        {ui}
      </ThemeProvider>,
    );
  });
  return renderer;
}

const flatten = (style: unknown): Record<string, any> => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));
const pressableOf = (r: TestRenderer.ReactTestRenderer) => r.root.findByType(host("Pressable"));
const styleOf = (node: TestRenderer.ReactTestInstance, state = { pressed: false }) => flatten((node.props.style as (s: { pressed: boolean }) => unknown)(state));

describe("PLRNUI-216 Link accessibility", () => {
  it("has accessibilityRole link and passes accessibilityLabel through", () => {
    const plain = pressableOf(render(<Link href="/a">Docs</Link>));
    assert.equal(plain.props.accessibilityRole, "link");
    assert.equal(plain.props.accessibilityLabel, undefined);
    const labelled = pressableOf(render(<Link href="/a" accessibilityLabel="Open the docs">Docs</Link>));
    assert.equal(labelled.props.accessibilityLabel, "Open the docs");
  });

  it("disabled blocks onPress and every navigation path", () => {
    let pressed = 0;
    const navigated: string[] = [];
    const adapter = { navigate: (href: string) => void navigated.push(`adapter:${href}`) };
    const viaAdapter = pressableOf(render(<Link href="/a" disabled onPress={() => void (pressed += 1)} routerAdapter={adapter}>A</Link>));
    act(() => viaAdapter.props.onPress());
    const viaNav = pressableOf(
      render(
        <NavProvider items={[{ label: "A", href: "/a" }]} pathname="/" navigate={(href: string) => void navigated.push(`nav:${href}`)}>
          <Link href="/a" disabled>A</Link>
        </NavProvider>,
      ),
    );
    act(() => viaNav.props.onPress());
    assert.equal(pressed, 0);
    assert.deepEqual(navigated, []);
    assert.equal(viaAdapter.props.disabled, true);
  });

  it("disabled sets accessibilityState.disabled; enabled reports false", () => {
    assert.deepEqual(pressableOf(render(<Link href="/a" disabled>A</Link>)).props.accessibilityState, { disabled: true });
    assert.deepEqual(pressableOf(render(<Link href="/a">A</Link>)).props.accessibilityState, { disabled: false });
  });

  it("an enabled link still calls onPress and then navigates", () => {
    const order: string[] = [];
    const node = pressableOf(render(<Link href="/a" onPress={() => void order.push("press")} routerAdapter={{ navigate: (href) => void order.push(`go:${href}`) }}>A</Link>));
    act(() => node.props.onPress());
    assert.deepEqual(order, ["press", "go:/a"]);
  });
});

describe("PLRNUI-216 Link web href", () => {
  it("renders the href on web, with new-tab attributes for external links only", () => {
    platform.OS = "web";
    const internal = pressableOf(render(<Link href="/docs">Docs</Link>));
    assert.equal(internal.props.href, "/docs");
    assert.equal(internal.props.hrefAttrs, undefined);
    const external = pressableOf(render(<Link href="https://example.com">Out</Link>));
    assert.equal(external.props.href, "https://example.com");
    assert.deepEqual(external.props.hrefAttrs, { target: "_blank", rel: "noopener noreferrer" });
  });

  it("a disabled link renders no href on web, so the anchor cannot navigate", () => {
    platform.OS = "web";
    const disabled = pressableOf(render(<Link href="/docs" disabled>Docs</Link>));
    assert.equal("href" in disabled.props, false);
    assert.equal("hrefAttrs" in disabled.props, false);
    assert.equal(disabled.props.disabled, true);
    const external = pressableOf(render(<Link href="https://example.com" disabled>Out</Link>));
    assert.equal("href" in external.props, false);
  });

  it("a modified web click (ctrl, cmd, shift, alt, middle button) is left to the browser: no preventDefault, no navigation, onPress still called", () => {
    platform.OS = "web";
    const events: Array<Record<string, unknown>> = [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }];
    for (const modifiers of events) {
      let prevented = 0;
      let pressed = 0;
      const navigated: string[] = [];
      const node = pressableOf(
        render(
          <Link href="/docs" onPress={() => void (pressed += 1)} routerAdapter={{ navigate: (href) => void navigated.push(href) }}>
            Docs
          </Link>,
        ),
      );
      act(() => node.props.onPress({ ...modifiers, preventDefault: () => void (prevented += 1) }));
      assert.equal(prevented, 0, JSON.stringify(modifiers));
      assert.deepEqual(navigated, [], JSON.stringify(modifiers));
      assert.equal(pressed, 1, JSON.stringify(modifiers));
    }
    // a plain primary-button click is still handled by the Link
    const navigated: string[] = [];
    const plain = pressableOf(render(<Link href="/docs" routerAdapter={{ navigate: (href) => void navigated.push(href) }}>Docs</Link>));
    act(() => plain.props.onPress({ button: 0, ctrlKey: false, preventDefault: () => undefined }));
    assert.deepEqual(navigated, ["/docs"]);
  });

  it("does not render an href natively, and a web click prevents the anchor default before navigating", () => {
    const native = pressableOf(render(<Link href="/docs">Docs</Link>));
    assert.equal("href" in native.props, false);
    platform.OS = "web";
    let prevented = 0;
    const order: string[] = [];
    const web = pressableOf(render(<Link href="/docs" routerAdapter={{ navigate: () => void order.push("go") }}>Docs</Link>));
    act(() => web.props.onPress({ preventDefault: () => void (prevented += 1) }));
    assert.equal(prevented, 1);
    assert.deepEqual(order, ["go"]);
    act(() => web.props.onPress());
    assert.deepEqual(order, ["go", "go"], "a press without an event object still works");
  });
});

describe("PLRNUI-216 Link styling", () => {
  it("dims the link when disabled and on press, for both variants, from named constants", () => {
    const text = pressableOf(render(<Link href="/a">A</Link>));
    assert.equal(styleOf(text).opacity, undefined);
    assert.equal(styleOf(text, { pressed: true }).opacity, 0.7);
    const disabledText = pressableOf(render(<Link href="/a" disabled>A</Link>));
    assert.equal(styleOf(disabledText).opacity, 0.5);
    assert.equal(styleOf(disabledText, { pressed: true }).opacity, 0.5);
    const button = pressableOf(render(<Link href="/a" variant="button">A</Link>));
    assert.equal(styleOf(button).opacity, 1);
    assert.equal(styleOf(button, { pressed: true }).opacity, 0.85);
    assert.equal(styleOf(pressableOf(render(<Link href="/a" variant="button" disabled>A</Link>))).opacity, 0.5);
  });

  it("button heights follow the size", () => {
    for (const [size, height] of [["sm", 32], ["md", 40], ["lg", 48]] as const) {
      assert.equal(styleOf(pressableOf(render(<Link href="/a" variant="button" size={size}>A</Link>))).minHeight, height, size);
    }
  });

  it("Link.tsx has no numeric opacity literal", () => {
    const source = readFileSync(resolve(import.meta.dirname, "../../src/components/Link/Link.tsx"), "utf8");
    const lines = source.split("\n").filter((line) => /opacity/i.test(line) && /\d/.test(line.replace(/^\s*\/\/.*$/, "")));
    assert.deepEqual(lines.filter((line) => !line.trim().startsWith("//")), []);
  });

  it("renders in light and dark with no console.error or console.warn", () => {
    const calls: unknown[][] = [];
    // react-test-renderer logs its own deprecation notice once per process; that notice is not a component error.
    console.error = (...args: unknown[]) => {
      if (!String(args[0]).includes("react-test-renderer is deprecated")) calls.push(args);
    };
    console.warn = (...args: unknown[]) => void calls.push(args);
    for (const mode of ["light", "dark"] as const) {
      render(<Link href="/a" disabled variant="button" size="lg" accessibilityLabel="Go">A</Link>, mode);
      render(<Link href="https://example.com" underline>Out</Link>, mode);
    }
    assert.deepEqual(calls, []);
  });
});
