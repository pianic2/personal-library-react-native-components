import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";
import { TexoProvider } from "../../src/providers/index.js";
import { createSingletonContext } from "../../src/providers/createSingletonContext.js";
import { ThemeProvider } from "../../src/theme/ThemeProvider.js";
import { ThemeContext } from "../../src/theme/ThemeScope.js";
import { LocaleProvider, useLocale } from "../../src/i18n/index.js";
import { MotionProvider } from "../../src/motion/MotionProvider.js";
import { useMotionPreference } from "../../src/motion/useMotionPreference.js";
import { ResponsiveProvider } from "../../src/responsive/ResponsiveProvider.js";
import { ResponsiveContext } from "../../src/responsive/context.js";
import { CapabilityProvider, useCapability } from "../../src/native/core/index.js";
import { IconProvider, useIconSets, createIconSet } from "../../src/components/Icon/Icon.js";
import { NavProvider, useNav } from "../../src/components/NavContext/NavContext.js";
import { OverlayHost } from "../../src/components/Portal/OverlayHost.js";
import { OverlayHostContext } from "../../src/components/Portal/context.js";

const noop = () => undefined;

describe("TexoProvider", () => {
  it("provides every context to a probe inside the root OverlayHost", () => {
    let seen: Record<string, unknown> = {};
    function Probe() {
      seen = {
        host: React.useContext(OverlayHostContext),
        theme: React.useContext(ThemeContext),
        locale: useLocale(),
        reduceMotion: useMotionPreference(),
        responsive: React.useContext(ResponsiveContext),
        haptics: useCapability("haptics"),
        icons: useIconSets(),
        nav: useNav(),
      };
      return null;
    }
    const icons = { default: createIconSet({}) };
    act(() => {
      TestRenderer.create(
        <TexoProvider
          preference="dark"
          locale={{ locale: "it-IT" }}
          motion={{ reduceMotion: "always" }}
          icons={icons}
          nav={{ items: [{ label: "Home", href: "/" }], pathname: "/", navigate: noop }}
        >
          <Probe />
        </TexoProvider>,
      );
    });
    assert.ok(seen.host, "inside the OverlayHost");
    assert.equal((seen.theme as { mode: string }).mode, "dark");
    assert.equal(seen.locale, "it-IT");
    assert.equal(seen.reduceMotion, true);
    assert.ok((seen.responsive as { breakpoints: unknown }).breakpoints);
    assert.ok((seen.haptics as { status: string }).status);
    assert.equal((seen.icons as Record<string, unknown>).default, icons.default);
    assert.equal((seen.nav as { pathname: string }).pathname, "/");
  });

  it("renders exactly one root OverlayHost", () => {
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <TexoProvider>
          <></>
        </TexoProvider>,
      );
    });
    assert.equal(tree.root.findAllByType(OverlayHost).length, 1);
  });

  it("keeps every composed provider importable on its own", () => {
    for (const provider of [ThemeProvider, LocaleProvider, MotionProvider, ResponsiveProvider, CapabilityProvider, IconProvider, NavProvider, OverlayHost]) {
      assert.equal(typeof provider, "function");
    }
  });
});

describe("createSingletonContext", () => {
  it("warns once in development when a context is registered a second time, and reuses the first", () => {
    const warnings: unknown[][] = [];
    const original = console.warn;
    const wasDev = (globalThis as { __DEV__?: boolean }).__DEV__;
    console.warn = (...args: unknown[]) => void warnings.push(args);
    (globalThis as { __DEV__?: boolean }).__DEV__ = true;
    try {
      const second = createSingletonContext("theme", null);
      assert.equal(second, ThemeContext);
      assert.equal(warnings.length, 1);
      assert.match(String(warnings[0]![0]), /"theme"/);
      assert.equal(Symbol.for("texo.theme") in globalThis, true);
    } finally {
      console.warn = original;
      (globalThis as { __DEV__?: boolean }).__DEV__ = wasDev;
    }
  });

  it("does not warn outside development", () => {
    const warnings: unknown[][] = [];
    const original = console.warn;
    console.warn = (...args: unknown[]) => void warnings.push(args);
    try {
      createSingletonContext("theme", null);
    } finally {
      console.warn = original;
    }
    assert.equal(warnings.length, 0);
  });
});
