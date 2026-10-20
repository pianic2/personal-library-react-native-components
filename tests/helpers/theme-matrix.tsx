// Theme-matrix harness (PLRNUI-245, E12-15): runs a test body under every theme the library ships.
//
// The matrix is light and dark of the base theme, plus light and dark of every preset found in src/theme/presets/.
// Presets are discovered from that directory at load time, so a preset added by E2 (one file per preset, exporting a
// `ThemePreset` made with `defineTheme`) joins the matrix without editing this file.
import React from "react";
import { describe } from "node:test";
import { existsSync, readdirSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import TestRenderer, { act } from "react-test-renderer";
import { ThemeProvider } from "../../src";
import type { ThemeMode } from "../../src";
import type { ThemePreset } from "../../src/theme/defineTheme";

export const THEME_MODES = ["light", "dark"] as const satisfies readonly ThemeMode[];

export interface ThemeCase {
  /** `base` or the preset id. */
  id: string;
  mode: ThemeMode;
  /** Absent for the base theme. */
  preset?: ThemePreset;
}

export interface ThemeMatrixContext extends ThemeCase {
  /** Wraps `element` in a ThemeProvider for this case (no persistence). */
  wrap(element: React.ReactElement): React.ReactElement;
  /** Renders `element` under this case and returns the test renderer. */
  render(element: React.ReactElement): TestRenderer.ReactTestRenderer;
}

export const DEFAULT_PRESETS_DIR = resolve(import.meta.dirname, "../../src/theme/presets");

function isThemePreset(value: unknown): value is ThemePreset {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  const isTheme = (side: unknown) => !!side && typeof side === "object" && "colors" in (side as object);
  return isTheme(candidate.light) && isTheme(candidate.dark);
}

/**
 * Finds the presets in `dir`: every `.ts`/`.tsx`/`.mjs`/`.js` file (not `index`, not declarations) whose exports include a
 * `ThemePreset`. The id is the preset's own string `id` when it has one, else the file name. A missing directory means
 * no presets yet.
 */
export async function discoverPresets(dir: string = DEFAULT_PRESETS_DIR): Promise<Array<{ id: string; preset: ThemePreset }>> {
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir)
    .filter((file) => /\.(tsx?|mjs|js)$/.test(file) && !file.endsWith(".d.ts") && !/^index\./.test(file))
    .sort();
  const found: Array<{ id: string; preset: ThemePreset }> = [];
  for (const file of files) {
    const loaded = (await import(pathToFileURL(join(dir, file)).href)) as Record<string, unknown>;
    for (const value of Object.values(loaded)) {
      if (!isThemePreset(value)) continue;
      const own = (value as unknown as { id?: unknown }).id;
      found.push({ id: typeof own === "string" ? own : basename(file, extname(file)), preset: value });
    }
  }
  return found;
}

/** The base theme plus every preset, each in light and dark. */
export function buildThemeCases(presets: Array<{ id: string; preset: ThemePreset }>): ThemeCase[] {
  const cases: ThemeCase[] = [];
  for (const mode of THEME_MODES) cases.push({ id: "base", mode });
  for (const { id, preset } of presets) for (const mode of THEME_MODES) cases.push({ id, mode, preset });
  return cases;
}

/** Resolved at load: the matrix a test file runs against. */
export const themeCases: ThemeCase[] = buildThemeCases(await discoverPresets());

function contextFor(themeCase: ThemeCase): ThemeMatrixContext {
  const wrap = (element: React.ReactElement) => (
    <ThemeProvider initialMode={themeCase.mode} preset={themeCase.preset} persistTheme={false}>
      {element}
    </ThemeProvider>
  );
  return {
    ...themeCase,
    wrap,
    render(element) {
      let renderer!: TestRenderer.ReactTestRenderer;
      act(() => {
        renderer = TestRenderer.create(wrap(element));
      });
      return renderer;
    },
  };
}

/**
 * Registers one `describe(`${name} [${id}/${mode}]`)` per theme case and calls `fn` inside it with that case's context,
 * so `fn` declares its `it(...)` blocks as usual.
 */
export function forEachTheme(name: string, fn: (theme: ThemeMatrixContext) => void, cases: readonly ThemeCase[] = themeCases): void {
  for (const themeCase of cases) {
    describe(`${name} [${themeCase.id}/${themeCase.mode}]`, () => fn(contextFor(themeCase)));
  }
}

type Json = TestRenderer.ReactTestRendererJSON | TestRenderer.ReactTestRendererNode;

/**
 * Style problems in a rendered tree: a style key whose value is `undefined`, `null`, `NaN` or the string "undefined"/"NaN"
 * (e.g. from a token that did not resolve). Returns one `path.key` entry per problem; empty means clean.
 */
export function findUndefinedStyleValues(tree: TestRenderer.ReactTestRendererJSON | TestRenderer.ReactTestRendererJSON[] | null): string[] {
  const problems: string[] = [];
  const checkStyle = (style: unknown, path: string) => {
    if (Array.isArray(style)) return style.forEach((item, index) => checkStyle(item, `${path}[${index}]`));
    if (!style || typeof style !== "object") return;
    for (const [key, value] of Object.entries(style)) {
      if (value === undefined || value === null || (typeof value === "number" && Number.isNaN(value)) || value === "undefined" || value === "NaN") {
        problems.push(`${path}.${key}`);
      } else if (typeof value === "object") {
        checkStyle(value, `${path}.${key}`);
      }
    }
  };
  const visit = (node: Json | null, path: string) => {
    if (!node || typeof node === "string") return;
    const props = node.props as Record<string, unknown>;
    for (const [prop, value] of Object.entries(props)) {
      if (/style$/i.test(prop)) checkStyle(value, `${path}.${prop}`);
    }
    node.children?.forEach((child, index) => visit(child, `${path}/${typeof child === "string" ? "text" : child.type}[${index}]`));
  };
  const roots = Array.isArray(tree) ? tree : tree ? [tree] : [];
  roots.forEach((root, index) => visit(root, `${root.type}[${index}]`));
  return problems;
}
