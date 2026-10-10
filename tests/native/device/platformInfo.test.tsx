import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import TestRenderer, { act } from "react-test-renderer";

import { createExpoDeviceInfoAdapter, getPlatformInfo, usePlatformInfo } from "../../../src/native/device/index.js";
import type { PlatformInfo } from "../../../src/native/device/index.js";
import "./contract.types.js";

const root = resolve(import.meta.dirname, "../../..");

describe("getPlatformInfo", () => {
  it("fills core fields and leaves enriched fields null without an adapter", () => {
    const info = getPlatformInfo(undefined, { OS: "android", Version: 34 });
    assert.deepEqual(info, {
      os: "android",
      osVersion: "34",
      isTablet: false,
      isEmulator: null,
      isExpoGo: null,
      isWeb: false,
      hasNotch: null,
    });
  });

  it("uses Platform.isPad for iOS tablets", () => {
    assert.equal(getPlatformInfo(undefined, { OS: "ios", Version: "17.0", isPad: true }).isTablet, true);
  });

  it("web isTablet comes from the user agent and defaults to false; the adapter can not set it", () => {
    const ua = (userAgent?: string) => getPlatformInfo(undefined, { OS: "web", userAgent }).isTablet;
    assert.equal(ua(undefined), false);
    assert.equal(ua("Mozilla/5.0 (Windows NT 10.0) Chrome/120"), false);
    assert.equal(ua("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)"), true);
    assert.equal(ua("Mozilla/5.0 (Linux; Android 13; Pixel Tablet) Chrome/120"), true);
    assert.equal(ua("Mozilla/5.0 (Linux; Android 13; Pixel 7) Mobile Safari"), false);
    assert.equal(getPlatformInfo({ isTablet: true }, { OS: "web" }).isTablet, false);
  });

  it("does not detect Android tablets without an adapter (documented)", () => {
    assert.equal(getPlatformInfo(undefined, { OS: "android", Version: 33 }).isTablet, false);
    assert.equal(getPlatformInfo({ isTablet: true }, { OS: "android" }).isTablet, true);
  });

  it("returns os web, isWeb and isTablet false by default on web", () => {
    const info = getPlatformInfo(undefined, { OS: "web" });
    assert.equal(info.os, "web");
    assert.equal(info.isWeb, true);
    assert.equal(info.isTablet, false);
    assert.equal(info.osVersion, null);
  });

  it("maps an unknown OS to unknown and never throws", () => {
    assert.equal(getPlatformInfo(undefined, { OS: "test" }).os, "unknown");
    // Default source is the test RN shim whose Platform.OS is "test": documented result is "unknown".
    assert.equal(getPlatformInfo().os, "unknown");
  });

  it("lets the adapter override core fields only when it provides them", () => {
    const source = { OS: "android", Version: 30 };
    const partial = getPlatformInfo({ isEmulator: true, isExpoGo: false }, source);
    assert.equal(partial.os, "android");
    assert.equal(partial.osVersion, "30");
    assert.equal(partial.isEmulator, true);
    assert.equal(partial.isExpoGo, false);

    const full = getPlatformInfo(
      { os: "ios", osVersion: "18.1", isTablet: true, hasNotch: true, isExpoGo: true },
      source
    );
    assert.equal(full.os, "ios");
    assert.equal(full.osVersion, "18.1");
    assert.equal(full.isTablet, true);
    assert.equal(full.hasNotch, true);
    assert.equal(full.isExpoGo, true);

    const nulls = getPlatformInfo({ os: null, osVersion: null, isTablet: undefined, isExpoGo: null }, source);
    assert.equal(nulls.os, "android");
    assert.equal(nulls.osVersion, "30");
    assert.equal(nulls.isTablet, false);
    assert.equal(nulls.isExpoGo, null);
  });

  it("derives isWeb from the effective os", () => {
    assert.equal(getPlatformInfo({ os: "web" }, { OS: "ios" }).isWeb, true);
  });
});

