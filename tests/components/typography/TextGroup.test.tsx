import React from "react";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";
import { Platform } from "react-native";
import { ThemeProvider, useTheme, TextGroup, type TextGroupProps, Text } from "../../../src";

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


const TextGroupWithRef = TextGroup as React.ComponentType<TextGroupProps & { ref?: React.Ref<unknown> }>;
const views = (r: TestRenderer.ReactTestRenderer) => r.root.findAllByType(host("View"));

describe("PLRNUI-104 TextGroup", () => {
  it("wraps each child and spaces them with the default small token, except after the last", () => {
    const { theme } = themeOf();
    const r = render(
      <TextGroup>
        <Text>a</Text>
        <Text>b</Text>
        <Text>c</Text>
      </TextGroup>,
    );
    const margins = views(r).slice(1).map((v) => flatten(v.props.style).marginBottom);
    assert.deepEqual(margins, [theme.space.sm, theme.space.sm, 0]);
  });

  it("resolves the spacing token", () => {
    const { theme } = themeOf();
    const r = render(
      <TextGroup spacing="xl">
        <Text>a</Text>
        <Text>b</Text>
      </TextGroup>,
    );
    assert.deepEqual(views(r).slice(1).map((v) => flatten(v.props.style).marginBottom), [theme.space.xl, 0]);
  });

  it("ignores falsy children and adds no margin to a single child", () => {
    const r = render(
      <TextGroup>
        {null}
        <Text>only</Text>
        {false}
      </TextGroup>,
    );
    const wrappers = views(r).slice(1);
    assert.equal(wrappers.length, 1);
    assert.equal(flatten(wrappers[0]!.props.style).marginBottom, 0);
  });

  it("passes style and view props to the container", () => {
    const r = render(
      <TextGroup style={{ padding: 7 }} testID="group" accessibilityRole="summary">
        <Text>a</Text>
      </TextGroup>,
    );
    const container = views(r)[0]!;
    assert.deepEqual(container.props.style, { padding: 7 });
    assert.equal(container.props.testID, "group");
    assert.equal(container.props.accessibilityRole, "summary");
  });

  it("forwards the ref to the container View", () => {
    const ref = React.createRef<unknown>();
    render(<TextGroupWithRef ref={ref}><Text>a</Text></TextGroupWithRef>);
    assert.notEqual(ref.current, null);
  });
});
