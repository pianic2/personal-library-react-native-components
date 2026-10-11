import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { borderWidth, opacity } from "../../src/tokens/border.base";
import { density } from "../../src/tokens/density.base";
import { radius } from "../../src/tokens/radius.base";
import { height, iconSize, size } from "../../src/tokens/size.base";
import { space, spacing } from "../../src/tokens/spacing.base";
import { defaultTheme } from "../../src/theme/defaultTheme";

const root = resolve(import.meta.dirname, "../..");

describe("PLRNUI-169 scale tokens", () => {
  it("keeps every previous spacing, space, radius and size key with its value", () => {
    assert.deepEqual(
      Object.fromEntries(Object.entries(spacing).filter(([k]) => ["0", "4", "8", "12", "20", "30", "80"].includes(k))),
      { 0: 0, 4: 4, 8: 8, 12: 12, 20: 20, 30: 30, 80: 80 },
    );
    assert.deepEqual(space, { none: 0, xs: 4, sm: 8, md: 12, lg: 20, xl: 30, xxl: 80 });
    assert.deepEqual({ none: radius.none, xs: radius.xs, sm: radius.sm, md: radius.md, lg: radius.lg, xl: radius.xl, full: radius.full }, { none: 0, xs: 4, sm: 6, md: 10, lg: 16, xl: 24, full: 9999 });
    assert.deepEqual({ xs: height.xs, sm: height.sm, md: height.md, lg: height.lg }, { xs: 26, sm: 32, md: 40, lg: 48 });
  });

  it("adds the spacing steps 16, 24, 32, 40, 48 and 64 and keeps the scale strictly increasing", () => {
    for (const step of [16, 24, 32, 40, 48, 64]) assert.equal((spacing as Record<number, number>)[step], step, String(step));
    const values = Object.keys(spacing)
      .map(Number)
      .sort((a, b) => a - b)
      .map((k) => (spacing as Record<number, number>)[k]!);
    assert.deepEqual(values, [...values].sort((a, b) => a - b));
    assert.equal(new Set(values).size, values.length, "no duplicate step");
    assert.ok(values.every((v, i) => i === 0 || v > values[i - 1]!), "strictly increasing");
  });

  it("every spacing key equals its value", () => {
    for (const [key, value] of Object.entries(spacing)) assert.equal(Number(key), value);
  });

  it("adds the pill radius as an alias of full", () => {
    assert.equal(radius.pill, radius.full);
  });

  it("adds control height xl above lg, and icon sizes that increase", () => {
    assert.ok(height.xl > height.lg);
    const icons = Object.values(iconSize);
    assert.deepEqual(icons, [...icons].sort((a, b) => a - b));
    assert.equal(new Set(icons).size, icons.length);
    assert.equal(size.icon, iconSize);
    assert.equal(size.height, height);
  });

  it("defines border widths and state opacities", () => {
    assert.deepEqual(Object.keys(borderWidth), ["none", "hairline", "thin", "medium"]);
    assert.equal(borderWidth.none, 0);
    assert.ok(borderWidth.hairline > 0 && borderWidth.hairline < borderWidth.thin && borderWidth.thin < borderWidth.medium);
    assert.deepEqual(Object.keys(opacity), ["disabled", "pressed", "hover", "scrim"]);
    for (const value of Object.values(opacity)) assert.ok(value > 0 && value < 1);
    assert.ok(opacity.disabled < opacity.pressed && opacity.pressed < opacity.hover, "disabled is the faintest, hover the closest to opaque");
  });

  it("the density table has three levels with multipliers around 1", () => {
    assert.equal(Object.keys(density.scale).length, 3);
    const values = Object.values(density.scale);
    assert.ok(values.includes(1));
    assert.ok(Math.min(...values) < 1 && Math.max(...values) > 1);
    assert.deepEqual(values, [...values].sort((a, b) => a - b));
  });

  it("reaches the default theme", () => {
    assert.equal(defaultTheme.spacing[16], 16);
    assert.equal(defaultTheme.radius.pill, radius.pill);
    assert.equal(defaultTheme.size.icon.md, iconSize.md);
    assert.equal(defaultTheme.size.height.xl, height.xl);
  });

  it("border.base.ts holds no numbers outside its tables", () => {
    const source = readFileSync(resolve(root, "src/tokens/border.base.ts"), "utf8");
    const outsideTables = source.replace(/export const \w+ = \{[\s\S]*?\} as const;/g, "");
    assert.doesNotMatch(outsideTables.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, ""), /\d/);
  });
});
