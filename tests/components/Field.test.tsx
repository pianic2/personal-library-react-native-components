import React from "react";
import { Platform, Text, TextInput, View } from "react-native";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";
import { Field, Input, ThemeProvider, useField, useFieldControlProps, useTheme } from "../../src";

const host = (name: string) => name as unknown as React.ElementType;
type Mode = "light" | "dark";

const originalError = console.error;
const originalWarn = console.warn;
afterEach(() => {
  console.error = originalError;
  console.warn = originalWarn;
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

function update(r: TestRenderer.ReactTestRenderer, ui: React.ReactElement, mode: Mode = "light") {
  act(() => {
    r.update(
      <ThemeProvider initialMode={mode} persistTheme={false}>
        {ui}
      </ThemeProvider>,
    );
  });
}

function themeOf(mode: Mode = "light"): ReturnType<typeof useTheme> {
  let captured: ReturnType<typeof useTheme> | undefined;
  function Probe() {
    captured = useTheme();
    return null;
  }
  render(<Probe />, mode);
  return captured as ReturnType<typeof useTheme>;
}

function flatten(style: unknown): Record<string, any> {
  return Object.assign({}, ...[style].flat(Infinity).filter(Boolean));
}

/** Fails the test on any console.error / console.warn except the react-test-renderer deprecation notice. */
function failOnConsole() {
  const fail = (...args: unknown[]) => {
    if (String(args[0]).includes("react-test-renderer is deprecated")) return;
    throw new Error(`console output: ${args.map(String).join(" ")}`);
  };
  console.error = fail;
  console.warn = fail;
}

function Probe({ onField }: { onField?: (value: ReturnType<typeof useField>) => void }) {
  const value = useField();
  onField?.(value);
  return null;
}

/** A control that spreads the Field props onto a host TextInput. */
function Control(props: Record<string, unknown>) {
  return <TextInput {...props} {...useFieldControlProps()} />;
}

const inputs = (r: TestRenderer.ReactTestRenderer) => r.root.findAllByType(host("TextInput"));
const texts = (r: TestRenderer.ReactTestRenderer) => r.root.findAllByType(host("Text"));
const byNativeID = (r: TestRenderer.ReactTestRenderer, id: string) => texts(r).find((node) => node.props.nativeID === id);

function Full({ error, hint = "We never share it", ...rest }: { error?: React.ReactNode; hint?: React.ReactNode } & Partial<React.ComponentProps<typeof Field>>) {
  return (
    <Field {...rest}>
      <Field.Label>Email</Field.Label>
      <Field.Control>
        <Control accessibilityLabel="Email" />
      </Field.Control>
      <Field.Hint>{hint}</Field.Hint>
      <Field.Error>{error}</Field.Error>
    </Field>
  );
}

describe("PLRNUI-280 Field", () => {
  it("generates unique ids per Field instance with the part names", () => {
    const seen: ReturnType<typeof useField>[] = [];
    render(
      <>
        <Field name="a">
          <Probe onField={(v) => seen.push(v)} />
        </Field>
        <Field name="a">
          <Probe onField={(v) => seen.push(v)} />
        </Field>
        <Field>
          <Probe onField={(v) => seen.push(v)} />
        </Field>
      </>,
    );
    const first = seen[0]!;
    const all = new Set(seen.flatMap((v) => [v.nativeID, v.labelId, v.hintId, v.errorId]));
    assert.equal(all.size, 12, "twelve distinct ids for three fields");
    assert.match(first.nativeID, /^a-.+-control$/);
    assert.match(first.labelId, /-label$/);
    assert.match(first.hintId, /-hint$/);
    assert.match(first.errorId, /-error$/);
    assert.equal(first.status, "default");
    assert.equal(first.required, false);
    assert.equal(first.disabled, false);
  });

  it("links the label, the control and the described parts by id", () => {
    const r = render(<Full error="Enter a valid address" />);
    const input = inputs(r)[0]!;
    const label = texts(r)[0]!;
    assert.equal(label.props.nativeID, input.props.accessibilityLabelledBy);
    assert.ok(input.props.nativeID);
    const hint = byNativeID(r, `${input.props.nativeID}`.replace(/-control$/, "-hint"));
    const error = byNativeID(r, `${input.props.nativeID}`.replace(/-control$/, "-error"));
    assert.ok(hint && error);
    assert.equal(input.props.accessibilityDescribedBy, `${hint!.props.nativeID} ${error!.props.nativeID}`);
    assert.equal(input.props["aria-describedby"], input.props.accessibilityDescribedBy);
  });

  it("Field.Error is a polite live region and renders only with a message", () => {
    failOnConsole();
    const r = render(<Full error={undefined} />);
    assert.equal(texts(r).filter((node) => node.props.accessibilityLiveRegion !== undefined).length, 0);
    assert.equal(inputs(r)[0]!.props.accessibilityDescribedBy?.includes("error"), false);

    for (const empty of ["", null, false, 0]) {
      update(r, <Full error={empty as React.ReactNode} />);
      assert.equal(texts(r).filter((node) => node.props.accessibilityLiveRegion !== undefined).length, 0, String(empty));
    }

    update(r, <Full error="Enter a valid address" />);
    const live = texts(r).filter((node) => node.props.accessibilityLiveRegion !== undefined);
    assert.equal(live.length, 1);
    assert.equal(live[0]!.props.accessibilityLiveRegion, "polite");
    assert.equal(live[0]!.props.children, "Enter a valid address");

    update(r, <Full error={undefined} />);
    assert.equal(texts(r).filter((node) => node.props.accessibilityLiveRegion !== undefined).length, 0);
    assert.equal(inputs(r)[0]!.props.accessibilityDescribedBy?.includes("error"), false);
  });

  it("sets role alert on web only", () => {
    const original = Platform.OS;
    try {
      (Platform as { OS: string }).OS = "web";
      const web = render(<Full error="Bad" />);
      assert.equal(texts(web).find((node) => node.props.accessibilityLiveRegion)?.props.role, "alert");
      (Platform as { OS: string }).OS = "ios";
      const native = render(<Full error="Bad" />);
      assert.equal(texts(native).find((node) => node.props.accessibilityLiveRegion)?.props.role, undefined);
    } finally {
      (Platform as { OS: string }).OS = original;
    }
  });

  it("propagates the status to the control props and the colours", () => {
    for (const mode of ["light", "dark"] as const) {
      const { colors } = themeOf(mode);
      const hintColor = (status: "default" | "error" | "success" | "warning") => {
        const r = render(<Full status={status} />, mode);
        const hint = texts(r).find((node) => `${node.props.nativeID}`.endsWith("-hint"))!;
        return { color: flatten(hint.props.style).color, invalid: inputs(r)[0]!.props["aria-invalid"] };
      };
      assert.deepEqual(hintColor("default"), { color: colors.textMuted, invalid: undefined }, mode);
      assert.deepEqual(hintColor("success"), { color: colors.success, invalid: undefined }, mode);
      assert.deepEqual(hintColor("warning"), { color: colors.warning, invalid: undefined }, mode);
      assert.deepEqual(hintColor("error"), { color: colors.textMuted, invalid: true }, mode);

      const r = render(<Full error="Bad" />, mode);
      const error = texts(r).find((node) => node.props.accessibilityLiveRegion)!;
      assert.equal(flatten(error.props.style).color, colors.error, mode);
      assert.equal(inputs(r)[0]!.props["aria-invalid"], true, "a displayed error marks the control invalid");
    }
  });

  it("the useField status becomes error while an error message is displayed", () => {
    let status = "";
    const r = render(
      <Field>
        <Probe onField={(v) => (status = v.status)} />
        <Field.Error>{null}</Field.Error>
      </Field>,
    );
    assert.equal(status, "default");
    update(
      r,
      <Field>
        <Probe onField={(v) => (status = v.status)} />
        <Field.Error>Bad</Field.Error>
      </Field>,
    );
    assert.equal(status, "error");
  });

  it("hides the hint while an error is displayed but keeps both described, with the error as the native hint", () => {
    const r = render(<Full />);
    const hintOf = () => texts(r).find((node) => `${node.props.nativeID}`.endsWith("-hint"))!;
    assert.equal(flatten(hintOf().props.style).display, undefined);
    assert.equal(inputs(r)[0]!.props.accessibilityHint, "We never share it");
    assert.equal(inputs(r)[0]!.props.accessibilityDescribedBy, hintOf().props.nativeID);

    update(r, <Full error="Enter a valid address" />);
    assert.equal(flatten(hintOf().props.style).display, "none");
    assert.equal(inputs(r)[0]!.props.accessibilityHint, "Enter a valid address We never share it");
    assert.equal(inputs(r)[0]!.props.accessibilityDescribedBy?.split(" ").length, 2);

    update(r, <Full />);
    assert.equal(flatten(hintOf().props.style).display, undefined);
    assert.equal(inputs(r)[0]!.props.accessibilityHint, "We never share it");
  });

  it("describes only what is rendered and has no hint without a hint or an error", () => {
    const r = render(
      <Field>
        <Field.Control>
          <Control />
        </Field.Control>
      </Field>,
    );
    const props = inputs(r)[0]!.props;
    assert.equal(props.accessibilityDescribedBy, undefined);
    assert.equal(props["aria-describedby"], undefined);
    assert.equal(props.accessibilityHint, undefined);
    assert.equal(props["aria-invalid"], undefined);
  });

  it("required and disabled reach the label and the control", () => {
    const r = render(<Full required disabled />);
    const label = texts(r)[0]!;
    assert.equal(label.props.accessibilityLabel, "Email, required");
    assert.equal(label.props.accessibilityState?.disabled, true);
    assert.deepEqual(inputs(r)[0]!.props.accessibilityState, { disabled: true });

    const plain = render(<Full />);
    assert.equal(inputs(plain)[0]!.props.accessibilityState, undefined);
    assert.equal(texts(plain)[0]!.props.accessibilityLabel, undefined);
  });

  it("works with the library Input", () => {
    failOnConsole();
    const r = render(
      <Field status="error">
        <Field.Label>Name</Field.Label>
        <Field.Control>
          <LibraryInput />
        </Field.Control>
        <Field.Error>Required</Field.Error>
      </Field>,
    );
    const input = inputs(r)[0]!;
    assert.equal(input.props["aria-invalid"], true);
    assert.equal(input.props.accessibilityHint, "Required");
    assert.ok(input.props.accessibilityLabelledBy);
    assert.equal(input.props.nativeID.endsWith("-control"), true);
  });

  it("disabled makes the library Input really non-editable and disabled", () => {
    const r = render(
      <Field disabled>
        <Field.Label>Name</Field.Label>
        <Field.Control>
          <LibraryInput />
        </Field.Control>
      </Field>,
    );
    assert.equal(inputs(r)[0]!.props.editable, false);
    assert.deepEqual(inputs(r)[0]!.props.accessibilityState, { disabled: true });

    const enabled = render(
      <Field>
        <Field.Control>
          <LibraryInput />
        </Field.Control>
      </Field>,
    );
    assert.equal(inputs(enabled)[0]!.props.editable, true);
    assert.deepEqual(inputs(enabled)[0]!.props.accessibilityState, { disabled: false });
  });

  it("a hint-only field gives the hint as the native hint and describes it", () => {
    const r = render(<Full />);
    const props = inputs(r)[0]!.props;
    assert.equal(props.accessibilityHint, "We never share it");
    assert.match(props.accessibilityDescribedBy, /-hint$/);
    assert.equal(props["aria-invalid"], undefined);
  });

  it("joins the error and the hint in the native hint and reads text from element children", () => {
    const r = render(<Full error="Enter a valid address" />);
    assert.equal(inputs(r)[0]!.props.accessibilityHint, "Enter a valid address We never share it");
    update(r, <Full error={<React.Fragment>Bad <Text>value</Text></React.Fragment>} />);
    assert.equal(inputs(r)[0]!.props.accessibilityHint, "Bad value We never share it");
    update(r, <Full error={<View />} hint="" />);
    assert.equal(inputs(r)[0]!.props.accessibilityHint, undefined);
    assert.equal(inputs(r)[0]!.props["aria-invalid"], true);
  });

  it("renders in light and dark without console errors or warnings", () => {
    failOnConsole();
    for (const mode of ["light", "dark"] as const) {
      const r = render(<Full required status="warning" error="Bad" />, mode);
      assert.ok(texts(r).length >= 3, mode);
    }
  });

  it("parts throw outside a Field; the control hook returns nothing", () => {
    console.error = () => undefined;
    assert.throws(() => render(<Field.Label>Name</Field.Label>), /Field.Label must be rendered inside <Field>/);
    assert.throws(() => render(<Probe />), /useField\(\) must be rendered inside <Field>/);
    let props: unknown;
    function Outside() {
      props = useFieldControlProps();
      return null;
    }
    render(<Outside />);
    assert.deepEqual(props, {});
  });
});

function LibraryInput() {
  return <Input accessibilityLabel="Name" {...useFieldControlProps()} />;
}
