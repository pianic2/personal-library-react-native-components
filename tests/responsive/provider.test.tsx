import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";
import { ResponsiveProvider, breakpointScaleProblem, sizeClassProblem } from "../../src/responsive/ResponsiveProvider.js";
import { ResponsiveContext, type ResponsiveContextValue } from "../../src/responsive/context.js";
import { useBreakpoint, type Breakpoint } from "../../src/hooks/useBreakpoint.js";
import { useWindowSizeClass, type WindowSizeClass } from "../../src/responsive/useWindowSizeClass.js";
import { breakpoints } from "../../src/tokens/breakpoints.base.js";

function withDev<T>(dev: boolean | undefined, fn: () => T): T {
  const g = globalThis as { __DEV__?: boolean };
  const saved = g.__DEV__;
  if (dev === undefined) delete g.__DEV__;
  else g.__DEV__ = dev;
  try {
    return fn();
  } finally {
    if (saved === undefined) delete g.__DEV__;
    else g.__DEV__ = saved;
  }
}

function readContext(ui: React.ReactElement): ResponsiveContextValue {
  let seen: ResponsiveContextValue | undefined;
  function Probe() {
    seen = React.useContext(ResponsiveContext);
    return null;
  }
  act(() => {
    TestRenderer.create(React.cloneElement(ui, undefined, <Probe />));
  });
  return seen!;
}

describe("PLRNUI-173 ResponsiveProvider fills the context", () => {
  it("overrides breakpoints and the hook follows them", () => {
    let bp: Breakpoint | undefined;
    function Probe() {
      bp = useBreakpoint();
      return null;
    }
    act(() => {
      TestRenderer.create(
        <ResponsiveProvider breakpoints={{ sm: 100, md: 200, lg: 300, xl: 400 }} window={{ width: 250, height: 600 }}>
          <Probe />
        </ResponsiveProvider>
      );
    });
    assert.equal(bp, "md");
  });

  it("overrides size classes and useWindowSizeClass follows them", () => {
    let sc: WindowSizeClass | undefined;
    function Probe() {
      sc = useWindowSizeClass();
      return null;
    }
    act(() => {
      TestRenderer.create(
        <ResponsiveProvider sizeClasses={{ width: { medium: 300, expanded: 500 } }} window={{ width: 400, height: 700 }}>
          <Probe />
        </ResponsiveProvider>
      );
    });
    assert.deepEqual(sc, { width: "medium", height: "medium" });
  });

  it("a partial breakpoint override keeps the token values for the other keys", () => {
    const value = readContext(<ResponsiveProvider breakpoints={{ md: 800 }} />);
    assert.deepEqual({ ...value.breakpoints }, { ...breakpoints, md: 800 });
  });

  it("passes the orientation lock and the fixed window through and defaults to the token scale", () => {
    const value = readContext(<ResponsiveProvider orientationLock="landscape" window={{ width: 1, height: 2 }} />);
    assert.equal(value.orientationLock, "landscape");
    assert.deepEqual(value.window, { width: 1, height: 2 });
    assert.deepEqual({ ...value.breakpoints }, { ...breakpoints });
    assert.equal(value.sizeClassThresholds, undefined);
  });
});

describe("PLRNUI-173 nested providers merge", () => {
  it("an inner provider keeps the outer values it does not set and wins where it sets", () => {
    let seen: ResponsiveContextValue | undefined;
    function Probe() {
      seen = React.useContext(ResponsiveContext);
      return null;
    }
    act(() => {
      TestRenderer.create(
        <ResponsiveProvider
          breakpoints={{ sm: 500, md: 900 }}
          sizeClasses={{ width: { medium: 700, expanded: 1000 }, height: { medium: 500 } }}
          orientationLock="portrait"
          window={{ width: 100, height: 200 }}
        >
          <ResponsiveProvider breakpoints={{ md: 950 }} sizeClasses={{ width: { expanded: 1200 }, height: { expanded: 1000 } }}>
            <Probe />
          </ResponsiveProvider>
        </ResponsiveProvider>
      );
    });
    assert.deepEqual({ ...seen!.breakpoints }, { ...breakpoints, sm: 500, md: 950 });
    assert.deepEqual(seen!.sizeClassThresholds, { width: { medium: 700, expanded: 1200 }, height: { medium: 500, expanded: 1000 } });
    assert.equal(seen!.orientationLock, "portrait");
    assert.deepEqual(seen!.window, { width: 100, height: 200 });
  });

  it("an inner orientation lock and window replace the outer ones", () => {
    let seen: ResponsiveContextValue | undefined;
    function Probe() {
      seen = React.useContext(ResponsiveContext);
      return null;
    }
    act(() => {
      TestRenderer.create(
        <ResponsiveProvider orientationLock="portrait" window={{ width: 1, height: 1 }}>
          <ResponsiveProvider orientationLock="landscape" window={{ width: 2, height: 2 }}>
            <Probe />
          </ResponsiveProvider>
        </ResponsiveProvider>
      );
    });
    assert.equal(seen!.orientationLock, "landscape");
    assert.deepEqual(seen!.window, { width: 2, height: 2 });
  });
});

