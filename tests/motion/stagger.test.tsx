import React from "react";
import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { act } from "react-test-renderer";
import { Text } from "react-native";
import { Stagger } from "../../src/motion/Stagger.js";
import { STAGGER_MAX_DELAY, staggerDelays, useStagger, type StaggerOptions } from "../../src/motion/useStagger.js";
import { motion } from "../../src/tokens/motion.base.js";
import { renderWithMotion } from "../helpers/motion.js";

function Probe({ count, options, sink }: { count: number; options?: StaggerOptions; sink: Array<readonly number[]> }) {
  sink.push(useStagger(count, options));
  return null;
}

function delaysFor(count: number, options?: StaggerOptions, reduce = false): readonly number[] {
  const sink: Array<readonly number[]> = [];
  renderWithMotion(<Probe count={count} options={options} sink={sink} />, reduce);
  return sink[sink.length - 1]!;
}

describe("useStagger", () => {
  it("returns index * step, with the token as the default step", () => {
    assert.deepEqual(delaysFor(4), [0, 1, 2, 3].map((i) => i * motion.stagger.base));
    assert.deepEqual(delaysFor(3, { delay: "fast" }), [0, 30, 60]);
    assert.deepEqual(delaysFor(3, { delay: 100 }), [0, 100, 200]);
  });

  it("caps every delay at max (default 400)", () => {
    assert.equal(STAGGER_MAX_DELAY, 400);
    const d = delaysFor(30, { delay: 100 });
    assert.equal(Math.max(...d), 400);
    assert.equal(d[3], 300);
    assert.equal(d[29], 400);
    assert.deepEqual(delaysFor(5, { delay: 100, max: 250 }), [0, 100, 200, 250, 250]);
  });

  it("handles empty and invalid input", () => {
    assert.deepEqual(delaysFor(0), []);
    assert.deepEqual(staggerDelays(-2, 50), []);
    assert.deepEqual(staggerDelays(3, Number.NaN), [0, 0, 0]);
  });

  it("returns all zeros under reduced motion", () => {
    assert.deepEqual(delaysFor(5, { delay: 100 }, true), [0, 0, 0, 0, 0]);
  });

  it("returns the same array instance for the same inputs", () => {
    const sink: Array<readonly number[]> = [];
    let rerender: (count: number) => void = () => {};
    let tick: () => void = () => {};
    function Host() {
      const [count, setCount] = React.useState(4);
      const [, setN] = React.useState(0);
      rerender = setCount;
      tick = () => setN((n) => n + 1);
      return <Probe count={count} options={{ delay: "fast" }} sink={sink} />;
    }
    renderWithMotion(<Host />);
    const first = sink[0];
    act(() => tick());
    assert.ok(sink.length >= 2);
    assert.equal(sink[sink.length - 1], first);
    act(() => rerender(5));
    assert.notEqual(sink[sink.length - 1], first);
    act(() => rerender(4));
    assert.deepEqual(sink[sink.length - 1], first);
  });
});

describe("Stagger", () => {
  const texts = (r: ReturnType<typeof renderWithMotion>["renderer"]) => r.root.findAllByType(Text).map((t) => String(t.props.children));

  it("reveals children one by one after their delays", () => {
    mock.timers.enable({ apis: ["setTimeout"] });
    try {
      const { renderer } = renderWithMotion(
        <Stagger delay={100}>
          <Text>a</Text>
          <Text>b</Text>
          <Text>c</Text>
        </Stagger>,
      );
      assert.deepEqual(texts(renderer), ["a"]);
      act(() => mock.timers.tick(100));
      assert.deepEqual(texts(renderer), ["a", "b"]);
      act(() => mock.timers.tick(100));
      assert.deepEqual(texts(renderer), ["a", "b", "c"]);
    } finally {
      mock.timers.reset();
    }
  });

  it("shows everything at once under reduced motion", () => {
    const { renderer } = renderWithMotion(
      <Stagger delay={100}>
        <Text>a</Text>
        <Text>b</Text>
      </Stagger>,
      true,
    );
    assert.deepEqual(texts(renderer), ["a", "b"]);
  });
});
