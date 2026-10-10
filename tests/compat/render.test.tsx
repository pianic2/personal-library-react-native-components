import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";

import { legacy } from "./api.js";

const { Alert, Badge, Box, Button, Card, Checkbox, Column, Heading, Input, RadioGroup, Row, Switch, Text, ThemeProvider, useTheme } = legacy;

// Host component names of the react-native test shim are plain strings.
const host = (name: string) => name as unknown as React.ElementType;

function render(element: React.ReactElement, props: Record<string, unknown> = {}) {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(<ThemeProvider {...props}>{element}</ThemeProvider>);
  });
  return renderer;
}

const texts = (renderer: TestRenderer.ReactTestRenderer) =>
  renderer.root.findAllByType(host("Text")).map((node) => [node.props.children].flat().join(""));

describe("PLRNUI-162 legacy specifier: rendering", () => {
  it("renders the core components under the legacy ThemeProvider", () => {
    const renderer = render(
      <Box padding="sm">
        <Heading level={2}>Title</Heading>
        <Row gap="sm">
          <Text>Left</Text>
          <Badge>New</Badge>
        </Row>
        <Column gap="sm">
          <Alert title="Heads up" message="Message" />
          <Card>
            <Text>Inside card</Text>
          </Card>
          <Button label="Save" onPress={() => undefined} />
        </Column>
      </Box>
    );
    const rendered = texts(renderer);
    for (const expected of ["Title", "Left", "New", "Heads up", "Message", "Inside card", "Save"]) {
      assert.ok(rendered.some((t) => t.includes(expected)), `missing ${expected}`);
    }
  });

  it("controls respond to presses through the legacy API", () => {
    const calls: string[] = [];
    const renderer = render(
      <Column gap="sm">
        <Button label="Go" onPress={() => calls.push("button")} />
        <Switch label="Enabled" value={false} onChange={(v: boolean) => calls.push(`switch:${v}`)} />
        <Checkbox label="Accept" checked={false} onChange={(v: boolean) => calls.push(`checkbox:${v}`)} />
        <Input label="Name" value="Ada" onChangeText={(v: string) => calls.push(`input:${v}`)} />
        <RadioGroup value="a" onChange={(v: string) => calls.push(`radio:${v}`)} options={[{ label: "A", value: "a" }, { label: "B", value: "b" }]} />
      </Column>
    );
    act(() => renderer.root.findByProps({ accessibilityLabel: "Go" }).props.onPress());
    act(() => renderer.root.findByProps({ accessibilityLabel: "Enabled" }).props.onPress());
    act(() => renderer.root.findByProps({ accessibilityLabel: "Accept" }).props.onPress());
    act(() => renderer.root.findByType(host("TextInput")).props.onChangeText("Grace"));
    act(() => renderer.root.findByProps({ accessibilityLabel: "B" }).props.onPress());
    assert.deepEqual(calls, ["button", "switch:true", "checkbox:true", "input:Grace", "radio:b"]);
  });

  it("renders plain text under the legacy ThemeProvider", () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider>
          <Text>Plain</Text>
        </ThemeProvider>
      );
    });
    assert.deepEqual(texts(renderer), ["Plain"]);
  });
});

describe("PLRNUI-162 legacy specifier: theme", () => {
  function Probe({ out }: { out: { mode?: string; primary?: string; spaceMd?: unknown } }) {
    const { mode, theme } = useTheme();
    out.mode = mode;
    out.primary = theme.colors.primary;
    out.spaceMd = theme.space.md;
    return null;
  }

  it("applies theme overrides without erasing sibling tokens, and honors the initial mode", () => {
    const base: { mode?: string; primary?: string; spaceMd?: unknown } = {};
    render(<Probe out={base} />);
    const out: typeof base = {};
    render(<Probe out={out} />, { initialMode: "dark", themeOverrides: { colors: { primary: "#123456" } } });
    assert.equal(base.mode, "light");
    assert.equal(out.mode, "dark");
    assert.equal(out.primary, "#123456");
    assert.equal(out.spaceMd, base.spaceMd);
  });

  it("merges nested overrides (radius, size, component tokens) without erasing siblings", () => {
    type Probe = { radiusSm?: unknown; radiusMd?: unknown; heightXs?: unknown; heightMd?: unknown; buttonHeight?: unknown; buttonPressed?: unknown; inputRadius?: unknown };
    function Reader({ out }: { out: Probe }) {
      const { theme } = useTheme();
      out.radiusSm = theme.radius.sm;
      out.radiusMd = theme.radius.md;
      out.heightXs = theme.size.height.xs;
      out.heightMd = theme.size.height.md;
      out.buttonHeight = theme.components.button.height.md;
      out.buttonPressed = theme.components.button.opacity.pressed;
      out.inputRadius = theme.components.input.radius;
      return null;
    }
    const base: Probe = {};
    const over: Probe = {};
    render(<Reader out={base} />);
    render(<Reader out={over} />, { themeOverrides: { radius: { md: 12 }, size: { height: { md: 44 } }, components: { button: { height: { md: 42 }, opacity: { pressed: 0.72 } } } } });
    assert.equal(over.radiusMd, 12);
    assert.equal(over.heightMd, 44);
    assert.equal(over.buttonHeight, 42);
    assert.equal(over.buttonPressed, 0.72);
    assert.equal(over.radiusSm, base.radiusSm);
    assert.equal(over.heightXs, base.heightXs);
    assert.equal(over.inputRadius, base.inputRadius);
  });
});
