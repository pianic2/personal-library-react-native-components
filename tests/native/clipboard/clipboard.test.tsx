import React from "react";
import { afterEach, describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import TestRenderer, { act } from "react-test-renderer";

import { CapabilityProvider } from "../../../src/native/core/index.js";
import type { AdapterFor, ClipboardApi } from "../../../src/native/core/index.js";
import {
  canWriteWebClipboard,
  createExpoClipboard,
  createExpoClipboardAdapter,
  createWebClipboard,
  resolveWebClipboard,
  useCopyToClipboard,
} from "../../../src/native/clipboard/index.js";
import type { CopyToClipboard, UseCopyToClipboardOptions, WebClipboardDocument } from "../../../src/native/clipboard/index.js";

function mockExpo(overrides: Partial<{ set: (v: string) => Promise<unknown>; get: () => Promise<string> }> = {}) {
  const writes: string[] = [];
  const module = {
    setStringAsync: overrides.set ?? (async (v: string) => void writes.push(v)),
    getStringAsync: overrides.get ?? (async () => "pasted"),
  };
  return { module, writes };
}

function renderCopy(options?: UseCopyToClipboardOptions, adapters?: React.ComponentProps<typeof CapabilityProvider>["adapters"]) {
  const out: { c?: CopyToClipboard } = {};
  function Probe() {
    out.c = useCopyToClipboard(options);
    return null;
  }
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(
      adapters ? (
        <CapabilityProvider adapters={adapters}>
          <Probe />
        </CapabilityProvider>
      ) : (
        <Probe />
      )
    );
  });
  return { out, r };
}

function setGlobal(name: "navigator" | "document", value: unknown) {
  const before = Object.getOwnPropertyDescriptor(globalThis, name);
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
  return () => {
    if (before) Object.defineProperty(globalThis, name, before);
    else delete (globalThis as Record<string, unknown>)[name];
  };
}

afterEach(() => mock.timers.reset());

describe("expo mapping", () => {
  it("maps get/set to the injected module and stringifies the read", async () => {
    const { module, writes } = mockExpo();
    const api: ClipboardApi = createExpoClipboard(module);
    await api.setString("hello");
    assert.deepEqual(writes, ["hello"]);
    assert.equal(await api.getString(), "pasted");
  });

  it("the adapter factory is available with a module and unavailable (noop) without one", async () => {
    const { module, writes } = mockExpo();
    const adapter: AdapterFor<"clipboard"> = createExpoClipboardAdapter(module);
    assert.equal(adapter.status, "available");
    await adapter.api.setString("x");
    assert.deepEqual(writes, ["x"]);
    for (const missing of [undefined, null]) {
      const none = createExpoClipboardAdapter(missing);
      assert.equal(none.status, "unavailable");
      assert.equal(await none.api.getString(), "");
    }
  });
});

describe("web adapter", () => {
  it("writes with navigator.clipboard and reads with readText", async () => {
    const written: string[] = [];
    const api = createWebClipboard({
      navigator: { clipboard: { writeText: async (v) => void written.push(v), readText: async () => "r" } },
    });
    await api.setString("a");
    assert.deepEqual(written, ["a"]);
    assert.equal(await api.getString(), "r");
  });

  function fakeDocument(copyResult: boolean) {
    const log: string[] = [];
    const field = { value: "", style: {} as Record<string, string>, setAttribute: () => undefined, select: () => void log.push("select") };
    const doc: WebClipboardDocument = {
      body: { appendChild: () => void log.push("append"), removeChild: () => void log.push("remove") },
      createElement: () => field,
      execCommand: (command) => (log.push(command), copyResult),
    };
    return { doc, log, field };
  }

  it("falls back to execCommand when navigator.clipboard is missing or rejects, and cleans up", async () => {
    for (const nav of [undefined, { clipboard: { writeText: async () => Promise.reject(new Error("insecure")) } }]) {
      const { doc, log, field } = fakeDocument(true);
      await createWebClipboard({ navigator: nav, document: doc }).setString("copy me");
      assert.equal(field.value, "copy me");
      assert.deepEqual(log, ["append", "select", "copy", "remove"]);
    }
  });

  it("rejects when nothing can write or execCommand fails; reads resolve '' without readText", async () => {
    await assert.rejects(createWebClipboard({}).setString("x"));
    const { doc, log } = fakeDocument(false);
    await assert.rejects(createWebClipboard({ document: doc }).setString("x"));
    assert.equal(log.at(-1), "remove");
    assert.equal(await createWebClipboard({}).getString(), "");
    assert.equal(canWriteWebClipboard({}), false);
    assert.equal(canWriteWebClipboard({ document: fakeDocument(true).doc }), true);
  });
});

