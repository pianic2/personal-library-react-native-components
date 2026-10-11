import React from "react";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";
import { View } from "react-native";
import { ThemeProvider, useTheme } from "../../src";
import {
  ICON_SIZES,
  Icon,
  IconProvider,
  createIconSet,
  createSvgIconSet,
  iconFromComponent,
  type IconSetAdapter,
} from "../../src/components/Icon/index.js";

const host = (name: string) => name as unknown as React.ElementType;
type Mode = "light" | "dark";

const globals = globalThis as { __DEV__?: boolean };
const originalDev = globals.__DEV__;
const originalError = console.error;
const originalWarn = console.warn;
afterEach(() => {
  globals.__DEV__ = originalDev;
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

function captureWarnings(): string[] {
  const warnings: string[] = [];
  console.warn = (...args: unknown[]) => void warnings.push(String(args[0]));
  return warnings;
}

/** A glyph that records how it was drawn, so tests can read size and color back. */
const Glyph = ({ size, color }: { size: number; color: string }) => <View testID="glyph" accessibilityLabel={`${size}|${color}`} />;
const icons = createIconSet({ check: Glyph, close: Glyph });
const brand = createIconSet({ logo: Glyph });

const wrapperOf = (r: TestRenderer.ReactTestRenderer) => r.root.findAllByType(host("View"))[0]!;
/** Host Views with this testID (findAllByProps would also match the component elements that carry the same prop). */
const hostsWith = (r: TestRenderer.ReactTestRenderer, testID: string) => r.root.findAll((node) => (node.type as unknown) === "View" && node.props.testID === testID);
const glyphOf = (r: TestRenderer.ReactTestRenderer) => hostsWith(r, "glyph")[0];
const drawn = (r: TestRenderer.ReactTestRenderer) => String(glyphOf(r)!.props.accessibilityLabel);

describe("PLRNUI-233 Icon registry", () => {
  it("resolves the default set and a named set", () => {
    const r = render(
      <IconProvider sets={{ default: icons, brand }}>
        <Icon name="check" />
        <Icon name="logo" set="brand" />
      </IconProvider>,
    );
    assert.equal(hostsWith(r, "glyph").length, 2);
  });

  it("a nested provider adds to and wins over its parent", () => {
    const override: IconSetAdapter = { render: () => <View testID="override" /> };
    const r = render(
      <IconProvider sets={{ default: icons, brand }}>
        <IconProvider sets={{ default: override }}>
          <Icon name="check" />
          <Icon name="logo" set="brand" />
        </IconProvider>
      </IconProvider>,
    );
    assert.equal(hostsWith(r, "override").length, 1);
    assert.equal(hostsWith(r, "glyph").length, 1);
  });

  it("createIconSet lists its names and returns null for an unknown one; own-property lookup only", () => {
    assert.deepEqual(icons.names, ["check", "close"]);
    assert.equal(icons.render("missing", { size: 16, color: "x" }), null);
    assert.equal(icons.render("toString", { size: 16, color: "x" }), null);
  });

  it("iconFromComponent adapts a component that takes size and color", () => {
    const Library = ({ size, color }: { size?: number; color?: string }) => <View testID="glyph" accessibilityLabel={`${size}|${color}`} />;
    const set = createIconSet({ star: iconFromComponent(Library) });
    const r = render(
      <IconProvider sets={{ default: set }}>
        <Icon name="star" size="lg" color="red" />
      </IconProvider>,
    );
    assert.equal(drawn(r), "24|red");
  });

  it("createSvgIconSet draws a path in a 24x24 view box with the injected module and throws without it", () => {
    const Svg = (props: Record<string, unknown>) => React.createElement("svg", props, props.children as React.ReactNode);
    const Path = (props: Record<string, unknown>) => React.createElement("path", props);
    const set = createSvgIconSet({ Svg, Path }, { logo: "M0 0 L24 24" });
    assert.deepEqual(set.names, ["logo"]);
    const r = render(
      <IconProvider sets={{ default: set }}>
        <Icon name="logo" size={32} color="blue" />
      </IconProvider>,
    );
    const svg = r.root.findByType(host("svg"));
    assert.equal(svg.props.width, 32);
    assert.equal(svg.props.viewBox, "0 0 24 24");
    const path = r.root.findByType(host("path"));
    assert.equal(path.props.d, "M0 0 L24 24");
    assert.equal(path.props.fill, "blue");
    assert.equal(set.render("missing", { size: 8, color: "x" }), null);
    // a module whose Svg is its default export is accepted too
    assert.doesNotThrow(() => createSvgIconSet({ default: Svg, Path }, {}));
    assert.throws(() => createSvgIconSet(undefined, {}), /createSvgIconSet needs the react-native-svg module/);
    assert.throws(() => createSvgIconSet({ Path } as never, {}), /createSvgIconSet needs the react-native-svg module/);
  });
});

describe("PLRNUI-233 Icon rendering", () => {
  it("maps the named sizes to 12, 16, 20 and 24 and accepts a number; the default is md", () => {
    assert.deepEqual(ICON_SIZES, { xs: 12, sm: 16, md: 20, lg: 24 });
    for (const [size, pixels] of Object.entries(ICON_SIZES)) {
      const r = render(
        <IconProvider sets={{ default: icons }}>
          <Icon name="check" size={size as keyof typeof ICON_SIZES} />
        </IconProvider>,
      );
      assert.equal(drawn(r).split("|")[0], String(pixels), size);
      assert.deepEqual(wrapperOf(r).props.style, { width: pixels, height: pixels }, size);
    }
    const custom = render(<IconProvider sets={{ default: icons }}><Icon name="check" size={33} /></IconProvider>);
    assert.equal(drawn(custom).split("|")[0], "33");
    const dflt = render(<IconProvider sets={{ default: icons }}><Icon name="check" /></IconProvider>);
    assert.equal(drawn(dflt).split("|")[0], "20");
  });

  it("resolves a colour token of the current mode, any colour string, and defaults to textPrimary", () => {
    for (const mode of ["light", "dark"] as const) {
      const { colors } = themeOf(mode);
      const token = render(<IconProvider sets={{ default: icons }}><Icon name="check" color="primary" /></IconProvider>, mode);
      assert.equal(drawn(token).split("|")[1], colors.primary, mode);
      const dflt = render(<IconProvider sets={{ default: icons }}><Icon name="check" /></IconProvider>, mode);
      assert.equal(drawn(dflt).split("|")[1], colors.textPrimary, mode);
    }
    const literal = render(<IconProvider sets={{ default: icons }}><Icon name="check" color="rebeccapurple" /></IconProvider>);
    assert.equal(drawn(literal).split("|")[1], "rebeccapurple");
  });

  it("without a label the icon is decorative: hidden from assistive technology, not focusable", () => {
    const r = render(<IconProvider sets={{ default: icons }}><Icon name="check" /></IconProvider>);
    const props = wrapperOf(r).props;
    assert.equal(props.accessibilityElementsHidden, true);
    assert.equal(props.importantForAccessibility, "no-hide-descendants");
    assert.equal(props.accessible, false);
    assert.equal(props.accessibilityRole, undefined);
    assert.equal(props.accessibilityLabel, undefined);
    assert.equal(props.focusable, false);
  });

  it("with a label the icon is an image with that accessibility label, still not focusable", () => {
    const r = render(<IconProvider sets={{ default: icons }}><Icon name="check" label="Saved" /></IconProvider>);
    const props = wrapperOf(r).props;
    assert.equal(props.accessibilityRole, "image");
    assert.equal(props.accessibilityLabel, "Saved");
    assert.equal(props.accessible, true);
    assert.equal(props.accessibilityElementsHidden, false);
    assert.equal(props.importantForAccessibility, "yes");
    assert.equal(props.focusable, false);
    const empty = render(<IconProvider sets={{ default: icons }}><Icon name="check" label="" /></IconProvider>);
    assert.equal(wrapperOf(empty).props.accessibilityElementsHidden, true);
  });

  it("an unknown name renders null and warns once per name in dev", () => {
    globals.__DEV__ = true;
    const warnings = captureWarnings();
    const r = render(<IconProvider sets={{ default: icons }}><Icon name="nope" /></IconProvider>);
    assert.equal(r.toJSON(), null);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0]!, /icon "nope" does not exist in the "default" set/);
    act(() => r.update(
      <ThemeProvider persistTheme={false}>
        <IconProvider sets={{ default: icons }}><Icon name="nope" /></IconProvider>
      </ThemeProvider>,
    ));
    assert.equal(warnings.length, 1, "no repeat for the same name");
  });

  it("an unregistered set renders null and warns about the set; production stays silent", () => {
    globals.__DEV__ = true;
    const warnings = captureWarnings();
    const noProvider = render(<Icon name="check" />);
    assert.equal(noProvider.toJSON(), null);
    assert.match(warnings[0]!, /icon set "default" is not registered/);
    const missingSet = render(<IconProvider sets={{ default: icons }}><Icon name="logo" set="brand" /></IconProvider>);
    assert.equal(missingSet.toJSON(), null);
    assert.match(warnings[1]!, /icon set "brand" is not registered/);
    globals.__DEV__ = false;
    const silent = captureWarnings();
    render(<IconProvider sets={{ default: icons }}><Icon name="nope" /></IconProvider>);
    assert.deepEqual(silent, []);
  });

  it("renders in light and dark under ThemeProvider with no console.error or console.warn", () => {
    globals.__DEV__ = true;
    const calls: unknown[][] = [];
    // react-test-renderer logs its own deprecation notice once per process; that notice is not a component error.
    console.error = (...args: unknown[]) => {
      if (!String(args[0]).includes("react-test-renderer is deprecated")) calls.push(args);
    };
    console.warn = (...args: unknown[]) => void calls.push(args);
    for (const mode of ["light", "dark"] as const) {
      render(<IconProvider sets={{ default: icons }}><Icon name="check" label="Done" color="success" /><Icon name="close" size="xs" /></IconProvider>, mode);
    }
    assert.deepEqual(calls, []);
  });
});
