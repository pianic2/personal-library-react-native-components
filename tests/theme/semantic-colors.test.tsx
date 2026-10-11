import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createThemeTokens } from "../../src";
import { darkColors, lightColors } from "../../src/tokens/colors.base";
import { palette } from "../../src/tokens/palette";
import { createSemanticRoles, stateLayer, type ColorPair } from "../../src/tokens/semantic.base";
import { createBaseTheme } from "../../src/theme/defaultTheme";

// Inline WCAG helpers (the shared contrast helper of E2-11 does not exist yet).
function luminance(hex: string): number {
  const [r, g, b] = (hex.slice(1, 7).match(/../g) ?? []).map((pair) => {
    const s = parseInt(pair, 16) / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

// The colour keys and values as they were before PLRNUI-152 (the dark surfaces are the intended change).
const PREVIOUS_LIGHT = {
  primary: "#5B7CFF", primaryHover: "#4A6BEE", primaryActive: "#3A5ADD",
  secondary: "#FF9F43", secondaryHover: "#F08E32", secondaryActive: "#E07E22",
  accent: "#22C55E", success: "#16A34A", warning: "#F59E0B", error: "#DC2626", info: "#2563EB",
  background: "#FFFFFF", surface: "#F4F4F4", surfaceElevated: "#FFFFFF",
  textPrimary: "#020408ff", textSecondary: "#475569", textMuted: "#94A3B8", textInverted: "#FFFFFF",
  border: "#E2E8F0", divider: "#CBD5E1", outline: "#94A3B8", disabled: "#CBD5E1", disabledBg: "#F1F5F9",
  overlay: "rgba(15, 23, 42, 0.6)", backdrop: "rgba(0, 0, 0, 0.4)",
  codeBorder: "#E2E8F0", codeBg: "#F1F5F9", codeText: "#0F172A",
};
const PREVIOUS_DARK = {
  primary: "#8DA2FF", primaryHover: "#7B92FF", primaryActive: "#6A82FF",
  secondary: "#FFB86B", secondaryHover: "#FCA84E", secondaryActive: "#F39838",
  accent: "#4ADE80", success: "#22C55E", warning: "#FBBF24", error: "#F87171", info: "#60A5FA",
  background: "#020617", surface: "#020617", surfaceElevated: "#020617",
  textPrimary: "#F8FAFC", textSecondary: "#CBD5E1", textMuted: "#94A3B8", textInverted: "#020617",
  border: "#1E293B", divider: "#334155", outline: "#475569", disabled: "#334155", disabledBg: "#020617",
  overlay: "rgba(2, 6, 23, 0.7)", backdrop: "rgba(0, 0, 0, 0.6)",
  codeBorder: "#475569", codeBg: "#0F172A", codeText: "#F8FAFC",
};

describe("PLRNUI-152 legacy colours", () => {
  it("keeps every key of the previous light and dark colours", () => {
    assert.deepEqual(Object.keys(lightColors), Object.keys(PREVIOUS_LIGHT));
    assert.deepEqual(Object.keys(darkColors), Object.keys(PREVIOUS_DARK));
  });

  it("keeps every light value (textPrimary is the same colour without the opaque alpha)", () => {
    for (const [key, value] of Object.entries(PREVIOUS_LIGHT)) {
      const expected = key === "textPrimary" ? "#020408" : value;
      assert.equal((lightColors as Record<string, string>)[key], expected, key);
    }
  });

  it("keeps every dark value except the three surfaces", () => {
    for (const [key, value] of Object.entries(PREVIOUS_DARK)) {
      if (["surface", "surfaceElevated"].includes(key)) continue;
      assert.equal((darkColors as Record<string, string>)[key], value, key);
    }
  });

  it("all legacy colours are exposed on theme.colors", () => {
    for (const mode of ["light", "dark"] as const) {
      const theme = createBaseTheme(mode);
      for (const key of Object.keys(PREVIOUS_LIGHT)) assert.ok(key in theme.colors, `${mode}.${key}`);
    }
  });

  it("keeps the theme token key lists", () => {
    const tokens = createThemeTokens();
    assert.deepEqual(Object.keys(tokens), ["typography", "spacing", "radius", "elevation", "colors"]);
    assert.deepEqual(Object.keys(tokens.colors), ["surface", "text", "border", "brand", "feedback"]);
    assert.deepEqual(Object.keys(tokens.colors.surface), ["background", "surface", "surfaceElevated", "overlay", "backdrop"]);
    assert.deepEqual(Object.keys(tokens.colors.text), ["primary", "secondary", "muted", "inverted"]);
    assert.deepEqual(Object.keys(tokens.colors.border), ["border", "divider", "outline"]);
    assert.deepEqual(Object.keys(tokens.colors.brand), ["primary", "secondary", "accent"]);
    assert.deepEqual(Object.keys(tokens.colors.feedback), ["success", "warning", "error", "info"]);
  });

  it("derives the theme tokens from the semantic roles with the same values as the legacy colours", () => {
    for (const mode of ["light", "dark"] as const) {
      const colors = mode === "dark" ? darkColors : lightColors;
      const t = createThemeTokens(mode).colors;
      assert.equal(t.surface.background, colors.background);
      assert.equal(t.surface.surface, colors.surface);
      assert.equal(t.surface.surfaceElevated, colors.surfaceElevated);
      assert.equal(t.surface.overlay, colors.overlay);
      assert.equal(t.text.primary, colors.textPrimary);
      assert.equal(t.text.secondary, colors.textSecondary);
      assert.equal(t.border.outline, colors.outline);
      assert.equal(t.brand.primary, colors.primary);
      assert.equal(t.brand.secondary, colors.secondary);
      assert.equal(t.feedback.error, colors.error);
    }
  });
});

describe("PLRNUI-152 surface tiers", () => {
  it("dark background and surface tiers 1..3 are pairwise distinct", () => {
    const s = createSemanticRoles("dark").surface;
    const values = [s[0], s[1], s[2], s[3]];
    assert.equal(new Set(values).size, 4);
  });

  it("the dark legacy background, surface and surfaceElevated are pairwise distinct", () => {
    assert.equal(new Set([darkColors.background, darkColors.surface, darkColors.surfaceElevated]).size, 3);
  });

  it("each dark tier is lighter than the one below it", () => {
    const dark = createSemanticRoles("dark").surface;
    for (const i of [1, 2, 3] as const) assert.ok(luminance(dark[i]) > luminance(dark[(i - 1) as 0 | 1 | 2]), `dark tier ${i}`);
  });

  it("the light tiers are pairwise distinct too", () => {
    const s = createSemanticRoles("light").surface;
    assert.equal(new Set([s[0], s[1], s[2], s[3]]).size, 4);
  });
});

describe("PLRNUI-152 contrast of the on* roles", () => {
  for (const mode of ["light", "dark"] as const) {
    const roles = createSemanticRoles(mode);

    it(`${mode}: onSurface and onSurfaceMuted are >= 4.5:1 on every surface tier`, () => {
      for (const tier of [0, 1, 2, 3] as const) {
        assert.ok(ratio(roles.onSurface, roles.surface[tier]) >= 4.5, `onSurface on tier ${tier}`);
        assert.ok(ratio(roles.onSurfaceMuted, roles.surface[tier]) >= 4.5, `onSurfaceMuted on tier ${tier}`);
      }
    });

    for (const name of ["primary", "secondary", "error"] as const) {
      it(`${mode}: on${name} and onContainer meet 4.5:1 on their pair`, () => {
        const pair: ColorPair = roles[name];
        assert.ok(ratio(pair.on, pair.main) >= 4.5, `${name}.on on ${name}.main = ${ratio(pair.on, pair.main).toFixed(2)}`);
        assert.ok(ratio(pair.onContainer, pair.container) >= 4.5, `${name}.onContainer on container = ${ratio(pair.onContainer, pair.container).toFixed(2)}`);
      });
    }

    it(`${mode}: the focus ring is visible (>= 3:1) on every surface tier`, () => {
      for (const tier of [0, 1, 2, 3] as const) assert.ok(ratio(roles.focusRing, roles.surface[tier]) >= 3, `focusRing on tier ${tier}`);
    });
  }
});

describe("PLRNUI-152 state layers, scrim and palette", () => {
  it("defines the state layer opacities", () => {
    assert.deepEqual(stateLayer, { hover: 0.08, pressed: 0.12, focus: 0.12, selected: 0.16, dragged: 0.16 });
    assert.equal(createSemanticRoles("light").stateLayer, stateLayer);
    assert.equal(createSemanticRoles("dark").stateLayer, stateLayer);
  });

  it("has a scrim per mode", () => {
    assert.match(createSemanticRoles("light").scrim, /^rgba\(/);
    assert.notEqual(createSemanticRoles("light").scrim, createSemanticRoles("dark").scrim);
  });

  it("defines the ramps with the steps 50..950, valid hex values and falling luminance", () => {
    const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
    assert.deepEqual(Object.keys(palette).sort(), ["brand", "error", "info", "neutral", "secondary", "success", "warning"]);
    for (const [name, ramp] of Object.entries(palette)) {
      assert.deepEqual(Object.keys(ramp).map(Number), [...steps], name);
      for (const step of steps) assert.match(ramp[step], /^#[0-9A-F]{6}$/, `${name}.${step}`);
      for (let i = 1; i < steps.length; i += 1) {
        assert.ok(luminance(ramp[steps[i]!]) < luminance(ramp[steps[i - 1]!]), `${name}: ${steps[i]} is darker than ${steps[i - 1]}`);
      }
    }
  });
});
