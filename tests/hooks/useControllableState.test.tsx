import React from "react";
import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";

import { useControllableState } from "../../src/hooks/useControllableState.js";
import type { ControllableStateSetter, UseControllableStateOptions } from "../../src/hooks/useControllableState.js";

type Api = { value: number; set: ControllableStateSetter<number> };

function Probe({ options, api }: { options: UseControllableStateOptions<number>; api: { current: Api | null } }) {
  const [value, set] = useControllableState(options);
  api.current = { value, set };
  return React.createElement("probe", { value });
}

function mount(options: UseControllableStateOptions<number>) {
  const api: { current: Api | null } = { current: null };
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(<Probe options={options} api={api} />);
  });
  return {
    api: api as { current: Api },
    update: (next: UseControllableStateOptions<number>) => act(() => renderer.update(<Probe options={next} api={api} />)),
    unmount: () => act(() => renderer.unmount()),
  };
}

const globals = globalThis as { __DEV__?: boolean };
const originalDev = globals.__DEV__;
const originalWarn = console.warn;
let warnings: string[] = [];

beforeEach(() => {
  warnings = [];
  console.warn = (message?: unknown) => {
    warnings.push(String(message));
  };
});
afterEach(() => {
  globals.__DEV__ = originalDev;
  console.warn = originalWarn;
});

describe("PLRNUI-228 useControllableState", () => {
  it("uncontrolled: updates internal state and notifies", () => {
    const calls: number[] = [];
    const { api } = mount({ defaultValue: 1, onChange: (n) => calls.push(n) });
    assert.equal(api.current.value, 1);
    act(() => api.current.set(2));
    assert.equal(api.current.value, 2);
    assert.deepEqual(calls, [2]);
  });

  it("controlled: never mutates internal state, only notifies", () => {
    const calls: number[] = [];
    const { api, update } = mount({ value: 5, defaultValue: 0, onChange: (n) => calls.push(n) });
    act(() => api.current.set(6));
    assert.equal(api.current.value, 5);
    assert.deepEqual(calls, [6]);
    update({ value: 6, defaultValue: 0, onChange: (n) => calls.push(n) });
    assert.equal(api.current.value, 6);
  });

  it("onChange fires only on a real change", () => {
    const calls: number[] = [];
    const { api } = mount({ defaultValue: 3, onChange: (n) => calls.push(n) });
    act(() => api.current.set(3));
    act(() => api.current.set((previous) => previous));
    assert.deepEqual(calls, []);
  });

  it("supports functional updates against the latest value", () => {
    const calls: number[] = [];
    const { api } = mount({ defaultValue: 0, onChange: (n) => calls.push(n) });
    act(() => {
      api.current.set((previous) => previous + 1);
      api.current.set((previous) => previous + 1);
    });
    assert.equal(api.current.value, 2);
    assert.deepEqual(calls, [1, 2]);
  });

  it("keeps a stable setter identity and survives unmount", () => {
    const { api, update, unmount } = mount({ defaultValue: 0 });
    const first = api.current.set;
    update({ defaultValue: 0 });
    assert.equal(api.current.set, first);
    unmount();
  });

  it("warns in __DEV__ when switching between controlled and uncontrolled", () => {
    globals.__DEV__ = true;
    const { update } = mount({ defaultValue: 0 });
    update({ value: 1, defaultValue: 0 });
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /uncontrolled to controlled/);
    update({ defaultValue: 0 });
    assert.equal(warnings.length, 2);
    assert.match(warnings[1], /controlled to uncontrolled/);
  });

  it("does not warn outside __DEV__ or when the mode is stable", () => {
    globals.__DEV__ = false;
    const off = mount({ defaultValue: 0 });
    off.update({ value: 1, defaultValue: 0 });
    assert.deepEqual(warnings, []);
    globals.__DEV__ = true;
    const stable = mount({ value: 1, defaultValue: 0 });
    stable.update({ value: 2, defaultValue: 0 });
    assert.deepEqual(warnings, []);
  });
});
