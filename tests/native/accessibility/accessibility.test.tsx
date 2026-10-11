import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { act } from "react-test-renderer";
import { CapabilityProvider } from "../../../src/native/core/index.js";
import { createMockAdapters, renderWithCapabilities } from "../../../src/native/testing/index.js";
import {
  createMediaQueryAccessibility,
  createReactNativeAccessibility,
  scaleFontSize,
  scaleTextStyle,
  useAccessibilityPreferences,
  useBoldText,
  useDynamicTypeStyle,
  useFontScale,
  useGrayscale,
  useInvertColors,
  useReduceTransparency,
  useReducedMotion,
  useScreenReaderEnabled,
} from "../../../src/native/accessibility/index.js";
import type { AccessibilityPreferences, RNAccessibilityHost } from "../../../src/native/accessibility/index.js";

const BOOLEAN_HOOKS = [
  ["useReducedMotion", "reduceMotion", useReducedMotion],
  ["useReduceTransparency", "reduceTransparency", useReduceTransparency],
  ["useScreenReaderEnabled", "screenReader", useScreenReaderEnabled],
  ["useBoldText", "boldText", useBoldText],
  ["useGrayscale", "grayscale", useGrayscale],
  ["useInvertColors", "invertColors", useInvertColors],
] as const;

function counting() {
  let subs = 0;
  let unsubs = 0;
  const mocks = createMockAdapters();
  const inner = mocks.adapters.accessibility.api;
  mocks.adapters.accessibility.api = {
    getPreferences: () => inner.getPreferences(),
    subscribe: (l) => {
      subs++;
      const off = inner.subscribe(l);
      return () => {
        unsubs++;
        off();
      };
    },
  };
  return { mocks, subs: () => subs, unsubs: () => unsubs };
}

