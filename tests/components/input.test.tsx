import React from "react";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";
import { Input, PasswordInput, Textarea, ThemeProvider } from "../../src";

const host = (name: string) => name as unknown as React.ElementType;
type Mode = "light" | "dark";

const globals = globalThis as { __DEV__?: boolean };
const originalDev = globals.__DEV__;
const originalWarn = console.warn;
const originalError = console.error;
afterEach(() => {
  globals.__DEV__ = originalDev;
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

function captureWarnings(): string[] {
  const warnings: string[] = [];
  console.warn = (...args: unknown[]) => void warnings.push(String(args[0]));
  return warnings;
}

const noop = () => undefined;
const fieldOf = (r: TestRenderer.ReactTestRenderer) => r.root.findByType(host("TextInput"));
const textsOf = (r: TestRenderer.ReactTestRenderer) => r.root.findAllByType(host("Text")).map((node) => node.props.children);

describe("PLRNUI-180 Input", () => {
  it("does not pass label to the TextInput, and names the field with it", () => {
    const r = render(<Input label="Email" value="" onChangeText={noop} />);
    const props = fieldOf(r).props;
    assert.equal("label" in props, false);
    assert.equal(props.accessibilityLabel, "Email");
    assert.ok(textsOf(r).includes("Email"));
  });

  it("an explicit accessibilityLabel wins over label for the field name, and other props still reach the TextInput", () => {
    const r = render(<Input label="Email" accessibilityLabel="Work email" testID="email" placeholder="you@example.com" value="" onChangeText={noop} />);
    const props = fieldOf(r).props;
    assert.equal(props.accessibilityLabel, "Work email");
    assert.equal(props.testID, "email");
    assert.equal(props.placeholder, "you@example.com");
  });

  it("renders without label: no label text, and the field still works", () => {
    const r = render(<Input accessibilityLabel="Search" value="" onChangeText={noop} />);
    assert.deepEqual(textsOf(r), []);
    assert.equal(fieldOf(r).props.accessibilityLabel, "Search");
    assert.equal("label" in fieldOf(r).props, false);
  });

  it("warns in dev when there is neither label nor accessibilityLabel, and only then", () => {
    globals.__DEV__ = true;
    const warnings = captureWarnings();
    render(<Input value="" onChangeText={noop} />);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0]!, /\[ui\/Input\] Input rendered without `label` and `accessibilityLabel`/);
    render(<Input label="Email" value="" onChangeText={noop} />);
    render(<Input accessibilityLabel="Search" value="" onChangeText={noop} />);
    assert.equal(warnings.length, 1);
    globals.__DEV__ = false;
    render(<Input value="" onChangeText={noop} />);
    assert.equal(warnings.length, 1, "silent outside dev");
  });

  it("applies containerStyle to a wrapper View that holds the label, the field and the helper text", () => {
    const r = render(<Input label="Email" helperText="Required" containerStyle={{ marginTop: 11 }} value="" onChangeText={noop} />);
    const wrapper = r.root.findAllByType(host("View"))[0]!;
    assert.deepEqual(wrapper.props.style, { marginTop: 11 });
    assert.ok(wrapper.findAllByType(host("TextInput")).length === 1);
    assert.ok(wrapper.findAll((node) => (node.type as unknown) === "Text" && node.props.children === "Email").length === 1);
    assert.ok(wrapper.findAll((node) => (node.type as unknown) === "Text" && node.props.children === "Required").length === 1);
    assert.equal(fieldOf(r).props.accessibilityHint, "Required");
  });

  it("style still goes to the TextInput, not to the wrapper", () => {
    const r = render(<Input label="Email" style={{ letterSpacing: 2 }} containerStyle={{ margin: 3 }} value="" onChangeText={noop} />);
    const flat = Object.assign({}, ...[fieldOf(r).props.style].flat(Infinity).filter(Boolean));
    assert.equal(flat.letterSpacing, 2);
    assert.deepEqual(r.root.findAllByType(host("View"))[0]!.props.style, { margin: 3 });
  });

  it("Textarea and PasswordInput accept no label and keep it away from the TextInput", () => {
    const area = render(<Textarea accessibilityLabel="Notes" value="" onChangeText={noop} />);
    assert.equal(fieldOf(area).props.multiline, true);
    assert.equal("label" in fieldOf(area).props, false);
    const password = render(<PasswordInput accessibilityLabel="Password" value="" onChangeText={noop} />);
    assert.equal(fieldOf(password).props.secureTextEntry, true);
    assert.equal("label" in fieldOf(password).props, false);
    const labelled = render(<PasswordInput label="Password" value="" onChangeText={noop} />);
    assert.equal("label" in fieldOf(labelled).props, false);
    assert.equal(fieldOf(labelled).props.accessibilityLabel, "Password");
  });

  it("renders in light and dark with no console.error or console.warn when labelled", () => {
    globals.__DEV__ = true;
    const calls: unknown[][] = [];
    // react-test-renderer logs its own deprecation notice once per process; that notice is not a component error.
    console.error = (...args: unknown[]) => {
      if (!String(args[0]).includes("react-test-renderer is deprecated")) calls.push(args);
    };
    console.warn = (...args: unknown[]) => void calls.push(args);
    for (const mode of ["light", "dark"] as const) {
      render(<Input label="Email" helperText="Required" error containerStyle={{ margin: 1 }} value="" onChangeText={noop} />, mode);
    }
    assert.deepEqual(calls, []);
  });
});
