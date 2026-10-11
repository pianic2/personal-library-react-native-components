import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as api from "../../src/responsive/index.js";

const EXPECTED_VALUES = [
  "CONTAINER_WIDTHS",
  "Container",
  "DEFAULT_SIZE_CLASS_THRESHOLDS",
  "DESKTOP_MIN_WIDTH",
  "FoldAdapterProvider",
  "Hide",
  "LARGE_TEXT_THRESHOLD",
  "Responsive",
  "ResponsiveContext",
  "ResponsiveProvider",
  "SPLIT_VIEW_DEFAULTS",
  "Show",
  "SplitView",
  "StackOnLargeText",
  "TABLET_MIN_SHORTEST_SIDE",
  "classifySize",
  "defaultFoldAdapter",
  "matchesCondition",
  "resolveAspectPosture",
  "resolveBreakpoint",
  "resolveDeviceClass",
  "resolvePrimaryWidth",
  "resolveResponsive",
  "resolveWindowSizeClass",
  "useAspectPosture",
  "useBreakpoint",
  "useBreakpointInfo",
  "useContainerBreakpoint",
  "useContainerSize",
  "useDeviceClass",
  "useFoldState",
  "useIsLargeText",
  "useOrientation",
  "useResponsiveValue",
  "useWindowSizeClass",
];

// Exported by a module of the area but kept internal on purpose.
const INTERNAL = new Set(["breakpointScaleProblem", "sizeClassProblem", "ContainerContext"]);

const dir = join(import.meta.dirname, "../../src/responsive");

/** Names a module exports, split in values and types: declarations and `export { a, b as c } [from]` lists. */
function exportedNames(source: string): { values: string[]; types: string[] } {
  const values: string[] = [];
  const types: string[] = [];
  for (const match of source.matchAll(/^export\s+(?:async\s+)?(?:const|let|var|function|class|enum)\s+([A-Za-z0-9_]+)/gm)) values.push(match[1]!);
  for (const match of source.matchAll(/^export\s+(?:interface|type)\s+([A-Za-z0-9_]+)/gm)) types.push(match[1]!);
  for (const match of source.matchAll(/^export\s+(type\s+)?\{([^}]*)\}/gm)) {
    for (const part of match[2]!.split(",")) {
      const name = part.trim().replace(/^type\s+/, "").split(/\s+as\s+/).pop()!.trim();
      if (name) (match[1] || /^\s*type\s/.test(part) ? types : values).push(name);
    }
  }
  return { values, types };
}

const barrel = exportedNames(readFileSync(join(dir, "index.ts"), "utf8"));
const INTERNAL_TYPES = new Set<string>();

describe("PLRNUI-226 responsive barrel", () => {
  it("exports exactly the documented value names", () => {
    assert.deepEqual(Object.keys(api).sort(), [...EXPECTED_VALUES].sort());
  });

  it("every exported value is defined", () => {
    for (const name of EXPECTED_VALUES) assert.notEqual((api as Record<string, unknown>)[name], undefined, name);
  });

  it("exports every public value and type of the modules of src/responsive (the internal helpers excepted)", () => {
    const missing: string[] = [];
    for (const file of readdirSync(dir)) {
      if (!/\.(ts|tsx)$/.test(file) || file === "index.ts") continue;
      const names = exportedNames(readFileSync(join(dir, file), "utf8"));
      for (const name of names.values) if (!INTERNAL.has(name) && !(name in api) && !barrel.values.includes(name)) missing.push(`${file}: value ${name}`);
      for (const name of names.types) if (!INTERNAL_TYPES.has(name) && !barrel.types.includes(name)) missing.push(`${file}: type ${name}`);
    }
    assert.deepEqual(missing, []);
  });

  it("the barrel also carries the types of the hooks and Container modules it re-exports", () => {
    for (const name of ["Breakpoint", "BreakpointInfo", "ContainerProps", "ContainerSizeName", "SplitViewProps", "FoldAdapterProviderProps", "HingeBounds", "ShowCondition"]) {
      assert.ok(barrel.types.includes(name), name);
    }
  });

  it("the type-name scanner finds declarations and export lists (guards the test itself)", () => {
    const sample = `export const A = 1;\nexport interface B {}\nexport type C = 1;\nexport { d, e as f } from "./x.js";\nexport type { G, H } from "./y.js";\nexport { type I, j } from "./z.js";`;
    assert.deepEqual(exportedNames(sample), { values: ["A", "d", "f", "j"], types: ["B", "C", "G", "H", "I"] });
  });

  it("keeps the internal helpers out of the barrel", () => {
    for (const name of INTERNAL) assert.equal(name in api, false, name);
  });

  it("exports the same bindings as the modules (no copies)", async () => {
    const show = await import("../../src/responsive/Show.js");
    const hook = await import("../../src/hooks/useBreakpoint.js");
    const splitView = await import("../../src/responsive/SplitView.js");
    assert.ok(api.Show === show.Show && api.Hide === show.Hide);
    assert.ok(api.useBreakpoint === hook.useBreakpoint);
    assert.ok(api.SplitView === splitView.SplitView);
  });

  it("the barrel is not re-exported from the package root yet", () => {
    const root = readFileSync(join(import.meta.dirname, "../../src/index.ts"), "utf8");
    assert.equal(/responsive\/index/.test(root), false);
  });
});
