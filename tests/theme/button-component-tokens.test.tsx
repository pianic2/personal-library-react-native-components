import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";

import { Button, ThemeProvider } from "../../src";

function TestIcon({ size, color }: { size?: number; color?: string }) {
  return <TextIcon size={size} color={color} />;
}

function TextIcon({ size, color }: { size?: number; color?: string }) {
  return <TextIconHost size={size} color={color} />;
}

function TextIconHost(_props: { size?: number; color?: string }) {
  return null;
}

describe("Button component token contract", () => {
  it("uses theme.components.button structural tokens", () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider
          themeOverrides={{
            components: {
              button: {
                height: {
                  sm: 31,
                  md: 41,
                  lg: 49,
                },
                paddingX: {
                  sm: 13,
                  md: 17,
                  lg: 23,
                },
                iconSize: {
                  sm: 15,
                  md: 21,
                  lg: 27,
                },
                radius: 14,
                gap: 9,
                borderWidth: 3,
                opacity: {
                  disabled: 0.37,
                  pressed: 0.82,
                },
              },
            },
          }}
        >
          <Button
            disabled
            icon={TestIcon}
            label="Save"
            onPress={() => undefined}
            size="md"
          />
        </ThemeProvider>
      );
    });

    assert.ok(renderer);

    const pressable = renderer.root.findByType("Pressable");
    const resolvedStyle = pressable.props.style({ pressed: false });
    const pressedStyle = pressable.props.style({ pressed: true });

    assert.equal(resolvedStyle.minHeight, 41);
    assert.equal(resolvedStyle.paddingHorizontal, 17);
    assert.equal(resolvedStyle.borderRadius, 14);
    assert.equal(resolvedStyle.gap, 9);
    assert.equal(resolvedStyle.borderWidth, 3);
    assert.equal(resolvedStyle.opacity, 0.37);
    assert.equal(pressedStyle.opacity, 0.37);

    const icon = renderer.root.findByType(TextIconHost);
    assert.equal(icon.props.size, 21);
  });

  it("uses pressed opacity token when enabled", () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider
          themeOverrides={{
            components: {
              button: {
                height: {
                  sm: 32,
                  md: 40,
                  lg: 48,
                },
                paddingX: {
                  sm: 12,
                  md: 16,
                  lg: 20,
                },
                iconSize: {
                  sm: 16,
                  md: 20,
                  lg: 24,
                },
                radius: 10,
                gap: 8,
                borderWidth: 2,
                opacity: {
                  disabled: 0.5,
                  pressed: 0.76,
                },
              },
            },
          }}
        >
          <Button label="Save" onPress={() => undefined} size="md" />
        </ThemeProvider>
      );
    });

    assert.ok(renderer);

    const pressable = renderer.root.findByType("Pressable");

    assert.equal(pressable.props.style({ pressed: false }).opacity, 1);
    assert.equal(pressable.props.style({ pressed: true }).opacity, 0.76);
  });
});
