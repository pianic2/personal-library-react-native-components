import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";

import { useMergedRefs } from "../../src/hooks/useMergedRefs.js";

type Ref = React.Ref<string>;

function Probe({ refs, out }: { refs: Array<Ref | undefined>; out: { callback: ((node: string | null) => void) | null } }) {
  out.callback = useMergedRefs<string>(...refs);
  return null;
}

function mount(refs: Array<Ref | undefined>) {
  const out: { callback: ((node: string | null) => void) | null } = { callback: null };
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(<Probe refs={refs} out={out} />);
  });
  return {
    out: out as { callback: (node: string | null) => void },
    update: (next: Array<Ref | undefined>) => act(() => renderer.update(<Probe refs={next} out={out} />)),
    unmount: () => act(() => renderer.unmount()),
  };
}

describe("PLRNUI-228 useMergedRefs", () => {
  it("assigns callback and object refs and clears them with null", () => {
    const seen: Array<string | null> = [];
    const objectRef: React.MutableRefObject<string | null> = { current: null };
    const { out } = mount([(node) => { seen.push(node); }, objectRef]);
    out.callback("node");
    assert.deepEqual(seen, ["node"]);
    assert.equal(objectRef.current, "node");
    out.callback(null);
    assert.deepEqual(seen, ["node", null]);
    assert.equal(objectRef.current, null);
  });

  it("ignores null and undefined refs", () => {
    const { out } = mount([undefined, null, undefined]);
    assert.doesNotThrow(() => out.callback("x"));
  });

  it("keeps the callback identity for the same refs and changes it for different refs", () => {
    const a: React.MutableRefObject<string | null> = { current: null };
    const b: React.MutableRefObject<string | null> = { current: null };
    const { out, update } = mount([a, b]);
    const first = out.callback;
    update([a, b]);
    assert.equal(out.callback, first);
    update([b, a]);
    assert.notEqual(out.callback, first);
    update([a]);
    out.callback("only-a");
    assert.equal(a.current, "only-a");
    assert.equal(b.current, null);
  });

  it("supports a changing number of refs and unmount", () => {
    const a: React.MutableRefObject<string | null> = { current: null };
    const { update, unmount, out } = mount([]);
    update([a, a, a]);
    out.callback("v");
    assert.equal(a.current, "v");
    unmount();
  });
});