describe("PLRNUI-167 accessibility preference hooks (mock capability)", () => {
  for (const [name, key, hook] of BOOLEAN_HOOKS) {
    it(`${name} reads and follows the mocked ${key}`, () => {
      const mocks = createMockAdapters();
      const seen: boolean[] = [];
      function Probe() {
        const value = hook();
        seen.push(value);
        return null;
      }
      renderWithCapabilities(<Probe />, mocks);
      assert.equal(seen.at(-1), false);
      act(() => mocks.setAccessibility({ [key]: true }));
      assert.equal(seen.at(-1), true);
      act(() => mocks.setAccessibility({ [key]: false }));
      assert.equal(seen.at(-1), false);
    });

    it(`${name} subscribes once on mount and unsubscribes on unmount`, () => {
      const counted = counting();
      function Probe() {
        hook();
        return null;
      }
      const r = renderWithCapabilities(<Probe />, counted.mocks);
      assert.equal(counted.subs(), 1);
      assert.equal(counted.unsubs(), 0);
      act(() => r.unmount());
      assert.equal(counted.unsubs(), 1);
    });

    it(`${name} does not re-render when a different preference changes`, () => {
      const mocks = createMockAdapters();
      let renders = 0;
      function Probe() {
        hook();
        renders += 1;
        return null;
      }
      renderWithCapabilities(<Probe />, mocks);
      const before = renders;
      act(() => mocks.setAccessibility({ fontScale: 1.5 }));
      assert.equal(renders, before);
    });
  }

  it("useReducedMotion is true when the mocked reduce-motion setting is enabled", () => {
    const mocks = createMockAdapters();
    mocks.setAccessibility({ reduceMotion: true });
    let value: boolean | undefined;
    function Probe() {
      value = useReducedMotion();
      return null;
    }
    renderWithCapabilities(<Probe />, mocks);
    assert.equal(value, true);
  });

  it("useFontScale follows the mocked scale and the aggregate returns every field", () => {
    const mocks = createMockAdapters();
    let scale = 0;
    let all: AccessibilityPreferences | undefined;
    function Probe() {
      scale = useFontScale();
      all = useAccessibilityPreferences();
      return null;
    }
    renderWithCapabilities(<Probe />, mocks);
    assert.equal(scale, 1);
    assert.deepEqual(all, {
      reduceMotion: false,
      reduceTransparency: false,
      screenReader: false,
      boldText: false,
      grayscale: false,
      invertColors: false,
      fontScale: 1,
    });
    act(() => mocks.setAccessibility({ fontScale: 2, screenReader: true }));
    assert.equal(scale, 2);
    assert.equal(all?.screenReader, true);
    assert.equal(all?.fontScale, 2);
  });

  it("the aggregate keeps its identity while nothing changes", () => {
    const mocks = createMockAdapters();
    const seen: AccessibilityPreferences[] = [];
    function Probe() {
      seen.push(useAccessibilityPreferences());
      return null;
    }
    const r = renderWithCapabilities(<Probe />, mocks);
    act(() => r.update(<CapabilityProvider adapters={mocks.adapters}><Probe /></CapabilityProvider>));
    assert.equal(seen.at(-1), seen[0]);
  });

  it("a denied permission degrades to default preferences without throwing", () => {
    const mocks = createMockAdapters();
    mocks.setPermission("accessibility", "denied");
    const seen: Array<[boolean, number]> = [];
    function Probe() {
      seen.push([useReducedMotion(), useFontScale()]);
      return null;
    }
    renderWithCapabilities(<Probe />, mocks);
    assert.deepEqual(seen.at(-1), [false, 1]);
  });

  it("an adapter whose api throws degrades to default preferences", () => {
    const mocks = createMockAdapters({
      accessibility: {
        getPreferences: () => {
          throw new Error("boom");
        },
        subscribe: () => {
          throw new Error("boom");
        },
      },
    });
    let value: [boolean, number] | undefined;
    function Probe() {
      value = [useScreenReaderEnabled(), useFontScale()];
      return null;
    }
    renderWithCapabilities(<Probe />, mocks);
    assert.deepEqual(value, [false, 1]);
  });

  it("without a provider (noop capability) every hook defaults to false and scale 1 without throwing", () => {
    const g = globalThis as { matchMedia?: unknown };
    const saved = g.matchMedia;
    delete g.matchMedia;
    try {
      let all: AccessibilityPreferences | undefined;
      function Probe() {
        all = useAccessibilityPreferences();
        return null;
      }
      renderWithCapabilities(<Probe />);
      assert.deepEqual(all, {
        reduceMotion: false,
        reduceTransparency: false,
        screenReader: false,
        boldText: false,
        grayscale: false,
        invertColors: false,
        fontScale: 1,
      });
    } finally {
      if (saved !== undefined) g.matchMedia = saved;
    }
  });

  it("the web fallback calls matchMedia on globalThis (a browser throws Illegal invocation for any other this)", () => {
    const g = globalThis as { matchMedia?: unknown };
    const saved = g.matchMedia;
    const calls: string[] = [];
    g.matchMedia = function (this: unknown, query: string) {
      if (this !== globalThis) throw new TypeError("Illegal invocation");
      calls.push(query);
      return { matches: query.includes("motion"), addEventListener: () => undefined, removeEventListener: () => undefined };
    };
    try {
      let value: [boolean, boolean] | undefined;
      function Probe() {
        value = [useReducedMotion(), useReduceTransparency()];
        return null;
      }
      renderWithCapabilities(<Probe />);
      assert.deepEqual(value, [true, false]);
      assert.ok(calls.length >= 2);
    } finally {
      if (saved === undefined) delete g.matchMedia;
      else g.matchMedia = saved;
    }
  });

  it("without a provider the web fallback follows matchMedia", () => {
    const g = globalThis as { matchMedia?: unknown };
    const saved = g.matchMedia;
    const state = { motion: false };
    const listeners = new Set<() => void>();
    g.matchMedia = (query: string) => ({
      get matches() {
        return query.includes("motion") ? state.motion : false;
      },
      addEventListener: (_t: "change", l: () => void) => void listeners.add(l),
      removeEventListener: (_t: "change", l: () => void) => void listeners.delete(l),
    });
    try {
      let value: boolean | undefined;
      function Probe() {
        value = useReducedMotion();
        return null;
      }
      const r = renderWithCapabilities(<Probe />);
      assert.equal(value, false);
      state.motion = true;
      act(() => listeners.forEach((l) => l()));
      assert.equal(value, true);
      act(() => r.unmount());
      assert.equal(listeners.size, 0);
    } finally {
      if (saved === undefined) delete g.matchMedia;
      else g.matchMedia = saved;
    }
  });
});

