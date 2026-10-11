import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";

import { createTheme, mergeThemes } from "../../src/theme/createTheme";
import { createBaseTheme } from "../../src/theme/defaultTheme";
import { defineTheme } from "../../src/theme/defineTheme";

const globals = globalThis as { __DEV__?: boolean };
const originalDev = globals.__DEV__;
const originalWarn = console.warn;
afterEach(() => {
  globals.__DEV__ = originalDev;
  console.warn = originalWarn;
});

function captureWarnings(): string[] {
  const warnings: string[] = [];
  console.warn = (...args: unknown[]) => void warnings.push(String(args[0]));
  return warnings;
}

describe("PLRNUI-189 defineTheme", () => {
  it("with no input returns the base theme of each mode", () => {
    const preset = defineTheme();
    assert.deepEqual(preset.light, createBaseTheme("light"));
    assert.deepEqual(preset.dark, createBaseTheme("dark"));
  });

  it("an override of only dark leaves light untouched", () => {
    const preset = defineTheme({ dark: { colors: { primary: "#112233" } } });
    assert.deepEqual(preset.light, createBaseTheme("light"));
    assert.equal(preset.dark.colors.primary, "#112233");
    assert.equal(preset.dark.colors.background, createBaseTheme("dark").colors.background);
    assert.notEqual(preset.dark.colors.primary, preset.light.colors.primary);
  });

  it("an override of only light leaves dark untouched, and nested siblings survive", () => {
    const preset = defineTheme({ light: { radius: { md: 13 }, components: { button: { height: { md: 50 } } } } });
    assert.deepEqual(preset.dark, createBaseTheme("dark"));
    assert.equal(preset.light.radius.md, 13);
    assert.equal(preset.light.radius.sm, createBaseTheme("light").radius.sm);
    assert.equal(preset.light.components.button.height.md, 50);
    assert.equal(preset.light.components.button.height.sm, createBaseTheme("light").components.button.height.sm);
  });

  it("extends a preset mode by mode, and a single theme for both modes", () => {
    const parent = defineTheme({ light: { radius: { md: 21 } }, dark: { radius: { md: 22 } } });
    const child = defineTheme({ extends: parent, dark: { radius: { sm: 5 } } });
    assert.equal(child.light.radius.md, 21);
    assert.equal(child.dark.radius.md, 22);
    assert.equal(child.dark.radius.sm, 5);
    assert.equal(child.light.radius.sm, createBaseTheme("light").radius.sm);

    const fromTheme = defineTheme({ extends: createTheme({ radius: { md: 9 } }), dark: { radius: { lg: 30 } } });
    assert.equal(fromTheme.light.radius.md, 9);
    assert.equal(fromTheme.dark.radius.md, 9);
    assert.equal(fromTheme.dark.radius.lg, 30);
    assert.equal(fromTheme.light.radius.lg, createBaseTheme("light").radius.lg);
  });

  it("does not mutate the base themes, the parent preset or the override objects", () => {
    const parent = defineTheme({ light: { radius: { md: 21 } } });
    const snapshot = JSON.stringify(parent);
    const light = { colors: { primary: "#abcdef" } };
    const lightSnapshot = JSON.stringify(light);
    defineTheme({ extends: parent, light });
    assert.equal(JSON.stringify(parent), snapshot);
    assert.equal(JSON.stringify(light), lightSnapshot);
    assert.deepEqual(createBaseTheme("light"), createBaseTheme("light"));
  });

  it("a mismatched override throws in dev, naming the path, and leaves the base untouched", () => {
    globals.__DEV__ = true;
    const base = createBaseTheme("light");
    const snapshot = JSON.stringify(base);
    assert.throws(() => defineTheme({ light: { radius: "round" } as never }), /override "radius" must be object but received string/);
    assert.throws(() => createTheme({ colors: { primary: 5 } } as never), /override "colors\.primary" must be string but received number/);
    assert.equal(JSON.stringify(base), snapshot);
    assert.equal(JSON.stringify(createBaseTheme("light")), snapshot);
  });

  it("a mismatched override warns in production, is ignored and leaves the base untouched", () => {
    globals.__DEV__ = false;
    const warnings = captureWarnings();
    const base = createBaseTheme("light");
    const snapshot = JSON.stringify(base);
    const theme = createTheme({ colors: { primary: 5 }, radius: [1, 2], size: { height: null } } as never, base);
    assert.equal(theme.colors.primary, base.colors.primary);
    assert.equal(theme.radius.md, base.radius.md);
    assert.equal(theme.size.height.md, base.size.height.md);
    assert.equal(warnings.length, 3);
    assert.match(warnings[0]!, /override "colors\.primary" must be string but received number/);
    assert.match(warnings[1]!, /override "radius" must be object but received array/);
    assert.match(warnings[2]!, /override "size\.height" must be object but received null/);
    assert.equal(JSON.stringify(base), snapshot);
  });
});

describe("PLRNUI-189 createTheme and mergeThemes", () => {
  it("createTheme(undefined) equals the base theme by value, without warnings", () => {
    const warnings = captureWarnings();
    assert.deepEqual(createTheme(undefined), createBaseTheme("light"));
    assert.deepEqual(createTheme(undefined, createBaseTheme("dark")), createBaseTheme("dark"));
    assert.deepEqual(warnings, []);
  });

  it("arrays replace instead of merging", () => {
    const base = { list: [1, 2, 3], nested: { keep: true } };
    const merged = mergeThemes(base, { list: [9] } as never);
    assert.deepEqual(merged.list, [9]);
    assert.deepEqual(merged.nested, { keep: true });
    assert.deepEqual(base.list, [1, 2, 3]);
  });

  it("merges layers left to right and later layers win; undefined layers and values are skipped", () => {
    const base = { a: 1, b: { c: 2, d: 3 } };
    const merged = mergeThemes(base, { b: { c: 20 } }, undefined, { b: { d: undefined, c: 30 }, a: 4 } as never);
    assert.deepEqual(merged, { a: 4, b: { c: 30, d: 3 } });
    assert.deepEqual(base, { a: 1, b: { c: 2, d: 3 } });
    assert.notEqual(merged, base);
  });

  it("adds a token the base does not define yet, and still type-checks it in a later layer", () => {
    globals.__DEV__ = true;
    const merged = mergeThemes({ a: 1 } as { a: number; extra?: { x: number } }, { extra: { x: 1 } }, { extra: { x: 2 } });
    assert.deepEqual(merged.extra, { x: 2 });
    assert.throws(() => mergeThemes({ a: 1 } as { a: number; extra?: { x: number } }, { extra: { x: 1 } }, { extra: "no" } as never), /override "extra" must be object but received string/);
  });

  it("a boolean, number or string mismatch is reported with the received kind", () => {
    globals.__DEV__ = true;
    assert.throws(() => mergeThemes({ on: true }, { on: "yes" } as never), /override "on" must be boolean but received string/);
    assert.throws(() => mergeThemes({ n: 1 }, { n: true } as never), /override "n" must be number but received boolean/);
    assert.throws(() => mergeThemes({ list: [1] }, { list: {} } as never), /override "list" must be array but received object/);
  });
});
