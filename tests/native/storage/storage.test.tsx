import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import TestRenderer, { act } from "react-test-renderer";

import { CapabilityProvider } from "../../../src/native/core/index.js";
import {
  createAsyncStorage,
  createMemoryStorage,
  createSecureStorage,
  createUnavailableStorage,
  createWebStorage,
  resolveLocalStorage,
  useStoredState,
} from "../../../src/native/storage/index.js";
import type { StorageAdapter, StoredState, UseStoredStateOptions, WebStorageLike } from "../../../src/native/storage/index.js";

// --- mock backends --------------------------------------------------------------------------------------------------
const asyncModule = () => {
  const map = new Map<string, string>();
  return {
    map,
    getItem: async (k: string) => map.get(k) ?? null,
    setItem: async (k: string, v: string) => void map.set(k, v),
    removeItem: async (k: string) => void map.delete(k),
  };
};
const secureModule = () => {
  const map = new Map<string, string>();
  return {
    map,
    getItemAsync: async (k: string) => map.get(k) ?? null,
    setItemAsync: async (k: string, v: string) => void map.set(k, v),
    deleteItemAsync: async (k: string) => void map.delete(k),
  };
};
const domStorage = (): WebStorageLike & { map: Map<string, string> } => {
  const map = new Map<string, string>();
  return { map, getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, v), removeItem: (k) => void map.delete(k) };
};

// --- shared conformance suite ---------------------------------------------------------------------------------------
function conformance(name: string, create: () => StorageAdapter) {
  describe(`conformance: ${name}`, () => {
    it("reads a missing key as null", async () => assert.equal(await create().getItem("missing"), null));
    it("round-trips a value, overwrites it and keeps keys independent", async () => {
      const s = create();
      await s.setItem("a", "1");
      await s.setItem("b", "2");
      assert.equal(await s.getItem("a"), "1");
      await s.setItem("a", "3");
      assert.deepEqual([await s.getItem("a"), await s.getItem("b")], ["3", "2"]);
    });
    it("stores the empty string and unicode unchanged", async () => {
      const s = create();
      await s.setItem("empty", "");
      await s.setItem("uni", "héllo ✓ 日本語");
      assert.equal(await s.getItem("empty"), "");
      assert.equal(await s.getItem("uni"), "héllo ✓ 日本語");
    });
    it("removes a value, and removing a missing key does not fail", async () => {
      const s = create();
      await s.setItem("a", "1");
      await s.removeItem("a");
      assert.equal(await s.getItem("a"), null);
      await assert.doesNotReject(s.removeItem("never-set"));
    });
    it("declares its kind and an available status", () => {
      const s = create();
      assert.equal(s.status, "available");
      assert.ok(s.kind === "plain" || s.kind === "secure");
    });
  });
}

conformance("memory", () => createMemoryStorage());
conformance("web (mock Storage)", () => createWebStorage(domStorage()));
conformance("async-storage (mock module)", () => createAsyncStorage(asyncModule()));
conformance("secure-store (mock module, native)", () => createSecureStorage(secureModule(), { platform: "ios" }));
conformance("secure-store (explicit insecure web)", () => createSecureStorage(null, { platform: "web", allowInsecureWeb: true, webStorage: domStorage() }));

