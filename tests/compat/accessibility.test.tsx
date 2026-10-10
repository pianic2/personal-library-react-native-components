import React from "react";
import test from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";

import { legacy } from "./api.js";
import { assertAccessibilityContract } from "../helpers/accessibility.js";

const { Button, Checkbox, Input, RadioGroup, Switch, ThemeProvider } = legacy;

// Host component names of the react-native test shim are plain strings.
const host = (name: string) => name as unknown as React.ElementType;

function render(element: React.ReactElement) {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(<ThemeProvider>{element}</ThemeProvider>);
  });
  return renderer;
}

test("legacy Button exposes role, name and disabled state", () => {
  const node = render(<Button label="Save" disabled onPress={() => undefined} />).root.findByType(host("Pressable"));
  assertAccessibilityContract(node.props, { accessibilityRole: "button", accessibilityLabel: "Save", accessibilityState: { disabled: true } });
});

test("legacy Input associates label, helper hint and disabled state", () => {
  const node = render(<Input label="Email" helperText="Required" editable={false} value="" onChangeText={() => undefined} />).root.findByType(host("TextInput"));
  assertAccessibilityContract(node.props, { accessibilityLabel: "Email", accessibilityState: { disabled: true } });
  assert.equal(node.props.accessibilityHint, "Required");
});

test("legacy Checkbox and Switch expose checked semantics", () => {
  const checkbox = render(<Checkbox label="Accept" checked onChange={() => undefined} />).root.findByType(host("Pressable"));
  assertAccessibilityContract(checkbox.props, { accessibilityRole: "checkbox", accessibilityLabel: "Accept", accessibilityState: { checked: true, disabled: false } });
  const toggle = render(<Switch label="Enabled" value onChange={() => undefined} />).root.findByType(host("Pressable"));
  assertAccessibilityContract(toggle.props, { accessibilityRole: "switch", accessibilityLabel: "Enabled", accessibilityState: { checked: true, disabled: false } });
});

test("legacy RadioGroup exposes group and selected option semantics", () => {
  const r = render(<RadioGroup value="a" onChange={() => undefined} options={[{ label: "A", value: "a" }, { label: "B", value: "b" }]} />);
  assert.ok(r.root.findByProps({ accessibilityRole: "radiogroup" }));
  assertAccessibilityContract(r.root.findByProps({ accessibilityLabel: "A" }).props, { accessibilityRole: "radio", accessibilityLabel: "A", accessibilityState: { selected: true, checked: true } });
});
