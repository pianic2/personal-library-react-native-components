import React from "react";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import TestRenderer, { act } from "react-test-renderer";
import { Banner, ThemeProvider, useTheme } from "../../src";
import { SafeAreaInsetsProvider } from "../../src/native/safe-area/index.js";

const host = (name: string) => name as unknown as React.ElementType;
type Mode = "light" | "dark";
const tones = ["neutral", "info", "success", "warning", "danger"] as const;

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
const rootProps = (ui: React.ReactElement) => rootOf(render(ui)).props;

describe("PLRNUI-330 Banner variants", () => {
  it("renders every tone in light and dark with the tone colour as accent and no console output", () => {
    const calls: unknown[][] = [];
    // react-test-renderer logs its own deprecation notice once per process; that notice is not a component error.
    console.error = (...args: unknown[]) => {
      if (!String(args[0]).includes("react-test-renderer is deprecated")) calls.push(args);
    };
    console.warn = (...args: unknown[]) => void calls.push(args);
    for (const mode of ["light", "dark"] as const) {
      const { theme } = themeOf(mode);
      const accent = {
        neutral: theme.semantic.border.default,
        info: theme.semantic.feedback.info,
        success: theme.semantic.feedback.success,
        warning: theme.semantic.feedback.warning,
        danger: theme.semantic.feedback.error,
      };
      for (const tone of tones) {
        const r = render(<Banner tone={tone} title="T" message="M" actionLabel="Act" onAction={() => undefined} onDismiss={() => undefined} />, mode);
        const root = flatten(rootOf(r).props.style);
        assert.equal(root.borderLeftColor, accent[tone], `${mode} ${tone}`);
        assert.equal(root.backgroundColor, theme.semantic.surface.sunken);
        assert.equal(root.alignSelf, "stretch");
      }
    }
    assert.deepEqual(calls, []);
  });

  it("the tones differ from each other and the default tone is info", () => {
    const accents = tones.map((tone) => flatten(rootOf(render(<Banner tone={tone} message="x" />)).props.style).borderLeftColor);
    assert.equal(new Set(accents).size, tones.length);
    assert.equal(flatten(rootProps(<Banner message="x" />).style).borderLeftColor, flatten(rootProps(<Banner tone="info" message="x" />).style).borderLeftColor);
  });

  it("renders title, message and the action button, and the action fires", () => {
    let acted = 0;
    const r = render(<Banner title="Update" message="Version 2 is ready" actionLabel="Install" onAction={() => void (acted += 1)} />);
    const texts = r.root.findAllByType(host("Text")).map((n) => n.props.children);
    assert.ok(texts.includes("Update") && texts.includes("Version 2 is ready"));
    act(() => r.root.findByType(host("Pressable")).props.onPress());
    assert.equal(acted, 1);
  });

  it("renders text with theme tokens only: no raw hex or rgba in the component source", () => {
    const source = readFileSync("src/components/Banner/Banner.tsx", "utf8");
    assert.equal(/#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(source), false);
  });

  it("applies the style and testID passthrough to the root", () => {
    const props = rootProps(<Banner message="x" testID="b" style={{ marginTop: 7 }} />);
    assert.equal(props.testID, "b");
    assert.equal(flatten(props.style).marginTop, 7);
  });
});

describe("PLRNUI-330 Banner role by tone", () => {
  it("uses role alert for warning and danger and role status for neutral, info and success", () => {
    for (const tone of tones) {
      const expected = tone === "warning" || tone === "danger" ? "alert" : "status";
      const props = rootProps(<Banner tone={tone} message="x" />);
      assert.equal(props.role, expected, tone);
      assert.equal(props.accessibilityRole, expected === "alert" ? "alert" : undefined, tone);
    }
    assert.equal(rootProps(<Banner message="x" />).role, "status", "default tone");
  });

  it("uses an assertive live region for danger and a polite one for the others", () => {
    for (const tone of tones) assert.equal(rootProps(<Banner tone={tone} message="x" />).accessibilityLiveRegion, tone === "danger" ? "assertive" : "polite", tone);
  });
});

describe("PLRNUI-330 Banner dismiss path", () => {
  it("has no close button without onDismiss or dismissible", () => {
    assert.equal(render(<Banner message="x" />).root.findAllByType(host("Pressable")).length, 0);
  });

  it("the close button is a 44pt button labelled Dismiss, or dismissLabel", () => {
    const r = render(<Banner message="x" onDismiss={() => undefined} />);
    const button = r.root.findByType(host("Pressable"));
    assert.equal(button.props.accessibilityRole, "button");
    assert.equal(button.props.accessibilityLabel, "Dismiss");
    assert.ok(flatten(button.props.style).minWidth >= 44 && flatten(button.props.style).minHeight >= 44);
    const custom = render(<Banner message="x" onDismiss={() => undefined} dismissLabel="Close banner" />);
    assert.equal(custom.root.findByType(host("Pressable")).props.accessibilityLabel, "Close banner");
  });

  it("pressing close hides the banner and calls onDismiss once with the dismissKey", () => {
    const calls: Array<string | undefined> = [];
    const r = render(<Banner message="Offline" dismissKey="offline-v1" onDismiss={(key) => void calls.push(key)} />);
    assert.ok(r.root.findAllByType(host("Text")).length > 0);
    act(() => r.root.findByType(host("Pressable")).props.onPress());
    assert.deepEqual(calls, ["offline-v1"]);
    assert.equal(r.toJSON(), null, "the banner is gone");
  });

  it("onDismiss gets undefined when no dismissKey is set", () => {
    const calls: unknown[][] = [];
    const r = render(<Banner message="x" onDismiss={(...args) => void calls.push(args)} />);
    act(() => r.root.findByType(host("Pressable")).props.onPress());
    assert.deepEqual(calls, [[undefined]]);
  });

  it("dismissible without onDismiss shows the close button and still hides the banner; dismissible false hides the button", () => {
    const r = render(<Banner message="x" dismissible />);
    act(() => r.root.findByType(host("Pressable")).props.onPress());
    assert.equal(r.toJSON(), null);
    assert.equal(render(<Banner message="x" dismissible={false} onDismiss={() => undefined} />).root.findAllByType(host("Pressable")).length, 0);
  });
});

describe("PLRNUI-330 Banner icon and actions", () => {
  it("hides the icon from assistive technology and renders it before the text", () => {
    const r = render(<Banner message="Saved" icon={React.createElement("Text", { testID: "icon" }, "i")} />);
    const wrapper = r.root.findAll((n) => n.type === host("View") && n.props.accessibilityElementsHidden === true)[0]!;
    assert.equal(wrapper.props.importantForAccessibility, "no-hide-descendants");
    assert.ok(wrapper.findAll((n) => n.props.testID === "icon").length > 0);
    const order = JSON.stringify(r.toJSON());
    assert.ok(order.indexOf("icon") < order.indexOf("Saved"));
  });

  it("renders extra actions after the actionLabel button and both work", () => {
    let acted = 0;
    let extra = 0;
    const r = render(
      <Banner
        message="x"
        actionLabel="Undo"
        onAction={() => void (acted += 1)}
        actions={React.createElement("Pressable", { accessibilityLabel: "Details", onPress: () => void (extra += 1) })}
      />,
    );
    const pressables = r.root.findAllByType(host("Pressable"));
    assert.deepEqual(pressables.map((n) => n.props.accessibilityLabel), ["Undo", "Details"]);
    act(() => pressables[0]!.props.onPress());
    act(() => pressables[1]!.props.onPress());
    assert.deepEqual([acted, extra], [1, 1]);
  });
});

describe("PLRNUI-330 Banner sticky position and safe area", () => {
  it("inline is in the layout flow; sticky pins to the top with the sticky z-index", () => {
    const { theme } = themeOf();
    const inline = flatten(rootProps(<Banner message="x" />).style);
    assert.equal(inline.position, undefined);
    const sticky = flatten(rootProps(<Banner message="x" position="sticky" />).style);
    assert.ok(sticky.position === "absolute" || sticky.position === "sticky");
    assert.equal(sticky.top, 0);
    assert.equal(sticky.left, 0);
    assert.equal(sticky.right, 0);
    assert.equal(sticky.zIndex, theme.zIndex.sticky);
  });

  it("adds the top safe-area inset from a SafeAreaInsetsProvider to a sticky banner only", () => {
    const { theme } = themeOf();
    const base = theme.space.sm;
    const withInset = (ui: React.ReactElement) => flatten(rootOf(render(<SafeAreaInsetsProvider insets={{ top: 44 }}>{ui}</SafeAreaInsetsProvider>)).props.style);
    assert.equal(withInset(<Banner message="x" position="sticky" />).paddingTop, base + 44);
    assert.equal(withInset(<Banner message="x" />).paddingTop, undefined, "inline never adds the inset");
  });

  it("adds nothing without a provider", () => {
    const style = flatten(rootProps(<Banner message="x" position="sticky" />).style);
    assert.equal(style.paddingTop, undefined);
  });
});

describe("PLRNUI-330 Banner has no storage or native dependency", () => {
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => (statSync(join(dir, name)).isDirectory() ? files(join(dir, name)) : [join(dir, name)]));

  it("imports no AsyncStorage, MMKV, Expo or other native module", () => {
    for (const file of files("src/components/Banner")) {
      const source = readFileSync(file, "utf8");
      assert.equal(/AsyncStorage|async-storage|mmkv|localStorage|from "expo|from "react-native-(?!web)/i.test(source), false, file);
      const imports = [...source.matchAll(/from\s+"([^"]+)"/g)].map((m) => m[1]!);
      for (const spec of imports) assert.ok(spec.startsWith(".") || spec === "react" || spec === "react-native", `${file}: ${spec}`);
    }
  });
});

describe("PLRNUI-330 Banner props", () => {
  it("every prop is optional and the tone and position unions are closed", () => {
    const minimal: import("../../src").BannerProps = {};
    // @ts-expect-error tone is a closed union
    const badTone: import("../../src").BannerProps = { tone: "error" };
    // @ts-expect-error position is a closed union
    const badPosition: import("../../src").BannerProps = { position: "fixed" };
    void [minimal, badTone, badPosition];
  });
});
