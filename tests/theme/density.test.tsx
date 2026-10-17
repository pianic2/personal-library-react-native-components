import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";
import { ThemeProvider } from "../../src";
import { DensityProvider } from "../../src/theme/DensityProvider";
import { MIN_HIT_TARGET, useDensity } from "../../src/theme/useDensity";
import type { Density } from "../../src/theme/useDensity";
import { defaultTheme } from "../../src/theme/defaultTheme";
import type { DensityLevel } from "../../src/theme/contract";

function Probe({ out }: { out: { d?: Density } }) {
  out.d = useDensity();
  return null;
}

function mount(element: React.ReactElement, themeDensity?: DensityLevel) {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(<ThemeProvider density={themeDensity}>{element}</ThemeProvider>);
  });
  return r;
}

function read(level?: DensityLevel, themeDensity?: DensityLevel): Density {
  const out: { d?: Density } = {};
  mount(level ? <DensityProvider level={level}><Probe out={out} /></DensityProvider> : <Probe out={out} />, themeDensity);
  return out.d!;
}

describe("PLRNUI-274 density runtime", () => {
  it("scale(40) is 35 at compact and 45 at comfortable (the spacious level of the ticket), 40 at regular", () => {
    assert.equal(read("compact").scale(40), 35);
    assert.equal(read("comfortable").scale(40), 45);
    assert.equal(read("regular").scale(40), 40);
  });

  it("scale multiplies heights, paddings and gaps and rounds to two decimals; other values pass through", () => {
    const compact = read("compact");
    assert.equal(compact.scale(12), 10.5);
    assert.equal(compact.scale(0), 0);
    assert.equal(compact.scale(3), 2.63);
    assert.ok(Number.isNaN(compact.scale(Number.NaN)));
    assert.equal(compact.scale(Number.POSITIVE_INFINITY), Number.POSITIVE_INFINITY);
  });

  it("the hit target helper never returns less than 44 for any size key at any level", () => {
    for (const level of ["compact", "regular", "comfortable"] as const) {
      const density = read(level);
      for (const key of Object.keys(defaultTheme.size.height) as Array<keyof typeof defaultTheme.size.height>) {
        assert.ok(density.control(key) >= MIN_HIT_TARGET, `${level} ${key} -> ${density.control(key)}`);
      }
    }
    assert.equal(MIN_HIT_TARGET, 44);
  });

  it("control returns the scaled height once it is above 44, and 44 below it", () => {
    assert.equal(read("comfortable").control("xl"), 63); // 56 * 1.125
    assert.equal(read("regular").control("lg"), 48);
    assert.equal(read("compact").control("lg"), 44); // 48 * 0.875 = 42 -> 44
    assert.equal(read("compact").control("xs"), 44);
  });

  it("a nested DensityProvider overrides the outer one, and the outer one applies again outside it", () => {
    const seen: Record<string, DensityLevel> = {};
    function Level({ name }: { name: string }) {
      seen[name] = useDensity().level;
      return null;
    }
    mount(
      <DensityProvider level="compact">
        <Level name="outer" />
        <DensityProvider level="comfortable">
          <Level name="inner" />
        </DensityProvider>
        <Level name="after" />
      </DensityProvider>,
    );
    assert.deepEqual(seen, { outer: "compact", inner: "comfortable", after: "compact" });
  });

  it("without a DensityProvider useDensity returns the default density of the theme", () => {
    const withoutProvider = read();
    assert.equal(withoutProvider.level, defaultTheme.density.default);
    assert.equal(withoutProvider.level, "regular");
    assert.equal(withoutProvider.factor, 1);
    assert.equal(read(undefined, "compact").level, "compact");
    assert.equal(read(undefined, "compact").scale(40), 35);
  });

  it("an invalid level is ignored: the enclosing density stays", () => {
    const out: { d?: Density } = {};
    mount(
      <DensityProvider level="compact">
        <DensityProvider level={"huge" as DensityLevel}>
          <Probe out={out} />
        </DensityProvider>
      </DensityProvider>,
    );
    assert.equal(out.d!.level, "compact");
  });

  it("the result is stable between renders with the same level", () => {
    const seen: Density[] = [];
    function Collect() {
      seen.push(useDensity());
      return null;
    }
    const tree = (
      <ThemeProvider>
        <DensityProvider level="compact">
          <Collect />
        </DensityProvider>
      </ThemeProvider>
    );
    let r!: TestRenderer.ReactTestRenderer;
    act(() => {
      r = TestRenderer.create(tree);
    });
    act(() => r.update(tree));
    assert.equal(seen[0], seen[seen.length - 1]);
  });

  it("renders in light and dark with no console.error or console.warn", () => {
    const calls: unknown[][] = [];
    const { error, warn } = console;
    const record = (...args: unknown[]) => void (String(args[0]).includes("react-test-renderer is deprecated") || calls.push(args));
    console.error = record;
    console.warn = record;
    try {
      for (const mode of ["light", "dark"] as const) {
        const out: { d?: Density } = {};
        act(() => {
          TestRenderer.create(
            <ThemeProvider preference={mode}>
              <DensityProvider level="compact">
                <Probe out={out} />
              </DensityProvider>
            </ThemeProvider>,
          );
        });
        assert.equal(out.d!.scale(40), 35);
      }
    } finally {
      console.error = error;
      console.warn = warn;
    }
    assert.deepEqual(calls, []);
  });
});
