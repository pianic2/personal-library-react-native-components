import React from "react";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import TestRenderer, { act } from "react-test-renderer";

import { CapabilityProvider } from "../../../src/native/core/index.js";
import type { AdapterFor, HapticsApi } from "../../../src/native/core/index.js";
import {
  createExpoHaptics,
  createExpoHapticsAdapter,
  createWebHaptics,
  isHapticsEnabled,
  resolveWebHaptics,
  setHapticsEnabled,
  useHaptics,
} from "../../../src/native/haptics/index.js";
import type { ExpoHapticsModuleLike, Haptics, UseHapticsOptions } from "../../../src/native/haptics/index.js";

function mockExpo() {
  const calls: Array<[string, unknown?]> = [];
  const module: ExpoHapticsModuleLike = {
    impactAsync: async (style) => void calls.push(["impact", style]),
    notificationAsync: async (type) => void calls.push(["notification", type]),
    selectionAsync: async () => void calls.push(["selection"]),
    ImpactFeedbackStyle: { Light: "L", Medium: "M", Heavy: "H" },
    NotificationFeedbackType: { Success: "S", Warning: "W", Error: "E" },
  };
  return { module, calls };
}

function renderHaptics(options?: UseHapticsOptions, adapters?: React.ComponentProps<typeof CapabilityProvider>["adapters"]) {
  const out: { h?: Haptics } = {};
  function Probe() {
    out.h = useHaptics(options);
    return null;
  }
  act(() => {
    TestRenderer.create(
      adapters ? (
        <CapabilityProvider adapters={adapters}>
          <Probe />
        </CapabilityProvider>
      ) : (
        <Probe />
      )
    );
  });
  return out;
}

function setNavigator(value: unknown) {
  const before = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  Object.defineProperty(globalThis, "navigator", { value, configurable: true, writable: true });
  return () => {
    if (before) Object.defineProperty(globalThis, "navigator", before);
    else delete (globalThis as { navigator?: unknown }).navigator;
  };
}

afterEach(() => setHapticsEnabled(true));

describe("expo mapping", () => {
  it("maps each semantic call to the expected expo-haptics method and enum value", async () => {
    const { module, calls } = mockExpo();
    const api = createExpoHaptics(module);
    await api.impact("light");
    await api.impact("medium");
    await api.impact("heavy");
    await api.impact();
    await api.notification("success");
    await api.notification("warning");
    await api.notification("error");
    await api.selection();
    assert.deepEqual(calls, [
      ["impact", "L"],
      ["impact", "M"],
      ["impact", "H"],
      ["impact", "M"],
      ["notification", "S"],
      ["notification", "W"],
      ["notification", "E"],
      ["selection"],
    ]);
  });

  it("works with a module that lacks the enums (passes undefined)", async () => {
    const calls: unknown[] = [];
    const api = createExpoHaptics({
      impactAsync: async (s) => void calls.push(s),
      notificationAsync: async (t) => void calls.push(t),
      selectionAsync: async () => undefined,
    });
    await api.impact("heavy");
    await api.notification("error");
    assert.deepEqual(calls, [undefined, undefined]);
  });

  it("the adapter factory is available with a module and unavailable (noop) without one", async () => {
    const { module, calls } = mockExpo();
    const adapter: AdapterFor<"haptics"> = createExpoHapticsAdapter(module);
    assert.equal(adapter.status, "available");
    await adapter.api.selection();
    assert.deepEqual(calls, [["selection"]]);
    for (const missing of [undefined, null]) {
      const none = createExpoHapticsAdapter(missing);
      assert.equal(none.status, "unavailable");
      await assert.doesNotReject(none.api.impact("light"));
    }
  });
});

describe("web mapping", () => {
  it("uses navigator.vibrate patterns, and tolerates a missing vibrate", async () => {
    const seen: Array<number | number[]> = [];
    const api = createWebHaptics({ vibrate: (p) => (seen.push(p), true) });
    await api.impact("light");
    await api.impact("heavy");
    await api.notification("error");
    await api.selection();
    assert.deepEqual(seen, [10, 40, [30, 40, 30, 40, 30], 5]);
    await assert.doesNotReject(createWebHaptics({}).notification("success"));
  });

  it("resolveWebHaptics is undefined without navigator.vibrate", () => {
    const restore = setNavigator({});
    try {
      assert.equal(resolveWebHaptics(), undefined);
    } finally {
      restore();
    }
    const restoreNone = setNavigator(undefined);
    try {
      assert.equal(resolveWebHaptics(), undefined);
    } finally {
      restoreNone();
    }
  });
});

