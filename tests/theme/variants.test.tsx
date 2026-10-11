import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import TestRenderer, { act } from "react-test-renderer";
import { createBaseTheme } from "../../src/theme/defaultTheme.js";
import { createTheme } from "../../src/theme/createTheme.js";
import { ThemeProvider } from "../../src/theme/ThemeProvider.js";
import { useVariants } from "../../src/theme/useVariants.js";
import { defineVariants, mergeDeep, resolveVariants } from "../../src/theme/variants.js";
import { buttonVariants } from "../../src/theme/variants/button.variants.js";
import type { Theme } from "../../src/theme/types.js";

const light = createBaseTheme("light");
const dark = createBaseTheme("dark");

// A small definition that makes the merge order observable.
const order = defineVariants(
  () => ({
    slots: ["root", "label"],
    base: { root: { padding: 1, margin: 1, opacity: 1 }, label: { fontSize: 10 } },
    variants: {
      tone: { quiet: { root: { padding: 2 } }, loud: { root: { padding: 3, margin: 3 } } },
      size: { sm: { root: { margin: 4 } }, lg: { root: { margin: 5 }, label: { fontSize: 20 } } },
    },
    states: { pressed: { root: { opacity: 0.5 } }, disabled: { root: { opacity: 0.2, margin: 9 } } },
    compoundVariants: [
      { when: { tone: "loud", size: "lg" }, style: { root: { padding: 7 } } },
      { when: { tone: "loud" }, style: { root: { margin: 8 } } },
    ],
    defaultVariants: { tone: "quiet", size: "sm" },
  }),
  { name: "order" }
);

describe("PLRNUI-181 resolve order: base, variants, compound, states", () => {
  it("defaultVariants apply when no props are given", () => {
    const s = resolveVariants(light, order);
    assert.deepEqual(s.root, { padding: 2, margin: 4, opacity: 1 });
    assert.deepEqual(s.label, { fontSize: 10 });
  });

  it("explicit props win over defaultVariants and a later group wins over an earlier one", () => {
    const s = resolveVariants(light, order, { tone: "loud", size: "lg" });
    // base -> tone loud (padding 3, margin 3) -> size lg (margin 5) -> compound loud+lg (padding 7) -> compound loud (margin 8)
    assert.deepEqual(s.root, { padding: 7, margin: 8, opacity: 1 });
    assert.deepEqual(s.label, { fontSize: 20 });
  });

  it("states come last, in declaration order, and only when the flag is true", () => {
    const pressed = resolveVariants(light, order, {}, { pressed: true });
    assert.equal(pressed.root.opacity, 0.5);
    const both = resolveVariants(light, order, {}, { pressed: true, disabled: true });
    assert.equal((both.root as { opacity: number }).opacity, 0.2, "disabled is declared after pressed");
    assert.equal((both.root as { margin: number }).margin, 9, "a state overrides the variant margin");
    const off = resolveVariants(light, order, {}, { pressed: false });
    assert.equal(off.root.opacity, 1);
  });

  it("a compound variant applies only when every listed group matches", () => {
    assert.equal((resolveVariants(light, order, { tone: "loud", size: "sm" }).root as { padding: number }).padding, 3);
    assert.equal((resolveVariants(light, order, { tone: "quiet", size: "lg" }).root as { padding: number }).padding, 2);
  });

  it("an invalid option or an unknown group falls back to the default and never throws", () => {
    const s = resolveVariants(light, order, { tone: "nope", extra: "x", size: undefined } as never);
    assert.deepEqual(s.root, { padding: 2, margin: 4, opacity: 1 });
    const proto = resolveVariants(light, order, { tone: "toString", size: "constructor" } as never);
    assert.deepEqual(proto.root, { padding: 2, margin: 4, opacity: 1 }, "inherited keys are not options");
  });

  it("every declared slot is present, empty slots are an empty frozen style, results are frozen", () => {
    const only = defineVariants(() => ({ slots: ["a", "b"], base: { a: { opacity: 1 } } }));
    const s = resolveVariants(light, only);
    assert.deepEqual(Object.keys(s), ["a", "b"]);
    assert.deepEqual(s.b, {});
    assert.ok(Object.isFrozen(s) && Object.isFrozen(s.a) && Object.isFrozen(s.b));
  });
});

