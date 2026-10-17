import React from "react";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import TestRenderer, { act } from "react-test-renderer";

import { ThemeProvider, useTheme } from "../../../src";
import {
  ThemedStatusBar,
  barStyleForMode,
  createExpoSystemUi,
  createNoopSystemUi,
  createWebSystemUi,
  resolveWebSystemUi,
  useSystemBars,
} from "../../../src/native/system-ui/index.js";
import type { StatusBarComponentProps, SystemBarsConfig, SystemUiAdapter, WebSystemUiDocument } from "../../../src/native/system-ui/index.js";
import { lightColors, darkColors } from "../../../src/tokens/colors.base.js";

function recorder() {
  const calls: StatusBarComponentProps[] = [];
  const Bar = (props: StatusBarComponentProps) => {
    calls.push(props);
    return null;
  };
  return { Bar, calls };
}

function mount(element: React.ReactElement, mode: "light" | "dark" = "light") {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(<ThemeProvider preference={mode}>{element}</ThemeProvider>);
  });
  return r;
}

function withDev<T>(run: (warnings: unknown[][]) => Promise<T> | T): Promise<T> {
  const g = globalThis as { __DEV__?: boolean };
  const dev = g.__DEV__;
  const warn = console.warn;
  const warnings: unknown[][] = [];
  g.__DEV__ = true;
  console.warn = (...args: unknown[]) => void warnings.push(args);
  return Promise.resolve()
    .then(() => run(warnings))
    .finally(() => {
      g.__DEV__ = dev;
      console.warn = warn;
    });
}

const flush = () => act(async () => void (await Promise.resolve()));

afterEach(() => {
  delete (globalThis as { document?: unknown }).document;
});

describe("PLRNUI-288 ThemedStatusBar", () => {
  it("maps dark mode to light-content and light mode to dark-content (render test)", () => {
    assert.equal(barStyleForMode("dark"), "light-content");
    assert.equal(barStyleForMode("light"), "dark-content");
    const dark = recorder();
    mount(<ThemedStatusBar StatusBarComponent={dark.Bar} />, "dark");
    assert.equal(dark.calls.at(-1)?.barStyle, "light-content");
    const light = recorder();
    mount(<ThemedStatusBar StatusBarComponent={light.Bar} />, "light");
    assert.equal(light.calls.at(-1)?.barStyle, "dark-content");
  });

  it("an explicit mode wins over the theme, and backgroundColor and animated are passed on", () => {
    const { Bar, calls } = recorder();
    mount(<ThemedStatusBar mode="dark" backgroundColor="#101010" animated={false} StatusBarComponent={Bar} />, "light");
    assert.deepEqual(calls.at(-1), { barStyle: "light-content", backgroundColor: "#101010", animated: false });
  });

  it("follows the theme when it changes", () => {
    const { Bar, calls } = recorder();
    const control: { setMode?: (mode: "light" | "dark") => void } = {};
    function Grab() {
      control.setMode = useTheme().setMode;
      return null;
    }
    mount(
      <>
        <Grab />
        <ThemedStatusBar StatusBarComponent={Bar} />
      </>,
    );
    act(() => control.setMode!("dark"));
    assert.deepEqual(calls.map((c) => c.barStyle).slice(-2), ["dark-content", "light-content"]);
  });

  it("renders nothing, without throwing, where the host has no StatusBar", () => {
    const r = mount(<ThemedStatusBar />);
    assert.equal(r.toJSON(), null);
  });
});

