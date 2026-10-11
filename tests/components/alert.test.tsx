import React from "react";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";
import { Alert, ThemeProvider, useTheme } from "../../src";
import { contrastRatio, readableOn } from "../../src/components/Alert/contrast.js";

const host = (name: string) => name as unknown as React.ElementType;
type Mode = "light" | "dark";
const variants = ["primary", "info", "success", "warning", "error"] as const;

const originalError = console.error;
const originalWarn = console.warn;
afterEach(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

function render(ui: React.ReactElement, mode: Mode = "light"): TestRenderer.ReactTestRenderer {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <ThemeProvider initialMode={mode} persistTheme={false}>
        {ui}
      </ThemeProvider>,
    );
  });
  return renderer;
}

function themeOf(mode: Mode = "light"): ReturnType<typeof useTheme> {
  let captured: ReturnType<typeof useTheme> | undefined;
  function Probe() {
    captured = useTheme();
    return null;
  }
  render(<Probe />, mode);
  return captured as ReturnType<typeof useTheme>;
}

const flatten = (style: unknown): Record<string, any> => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));
const rootOf = (r: TestRenderer.ReactTestRenderer) => r.root.findAllByType(host("View"))[0]!;

describe("PLRNUI-209 Alert accessibility", () => {
  it("has accessibilityRole alert", () => {
    assert.equal(rootOf(render(<Alert message="Saved" />)).props.accessibilityRole, "alert");
  });

  it("uses an assertive live region for error and a polite one for the other variants", () => {
    for (const variant of variants) {
      const region = rootOf(render(<Alert variant={variant} message="x" />)).props.accessibilityLiveRegion;
      assert.equal(region, variant === "error" ? "assertive" : "polite", variant);
    }
    assert.equal(rootOf(render(<Alert message="x" />)).props.accessibilityLiveRegion, "polite", "default variant info");
  });
});

describe("PLRNUI-209 Alert dismiss and action", () => {
  it("onDismiss shows a close button that fires onDismiss", () => {
    let dismissed = 0;
    const r = render(<Alert message="x" onDismiss={() => void (dismissed += 1)} />);
    const button = r.root.findByType(host("Pressable"));
    assert.equal(button.props.accessibilityRole, "button");
    assert.equal(button.props.accessibilityLabel, "Dismiss");
    assert.ok(flatten(button.props.style).minWidth >= 44 && flatten(button.props.style).minHeight >= 44);
    act(() => button.props.onPress());
    assert.equal(dismissed, 1);
  });

  it("dismissLabel customises the close button label; no close button without onDismiss", () => {
    const labelled = render(<Alert message="x" onDismiss={() => undefined} dismissLabel="Close alert" />);
    assert.equal(labelled.root.findByType(host("Pressable")).props.accessibilityLabel, "Close alert");
    assert.equal(render(<Alert message="x" />).root.findAllByType(host("Pressable")).length, 0);
  });

  it("title, message and the action button still render and the action fires", () => {
    let acted = 0;
    const r = render(<Alert variant="warning" title="Heads up" message="Disk almost full" actionLabel="Clean up" onAction={() => void (acted += 1)} onDismiss={() => undefined} />);
    const texts = r.root.findAllByType(host("Text")).map((node) => node.props.children);
    assert.ok(texts.includes("Heads up") && texts.includes("Disk almost full"));
    const pressables = r.root.findAllByType(host("Pressable"));
    assert.equal(pressables.length, 2);
    const action = pressables.find((node) => node.props.accessibilityLabel === "Clean up")!;
    act(() => action.props.onPress());
    assert.equal(acted, 1);
  });
});

describe("PLRNUI-209 Alert contrast", () => {
  it("contrastRatio follows WCAG: white on black is 21, equal colours are 1, upper case and 8-digit hex are accepted, other formats are NaN", () => {
    assert.ok(Math.abs(contrastRatio("#ffffff", "#000000") - 21) < 1e-9);
    assert.equal(contrastRatio("#123456", "#123456"), 1);
    assert.equal(contrastRatio("#FFFFFF", "#000000"), contrastRatio("#ffffff", "#000000ff"));
    assert.ok(Number.isNaN(contrastRatio("rgba(0, 0, 0, 0.5)", "#fff")));
    assert.ok(Math.abs(contrastRatio("#767676", "#ffffff") - 4.54) < 0.01);
  });

  it("readableOn picks the higher contrast candidate and falls back to the first when no ratio exists", () => {
    assert.equal(readableOn("#000000", ["#111111", "#ffffff"]), "#ffffff");
    assert.equal(readableOn("#ffffff", ["#eeeeee", "#222222"]), "#222222");
    assert.equal(readableOn("rgba(0,0,0,.5)", ["#aaaaaa", "#ffffff"]), "#aaaaaa");
    assert.equal(readableOn("#000000", ["#ffffff"]), "#ffffff");
  });

  it("text on each of the 5 variants reaches WCAG AA (4.5:1) in light and dark and comes from the text tokens", () => {
    for (const mode of ["light", "dark"] as const) {
      const { colors } = themeOf(mode);
      const backgrounds = { primary: colors.primary, info: colors.info, success: colors.success, warning: colors.warning, error: colors.error };
      for (const variant of variants) {
        const r = render(<Alert variant={variant} title="Title" message="Message" onDismiss={() => undefined} />, mode);
        const background = flatten(rootOf(r).props.style).backgroundColor;
        assert.equal(background, backgrounds[variant], `${mode} ${variant} background`);
        const colorsUsed = r.root.findAllByType(host("Text")).map((node) => flatten(node.props.style).color);
        for (const color of colorsUsed) {
          assert.ok([colors.textInverted, colors.textPrimary].includes(color), `${mode} ${variant}: ${color} is a text token`);
          const ratio = contrastRatio(background, color);
          assert.ok(ratio >= 4.5, `${mode} ${variant}: ${color} on ${background} is ${ratio.toFixed(2)}:1`);
        }
      }
    }
  });
});

describe("PLRNUI-209 Alert rendering", () => {
  it("renders every variant in light and dark with no console.error or console.warn", () => {
    const calls: unknown[][] = [];
    // react-test-renderer logs its own deprecation notice once per process; that notice is not a component error.
    console.error = (...args: unknown[]) => {
      if (!String(args[0]).includes("react-test-renderer is deprecated")) calls.push(args);
    };
    console.warn = (...args: unknown[]) => void calls.push(args);
    for (const mode of ["light", "dark"] as const) {
      for (const variant of variants) render(<Alert variant={variant} title="T" message="M" actionLabel="Act" onAction={() => undefined} onDismiss={() => undefined} />, mode);
    }
    assert.deepEqual(calls, []);
  });
});
