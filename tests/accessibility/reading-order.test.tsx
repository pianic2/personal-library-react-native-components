import React from "react";
import assert from "node:assert/strict";
import test from "node:test";
import { View } from "react-native";
import TestRenderer, { act } from "react-test-renderer";
import { Card, FormField, Input, Modal, P, ThemeProvider } from "../../src";
import { accessibleTexts, getAccessibleTree, type HostNode } from "../helpers/accessibility-tree";

function render(element: React.ReactElement) {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => { renderer = TestRenderer.create(<ThemeProvider>{element}</ThemeProvider>); });
  return renderer;
}

const node = (type: string, props: Record<string, unknown>, ...children: Array<HostNode | string>): HostNode => ({ type, props, children });

test("getAccessibleTree returns text nodes in tree order and nothing for an empty tree", () => {
  const tree = node("View", {}, node("Text", {}, "One"), node("View", {}, node("Text", {}, "Two")), node("Text", {}, "Three"));
  assert.deepEqual(accessibleTexts(tree), ["One", "Two", "Three"]);
  assert.deepEqual(getAccessibleTree(null), []);
  assert.deepEqual(getAccessibleTree([]), []);
});

test("getAccessibleTree omits hidden subtrees and keeps descendants of importantForAccessibility=no", () => {
  const tree = node(
    "View",
    {},
    node("View", { accessibilityElementsHidden: true }, node("Text", {}, "iOS hidden")),
    node("View", { importantForAccessibility: "no-hide-descendants" }, node("Text", {}, "Android hidden")),
    node("View", { "aria-hidden": true }, node("Text", {}, "aria hidden")),
    node("View", { importantForAccessibility: "no" }, node("Text", {}, "Visible child")),
    node("Text", { importantForAccessibility: "no" }, "Skipped text"),
  );
  assert.deepEqual(accessibleTexts(tree), ["Visible child"]);
});

test("accessible={true} groups its descendants into one element, accessible={false} is transparent", () => {
  const grouped = node("View", { accessible: true, accessibilityRole: "summary" }, node("Text", {}, "Title"), node("Text", {}, "Subtitle"));
  const [element, ...rest] = getAccessibleTree(grouped);
  assert.equal(rest.length, 0);
  assert.equal(element.text, "Title Subtitle");
  assert.equal(element.role, "summary");
  const transparent = node("View", { accessible: false }, node("Text", {}, "Inner"));
  assert.deepEqual(accessibleTexts(transparent), ["Inner"]);
});

test("accessibilityLabel replaces the content text and a nested Text belongs to its outer Text", () => {
  const labelled = node("Pressable", { accessibilityLabel: "Close dialog" }, node("Text", {}, "x"));
  assert.deepEqual(accessibleTexts(labelled), ["Close dialog"]);
  const nested = node("Text", {}, node("Text", {}, "Bold"), " and plain");
  assert.deepEqual(accessibleTexts(nested), ["Bold and plain"]);
  assert.equal(getAccessibleTree(nested).length, 1);
});

test("hidden text inside a grouped element is not announced", () => {
  const tree = node("View", { accessible: true }, node("Text", {}, "Shown"), node("View", { accessibilityElementsHidden: true }, node("Text", {}, "Secret")));
  assert.deepEqual(accessibleTexts(tree), ["Shown"]);
});

test("Card announces its children in order and skips a decorative hidden node", () => {
  const r = render(
    <Card>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><P>Decoration</P></View>
      <P>First</P>
      <P>Second</P>
    </Card>,
  );
  assert.deepEqual(accessibleTexts(r), ["First", "Second"]);
});

test("FormField reads the label, then the control, then the error message", () => {
  const r = render(
    <FormField label="Email" errorText="Required">
      <Input label="Email" value="" onChangeText={() => undefined} />
    </FormField>,
  );
  const tree = getAccessibleTree(r);
  const labelIndex = tree.findIndex((n) => n.type === "Text" && n.text === "Email");
  const inputIndex = tree.findIndex((n) => n.type === "TextInput");
  const errorIndex = tree.findIndex((n) => n.text === "Required");
  assert.ok(labelIndex >= 0 && inputIndex > labelIndex && errorIndex > inputIndex, `unexpected order: ${tree.map((n) => n.text).join(" | ")}`);
  assert.equal(tree[inputIndex].props.accessibilityLabel, "Email");
});

test("FormField announces the label only once", { todo: "FormField renders its label and the wrapped Input renders its own label; owned by the FormField hardening ticket" }, () => {
  const r = render(
    <FormField label="Email">
      <Input label="Email" value="" onChangeText={() => undefined} />
    </FormField>,
  );
  const labels = accessibleTexts(r).filter((text) => text === "Email");
  assert.equal(labels.length, 1);
});

test("Modal exposes its content", () => {
  const r = render(<Modal visible onClose={() => undefined}><P>Dialog body</P></Modal>);
  assert.ok(accessibleTexts(r).some((text) => text.includes("Dialog body")));
});

test("Modal content is its own element, not grouped inside the backdrop Pressable", { todo: "the dialog content sits inside the backdrop Pressable, which is accessible by default, so it is announced as part of the backdrop; owned by the Modal accessibility ticket" }, () => {
  const r = render(<Modal visible onClose={() => undefined}><P>Dialog body</P></Modal>);
  const tree = getAccessibleTree(r);
  assert.ok(tree.some((n) => n.type === "Text" && n.text === "Dialog body"));
});