describe("PLRNUI-288 Expo adapter", () => {
  it("applies the background to expo-system-ui and the colour and button style to expo-navigation-bar", async () => {
    const log: string[] = [];
    const adapter = createExpoSystemUi({
      systemUi: { setBackgroundColorAsync: async (c) => void log.push(`sys:${c}`) },
      navigationBar: { setBackgroundColorAsync: async (c) => void log.push(`nav:${c}`), setButtonStyleAsync: async (s) => void log.push(`btn:${s}`) },
    });
    await adapter.apply({ mode: "dark", backgroundColor: "#111111" });
    await adapter.apply({ mode: "light", backgroundColor: "#FFFFFF" });
    assert.deepEqual(log, ["sys:#111111", "nav:#111111", "btn:light", "sys:#FFFFFF", "nav:#FFFFFF", "btn:dark"]);
  });

  it("works with only one module, with neither, and with a navigation bar that lacks a function", async () => {
    const log: string[] = [];
    await createExpoSystemUi({ systemUi: { setBackgroundColorAsync: async (c) => void log.push(c) } }).apply({ mode: "dark", backgroundColor: "#1" });
    await createExpoSystemUi({ navigationBar: { setButtonStyleAsync: async (s) => void log.push(s) } }).apply({ mode: "dark", backgroundColor: "#2" });
    await createExpoSystemUi({}).apply({ mode: "dark", backgroundColor: "#3" });
    await createExpoSystemUi({ systemUi: null, navigationBar: null }).apply({ mode: "dark", backgroundColor: "#4" });
    assert.deepEqual(log, ["#1", "light"]);
  });

  it("adapter errors do not throw: rejecting and synchronously throwing mocks, and the other steps still run", async () => {
    await withDev(async (warnings) => {
      const log: string[] = [];
      const adapter = createExpoSystemUi({
        systemUi: { setBackgroundColorAsync: () => Promise.reject(new Error("no root view")) },
        navigationBar: {
          setBackgroundColorAsync: () => {
            throw new Error("sync boom");
          },
          setButtonStyleAsync: async (s) => void log.push(s),
        },
      });
      await adapter.apply({ mode: "dark", backgroundColor: "#000000" });
      assert.deepEqual(log, ["light"], "the step after two failures still ran");
      assert.equal(warnings.length, 2);
      assert.match(String(warnings[0]![0]), /\[system-ui\] expo-system-ui setBackgroundColorAsync failed and was ignored/);
    });
  });

  it("is silent outside development", async () => {
    const warn = console.warn;
    const warnings: unknown[] = [];
    console.warn = (...args: unknown[]) => void warnings.push(args);
    try {
      await createExpoSystemUi({ systemUi: { setBackgroundColorAsync: () => Promise.reject(new Error("x")) } }).apply({ mode: "dark", backgroundColor: "#0" });
    } finally {
      console.warn = warn;
    }
    assert.deepEqual(warnings, []);
  });
});

function fakeDocument(existing: boolean) {
  const attrs: Record<string, string> = {};
  const appended: unknown[] = [];
  const meta = { setAttribute: (n: string, v: string) => void (attrs[n] = v) };
  const doc: WebSystemUiDocument = {
    querySelector: (selector) => (existing && selector === 'meta[name="theme-color"]' ? meta : null),
    createElement: () => ({ setAttribute: (n, v) => void (attrs[n] = v) }),
    head: { appendChild: (node) => void appended.push(node) },
  };
  return { doc, attrs, appended };
}

describe("PLRNUI-288 web path", () => {
  it("creates meta theme-color in the head through an injected document mock", async () => {
    const { doc, attrs, appended } = fakeDocument(false);
    await createWebSystemUi(doc).apply({ mode: "dark", backgroundColor: "#0B1220" });
    assert.deepEqual(attrs, { name: "theme-color", content: "#0B1220" });
    assert.equal(appended.length, 1);
  });

  it("updates an existing meta theme-color instead of adding another", async () => {
    const { doc, attrs, appended } = fakeDocument(true);
    await createWebSystemUi(doc).apply({ mode: "light", backgroundColor: "#FFFFFF" });
    assert.deepEqual(attrs, { content: "#FFFFFF" });
    assert.equal(appended.length, 0);
  });

  it("does not throw when the document is broken or has no head", async () => {
    await withDev(async (warnings) => {
      const broken: WebSystemUiDocument = {
        querySelector: () => {
          throw new Error("dom down");
        },
        createElement: () => ({ setAttribute: () => undefined }),
      };
      await createWebSystemUi(broken).apply({ mode: "dark", backgroundColor: "#000" });
      assert.equal(warnings.length, 1);
      await createWebSystemUi({ querySelector: () => null, createElement: () => ({ setAttribute: () => undefined }), head: null }).apply({ mode: "dark", backgroundColor: "#000" });
    });
  });

  it("resolveWebSystemUi returns an adapter only where a document exists", () => {
    assert.equal(resolveWebSystemUi(), undefined);
    (globalThis as { document?: unknown }).document = fakeDocument(false).doc;
    assert.ok(resolveWebSystemUi());
    (globalThis as { document?: unknown }).document = {};
    assert.equal(resolveWebSystemUi(), undefined);
  });
});

