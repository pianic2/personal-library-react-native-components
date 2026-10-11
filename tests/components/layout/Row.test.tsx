import React from "react";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";
import { Platform } from "react-native";
import { ThemeProvider, useTheme, Row, type RowProps, Text } from "../../../src";

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


const RowWithRef = Row as React.ComponentType<RowProps & { ref?: React.Ref<unknown> }>;
const rootView = (r: TestRenderer.ReactTestRenderer) => r.root.findByType(host("View"));

describe("PLRNUI-104 Row", () => {
  it("lays children out in a row with the documented defaults", () => {
    const { theme } = themeOf();
    const style = flatten(rootView(render(<Row><Text>a</Text></Row>)).props.style);
    assert.deepEqual(style, {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      flexWrap: "nowrap",
      columnGap: theme.space.md,
    });
  });

  it("resolves the gap token", () => {
    const { theme } = themeOf();
    for (const gap of ["none", "xs", "sm", "lg", "xxl"] as const) {
      assert.equal(flatten(rootView(render(<Row gap={gap}><Text>a</Text></Row>)).props.style).columnGap, theme.space[gap], gap);
    }
  });

  it("maps align, justify and wrap", () => {
    const style = flatten(rootView(render(<Row align="flex-end" justify="space-between" wrap><Text>a</Text></Row>)).props.style);
    assert.equal(style.alignItems, "flex-end");
    assert.equal(style.justifyContent, "space-between");
    assert.equal(style.flexWrap, "wrap");
  });

  it("lets the style prop override the layout styles", () => {
    const style = flatten(rootView(render(<Row style={{ flexDirection: "row-reverse", columnGap: 3 }}><Text>a</Text></Row>)).props.style);
    assert.equal(style.flexDirection, "row-reverse");
    assert.equal(style.columnGap, 3);
  });

  it("renders every child inside the one View and forwards view props", () => {
    const r = render(
      <Row testID="row" accessibilityRole="toolbar">
        <Text>one</Text>
        <Text>two</Text>
      </Row>,
    );
    const view = rootView(r);
    assert.equal(view.props.testID, "row");
    assert.equal(view.props.accessibilityRole, "toolbar");
    assert.equal(r.root.findAllByType(host("Text")).length, 2);
  });

  it("forwards the ref to the View", () => {
    const ref = React.createRef<unknown>();
    render(<RowWithRef ref={ref}><Text>a</Text></RowWithRef>);
    assert.deepEqual(ref.current, { mock: true });
  });
});
