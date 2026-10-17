import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import TestRenderer, { act } from "react-test-renderer";

import { CapabilityProvider } from "../../../src/native/core/index.js";
import { createMockAdapters } from "../../../src/native/testing/index.js";
import { PermissionsProvider, mapExpoPermission, usePermission } from "../../../src/native/permissions/index.js";
import type { ExpoPermissionResponseLike } from "../../../src/native/permissions/index.js";
import type { PermissionAdapter, PermissionAdapters, PermissionControls, PermissionKind } from "../../../src/native/permissions/index.js";
import {
  createExpoCameraPermission,
  createExpoLocationPermission,
  createExpoMediaLibraryPermission,
  createExpoNotificationsPermission,
  createUnavailablePermission,
} from "../../../src/native/permissions-expo/index.js";

const UNAVAILABLE = { status: "unavailable", canAskAgain: false };

/** A module whose get / request functions answer with the given responses and record their calls and `this`. */
function responder(get: ExpoPermissionResponseLike, request: ExpoPermissionResponseLike = get) {
  const calls: string[] = [];
  const owners: unknown[] = [];
  return {
    calls,
    owners,
    getFn(this: unknown) {
      calls.push("get");
      owners.push(this);
      return Promise.resolve(get);
    },
    requestFn(this: unknown) {
      calls.push("request");
      owners.push(this);
      return Promise.resolve(request);
    },
  };
}

interface Case {
  name: string;
  kind: PermissionKind;
  make: (r: ReturnType<typeof responder>) => { module: unknown; owner: unknown };
  build: (module: any) => PermissionAdapter;
}

const cases: Case[] = [
  {
    name: "camera",
    kind: "camera",
    make: (r) => {
      const Camera = { getCameraPermissionsAsync: r.getFn, requestCameraPermissionsAsync: r.requestFn };
      return { module: { Camera }, owner: Camera };
    },
    build: createExpoCameraPermission,
  },
  {
    name: "media library",
    kind: "mediaLibrary",
    make: (r) => {
      const module = { getPermissionsAsync: r.getFn, requestPermissionsAsync: r.requestFn };
      return { module, owner: module };
    },
    build: createExpoMediaLibraryPermission,
  },
  {
    name: "location",
    kind: "location",
    make: (r) => {
      const module = { getForegroundPermissionsAsync: r.getFn, requestForegroundPermissionsAsync: r.requestFn };
      return { module, owner: module };
    },
    build: createExpoLocationPermission,
  },
  {
    name: "notifications",
    kind: "notifications",
    make: (r) => {
      const module = { getPermissionsAsync: r.getFn, requestPermissionsAsync: r.requestFn };
      return { module, owner: module };
    },
    build: createExpoNotificationsPermission,
  },
];

const responses: Array<[string, ExpoPermissionResponseLike]> = [
  ["granted", { status: "granted", canAskAgain: true }],
  ["denied, can ask again", { status: "denied", canAskAgain: true }],
  ["denied, cannot ask again", { status: "denied", canAskAgain: false }],
  ["undetermined", { status: "undetermined", canAskAgain: true }],
  ["boolean only", { granted: true }],
  ["unreadable", { status: "weird" }],
];

for (const c of cases) {
  describe(`PLRNUI-356 ${c.name} adapter`, () => {
    it("maps check() and request() responses through mapExpoPermission", async () => {
      for (const [label, response] of responses) {
        const r = responder(response, response);
        const adapter = c.build(c.make(r).module);
        assert.deepEqual(await adapter.check(), mapExpoPermission(response), `check ${label}`);
        assert.deepEqual(await adapter.request(), mapExpoPermission(response), `request ${label}`);
      }
    });

    it("check() reads and request() asks, each with its own module function and the module as `this`", async () => {
      const r = responder({ status: "undetermined", canAskAgain: true }, { status: "granted", canAskAgain: true });
      const { module, owner } = c.make(r);
      const adapter = c.build(module);
      assert.deepEqual(await adapter.check(), { status: "undetermined", canAskAgain: true });
      assert.deepEqual(r.calls, ["get"]);
      assert.deepEqual(await adapter.request(), { status: "granted", canAskAgain: true });
      assert.deepEqual(r.calls, ["get", "request"]);
      assert.deepEqual(r.owners, [owner, owner]);
    });

    it("returns the unavailable adapter when the module is absent, incomplete or too old", async () => {
      for (const missing of [undefined, null, {}, { Camera: {} }, { Camera: null }, { getPermissionsAsync: () => Promise.resolve({ status: "granted" }) }, "nope"]) {
        const adapter = c.build(missing as never);
        assert.deepEqual(await adapter.check(), UNAVAILABLE, c.name);
        assert.deepEqual(await adapter.request(), UNAVAILABLE, c.name);
      }
    });

    it("propagates a rejection of the module", async () => {
      const failing = c.make(responder({}));
      const owner = failing.owner as Record<string, unknown>;
      for (const key of Object.keys(owner)) owner[key] = () => Promise.reject(new Error("native failure"));
      const adapter = c.build(failing.module);
      await assert.rejects(adapter.check(), /native failure/);
      await assert.rejects(adapter.request(), /native failure/);
    });
  });
}

