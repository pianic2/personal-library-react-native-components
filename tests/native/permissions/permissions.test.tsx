import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import * as ReactNative from "react-native";
import TestRenderer, { act } from "react-test-renderer";

import { CapabilityProvider } from "../../../src/native/core/index.js";
import { createMockAdapters } from "../../../src/native/testing/index.js";
import { PermissionsProvider, mapExpoPermission, usePermission } from "../../../src/native/permissions/index.js";
import type { PermissionAdapter, PermissionAdapters, PermissionControls, PermissionResult } from "../../../src/native/permissions/index.js";

function fakeAdapter(initial: PermissionResult, onRequest?: () => PermissionResult) {
  let current = initial;
  const calls = { check: 0, request: 0, openSettings: 0 };
  const adapter: PermissionAdapter = {
    check: async () => (calls.check++, current),
    request: async () => (calls.request++, (current = onRequest ? onRequest() : current)),
    openSettings: async () => void calls.openSettings++,
  };
  return { adapter, calls, set: (next: PermissionResult) => void (current = next) };
}

function mount(adapters: PermissionAdapters | undefined, kind: "camera" | "location" = "camera") {
  const mocks = createMockAdapters();
  const out: { c?: PermissionControls } = {};
  function Probe() {
    out.c = usePermission(kind);
    return null;
  }
  let r!: TestRenderer.ReactTestRenderer;
  const tree = (a: PermissionAdapters | undefined) => (
    <CapabilityProvider adapters={mocks.adapters}>
      <PermissionsProvider {...(a ? { adapters: a } : {})}>
        <Probe />
      </PermissionsProvider>
    </CapabilityProvider>
  );
  return {
    out,
    mocks,
    async render() {
      await act(async () => {
        r = TestRenderer.create(tree(adapters));
      });
    },
    async update(next: PermissionAdapters | undefined) {
      await act(async () => r.update(tree(next)));
    },
    unmount: () => act(() => r.unmount()),
  };
}

describe("mapExpoPermission", () => {
  const table: Array<[string, Parameters<typeof mapExpoPermission>[0], PermissionResult]> = [
    ["granted", { status: "granted", canAskAgain: true }, { status: "granted", canAskAgain: true }],
    ["granted boolean only", { granted: true }, { status: "granted", canAskAgain: true }],
    ["limited access", { status: "granted", accessPrivileges: "limited" }, { status: "limited", canAskAgain: true }],
    ["all access", { status: "granted", accessPrivileges: "all" }, { status: "granted", canAskAgain: true }],
    ["denied, can ask again", { status: "denied", canAskAgain: true }, { status: "denied", canAskAgain: true }],
    ["denied, canAskAgain omitted", { status: "denied" }, { status: "denied", canAskAgain: true }],
    ["denied, cannot ask again -> blocked", { status: "denied", canAskAgain: false }, { status: "blocked", canAskAgain: false }],
    ["denied boolean only", { granted: false, canAskAgain: false }, { status: "blocked", canAskAgain: false }],
    ["undetermined", { status: "undetermined", canAskAgain: true }, { status: "undetermined", canAskAgain: true }],
    ["unknown status", { status: "weird" }, { status: "unavailable", canAskAgain: false }],
    ["empty object", {}, { status: "unavailable", canAskAgain: false }],
    ["null", null, { status: "unavailable", canAskAgain: false }],
    ["undefined", undefined, { status: "unavailable", canAskAgain: false }],
  ];
  for (const [name, input, expected] of table)
    it(name, () => assert.deepEqual(mapExpoPermission(input), expected));
});

