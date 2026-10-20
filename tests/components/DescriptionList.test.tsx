import React from "react";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import TestRenderer, { act } from "react-test-renderer";
import { Text, ThemeProvider } from "../../src";
import { DescriptionList } from "../../src/components/DescriptionList/index.js";
import type { DescriptionListProps } from "../../src/components/DescriptionList/index.js";

type Mode = "light" | "dark";
const originalError = console.error;
const originalWarn = console.warn;
afterEach(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

function render(ui: React.ReactElement, mode: Mode = "light") {
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
const pairs = (r: TestRenderer.ReactTestRenderer) => r.root.findAll((n) => typeof n.type === "string" && n.props.accessible === true);
const ITEMS = [
  { label: "Name", value: "Ada", testID: "pair-name" },
  { label: "Email", value: "ada@example.com", testID: "pair-email" },
];

describe("PLRNUI-287 DescriptionList", () => {
  it("renders one accessible element per pair that reads label and value together", () => {
    const r = render(<DescriptionList items={ITEMS} />);
    const found = pairs(r);
    assert.equal(found.length, 2);
    assert.equal(found[0]!.props.accessibilityLabel, "Name: Ada");
    assert.equal(found[1]!.props.accessibilityLabel, "Email: ada@example.com");
  });

  it("groups a node value in one accessible element without a text label", () => {
    const r = render(
      <DescriptionList>
        <DescriptionList.Item label="Status" value={<Text>Active</Text>} />
      </DescriptionList>,
    );
    assert.equal(pairs(r).length, 1);
    assert.equal(pairs(r)[0]!.props.accessibilityLabel, undefined);
  });

  it("wraps a long value in the inline layout without overlapping the label", () => {
    const long = "a very long value that has to wrap onto several lines ".repeat(10);
    const r = render(<DescriptionList layout="inline" items={[{ label: "Notes", value: long, testID: "pair" }]} />);
    const item = flatten(pairs(r)[0]!.props.style);
    assert.equal(item.flexDirection, "row");
    const texts = r.root.findAll((n) => (n.type as unknown) === "Text");
    const label = flatten(texts.find((t) => t.props.children === "Notes")!.props.style);
    const value = flatten(texts.find((t) => t.props.children === long)!.props.style);
    assert.equal(label.flexShrink, 0);
    assert.equal(label.maxWidth, "40%");
    assert.equal(value.flex, 1);
    assert.equal(value.flexShrink, 1);
    assert.equal(value.minWidth, 0);
  });

  it("stacks the pairs by default", () => {
    const r = render(<DescriptionList items={ITEMS} />);
    assert.notEqual(flatten(pairs(r)[0]!.props.style).flexDirection, "row");
  });

  it("renders the grid layout with all pairs", () => {
    const r = render(<DescriptionList layout="grid" columns={2} items={ITEMS} />);
    assert.equal(pairs(r).length, 2);
  });

  it("calls the list onCopy with the pair, and the item onCopy first", () => {
    const calls: unknown[] = [];
    const own: string[] = [];
    const r = render(
      <DescriptionList
        onCopy={(label, value) => calls.push([label, value])}
        items={[
          { label: "Name", value: "Ada" },
          { label: "Email", value: "x", onCopy: () => own.push("email"), copyHint: "Copies the email" },
        ]}
      />,
    );
    const found = pairs(r);
    assert.equal(found[0]!.props.accessibilityRole, "button");
    act(() => void found[0]!.props.onPress());
    act(() => void found[1]!.props.onPress());
    assert.deepEqual(calls, [["Name", "Ada"]]);
    assert.deepEqual(own, ["email"]);
    assert.equal(found[1]!.props.accessibilityHint, "Copies the email");
  });

  it("is not pressable without onCopy", () => {
    const r = render(<DescriptionList items={ITEMS} />);
    assert.equal(pairs(r)[0]!.props.accessibilityRole, undefined);
    assert.equal(pairs(r)[0]!.props.onPress, undefined);
  });

  it("throws when an item is rendered outside a list", () => {
    console.error = () => undefined;
    assert.throws(() => render(<DescriptionList.Item label="a" value="b" />), /inside <DescriptionList>/);
  });

  it("renders every layout under light and dark themes without warnings", () => {
    const calls: unknown[][] = [];
    console.error = (...args: unknown[]) => {
      if (!String(args[0]).includes("react-test-renderer is deprecated")) calls.push(args);
    };
    console.warn = (...args: unknown[]) => void calls.push(args);
    const colours: string[] = [];
    for (const mode of ["light", "dark"] as const) {
      for (const layout of ["stacked", "inline", "grid"] as NonNullable<DescriptionListProps["layout"]>[]) {
        const r = render(<DescriptionList layout={layout} items={ITEMS} />, mode);
        const text = r.root.findAll((n) => (n.type as unknown) === "Text" && n.props.children === "Ada")[0]!;
        colours.push(`${mode}:${flatten(text.props.style).color}`);
      }
    }
    assert.deepEqual(calls, []);
    assert.notEqual(colours[0], colours[3]);
  });

  it("has no hardcoded colours or clipboard import in its source", () => {
    const dir = join(import.meta.dirname, "../../src/components/DescriptionList");
    for (const file of readdirSync(dir)) {
      const source = readFileSync(join(dir, file), "utf8");
      assert.doesNotMatch(source, /#[0-9a-fA-F]{3,8}\b/, file);
      assert.doesNotMatch(source, /from ["']expo-/, file);
    }
  });
});