describe("PLRNUI-181 memoization and theme changes", () => {
  it("the same inputs return the same object, a different selection or state a different one", () => {
    const a = resolveVariants(light, order, { tone: "loud" }, { pressed: true });
    const b = resolveVariants(light, order, { tone: "loud" }, { pressed: true });
    assert.equal(a, b);
    assert.equal(resolveVariants(light, order, { tone: "loud", size: "sm" }, { pressed: true }), a, "explicit default equals the default");
    assert.notEqual(resolveVariants(light, order, { tone: "quiet" }, { pressed: true }), a);
    assert.notEqual(resolveVariants(light, order, { tone: "loud" }, { pressed: false }), a);
  });

  it("the order of the state flags does not change the identity", () => {
    const a = resolveVariants(light, order, {}, { pressed: true, disabled: true });
    const b = resolveVariants(light, order, {}, { disabled: true, pressed: true });
    assert.equal(a, b);
  });

  it("a different theme recomputes from the new theme tokens", () => {
    const l = resolveVariants(light, buttonVariants, { variant: "outline" });
    const d = resolveVariants(dark, buttonVariants, { variant: "outline" });
    assert.notEqual(l, d);
    assert.equal(l.label.color, light.semantic.text.primary);
    assert.equal(d.label.color, dark.semantic.text.primary);
    assert.notEqual(light.semantic.text.primary, dark.semantic.text.primary, "the fixture themes really differ");
    assert.equal(resolveVariants(light, buttonVariants, { variant: "outline" }), l, "the first theme still has its cache");
  });

  it("the definition is evaluated once per theme", () => {
    let calls = 0;
    const counted = defineVariants(() => {
      calls += 1;
      return { slots: ["root"], variants: { tone: { a: { root: { opacity: 1 } }, b: { root: { opacity: 0.5 } } } } };
    });
    const theme = createBaseTheme("light");
    resolveVariants(theme, counted, { tone: "a" });
    resolveVariants(theme, counted, { tone: "b" });
    resolveVariants(theme, counted, { tone: "a" });
    assert.equal(calls, 1);
    resolveVariants(createBaseTheme("light"), counted, { tone: "a" });
    assert.equal(calls, 2);
  });
});

describe("PLRNUI-181 reference buttonVariants", () => {
  it("builds root and label styles from the theme tokens for every variant and size", () => {
    const solid = resolveVariants(light, buttonVariants);
    assert.equal(solid.root.backgroundColor, light.semantic.action.primary);
    assert.equal(solid.label.color, light.semantic.text.inverted);
    assert.equal(solid.root.minHeight, light.size.height.md, "default size is md");
    for (const variant of ["solid", "outline", "ghost", "danger"] as const)
      for (const size of ["sm", "md", "lg"] as const) {
        const s = resolveVariants(light, buttonVariants, { variant, size });
        assert.equal(s.root.minHeight, light.size.height[size]);
      }
    assert.equal(resolveVariants(light, buttonVariants, { variant: "danger" }).root.backgroundColor, light.semantic.feedback.error);
  });

  it("states and the ghost+sm compound variant", () => {
    const disabled = resolveVariants(light, buttonVariants, {}, { disabled: true });
    assert.equal(disabled.root.opacity, light.opacity.disabled);
    assert.equal(resolveVariants(light, buttonVariants, {}, { pressed: true }).root.backgroundColor, light.semantic.action.primaryActive);
    assert.equal(resolveVariants(light, buttonVariants, { variant: "ghost", size: "sm" }).root.paddingHorizontal, light.space.sm);
    assert.equal(resolveVariants(light, buttonVariants, { variant: "ghost", size: "md" }).root.paddingHorizontal, light.space.lg);
  });
});

