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

// --- PLRNUI-230: appearance, icon and actions ---------------------------------------------------------------------------

const hexToRgb = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
const blend = (base: string, over: string, alpha: number): string =>
  "#" +
  hexToRgb(base)
    .map((channel, i) => Math.round(channel * (1 - alpha) + hexToRgb(over)[i]! * alpha).toString(16).padStart(2, "0"))
    .join("");
const variantColors = (mode: Mode) => {
  const { colors } = themeOf(mode);
  return { primary: colors.primary, info: colors.info, success: colors.success, warning: colors.warning, error: colors.error } as const;
};

describe("PLRNUI-230 Alert appearance", () => {
  it("solid is the default and fills with the variant colour", () => {
    const solid = flatten(rootOf(render(<Alert variant="success" message="x" appearance="solid" />)).props.style);
    const implicit = flatten(rootOf(render(<Alert variant="success" message="x" />)).props.style);
    assert.equal(solid.backgroundColor, variantColors("light").success);
    assert.deepEqual(implicit, solid);
  });

  it("soft sits on the surface with a variant tint layer that does not take touches", () => {
    const { colors } = themeOf("light");
    const r = render(<Alert variant="error" message="x" appearance="soft" />);
    const root = flatten(rootOf(r).props.style);
    assert.equal(root.backgroundColor, colors.surface);
    assert.equal(root.overflow, undefined, "no clipping: the dismiss hit slop stays reachable");
    const tint = r.root.findAllByType(host("View")).find((n) => n.props.pointerEvents === "none")!;
    assert.equal(flatten(tint.props.style).backgroundColor, colors.error);
    assert.equal(flatten(tint.props.style).opacity, 0.12);
    assert.equal(flatten(tint.props.style).position, "absolute");
    assert.equal(flatten(tint.props.style).borderRadius, flatten(rootOf(r).props.style).borderRadius, "the tint follows the rounded corners");
  });

  it("outline has no fill and a border in the variant colour", () => {
    const r = render(<Alert variant="warning" message="x" appearance="outline" />);
    const root = flatten(rootOf(r).props.style);
    assert.equal(root.backgroundColor, undefined);
    assert.equal(root.borderWidth, 1);
    assert.equal(root.borderColor, variantColors("light").warning);
  });

  it("text on each appearance and variant reaches WCAG AA in light and dark (the soft tint is blended)", () => {
    for (const mode of ["light", "dark"] as const) {
      const { colors } = themeOf(mode);
      const variants5 = variantColors(mode);
      for (const variant of variants) {
        const effective = {
          solid: variants5[variant],
          soft: blend(colors.surface, variants5[variant], 0.12),
          outline: colors.background,
        } as const;
        for (const appearance of ["solid", "soft", "outline"] as const) {
          const r = render(<Alert variant={variant} appearance={appearance} title="Title" message="Message" onDismiss={() => undefined} />, mode);
          for (const node of r.root.findAllByType(host("Text"))) {
            const color = flatten(node.props.style).color;
            const ratio = contrastRatio(effective[appearance], color);
            assert.ok(ratio >= 4.5, `${mode} ${variant} ${appearance}: ${color} on ${effective[appearance]} is ${ratio.toFixed(2)}:1`);
          }
        }
      }
    }
  });

  it("keeps the role and the live region for every appearance", () => {
    for (const appearance of ["solid", "soft", "outline"] as const) {
      const root = rootOf(render(<Alert variant="error" message="x" appearance={appearance} />)).props;
      assert.equal(root.accessibilityRole, "alert");
      assert.equal(root.accessibilityLiveRegion, "assertive");
    }
  });
});

