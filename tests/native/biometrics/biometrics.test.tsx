import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import TestRenderer, { act } from "react-test-renderer";

import { CapabilityProvider, useCapability } from "../../../src/native/core/index.js";
import {
  EXPO_BIOMETRIC_ERRORS,
  createExpoBiometricAdapter,
  createExpoBiometrics,
  createNoopBiometrics,
  mapExpoBiometricError,
  useBiometricPrompt,
} from "../../../src/native/biometrics/index.js";
import type { BiometricAdapter, BiometricPrompt, ExpoLocalAuthenticationLike } from "../../../src/native/biometrics/index.js";

type AuthResult = Awaited<ReturnType<ExpoLocalAuthenticationLike["authenticateAsync"]>>;

function mockModule(overrides: Partial<{ hardware: boolean; enrolled: boolean; result: AuthResult; throws: boolean }> = {}) {
  const calls: Array<{ promptMessage?: string; disableDeviceFallback?: boolean }> = [];
  const { hardware = true, enrolled = true, result = { success: true } as AuthResult, throws = false } = overrides;
  const module: ExpoLocalAuthenticationLike = {
    hasHardwareAsync: async () => hardware,
    isEnrolledAsync: async () => enrolled,
    authenticateAsync: async (options) => {
      calls.push(options);
      if (throws) throw new Error("native failure");
      return result;
    },
  };
  return { module, calls };
}

function renderPrompt(options?: Parameters<typeof useBiometricPrompt>[0]) {
  const out: { p?: BiometricPrompt } = {};
  function Probe() {
    out.p = useBiometricPrompt(options);
    return null;
  }
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(<Probe />);
  });
  return { out, r };
}

describe("PLRNUI-368 error mapping (module result table)", () => {
  const table: Array<[string, string]> = [
    ["user_cancel", "cancelled"],
    ["app_cancel", "cancelled"],
    ["system_cancel", "cancelled"],
    ["user_fallback", "cancelled"],
    ["not_enrolled", "notEnrolled"],
    ["passcode_not_set", "notEnrolled"],
    ["lockout", "lockout"],
    ["not_available", "unavailable"],
    ["authentication_failed", "unavailable"],
    ["timeout", "unavailable"],
    ["unknown", "unavailable"],
    ["something_new", "unavailable"],
    ["toString", "unavailable"],
  ];
  for (const [code, expected] of table) {
    it(`${code} maps to ${expected}`, async () => {
      assert.equal(mapExpoBiometricError(code), expected);
      const { module } = mockModule({ result: { success: false, error: code } });
      assert.deepEqual(await createExpoBiometrics(module).authenticate({ reason: "r" }), { success: false, error: expected });
    });
  }

  it("a missing or non-string error is unavailable, and the table is frozen", () => {
    assert.equal(mapExpoBiometricError(undefined), "unavailable");
    assert.equal(mapExpoBiometricError(42), "unavailable");
    assert.ok(Object.isFrozen(EXPO_BIOMETRIC_ERRORS));
  });
});