describe("PLRNUI-167 useDynamicTypeStyle and font scaling", () => {
  const table: Array<[string, number, number, number | undefined, number]> = [
    ["no scaling", 16, 1, undefined, 16],
    ["scales up", 16, 1.5, undefined, 24],
    ["below the cap", 16, 1.5, 30, 24],
    ["exactly at the cap", 16, 2, 32, 32],
    ["clamped to the cap", 16, 3, 32, 32],
    ["scales down", 20, 0.5, undefined, 10],
    ["cap below the base size wins", 20, 1, 12, 12],
    ["scale zero counts as 1", 16, 0, undefined, 16],
    ["negative scale counts as 1", 16, -2, undefined, 16],
    ["NaN scale counts as 1", 16, Number.NaN, undefined, 16],
    ["Infinity scale counts as 1", 16, Number.POSITIVE_INFINITY, undefined, 16],
    ["NaN cap is ignored", 16, 2, Number.NaN, 32],
  ];
  for (const [name, fontSize, scale, max, expected] of table) {
    it(`scaleFontSize: ${name}`, () => {
      assert.equal(scaleFontSize(fontSize, scale, max), expected);
    });
  }

  it("scaleTextStyle keeps other fields and scales lineHeight proportionally, also when clamped", () => {
    const base = { fontSize: 16, lineHeight: 24, fontWeight: "600" as const };
    assert.deepEqual(scaleTextStyle(base, 1.5), { fontSize: 24, lineHeight: 36, fontWeight: "600" });
    assert.deepEqual(scaleTextStyle(base, 3, 32), { fontSize: 32, lineHeight: 48, fontWeight: "600" });
    assert.deepEqual(scaleTextStyle({ fontSize: 14 }, 2), { fontSize: 28 });
    assert.deepEqual(scaleTextStyle({ fontSize: 0, lineHeight: 10 }, 2), { fontSize: 0, lineHeight: 10 });
    assert.deepEqual(base, { fontSize: 16, lineHeight: 24, fontWeight: "600" }, "the base style is not mutated");
  });

  it("the hook scales with the mocked font scale, honours max and keeps a stable object between renders", () => {
    const mocks = createMockAdapters();
    const seen: Array<{ fontSize: number; lineHeight?: number }> = [];
    function Probe({ max }: { max?: number }) {
      seen.push(useDynamicTypeStyle({ fontSize: 16, lineHeight: 20 }, { max }));
      return null;
    }
    const r = renderWithCapabilities(<Probe />, mocks);
    assert.deepEqual(seen.at(-1), { fontSize: 16, lineHeight: 20 });
    act(() => mocks.setAccessibility({ fontScale: 1.5 }));
    assert.deepEqual(seen.at(-1), { fontSize: 24, lineHeight: 30 });
    const stable = seen.at(-1);
    act(() => r.update(<CapabilityProvider adapters={mocks.adapters}><Probe /></CapabilityProvider>));
    assert.equal(seen.at(-1), stable, "same inputs keep the same style object");
    act(() => mocks.setAccessibility({ fontScale: 3 }));
    assert.deepEqual(seen.at(-1), { fontSize: 48, lineHeight: 60 });
    act(() => r.update(<CapabilityProvider adapters={mocks.adapters}><Probe max={30} /></CapabilityProvider>));
    assert.deepEqual(seen.at(-1), { fontSize: 30, lineHeight: 37.5 });
  });
});

