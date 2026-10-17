import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import TestRenderer, { act } from "react-test-renderer";

import { createNoopShare, createReactNativeShare, createWebShare, useShare } from "../../../src/native/share/index.js";
import type { ReactNativeShareLike, ShareAdapter, ShareState, WebNavigatorLike } from "../../../src/native/share/index.js";

function mockShare(answer: () => Promise<{ action: string }>, constants = true) {
  const calls: Array<{ content: unknown; options: unknown }> = [];
  const Share: ReactNativeShareLike = {
    share: (content, options) => {
      calls.push({ content, options });
      return answer();
    },
    ...(constants ? { sharedAction: "sharedAction", dismissedAction: "dismissedAction" } : null),
  };
  return { Share, calls };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("PLRNUI-301 React Native share", () => {
  it("maps dismissedAction to dismissed", async () => {
    const { Share } = mockShare(async () => ({ action: "dismissedAction" }));
    assert.deepEqual(await createReactNativeShare(Share).share({ message: "hi" }), { action: "dismissed" });
  });

  it("maps sharedAction to shared", async () => {
    const { Share } = mockShare(async () => ({ action: "sharedAction" }));
    assert.deepEqual(await createReactNativeShare(Share).share({ message: "hi" }), { action: "shared" });
  });

  it("uses the constants of the injected Share when they differ from the defaults", async () => {
    const Share: ReactNativeShareLike = { share: async () => ({ action: "DONE" }), sharedAction: "DONE", dismissedAction: "CLOSED" };
    assert.deepEqual(await createReactNativeShare(Share).share({ url: "https://a.b" }), { action: "shared" });
  });

  it("falls back to the React Native constant values when the injected Share has none", async () => {
    const { Share } = mockShare(async () => ({ action: "dismissedAction" }), false);
    assert.deepEqual(await createReactNativeShare(Share).share({ message: "hi" }), { action: "dismissed" });
  });

  it("passes message, url and title, and the title as the Android dialogTitle", async () => {
    const { Share, calls } = mockShare(async () => ({ action: "sharedAction" }));
    await createReactNativeShare(Share).share({ message: "m", url: "https://a.b", title: "T" });
    assert.deepEqual(calls[0], { content: { message: "m", url: "https://a.b", title: "T" }, options: { dialogTitle: "T" } });
  });

  it("is unsupported for an unknown action, a rejection and empty content, without throwing", async () => {
    const unknown = mockShare(async () => ({ action: "weird" }));
    assert.deepEqual(await createReactNativeShare(unknown.Share).share({ message: "m" }), { action: "unsupported" });
    const rejecting = mockShare(async () => {
      throw new Error("native");
    });
    assert.deepEqual(await createReactNativeShare(rejecting.Share).share({ message: "m" }), { action: "unsupported" });
    const throwing: ReactNativeShareLike = {
      share: () => {
        throw new Error("sync");
      },
    };
    assert.deepEqual(await createReactNativeShare(throwing).share({ message: "m" }), { action: "unsupported" });
    const empty = mockShare(async () => ({ action: "sharedAction" }));
    assert.deepEqual(await createReactNativeShare(empty.Share).share({ title: "only" }), { action: "unsupported" });
    assert.deepEqual(await createReactNativeShare(empty.Share).share({ message: "", url: "" }), { action: "unsupported" });
    assert.equal(empty.calls.length, 0);
  });
});

describe("PLRNUI-301 web share", () => {
  it("returns unsupported, not a throw, when navigator.share is missing", async () => {
    assert.deepEqual(await createWebShare({}).share({ url: "https://a.b" }), { action: "unsupported" });
    assert.deepEqual(await createWebShare(undefined).share({ url: "https://a.b" }), { action: "unsupported" });
  });

  it("runs the copy-link hook when navigator.share is missing and still returns unsupported", async () => {
    const seen: unknown[] = [];
    const adapter = createWebShare({}, { onUnsupported: (content) => void seen.push(content) });
    assert.deepEqual(await adapter.share({ url: "https://a.b", title: "T" }), { action: "unsupported" });
    assert.deepEqual(seen, [{ url: "https://a.b", title: "T" }]);
  });

  it("swallows a throwing or rejecting hook", async () => {
    const throwing = createWebShare({}, { onUnsupported: () => { throw new Error("x"); } });
    assert.deepEqual(await throwing.share({ url: "u" }), { action: "unsupported" });
    const rejecting = createWebShare({}, { onUnsupported: async () => { throw new Error("x"); } });
    assert.deepEqual(await rejecting.share({ url: "u" }), { action: "unsupported" });
  });

  it("does not run the hook when navigator.share exists", async () => {
    let hooked = 0;
    const nav: WebNavigatorLike = { share: async () => undefined };
    await createWebShare(nav, { onUnsupported: () => void hooked++ }).share({ url: "u" });
    assert.equal(hooked, 0);
  });

  it("shares through navigator.share with text, url and title", async () => {
    const calls: unknown[] = [];
    const nav: WebNavigatorLike = { share: async (data) => void calls.push(data) };
    assert.deepEqual(await createWebShare(nav).share({ message: "m", url: "https://a.b", title: "T" }), { action: "shared" });
    assert.deepEqual(calls, [{ text: "m", url: "https://a.b", title: "T" }]);
  });

  it("maps AbortError to dismissed and other rejections to unsupported", async () => {
    const abort = Object.assign(new Error("closed"), { name: "AbortError" });
    assert.deepEqual(await createWebShare({ share: async () => { throw abort; } }).share({ url: "u" }), { action: "dismissed" });
    assert.deepEqual(await createWebShare({ share: async () => { throw new Error("NotAllowedError"); } }).share({ url: "u" }), { action: "unsupported" });
    assert.deepEqual(await createWebShare({ share: () => { throw "boom"; } }).share({ url: "u" }), { action: "unsupported" });
  });

  it("is unsupported for empty content without calling navigator.share", async () => {
    let called = 0;
    const adapter = createWebShare({ share: async () => void called++ });
    assert.deepEqual(await adapter.share({ title: "only" }), { action: "unsupported" });
    assert.equal(called, 0);
  });
});

describe("PLRNUI-301 noop share", () => {
  it("is unsupported", async () => {
    assert.deepEqual(await createNoopShare().share({ message: "m" }), { action: "unsupported" });
  });
});

function renderShare(options?: Parameters<typeof useShare>[0]) {
  const out: { s?: ShareState } = {};
  function Probe() {
    out.s = useShare(options);
    return null;
  }
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(<Probe />);
  });
  return { out, r };
}

