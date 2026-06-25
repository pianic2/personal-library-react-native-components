import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { createTheme } from "../../src/theme/createTheme";
import { defaultTheme } from "../../src/theme/defaultTheme";
import type { Theme } from "../../src/theme/types";

describe("theme override merge contract", () => {
  it("merges nested color overrides without erasing sibling semantic colors", () => {
    const theme = createTheme({
      colors: {
        primary: "#123456",
      },
    } as Partial<Theme>);

    assert.equal(theme.colors.primary, "#123456");
    assert.equal(theme.colors.background, defaultTheme.colors.background);
    assert.equal(theme.colors.error, defaultTheme.colors.error);
  });

  it("merges nested radius and size overrides without erasing sibling scale tokens", () => {
    const theme = createTheme({
      radius: {
        md: 12,
      },
      size: {
        height: {
          md: 44,
        },
      },
    } as Partial<Theme>);

    assert.equal(theme.radius.md, 12);
    assert.equal(theme.radius.sm, defaultTheme.radius.sm);
    assert.equal(theme.radius.lg, defaultTheme.radius.lg);
    assert.equal(theme.size.height.md, 44);
    assert.equal(theme.size.height.xs, defaultTheme.size.height.xs);
    assert.equal(theme.size.height.lg, defaultTheme.size.height.lg);
  });

  it("merges nested component token overrides without erasing sibling components", () => {
    const theme = createTheme({
      components: {
        button: {
          height: {
            md: 42,
          },
          opacity: {
            pressed: 0.72,
          },
        },
        input: {
          paddingX: {
            lg: 28,
          },
        },
        card: {
          padding: 20,
        },
      },
    } as Partial<Theme>);

    assert.equal(theme.components.button.height.md, 42);
    assert.equal(
      theme.components.button.height.sm,
      defaultTheme.components.button.height.sm
    );
    assert.equal(theme.components.button.opacity.pressed, 0.72);
    assert.equal(
      theme.components.button.opacity.disabled,
      defaultTheme.components.button.opacity.disabled
    );

    assert.equal(theme.components.input.paddingX.lg, 28);
    assert.equal(
      theme.components.input.paddingX.md,
      defaultTheme.components.input.paddingX.md
    );
    assert.equal(
      theme.components.input.height.md,
      defaultTheme.components.input.height.md
    );

    assert.equal(theme.components.card?.padding, 20);
    assert.equal(
      theme.components.card?.radius,
      defaultTheme.components.card?.radius
    );
    assert.equal(
      theme.components.card?.shadow,
      defaultTheme.components.card?.shadow
    );
  });

  it("preserves required theme structure for partial component overrides", () => {
    const theme = createTheme({
      components: {
        button: {
          height: {
            lg: 54,
          },
        },
      },
    } as Partial<Theme>);

    assert.equal(theme.components.button.height.lg, 54);
    assert.equal(
      theme.components.button.paddingX.md,
      defaultTheme.components.button.paddingX.md
    );
    assert.equal(
      theme.components.button.iconSize.md,
      defaultTheme.components.button.iconSize.md
    );
    assert.equal(
      theme.components.input.height.md,
      defaultTheme.components.input.height.md
    );
    assert.equal(
      theme.components.card?.shadow,
      defaultTheme.components.card?.shadow
    );
  });

  it("does not let undefined override values erase required base values", () => {
    const theme = createTheme({
      colors: {
        primary: undefined,
      },
      components: {
        button: {
          opacity: {
            disabled: undefined,
          },
        },
      },
    } as Partial<Theme>);

    assert.equal(theme.colors.primary, defaultTheme.colors.primary);
    assert.equal(
      theme.components.button.opacity.disabled,
      defaultTheme.components.button.opacity.disabled
    );
  });

  it("safely rejects invalid object branch replacements forced past TypeScript", () => {
    const theme = createTheme({
      colors: null,
      radius: "invalid",
      size: {
        height: [],
      },
      components: {
        button: [],
        input: null,
        card: "invalid",
      },
    } as unknown as Partial<Theme>);

    assert.equal(theme.colors.primary, defaultTheme.colors.primary);
    assert.equal(theme.radius.md, defaultTheme.radius.md);
    assert.equal(theme.size.height.md, defaultTheme.size.height.md);
    assert.equal(
      theme.components.button.height.md,
      defaultTheme.components.button.height.md
    );
    assert.equal(
      theme.components.input.height.md,
      defaultTheme.components.input.height.md
    );
    assert.equal(
      theme.components.card?.padding,
      defaultTheme.components.card?.padding
    );
  });
});
