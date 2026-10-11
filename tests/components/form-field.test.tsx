import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import TestRenderer, { act } from "react-test-renderer";
import { FormField, Input, ThemeProvider, type FormFieldProps } from "../../src";

const host = (name: string) => name as unknown as React.ElementType;
const root = resolve(import.meta.dirname, "../..");
const flatten = (style: unknown): Record<string, any> => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));
const noop = () => undefined;

function render(ui: React.ReactElement, mode: "light" | "dark" = "light") {
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
const texts = (r: TestRenderer.ReactTestRenderer) => r.root.findAllByType(host("Text"));
const textOf = (n: TestRenderer.ReactTestInstance): string => n.children.map((c) => (typeof c === "string" ? c : textOf(c))).join("");
const hasText = (r: TestRenderer.ReactTestRenderer, value: string) => texts(r).some((t) => textOf(t) === value);
const inputNode = (r: TestRenderer.ReactTestRenderer) => r.root.findByType(host("TextInput"));
const inputElement = (r: TestRenderer.ReactTestRenderer) => r.root.findByType(Input);

/** A custom control that opts into every forwarded prop. */
function Probe(props: Record<string, unknown>) {
  return React.createElement("View", { testID: "probe", ...props });
}
const probeProps = (r: TestRenderer.ReactTestRenderer) => r.root.findByType(Probe).props as Record<string, unknown>;

describe("PLRNUI-186 FormField", () => {
  it("has no string-concatenated colour (the old textPrimary + '99' hack)", () => {
    const source = readFileSync(resolve(root, "src/components/FormField/FormField.tsx"), "utf8");
    assert.doesNotMatch(source, /\+\s*["']99["']/);
    assert.doesNotMatch(source, /marginBottom:\s*\d|marginTop:\s*\d/);
  });

  it("errorText sets error on the child Input and shows the error text", () => {
    const r = render(
      <FormField label="Email" errorText="Required">
        <Input value="" onChangeText={noop} accessibilityLabel="Email" />
      </FormField>,
    );
    assert.equal(inputElement(r).props.error, true);
    assert.ok(hasText(r, "Required"));
  });

  it("status error alone sets error on the child without an error message", () => {
    const r = render(
      <FormField status="error">
        <Input value="" onChangeText={noop} accessibilityLabel="Name" />
      </FormField>,
    );
    assert.equal(inputElement(r).props.error, true);
    assert.equal(texts(r).length, 0, "no helper or error text is rendered");
  });

  it("does not set error when there is none, and the child's own error value wins", () => {
    const plain = render(
      <FormField label="Name">
        <Input value="" onChangeText={noop} accessibilityLabel="Name" />
      </FormField>,
    );
    assert.equal(inputElement(plain).props.error, false);
    const own = render(
      <FormField errorText="Bad">
        <Input value="" onChangeText={noop} accessibilityLabel="Name" error={false} />
      </FormField>,
    );
    assert.equal(inputElement(own).props.error, false);
  });

  it("required renders an asterisk next to the label", () => {
    const r = render(
      <FormField label="Name" required>
        <Input value="" onChangeText={noop} accessibilityLabel="Name" />
      </FormField>,
    );
    assert.ok(texts(r).some((t) => textOf(t).includes("*")));
    const without = render(
      <FormField label="Name">
        <Input value="" onChangeText={noop} accessibilityLabel="Name" />
      </FormField>,
    );
    assert.ok(!texts(without).some((t) => textOf(t).includes("*")));
  });

  it("helperText renders when there is no error and is replaced by the error", () => {
    const helper = render(
      <FormField helperText="Use your work address">
        <Input value="" onChangeText={noop} accessibilityLabel="Email" />
      </FormField>,
    );
    assert.ok(hasText(helper, "Use your work address"));
    const withError = render(
      <FormField helperText="Use your work address" errorText="Required">
        <Input value="" onChangeText={noop} accessibilityLabel="Email" />
      </FormField>,
    );
    assert.ok(!hasText(withError, "Use your work address"));
    assert.ok(hasText(withError, "Required"));
  });

  it("exposes the error through accessibilityHint on the control and a polite live region", () => {
    const r = render(
      <FormField errorText="Required">
        <Input value="" onChangeText={noop} accessibilityLabel="Email" />
      </FormField>,
    );
    assert.equal(inputNode(r).props.accessibilityHint, "Required");
    const message = texts(r).find((t) => textOf(t) === "Required")!;
    assert.equal(message.props.accessibilityLiveRegion, "polite");
  });

  it("keeps a hint the child already has, and the helper text is not a live region", () => {
    const r = render(
      <FormField errorText="Required">
        <Input value="" onChangeText={noop} accessibilityLabel="Email" accessibilityHint="Your email" />
      </FormField>,
    );
    assert.equal(inputNode(r).props.accessibilityHint, "Your email");
    const helper = render(
      <FormField helperText="Help">
        <Input value="" onChangeText={noop} accessibilityLabel="Email" />
      </FormField>,
    );
    assert.equal(texts(helper).find((t) => textOf(t) === "Help")!.props.accessibilityLiveRegion, undefined);
  });

  it("uses the muted text colour for the helper and the error colour for the error, in light and dark", () => {
    for (const mode of ["light", "dark"] as const) {
      const r = render(
        <FormField helperText="Help">
          <Input value="" onChangeText={noop} accessibilityLabel="Email" />
        </FormField>,
        mode,
      );
      const colour = flatten(texts(r).find((t) => textOf(t) === "Help")!.props.style).color as string;
      assert.match(colour, /^#[0-9A-Fa-f]{6}$/, `${mode}: an opaque 6 digit colour`);
      const errorRender = render(
        <FormField errorText="Bad">
          <Input value="" onChangeText={noop} accessibilityLabel="Email" />
        </FormField>,
        mode,
      );
      const errorColour = flatten(texts(errorRender).find((t) => textOf(t) === "Bad")!.props.style).color as string;
      assert.notEqual(errorColour, colour);
    }
  });

  it("takes its spacing from the theme", () => {
    const r = render(
      <FormField label="L" helperText="H">
        <Input value="" onChangeText={noop} accessibilityLabel="L" />
      </FormField>,
    );
    const container = flatten(r.root.findAllByType(host("View"))[0]!.props.style);
    assert.equal(container.marginBottom, 16);
    assert.equal(container.width, "100%");
    const helperStyle = flatten(texts(r).find((t) => textOf(t) === "H")!.props.style);
    assert.equal(helperStyle.marginTop, 4);
  });

  it("forwards variant and colorScheme only to a child that has those props", () => {
    const withProps = render(
      <FormField variant="filled" colorScheme="danger">
        <Probe variant={undefined} colorScheme={undefined} />
      </FormField>,
    );
    assert.equal(probeProps(withProps).variant, "filled");
    assert.equal(probeProps(withProps).colorScheme, "danger");
    const without = render(
      <FormField variant="filled" colorScheme="danger">
        <Probe />
      </FormField>,
    );
    assert.ok(!("variant" in probeProps(without)));
    assert.ok(!("colorScheme" in probeProps(without)));
    const own = render(
      <FormField variant="filled">
        <Probe variant="outline" />
      </FormField>,
    );
    assert.equal(probeProps(own).variant, "outline");
  });

  it("wires status, aria-invalid and aria-describedby for a child that declares them", () => {
    const r = render(
      <FormField id="f" helperText="Help" errorText="Bad">
        <Probe status={undefined} aria-invalid={undefined} aria-describedby={undefined} />
      </FormField>,
    );
    const props = probeProps(r);
    assert.equal(props.status, "error");
    assert.equal(props["aria-invalid"], true);
    assert.equal(props["aria-describedby"], "f-error", "the helper is replaced by the error, so only the error is referenced");
    const helperOnly = render(
      <FormField id="f" helperText="Help">
        <Probe aria-describedby={undefined} />
      </FormField>,
    );
    assert.equal(probeProps(helperOnly)["aria-describedby"], "f-helper");
  });

  it("types variant and colorScheme as closed unions, not string", () => {
    const ok: FormFieldProps = { variant: "outline", colorScheme: "primary", children: <Probe /> };
    // @ts-expect-error variant is a closed union
    const badVariant: FormFieldProps = { variant: "rounded", children: <Probe /> };
    // @ts-expect-error colorScheme is a closed union
    const badScheme: FormFieldProps = { colorScheme: "purple", children: <Probe /> };
    void [ok, badVariant, badScheme];
  });
});
