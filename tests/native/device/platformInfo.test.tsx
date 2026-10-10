import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

  it("returns os web, isWeb and isTablet false by default on web", () => {
    const info = getPlatformInfo(undefined, { OS: "web" });
    assert.equal(info.os, "web");
    assert.equal(info.isWeb, true);
    assert.equal(info.isTablet, false);
    assert.equal(info.osVersion, null);
  });

  it("maps an unknown OS to unknown and never throws", () => {
    assert.equal(getPlatformInfo(undefined, { OS: "test" }).os, "unknown");
    assert.equal(getPlatformInfo().os, "unknown"); // default source is the RN shim (OS 'test')
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

describe("device module boundaries", () => {
  it("imports no expo-* module and does not touch src/utils/platform.ts", () => {
    for (const f of ["types.ts", "platformInfo.ts", "index.ts"]) {
      const src = readFileSync(resolve(root, "src/native/device", f), "utf8");
      assert.doesNotMatch(src, /from\s+["']expo|require\(/, f);
    }
  });
});