// --- adapter specifics ------------------------------------------------------------------------------------------------
describe("adapters", () => {
  it("memory can be seeded", async () => assert.equal(await createMemoryStorage({ k: "v" }).getItem("k"), "v"));

  it("web storage: unavailable without a backend, guarded reads, rejecting writes", async () => {
    const none = createWebStorage(undefined as never);
    // an explicit undefined resolves localStorage, which does not exist under Node
    assert.equal(resolveLocalStorage(), undefined);
    assert.equal(none.status, "unavailable");
    assert.equal(await none.getItem("k"), null);
    await assert.doesNotReject(none.setItem("k", "v"));

    const failing: WebStorageLike = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("quota");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    const s = createWebStorage(failing);
    assert.equal(await s.getItem("k"), null);
    await assert.rejects(s.setItem("k", "v"), /quota/);
    await assert.doesNotReject(s.removeItem("k"));
  });

  it("async-storage: unavailable without the module; null from the backend stays null", async () => {
    assert.equal(createAsyncStorage(undefined).status, "unavailable");
    assert.equal(createAsyncStorage(null).kind, "plain");
    const m = { ...asyncModule(), getItem: async () => undefined as unknown as string | null };
    assert.equal(await createAsyncStorage(m).getItem("x"), null);
  });

  it("secure storage on web without the flag is unavailable: reads null, writes reject, nothing is written anywhere", async () => {
    const web = domStorage();
    const mod = secureModule();
    const s = createSecureStorage(mod, { platform: "web", webStorage: web });
    assert.equal(s.status, "unavailable");
    assert.equal(s.kind, "secure");
    assert.equal(s.insecure, undefined);
    assert.equal(await s.getItem("token"), null);
    await assert.rejects(s.setItem("token", "secret"), /unavailable/);
    await assert.rejects(s.removeItem("token"));
    assert.equal(web.map.size, 0, "no silent downgrade to browser storage");
    assert.equal(mod.map.size, 0);
  });

  it("secure storage on web with allowInsecureWeb is explicit: kind secure, insecure true, uses browser storage", async () => {
    const web = domStorage();
    const s = createSecureStorage(null, { platform: "web", allowInsecureWeb: true, webStorage: web });
    assert.deepEqual([s.kind, s.status, s.insecure], ["secure", "available", true]);
    await s.setItem("k", "v");
    assert.equal(web.map.get("k"), "v");
  });

  it("secure storage without the module on a native platform is unavailable and rejects writes", async () => {
    const s = createSecureStorage(undefined, { platform: "android" });
    assert.deepEqual([s.kind, s.status], ["secure", "unavailable"]);
    await assert.rejects(s.setItem("k", "v"));
    assert.equal(await s.getItem("k"), null);
  });

  it("secure storage on native uses the injected module and is not flagged insecure", async () => {
    const mod = secureModule();
    const s = createSecureStorage(mod, { platform: "ios" });
    await s.setItem("token", "abc");
    assert.equal(mod.map.get("token"), "abc");
    assert.equal(s.insecure, undefined);
  });

  it("an unavailable adapter reads null and ignores plain writes", async () => {
    const s = createUnavailableStorage();
    assert.deepEqual([s.kind, s.status, await s.getItem("k")], ["plain", "unavailable", null]);
    await assert.doesNotReject(s.setItem("k", "v"));
  });
});

// --- useStoredState -----------------------------------------------------------------------------------------------------
function mount<T>(key: string, def: T, options?: UseStoredStateOptions<T>, wrap?: (el: React.ReactElement) => React.ReactElement) {
  const out: { s?: StoredState<T> } = {};
  const frames: StoredState<T>[] = [];
  function Probe({ k }: { k: string }) {
    out.s = useStoredState<T>(k, def, options);
    frames.push(out.s);
    return null;
  }
  let r!: TestRenderer.ReactTestRenderer;
  const tree = (k: string) => (wrap ? wrap(<Probe k={k} />) : <Probe k={k} />);
  return {
    out,
    frames,
    async render() {
      await act(async () => {
        r = TestRenderer.create(tree(key));
      });
    },
    async rekey(k: string) {
      await act(async () => r.update(tree(k)));
    },
    unmount: () => act(() => r.unmount()),
  };
}

