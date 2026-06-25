import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";

import { Card, ThemeProvider } from "../../src";
import { defaultTheme } from "../../src/theme/defaultTheme";

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

function findCardContainer(renderer: TestRenderer.ReactTestRenderer) {
  const views = renderer.root.findAllByType("View");
  const container = views.find((node) => {
    const style = flattenStyle(node.props.style);
    return style.width === "100%" && "backgroundColor" in style;
  });

  assert.ok(container);
  return container;
}

function assertShadowToken(style: Record<string, unknown>, token: "none" | "md") {
  if (token === "none") {
    assert.ok(
      style.elevation === 0 ||
        style.shadowRadius === 0 ||
        style.boxShadow === "none"
    );
    return;
  }

  assert.ok(
    style.elevation === 3 ||
      style.shadowRadius === 6 ||
      (typeof style.boxShadow === "string" && style.boxShadow.includes("6px"))
  );
}

const themeOverrides = {
  components: {
    ...defaultTheme.components,
    card: {
      radius: 22,
      padding: 18,
      shadow: "md" as const,
    },
  },
};

describe("Card component token contract", () => {
  it("uses theme.components.card structural tokens by default", () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider themeOverrides={themeOverrides}>
          <Card>Tokenized card</Card>
        </ThemeProvider>
      );
    });

    assert.ok(renderer);

    const cardStyle = flattenStyle(findCardContainer(renderer).props.style);
    assert.equal(cardStyle.borderRadius, 22);
    assert.equal(cardStyle.padding, 18);
    assertShadowToken(cardStyle, "md");
  });

  it("preserves explicit consumer prop overrides", () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider themeOverrides={themeOverrides}>
          <Card radius={6} padding="lg" shadow="none">
            Override card
          </Card>
        </ThemeProvider>
      );
    });

    assert.ok(renderer);

    const cardStyle = flattenStyle(findCardContainer(renderer).props.style);
    assert.equal(cardStyle.borderRadius, 6);
    assert.equal(cardStyle.padding, defaultTheme.space.lg);
    assertShadowToken(cardStyle, "none");
  });

  it("does not depend on the former hardcoded radius 14 default", () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider themeOverrides={themeOverrides}>
          <Card>Radius check</Card>
        </ThemeProvider>
      );
    });

    assert.ok(renderer);

    const cardStyle = flattenStyle(findCardContainer(renderer).props.style);
    assert.notEqual(cardStyle.borderRadius, 14);
  });
});