describe("PLRNUI-368 Expo adapter", () => {
  it("no hardware is unavailable and no enrolled identity is notEnrolled, without showing a prompt", async () => {
    const none = mockModule({ hardware: false });
    assert.deepEqual(await createExpoBiometrics(none.module).authenticate({ reason: "r" }), { success: false, error: "unavailable" });
    const empty = mockModule({ enrolled: false });
    assert.deepEqual(await createExpoBiometrics(empty.module).authenticate({ reason: "r" }), { success: false, error: "notEnrolled" });
    assert.equal(none.calls.length + empty.calls.length, 0);
  });

  it("isAvailable needs hardware and an enrolled identity, and is false when the module throws", async () => {
    assert.equal(await createExpoBiometrics(mockModule().module).isAvailable(), true);
    assert.equal(await createExpoBiometrics(mockModule({ hardware: false }).module).isAvailable(), false);
    assert.equal(await createExpoBiometrics(mockModule({ enrolled: false }).module).isAvailable(), false);
    const broken = { ...mockModule().module, hasHardwareAsync: async () => { throw new Error("x"); } };
    assert.equal(await createExpoBiometrics(broken).isAvailable(), false);
  });

  it("passes the reason and disables the device fallback unless fallbackToPasscode is set", async () => {
    const a = mockModule();
    assert.deepEqual(await createExpoBiometrics(a.module).authenticate({ reason: "Unlock" }), { success: true });
    assert.deepEqual(a.calls, [{ promptMessage: "Unlock", disableDeviceFallback: true }]);
    const b = mockModule();
    await createExpoBiometrics(b.module).authenticate({ reason: "Unlock", fallbackToPasscode: true });
    assert.deepEqual(b.calls, [{ promptMessage: "Unlock", disableDeviceFallback: false }]);
  });

  it("only success: true is a success; a malformed result or a throw is never one", async () => {
    for (const result of [{ success: false } as AuthResult, {} as AuthResult, { success: "true" } as unknown as AuthResult, null as unknown as AuthResult]) {
      const outcome = await createExpoBiometrics(mockModule({ result }).module).authenticate({ reason: "r" });
      assert.equal(outcome.success, false);
    }
    assert.deepEqual(await createExpoBiometrics(mockModule({ throws: true }).module).authenticate({ reason: "r" }), { success: false, error: "unavailable" });
  });

  it("the capability factory is available with the module and unavailable without it", async () => {
    const ok = createExpoBiometricAdapter(mockModule().module);
    assert.equal(ok.status, "available");
    assert.equal(await ok.api.isAvailable(), true);
    assert.equal(await ok.api.authenticate("Unlock"), true);
    const denied = createExpoBiometricAdapter(mockModule({ result: { success: false, error: "user_cancel" } }).module);
    assert.equal(await denied.api.authenticate("Unlock"), false);
    const missing = createExpoBiometricAdapter();
    assert.equal(missing.status, "unavailable");
    assert.equal(await missing.api.authenticate("Unlock"), false);
  });

  it("works through CapabilityProvider", async () => {
    const out: { a?: ReturnType<typeof useCapability<"biometric">> } = {};
    function Probe() {
      out.a = useCapability("biometric");
      return null;
    }
    act(() => {
      TestRenderer.create(
        <CapabilityProvider adapters={{ biometric: createExpoBiometricAdapter(mockModule().module) }}>
          <Probe />
        </CapabilityProvider>
      );
    });
    assert.equal(out.a?.status, "available");
    assert.equal(await out.a?.api.authenticate("Unlock"), true);
  });
});

describe("PLRNUI-368 noop adapter (security)", () => {
  it("never reports success, whatever the options", async () => {
    const noop = createNoopBiometrics();
    assert.equal(await noop.isAvailable(), false);
    for (const options of [{ reason: "r" }, { reason: "", fallbackToPasscode: true }, { reason: "r", fallbackToPasscode: false }]) {
      const result = await noop.authenticate(options);
      assert.deepEqual(result, { success: false, error: "unavailable" });
    }
  });

  it("the shared result can not be mutated into a success", async () => {
    const noop = createNoopBiometrics();
    const result = (await noop.authenticate({ reason: "r" })) as { success: boolean; error?: string };
    assert.throws(() => {
      "use strict";
      result.success = true;
    });
    assert.equal((await noop.authenticate({ reason: "r" })).success, false);
  });
});

