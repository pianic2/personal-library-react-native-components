import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { act } from "react-test-renderer";
import { MotionProvider, type ReduceMotionMode } from "../../src/motion/MotionProvider.js";
import { useMotionPreference } from "../../src/motion/useMotionPreference.js";
import { renderWithCapabilities } from "../../src/native/testing/index.js";
import { createMotionMocks, renderWithMotion } from "../helpers/motion.js";

function Probe({ log }: { log: boolean[] }) {
  log.push(useMotionPreference());
  return null;
}

describe("PLRNUI-135 MotionProvider and useMotionPreference", () => {
  it("returns true when the mocked accessibility capability reports reduce motion, without a provider", () => {
    const log: boolean[] = [];
    renderWithMotion(<Probe log={log} />, true);
    assert.equal(log.at(-1), true);
  });

  it("returns false when the system does not ask to reduce motion, without a provider", () => {
    const log: boolean[] = [];
    renderWithMotion(<Probe log={log} />, false);
    assert.equal(log.at(-1), false);
  });

  it("follows the system setting live in system mode", () => {
    const log: boolean[] = [];
    const { mocks } = renderWithMotion(
      <MotionProvider reduceMotion="system">
        <Probe log={log} />
      </MotionProvider>
    );
    assert.equal(log.at(-1), false);
    act(() => mocks.setAccessibility({ reduceMotion: true }));
    assert.equal(log.at(-1), true);
    act(() => mocks.setAccessibility({ reduceMotion: false }));
    assert.equal(log.at(-1), false);
  });

  const table: Array<[ReduceMotionMode | undefined, boolean, boolean]> = [
    [undefined, false, false],
    [undefined, true, true],
    ["system", false, false],
    ["system", true, true],
    ["always", false, true],
    ["always", true, true],
    ["never", false, false],
    ["never", true, false],
  ];
  for (const [mode, system, expected] of table) {
    it(`mode ${String(mode)} with system reduce motion ${system} gives ${expected}`, () => {
      const log: boolean[] = [];
      renderWithMotion(
        <MotionProvider reduceMotion={mode}>
          <Probe log={log} />
        </MotionProvider>,
        system
      );
      assert.equal(log.at(-1), expected);
    });
  }

  it("'always' overrides a system false and 'never' overrides a system true, also when the system changes later", () => {
    const always: boolean[] = [];
    const never: boolean[] = [];
    const mocks = createMotionMocks(false);
    renderWithCapabilities(
      <>
        <MotionProvider reduceMotion="always">
          <Probe log={always} />
        </MotionProvider>
        <MotionProvider reduceMotion="never">
          <Probe log={never} />
        </MotionProvider>
      </>,
      mocks
    );
    assert.equal(always.at(-1), true);
    assert.equal(never.at(-1), false);
    act(() => mocks.setAccessibility({ reduceMotion: true }));
    assert.equal(always.at(-1), true);
    assert.equal(never.at(-1), false);
  });

  it("the nearest provider wins and the mode changes at runtime", () => {
    const log: boolean[] = [];
    const mocks = createMotionMocks(true);
    const tree = (outer: ReduceMotionMode, inner: ReduceMotionMode) => (
      <MotionProvider reduceMotion={outer}>
        <MotionProvider reduceMotion={inner}>
          <Probe log={log} />
        </MotionProvider>
      </MotionProvider>
    );
    const r = renderWithCapabilities(tree("never", "system"), mocks);
    assert.equal(log.at(-1), true, "inner system follows the mocked system value");
    act(() => r.update(tree("always", "never")));
    assert.equal(log.at(-1), false, "inner never wins over outer always");
  });

  it("an unknown mode from untyped code falls back to the system value", () => {
    const log: boolean[] = [];
    renderWithMotion(
      <MotionProvider reduceMotion={"sometimes" as unknown as ReduceMotionMode}>
        <Probe log={log} />
      </MotionProvider>,
      true
    );
    assert.equal(log.at(-1), true);
  });

  it("does not crash and defaults to false when neither AccessibilityInfo nor matchMedia is available and no capability is injected", () => {
    const g = globalThis as { matchMedia?: unknown };
    const saved = g.matchMedia;
    delete g.matchMedia;
    try {
      const log: boolean[] = [];
      renderWithCapabilities(
        <MotionProvider>
          <Probe log={log} />
        </MotionProvider>
      );
      assert.equal(log.at(-1), false);
      const bare: boolean[] = [];
      renderWithCapabilities(<Probe log={bare} />);
      assert.equal(bare.at(-1), false);
    } finally {
      if (saved !== undefined) g.matchMedia = saved;
    }
  });

  it("does not crash when matchMedia throws and no capability is injected", () => {
    const g = globalThis as { matchMedia?: unknown };
    const saved = g.matchMedia;
    g.matchMedia = () => {
      throw new Error("unsupported");
    };
    try {
      const log: boolean[] = [];
      renderWithCapabilities(<Probe log={log} />);
      assert.equal(log.at(-1), false);
    } finally {
      if (saved === undefined) delete g.matchMedia;
      else g.matchMedia = saved;
    }
  });

  it("does not crash and does not reduce motion when the accessibility capability is denied", () => {
    const log: boolean[] = [];
    const mocks = createMotionMocks(true);
    mocks.setPermission("accessibility", "denied");
    renderWithCapabilities(<Probe log={log} />, mocks);
    assert.equal(log.at(-1), false);
  });

  it("src/motion has no second implementation of useReducedMotion", () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        return statSync(path).isDirectory() ? walk(path) : [path];
      });
    for (const file of walk("src/motion")) {
      assert.ok(!/export function useReducedMotion/.test(readFileSync(file, "utf8")), file);
    }
    assert.ok(/from "\.\.\/native\/accessibility\/index\.js"/.test(readFileSync("src/motion/useMotionPreference.ts", "utf8")));
  });
});
