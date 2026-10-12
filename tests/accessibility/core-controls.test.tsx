import React from "react";
import assert from "node:assert/strict";
import test, { describe, it } from "node:test";
import { Button, Checkbox, Input, RadioGroup, Switch } from "../../src";
import { assertAccessibilityContract } from "../helpers/accessibility";
import { fireEvent, renderWithTheme } from "../helpers/render";

// Ported from react-test-renderer `findByType` / `findByProps` to @testing-library/react-native queries (PLRNUI-106,
// ADR 0018). The assertions on the accessibility contract are unchanged.

test("Button exposes role, name and disabled state", () => {
  const { getByLabelText } = renderWithTheme(<Button label="Save" disabled onPress={() => undefined} />);
  const node = getByLabelText("Save");
  assert.equal(node.type, "Pressable");
  assertAccessibilityContract(node.props, { accessibilityRole: "button", accessibilityLabel: "Save", accessibilityState: { disabled: true } });
});

test("Button can be found by its label and pressed through the testing-library event", () => {
  let pressed = 0;
  const { getByLabelText } = renderWithTheme(<Button label="Save" onPress={() => (pressed += 1)} />);
  fireEvent.press(getByLabelText("Save"));
  assert.equal(pressed, 1);
});

test("Button hands disabled to the pressable (the shim Pressable does not block presses, React Native's does: ADR 0018)", () => {
  const { getByLabelText } = renderWithTheme(<Button label="Save" disabled onPress={() => undefined} />);
  assert.equal(getByLabelText("Save").props.disabled, true);
});

test("Input associates label, helper hint and disabled state", () => {
  const { getByLabelText } = renderWithTheme(<Input label="Email" helperText="Required" editable={false} value="" onChangeText={() => undefined} />);
  const node = getByLabelText("Email");
  assert.equal(node.type, "TextInput");
  assertAccessibilityContract(node.props, { accessibilityLabel: "Email", accessibilityState: { disabled: true } });
  assert.equal(node.props.accessibilityHint, "Required");
});

test("Input reports typed text through the testing-library event", () => {
  const typed: string[] = [];
  const { getByLabelText } = renderWithTheme(<Input label="Email" value="" onChangeText={(text) => typed.push(text)} />);
  fireEvent.changeText(getByLabelText("Email"), "ada@example.com");
  assert.deepEqual(typed, ["ada@example.com"]);
});

test("Checkbox exposes checked semantics", () => {
  const { getByLabelText } = renderWithTheme(<Checkbox label="Accept" checked onChange={() => undefined} />);
  const node = getByLabelText("Accept");
  assert.equal(node.type, "Pressable");
  assertAccessibilityContract(node.props, { accessibilityRole: "checkbox", accessibilityLabel: "Accept", accessibilityState: { checked: true, disabled: false } });
});

test("Switch exposes switch semantics", () => {
  const { getByLabelText } = renderWithTheme(<Switch label="Enabled" value onChange={() => undefined} />);
  const node = getByLabelText("Enabled");
  assert.equal(node.type, "Pressable");
  assertAccessibilityContract(node.props, { accessibilityRole: "switch", accessibilityLabel: "Enabled", accessibilityState: { checked: true, disabled: false } });
});

test("RadioGroup exposes group and selected option semantics", () => {
  const { getByLabelText, getByRole, UNSAFE_getByProps } = renderWithTheme(
    <RadioGroup value="a" onChange={() => undefined} options={[{ label: "A", value: "a" }, { label: "B", value: "b" }]} />,
  );
  assert.ok(UNSAFE_getByProps({ accessibilityRole: "radiogroup" }));
  const selected = getByLabelText("A");
  assertAccessibilityContract(selected.props, { accessibilityRole: "radio", accessibilityLabel: "A", accessibilityState: { selected: true, checked: true } });
  // The Text host element of the option is accessible by default, so a role-less text query still works.
  assert.ok(getByLabelText("B"));
  assert.throws(() => getByRole("radio", { name: "A" }), /Unable to find an element with role/, "the shim Pressable is not an accessible element for RNTL (see ADR 0018)");
});

describe("light and dark ThemeProvider", () => {
  const trees: Record<string, string> = {};
  const checkbox = () => <Checkbox label="Accept" checked onChange={() => undefined} />;

  it("renders the accessible tree in light mode", () => {
    const { getByLabelText, toJSON } = renderWithTheme(checkbox(), { mode: "light" });
    assertAccessibilityContract(getByLabelText("Accept").props, { accessibilityRole: "checkbox", accessibilityLabel: "Accept", accessibilityState: { checked: true, disabled: false } });
    trees.light = JSON.stringify(toJSON());
  });

  it("renders the same accessible tree in dark mode, with different styles (the mode reaches the theme)", () => {
    const { getByLabelText, toJSON } = renderWithTheme(checkbox(), { mode: "dark" });
    assertAccessibilityContract(getByLabelText("Accept").props, { accessibilityRole: "checkbox", accessibilityLabel: "Accept", accessibilityState: { checked: true, disabled: false } });
    assert.ok(trees.light, "the light test ran first");
    assert.notEqual(JSON.stringify(toJSON()), trees.light);
  });
});

// The helper registers afterEach(cleanup): the tree rendered by the first test must be unmounted before the second runs.
describe("automatic cleanup between tests", () => {
  const log: string[] = [];
  function Tracked() {
    React.useEffect(() => () => void log.push("unmounted"), []);
    return null;
  }

  it("renders a tree", () => {
    renderWithTheme(<Tracked />);
    assert.deepEqual(log, []);
  });

  it("finds the previous tree unmounted", () => {
    assert.deepEqual(log, ["unmounted"]);
  });
});