type Handler = (enabled: boolean) => void;

function fakeNativeHost(options: { fontScale?: number; reads?: Partial<Record<string, () => Promise<boolean>>> } = {}) {
  const handlers = new Map<string, Set<Handler>>();
  const removed: string[] = [];
  const dimensionHandlers = new Set<() => void>();
  const readers: Record<string, () => Promise<boolean>> = {};
  const resolvers: Record<string, (v: boolean) => void> = {};
  for (const name of ["isReduceMotionEnabled", "isReduceTransparencyEnabled", "isScreenReaderEnabled", "isBoldTextEnabled", "isGrayscaleEnabled", "isInvertColorsEnabled"]) {
    readers[name] = options.reads?.[name] ?? (() => new Promise<boolean>((resolve) => void (resolvers[name] = resolve)));
  }
  let fontScale = options.fontScale ?? 1;
  const host: RNAccessibilityHost = {
    AccessibilityInfo: {
      ...readers,
      addEventListener(name, handler) {
        if (!handlers.has(name)) handlers.set(name, new Set());
        handlers.get(name)!.add(handler);
        return {
          remove() {
            removed.push(name);
            handlers.get(name)!.delete(handler);
          },
        };
      },
    },
    PixelRatio: { getFontScale: () => fontScale },
    Dimensions: {
      addEventListener(_type, handler) {
        dimensionHandlers.add(handler);
        return { remove: () => void dimensionHandlers.delete(handler) };
      },
    },
  };
  const live = () => [...handlers.values()].reduce((n, set) => n + set.size, 0) + dimensionHandlers.size;
  return {
    host,
    resolvers,
    removed,
    live,
    emit: (name: string, value: boolean) => handlers.get(name)?.forEach((h) => h(value)),
    setFontScale(next: number) {
      fontScale = next;
      dimensionHandlers.forEach((h) => h());
    },
  };
}

const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

