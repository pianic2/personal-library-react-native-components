import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import TestRenderer, { act } from "react-test-renderer";
import { Platform } from "react-native";
import { resolveBreakpoint, useBreakpoint, useBreakpointInfo, type Breakpoint, type BreakpointInfo } from "../../src/hooks/useBreakpoint.js";
import { ResponsiveContext } from "../../src/responsive/context.js";
import { breakpoints } from "../../src/tokens/breakpoints.base.js";
import { withWindowSize } from "../helpers/dimensions.js";

function render(ui: React.ReactElement): void {
  act(() => {
    TestRenderer.create(ui);
  });
}

function bpAt(width: number): Breakpoint {
  let seen: Breakpoint | undefined;
  function Probe() {
    seen = useBreakpoint();
    return null;
  }
  render(withWindowSize(<Probe />, { width }));
  return seen!;
}

describe("PLRNUI-137 breakpoint tokens", () => {
  it("defines xs 0, sm 480, md 768, lg 1024, xl 1280", () => {
    assert.deepEqual({ ...breakpoints }, { xs: 0, sm: 480, md: 768, lg: 1024, xl: 1280 });
  });
});

describe("PLRNUI-137 useBreakpoint resolves from the window width on every platform", () => {
  it("width 820 on an ios mock returns 'md' (it was 'base' on native)", () => {
    const platform = Platform as { OS: string };
    const saved = platform.OS;
    platform.OS = "ios";
    try {
      assert.equal(bpAt(820), "md");
    } finally {
      platform.OS = saved;
    }
  });

  for (const os of ["ios", "android", "web", "test"]) {
    it(`gives the same result on ${os}`, () => {
      const platform = Platform as { OS: string };
      const saved = platform.OS;
      platform.OS = os;
      try {
        assert.equal(bpAt(500), "sm");
        assert.equal(bpAt(1100), "lg");
      } finally {
        platform.OS = saved;
      }
    });
  }

  // Boundary table: each pair straddles a token value and the names differ across it.
  const table: Array<[number, Breakpoint]> = [
    [0, "base"],
    [479, "base"],
    [480, "sm"],
    [767, "sm"],
    [768, "md"],
    [1023, "md"],
    [1024, "lg"],
    [1279, "lg"],
    [1280, "xl"],
    [5000, "xl"],
  ];
  for (const [width, expected] of table) {
    it(`width ${width} resolves to ${expected}`, () => {
      assert.equal(bpAt(width), expected);
      assert.equal(resolveBreakpoint(width, breakpoints), expected);
    });
  }

  it("479/480, 767/768 resolve to different names and the cut-offs equal the token values", () => {
    assert.notEqual(bpAt(breakpoints.sm - 1), bpAt(breakpoints.sm));
    assert.notEqual(bpAt(breakpoints.md - 1), bpAt(breakpoints.md));
    assert.notEqual(bpAt(breakpoints.lg - 1), bpAt(breakpoints.lg));
    assert.notEqual(bpAt(breakpoints.xl - 1), bpAt(breakpoints.xl));
    assert.equal(bpAt(breakpoints.sm), "sm");
    assert.equal(bpAt(breakpoints.md), "md");
    assert.equal(bpAt(breakpoints.lg), "lg");
    assert.equal(bpAt(breakpoints.xl), "xl");
  });

  it("640 is no longer the sm cut-off (the web value changed from 640 to 480)", () => {
    assert.equal(bpAt(500), "sm");
    assert.equal(bpAt(639), "sm");
  });

  it("follows the real window when no fixed size is given (react-native shim: 1280 wide)", () => {
    let seen: Breakpoint | undefined;
    function Probe() {
      seen = useBreakpoint();
      return null;
    }
    render(<Probe />);
    assert.equal(seen, "xl");
  });

  it("a custom scale in the responsive context is honoured", () => {
    let seen: Breakpoint | undefined;
    function Probe() {
      seen = useBreakpoint();
      return null;
    }
    const scale = { xs: 0, sm: 100, md: 200, lg: 300, xl: 400 };
    render(withWindowSize(<Probe />, { width: 250 }, scale as unknown as typeof breakpoints));
    assert.equal(seen, "md");
  });
});

describe("PLRNUI-137 useBreakpointInfo", () => {
  function info(width: number, height = 600): BreakpointInfo {
    let seen: BreakpointInfo | undefined;
    function Probe() {
      seen = useBreakpointInfo();
      return null;
    }
    render(withWindowSize(<Probe />, { width, height }));
    return seen!;
  }

  it("returns bp, width and height", () => {
    const i = info(820, 1180);
    assert.equal(i.bp, "md");
    assert.equal(i.width, 820);
    assert.equal(i.height, 1180);
  });

  it("isAtLeast / isBelow compare against every breakpoint", () => {
    const order: Breakpoint[] = ["base", "sm", "md", "lg", "xl"];
    for (const [width, current] of [[100, "base"], [500, "sm"], [800, "md"], [1100, "lg"], [1400, "xl"]] as Array<[number, Breakpoint]>) {
      const i = info(width);
      assert.equal(i.bp, current);
      for (const other of order) {
        const atLeast = order.indexOf(current) >= order.indexOf(other);
        assert.equal(i.isAtLeast(other), atLeast, `${current} atLeast ${other}`);
        assert.equal(i.isBelow(other), !atLeast, `${current} below ${other}`);
      }
    }
  });
});

describe("PLRNUI-137 ResponsiveContext", () => {
  it("defaults to the token scale without a provider", () => {
    let value: React.ContextType<typeof ResponsiveContext> | undefined;
    function Probe() {
      value = React.useContext(ResponsiveContext);
      return null;
    }
    render(<Probe />);
    assert.deepEqual({ ...value!.breakpoints }, { ...breakpoints });
    assert.equal(value!.orientationLock, undefined);
    assert.equal(value!.window, undefined);
  });
});

describe("PLRNUI-137 duplicate removal and register", () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? walk(path) : [path];
    });

  it("src/utils/useBreakpoint.ts is gone and nothing in src references it", () => {
    assert.equal(existsSync("src/utils/useBreakpoint.ts"), false);
    for (const file of walk("src")) {
      assert.ok(!/utils\/useBreakpoint/.test(readFileSync(file, "utf8")), file);
    }
  });

  it("the breaking-change register has a useBreakpoint native-behaviour entry", () => {
    const text = readFileSync("audit/migration/breaking-change-register.md", "utf8");
    assert.match(text, /useBreakpoint/);
    assert.match(text, /native/i);
  });
});