describe("useStoredState", () => {
  it("is hydrated=false with the default until the read resolves, then shows the stored value", async () => {
    let release!: (v: string | null) => void;
    const storage = { getItem: () => new Promise<string | null>((resolve) => (release = resolve)), setItem: async () => undefined, removeItem: async () => undefined };
    const t = mount("k", "default", { storage });
    await t.render();
    assert.deepEqual([t.out.s!.value, t.out.s!.hydrated], ["default", false]);
    await act(async () => release(JSON.stringify("stored")));
    assert.deepEqual([t.out.s!.value, t.out.s!.hydrated], ["stored", true]);
    assert.equal(t.frames[0]!.hydrated, false);
  });

  it("keeps the default when nothing is stored or the stored value cannot be parsed", async () => {
    const empty = mount("k", 5, { storage: createMemoryStorage() });
    await empty.render();
    assert.deepEqual([empty.out.s!.value, empty.out.s!.hydrated], [5, true]);
    const bad = mount("k", 5, { storage: createMemoryStorage({ k: "{not json" }) });
    await bad.render();
    assert.deepEqual([bad.out.s!.value, bad.out.s!.hydrated], [5, true]);
    const failing = mount("k", 5, { storage: { getItem: () => Promise.reject(new Error("io")), setItem: async () => undefined, removeItem: async () => undefined } });
    await failing.render();
    assert.deepEqual([failing.out.s!.value, failing.out.s!.hydrated], [5, true]);
  });

  it("setValue updates state and writes JSON; functional updates compose; remove resets and deletes", async () => {
    const storage = createMemoryStorage();
    const t = mount("count", 0, { storage });
    await t.render();
    await act(async () => {
      t.out.s!.setValue(1);
      t.out.s!.setValue((c) => c + 1);
    });
    assert.equal(t.out.s!.value, 2);
    assert.equal(await storage.getItem("count"), "2");
    await act(async () => t.out.s!.remove());
    assert.equal(t.out.s!.value, 0);
    assert.equal(await storage.getItem("count"), null);
  });

  it("a value written before the read resolves wins over the stored one", async () => {
    let release!: (v: string | null) => void;
    const writes: string[] = [];
    const storage = { getItem: () => new Promise<string | null>((resolve) => (release = resolve)), setItem: async (_k: string, v: string) => void writes.push(v), removeItem: async () => undefined };
    const t = mount("k", "d", { storage });
    await t.render();
    await act(async () => t.out.s!.setValue("typed"));
    await act(async () => release(JSON.stringify("old")));
    assert.deepEqual([t.out.s!.value, t.out.s!.hydrated], ["typed", true]);
    assert.deepEqual(writes, [JSON.stringify("typed")]);
  });

  it("supports a custom serializer and applies writes in order", async () => {
    const order: string[] = [];
    const storage = {
      getItem: async () => "7",
      setItem: async (_k: string, v: string) => {
        await new Promise((r) => setTimeout(r, v === "8" ? 15 : 0));
        order.push(v);
      },
      removeItem: async () => undefined,
    };
    const t = mount<number>("n", 0, { storage, serialize: { stringify: (n) => String(n), parse: (raw) => Number(raw) } });
    await t.render();
    assert.equal(t.out.s!.value, 7);
    await act(async () => {
      t.out.s!.setValue(8);
      t.out.s!.setValue(9);
    });
    await new Promise((r) => setTimeout(r, 40));
    assert.deepEqual(order, ["8", "9"]);
  });

  it("a failing write does not throw and later writes still go through", async () => {
    let fail = true;
    const written: string[] = [];
    const storage = { getItem: async () => null, setItem: async (_k: string, v: string) => (fail ? Promise.reject(new Error("quota")) : void written.push(v)), removeItem: async () => undefined };
    const t = mount("k", 0, { storage });
    await t.render();
    await act(async () => t.out.s!.setValue(1));
    fail = false;
    await act(async () => t.out.s!.setValue(2));
    await new Promise((r) => setTimeout(r, 5));
    assert.deepEqual(written, ["2"]);
    assert.equal(t.out.s!.value, 2);
  });

  it("re-hydrates when the key changes, and the first frame after the change shows the default", async () => {
    const storage = createMemoryStorage({ a: JSON.stringify("A"), b: JSON.stringify("B") });
    const t = mount("a", "d", { storage });
    await t.render();
    assert.equal(t.out.s!.value, "A");
    const before = t.frames.length;
    await t.rekey("b");
    assert.deepEqual([t.frames[before]!.value, t.frames[before]!.hydrated], ["d", false]);
    assert.deepEqual([t.out.s!.value, t.out.s!.hydrated], ["B", true]);
  });

  it("falls back to the storage capability when no storage option is given", async () => {
    const backing = createMemoryStorage({ k: JSON.stringify("from capability") });
    const adapters = { storage: { id: "storage" as const, status: "available" as const, api: backing } };
    const t = mount("k", "d", undefined, (el) => <CapabilityProvider adapters={adapters}>{el}</CapabilityProvider>);
    await t.render();
    assert.equal(t.out.s!.value, "from capability");
  });

  it("does not set state after unmount", async () => {
    let release!: (v: string | null) => void;
    const storage = { getItem: () => new Promise<string | null>((resolve) => (release = resolve)), setItem: async () => undefined, removeItem: async () => undefined };
    const t = mount("k", "d", { storage });
    await t.render();
    t.unmount();
    await act(async () => release(JSON.stringify("late")));
    assert.equal(t.out.s!.value, "d");
  });
});

describe("module boundary", () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? walk(path) : [path];
    });

  it("imports no expo-* or async-storage package, and is not exported from the root entry", () => {
    const offenders = walk("src/native/storage").filter((f) => /(from\s+|require\()\s*["'](expo-|@react-native-async-storage)/.test(readFileSync(f, "utf8")));
    assert.deepEqual(offenders, []);
    assert.doesNotMatch(readFileSync("src/index.ts", "utf8"), /native\/storage/);
  });
});
