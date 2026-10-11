import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { createBaseTheme } from "../../src/theme/defaultTheme";
import { resolveColors } from "../../src/tokens/colors.base";
import type {
  DeepPartial,
  DensityLevel,
  ThemePreference,
} from "../../src/theme/contract";
import type { Theme, ThemeMode } from "../../src/theme/types";

const SLOTS = [
  "semantic",
  "textStyles",
  "elevation",
  "motion",
  "density",
  "breakpoints",
  "borderWidth",
  "opacity",
  "preset",
] as const;

function keyShape(value: unknown): unknown {
  if (value === null || typeof value !== "object") return typeof value;
  return Object.fromEntries(
    Object.keys(value as object)
      .sort()
      .map((k) => [k, keyShape((value as Record<string, unknown>)[k])])
  );
}

const shadowShape = {
  elevation: "number",
  shadowColor: "string",
  shadowOffset: { height: "number", width: "number" },
  shadowOpacity: "number",
  shadowRadius: "number",
};

const bezierShape = { 0: "number", 1: "number", 2: "number", 3: "number" };
const springShape = { damping: "number", mass: "number", stiffness: "number" };

describe("Theme contract v2", () => {
  for (const mode of ["light", "dark"] as const) {
    it(`createBaseTheme(${mode}) defines every v2 slot`, () => {
      const theme: Theme = createBaseTheme(mode);
      for (const slot of SLOTS) {
        assert.notEqual(theme[slot], undefined, `slot ${slot} must be defined`);
      }
      assert.equal(theme.preset, "base");
      assert.deepEqual(theme.colors, resolveColors(mode));
    });
  }

  it("types: ThemeMode stays light|dark, ThemePreference adds system", () => {
    const modes: ThemeMode[] = ["light", "dark"];
    const prefs: ThemePreference[] = [...modes, "system"];
    const level: DensityLevel = "regular";
    const partial: DeepPartial<Theme> = { motion: { duration: { fast: 1 } } };
    assert.equal(prefs.length, 3);
    assert.equal(level, "regular");
    assert.equal(partial.motion?.duration?.fast, 1);
  });

  it("semantic tokens follow the mode", () => {
    const light = createBaseTheme("light");
    const dark = createBaseTheme("dark");
    assert.equal(light.semantic.text.primary, light.colors.textPrimary);
    assert.equal(dark.semantic.text.primary, dark.colors.textPrimary);
  });

  it("keeps a stable key shape", () => {
    const shape = keyShape(
      Object.fromEntries(SLOTS.map((s) => [s, createBaseTheme("light")[s]]))
    );
    assert.deepEqual(shape, {
      borderWidth: { hairline: "number", thin: "number", thick: "number" },
      breakpoints: { lg: "number", md: "number", sm: "number", xl: "number" },
      density: {
        default: "string",
        scale: { comfortable: "number", compact: "number", regular: "number" },
      },
      elevation: {
        lg: shadowShape,
        md: shadowShape,
        none: shadowShape,
        sm: shadowShape,
      },
      motion: {
        distance: { lg: "number", md: "number", sm: "number" },
        duration: { base: "number", fast: "number", instant: "number", slow: "number", slower: "number" },
        easing: { accelerate: bezierShape, decelerate: bezierShape, emphasized: bezierShape, standard: bezierShape },
        scale: { press: "number" },
        spring: { bouncy: springShape, gentle: springShape, snappy: springShape },
        stagger: { base: "number", fast: "number" },
      },
      opacity: { disabled: "number", pressed: "number", subtle: "number" },
      preset: "string",
      semantic: {
        action: { disabled: "string", primary: "string", primaryActive: "string", primaryHover: "string" },
        border: { default: "string", divider: "string", focus: "string" },
        feedback: { error: "string", info: "string", success: "string", warning: "string" },
        surface: { base: "string", overlay: "string", raised: "string", sunken: "string" },
        text: { disabled: "string", inverted: "string", muted: "string", primary: "string", secondary: "string" },
      },
      textStyles: {
        body: { fontFamily: "string", fontSize: "number", fontWeight: "string" },
        caption: { fontFamily: "string", fontSize: "number", fontWeight: "string" },
        code: { fontFamily: "string", fontSize: "number", fontWeight: "string" },
        display: { fontFamily: "string", fontSize: "number", fontWeight: "string" },
        heading: { fontFamily: "string", fontSize: "number", fontWeight: "string" },
        label: { fontFamily: "string", fontSize: "number", fontWeight: "string" },
        title: { fontFamily: "string", fontSize: "number", fontWeight: "string" },
      },
    });
  });
});