describe("useCopyToClipboard", () => {
  it("with no adapter: copy resolves false, error null, status 'noop'", async () => {
    const restoreNav = setGlobal("navigator", {});
    const restoreDoc = setGlobal("document", undefined);
    try {
      assert.equal(resolveWebClipboard(), undefined);
      const { out } = renderCopy();
      assert.equal(out.c!.status, "noop");
      let result: boolean | undefined;
      await act(async () => {
        result = await out.c!.copy("x");
      });
      assert.equal(result, false);
      assert.equal(out.c!.error, null);
      assert.equal(out.c!.copied, false);
    } finally {
      restoreNav();
      restoreDoc();
    }
  });

  it("uses navigator.clipboard on web when nothing is configured", async () => {
    const written: string[] = [];
    const restore = setGlobal("navigator", { clipboard: { writeText: async (v: string) => void written.push(v) } });
    try {
      const { out } = renderCopy();
      assert.equal(out.c!.status, "available");
      await act(async () => void (await out.c!.copy("web")));
      assert.deepEqual(written, ["web"]);
      assert.equal(out.c!.copied, true);
    } finally {
      restore();
    }
  });

  it("copied turns true after a copy and resets after resetMs (fake timers)", async () => {
    mock.timers.enable({ apis: ["setTimeout"] });
    const { module, writes } = mockExpo();
    const { out } = renderCopy({ resetMs: 1500 }, { clipboard: createExpoClipboardAdapter(module) });
    let result: boolean | undefined;
    await act(async () => {
      result = await out.c!.copy("abc");
    });
    assert.equal(result, true);
    assert.deepEqual(writes, ["abc"]);
    assert.equal(out.c!.copied, true);
    act(() => mock.timers.tick(1499));
    assert.equal(out.c!.copied, true);
    act(() => mock.timers.tick(1));
    assert.equal(out.c!.copied, false);
    assert.equal(out.c!.error, null);
  });

  it("a second copy restarts the reset window", async () => {
    mock.timers.enable({ apis: ["setTimeout"] });
    const { module } = mockExpo();
    const { out } = renderCopy({ resetMs: 1000 }, { clipboard: createExpoClipboardAdapter(module) });
    await act(async () => void (await out.c!.copy("1")));
    act(() => mock.timers.tick(800));
    await act(async () => void (await out.c!.copy("2")));
    act(() => mock.timers.tick(800));
    assert.equal(out.c!.copied, true);
    act(() => mock.timers.tick(200));
    assert.equal(out.c!.copied, false);
  });

  it("a failing write resolves false and exposes the error; the next copy clears it", async () => {
    let fail = true;
    const failure = new Error("denied");
    const { module } = mockExpo({ set: async () => (fail ? Promise.reject(failure) : undefined) });
    const { out } = renderCopy(undefined, { clipboard: createExpoClipboardAdapter(module) });
    let result: boolean | undefined;
    await act(async () => {
      result = await out.c!.copy("x");
    });
    assert.equal(result, false);
    assert.equal(out.c!.error, failure);
    assert.equal(out.c!.copied, false);
    fail = false;
    await act(async () => void (await out.c!.copy("y")));
    assert.equal(out.c!.error, null);
    assert.equal(out.c!.copied, true);
  });

  it("an unavailable adapter reports its status and copies nothing", async () => {
    const { out } = renderCopy(undefined, { clipboard: createExpoClipboardAdapter(undefined) });
    assert.equal(out.c!.status, "unavailable");
    let result: boolean | undefined;
    await act(async () => {
      result = await out.c!.copy("x");
    });
    assert.equal(result, false);
    assert.equal(out.c!.error, null);
  });

  it("clears the timer on unmount and sets no state for a copy that finishes after unmount", async () => {
    mock.timers.enable({ apis: ["setTimeout"] });
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const { module } = mockExpo({ set: async () => gate });
    const { out, r } = renderCopy(undefined, { clipboard: createExpoClipboardAdapter(module) });
    let pending!: Promise<boolean>;
    act(() => {
      pending = out.c!.copy("late");
    });
    act(() => r.unmount());
    release();
    assert.equal(await pending, true);
    assert.doesNotThrow(() => mock.timers.tick(5000));
  });
});

describe("module boundary", () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? walk(path) : [path];
    });

  it("only src/native/clipboard/expo.ts mentions expo-clipboard, and nothing imports it", () => {
    const files = walk("src").filter((file) => /\.tsx?$/.test(file));
    const mentions = files.filter((file) => readFileSync(file, "utf8").includes("expo-clipboard"));
    assert.deepEqual(mentions, ["src/native/clipboard/expo.ts"]);
    assert.deepEqual(
      files.filter((file) => /(from\s+|require\()\s*["']expo-clipboard/.test(readFileSync(file, "utf8"))),
      []
    );
  });

  it("is not exported from the root entry", () => {
    assert.doesNotMatch(readFileSync("src/index.ts", "utf8"), /clipboard/i);
  });
});
