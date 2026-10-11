import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import TestRenderer, { act } from "react-test-renderer";
import { ThemeProvider, useTheme } from "../../../src";
import type { AppearanceApi, ColorSchemeValue } from "../../../src/native/core/index.js";
import { createNoopAdapters } from "../../../src/native/core/index.js";
import { createMockAdapters, renderWithCapabilities } from "../../../src/native/testing/index.js";
import { createReactNativeAppearance, resolveThemeMode, toColorScheme, useColorScheme, useSystemThemeMode } from "../../../src/native/appearance/index.js";
import type { RNAppearance } from "../../../src/native/appearance/index.js";
import type { ThemeMode } from "../../../src/theme/types.js";

function Probe({ log }: { log: string[] }) {
  const scheme = useColorScheme();
  const mode = useSystemThemeMode();
  log.push(`${scheme}:${mode}`);
  return null;
}

// The documented usage: the theme STARTS in the OS mode (`initialMode` is read on the first render; use `preference="system"` of ThemeProvider to follow later changes).
function FollowsSystem({ children }: { children: React.ReactNode }) {
  const mode: ThemeMode = useSystemThemeMode();
  return <ThemeProvider initialMode={mode}>{children}</ThemeProvider>;
}

describe("PLRNUI-154 appearance hooks", () => {
  it("reads the scheme of the mocked capability and follows its change listener", () => {
    const mocks = createMockAdapters();
    const log: string[] = [];
    renderWithCapabilities(<Probe log={log} />, mocks);
    assert.equal(log.at(-1), "light:light");
    act(() => mocks.setColorScheme("dark"));
    assert.equal(log.at(-1), "dark:dark");
    act(() => mocks.setColorScheme("light"));
    assert.equal(log.at(-1), "light:light");
  });

  it("an unknown scheme (null) reads as light", () => {
    const mocks = createMockAdapters();
    mocks.state.appearance.reset("dark");
    const log: string[] = [];
    renderWithCapabilities(<Probe log={log} />, mocks);
    assert.equal(log.at(-1), "dark:dark");
    act(() => mocks.setColorScheme(null));
    assert.equal(log.at(-1), "light:light");
  });

  it("resolveThemeMode maps system through the scheme and a null or missing scheme to light", () => {
    assert.equal(resolveThemeMode("system", "dark"), "dark");
    assert.equal(resolveThemeMode("system", "light"), "light");
    assert.equal(resolveThemeMode("system", null), "light");
    assert.equal(resolveThemeMode("system"), "light");
    assert.equal(resolveThemeMode("system", undefined), "light");
    assert.equal(resolveThemeMode("dark", "light"), "dark");
    assert.equal(resolveThemeMode("light", "dark"), "light");
    assert.equal(resolveThemeMode("dark", null), "dark");
  });

  it("without a provider (the shim has no Appearance) it renders light and does not throw", () => {
    const log: string[] = [];
    act(() => {
      TestRenderer.create(<Probe log={log} />);
    });
    assert.equal(log.at(-1), "light:light");
  });

  it("unsubscribes on unmount and subscribes once per adapter", () => {
    const mocks = createMockAdapters();
    const inner = mocks.adapters.appearance.api;
    let subs = 0;
    let unsubs = 0;
    mocks.adapters.appearance.api = {
      getColorScheme: () => inner.getColorScheme(),
      subscribe: (l) => {
        subs += 1;
        const off = inner.subscribe(l);
        return () => {
          unsubs += 1;
          off();
        };
      },
    };
    const log: string[] = [];
    const renderer = renderWithCapabilities(<Probe log={log} />, mocks);
    act(() => mocks.setColorScheme("dark"));
    assert.equal(subs, 2); // two hooks in the probe
    act(() => renderer.unmount());
    assert.equal(unsubs, 2);
  });

  it("a throwing api degrades to an unknown scheme instead of crashing", () => {
    const throwing: AppearanceApi = {
      getColorScheme() {
        throw new Error("boom");
      },
      subscribe() {
        throw new Error("boom");
      },
    };
    const log: string[] = [];
    const warn = console.warn;
    console.warn = () => undefined;
    try {
      renderWithCapabilities(<Probe log={log} />, { appearance: { id: "appearance", status: "available", api: throwing } });
    } finally {
      console.warn = warn;
    }
    assert.equal(log.at(-1), "light:light");
  });

  it("invalid scheme values from an adapter map to unknown", () => {
    const odd: AppearanceApi = { getColorScheme: () => "unspecified" as unknown as ColorSchemeValue, subscribe: () => () => undefined };
    const log: string[] = [];
    renderWithCapabilities(<Probe log={log} />, { appearance: { id: "appearance", status: "available", api: odd } });
    assert.equal(log.at(-1), "light:light");
  });

  it("an injected adapter with status unavailable is used as given (only noop falls back)", () => {
    const own: AppearanceApi = { getColorScheme: () => "dark", subscribe: () => () => undefined };
    for (const status of ["available", "unavailable"] as const) {
      const log: string[] = [];
      renderWithCapabilities(<Probe log={log} />, { appearance: { id: "appearance", status, api: own } });
      assert.equal(log.at(-1), "dark:dark", status);
    }
  });

  it("re-reads the scheme in the effect when it changed between render and subscribe", () => {
    let value: ColorSchemeValue = "light";
    let reads = 0;
    const api: AppearanceApi = {
      getColorScheme: () => {
        reads += 1;
        const current = value;
        if (reads === 1) value = "dark"; // changes right after the first (render-time) read
        return current;
      },
      subscribe: () => () => undefined,
    };
    const log: string[] = [];
    renderWithCapabilities(<Probe log={log} />, { appearance: { id: "appearance", status: "available", api } });
    assert.equal(log.at(-1), "dark:dark");
  });

  it("the noop adapter reports an unknown scheme and a subscription that does nothing", () => {
    const api = createNoopAdapters().appearance.api;
    assert.equal(api.getColorScheme(), null);
    assert.equal(typeof api.subscribe(() => assert.fail("never called")), "function");
  });

  it("the mock restores the scheme on reset(), and a denied permission throws synchronously", () => {
    const mocks = createMockAdapters();
    mocks.setColorScheme("dark");
    mocks.reset();
    assert.equal(mocks.state.appearance.get(), "light");
    mocks.setPermission("appearance", "denied");
    const api = mocks.adapters.appearance.api;
    assert.throws(() => api.getColorScheme(), /permission denied: appearance/);
    assert.throws(() => api.subscribe(() => undefined), /permission denied: appearance/);
    assert.deepEqual(mocks.callsOf("appearance").map((c) => c.method), ["getColorScheme", "subscribe"]);
  });

  it("the documented ThemeProvider usage follows the mocked scheme", () => {
    const mocks = createMockAdapters();
    mocks.state.appearance.reset("dark");
    let seen: ThemeMode | undefined;
    function Mode() {
      seen = useTheme().mode;
      return null;
    }
    renderWithCapabilities(
      <FollowsSystem>
        <Mode />
      </FollowsSystem>,
      mocks
    );
    assert.equal(seen, "dark");
  });
});

