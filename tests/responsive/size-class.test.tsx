import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import TestRenderer, { act } from "react-test-renderer";
import { ResponsiveContext } from "../../src/responsive/context.js";
import {
  DEFAULT_SIZE_CLASS_THRESHOLDS,
  classifySize,
  resolveWindowSizeClass,
  useOrientation,
  useWindowSizeClass,
  type SizeClass,
  type WindowSizeClass,
} from "../../src/responsive/useWindowSizeClass.js";
import { useOrientation as nativeUseOrientation, type WindowMetrics, type WindowMetricsSource } from "../../src/native/orientation/index.js";
import { breakpoints } from "../../src/tokens/breakpoints.base.js";
import { withWindowSize } from "../helpers/dimensions.js";

function classAt(width: number, height = 700): WindowSizeClass {
  let seen: WindowSizeClass | undefined;
  function Probe() {
    seen = useWindowSizeClass();
    return null;
  }
  act(() => {
    TestRenderer.create(withWindowSize(<Probe />, { width, height }));
  });
  return seen!;
}

describe("PLRNUI-145 useWindowSizeClass boundaries", () => {
  const widths: Array<[number, SizeClass]> = [
    [0, "compact"],
    [599, "compact"],
    [600, "medium"],
    [839, "medium"],
    [840, "expanded"],
    [2000, "expanded"],
  ];
  for (const [width, expected] of widths) {
    it(`width ${width} is ${expected}`, () => {
      assert.equal(classAt(width).width, expected);
      assert.equal(classifySize(width, DEFAULT_SIZE_CLASS_THRESHOLDS.width), expected);
    });
  }

  const heights: Array<[number, SizeClass]> = [
    [0, "compact"],
    [479, "compact"],
    [480, "medium"],
    [899, "medium"],
    [900, "expanded"],
    [3000, "expanded"],
  ];
  for (const [height, expected] of heights) {
    it(`height ${height} is ${expected}`, () => {
      assert.equal(classAt(700, height).height, expected);
    });
  }

  it("width and height classes are independent", () => {
    assert.deepEqual(classAt(1000, 300), { width: "expanded", height: "compact" });
    assert.deepEqual(classAt(400, 1000), { width: "compact", height: "expanded" });
  });

  it("the default steps are 600/840 for width and 480/900 for height", () => {
    assert.deepEqual(DEFAULT_SIZE_CLASS_THRESHOLDS, { width: { medium: 600, expanded: 840 }, height: { medium: 480, expanded: 900 } });
  });
});

describe("PLRNUI-145 threshold override through ResponsiveContext", () => {
  function overridden(width: number, height: number, sizeClassThresholds: Parameters<typeof resolveWindowSizeClass>[2]): WindowSizeClass {
    let seen: WindowSizeClass | undefined;
    function Probe() {
      seen = useWindowSizeClass();
      return null;
    }
    act(() => {
      TestRenderer.create(
        <ResponsiveContext.Provider value={{ breakpoints, window: { width, height }, sizeClassThresholds }}>
          <Probe />
        </ResponsiveContext.Provider>
      );
    });
    return seen!;
  }

  it("a context override changes the classes", () => {
    assert.deepEqual(classAt(700, 500), { width: "medium", height: "medium" });
    assert.deepEqual(overridden(700, 500, { width: { medium: 800, expanded: 1000 }, height: { medium: 400, expanded: 450 } }), {
      width: "compact",
      height: "expanded",
    });
  });

  it("a partial override keeps the other steps and the other axis at their defaults", () => {
    assert.deepEqual(overridden(700, 500, { width: { expanded: 650 } }), { width: "expanded", height: "medium" });
    assert.deepEqual(overridden(500, 700, { width: { medium: 450 } }), { width: "medium", height: "medium" });
    assert.deepEqual(overridden(700, 500, {}), { width: "medium", height: "medium" });
    assert.deepEqual(overridden(700, 500, undefined), { width: "medium", height: "medium" });
  });

  it("resolveWindowSizeClass applies the same override rules without React", () => {
    assert.deepEqual(resolveWindowSizeClass(700, 500), { width: "medium", height: "medium" });
    assert.deepEqual(resolveWindowSizeClass(700, 500, { height: { medium: 600 } }), { width: "medium", height: "compact" });
  });

  it("keeps the result object while both classes are unchanged and replaces it when one changes", () => {
    const seen: WindowSizeClass[] = [];
    function Probe() {
      seen.push(useWindowSizeClass());
      return null;
    }
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(withWindowSize(<Probe />, { width: 650, height: 700 }));
    });
    act(() => renderer.update(withWindowSize(<Probe />, { width: 700, height: 650 })));
    assert.equal(seen.at(-1), seen[0], "650 -> 700 stays medium: same object");
    act(() => renderer.update(withWindowSize(<Probe />, { width: 900, height: 650 })));
    assert.notEqual(seen.at(-1), seen[0]);
    assert.equal(seen.at(-1)!.width, "expanded");
  });
});

describe("PLRNUI-145 orientation", () => {
  it("re-exports the single useOrientation of src/native/orientation (no second implementation)", () => {
    assert.equal(useOrientation, nativeUseOrientation);
    const text = readFileSync("src/responsive/useWindowSizeClass.ts", "utf8");
    assert.ok(!/export function useOrientation/.test(text));
  });

  it("a rotation of the window source changes the orientation", () => {
    let metrics: WindowMetrics = { width: 390, height: 844, scale: 3, fontScale: 1 };
    const listeners = new Set<() => void>();
    const source: WindowMetricsSource = {
      get: () => metrics,
      subscribe: (listener) => {
        listeners.add(listener);
        return () => void listeners.delete(listener);
      },
    };
    const seen: string[] = [];
    function Probe() {
      seen.push(useOrientation(source));
      return null;
    }
    act(() => {
      TestRenderer.create(<Probe />);
    });
    assert.equal(seen.at(-1), "portrait");
    act(() => {
      metrics = { ...metrics, width: 844, height: 390 };
      listeners.forEach((l) => l());
    });
    assert.equal(seen.at(-1), "landscape");
  });
});

describe("PLRNUI-145 dependencies", () => {
  it("adds no dependency (no expo-screen-orientation) and imports only local modules and react", () => {
    const text = readFileSync("src/responsive/useWindowSizeClass.ts", "utf8");
    for (const m of text.matchAll(/from\s+["']([^"']+)["']/g)) {
      const spec = m[1]!;
      assert.ok(spec.startsWith(".") || spec === "react", spec);
    }
    assert.ok(!/expo-screen-orientation/.test(text));
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { dependencies?: Record<string, string> };
    assert.ok(!Object.keys(pkg.dependencies ?? {}).includes("expo-screen-orientation"));
  });
});
