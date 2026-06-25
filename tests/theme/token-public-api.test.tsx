import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  createThemeTokens,
  defaultThemeTokens,
  type ThemeTokens,
} from "../../src";
import { darkColors, lightColors } from "../../src/tokens/colors.base";

describe("token public API", () => {
  it("exports neutral default and factory token names from the public API", () => {
    const defaultTokens: ThemeTokens = defaultThemeTokens;
    const lightTokens = createThemeTokens("light");
    const darkTokens = createThemeTokens("dark");

    assert.equal(defaultTokens, lightTokens);
    assert.equal(defaultTokens.colors.surface.background, lightColors.background);
    assert.equal(darkTokens.colors.surface.background, darkColors.background);
    assert.equal(darkTokens.colors.text.primary, darkColors.textPrimary);
  });
});