describe("PLRNUI-167 React Native source (mock emitter)", () => {
  it("subscribes to every AccessibilityInfo event on the first subscriber and removes them all on the last", () => {
    const fake = fakeNativeHost();
    const api = createReactNativeAccessibility(fake.host);
    assert.equal(fake.live(), 0, "nothing is subscribed before the first subscriber");
    const offA = api.subscribe(() => undefined);
    const offB = api.subscribe(() => undefined);
    assert.equal(fake.live(), 7, "six AccessibilityInfo events and one Dimensions change, once");
    offA();
    assert.equal(fake.live(), 7);
    offB();
    offB();
    assert.equal(fake.live(), 0);
    assert.deepEqual([...fake.removed].sort(), ["boldTextChanged", "grayscaleChanged", "invertColorsChanged", "reduceMotionChanged", "reduceTransparencyChanged", "screenReaderChanged"]);
  });

  it("events update the snapshot, notify once per change and keep identity otherwise", () => {
    const fake = fakeNativeHost();
    const api = createReactNativeAccessibility(fake.host);
    const seen: AccessibilityPreferences[] = [];
    const off = api.subscribe((p) => seen.push(p));
    const initial = api.getPreferences();
    assert.equal(api.getPreferences(), initial);
    fake.emit("reduceMotionChanged", true);
    assert.equal(seen.length, 1);
    assert.equal(seen[0]!.reduceMotion, true);
    fake.emit("reduceMotionChanged", true);
    assert.equal(seen.length, 1, "no change, no notification");
    fake.emit("screenReaderChanged", true);
    fake.emit("boldTextChanged", true);
    fake.emit("grayscaleChanged", true);
    fake.emit("invertColorsChanged", true);
    fake.emit("reduceTransparencyChanged", true);
    assert.deepEqual(api.getPreferences(), {
      reduceMotion: true,
      reduceTransparency: true,
      screenReader: true,
      boldText: true,
      grayscale: true,
      invertColors: true,
      fontScale: 1,
    });
    off();
  });

  it("initial asynchronous reads fill the snapshot; a late read after the last unsubscribe is ignored", async () => {
    const fake = fakeNativeHost();
    const api = createReactNativeAccessibility(fake.host);
    const seen: AccessibilityPreferences[] = [];
    const off = api.subscribe((p) => seen.push(p));
    fake.resolvers.isReduceMotionEnabled!(true);
    await flush();
    assert.equal(api.getPreferences().reduceMotion, true);
    off();
    assert.equal(api.getPreferences().reduceMotion, false, "forgotten on the last unsubscribe");
    const before = seen.length;
    fake.resolvers.isScreenReaderEnabled!(true);
    await flush();
    assert.equal(seen.length, before);
    assert.equal(api.getPreferences().screenReader, false);
  });

  it("a restart re-reads and a stale read from the previous run cannot leak into it", async () => {
    const fake = fakeNativeHost();
    const api = createReactNativeAccessibility(fake.host);
    const firstRun = fake.resolvers;
    const off = api.subscribe(() => undefined);
    const staleMotion = firstRun.isReduceMotionEnabled!;
    off();
    const off2 = api.subscribe(() => undefined);
    staleMotion(true);
    await flush();
    assert.equal(api.getPreferences().reduceMotion, false);
    fake.resolvers.isReduceMotionEnabled!(true);
    await flush();
    assert.equal(api.getPreferences().reduceMotion, true);
    off2();
  });

  it("an event that arrives before the initial read resolves is not overwritten by the older read", async () => {
    const fake = fakeNativeHost();
    const api = createReactNativeAccessibility(fake.host);
    const off = api.subscribe(() => undefined);
    fake.emit("reduceMotionChanged", true);
    fake.resolvers.isReduceMotionEnabled!(false); // the read started before the event and resolves after it
    await flush();
    assert.equal(api.getPreferences().reduceMotion, true);
    off();
  });

  it("a rejected read, a throwing read and missing methods leave the preference false without throwing", async () => {
    const fake = fakeNativeHost({
      reads: {
        isReduceMotionEnabled: () => Promise.reject(new Error("no")),
        isScreenReaderEnabled: () => {
          throw new Error("sync throw");
        },
      },
    });
    const api = createReactNativeAccessibility(fake.host);
    assert.throws(() => api.subscribe(() => undefined), /sync throw/);
    assert.equal(fake.live(), 0, "a failed start cleans up every listener it added");
    const bare = createReactNativeAccessibility({});
    const off = bare.subscribe(() => undefined);
    assert.equal(bare.getPreferences().reduceMotion, false);
    assert.equal(bare.getPreferences().fontScale, 1);
    off();
    const rejected = createReactNativeAccessibility(fakeNativeHost({ reads: { isReduceMotionEnabled: () => Promise.reject(new Error("no")) } }).host);
    const off3 = rejected.subscribe(() => undefined);
    await flush();
    assert.equal(rejected.getPreferences().reduceMotion, false);
    off3();
  });

  it("the font scale is read live, notified on a Dimensions change and an invalid value counts as 1", () => {
    const fake = fakeNativeHost({ fontScale: 1.3 });
    const api = createReactNativeAccessibility(fake.host);
    assert.equal(api.getPreferences().fontScale, 1.3);
    const seen: number[] = [];
    const off = api.subscribe((p) => seen.push(p.fontScale));
    fake.setFontScale(2);
    assert.deepEqual(seen, [2]);
    assert.equal(api.getPreferences().fontScale, 2);
    fake.setFontScale(Number.NaN);
    assert.equal(api.getPreferences().fontScale, 1);
    off();
    assert.equal(createReactNativeAccessibility({ PixelRatio: { getFontScale: () => { throw new Error("x"); } } }).getPreferences().fontScale, 1);
  });

  it("every listener is called even when one throws, then the first error is rethrown", () => {
    const fake = fakeNativeHost();
    const api = createReactNativeAccessibility(fake.host);
    const seen: boolean[] = [];
    api.subscribe(() => {
      throw new Error("listener failed");
    });
    api.subscribe((p) => seen.push(p.reduceMotion));
    assert.throws(() => fake.emit("reduceMotionChanged", true), /listener failed/);
    assert.deepEqual(seen, [true]);
  });
});

