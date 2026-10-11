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

function exportedValueNames(source: string): string[] {
  const names: string[] = [];
  for (const match of source.matchAll(/^export\s+(?:async\s+)?(?:const|function|class)\s+([A-Za-z0-9_]+)/gm)) names.push(match[1]!);
  return names;
}

describe("PLRNUI-226 responsive barrel", () => {
  it("exports exactly the documented value names", () => {
    assert.deepEqual(Object.keys(api).sort(), [...EXPECTED_VALUES].sort());
  });

  it("every exported value is defined", () => {
    for (const name of EXPECTED_VALUES) assert.notEqual((api as Record<string, unknown>)[name], undefined, name);
  });

  it("exports every public value of the modules of src/responsive (the internal helpers excepted)", () => {
    const missing: string[] = [];
    for (const file of readdirSync(dir)) {
      if (!/\.(ts|tsx)$/.test(file) || file === "index.ts") continue;
      for (const name of exportedValueNames(readFileSync(join(dir, file), "utf8"))) {
        if (!INTERNAL.has(name) && !(name in api)) missing.push(`${file}: ${name}`);
      }
    }
    assert.deepEqual(missing, []);
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
