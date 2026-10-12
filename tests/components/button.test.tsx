import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { Button, ThemeProvider } from "../../src";
import type { ButtonProps } from "../../src";
import { contrastRatio, mixColors, readableOn } from "../../src/components/Button/contrast.js";
import { darkColors, lightColors } from "../../src/tokens/colors.base.js";

type Mode = "light" | "dark";
const VARIANTS = ["primary", "secondary", "ghost", "danger", "info"] as const;
const FILLED = ["primary", "secondary", "danger", "info"] as const;
const palettes = { light: lightColors, dark: darkColors } as const;

function mount(props: ButtonProps, mode: Mode = "light"): ReactTestRenderer {
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <ThemeProvider preference={mode}>
        <Button label="Save" {...props} />
      </ThemeProvider>
    );
  });
  return renderer;
}

const flatten = (style: unknown): Record<string, any> => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));
const pressable = (r: ReactTestRenderer): ReactTestInstance => r.root.findAll((n) => (n.type as unknown) === "Pressable")[0]!;
const styleOf = (r: ReactTestRenderer, pressed: boolean) => flatten(pressable(r).props.style({ pressed }));
const labelColor = (r: ReactTestRenderer): string => flatten(r.root.findAll((n) => (n.type as unknown) === "Text")[0]!.props.style).color;

describe("PLRNUI-285 Button variants", () => {
  for (const mode of ["light", "dark"] as const) {
    it(`${mode}: every non-ghost variant has a filled, non-transparent background`, () => {
      for (const variant of VARIANTS) {
        const bg = styleOf(mount({ variant }, mode), false).backgroundColor;
        if (variant === "ghost") assert.equal(bg, "transparent");
        else assert.ok(bg && bg !== "transparent", `${variant} background is ${bg}`);
      }
      assert.equal(styleOf(mount({ variant: "info" }, mode), false).backgroundColor, palettes[mode].info);
    });

    it(`${mode}: the label reaches 4.5:1 on the background in rest and pressed states`, () => {
      for (const variant of FILLED) {
        const r = mount({ variant }, mode);
        for (const pressed of [false, true]) {
          const bg = styleOf(r, pressed).backgroundColor as string;
          const ratio = contrastRatio(labelColor(r), bg);
          assert.ok(ratio !== null && ratio >= 4.5, `${mode} ${variant} pressed=${pressed}: ${ratio?.toFixed(2)}`);
        }
      }
      const ghost = mount({ variant: "ghost" }, mode);
      const surface = styleOf(ghost, true).backgroundColor as string;
      assert.equal(surface, palettes[mode].surface);
      assert.ok(contrastRatio(labelColor(ghost), surface)! >= 4.5);
    });

    it(`${mode}: pressing a filled variant draws a state layer on its own colour, never the surface swap`, () => {
      for (const variant of FILLED) {
        const r = mount({ variant }, mode);
        const rest = styleOf(r, false);
        const down = styleOf(r, true);
        assert.notEqual(down.backgroundColor, rest.backgroundColor, `${variant} gives pressed feedback`);
        assert.notEqual(down.backgroundColor, palettes[mode].surface, variant);
        assert.ok(contrastRatio(down.backgroundColor, rest.backgroundColor)! < 1.3, `${variant} stays close to its own colour`);
      }
    });
  }

  it("keeps the inverted label where it already reads, and switches only where it would not", () => {
    assert.equal(labelColor(mount({ variant: "info" }, "light")), lightColors.textInverted);
    assert.equal(labelColor(mount({ variant: "danger" }, "light")), lightColors.textInverted);
    assert.equal(labelColor(mount({ variant: "primary" }, "light")), lightColors.textPrimary);
    assert.equal(labelColor(mount({ variant: "secondary" }, "light")), lightColors.textPrimary);
    assert.equal(labelColor(mount({ variant: "primary" }, "dark")), darkColors.textInverted);
  });

  it("disabled keeps the variant and uses the disabled opacity; the ghost border is visible", () => {
    const disabled = mount({ variant: "info", disabled: true });
    const rest = mount({ variant: "info" });
    assert.ok(styleOf(disabled, false).opacity < styleOf(rest, false).opacity);
    assert.equal(pressable(disabled).props.accessibilityState.disabled, true);
    assert.equal(styleOf(mount({ variant: "ghost" }), false).borderColor, lightColors.border);
  });

  it("passes style (applied last) and testID through, and uses the semibold weight token", () => {
    const r = mount({ variant: "primary", testID: "save", style: { marginTop: 7, opacity: 0.9 } });
    assert.equal(pressable(r).props.testID, "save");
    const style = styleOf(r, false);
    assert.equal(style.marginTop, 7);
    assert.equal(style.opacity, 0.9);
    const weight = flatten(r.root.findAll((n) => (n.type as unknown) === "Text")[0]!.props.style).fontWeight;
    assert.equal(weight, "600", "theme.typography.fontWeight.semibold");
    assert.equal(pressable(mount({})).props.testID, undefined);
  });

  it("keeps role, label and the 44pt minimum hit area", () => {
    const p = pressable(mount({ size: "xs" }));
    assert.equal(p.props.accessibilityRole, "button");
    assert.equal(p.props.accessibilityLabel, "Save");
    const style = flatten(p.props.style({ pressed: false }));
    assert.ok(style.minHeight >= 44 && style.minWidth >= 44);
  });
});

describe("PLRNUI-285 contrast helper", () => {
  it("measures hex colours and leaves other formats alone", () => {
    assert.equal(contrastRatio("#000000", "#FFFFFF")!.toFixed(1), "21.0");
    assert.equal(contrastRatio("#fff", "#000")!.toFixed(1), "21.0");
    assert.equal(contrastRatio("#FFFFFFFF", "#000000")!.toFixed(1), "21.0");
    assert.equal(contrastRatio("rgba(0,0,0,1)", "#FFFFFF"), null);
    assert.equal(readableOn("rgba(0,0,0,0.5)", "#FFFFFF", "#000000"), "#FFFFFF");
    assert.equal(readableOn("#FF9F43", "#FFFFFF", "#020408"), "#020408");
    assert.equal(readableOn("#2563EB", "#FFFFFF", "#020408"), "#FFFFFF");
    assert.equal(mixColors("#000000", "#FFFFFF", 0.5), "#808080");
    assert.equal(mixColors("#FFFFFF", "#000000", 2), "#000000");
    assert.equal(mixColors("rgba(0,0,0,1)", "#FFFFFF", 0.5), null);
    assert.equal(readableOn("#777777", "#FFFFFF", "#888888"), "#FFFFFF");
  });
});