describe("PLRNUI-181 theme.variants overrides", () => {
  function themed(variants: NonNullable<Theme["variants"]>): Theme {
    return createTheme({ variants });
  }

  it("a theme.variants.button override changes the computed slot style and keeps the rest (deep merge)", () => {
    const theme = themed({ button: { variants: { variant: { solid: { root: { backgroundColor: "teal" } } } } } });
    const s = resolveVariants(theme, buttonVariants);
    assert.equal(s.root.backgroundColor, "teal");
    assert.equal(s.label.color, theme.semantic.text.inverted, "label of the same option is untouched");
    assert.equal(s.root.borderRadius, theme.radius.md, "base is untouched");
    assert.equal(resolveVariants(theme, buttonVariants, { variant: "danger" }).root.backgroundColor, theme.semantic.feedback.error);
    assert.equal(resolveVariants(light, buttonVariants).root.backgroundColor, light.semantic.action.primary, "the base theme is unaffected");
  });

  it("overrides base, states and defaultVariants", () => {
    const theme = themed({
      button: {
        base: { root: { borderRadius: 99 } },
        states: { disabled: { root: { opacity: 0.1 } } },
        defaultVariants: { size: "lg" },
      },
    });
    assert.equal(resolveVariants(theme, buttonVariants).root.borderRadius, 99);
    assert.equal(resolveVariants(theme, buttonVariants, {}, { disabled: true }).root.opacity, 0.1);
    assert.equal(resolveVariants(theme, buttonVariants).root.minHeight, theme.size.height.lg);
    assert.equal(resolveVariants(theme, buttonVariants, { size: "sm" }).root.minHeight, theme.size.height.sm, "a prop still wins");
  });

  it("an override under another name, or for a definition without a name, is ignored", () => {
    const theme = themed({ other: { base: { root: { borderRadius: 1 } } } });
    assert.equal(resolveVariants(theme, buttonVariants).root.borderRadius, theme.radius.md);
    const unnamed = defineVariants(() => ({ slots: ["root"], base: { root: { opacity: 1 } } }));
    assert.deepEqual(resolveVariants(themed({ button: { base: { root: { opacity: 0 } } } }), unnamed).root, { opacity: 1 });
  });

  it("an override can add an option and a __proto__ key is ignored", () => {
    const polluted = JSON.parse('{"button":{"variants":{"variant":{"__proto__":{"root":{"opacity":0}},"neon":{"root":{"backgroundColor":"lime"}}}}}}') as NonNullable<Theme["variants"]>;
    const theme = themed(polluted);
    assert.equal(resolveVariants(theme, buttonVariants, { variant: "neon" } as never).root.backgroundColor, "lime");
    assert.equal(({} as { root?: unknown }).root, undefined, "Object.prototype is not polluted");
  });

  it("mergeDeep replaces arrays, skips undefined and does not mutate its inputs", () => {
    const target = { a: { b: 1, c: [1, 2] }, d: 1 };
    const source = { a: { b: undefined, c: [3] }, e: 2 };
    const merged = mergeDeep(target, source);
    assert.deepEqual(merged, { a: { b: 1, c: [3] }, d: 1, e: 2 });
    assert.deepEqual(target, { a: { b: 1, c: [1, 2] }, d: 1 });
  });
});

describe("PLRNUI-181 useVariants", () => {
  it("resolves from the ThemeProvider theme, recomputes when the theme changes and returns the same object otherwise", () => {
    const seen: Array<ReturnType<typeof useVariants<typeof buttonVariants>>> = [];
    function Probe({ variant }: { variant: "solid" | "outline" }) {
      seen.push(useVariants(buttonVariants, { variant }));
      return null;
    }
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<ThemeProvider><Probe variant="solid" /></ThemeProvider>);
    });
    const first = seen.at(-1)!;
    act(() => renderer.update(<ThemeProvider><Probe variant="solid" /></ThemeProvider>));
    assert.equal(seen.at(-1), first, "same theme, same inputs, same object");
    act(() => renderer.update(<ThemeProvider><Probe variant="outline" /></ThemeProvider>));
    assert.notEqual(seen.at(-1), first);
    assert.equal(seen.at(-1)!.root.borderWidth, light.borderWidth.thin);
  });

  it("a themeOverrides.variants.button override reaches the hook", () => {
    let backgroundColor: unknown;
    function Probe() {
      backgroundColor = useVariants(buttonVariants).root.backgroundColor;
      return null;
    }
    act(() => {
      TestRenderer.create(
        <ThemeProvider themeOverrides={{ variants: { button: { variants: { variant: { solid: { root: { backgroundColor: "teal" } } } } } } }}>
          <Probe />
        </ThemeProvider>
      );
    });
    assert.equal(backgroundColor, "teal");
  });

  it("the variants modules import no native or expo package (JS only, Expo Go safe)", () => {
    const files = ["src/theme/variants.ts", "src/theme/useVariants.ts", ...readdirSync("src/theme/variants").map((f) => `src/theme/variants/${f}`)];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      for (const m of text.matchAll(/^\s*import\s+(type\s+)?[^;]*?from\s+["']([^"']+)["']/gms)) {
        const spec = m[2]!;
        assert.ok(spec.startsWith(".") || (m[1] !== undefined && spec === "react-native"), `${file} imports ${spec}`);
        assert.ok(!/^expo/.test(spec), spec);
      }
    }
  });
});
