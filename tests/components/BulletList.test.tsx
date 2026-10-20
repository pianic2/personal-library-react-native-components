import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";
import { ThemeProvider } from "../../src";
import { BulletList } from "../../src/components/BulletList/index.js";

const flatten = (style: unknown): Record<string, any> => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));

function render(ui: React.ReactElement, mode: "light" | "dark" = "light") {
  const errors: unknown[][] = [];
  const originalError = console.error;
  const originalWarn = console.warn;
  const record = (...args: unknown[]) => void (String(args[0]).includes("react-test-renderer is deprecated") || errors.push(args));
  console.error = record;
  console.warn = record;
  let renderer!: TestRenderer.ReactTestRenderer;
  try {
    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider initialMode={mode} persistTheme={false}>
          {ui}
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

const texts = (r: TestRenderer.ReactTestRenderer) =>
  r.root.findAll((n) => (n.type as unknown) === "Text").map((n) => [n.props.children].flat().join(""));
const byId = (r: TestRenderer.ReactTestRenderer, id: string) => r.root.find((n) => n.props.testID === id && typeof n.type === "string");
const items = (r: TestRenderer.ReactTestRenderer) => r.root.findAll((n) => n.props.role === "listitem" && typeof n.type === "string");

describe("BulletList", () => {
  it("renders in light and dark mode with list roles and no console output", () => {
    for (const mode of ["light", "dark"] as const) {
      const r = render(
        <BulletList testID="list">
          <BulletList.Item>One</BulletList.Item>
          <BulletList.Item>Two</BulletList.Item>
        </BulletList>,
        mode,
      );
      assert.equal(byId(r, "list").props.role, "list");
      assert.equal(items(r).length, 2);
      assert.deepEqual(texts(r), ["•", "One", "•", "Two"]);
    }
  });

  it("numbers from start", () => {
    const r = render(
      <BulletList type="number" start={3}>
        <BulletList.Item>A</BulletList.Item>
        <BulletList.Item>B</BulletList.Item>
      </BulletList>,
    );
    assert.deepEqual(texts(r), ["3.", "A", "4.", "B"]);
    assert.equal(items(r)[1]!.props.accessibilityLabel, "item 2 of 2: B");
  });

  it("renders check, none and custom markers", () => {
    const check = render(
      <BulletList type="check">
        <BulletList.Item checked>Done</BulletList.Item>
        <BulletList.Item>Todo</BulletList.Item>
      </BulletList>,
    );
    assert.deepEqual(texts(check), ["☑", "Done", "☐", "Todo"]);
    assert.deepEqual(items(check).map((n) => n.props.accessibilityState), [{ checked: true }, { checked: false }]);

    const none = render(
      <BulletList type="none">
        <BulletList.Item>Plain</BulletList.Item>
      </BulletList>,
    );
    assert.deepEqual(texts(none), ["Plain"]);

    const custom = render(
      <BulletList marker="->">
        <BulletList.Item>Go</BulletList.Item>
        <BulletList.Item marker="!">Own</BulletList.Item>
      </BulletList>,
    );
    assert.deepEqual(texts(custom), ["->", "Go", "!", "Own"]);
  });

  it("indents nested lists and caps the depth at three", () => {
    const r = render(
      <BulletList testID="l1">
        <BulletList.Item>
          L1
          <BulletList testID="l2">
            <BulletList.Item>
              L2
              <BulletList testID="l3">
                <BulletList.Item>
                  L3
                  <BulletList testID="l4">
                    <BulletList.Item>L4</BulletList.Item>
                  </BulletList>
                </BulletList.Item>
              </BulletList>
            </BulletList.Item>
          </BulletList>
        </BulletList.Item>
      </BulletList>,
    );
    const pad = (id: string) => flatten(byId(r, id).props.style).paddingLeft;
    assert.equal(pad("l1"), undefined);
    assert.ok(pad("l2") > 0 && pad("l3") > 0 && pad("l4") > 0);
    assert.deepEqual(texts(r).filter((t) => t.length === 1 && !/[A-Z]/.test(t)), ["•", "◦", "▪", "▪"]);
  });

  it("throws when an item is outside a list", () => {
    const original = console.error;
    console.error = () => undefined;
    try {
      assert.throws(() => act(() => void TestRenderer.create(<ThemeProvider persistTheme={false}><BulletList.Item>x</BulletList.Item></ThemeProvider>)));
    } finally {
      console.error = original;
    }
  });
});