describe("PLRNUI-230 Alert icon and actions", () => {
  it("renders the icon before the text and hides it from assistive technology", () => {
    const r = render(<Alert message="Saved" icon={React.createElement("Text", { testID: "icon" }, "i")} />);
    const wrapper = r.root.findAll((n) => n.type === host("View") && n.props.accessibilityElementsHidden === true)[0]!;
    assert.equal(wrapper.props.importantForAccessibility, "no-hide-descendants");
    assert.ok(wrapper.findAll((n) => n.props.testID === "icon").length > 0);
    const order = JSON.stringify(r.toJSON());
    assert.ok(order.indexOf("icon") < order.indexOf("Saved"));
    assert.equal(r.root.findAll((n) => n.type === host("View") && n.props.accessibilityElementsHidden === true).length, 1);
  });

  it("renders the actions slot after the actionLabel button, both working", () => {
    let acted = 0;
    let extra = 0;
    const r = render(
      <Alert
        message="x"
        actionLabel="Undo"
        onAction={() => void (acted += 1)}
        actions={React.createElement("Pressable", { accessibilityRole: "button", accessibilityLabel: "Details", onPress: () => void (extra += 1) })}
      />,
    );
    const labels = r.root.findAllByType(host("Pressable")).map((n) => n.props.accessibilityLabel);
    assert.deepEqual(labels, ["Undo", "Details"]);
    act(() => r.root.findAllByType(host("Pressable"))[0]!.props.onPress());
    act(() => r.root.findAllByType(host("Pressable"))[1]!.props.onPress());
    assert.deepEqual([acted, extra], [1, 1]);
  });

  it("the actions slot works without actionLabel, and nothing extra renders without actions", () => {
    const withActions = render(<Alert message="x" actions={React.createElement("Pressable", { accessibilityLabel: "Only" })} />);
    assert.deepEqual(withActions.root.findAllByType(host("Pressable")).map((n) => n.props.accessibilityLabel), ["Only"]);
    const plain = render(<Alert message="x" />);
    assert.equal(plain.root.findAllByType(host("Pressable")).length, 0);
    // Without actions there is no wrapper: the root is the plain column with the content row only.
    assert.equal(rootOf(plain).children.filter((c) => typeof c !== "string").length, 1);
  });

  it("the actionLabel button stays a direct child of the root when there are no extra actions (the layout is unchanged)", () => {
    const r = render(<Alert message="x" actionLabel="Undo" onAction={() => undefined} />);
    const root = rootOf(r);
    const button = r.root.findAllByType(host("Pressable")).find((n) => n.props.accessibilityLabel === "Undo")!;
    let ancestor = button.parent;
    while (ancestor && ancestor.type !== host("View")) ancestor = ancestor.parent;
    assert.equal(ancestor, root, "no row wrapper between the root column and the button");
    const withActions = render(<Alert message="x" actionLabel="Undo" onAction={() => undefined} actions={React.createElement("Pressable", { accessibilityLabel: "More" })} />);
    const wrapped = withActions.root.findAllByType(host("Pressable")).find((n) => n.props.accessibilityLabel === "Undo")!;
    let up = wrapped.parent;
    while (up && up.type !== host("View")) up = up.parent;
    assert.notEqual(up, rootOf(withActions), "with actions the buttons share a wrapping row");
    assert.equal(flatten(up!.props.style).flexDirection, "row");
  });

  it("a falsy icon or actions value such as 0 does not render a bare number", () => {
    const r = render(<Alert message="x" icon={0 as unknown as React.ReactNode} />);
    assert.ok(r.root.findAllByType(host("View")).every((n) => !n.children.some((c) => String(c) === "0")));
  });
});

describe("PLRNUI-230 Alert props are backwards compatible", () => {
  it("every previous prop still type-checks and the new ones are optional", () => {
    const previous: import("../../src").AlertProps = { title: "t", variant: "info", message: "m", actionLabel: "a", onAction: () => undefined, onDismiss: () => undefined, dismissLabel: "d" };
    const minimal: import("../../src").AlertProps = {};
    // @ts-expect-error appearance is a closed union
    const bad: import("../../src").AlertProps = { appearance: "filled" };
    void [previous, minimal, bad];
  });
});
