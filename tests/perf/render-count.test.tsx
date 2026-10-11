import React, { useState } from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";
import {
  DEFAULT_TOLERANCE,
  assertWithinBaseline,
  baselineRange,
  createRenderCounter,
  createRenderProbe,
  isWithinBaseline,
  loadBaselines,
} from "../helpers/render-count.js";

function mount(ui: React.ReactElement): TestRenderer.ReactTestRenderer {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(ui);
  });
  return renderer;
}

describe("PLRNUI-126 render-count helper", () => {
  it("counts the commits of a Profiler-wrapped subtree by phase and resets", () => {
    const counter = createRenderCounter();
    let bump: () => void = () => undefined;
    function Counter() {
      const [value, setValue] = useState(0);
      bump = () => setValue((v) => v + 1);
      return <>{value}</>;
    }
    mount(
      <counter.Profile>
        <Counter />
      </counter.Profile>,
    );
    assert.deepEqual([counter.commits, counter.mounts, counter.updates], [1, 1, 0]);
    act(() => bump());
    act(() => bump());
    assert.deepEqual([counter.commits, counter.mounts, counter.updates], [3, 1, 2]);
    counter.reset();
    assert.equal(counter.commits, 0);
    act(() => bump());
    assert.equal(counter.commits, 1);
  });

  it("an update that only re-renders a sibling outside the Profiler adds no commit", () => {
    const counter = createRenderCounter();
    let bump: () => void = () => undefined;
    const Inside = React.memo(function Inside() {
      return <>inside</>;
    });
    // Created once: an element that App re-creates would make the Profiler itself re-render and commit.
    const profiled = (
      <counter.Profile>
        <Inside />
      </counter.Profile>
    );
    function App() {
      const [value, setValue] = useState(0);
      bump = () => setValue((v) => v + 1);
      return (
        <>
          {value}
          {profiled}
        </>
      );
    }
    mount(<App />);
    counter.reset();
    act(() => bump());
    assert.equal(counter.commits, 0);
  });

  it("the render probe counts render function calls", () => {
    const probe = createRenderProbe();
    const renderer = mount(<probe.Probe>a</probe.Probe>);
    assert.equal(probe.renders, 1);
    act(() => renderer.update(<probe.Probe>b</probe.Probe>));
    assert.equal(probe.renders, 2);
    probe.reset();
    assert.equal(probe.renders, 0);
  });

  it("baselineRange widens by the relative tolerance in both directions and rejects invalid values", () => {
    assert.deepEqual(baselineRange({ count: 10 }), { min: 7, max: 13 });
    assert.equal(DEFAULT_TOLERANCE, 0.25);
    assert.deepEqual(baselineRange({ count: 10, tolerance: 0 }), { min: 10, max: 10 });
    assert.deepEqual(baselineRange({ count: 3, tolerance: 0.5 }), { min: 1, max: 5 });
    assert.throws(() => baselineRange({ count: -1 }), RangeError);
    assert.throws(() => baselineRange({ count: 1, tolerance: -0.1 }), RangeError);
    assert.throws(() => baselineRange({ count: Number.NaN }), RangeError);
  });

  it("isWithinBaseline and assertWithinBaseline compare against the recorded band", () => {
    const baselines = { exact: { count: 4, tolerance: 0, note: "four commits" }, loose: { count: 8 } };
    assert.equal(isWithinBaseline(4, baselines.exact), true);
    assert.equal(isWithinBaseline(5, baselines.exact), false);
    assert.equal(isWithinBaseline(3, baselines.exact), false);
    assert.equal(isWithinBaseline(10, baselines.loose), true);
    assert.equal(isWithinBaseline(11, baselines.loose), false);
    assert.doesNotThrow(() => assertWithinBaseline("exact", 4, baselines));
    assert.throws(() => assertWithinBaseline("exact", 5, baselines), /measured 5, recorded 4 \(allowed 4\.\.4\) - four commits/);
    assert.throws(() => assertWithinBaseline("missing", 1, baselines), /no baseline recorded for "missing"/);
  });

  it("the recorded baselines file is valid", () => {
    const baselines = loadBaselines();
    const names = Object.keys(baselines);
    assert.ok(names.length >= 3, "at least the three required scenarios");
    for (const name of names) {
      const baseline = baselines[name]!;
      assert.ok(Number.isInteger(baseline.count) && baseline.count >= 0, name);
      assert.doesNotThrow(() => baselineRange(baseline), name);
    }
  });
});
