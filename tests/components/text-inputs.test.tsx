import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import TestRenderer, { act } from "react-test-renderer";
import { LocaleProvider } from "../../src/i18n/index.js";
import { Input, PasswordInput, Textarea, ThemeProvider, type InputProps, type TextareaProps } from "../../src";

const host = (name: string) => name as unknown as React.ElementType;
const root = resolve(import.meta.dirname, "../..");
const noop = () => undefined;
const flatten = (style: unknown): Record<string, any> => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));

function render(ui: React.ReactElement): TestRenderer.ReactTestRenderer {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <ThemeProvider initialMode="light" persistTheme={false}>
        {ui}
      </ThemeProvider>,
    );
  });
  return renderer;
}
const toggleOf = (r: TestRenderer.ReactTestRenderer) => r.root.findByType(host("Pressable"));
const toggleText = (r: TestRenderer.ReactTestRenderer) => toggleOf(r).findByType(host("Text")).props.children;
const fieldProps = (r: TestRenderer.ReactTestRenderer) => r.root.findByType(host("TextInput")).props;
const inputStyle = (r: TestRenderer.ReactTestRenderer) => flatten(fieldProps(r).style);

describe("PLRNUI-197 PasswordInput toggle labels", () => {
  it("takes the labels from the props, for the accessibility label and the visible text", () => {
    const r = render(<PasswordInput label="Pw" showPasswordLabel="Mostra" hidePasswordLabel="Nascondi" value="x" onChangeText={noop} />);
    assert.equal(toggleOf(r).props.accessibilityLabel, "Mostra");
    assert.equal(toggleText(r), "Mostra");
    act(() => toggleOf(r).props.onPress());
    assert.equal(toggleOf(r).props.accessibilityLabel, "Nascondi");
    assert.equal(toggleText(r), "Nascondi");
  });

  it("defaults to the useMessages() catalog and follows LocaleProvider overrides", () => {
    const plain = render(<PasswordInput label="Pw" value="x" onChangeText={noop} />);
    assert.equal(toggleOf(plain).props.accessibilityLabel, "Show password");
    const localized = render(
      <LocaleProvider messages={{ "password.show": "Mostra password", "password.hide": "Nascondi password" }}>
        <PasswordInput label="Pw" value="x" onChangeText={noop} />
      </LocaleProvider>,
    );
    assert.equal(toggleText(localized), "Mostra password");
    act(() => toggleOf(localized).props.onPress());
    assert.equal(toggleText(localized), "Nascondi password");
  });

  it("a prop wins over the message catalog", () => {
    const r = render(
      <LocaleProvider messages={{ "password.show": "Mostra password" }}>
        <PasswordInput label="Pw" showPasswordLabel="Reveal" value="x" onChangeText={noop} />
      </LocaleProvider>,
    );
    assert.equal(toggleOf(r).props.accessibilityLabel, "Reveal");
  });

  it("styles the toggle through the themed Text", () => {
    const r = render(<PasswordInput label="Pw" value="x" onChangeText={noop} />);
    const style = flatten(toggleOf(r).findByType(host("Text")).props.style);
    assert.equal(typeof style.color, "string");
    assert.equal(typeof style.fontSize, "number");
  });

  it("keeps secure entry, uncontrolled and controlled", () => {
    const r = render(<PasswordInput label="Pw" value="x" onChangeText={noop} />);
    assert.equal(fieldProps(r).secureTextEntry, true);
    act(() => toggleOf(r).props.onPress());
    assert.equal(fieldProps(r).secureTextEntry, false);
    const seen: boolean[] = [];
    const c = render(<PasswordInput label="Pw" passwordVisible onPasswordVisibilityChange={(v) => seen.push(v)} value="x" onChangeText={noop} />);
    act(() => toggleOf(c).props.onPress());
    assert.deepEqual(seen, [false]);
    assert.equal(fieldProps(c).secureTextEntry, false);
  });

  it("has no hardcoded Show/Hide literals in the component source", () => {
    const source = readFileSync(resolve(root, "src/components/PasswordInput/PasswordInput.tsx"), "utf8");
    assert.doesNotMatch(source, /['"](Show|Hide)['"]/);
  });
});

describe("PLRNUI-197 Textarea", () => {
  const minHeight = (rows?: number) => inputStyle(render(<Textarea label="M" rows={rows} value="" onChangeText={noop} />)).minHeight as number;

  it("rows sets the minimum height: more rows are taller, and the default is 4 rows", () => {
    const [two, four, eight] = [minHeight(2), minHeight(4), minHeight(8)] as [number, number, number];
    assert.ok(two < four && four < eight, String([two, four, eight]));
    assert.equal(minHeight(undefined), four);
    // rows x fontSize.md (14) x lineHeight.normal (1.3) + 2 x space.md (12)
    assert.equal(eight, Math.ceil(8 * 14 * 1.3 + 24));
  });

  it("clamps rows below 1 and ignores non-finite values", () => {
    assert.equal(minHeight(0), minHeight(1));
    assert.equal(minHeight(Number.NaN), minHeight(4));
  });

  it("a style minHeight still wins; multiline and top alignment stay forced", () => {
    const r = render(<Textarea label="M" rows={8} style={{ minHeight: 200 }} value="" onChangeText={noop} />);
    assert.equal(inputStyle(r).minHeight, 200);
    assert.equal(fieldProps(r).multiline, true);
    assert.equal(fieldProps(r).textAlignVertical, "top");
  });

  it("label and helperText render and name the field exactly as Input does", () => {
    const areaR = render(<Textarea label="Note" helperText="Max 500" error value="" onChangeText={noop} />);
    const inputR = render(<Input label="Note" helperText="Max 500" error value="" onChangeText={noop} />);
    const texts = (r: TestRenderer.ReactTestRenderer) => r.root.findAllByType(host("Text")).map((n) => n.props.children);
    assert.deepEqual(texts(areaR), texts(inputR));
    assert.ok(texts(areaR).includes("Note") && texts(areaR).includes("Max 500"));
    assert.equal(fieldProps(areaR).accessibilityLabel, fieldProps(inputR).accessibilityLabel);
    assert.equal(fieldProps(areaR).accessibilityHint, fieldProps(inputR).accessibilityHint);
    assert.equal(fieldProps(areaR).accessibilityLabel, "Note");
    assert.equal(fieldProps(areaR).accessibilityHint, "Max 500");
  });

  it("type test: Textarea label/helperText mirror Input, multiline stays excluded", () => {
    const label: TextareaProps["label"] = "x" as InputProps["label"];
    const helper: InputProps["helperText"] = "y" as TextareaProps["helperText"];
    const size: TextareaProps["size"] = "md" as InputProps["size"];
    // @ts-expect-error multiline is fixed by Textarea
    const bad: TextareaProps = { multiline: false };
    void [label, helper, size, bad];
    assert.ok(true);
  });
});