describe("PLRNUI-301 useShare", () => {
  it("is pending while the share promise is unresolved and not after it resolves", async () => {
    const gate = deferred<{ action: string }>();
    const { Share } = mockShare(() => gate.promise);
    const { out } = renderShare({ adapter: createReactNativeShare(Share) });
    assert.equal(out.s!.pending, false);
    let finished!: Promise<unknown>;
    act(() => {
      finished = out.s!.share({ message: "hi" });
    });
    assert.equal(out.s!.pending, true);
    await act(async () => {
      gate.resolve({ action: "sharedAction" });
      await finished;
    });
    assert.equal(out.s!.pending, false);
    assert.deepEqual(out.s!.result, { action: "shared" });
  });

  it("resolves unsupported without a sheet for a second call while one is pending", async () => {
    const gate = deferred<{ action: string }>();
    const { Share, calls } = mockShare(() => gate.promise);
    const { out } = renderShare({ adapter: createReactNativeShare(Share) });
    let first!: Promise<unknown>;
    act(() => {
      first = out.s!.share({ message: "a" });
    });
    let second: unknown;
    await act(async () => {
      second = await out.s!.share({ message: "b" });
    });
    assert.deepEqual(second, { action: "unsupported" });
    assert.equal(calls.length, 1);
    await act(async () => {
      gate.resolve({ action: "dismissedAction" });
      await first;
    });
    assert.deepEqual(out.s!.result, { action: "dismissed" });
  });

  it("is not pending after a rejecting adapter and reports unsupported", async () => {
    const adapter: ShareAdapter = { share: async () => { throw new Error("bad adapter"); } };
    const { out } = renderShare({ adapter });
    await act(async () => {
      await out.s!.share({ message: "m" });
    });
    assert.equal(out.s!.pending, false);
    assert.deepEqual(out.s!.result, { action: "unsupported" });
  });

  it("normalises a malformed adapter answer to unsupported", async () => {
    const adapter = { share: async () => ({ action: "bogus" }) } as unknown as ShareAdapter;
    const { out } = renderShare({ adapter });
    await act(async () => {
      await out.s!.share({ message: "m" });
    });
    assert.deepEqual(out.s!.result, { action: "unsupported" });
  });

  it("uses the noop adapter when none is given", async () => {
    const { out } = renderShare();
    assert.equal(out.s!.result, null);
    await act(async () => {
      assert.deepEqual(await out.s!.share({ message: "m" }), { action: "unsupported" });
    });
  });

  // React 18 ignores a state update on an unmounted component and does not warn, so this can only prove that the promise still
  // resolves its result and nothing throws; the `mounted` guard itself is not observable from here.
  it("still resolves the result when the component unmounts before the share finishes", async () => {
    let renders = 0;
    const gate2 = deferred<{ action: string }>();
    const adapter: ShareAdapter = { share: () => gate2.promise.then((a) => a as never) };
    const counted: { s?: ShareState } = {};
    function Counting() {
      renders++;
      counted.s = useShare({ adapter });
      return null;
    }
    let r2!: TestRenderer.ReactTestRenderer;
    act(() => {
      r2 = TestRenderer.create(<Counting />);
    });
    let finished2!: Promise<unknown>;
    act(() => {
      finished2 = counted.s!.share({ message: "m" });
    });
    const before = renders;
    act(() => r2.unmount());
    gate2.resolve({ action: "shared" });
    assert.deepEqual(await finished2, { action: "shared" });
    assert.equal(counted.s!.pending, true);
    assert.equal(renders, before);
  });
});

describe("PLRNUI-301 boundaries", () => {
  const dir = join(import.meta.dirname, "../../../src/native/share");
  const sources = readdirSync(dir).filter((f) => f.endsWith(".ts")).map((f) => [f, readFileSync(join(dir, f), "utf8")] as const);

  it("imports no expo-* or react-native-* package and uses no require", () => {
    for (const [file, text] of sources) {
      const code = text.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
      assert.equal(/from\s+["'](?:expo|react-native)/.test(code), false, `${file} imports a native package`);
      assert.equal(/\brequire\s*\(/.test(code), false, `${file} uses require`);
      assert.equal(/\bimport\s*\(/.test(code), false, `${file} uses dynamic import`);
    }
  });

  it("is not reachable from the root entry and adds no dependency", () => {
    const root = join(import.meta.dirname, "../../..");
    const walk = (d: string): string[] => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
    assert.equal(/native\/share/.test(readFileSync(join(root, "src/index.ts"), "utf8")), false);
    const rootImports = walk(join(root, "src")).filter((f) => !f.includes("/native/") && /\.tsx?$/.test(f)).filter((f) => /native\/share/.test(readFileSync(f, "utf8")));
    assert.deepEqual(rootImports, []);
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    for (const section of ["dependencies", "peerDependencies"]) assert.equal(JSON.stringify(pkg[section] ?? {}).includes("sharing"), false);
  });
});
