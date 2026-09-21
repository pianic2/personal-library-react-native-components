import React from "react";
import assert from "node:assert/strict";
import test from "node:test";
import TestRenderer, { act } from "react-test-renderer";
import { Button, Checkbox, Input, RadioGroup, Switch, ThemeProvider } from "../../src";
import { assertAccessibilityContract } from "../helpers/accessibility";

function render(element: React.ReactElement) {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => { renderer = TestRenderer.create(<ThemeProvider>{element}</ThemeProvider>); });
  return renderer;
}

test("Button exposes role, name and disabled state", () => {
  const r = render(<Button label="Save" disabled onPress={() => undefined} />);
  const node = r.root.findByType("Pressable");
  assertAccessibilityContract(node.props, { accessibilityRole: "button", accessibilityLabel: "Save", accessibilityState: { disabled: true } });
});

test("Input associates label, helper hint and disabled state", () => {
  const r = render(<Input label="Email" helperText="Required" editable={false} value="" onChangeText={() => undefined} />);
  const node = r.root.findByType("TextInput");
  assertAccessibilityContract(node.props, { accessibilityLabel: "Email", accessibilityState: { disabled: true } });
  assert.equal(node.props.accessibilityHint, "Required");
});

test("Checkbox exposes checked semantics", () => {
  const r = render(<Checkbox label="Accept" checked onChange={() => undefined} />);
  const node = r.root.findByType("Pressable");
  assertAccessibilityContract(node.props, { accessibilityRole: "checkbox", accessibilityLabel: "Accept", accessibilityState: { checked: true, disabled: false } });
});

test("Switch exposes switch semantics", () => {
  const r = render(<Switch label="Enabled" value onChange={() => undefined} />);
  const node = r.root.findByType("Pressable");
  assertAccessibilityContract(node.props, { accessibilityRole: "switch", accessibilityLabel: "Enabled", accessibilityState: { checked: true, disabled: false } });
});

test("RadioGroup exposes group and selected option semantics", () => {
  const r = render(<RadioGroup value="a" onChange={() => undefined} options={[{ label: "A", value: "a" }, { label: "B", value: "b" }]} />);
  assert.ok(r.root.findByProps({ accessibilityRole: "radiogroup" }));
  const selected = r.root.findByProps({ accessibilityLabel: "A" });
  assertAccessibilityContract(selected.props, { accessibilityRole: "radio", accessibilityLabel: "A", accessibilityState: { selected: true, checked: true } });
});