describe("PLRNUI-154 React Native Appearance mapping", () => {
  function fakeAppearance(initial: string | null | undefined) {
    let scheme = initial;
    const listeners = new Set<(p: { colorScheme?: string | null }) => void>();
    let removed = 0;
    const host: RNAppearance = {
      getColorScheme: () => scheme,
      addChangeListener(l) {
        listeners.add(l);
        return { remove: () => void (removed += 1, listeners.delete(l)) };
      },
    };
    return { host, emit: (next: string | null | undefined) => void ((scheme = next), listeners.forEach((l) => l({ colorScheme: next }))), removed: () => removed, size: () => listeners.size };
  }

  it("maps light and dark, and everything else to unknown", () => {
    assert.equal(toColorScheme("light"), "light");
    assert.equal(toColorScheme("dark"), "dark");
    for (const value of [null, undefined, "unspecified", "", 1, {}]) assert.equal(toColorScheme(value), null);
  });

  it("reads the current scheme and notifies the change listener, then unsubscribes", () => {
    const fake = fakeAppearance("dark");
    const api = createReactNativeAppearance(fake.host);
    assert.equal(api.getColorScheme(), "dark");
    const seen: ColorSchemeValue[] = [];
    const off = api.subscribe((s) => seen.push(s));
    fake.emit("light");
    fake.emit(null);
    fake.emit("unspecified");
    assert.deepEqual(seen, ["light", null, null]);
    off();
    assert.equal(fake.removed(), 1);
    assert.equal(fake.size(), 0);
    fake.emit("dark");
    assert.deepEqual(seen, ["light", null, null]);
  });

  it("an unknown initial scheme is null", () => {
    assert.equal(createReactNativeAppearance(fakeAppearance(null).host).getColorScheme(), null);
    assert.equal(createReactNativeAppearance(fakeAppearance(undefined).host).getColorScheme(), null);
  });
});

describe("PLRNUI-154 boundaries", () => {
  it("the appearance sources import only react and react-native (plus project files)", () => {
    const dir = join(import.meta.dirname, "../../../src/native/appearance");
    const bad: string[] = [];
    for (const file of readdirSync(dir)) {
      for (const match of readFileSync(join(dir, file), "utf8").matchAll(/from\s+"([^".][^"]*)"/g)) {
        if (match[1] !== "react" && match[1] !== "react-native") bad.push(`${file}: ${match[1]}`);
      }
    }
    assert.deepEqual(bad, []);
  });
});
