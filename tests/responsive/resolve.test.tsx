import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";
import type { Breakpoint } from "../../src/hooks/useBreakpoint.js";
import { resolveResponsive, type ResponsiveValue } from "../../src/responsive/resolve.js";
import { useResponsiveValue } from "../../src/responsive/useResponsiveValue.js";
import { withWindowSize } from "../helpers/dimensions.js";

const ALL: Breakpoint[] = ["base", "sm", "md", "lg", "xl"];

describe("PLRNUI-156 resolveResponsive", () => {
  // Every row: the map, then the expected result for base, sm, md, lg, xl.
  const table: Array<[string, Partial<Record<Breakpoint, number>>, Array<number | undefined>]> = [
    ["all keys", { base: 1, sm: 2, md: 3, lg: 4, xl: 5 }, [1, 2, 3, 4, 5]],
    ["only base", { base: 1 }, [1, 1, 1, 1, 1]],
    ["base and md", { base: 1, md: 3 }, [1, 1, 3, 3, 3]],
    ["sm and xl", { sm: 2, xl: 5 }, [undefined, 2, 2, 2, 5]],
    ["only md", { md: 3 }, [undefined, undefined, 3, 3, 3]],
    ["only xl", { xl: 5 }, [undefined, undefined, undefined, undefined, 5]],
    ["gaps", { base: 1, lg: 4 }, [1, 1, 1, 4, 4]],
    ["undefined counts as missing", { base: 1, sm: undefined, md: 3 }, [1, 1, 3, 3, 3]],
    ["falsy values are values", { base: 1, sm: 0, md: 3 }, [1, 0, 3, 3, 3]],
  ];
  for (const [name, map, expected] of table) {
    it(`falls back to the nearest smaller defined key: ${name}`, () => {
      assert.deepEqual(ALL.map((bp) => resolveResponsive(map, bp)), expected);
    });
  }

  it("a plain value returns itself for every breakpoint", () => {
    for (const bp of ALL) {
      assert.equal(resolveResponsive(7, bp), 7);
      assert.equal(resolveResponsive("row", bp), "row");
      assert.equal(resolveResponsive(false, bp), false);
      assert.equal(resolveResponsive(null, bp), null);
      assert.equal(resolveResponsive(undefined, bp), undefined);
      assert.equal(resolveResponsive(0, bp), 0);
    }
  });

  it("returns the stored object itself, so identity is stable for unchanged inputs", () => {
    const phone = { padding: 8 };
    const tablet = { padding: 16 };
    const map = { base: phone, md: tablet };
    assert.equal(resolveResponsive(map, "sm"), phone);
    assert.equal(resolveResponsive(map, "sm"), resolveResponsive(map, "base"));
    assert.equal(resolveResponsive(map, "xl"), tablet);
  });

  it("a plain object that is not a breakpoint map, an array and a class instance are returned as is", () => {
    const style = { padding: 8, margin: 4 };
    const mixed = { base: 1, padding: 8 } as unknown as ResponsiveValue<number>;
    const list = [1, 2, 3];
    class Box {
      sm = 1;
    }
    const box = new Box();
    const empty = {};
    assert.equal(resolveResponsive(style, "md"), style);
    assert.equal(resolveResponsive(mixed, "md"), mixed);
    assert.equal(resolveResponsive(list, "md"), list);
    assert.equal(resolveResponsive(box, "md"), box);
    assert.equal(resolveResponsive(empty, "md"), empty);
  });

  it("a map with a null prototype is read as a map", () => {
    const map = Object.assign(Object.create(null) as Record<string, number>, { base: 1, md: 3 });
    assert.equal(resolveResponsive(map as Partial<Record<Breakpoint, number>>, "lg"), 3);
  });
});

describe("PLRNUI-156 useResponsiveValue", () => {
  function valueAt(width: number, map: ResponsiveValue<string>): string | undefined {
    let seen: string | undefined;
    function Probe() {
      seen = useResponsiveValue(map);
      return null;
    }
    act(() => {
      TestRenderer.create(withWindowSize(<Probe />, { width }));
    });
    return seen;
  }

  it("resolves the value of the current breakpoint", () => {
    const map = { base: "phone", md: "tablet", xl: "desktop" };
    assert.equal(valueAt(320, map), "phone");
    assert.equal(valueAt(500, map), "phone");
    assert.equal(valueAt(820, map), "tablet");
    assert.equal(valueAt(1100, map), "tablet");
    assert.equal(valueAt(1400, map), "desktop");
  });

  it("a plain value is returned for every width", () => {
    assert.equal(valueAt(320, "same"), "same");
    assert.equal(valueAt(1400, "same"), "same");
  });

  it("follows a window change and returns the same reference while the breakpoint is unchanged", () => {
    const phone = { n: 1 };
    const tablet = { n: 2 };
    const map = { base: phone, md: tablet };
    const seen: Array<{ n: number } | undefined> = [];
    function Probe() {
      seen.push(useResponsiveValue(map));
      return null;
    }
    const tree = (width: number) => withWindowSize(<Probe />, { width });
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(tree(400));
    });
    act(() => renderer.update(tree(450)));
    assert.equal(seen.at(-1), seen[0], "same breakpoint (base) keeps the same reference");
    act(() => renderer.update(tree(900)));
    assert.equal(seen.at(-1), tablet);
    assert.notEqual(seen.at(-1), seen[0]);
  });
});

// Type-level contract (compiled by `tsc -p tsconfig.tests.json`): ResponsiveValue<number> accepts both forms.
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;
export const plain: ResponsiveValue<number> = 8;
export const mapped: ResponsiveValue<number> = { base: 4, md: 8 };
// @ts-expect-error a key outside the breakpoint names is rejected
export const wrongKey: ResponsiveValue<number> = { huge: 8 };
// @ts-expect-error a value of another type is rejected
export const wrongValue: ResponsiveValue<number> = { md: "8" };
export type ResolveResult = Expect<Equal<ReturnType<typeof resolveResponsive<number>>, number | undefined>>;
export type HookResult = Expect<Equal<ReturnType<typeof useResponsiveValue<number>>, number | undefined>>;