describe("PLRNUI-173 validation", () => {
  const invalid: Array<[string, React.ReactElement]> = [
    ["breakpoints not ascending", <ResponsiveProvider key="a" breakpoints={{ md: 400, lg: 300 }} />],
    ["equal neighbouring breakpoints", <ResponsiveProvider key="b" breakpoints={{ sm: 768 }} />],
    ["xs not 0", <ResponsiveProvider key="c" breakpoints={{ xs: 10 }} />],
    ["NaN breakpoint", <ResponsiveProvider key="d" breakpoints={{ lg: Number.NaN }} />],
    ["size classes not ascending", <ResponsiveProvider key="e" sizeClasses={{ width: { medium: 900, expanded: 800 } }} />],
    ["negative size class", <ResponsiveProvider key="f" sizeClasses={{ height: { medium: -1 } }} />],
  ];
  for (const [name, element] of invalid) {
    it(`throws in __DEV__ for ${name}`, () => {
      withDev(true, () => {
        assert.throws(() => act(() => void TestRenderer.create(element)), /ResponsiveProvider:/);
      });
    });

    it(`outside __DEV__ it does not throw for ${name} and keeps the enclosing values`, () => {
      withDev(false, () => {
        const value = readContext(React.cloneElement(element));
        assert.deepEqual({ ...value.breakpoints }, { ...breakpoints });
        assert.equal(value.sizeClassThresholds, undefined);
      });
    });
  }

  it("an invalid part of one provider does not hide the valid other part outside __DEV__", () => {
    withDev(undefined, () => {
      const value = readContext(<ResponsiveProvider breakpoints={{ md: 100, lg: 50 }} sizeClasses={{ width: { medium: 500, expanded: 900 } }} />);
      assert.deepEqual({ ...value.breakpoints }, { ...breakpoints });
      assert.deepEqual(value.sizeClassThresholds, { width: { medium: 500, expanded: 900 }, height: undefined });
    });
  });

  it("a nested override is validated against the merged scale of the enclosing provider", () => {
    withDev(true, () => {
      assert.throws(
        () =>
          act(() => {
            TestRenderer.create(
              <ResponsiveProvider breakpoints={{ md: 900 }}>
                <ResponsiveProvider breakpoints={{ lg: 800 }} />
              </ResponsiveProvider>
            );
          }),
        /strictly ascending/
      );
    });
  });

  it("the default scale and valid overrides report no problem", () => {
    assert.equal(breakpointScaleProblem(breakpoints), undefined);
    assert.equal(breakpointScaleProblem({ ...breakpoints, sm: 1, md: 2, lg: 3, xl: 4 }), undefined);
    assert.equal(sizeClassProblem(undefined), undefined);
    assert.equal(sizeClassProblem({ width: { medium: 1, expanded: 2 }, height: { expanded: 5 } }), undefined);
  });
});

describe("PLRNUI-173 context identity", () => {
  it("equal inline props keep the same context value across re-renders and a changed prop replaces it", () => {
    const seen: ResponsiveContextValue[] = [];
    function Probe() {
      seen.push(React.useContext(ResponsiveContext));
      return null;
    }
    const tree = (md: number) => (
      <ResponsiveProvider breakpoints={{ md }} sizeClasses={{ width: { medium: 650 } }} window={{ width: 5, height: 6 }}>
        <Probe />
      </ResponsiveProvider>
    );
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(tree(800));
    });
    act(() => renderer.update(tree(800)));
    assert.equal(seen.at(-1), seen[0]);
    act(() => renderer.update(tree(900)));
    assert.notEqual(seen.at(-1), seen[0]);
    assert.equal(seen.at(-1)!.breakpoints.md, 900);
  });
});
