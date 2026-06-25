import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";

import { Input, ThemeProvider } from "../../src";
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

function findInputContainer(renderer: TestRenderer.ReactTestRenderer) {
  const views = renderer.root.findAllByType("View");
  const container = views.find((node) => {
    const style = flattenStyle(node.props.style);
    return style.borderWidth === 1 && "borderColor" in style;
  });

  assert.ok(container);
  return container;
}

const themeOverrides = {
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
        pressed: 1,
      },
    },
    input: {
      height: {
        xs: 28,
        sm: 34,
        md: 46,
        lg: 54,
      },
      paddingX: {
        xs: 5,
        sm: 9,
        md: 17,
        lg: 25,
      },
      paddingY: {
        xs: 0,
        sm: 1,
        md: 3,
        lg: 5,
      },
      iconBoxHeight: {
        xs: 28,
        sm: 34,
        md: 46,
        lg: 54,
      },
      radius: 13,
    },
  },
};

describe("Input component token contract", () => {
  it("uses theme.components.input structural tokens", () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider themeOverrides={themeOverrides}>
          <Input label="Name" size="md" value="Ada" onChangeText={() => undefined} />
        </ThemeProvider>
      );
    });

    assert.ok(renderer);

    const containerStyle = flattenStyle(findInputContainer(renderer).props.style);
    assert.equal(containerStyle.minHeight, 46);
    assert.equal(containerStyle.borderRadius, 13);
    assert.equal(containerStyle.paddingHorizontal, 17);
    assert.equal(containerStyle.paddingVertical, 3);

    const input = renderer.root.findByType("TextInput");
    const inputStyle = flattenStyle(input.props.style);
    assert.equal(inputStyle.height, 46);
    assert.equal(inputStyle.paddingVertical, 3);
  });

  it("preserves semantic error color", () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider themeOverrides={themeOverrides}>
          <Input
            error
            label="Name"
            size="md"
            value="Ada"
            onChangeText={() => undefined}
          />
        </ThemeProvider>
      );
    });

    assert.ok(renderer);

    const containerStyle = flattenStyle(findInputContainer(renderer).props.style);
    assert.equal(containerStyle.borderColor, lightColors.error);
  });

  it("preserves semantic focus color", () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider themeOverrides={themeOverrides}>
          <Input label="Name" size="md" value="Ada" onChangeText={() => undefined} />
        </ThemeProvider>
      );
    });

    assert.ok(renderer);

    const input = renderer.root.findByType("TextInput");

    act(() => {
      input.props.onFocus();
    });

    const containerStyle = flattenStyle(findInputContainer(renderer).props.style);
    assert.equal(containerStyle.borderColor, lightColors.primary);
  });

  it("preserves semantic disabled background color", () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider themeOverrides={themeOverrides}>
          <Input
            editable={false}
            label="Name"
            size="md"
            value="Ada"
            onChangeText={() => undefined}
          />
        </ThemeProvider>
      );
    });

    assert.ok(renderer);

    const containerStyle = flattenStyle(findInputContainer(renderer).props.style);
    assert.equal(containerStyle.backgroundColor, lightColors.disabledBg);
  });
});
