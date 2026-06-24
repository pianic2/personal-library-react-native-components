import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";

import { Text, ThemeAppShell, ThemeProvider } from "../../src";
import { lightColors } from "../../src/tokens/colors.base";

function flattenStyle(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) {
    return style.reduce<Record<string, unknown>>(
      (merged, item) => ({ ...merged, ...flattenStyle(item) }),
      {}
    );
  }

  if (style && typeof style === "object") {
    return style as Record<string, unknown>;
  }

  return {};
}

function renderShell(element: React.ReactElement) {
  let renderer: TestRenderer.ReactTestRenderer | undefined;

  act(() => {
    renderer = TestRenderer.create(
      <ThemeProvider initialMode="light">{element}</ThemeProvider>
    );
  });

  assert.ok(renderer);
  return renderer;
}

describe("PLRNUI-28 ThemeAppShell", () => {
  it("renders a themed View by default without ScrollView", () => {
    const renderer = renderShell(
      <ThemeAppShell>
        <Text>Shell content</Text>
      </ThemeAppShell>
    );

    const views = renderer.root.findAllByType("View");

    assert.equal(renderer.root.findAllByType("ScrollView").length, 0);
    assert.ok(views.length > 0);
    assert.equal(flattenStyle(views[0].props.style).backgroundColor, lightColors.background);
  });

  it("renders a ScrollView when scroll is enabled", () => {
    const renderer = renderShell(
      <ThemeAppShell scroll>
        <Text>Scrollable shell content</Text>
      </ThemeAppShell>
    );

    const scrollViews = renderer.root.findAllByType("ScrollView");

    assert.equal(scrollViews.length, 1);
    assert.equal(
      flattenStyle(scrollViews[0].props.style).backgroundColor,
      lightColors.background
    );
    assert.equal(scrollViews[0].props.showsVerticalScrollIndicator, false);
  });

  it("merges consumer layout styles with themed layout styles", () => {
    const renderer = renderShell(
      <ThemeAppShell style={{ padding: 24 }} contentContainerStyle={{ gap: 12 }} scroll>
        <Text>Styled shell content</Text>
      </ThemeAppShell>
    );

    const scrollView = renderer.root.findByType("ScrollView");
    const style = flattenStyle(scrollView.props.style);
    const contentStyle = flattenStyle(scrollView.props.contentContainerStyle);

    assert.equal(style.backgroundColor, lightColors.background);
    assert.equal(style.padding, 24);
    assert.equal(contentStyle.flexGrow, 1);
    assert.equal(contentStyle.gap, 12);
  });

  it("composes ThemeProvider and ThemeAppShell around children", () => {
    const renderer = renderShell(
      <ThemeAppShell>
        <Text>Composed child</Text>
      </ThemeAppShell>
    );

    const textNodes = renderer.root.findAllByType("Text");

    assert.ok(textNodes.some((node) => node.children.includes("Composed child")));
  });
});
