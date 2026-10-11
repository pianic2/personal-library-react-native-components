import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";
import { ThemeProvider } from "../../src";
import { LARGE_TEXT_THRESHOLD, useIsLargeText } from "../../src/responsive/useIsLargeText.js";
import { StackOnLargeText } from "../../src/responsive/StackOnLargeText.js";
import { createMockAdapters, renderWithCapabilities, type MockAdapterSet } from "../../src/native/testing/index.js";

const host = (name: string) => name as unknown as React.ElementType;
const flatten = (style: unknown): Record<string, any> => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));

function setup(fontScale: number): MockAdapterSet {
  const mocks = createMockAdapters();
  mocks.setAccessibility({ fontScale });
  return mocks;
}

function renderHook(threshold: number | undefined, fontScale: number) {
  const mocks = setup(fontScale);
  const seen: boolean[] = [];
  function Probe() {
    seen.push(useIsLargeText(threshold));
    return null;
  }
  const renderer = renderWithCapabilities(<Probe />, mocks);
  return { seen, mocks, renderer };
}

function renderStack(fontScale: number, props: Partial<React.ComponentProps<typeof StackOnLargeText>> = {}) {
  const mocks = setup(fontScale);
  const renderer = renderWithCapabilities(
    <ThemeProvider persistTheme={false}>
      <StackOnLargeText {...props}>
        <>{React.createElement("Text", null, "a")}</>
      </StackOnLargeText>
    </ThemeProvider>,
    mocks,
  );
  return { renderer, mocks };
}
const styleOf = (r: TestRenderer.ReactTestRenderer) => flatten(r.root.findAllByType(host("View"))[0]!.props.style);

describe("PLRNUI-223 useIsLargeText", () => {
  it("is false at the default scale and true at a mocked font scale of 2", () => {
    assert.equal(renderHook(undefined, 1).seen.at(-1), false);
    assert.equal(renderHook(undefined, 2).seen.at(-1), true);
  });

  it("uses a default threshold of 1.3 and includes the threshold itself", () => {
    assert.equal(LARGE_TEXT_THRESHOLD, 1.3);
    assert.equal(renderHook(undefined, 1.29).seen.at(-1), false);
    assert.equal(renderHook(undefined, 1.3).seen.at(-1), true);
  });

  it("takes a custom threshold", () => {
    assert.equal(renderHook(1.1, 1.15).seen.at(-1), true);
    assert.equal(renderHook(2, 1.9).seen.at(-1), false);
  });

  it("falls back to the default threshold for a non-positive or non-finite value", () => {
    for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      assert.equal(renderHook(bad, 1.2).seen.at(-1), false, `threshold ${bad} at 1.2`);
      assert.equal(renderHook(bad, 1.4).seen.at(-1), true, `threshold ${bad} at 1.4`);
    }
  });

  it("updates when the system font scale changes", () => {
    const { seen, mocks } = renderHook(undefined, 1);
    assert.equal(seen.at(-1), false);
    act(() => mocks.setAccessibility({ fontScale: 2 }));
    assert.equal(seen.at(-1), true);
    act(() => mocks.setAccessibility({ fontScale: 1 }));
    assert.equal(seen.at(-1), false);
  });
});

describe("PLRNUI-223 StackOnLargeText", () => {
  it("is a row at the default font scale and a column at a large one", () => {
    assert.equal(styleOf(renderStack(1).renderer).flexDirection, "row");
    assert.equal(styleOf(renderStack(2).renderer).flexDirection, "column");
  });

  it("switches direction when the scale changes", () => {
    const { renderer, mocks } = renderStack(1);
    assert.equal(styleOf(renderer).flexDirection, "row");
    act(() => mocks.setAccessibility({ fontScale: 1.5 }));
    assert.equal(styleOf(renderer).flexDirection, "column");
    act(() => mocks.setAccessibility({ fontScale: 1 }));
    assert.equal(styleOf(renderer).flexDirection, "row");
  });

  it("aligns the row as asked and stretches the column", () => {
    assert.equal(styleOf(renderStack(1).renderer).alignItems, "center");
    assert.equal(styleOf(renderStack(1, { align: "flex-start" }).renderer).alignItems, "flex-start");
    assert.equal(styleOf(renderStack(2, { align: "flex-start" }).renderer).alignItems, "stretch");
  });

  it("takes the gap from the theme and a custom threshold", () => {
    assert.equal(styleOf(renderStack(1).renderer).gap, 12, "default md gap");
    assert.equal(styleOf(renderStack(1, { gap: "xs" }).renderer).gap, 4);
    assert.equal(styleOf(renderStack(1.5, { threshold: 2 }).renderer).flexDirection, "row");
    assert.equal(styleOf(renderStack(1.5, { threshold: 1.4 }).renderer).flexDirection, "column");
  });

  it("merges the caller style last and passes view props through", () => {
    const { renderer } = renderStack(1, { style: { padding: 3, gap: 1 }, testID: "stack" });
    const node = renderer.root.findAllByType(host("View"))[0]!;
    assert.equal(node.props.testID, "stack");
    assert.equal(flatten(node.props.style).padding, 3);
    assert.equal(flatten(node.props.style).gap, 1);
  });

  it("renders its children in order", () => {
    const mocks = setup(1);
    const r = renderWithCapabilities(
      <ThemeProvider persistTheme={false}>
        <StackOnLargeText>
          {React.createElement("Text", { key: "1" }, "first")}
          {React.createElement("Text", { key: "2" }, "second")}
        </StackOnLargeText>
      </ThemeProvider>,
      mocks,
    );
    assert.deepEqual(
      r.root.findAllByType(host("Text")).map((t) => t.children[0]),
      ["first", "second"],
    );
  });
});