describe("useHaptics", () => {
  it("is a noop without provider and without navigator.vibrate: resolves, never throws", async () => {
    const restore = setNavigator({});
    try {
      const out = renderHaptics();
      assert.equal(out.h!.status, "noop");
      await assert.doesNotReject(out.h!.impact("light"));
      await assert.doesNotReject(out.h!.notification("error"));
      await assert.doesNotReject(out.h!.selection());
    } finally {
      restore();
    }
  });

  it("falls back to navigator.vibrate on web when nothing is configured", async () => {
    const seen: unknown[] = [];
    const restore = setNavigator({ vibrate: (p: unknown) => (seen.push(p), true) });
    try {
      const out = renderHaptics();
      assert.equal(out.h!.status, "available");
      await out.h!.selection();
      assert.deepEqual(seen, [5]);
    } finally {
      restore();
    }
  });

  it("forwards calls with the correct args to a provided adapter", async () => {
    const { module, calls } = mockExpo();
    const restore = setNavigator({ vibrate: () => assert.fail("web fallback must not run when an adapter is provided") });
    try {
      const out = renderHaptics(undefined, { haptics: createExpoHapticsAdapter(module) });
      assert.equal(out.h!.status, "available");
      await out.h!.impact("heavy");
      await out.h!.notification("warning");
      await out.h!.selection();
      assert.deepEqual(calls, [["impact", "H"], ["notification", "W"], ["selection"]]);
    } finally {
      restore();
    }
  });

  it("enabled=false and the global flag each suppress every call", async () => {
    const { module, calls } = mockExpo();
    const adapters = { haptics: createExpoHapticsAdapter(module) };
    const off = renderHaptics({ enabled: false }, adapters);
    await off.h!.impact("light");
    await off.h!.notification("success");
    await off.h!.selection();
    assert.deepEqual(calls, []);

    const on = renderHaptics({}, adapters);
    setHapticsEnabled(false);
    assert.equal(isHapticsEnabled(), false);
    await on.h!.selection();
    assert.deepEqual(calls, []);
    setHapticsEnabled(true);
    await on.h!.selection();
    assert.deepEqual(calls, [["selection"]]);
  });

  it("swallows a throwing or rejecting adapter", async () => {
    const api: HapticsApi = {
      impact: () => Promise.reject(new Error("no")),
      notification: () => {
        throw new Error("sync");
      },
      selection: async () => undefined,
    };
    const out = renderHaptics(undefined, { haptics: { id: "haptics", status: "available", api } });
    await assert.doesNotReject(out.h!.impact("light"));
    await assert.doesNotReject(out.h!.notification("error"));
  });

  it("keeps a stable result object while inputs are unchanged", () => {
    const { module } = mockExpo();
    const adapters = { haptics: createExpoHapticsAdapter(module) };
    const seen: Haptics[] = [];
    function Probe() {
      seen.push(useHaptics());
      return null;
    }
    const tree = () => (
      <CapabilityProvider adapters={adapters}>
        <Probe />
      </CapabilityProvider>
    );
    let r!: TestRenderer.ReactTestRenderer;
    act(() => {
      r = TestRenderer.create(tree());
    });
    act(() => r.update(tree()));
    assert.ok(seen.length >= 2 && seen.every((h) => h === seen[0]));
  });
});

describe("module boundary", () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? walk(path) : [path];
    });

  it("src never imports or requires expo-haptics", () => {
    const offenders = walk("src").filter(
      (file) => /\.tsx?$/.test(file) && /(from\s+|require\()\s*["']expo-haptics/.test(readFileSync(file, "utf8"))
    );
    assert.deepEqual(offenders, []);
  });

  it("is not exported from the root entry", () => {
    assert.doesNotMatch(readFileSync("src/index.ts", "utf8"), /haptics/);
  });
});