describe("PLRNUI-288 useSystemBars", () => {
  function Probe({ adapter, mode, backgroundColor }: { adapter?: SystemUiAdapter; mode?: "light" | "dark"; backgroundColor?: string }) {
    useSystemBars({ adapter, mode, backgroundColor });
    return null;
  }
  const recording = () => {
    const calls: SystemBarsConfig[] = [];
    const adapter: SystemUiAdapter = { apply: async (c) => void calls.push(c) };
    return { adapter, calls };
  };

  it("applies the theme mode and background by default, and again when the mode changes", async () => {
    const { adapter, calls } = recording();
    const control: { setMode?: (mode: "light" | "dark") => void } = {};
    function Grab() {
      control.setMode = useTheme().setMode;
      return null;
    }
    mount(
      <>
        <Grab />
        <Probe adapter={adapter} />
      </>,
    );
    await flush();
    act(() => control.setMode!("dark"));
    await flush();
    assert.deepEqual(calls, [
      { mode: "light", backgroundColor: lightColors.background },
      { mode: "dark", backgroundColor: darkColors.background },
    ]);
  });

  it("explicit mode and backgroundColor win; a re-render with the same inputs does not apply again", async () => {
    const { adapter, calls } = recording();
    const tree = (
      <ThemeProvider>
        <Probe adapter={adapter} mode="dark" backgroundColor="#123456" />
      </ThemeProvider>
    );
    let r!: TestRenderer.ReactTestRenderer;
    act(() => {
      r = TestRenderer.create(tree);
    });
    act(() => r.update(tree));
    await flush();
    assert.deepEqual(calls, [{ mode: "dark", backgroundColor: "#123456" }]);
  });

  it("an adapter that rejects or throws never breaks the render", async () => {
    await withDev(async (warnings) => {
      for (const adapter of [
        { apply: () => Promise.reject(new Error("reject")) },
        {
          apply: () => {
            throw new Error("throw");
          },
        },
      ] as SystemUiAdapter[]) {
        mount(<Probe adapter={adapter} />);
        await flush();
      }
      assert.equal(warnings.length, 2);
    });
  });

  it("with no adapter it uses the web adapter in a browser, and does nothing elsewhere", async () => {
    mount(<Probe />);
    await flush();
    const { doc, attrs } = fakeDocument(false);
    (globalThis as { document?: unknown }).document = doc;
    mount(<Probe mode="dark" backgroundColor="#0A0A0A" />);
    await flush();
    assert.deepEqual(attrs, { name: "theme-color", content: "#0A0A0A" });
  });

  it("the noop adapter resolves and does nothing", async () => {
    assert.equal(await createNoopSystemUi().apply({ mode: "dark", backgroundColor: "#000" }), undefined);
  });
});

describe("PLRNUI-288 boundaries", () => {
  const dir = join(import.meta.dirname, "../../../src/native/system-ui");
  const sources = readdirSync(dir).filter((f) => /\.tsx?$/.test(f)).map((f) => [f, readFileSync(join(dir, f), "utf8")] as const);

  it("imports no expo-* package, uses no require and no dynamic import", () => {
    for (const [file, text] of sources) {
      const code = text.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
      assert.equal(/from\s+["']expo/.test(code), false, `${file} imports an expo package`);
      assert.equal(/\brequire\s*\(/.test(code), false, `${file} uses require`);
      assert.equal(/\bimport\s*\(/.test(code), false, `${file} uses dynamic import`);
    }
  });

  it("is not reachable from the root entry, and the package adds no dependency", () => {
    const root = join(import.meta.dirname, "../../..");
    const walk = (d: string): string[] => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
    assert.equal(/system-ui/.test(readFileSync(join(root, "src/index.ts"), "utf8")), false);
    const outside = walk(join(root, "src")).filter((f) => !f.includes("/native/") && /\.tsx?$/.test(f)).filter((f) => /native\/system-ui/.test(readFileSync(f, "utf8")));
    assert.deepEqual(outside, []);
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    for (const section of ["dependencies", "peerDependencies"]) {
      const text = JSON.stringify(pkg[section] ?? {});
      assert.equal(text.includes("expo-system-ui") || text.includes("expo-navigation-bar"), false);
    }
  });
});
