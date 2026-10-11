import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import TestRenderer, { act } from "react-test-renderer";
import { ThemeProvider } from "../../src";
import { Icon, IconProvider, createIconSet } from "../../src/components/Icon/index.js";
import { GLYPH_NAMES, IconGlyphs, createGlyphIconSet, glyphs, type GlyphName } from "../../src/components/IconGlyphs/index.js";

const host = (name: string) => name as unknown as React.ElementType;
const root = resolve(import.meta.dirname, "../..");
/** A stand-in for the react-native-svg module: host components record what they are given. */
const svg = { Svg: "Svg" as unknown as React.ComponentType<Record<string, unknown>>, Path: "Path" as unknown as React.ComponentType<Record<string, unknown>> };

const EXPECTED_NAMES = [
  "check", "close", "plus", "minus", "chevron-up", "chevron-down", "chevron-left", "chevron-right", "search", "eye", "eye-off",
  "calendar", "clock", "star", "star-outline", "info", "alert", "error", "success", "upload", "trash", "edit", "copy", "menu",
  "more-horizontal", "user", "image", "file", "arrow-left", "arrow-right", "clear",
];

function render(ui: React.ReactElement, mode: "light" | "dark" = "light") {
  const messages: unknown[][] = [];
  const originalError = console.error;
  const originalWarn = console.warn;
  const record = (...args: unknown[]) => void (String(args[0]).includes("react-test-renderer is deprecated") || messages.push(args));
  console.error = record;
  console.warn = record;
  let renderer!: TestRenderer.ReactTestRenderer;
  try {
    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider initialMode={mode} persistTheme={false}>
          {ui}
        </ThemeProvider>,
      );
    });
  } finally {
    console.error = originalError;
    console.warn = originalWarn;
  }
  return { renderer, messages };
}

