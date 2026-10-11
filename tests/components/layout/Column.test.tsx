import React from "react";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";
import { Platform } from "react-native";
import { ThemeProvider, useTheme, Column, Stack, type ColumnProps, Text } from "../../../src";

// The react-native test shim exposes a mutable Platform and host components that are plain strings ("View", "Text").
const platform = Platform as { OS: string };
const originalOS = platform.OS;
afterEach(() => {
  platform.OS = originalOS;
});

const host = (name: string) => name as unknown as React.ElementType;
type Mode = "light" | "dark";

function render(ui: React.ReactElement, mode: Mode = "light"): TestRenderer.ReactTestRenderer {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    // host refs are null in the test renderer unless nodes are mocked
    renderer = TestRenderer.create(
      <ThemeProvider initialMode={mode} persistTheme={false}>
        {ui}
      </ThemeProvider>,
      { createNodeMock: () => ({ mock: true }) },
    );
  });
  return renderer;
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

/** Merges a style array (nested arrays, falsy entries) into one object; later entries win, like React Native. */
function flatten(style: unknown): Record<string, any> {
  return Object.assign({}, ...[style].flat(Infinity).filter(Boolean));
}


const ColumnWithRef = Column as React.ComponentType<ColumnProps & { ref?: React.Ref<unknown> }>;
const views = (r: TestRenderer.ReactTestRenderer) => r.root.findAllByType(host("View"));

describe("PLRNUI-104 Column", () => {
  it("fills the available space and aligns to the start by default", () => {
    const r = render(<Column><Text>a</Text></Column>);
    assert.deepEqual(flatten(views(r)[0]!.props.style), { flex: 1, alignItems: "flex-start", justifyContent: "flex-start" });
  });

  it("wraps every child in a stretched View and spaces them with the gap token, except after the last", () => {
    const { theme } = themeOf();
    const r = render(
      <Column gap="md">
        <Text>a</Text>
        <Text>b</Text>
        <Text>c</Text>
      </Column>,
    );
    const wrappers = views(r).slice(1).map((v) => flatten(v.props.style));
    assert.equal(wrappers.length, 3);
    assert.deepEqual(wrappers.map((s) => s.marginBottom), [theme.space.md, theme.space.md, 0]);
    for (const wrapper of wrappers) assert.equal(wrapper.alignSelf, "stretch");
  });

  it("ignores falsy children", () => {
    const { theme } = themeOf();
    const r = render(
      <Column gap="sm">
        {null}
        <Text>a</Text>
        {false}
        <Text>b</Text>
      </Column>,
    );
    const wrappers = views(r).slice(1).map((v) => flatten(v.props.style));
    assert.deepEqual(wrappers.map((s) => s.marginBottom), [theme.space.sm, 0]);
  });

  it("maps flex, align and justify", () => {
    const r = render(<Column flex={2} align="center" justify="space-between"><Text>a</Text></Column>);
    assert.deepEqual(flatten(views(r)[0]!.props.style), { flex: 2, alignItems: "center", justifyContent: "space-between" });
  });

  it("lets the style prop override the container styles", () => {
    const r = render(<Column style={{ flex: 9, backgroundColor: "red" }}><Text>a</Text></Column>);
    const style = flatten(views(r)[0]!.props.style);
    assert.equal(style.flex, 9);
    assert.equal(style.backgroundColor, "red");
  });

  it("Stack is the same component, and the ref reaches the container View", () => {
    assert.equal(Stack, Column);
    const ref = React.createRef<unknown>();
    const r = render(<ColumnWithRef ref={ref} testID="col"><Text>a</Text></ColumnWithRef>);
    assert.equal(views(r)[0]!.props.testID, "col");
    assert.notEqual(ref.current, null);
  });
});
