// Render helper on @testing-library/react-native (RNTL) for the node:test suite (PLRNUI-106, ADR 0018).
//
// RNTL is a CommonJS package that calls `require("react-native")`. The test loader (tests/react-native-loader.mjs) only
// rewrites the ES-module specifier, so a plain `require` inside RNTL would load the real react-native, which is Flow
// source that node cannot parse. This helper therefore routes the CommonJS request for "react-native" to the same test
// shim the rest of the suite uses (tests/shims/react-native.tsx, imported below through the loader), before RNTL is
// loaded. The shim itself is not changed. Consequences are listed in ADR 0018: queries and events work on the shim's
// host components, and `getByRole` only sees host elements RNTL treats as accessible (the shim's `Pressable` has no
// default `accessible`, unlike React Native's), so use `getByLabelText` for those.
import Module from "node:module";
import { afterEach } from "node:test";
import React from "react";
import * as shim from "react-native";
import { ThemeProvider } from "../../src";
import type { ThemeMode } from "../../src";

type CommonJsLoader = (request: string, ...rest: unknown[]) => unknown;
const host = Module as unknown as { _load: CommonJsLoader };
const originalLoad = host._load;
host._load = function patchedLoad(this: unknown, request: string, ...rest: unknown[]) {
  return request === "react-native" ? shim : originalLoad.call(this, request, ...rest);
};

// The `pure` entry: the default entry registers Jest matchers on a global `expect` and an `afterEach` cleanup.
const rntl = await import("@testing-library/react-native/pure");

// Without Jest there is no automatic cleanup: unmount every rendered tree after each test.
afterEach(() => {
  rntl.cleanup();
});

export const { fireEvent, act, within, waitFor, cleanup, screen } = rntl;
export type RenderResult = ReturnType<typeof rntl.render>;

export interface RenderWithThemeOptions {
  /** Theme mode of the provider. Default `light`. */
  mode?: ThemeMode;
}

/**
 * Renders `ui` inside a `ThemeProvider` (no persistence) and returns the RNTL queries. Use the returned queries rather
 * than the `screen` export: under node:test `screen` is a named export bound before the first render.
 */
export function renderWithTheme(ui: React.ReactElement, { mode = "light" }: RenderWithThemeOptions = {}): RenderResult {
  return rntl.render(
    <ThemeProvider initialMode={mode} persistTheme={false}>
      {ui}
    </ThemeProvider>,
  );
}