describe("PLRNUI-356 specifics", () => {
  it("media library limited access maps to limited", async () => {
    const adapter = createExpoMediaLibraryPermission({ getPermissionsAsync: async () => ({ status: "granted", accessPrivileges: "limited", canAskAgain: true }), requestPermissionsAsync: async () => ({ status: "granted", accessPrivileges: "all" }) });
    assert.deepEqual(await adapter.check(), { status: "limited", canAskAgain: true });
    assert.deepEqual(await adapter.request(), { status: "granted", canAskAgain: true });
  });

  it("a module with only one of the two functions is unavailable", async () => {
    const onlyGet = createExpoLocationPermission({ getForegroundPermissionsAsync: async () => ({ status: "granted" }) });
    assert.deepEqual(await onlyGet.check(), UNAVAILABLE);
    assert.deepEqual(await onlyGet.request(), UNAVAILABLE);
  });

  it("createUnavailablePermission never prompts and has no openSettings", async () => {
    const adapter = createUnavailablePermission();
    assert.deepEqual(await adapter.request(), UNAVAILABLE);
    assert.equal(adapter.openSettings, undefined);
  });

  it("the unavailable result is frozen", async () => {
    const adapter = createUnavailablePermission();
    const first = await adapter.check();
    assert.equal(Object.isFrozen(first), true);
  });
});

describe("PLRNUI-356 with usePermission", () => {
  async function mountHook(adapters: PermissionAdapters, kind: PermissionKind) {
    const mocks = createMockAdapters();
    const out: { c?: PermissionControls } = {};
    function Probe() {
      out.c = usePermission(kind);
      return null;
    }
    await act(async () => {
      TestRenderer.create(
        <CapabilityProvider adapters={mocks.adapters}>
          <PermissionsProvider adapters={adapters}>
            <Probe />
          </PermissionsProvider>
        </CapabilityProvider>,
      );
    });
    return out;
  }

  it("an Expo camera adapter drives the hook: undetermined, then granted after request()", async () => {
    const r = responder({ status: "undetermined", canAskAgain: true }, { status: "granted", canAskAgain: true });
    const out = await mountHook({ camera: createExpoCameraPermission(cases[0]!.make(r).module as never) }, "camera");
    assert.equal(out.c!.status, "undetermined");
    let result: unknown;
    await act(async () => {
      result = await out.c!.request();
    });
    assert.equal(result, "granted");
    assert.equal(out.c!.status, "granted");
  });

  it("a missing module reads as unavailable and request() resolves unavailable", async () => {
    const out = await mountHook({ location: createExpoLocationPermission(undefined) }, "location");
    assert.equal(out.c!.status, "unavailable");
    assert.equal(out.c!.canAskAgain, false);
    let result: unknown;
    await act(async () => {
      result = await out.c!.request();
    });
    assert.equal(result, "unavailable");
  });
});

describe("PLRNUI-356 boundaries", () => {
  const dir = join(import.meta.dirname, "../../../src/native/permissions-expo");
  const sources = readdirSync(dir).filter((f) => f.endsWith(".ts")).map((f) => [f, readFileSync(join(dir, f), "utf8")] as const);

  it("imports no expo-* or react-native-* package and uses no require", () => {
    for (const [file, text] of sources) {
      const code = text.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
      assert.equal(/from\s+["'](?:expo|react-native)/.test(code), false, `${file} imports a native package`);
      assert.equal(/\bimport\s+["']/.test(code), false, `${file} has a side-effect import`);
      assert.equal(/\brequire\s*\(/.test(code), false, `${file} uses require`);
      assert.equal(/\bimport\s*\(/.test(code), false, `${file} uses dynamic import`);
    }
  });

  it("is not reachable from the root entry and package.json has no expo-* dependency", () => {
    const root = join(import.meta.dirname, "../../..");
    const walk = (d: string): string[] => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
    assert.equal(/permissions-expo/.test(readFileSync(join(root, "src/index.ts"), "utf8")), false);
    const rootImports = walk(join(root, "src")).filter((f) => !f.includes("/native/") && /\.tsx?$/.test(f)).filter((f) => /permissions-expo/.test(readFileSync(f, "utf8")));
    assert.deepEqual(rootImports, []);
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    for (const section of ["dependencies", "peerDependencies", "devDependencies", "optionalDependencies"]) {
      assert.deepEqual(Object.keys(pkg[section] ?? {}).filter((name) => /^expo(-|$)/.test(name)), [], section);
    }
  });
});
