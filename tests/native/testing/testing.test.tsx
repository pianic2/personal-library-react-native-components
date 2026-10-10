import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { act } from "react-test-renderer";

import { useCapability } from "../../../src/native/core/index.js";
import type { CapabilityId } from "../../../src/native/core/index.js";
import { createMockAdapters, renderWithCapabilities } from "../../../src/native/testing/index.js";
import "./mockAdapters.types.js";

const root = resolve(import.meta.dirname, "../../..");
const allIds: CapabilityId[] = ["clipboard", "haptics", "share", "storage", "biometric", "network"];

describe("PLRNUI-146 native testing helpers", () => {
  it("has a mock adapter for every capability id", () => {
    const mocks = createMockAdapters();
    assert.deepEqual(Object.keys(mocks.adapters).sort(), [...allIds].sort());
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
    assert.equal(await mocks.adapters.biometric.api.authenticate("x"), false);
    mocks.reset();
    assert.equal(await mocks.adapters.storage.api.getItem("k"), null);
    assert.deepEqual(await mocks.adapters.network.api.getStatus(), { connected: true });
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