describe("usePermission", () => {
  it("checks on mount: loading first, then the adapter's status", async () => {
    const f = fakeAdapter({ status: "denied", canAskAgain: true });
    const t = mount({ camera: f.adapter });
    await t.render();
    assert.equal(t.out.c!.status, "denied");
    assert.equal(t.out.c!.canAskAgain, true);
    assert.equal(t.out.c!.isLoading, false);
    assert.equal(f.calls.check, 1);
  });

  it("an unregistered kind is unavailable and request() resolves unavailable without prompting", async () => {
    const f = fakeAdapter({ status: "granted", canAskAgain: true });
    const t = mount({ camera: f.adapter }, "location");
    await t.render();
    assert.deepEqual([t.out.c!.status, t.out.c!.canAskAgain, t.out.c!.isLoading], ["unavailable", false, false]);
    let result: unknown;
    await act(async () => {
      result = await t.out.c!.request();
    });
    assert.equal(result, "unavailable");
    assert.deepEqual(f.calls, { check: 0, request: 0, openSettings: 0 });
    const bare = mount(undefined);
    await bare.render();
    assert.equal(bare.out.c!.status, "unavailable");
  });

  it("request() updates the status and returns it; a blocked answer clears canAskAgain", async () => {
    const f = fakeAdapter({ status: "undetermined", canAskAgain: true }, () => ({ status: "blocked", canAskAgain: false }));
    const t = mount({ camera: f.adapter });
    await t.render();
    assert.equal(t.out.c!.status, "undetermined");
    let result: unknown;
    await act(async () => {
      result = await t.out.c!.request();
    });
    assert.equal(result, "blocked");
    assert.equal(t.out.c!.status, "blocked");
    assert.equal(t.out.c!.canAskAgain, false);
    assert.equal(f.calls.request, 1);
  });

  it("re-checks when the app returns to the foreground (mock app state drives the hook)", async () => {
    const f = fakeAdapter({ status: "denied", canAskAgain: false });
    const t = mount({ camera: f.adapter });
    await t.render();
    assert.equal(t.out.c!.status, "denied");
    f.set({ status: "granted", canAskAgain: true }); // changed in system settings
    await act(async () => t.mocks.setAppState("background"));
    assert.equal(f.calls.check, 1, "going to the background does not re-check");
    await act(async () => t.mocks.setAppState("active"));
    assert.equal(f.calls.check, 2);
    assert.equal(t.out.c!.status, "granted");
  });

  it("openSettings uses the adapter, else falls back to Linking.openSettings, and never rejects", async () => {
    const f = fakeAdapter({ status: "blocked", canAskAgain: false });
    const t = mount({ camera: f.adapter });
    await t.render();
    await act(async () => t.out.c!.openSettings());
    assert.equal(f.calls.openSettings, 1);

    const linking = (ReactNative as unknown as { Linking: { openSettings?: () => Promise<void> } }).Linking;
    let opened = 0;
    linking.openSettings = async () => void opened++;
    try {
      const { openSettings: _omit, ...noSettings } = fakeAdapter({ status: "blocked", canAskAgain: false }).adapter;
      const t2 = mount({ camera: noSettings });
      await t2.render();
      await act(async () => t2.out.c!.openSettings());
      assert.equal(opened, 1);
      linking.openSettings = () => Promise.reject(new Error("no settings"));
      await act(async () => t2.out.c!.openSettings()); // a rejecting Linking.openSettings must not throw
      delete linking.openSettings;
      await act(async () => t2.out.c!.openSettings()); // no Linking.openSettings at all must not throw
    } finally {
      delete linking.openSettings;
    }
  });

  it("a failing adapter keeps the last status and does not throw", async () => {
    let fail = false;
    const adapter: PermissionAdapter = {
      check: async () => (fail ? Promise.reject(new Error("boom")) : { status: "granted", canAskAgain: true }),
      request: async () => Promise.reject(new Error("boom")),
    };
    const t = mount({ camera: adapter });
    await t.render();
    assert.equal(t.out.c!.status, "granted");
    fail = true;
    await act(async () => t.mocks.setAppState("background"));
    await act(async () => t.mocks.setAppState("active"));
    assert.equal(t.out.c!.status, "granted");
    assert.equal(t.out.c!.isLoading, false);
    let result: unknown;
    await act(async () => {
      result = await t.out.c!.request();
    });
    assert.equal(result, "granted");
    assert.equal(t.out.c!.isLoading, false);
  });

  it("normalises sloppy adapter results and ignores a result that arrives after unmount", async () => {
    let release!: (value: PermissionResult) => void;
    const slow: PermissionAdapter = { check: () => new Promise((resolve) => (release = resolve)), request: async () => ({ status: "granted", canAskAgain: true }) };
    const t = mount({ camera: slow });
    await t.render();
    assert.equal(t.out.c!.isLoading, true);
    t.unmount();
    await act(async () => release({ status: "granted", canAskAgain: true }));

    const sloppy: PermissionAdapter = { check: async () => ({ status: "blocked", canAskAgain: true }), request: async () => null as never };
    const t2 = mount({ camera: sloppy });
    await t2.render();
    assert.deepEqual([t2.out.c!.status, t2.out.c!.canAskAgain], ["blocked", false]);
    let result: unknown;
    await act(async () => {
      result = await t2.out.c!.request();
    });
    assert.equal(result, "unavailable");
  });

  it("switches when the adapter for the kind changes and nested providers override per kind", async () => {
    const a = fakeAdapter({ status: "denied", canAskAgain: true });
    const b = fakeAdapter({ status: "granted", canAskAgain: true });
    const t = mount({ camera: a.adapter });
    await t.render();
    assert.equal(t.out.c!.status, "denied");
    await t.update({ camera: b.adapter });
    assert.equal(t.out.c!.status, "granted");

    const out: { c?: PermissionControls; l?: PermissionControls } = {};
    function Both() {
      out.c = usePermission("camera");
      out.l = usePermission("location");
      return null;
    }
    const inner = fakeAdapter({ status: "limited", canAskAgain: true });
    await act(async () => {
      TestRenderer.create(
        <PermissionsProvider adapters={{ camera: a.adapter, location: b.adapter }}>
          <PermissionsProvider adapters={{ camera: inner.adapter }}>
            <Both />
          </PermissionsProvider>
        </PermissionsProvider>
      );
    });
    assert.equal(out.c!.status, "limited");
    assert.equal(out.l!.status, "granted");
  });
});

describe("module boundary", () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? walk(path) : [path];
    });

  it("imports no expo-* module and is not exported from the root entry", () => {
    const offenders = walk("src/native/permissions").filter((file) => /(from\s+|require\()\s*["']expo-/.test(readFileSync(file, "utf8")));
    assert.deepEqual(offenders, []);
    assert.doesNotMatch(readFileSync("src/index.ts", "utf8"), /permission/i);
  });
});