describe("PLRNUI-368 useBiometricPrompt", () => {
  it("starts idle and, with no adapter, authenticate resolves unavailable and result.success is never true", async () => {
    const { out } = renderPrompt();
    assert.deepEqual({ loading: out.p!.loading, result: out.p!.result, error: out.p!.error }, { loading: false, result: null, error: null });
    let outcome: unknown;
    await act(async () => {
      outcome = await out.p!.authenticate({ reason: "r" });
    });
    assert.deepEqual(outcome, { success: false, error: "unavailable" });
    assert.equal(out.p!.error, "unavailable");
    assert.equal(out.p!.result?.success, false);
  });

  it("is loading while the prompt is pending and exposes success", async () => {
    let finish!: (r: { success: true }) => void;
    const adapter: BiometricAdapter = { isAvailable: async () => true, authenticate: () => new Promise((resolve) => (finish = resolve)) };
    const { out } = renderPrompt({ adapter });
    let pending!: Promise<unknown>;
    act(() => {
      pending = out.p!.authenticate({ reason: "r" });
    });
    assert.equal(out.p!.loading, true);
    await act(async () => {
      finish({ success: true });
      await pending;
    });
    assert.equal(out.p!.loading, false);
    assert.deepEqual(out.p!.result, { success: true });
    assert.equal(out.p!.error, null);
  });

  it("a second call while one is pending is refused without reaching the adapter", async () => {
    let calls = 0;
    let finish!: (r: { success: true }) => void;
    const adapter: BiometricAdapter = { isAvailable: async () => true, authenticate: () => (calls++, new Promise((resolve) => (finish = resolve))) };
    const { out } = renderPrompt({ adapter });
    let first!: Promise<unknown>;
    act(() => {
      first = out.p!.authenticate({ reason: "r" });
    });
    let second: unknown;
    await act(async () => {
      second = await out.p!.authenticate({ reason: "r" });
    });
    assert.deepEqual(second, { success: false, error: "unavailable" });
    assert.equal(calls, 1);
    await act(async () => {
      finish({ success: true });
      await first;
    });
  });

  it("an adapter that rejects or answers garbage is an unavailable failure", async () => {
    for (const authenticate of [async () => { throw new Error("boom"); }, async () => undefined, async () => ({ success: "yes" })]) {
      const { out } = renderPrompt({ adapter: { isAvailable: async () => true, authenticate } as unknown as BiometricAdapter });
      let outcome: unknown;
      await act(async () => {
        outcome = await out.p!.authenticate({ reason: "r" });
      });
      assert.deepEqual(outcome, { success: false, error: "unavailable" });
    }
  });

  it("sets no state after unmount", async () => {
    let finish!: (r: { success: true }) => void;
    const adapter: BiometricAdapter = { isAvailable: async () => true, authenticate: () => new Promise((resolve) => (finish = resolve)) };
    const { out, r } = renderPrompt({ adapter });
    const errors: unknown[][] = [];
    const original = console.error;
    console.error = (...args: unknown[]) => void (String(args[0]).includes("react-test-renderer is deprecated") || errors.push(args));
    try {
      let pending!: Promise<unknown>;
      act(() => {
        pending = out.p!.authenticate({ reason: "r" });
      });
      act(() => r.unmount());
      await act(async () => {
        finish({ success: true });
        await pending;
      });
    } finally {
      console.error = original;
    }
    assert.deepEqual(errors, []);
  });
});

describe("PLRNUI-368 boundaries", () => {
  const dir = join(import.meta.dirname, "../../../src/native/biometrics");
  const sources = readdirSync(dir).filter((f) => f.endsWith(".ts")).map((f) => [f, readFileSync(join(dir, f), "utf8")] as const);

  it("imports no expo-* or react-native-* package and uses no require", () => {
    for (const [file, text] of sources) {
      const code = text.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
      assert.equal(/from\s+["'](?:expo|react-native)/.test(code), false, `${file} imports a native package`);
      assert.equal(/\brequire\s*\(/.test(code), false, `${file} uses require`);
      assert.equal(/\bimport\s*\(/.test(code), false, `${file} uses dynamic import`);
    }
  });

  it("is not reachable from the root entry or the package manifest dependencies", () => {
    const root = join(import.meta.dirname, "../../..");
    const walk = (d: string): string[] => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
    const index = readFileSync(join(root, "src/index.ts"), "utf8");
    assert.equal(/biometrics/.test(index), false);
    const rootImports = walk(join(root, "src")).filter((f) => !f.includes("/native/") && /\.tsx?$/.test(f)).filter((f) => /native\/biometrics/.test(readFileSync(f, "utf8")));
    assert.deepEqual(rootImports, []);
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    for (const section of ["dependencies", "peerDependencies"]) assert.equal(JSON.stringify(pkg[section] ?? {}).includes("local-authentication"), false);
  });
});
