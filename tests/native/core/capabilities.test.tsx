import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import TestRenderer, { act } from "react-test-renderer";

import {
  CapabilityProvider,
  createCapabilityRegistry,
  createNoopAdapters,
  defineExpoAdapter,
  useCapability,
  useCapabilityStatus,
} from "../../../src/native/core/index.js";
import type { AdapterFor, CapabilityId, CapabilityStatus } from "../../../src/native/core/index.js";
import { coreFallback } from "../../../src/native/core/fallbacks.js";
import "./contract.types.js";

const root = resolve(import.meta.dirname, "../../..");

function mockClipboard(label: string, status: CapabilityStatus = "available"): AdapterFor<"clipboard"> {
  return { id: "clipboard", status, api: { getString: async () => label, setString: async () => undefined } };
}

function read<K extends CapabilityId>(id: K, tree: React.ReactElement): AdapterFor<K> {
  let seen!: AdapterFor<K>;
  function Probe() {
    seen = useCapability(id);
    return null;
  }
  act(() => {
    TestRenderer.create(React.cloneElement(tree, undefined, <Probe />));
  });
  return seen;
}

const Bare = <React.Fragment />;

describe("PLRNUI-138 capability layer", () => {
  it("returns a noop adapter with status noop when no provider is mounted", async () => {
    const adapter = read("clipboard", Bare);
    assert.equal(adapter.status, "noop");
    assert.equal(adapter.id, "clipboard");
    assert.equal(await adapter.api.getString(), "");
    await adapter.api.setString("x");
    for (const id of ["storage", "biometric", "network"] as const) assert.equal(read(id, Bare).status, "noop");
  });

  it("createNoopAdapters has one noop adapter per capability and never throws", async () => {
    const adapters = createNoopAdapters();
    assert.deepEqual(Object.keys(adapters).sort(), ["biometric", "clipboard", "haptics", "network", "share", "storage"]);
    for (const adapter of Object.values(adapters)) assert.equal(adapter.status, "noop");
    assert.equal(await adapters.storage.api.getItem("k"), null);
    assert.equal(await adapters.biometric.api.authenticate("x"), false);
  });

  it("an adapter factory without its injected module is unavailable and never throws", async () => {
    const factory = defineExpoAdapter<"clipboard", { read(): Promise<string> }>("clipboard", (m) => ({ getString: () => m.read(), setString: async () => undefined }));
    for (const missing of [undefined, null]) {
      const adapter = factory(missing);
      assert.equal(adapter.status, "unavailable");
      assert.equal(await adapter.api.getString(), "");
    }
    const available = factory({ read: async () => "hello" });
    assert.equal(available.status, "available");
    assert.equal(await available.api.getString(), "hello");
    const broken = defineExpoAdapter<"clipboard", object>("clipboard", () => {
      throw new Error("boom");
    })({});
    assert.equal(broken.status, "unavailable");
  });

  it("resolves provider adapter > registry default > noop", async () => {
    const registry = createCapabilityRegistry({ clipboard: mockClipboard("registry") });
    assert.equal(await read("clipboard", <CapabilityProvider registry={registry} />).api.getString(), "registry");
    assert.equal(await read("clipboard", <CapabilityProvider registry={registry} adapters={{ clipboard: mockClipboard("provider") }} />).api.getString(), "provider");
    assert.equal(read("storage", <CapabilityProvider registry={registry} />).status, "noop");
    registry.set("clipboard", mockClipboard("updated"));
    assert.equal(await read("clipboard", <CapabilityProvider registry={registry} />).api.getString(), "updated");
  });

  it("nesting: the inner provider overrides the outer one per id and inherits the rest", async () => {
    const tree = (
      <CapabilityProvider adapters={{ clipboard: mockClipboard("outer"), storage: { id: "storage", status: "available", api: { getItem: async () => "outer-storage", setItem: async () => undefined, removeItem: async () => undefined } } }}>
        <CapabilityProvider adapters={{ clipboard: mockClipboard("inner") }} />
      </CapabilityProvider>
    );
    // read() clones the outermost element, so build the probe inside the inner provider by hand.
    let clipboard!: AdapterFor<"clipboard">;
    let storage!: AdapterFor<"storage">;
    function Probe() {
      clipboard = useCapability("clipboard");
      storage = useCapability("storage");
      return null;
    }
    act(() => {
      TestRenderer.create(React.cloneElement(tree, undefined, React.cloneElement(tree.props.children, undefined, <Probe />)));
    });
    assert.equal(await clipboard.api.getString(), "inner");
    assert.equal(await storage.api.getItem("k"), "outer-storage");
  });

  it("useCapabilityStatus reports the status", () => {
    let status: CapabilityStatus | undefined;
    function Probe() {
      status = useCapabilityStatus("clipboard");
      return null;
    }
    act(() => {
      TestRenderer.create(
        <CapabilityProvider adapters={{ clipboard: mockClipboard("x", "unavailable") }}>
          <Probe />
        </CapabilityProvider>
      );
    });
    assert.equal(status, "unavailable");
  });

  it("src/native/core imports only react and react-native, and src has no require()", () => {
    const dir = join(root, "src", "native", "core");
    for (const file of readdirSync(dir).filter((f) => /\.tsx?$/.test(f))) {
      const source = readFileSync(join(dir, file), "utf8");
      for (const match of source.matchAll(/(?:from|import)\s+["']([^"']+)["']/g)) {
        const specifier = match[1];
        assert.ok(specifier.startsWith("./") || specifier === "react" || specifier === "react-native", `${file}: ${specifier}`);
      }
      assert.doesNotMatch(source, /\brequire\(/, file);
    }
    assert.ok(existsSync(join(dir, "README.md")));
    const walk = (d: string): string[] => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
    for (const file of walk(join(root, "src")).filter((f) => /\.tsx?$/.test(f))) assert.doesNotMatch(readFileSync(file, "utf8"), /\brequire\(/, file);
  });

  it("an undefined provider entry does not clobber an outer adapter", async () => {
    const tree = (
      <CapabilityProvider adapters={{ clipboard: mockClipboard("outer") }}>
        <CapabilityProvider adapters={{ clipboard: undefined }} />
      </CapabilityProvider>
    );
    let seen!: AdapterFor<"clipboard">;
    function Probe() {
      seen = useCapability("clipboard");
      return null;
    }
    act(() => {
      TestRenderer.create(React.cloneElement(tree, undefined, React.cloneElement(tree.props.children, undefined, <Probe />)));
    });
    assert.equal(await seen.api.getString(), "outer");
  });

  it("a registry rejects an adapter whose id does not match", () => {
    const registry = createCapabilityRegistry();
    assert.throws(() => registry.set("clipboard", { ...mockClipboard("x"), id: "share" } as never), /does not match/);
  });

  it("RN-core fallbacks: haptics through Vibration, share through Share, none when the host lacks them", async () => {
    const pulses: number[] = [];
    const host = {
      Vibration: { vibrate: (ms?: number | number[]) => void pulses.push(ms as number) },
      Share: { dismissedAction: "gone", share: async (_: object) => ({ action: _ && "sharedAction" in _ ? "gone" : "done" }) },
    };
    const haptics = coreFallback("haptics", host)!;
    assert.equal(haptics.status, "available");
    await haptics.api.impact();
    await haptics.api.selection();
    assert.deepEqual(pulses, [10, 5]);
    const share = coreFallback("share", host)!;
    assert.equal(await share.api.share({ message: "hi" }), "shared");
    assert.equal(await share.api.share({ message: "hi", url: "u", title: "t", sharedAction: 1 } as never), "dismissed");
    assert.equal(coreFallback("clipboard", host), undefined);
    assert.equal(coreFallback("haptics", {}), undefined);
    assert.equal(coreFallback("haptics"), coreFallback("haptics"), "stable identity for the real host");
  });

  it("is not exported from the root entry", () => {
    assert.doesNotMatch(readFileSync(join(root, "src", "index.ts"), "utf8"), /["']\.\/native/);
  });
});
