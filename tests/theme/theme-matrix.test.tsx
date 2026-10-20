import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

// @ts-expect-error the loader is plain JavaScript without declarations
import { loadMetas } from "../../scripts/lib/meta.mjs";
import { Text, useTheme } from "../../src";
import { createBaseTheme } from "../../src/theme/defaultTheme";
import { defineTheme } from "../../src/theme/defineTheme";
import { fixtures, requireFixture } from "../helpers/fixtures";
import { buildThemeCases, discoverPresets, findUndefinedStyleValues, forEachTheme, themeCases } from "../helpers/theme-matrix";

const root = resolve(import.meta.dirname, "../..");
const names: string[] = loadMetas(root).map((entry: { dir: string }) => entry.dir);

// Known conditional `undefined` style values in components (a deliberate "no style" branch, not an unresolved token).
// Fixing them is outside this ticket's ownership (src/components/*). An entry must still occur: once the component is
// fixed the test below fails and the entry has to be removed, so this list can only shrink.
const KNOWN_UNDEFINED_STYLE: Record<string, RegExp> = {
  Chip: /\.opacity$/, // Chip.tsx remove button: `opacity: disabled ? 1 : undefined`
  SideBar: /\.alignSelf$/, // SideBar.tsx: `alignSelf: variant === "fixed" ? "stretch" : undefined`
};

function renderQuietly<T>(run: () => T): { value: T; errors: unknown[][] } {
  const errors: unknown[][] = [];
  const original = console.error;
  console.error = (...args: unknown[]) => {
    if (!String(args[0]).includes("react-test-renderer is deprecated")) errors.push(args);
  };
  try {
    return { value: run(), errors };
  } finally {
    console.error = original;
  }
}

describe("PLRNUI-245 theme-matrix harness", () => {
  it("covers every component directory (every fixture belongs to one)", () => {
    assert.deepEqual(Object.keys(fixtures).sort(), [...names].sort());
  });

  it("always covers the base theme in light and dark", () => {
    const base = themeCases.filter((c) => c.id === "base").map((c) => c.mode);
    assert.deepEqual(base, ["light", "dark"]);
  });

  it("adds light and dark of each preset", () => {
    const preset = defineTheme({ light: { preset: "tmp" } });
    const cases = buildThemeCases([{ id: "tmp", preset }]);
    assert.deepEqual(
      cases.map((c) => `${c.id}/${c.mode}`),
      ["base/light", "base/dark", "tmp/light", "tmp/dark"],
    );
  });

  it("finds no presets in a missing directory", async () => {
    assert.deepEqual(await discoverPresets(join(tmpdir(), "texo-no-such-presets-dir")), []);
  });

  it("auto-extends: a preset file dropped into the presets directory joins the matrix", async () => {
    const dir = mkdtempSync(join(tmpdir(), "texo-presets-"));
    try {
      const theme = (mode: "light" | "dark") => JSON.stringify(createBaseTheme(mode));
      writeFileSync(join(dir, "alpha.mjs"), `export const alpha = { id: "alpha", light: ${theme("light")}, dark: ${theme("dark")} };\n`);
      writeFileSync(join(dir, "beta.mjs"), `export default { light: ${theme("light")}, dark: ${theme("dark")} };\nexport const notAPreset = { light: 1 };\n`);
      writeFileSync(join(dir, "index.mjs"), `export const ignored = { light: ${theme("light")}, dark: ${theme("dark")} };\n`);
      const found = await discoverPresets(dir);
      assert.deepEqual(found.map((f) => f.id), ["alpha", "beta"]);
      const cases = buildThemeCases(found);
      assert.deepEqual(
        cases.map((c) => `${c.id}/${c.mode}`),
        ["base/light", "base/dark", "alpha/light", "alpha/dark", "beta/light", "beta/dark"],
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("findUndefinedStyleValues reports undefined, null and NaN style values and ignores clean styles", () => {
    const tree = {
      type: "View",
      props: { style: [{ color: "red" }, { width: undefined, height: Number.NaN }] },
      children: [{ type: "Text", props: { style: { margin: null, padding: 4 } }, children: ["x"] }],
    } as unknown as Parameters<typeof findUndefinedStyleValues>[0];
    assert.deepEqual(findUndefinedStyleValues(tree), [
      "View[0].style[1].width",
      "View[0].style[1].height",
      "View[0]/Text[0].style.margin",
    ]);
    assert.deepEqual(findUndefinedStyleValues(null), []);
  });
});

forEachTheme("PLRNUI-245 theme context", ({ mode, preset, render }) => {
  it("provides the matching mode and a resolved theme", () => {
    let seen: { mode: string; background: string } | undefined;
    function Probe() {
      const { mode: current, colors } = useTheme();
      seen = { mode: current, background: colors.background };
      return <Text>probe</Text>;
    }
    render(<Probe />);
    assert.equal(seen?.mode, mode);
    assert.ok(seen?.background);
    if (preset) assert.ok(preset[mode].colors.background);
  });
});

forEachTheme("PLRNUI-245 smoke render", ({ render }) => {
  for (const name of names) {
    it(`${name} renders without console.error and with no undefined style values`, () => {
      const { value: renderer, errors } = renderQuietly(() => render(requireFixture(name)()));
      const tree = renderer.toJSON();
      assert.ok(tree, `${name} rendered nothing`);
      assert.deepEqual(errors, []);
      const problems = findUndefinedStyleValues(tree as Parameters<typeof findUndefinedStyleValues>[0]);
      const known = KNOWN_UNDEFINED_STYLE[name];
      if (known) {
        assert.ok(problems.length > 0, `${name} no longer has undefined style values: remove it from KNOWN_UNDEFINED_STYLE`);
        assert.deepEqual(problems.filter((problem) => !known.test(problem)), []);
      } else {
        assert.deepEqual(problems, []);
      }
    });
  }
});
