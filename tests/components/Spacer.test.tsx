import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import TestRenderer, { act, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { ThemeProvider } from "../../src";
import { Spacer } from "../../src/components/Spacer/index.js";
import type { SpacerProps } from "../../src/components/Spacer/index.js";
import { defaultTheme } from "../../src/theme/defaultTheme.js";

function mount(element: React.ReactElement, mode: "light" | "dark" = "light"): ReactTestRenderer {
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(<ThemeProvider preference={mode}>{element}</ThemeProvider>);
  });
  return renderer;
}

const flatten = (style: unknown): Record<string, any> => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));
const spacer = (r: ReactTestRenderer): ReactTestInstance => r.root.find((n) => typeof n.type === "string" && n.props.testID === "s");
const styleOf = (r: ReactTestRenderer) => flatten(spacer(r).props.style);

describe("PLRNUI-328 Spacer", () => {
  it("a size token maps to the height on the default vertical axis", () => {
    const space = defaultTheme.space;
    for (const key of ["none", "xs", "sm", "md", "lg", "xl", "xxl"] as const) {
      assert.deepEqual(styleOf(mount(<Spacer size={key} testID="s" />)), { height: space[key] }, key);
    }
  });

  it("the default size is md", () => {
    assert.deepEqual(styleOf(mount(<Spacer testID="s" />)), { height: defaultTheme.space.md });
  });

  it("the horizontal axis sets the width", () => {
    assert.deepEqual(styleOf(mount(<Spacer axis="horizontal" size="lg" testID="s" />)), { width: defaultTheme.space.lg });
  });

  it("a number is used as points on either axis", () => {
    assert.deepEqual(styleOf(mount(<Spacer size={12} testID="s" />)), { height: 12 });
    assert.deepEqual(styleOf(mount(<Spacer size={12} axis="horizontal" testID="s" />)), { width: 12 });
  });

  it("flex fills the free space and ignores size and axis", () => {
    assert.deepEqual(styleOf(mount(<Spacer flex testID="s" />)), { flex: 1 });
    assert.deepEqual(styleOf(mount(<Spacer flex size="xl" axis="horizontal" testID="s" />)), { flex: 1 });
  });

  it("is hidden from assistive technology", () => {
    const props = spacer(mount(<Spacer testID="s" />)).props;
    assert.equal(props.accessibilityElementsHidden, true);
    assert.equal(props.importantForAccessibility, "no-hide-descendants");
  });

  it("renders in light and dark mode with no console.error or console.warn", () => {
    const calls: unknown[][] = [];
    const { error, warn } = console;
    const record = (...args: unknown[]) => void (String(args[0]).includes("react-test-renderer is deprecated") || calls.push(args));
    console.error = record;
    console.warn = record;
    try {
      for (const mode of ["light", "dark"] as const) {
        const r = mount(<Spacer size="md" testID="s" />, mode);
        assert.ok(styleOf(r).height >= 0);
        mount(<Spacer flex testID="s" />, mode);
      }
    } finally {
      console.error = error;
      console.warn = warn;
    }
    assert.deepEqual(calls, []);
  });

  it("uses no hardcoded colour", () => {
    const source = readFileSync(new URL("../../src/components/Spacer/Spacer.tsx", import.meta.url), "utf8");
    assert.equal(/#[0-9a-fA-F]{3,8}\b/.test(source), false);
  });

  it("SpacerProps accepts the documented props", () => {
    const props: SpacerProps = { size: "sm", axis: "horizontal", flex: false, testID: "x" };
    assert.equal(props.size, "sm");
  });
});
