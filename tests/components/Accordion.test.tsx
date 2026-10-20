import React from "react";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import TestRenderer, { act } from "react-test-renderer";
import { Text, ThemeProvider } from "../../src";
import { Accordion } from "../../src/components/Accordion/index.js";
import type { AccordionProps } from "../../src/components/Accordion/index.js";
import { MotionProvider } from "../../src/motion/MotionProvider.js";

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
        <MotionProvider reduceMotion="always">{ui}</MotionProvider>
      </ThemeProvider>,
    );
  });
  return renderer;
}

function Example(props: Partial<AccordionProps> & { disabledB?: boolean }) {
  const { disabledB, ...rest } = props;
  return (
    <Accordion {...rest}>
      <Accordion.Item value="a">
        <Accordion.Header testID="h-a">Alpha</Accordion.Header>
        <Accordion.Panel testID="p-a"><Text>Body A</Text></Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item value="b" disabled={disabledB}>
        <Accordion.Header testID="h-b">Beta</Accordion.Header>
        <Accordion.Panel testID="p-b"><Text>Body B</Text></Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
}

const byId = (r: TestRenderer.ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id && typeof n.type === "string");
const header = (r: TestRenderer.ReactTestRenderer, k: string) => byId(r, `h-${k}`)[0]!;
const isOpen = (r: TestRenderer.ReactTestRenderer, k: string) => byId(r, `p-${k}`).length > 0;
const press = (r: TestRenderer.ReactTestRenderer, k: string) => act(() => void header(r, k).props.onPress({}));

describe("PLRNUI-345 Accordion", () => {
  it("single mode closes siblings", () => {
    const calls: unknown[] = [];
    const r = render(<Example type="single" onValueChange={(v) => calls.push(v)} />);
    press(r, "a");
    assert.ok(isOpen(r, "a") && !isOpen(r, "b"));
    press(r, "b");
    assert.ok(!isOpen(r, "a") && isOpen(r, "b"));
    assert.deepEqual(calls, ["a", "b"]);
  });

  it("single mode only closes the open item when collapsible", () => {
    const r = render(<Example defaultValue="a" />);
    press(r, "a");
    assert.ok(isOpen(r, "a"));
    const c = render(<Example collapsible defaultValue="a" />);
    press(c, "a");
    assert.ok(!isOpen(c, "a"));
  });

  it("multiple mode toggles items independently", () => {
    const calls: unknown[] = [];
    const r = render(<Example type="multiple" onValueChange={(v) => calls.push(v)} />);
    press(r, "a");
    press(r, "b");
    assert.ok(isOpen(r, "a") && isOpen(r, "b"));
    press(r, "a");
    assert.ok(!isOpen(r, "a") && isOpen(r, "b"));
    assert.deepEqual(calls, [["a"], ["a", "b"], ["b"]]);
  });

  it("controlled value follows the prop and only reports requests", () => {
    const calls: unknown[] = [];
    const ui = (value: string) => <Example value={value} onValueChange={(v) => calls.push(v)} />;
    const r = render(ui("a"));
    assert.ok(isOpen(r, "a"));
    press(r, "b");
    assert.deepEqual(calls, ["b"]);
    assert.ok(isOpen(r, "a") && !isOpen(r, "b"));
    act(() => {
      r.update(
        <ThemeProvider initialMode="light" persistTheme={false}>
          <MotionProvider reduceMotion="always">{ui("b")}</MotionProvider>
        </ThemeProvider>,
      );
    });
    assert.ok(isOpen(r, "b") && !isOpen(r, "a"));
  });

  it("disabled item cannot be toggled and reports disabled", () => {
    const calls: unknown[] = [];
    const r = render(<Example disabledB onValueChange={(v) => calls.push(v)} />);
    assert.equal(header(r, "b").props.disabled, true);
    assert.equal(header(r, "b").props.accessibilityState.disabled, true);
    assert.equal(header(r, "a").props.accessibilityState.disabled, false);
  });

  it("exposes expanded state and labels the panel by its header", () => {
    const r = render(<Example defaultValue="a" />);
    assert.equal(header(r, "a").props.accessibilityRole, "button");
    assert.equal(header(r, "a").props.accessibilityState.expanded, true);
    assert.equal(header(r, "b").props.accessibilityState.expanded, false);
    const panel = byId(r, "p-a")[0]!;
    assert.equal(panel.props["aria-labelledby"], header(r, "a").props.nativeID);
    assert.equal(panel.props.accessibilityLabelledBy, header(r, "a").props.nativeID);
  });

  it("renders in light and dark without console errors or warnings", () => {
    const logged: unknown[] = [];
    console.error = (...a) => void logged.push(a);
    console.warn = (...a) => void logged.push(a);
    for (const mode of ["light", "dark"] as Mode[]) {
      const r = render(<Example type="multiple" defaultValue={["a"]} />, mode);
      press(r, "b");
      assert.ok(isOpen(r, "a") && isOpen(r, "b"));
    }
    assert.deepEqual(logged, []);
  });

  it("throws outside an Accordion", () => {
    console.error = () => undefined;
    assert.throws(() => render(<Accordion.Item value="x" />), /must be rendered inside <Accordion>/);
  });

  it("uses no hardcoded colours", () => {
    const dir = join(__dirname, "../../src/components/Accordion");
    for (const f of readdirSync(dir)) assert.doesNotMatch(readFileSync(join(dir, f), "utf8"), /#[0-9a-fA-F]{3,8}\b/, f);
  });
});