describe("robustness", () => {
  const boom = () => {
    throw new Error("boom");
  };

  it("never throws on a throwing Platform source and degrades to unknown/null", () => {
    const source = {
      get OS(): string {
        return boom();
      },
      get Version(): string {
        return boom();
      },
      get isPad(): boolean {
        return boom();
      },
      get userAgent(): string {
        return boom();
      },
    };
    const info = getPlatformInfo(undefined, source);
    assert.equal(info.os, "unknown");
    assert.equal(info.osVersion, null);
    assert.equal(info.isTablet, false);
  });

  it("never throws on a throwing adapter", () => {
    const adapter = {
      get os(): "ios" {
        return boom();
      },
      get osVersion(): string {
        return boom();
      },
      get isEmulator(): boolean {
        return boom();
      },
      get isExpoGo(): boolean {
        return boom();
      },
    };
    const info = getPlatformInfo(adapter, { OS: "android", Version: 30 });
    assert.equal(info.os, "android");
    assert.equal(info.osVersion, "30");
    assert.equal(info.isEmulator, null);
    assert.equal(info.isExpoGo, null);
  });

  it("createExpoDeviceInfoAdapter survives throwing device and constants getters", () => {
    const device = {
      get osName(): string {
        return boom();
      },
      get osVersion(): string {
        return boom();
      },
      get isDevice(): boolean {
        return boom();
      },
      get deviceType(): number {
        return boom();
      },
    };
    const constants = {
      get executionEnvironment(): string {
        return boom();
      },
      get appOwnership(): string {
        return boom();
      },
    };
    assert.deepEqual(createExpoDeviceInfoAdapter({ device, constants }), {});
    const throwingModules = {
      get device(): never {
        return boom();
      },
      get constants(): never {
        return boom();
      },
    };
    assert.deepEqual(createExpoDeviceInfoAdapter(throwingModules), {});
  });

  it("an unrecognised adapter os never overrides a valid core os", () => {
    assert.equal(getPlatformInfo({ os: "tvOS" as never }, { OS: "android" }).os, "android");
    assert.equal(getPlatformInfo({ os: "unknown" }, { OS: "android" }).os, "android");
    assert.equal(createExpoDeviceInfoAdapter({ device: { osName: "tvOS" } }).os, undefined);
  });

  it("an empty adapter osVersion never beats a real core version", () => {
    assert.equal(getPlatformInfo({ osVersion: "" }, { OS: "android", Version: 30 }).osVersion, "30");
    assert.equal(createExpoDeviceInfoAdapter({ device: { osVersion: "" } }).osVersion, undefined);
  });
});

describe("createExpoDeviceInfoAdapter", () => {
  it("maps injected expo-device and expo-constants shapes", () => {
    const adapter = createExpoDeviceInfoAdapter({
      device: { osName: "iPadOS", osVersion: "17.2", isDevice: false, deviceType: 2 },
      constants: { executionEnvironment: "storeClient" },
    });
    assert.deepEqual(adapter, { os: "ios", osVersion: "17.2", isEmulator: true, isTablet: true, isExpoGo: true });
  });

  it("detects a non-Expo-Go build and tolerates missing modules", () => {
    assert.equal(createExpoDeviceInfoAdapter({ constants: { executionEnvironment: "bare" } }).isExpoGo, false);
    assert.equal(createExpoDeviceInfoAdapter({ constants: { appOwnership: "expo" } }).isExpoGo, true);
    assert.deepEqual(createExpoDeviceInfoAdapter({}), {});
    assert.deepEqual(createExpoDeviceInfoAdapter({ device: { deviceType: 0 } }), {});
  });
});

describe("usePlatformInfo", () => {
  it("returns PlatformInfo and is stable for a stable adapter", () => {
    const adapter = { isExpoGo: true };
    const seen: PlatformInfo[] = [];
    function Probe() {
      seen.push(usePlatformInfo(adapter));
      return null;
    }
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<Probe />);
    });
    act(() => renderer.update(<Probe />));
    assert.equal(seen[0]!.isExpoGo, true);
    assert.equal(seen[0], seen[seen.length - 1]);
  });
});

describe("device module source scan (no expo-*, no native, no require)", () => {
  const dir = resolve(root, "src/native/device");
  const forbidden: Array<[string, RegExp]> = [
    ["from expo-*", /from\s+["']expo[-/]/],
    ["side-effect import of expo-*", /import\s+["']expo[-/]/],
    ["dynamic import of expo-*", /import\s*\(\s*["']expo[-/]/],
    ["@expo/*", /["']@expo\//],
    ["require(", /\brequire\s*\(/],
    ["import x = require", /import\s+\w+\s*=\s*require/],
    ["react-native/Libraries", /react-native\/Libraries/],
  ];

  it("scans every file under src/native/device", () => {
    const files = readdirSync(dir);
    assert.ok(files.length >= 3);
    for (const f of files) {
      const src = readFileSync(resolve(dir, f), "utf8");
      for (const [name, re] of forbidden) assert.doesNotMatch(src, re, `${f}: ${name}`);
    }
  });

  it("the forbidden patterns do catch each import form", () => {
    const samples = [
      'import x from "expo-device";',
      'import "expo-device";',
      'const m = await import("expo-device");',
      'import c from "@expo/vector-icons";',
      'const m = require("x");',
      'import fs = require("fs");',
      'import p from "react-native/Libraries/Utilities/Platform";',
    ];
    for (const sample of samples) assert.ok(forbidden.some(([, re]) => re.test(sample)), sample);
  });
});
