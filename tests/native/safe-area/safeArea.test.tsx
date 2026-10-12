import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import * as ReactNative from "react-native";
import TestRenderer, { act } from "react-test-renderer";

import {
  SafeAreaBox,
  SafeAreaInsetsProvider,
  createSafeAreaContextAdapter,
  resolveFallbackInsets,
  safeAreaEnvStyle,
  useInsets,
  useSafeAreaState,
  useSafeInsets,
} from "../../../src/native/safe-area/index.js";
import type { Insets, SafeAreaAdapter, SafeAreaState } from "../../../src/native/safe-area/index.js";

const platform = (ReactNative as unknown as { Platform: { OS: string } }).Platform;

function withPlatform<T>(os: string, run: () => T): T {
  const before = platform.OS;
  platform.OS = os;
  try {
    return run();
  } finally {
    platform.OS = before;
  }
}

function Probe({ out }: { out: { state?: SafeAreaState; insets?: Insets; safe?: Insets } }) {
  out.state = useSafeAreaState();
  out.insets = useInsets();
  out.safe = useSafeInsets();
  return null;
}

const render = (element: React.ReactElement) => {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(element);
  });
  return r;
};

const boxStyle = (r: TestRenderer.ReactTestRenderer) => r.root.findByType("View" as never).props.style as unknown[];

describe("fallback (no adapter)", () => {
  it("useInsets returns zeros and status 'noop'", () => {
    const out: Parameters<typeof Probe>[0]["out"] = {};
    render(<Probe out={out} />);
    assert.deepEqual(out.insets, { top: 0, right: 0, bottom: 0, left: 0 });
    assert.deepEqual(out.safe, { top: 0, right: 0, bottom: 0, left: 0 });
    assert.equal(out.state!.status, "noop");
  });

  it("maps Android status bar height to top, everything else to zero", () => {
    assert.deepEqual(resolveFallbackInsets("android", 24), { top: 24, right: 0, bottom: 0, left: 0 });
    assert.deepEqual(resolveFallbackInsets("android", undefined), { top: 0, right: 0, bottom: 0, left: 0 });
    assert.deepEqual(resolveFallbackInsets("android", NaN), { top: 0, right: 0, bottom: 0, left: 0 });
    assert.deepEqual(resolveFallbackInsets("ios", 44), { top: 0, right: 0, bottom: 0, left: 0 });
  });

  it("useSafeInsets stays zero while useInsets uses the platform fallback", () => {
    // The react-native namespace is frozen ESM, so StatusBar.currentHeight itself cannot be stubbed here: the Android
    // mapping is covered through resolveFallbackInsets above, and the test shim has no StatusBar (zeros).
    const out: Parameters<typeof Probe>[0]["out"] = {};
    withPlatform("android", () => render(<Probe out={out} />));
    assert.deepEqual(out.insets, { top: 0, right: 0, bottom: 0, left: 0 });
    assert.deepEqual(out.safe, { top: 0, right: 0, bottom: 0, left: 0 });
  });

  it("SafeAreaBox pads with zeros without a provider", () => {
    const r = render(<SafeAreaBox>{"x"}</SafeAreaBox>);
    assert.deepEqual(boxStyle(r)[0], { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0 });
  });

  it("SafeAreaBox uses env(safe-area-inset-*) on web", () => {
    const r = withPlatform("web", () => render(<SafeAreaBox edges={["top", "bottom"]}>{"x"}</SafeAreaBox>));
    assert.deepEqual(boxStyle(r)[0], {
      paddingTop: "env(safe-area-inset-top)",
      paddingBottom: "env(safe-area-inset-bottom)",
    });
    assert.deepEqual(safeAreaEnvStyle(["left"]), { paddingLeft: "env(safe-area-inset-left)" });
  });
});