describe("PLRNUI-239 glyph data", () => {
  it("lists the documented glyph names in a stable order", () => {
    assert.deepEqual([...GLYPH_NAMES], EXPECTED_NAMES);
    assert.deepEqual(Object.keys(glyphs), EXPECTED_NAMES);
  });

  it("every glyph has a non-empty, well-formed path inside the 24 x 24 view box", () => {
    for (const name of GLYPH_NAMES) {
      const d = glyphs[name];
      assert.ok(d.length > 0, `${name} is empty`);
      assert.match(d, /^M/, `${name} starts with a move`);
      assert.match(d, /Z$/, `${name} ends closed`);
      assert.doesNotMatch(d, /[^MLCAZ0-9.\s-]/, `${name} uses only M, L, C, A, Z commands`);
      // every subpath is closed
      assert.equal((d.match(/M/g) ?? []).length, (d.match(/Z/g) ?? []).length, `${name}: every subpath is closed`);
      // move, line and curve coordinates stay inside the box (arc radii and flags are not coordinates)
      for (const command of d.match(/[MLC][^MLCAZ]*/g) ?? []) {
        const numbers = command.slice(1).trim().split(/\s+/).map(Number);
        assert.ok(numbers.every((n) => Number.isFinite(n) && n >= 0 && n <= 24), `${name}: ${command} is inside 0..24`);
      }
    }
  });

  it("has no duplicate paths", () => {
    const paths = GLYPH_NAMES.map((name) => glyphs[name]);
    assert.equal(new Set(paths).size, paths.length);
  });

  it("holds no colours and no third-party markers in the source", () => {
    const source = readFileSync(resolve(root, "src/components/IconGlyphs/IconGlyphs.tsx"), "utf8");
    assert.doesNotMatch(source, /#[0-9a-fA-F]{3,8}\b|rgba?\(|fill=|stroke=/);
  });
});

describe("PLRNUI-239 the glyph icon set", () => {
  it("draws every glyph through the injected svg module with the icon colour and a 24 view box", () => {
    const set = createGlyphIconSet(svg);
    assert.deepEqual(set.names, EXPECTED_NAMES);
    for (const name of GLYPH_NAMES) {
      const out = set.render(name, { size: 20, color: "#123456" })!;
      const { renderer } = render(out);
      const svgNode = renderer.root.findByType(host("Svg"));
      assert.equal(svgNode.props.width, 20);
      assert.equal(svgNode.props.height, 20);
      assert.equal(svgNode.props.viewBox, "0 0 24 24");
      const path = renderer.root.findByType(host("Path"));
      assert.equal(path.props.d, glyphs[name]);
      assert.equal(path.props.fill, "#123456");
    }
  });

  it("returns null for a name outside the set, including prototype keys", () => {
    const set = createGlyphIconSet(svg);
    assert.equal(set.render("nope", { size: 16, color: "#000" }), null);
    assert.equal(set.render("toString", { size: 16, color: "#000" }), null);
  });

  it("needs the svg module and says so", () => {
    assert.throws(() => createGlyphIconSet(undefined as never), /react-native-svg/);
  });
});

describe("PLRNUI-239 IconGlyphs provider", () => {
  it("lets Icon find every glyph with no other provider, in light and dark, without console output", () => {
    for (const mode of ["light", "dark"] as const) {
      for (const name of GLYPH_NAMES) {
        const { renderer, messages } = render(
          <IconGlyphs svg={svg}>
            <Icon name={name} />
          </IconGlyphs>,
          mode,
        );
        assert.equal(renderer.root.findAllByType(host("Path")).length, 1, `${mode} ${name}`);
        assert.deepEqual(messages, [], `${mode} ${name}: no console.error or console.warn`);
      }
    }
  });

  it("uses the theme colour tokens of Icon and is decorative by default", () => {
    const { renderer } = render(
      <IconGlyphs svg={svg}>
        <Icon name="check" color="primary" />
      </IconGlyphs>,
    );
    const wrapper = renderer.root.findAll((n) => n.type === host("View") && n.props.accessibilityElementsHidden === true);
    assert.equal(wrapper.length, 1);
    const fill = renderer.root.findByType(host("Path")).props.fill as string;
    assert.match(fill, /^#[0-9A-Fa-f]{6}$/, "the primary token resolved to a colour");
  });

  it("an icon with a label becomes an image", () => {
    const { renderer } = render(
      <IconGlyphs svg={svg}>
        <Icon name="search" label="Search" />
      </IconGlyphs>,
    );
    const image = renderer.root.findAll((n) => n.props.accessibilityRole === "image");
    assert.equal(image[0]!.props.accessibilityLabel, "Search");
  });

  it("registers under another set name and leaves the default set alone", () => {
    const { renderer } = render(
      <IconGlyphs svg={svg} setName="glyphs">
        <Icon name="check" set="glyphs" />
        <Icon name="check" />
      </IconGlyphs>,
    );
    assert.equal(renderer.root.findAllByType(host("Path")).length, 1, "only the named set has glyphs");
  });

  it("a nested IconProvider replaces the default set and an unknown glyph renders nothing", () => {
    const Custom = ({ size }: { size: number; color: string }) => React.createElement("Custom", { size });
    const { renderer } = render(
      <IconGlyphs svg={svg}>
        <IconProvider sets={{ default: createIconSet({ check: Custom }) }}>
          <Icon name="check" />
          <Icon name="close" />
        </IconProvider>
      </IconGlyphs>,
    );
    assert.equal(renderer.root.findAllByType(host("Custom")).length, 1);
    assert.equal(renderer.root.findAllByType(host("Path")).length, 0);
  });

  it("keeps the adapter identity between renders (no needless re-render of every Icon)", () => {
    let renders = 0;
    function Counter() {
      renders += 1;
      return <Icon name="check" />;
    }
    const tree = (flag: number) => (
      <ThemeProvider persistTheme={false}>
        <IconGlyphs svg={svg}>
          <React.Fragment key={flag}>
            <Counter />
          </React.Fragment>
        </IconGlyphs>
      </ThemeProvider>
    );
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(tree(1));
    });
    const before = renders;
    act(() => renderer.update(tree(1)));
    assert.ok(renders - before <= 1, "an unchanged parent re-render does not rebuild the set");
  });

  it("glyph names are typed", () => {
    const name: GlyphName = "check";
    // @ts-expect-error not a glyph
    const bad: GlyphName = "not-a-glyph";
    void [name, bad];
  });
});