describe("PLRNUI-167 web source (mock matchMedia)", () => {
  function fakeMatchMedia(modern = true) {
    const state: Record<string, boolean> = { motion: false, transparency: false };
    const listeners: Array<() => void> = [];
    const host = {
      matchMedia: (query: string) => {
        const key = query.includes("motion") ? "motion" : "transparency";
        return modern
          ? {
              get matches() {
                return state[key]!;
              },
              addEventListener: (_t: "change", l: () => void) => void listeners.push(l),
              removeEventListener: (_t: "change", l: () => void) => void listeners.splice(listeners.indexOf(l), 1),
            }
          : {
              get matches() {
                return state[key]!;
              },
              addListener: (l: () => void) => void listeners.push(l),
              removeListener: (l: () => void) => void listeners.splice(listeners.indexOf(l), 1),
            };
      },
    };
    return { host, state, listeners };
  }

  for (const modern of [true, false]) {
    it(`maps prefers-reduced-motion and prefers-reduced-transparency (${modern ? "addEventListener" : "legacy addListener"})`, () => {
      const fake = fakeMatchMedia(modern);
      const api = createMediaQueryAccessibility(fake.host);
      const seen: AccessibilityPreferences[] = [];
      const off = api.subscribe((p) => seen.push(p));
      assert.equal(fake.listeners.length, 2);
      assert.deepEqual(api.getPreferences(), { reduceMotion: false, reduceTransparency: false, screenReader: false, boldText: false, grayscale: false, invertColors: false, fontScale: 1 });
      const before = api.getPreferences();
      assert.equal(api.getPreferences(), before, "identity is stable while nothing changes");
      fake.state.motion = true;
      [...fake.listeners].forEach((l) => l());
      assert.equal(api.getPreferences().reduceMotion, true);
      assert.equal(api.getPreferences().reduceTransparency, false);
      assert.equal(seen.at(-1)?.reduceMotion, true);
      off();
      assert.equal(fake.listeners.length, 0);
    });
  }

  it("a matchMedia that throws for a query reads as false", () => {
    const api = createMediaQueryAccessibility({
      matchMedia: () => {
        throw new Error("unsupported query");
      },
    });
    assert.equal(api.getPreferences().reduceMotion, false);
    const off = api.subscribe(() => undefined);
    off();
  });
});

describe("PLRNUI-167 source scan", () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? walk(path) : [path];
    });

  it("useReducedMotion and useFontScale each have exactly one implementation, under src/native/accessibility", () => {
    const sources = walk("src").filter((f) => /\.(ts|tsx)$/.test(f));
    for (const name of ["useReducedMotion", "useFontScale"]) {
      const hits = sources.filter((f) => new RegExp(`export function ${name}\\b`).test(readFileSync(f, "utf8")));
      assert.deepEqual(hits.map((f) => f.replaceAll("\\", "/")), ["src/native/accessibility/hooks.ts"], name);
    }
  });

  it("the accessibility module imports no expo-* package and no native module outside react-native core", () => {
    const files = walk("src/native/accessibility").filter((f) => /\.(ts|tsx)$/.test(f));
    assert.ok(files.length >= 3);
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      for (const m of text.matchAll(/from\s+["']([^"']+)["']/g)) {
        const spec = m[1]!;
        assert.ok(spec.startsWith(".") || spec === "react" || spec === "react-native", `${file} imports ${spec}`);
        assert.ok(!/^expo/.test(spec));
      }
    }
  });
});