describe("provider and adapter", () => {
  const mock: Insets = { top: 47, right: 3, bottom: 34, left: 5 };

  it("override values flow to consumers with status 'available'", () => {
    const out: Parameters<typeof Probe>[0]["out"] = {};
    render(
      <SafeAreaInsetsProvider insets={mock}>
        <Probe out={out} />
      </SafeAreaInsetsProvider>
    );
    assert.deepEqual(out.insets, mock);
    assert.deepEqual(out.safe, mock);
    assert.equal(out.state!.status, "available");
  });

  it("a partial override fills missing edges with 0 and sanitises bad values", () => {
    const out: Parameters<typeof Probe>[0]["out"] = {};
    render(
      <SafeAreaInsetsProvider insets={{ top: 10, bottom: -4, left: NaN }}>
        <Probe out={out} />
      </SafeAreaInsetsProvider>
    );
    assert.deepEqual(out.insets, { top: 10, right: 0, bottom: 0, left: 0 });
  });

  it("SafeAreaBox applies the adapter insets by edges", () => {
    const r = render(
      <SafeAreaInsetsProvider insets={mock}>
        <SafeAreaBox edges={["top", "bottom"]} style={{ flex: 1 }}>
          {"x"}
        </SafeAreaBox>
      </SafeAreaInsetsProvider>
    );
    const style = boxStyle(r);
    assert.deepEqual(style[0], { paddingTop: 47, paddingBottom: 34 });
    assert.deepEqual(style[1], { flex: 1 });
    assert.equal(r.root.findByType("View" as never).props.accessibilityRole, undefined);
  });

  it("an adapter supplies live insets and updates consumers; the override wins over the adapter", () => {
    let current: Insets = { top: 1, right: 0, bottom: 2, left: 0 };
    const adapter: SafeAreaAdapter = { useInsets: () => current };
    const out: Parameters<typeof Probe>[0]["out"] = {};
    const tree = () => (
      <SafeAreaInsetsProvider adapter={adapter}>
        <Probe out={out} />
      </SafeAreaInsetsProvider>
    );
    const r = render(tree());
    assert.deepEqual(out.insets, { top: 1, right: 0, bottom: 2, left: 0 });
    assert.equal(out.state!.status, "available");
    current = { top: 20, right: 0, bottom: 2, left: 0 };
    act(() => r.update(tree()));
    assert.equal(out.insets!.top, 20);

    render(
      <SafeAreaInsetsProvider adapter={adapter} insets={mock}>
        <Probe out={out} />
      </SafeAreaInsetsProvider>
    );
    assert.deepEqual(out.insets, mock);
  });

  it("keeps the insets object identity while the values are unchanged", () => {
    const seen: Insets[] = [];
    const adapter: SafeAreaAdapter = { useInsets: () => ({ ...mock }) };
    function Capture() {
      seen.push(useInsets());
      return null;
    }
    const tree = () => (
      <SafeAreaInsetsProvider adapter={adapter}>
        <Capture />
      </SafeAreaInsetsProvider>
    );
    const r = render(tree());
    act(() => r.update(tree()));
    assert.equal(seen[0], seen[seen.length - 1]);
  });
});

describe("createSafeAreaContextAdapter", () => {
  it("wraps an injected module structurally and mounts its provider only on request", () => {
    const Host = ({ children }: { children?: React.ReactNode }) => React.createElement("Host", null, children);
    const module = { useSafeAreaInsets: () => ({ top: 9, right: 0, bottom: 8, left: 0 }), SafeAreaProvider: Host };
    const plain = createSafeAreaContextAdapter(module);
    assert.equal(plain.Provider, undefined);
    const mounted = createSafeAreaContextAdapter(module, { mountProvider: true });
    assert.equal(mounted.Provider, Host);

    const out: Parameters<typeof Probe>[0]["out"] = {};
    const r = render(
      <SafeAreaInsetsProvider adapter={mounted}>
        <Probe out={out} />
      </SafeAreaInsetsProvider>
    );
    assert.equal(r.root.findAllByType("Host" as never).length, 1);
    assert.equal(out.insets!.top, 9);
  });
});

describe("module boundary", () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? walk(path) : [path];
    });

  it("src never imports react-native-safe-area-context or expo-*", () => {
    const offenders = walk("src").filter((file) => /\.tsx?$/.test(file) &&
      /(from\s+|require\()\s*["'](react-native-safe-area-context|expo-)/.test(readFileSync(file, "utf8"))
    );
    assert.deepEqual(offenders, []);
  });

  it("is not exported from the root entry", () => {
    assert.doesNotMatch(readFileSync("src/index.ts", "utf8"), /safe-area/);
  });
});
