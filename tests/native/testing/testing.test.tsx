import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { act } from "react-test-renderer";

import { useCapability } from "../../../src/native/core/index.js";
import type { CapabilityId } from "../../../src/native/core/index.js";
import { createMockAdapters, mockedCapabilityIds, renderWithCapabilities } from "../../../src/native/testing/index.js";
import { expectedIds } from "./mockAdapters.types.js";

const root = resolve(import.meta.dirname, "../../..");
const allIds = Object.keys(expectedIds) as CapabilityId[];

describe("PLRNUI-146 native testing helpers", () => {
  it("has a mock adapter for every capability id", () => {
    const mocks = createMockAdapters();
    assert.deepEqual(Object.keys(mocks.adapters).sort(), [...allIds].sort());
    assert.deepEqual([...mockedCapabilityIds].sort(), [...allIds].sort());
    for (const id of allIds) {
      assert.equal(mocks.adapters[id].id, id);
      assert.equal(mocks.adapters[id].status, "available");
    }
  });

  it("records calls in order and resets them", async () => {
    const mocks = createMockAdapters();
    await mocks.adapters.clipboard.api.setString("hi");
    assert.equal(await mocks.adapters.clipboard.api.getString(), "hi");
    await mocks.adapters.haptics.api.impact("light");
    assert.deepEqual(mocks.calls.map((c) => `${c.id}.${c.method}`), ["clipboard.setString", "clipboard.getString", "haptics.impact"]);
    assert.deepEqual(mocks.callsOf("haptics", "impact")[0].args, ["light"]);
    assert.equal(mocks.callsOf("clipboard").length, 2);
    mocks.reset();
    assert.equal(mocks.calls.length, 0);
    assert.equal(await mocks.adapters.clipboard.api.getString(), "");
  });

  it("applies overrides and still records them", async () => {
    const mocks = createMockAdapters({ share: { share: async () => "dismissed" } });
    assert.equal(await mocks.adapters.share.api.share({ message: "m" }), "dismissed");
    assert.equal(mocks.callsOf("share").length, 1);
  });

  it("controls network, app state, keyboard and permissions", async () => {
    const mocks = createMockAdapters();
    const seen: string[] = [];
    mocks.state.appState.subscribe((s) => seen.push(s));
    mocks.state.keyboard.subscribe((k) => seen.push(k.visible ? "kb-open" : "kb-closed"));
    mocks.setNetwork(false);
    assert.deepEqual(await mocks.adapters.network.api.getStatus(), { connected: false });
    mocks.setAppState("background");
    mocks.setKeyboard(true);
    assert.deepEqual(seen, ["background", "kb-open"]);
    mocks.setPermission("storage", "denied");
    await assert.rejects(mocks.adapters.storage.api.getItem("k"), /permission denied: storage/);
    assert.equal(await mocks.adapters.biometric.api.authenticate("x"), true);
    mocks.setPermission("biometric", "denied");
    await assert.rejects(mocks.adapters.biometric.api.authenticate("x"), /permission denied: biometric/);
    mocks.reset();
    assert.equal(await mocks.adapters.storage.api.getItem("k"), null);
    assert.deepEqual(await mocks.adapters.network.api.getStatus(), { connected: true });
  });

  it("reset restores the fake clock (time and pending timers)", () => {
    const mocks = createMockAdapters();
    let fired = false;
    mocks.clock.setTimeout(() => (fired = true), 50);
    mocks.clock.advance(10);
    mocks.reset();
    assert.equal(mocks.clock.now(), 0);
    assert.equal(mocks.clock.pending(), 0);
    mocks.clock.advance(100);
    assert.equal(fired, false);
  });

  it("reset is silent and detaches emitter listeners", () => {
    const mocks = createMockAdapters();
    const seen: unknown[] = [];
    mocks.state.network.subscribe((v) => seen.push(v));
    mocks.state.appState.subscribe((v) => seen.push(v));
    mocks.state.keyboard.subscribe((v) => seen.push(v));
    mocks.setNetwork(false);
    mocks.setAppState("background");
    mocks.setKeyboard(true);
    seen.length = 0;
    mocks.reset();
    assert.deepEqual(seen, []);
    assert.equal(mocks.state.appState.get(), "active");
    mocks.setNetwork(false);
    mocks.setAppState("inactive");
    mocks.setKeyboard(true);
    assert.deepEqual(seen, []);
  });

  it("emitter handles unsubscribe mid-emit, throwing listeners and re-entrancy", () => {
    const { state } = createMockAdapters();
    const e = state.appState;
    const log: string[] = [];
    let unsubB = () => {};
    e.subscribe(() => {
      log.push("a");
      unsubB();
    });
    unsubB = e.subscribe(() => log.push("b"));
    e.subscribe(() => {
      throw new Error("boom");
    });
    e.subscribe(() => log.push("d"));
    assert.throws(() => e.set("background"), /boom/);
    assert.deepEqual(log, ["a", "d"]);

    const e2 = createMockAdapters().state.keyboard;
    const order: string[] = [];
    e2.subscribe((k) => {
      order.push(`l1:${k.height}`);
      if (k.height === 1) e2.set({ visible: true, height: 2 });
    });
    e2.set({ visible: true, height: 1 });
    assert.deepEqual(order, ["l1:1", "l1:2"]);
    assert.equal(e2.get().height, 2);
  });

  it("clock.advance validates input and stays consistent when a callback throws or reschedules", () => {
    const { clock } = createMockAdapters();
    assert.throws(() => clock.advance(-1), RangeError);
    assert.throws(() => clock.advance(Number.NaN), RangeError);
    assert.throws(() => clock.advance(Infinity), RangeError);
    assert.equal(clock.now(), 0);
    const out: number[] = [];
    clock.setTimeout(() => {
      out.push(clock.now());
      clock.setTimeout(() => out.push(clock.now()), 5);
    }, 10);
    clock.advance(20);
    assert.deepEqual(out, [10, 15]);
    clock.setTimeout(() => {
      throw new Error("cb");
    }, 5);
    clock.setTimeout(() => out.push(-1), 8);
    assert.throws(() => clock.advance(30), /cb/);
    assert.equal(clock.now(), 25);
    assert.equal(clock.pending(), 1);
    clock.advance(5);
    assert.equal(out.at(-1), -1);
    assert.equal(clock.now(), 30);
    assert.equal(clock.pending(), 0);
  });

  it("a denied permission rejects every method of that capability, biometric included", async () => {
    const calls: Record<CapabilityId, () => Promise<unknown>[]> = {
      clipboard: () => { const a = mocks.adapters.clipboard.api; return [a.getString(), a.setString("x")]; },
      haptics: () => { const a = mocks.adapters.haptics.api; return [a.impact(), a.notification("success"), a.selection()]; },
      share: () => [mocks.adapters.share.api.share({ message: "m" })],
      storage: () => { const a = mocks.adapters.storage.api; return [a.getItem("k"), a.setItem("k", "v"), a.removeItem("k")]; },
      biometric: () => { const a = mocks.adapters.biometric.api; return [a.isAvailable(), a.authenticate("p")]; },
      network: () => [mocks.adapters.network.api.getStatus()],
    };
    const mocks = createMockAdapters({ share: { share: async () => "dismissed" } });
    for (const id of allIds) {
      await Promise.all(calls[id]().map((p) => p)); // granted: resolves
      mocks.setPermission(id, "denied");
      const results = await Promise.allSettled(calls[id]());
      for (const r of results) {
        assert.equal(r.status, "rejected", id);
        assert.match(String((r as PromiseRejectedResult).reason), new RegExp(`permission denied: ${id}`));
      }
      mocks.setPermission(id, "granted");
    }
  });

  it("rejects overrides that set a method to undefined", () => {
    assert.throws(
      () => createMockAdapters({ clipboard: { getString: undefined } as never }),
      /override clipboard\.getString is undefined/
    );
  });

  it("fake clock runs due callbacks in order", () => {
    const { clock } = createMockAdapters();
    const out: number[] = [];
    clock.setTimeout(() => out.push(2), 20);
    clock.setTimeout(() => out.push(1), 10);
    const cancel = clock.setTimeout(() => out.push(3), 15);
    cancel();
    clock.advance(9);
    assert.deepEqual(out, []);
    clock.advance(11);
    assert.deepEqual(out, [1, 2]);
    assert.equal(clock.now(), 20);
    assert.equal(clock.pending(), 0);
  });

  it("renderWithCapabilities supplies mock adapters to the tree", async () => {
    const mocks = createMockAdapters();
    function Probe() {
      const haptics = useCapability("haptics");
      return React.createElement("Text", { onPress: () => void haptics.api.selection() }, haptics.status);
    }
    const renderer = renderWithCapabilities(<Probe />, mocks);
    const node = renderer.root.findByType("Text" as never);
    assert.equal(node.children[0], "available");
    await act(async () => node.props.onPress());
    assert.equal(mocks.callsOf("haptics", "selection").length, 1);
    const plain = renderWithCapabilities(<Probe />, { haptics: { ...mocks.adapters.haptics, status: "unavailable" } });
    assert.equal(plain.root.findByType("Text" as never).children[0], "unavailable");
  });

  it("src/native/testing imports no expo-* module", () => {
    const dir = join(root, "src/native/testing");
    assert.ok(existsSync(dir));
    const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
    for (const file of walk(dir)) assert.doesNotMatch(readFileSync(file, "utf8"), /["']expo[-/]/, file);
  });
});
