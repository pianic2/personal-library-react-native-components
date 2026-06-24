import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";

import { ThemeProvider, useTheme } from "../../src";
import { createBaseTheme } from "../../src/theme/defaultTheme";
import { darkColors, lightColors } from "../../src/tokens/colors.base";

type ThemeSnapshot = {
  mode: "light" | "dark";
  background: string;
  appBackground: string | undefined;
  toggleTheme: () => void;
  setMode: (mode: "light" | "dark") => void;
};

function ThemeProbe({
  onSnapshot,
}: {
  onSnapshot: (snapshot: ThemeSnapshot) => void;
}) {
  const { colors, mode, theme, toggleTheme, setMode } = useTheme();

  onSnapshot({
    mode,
    background: colors.background,
    appBackground: theme.globalStyles?.app?.backgroundColor,
    toggleTheme,
    setMode,
  });

  return null;
}

function NullThemeProbe({
  onSnapshot,
}: {
  onSnapshot: (snapshot: ThemeSnapshot) => void;
}) {
  return <ThemeProbe onSnapshot={onSnapshot} />;
}

describe("PLRNUI-27 base theme dark mode", () => {
  it("resolves light semantic colors for the light base theme", () => {
    const theme = createBaseTheme("light");

    assert.equal(theme.colors.background, lightColors.background);
  });

  it("resolves dark semantic colors for the dark base theme", () => {
    const theme = createBaseTheme("dark");

    assert.equal(theme.colors.background, darkColors.background);
  });

  it("derives app background from the selected dark semantic background", () => {
    const theme = createBaseTheme("dark");

    assert.equal(
      theme.globalStyles.app.backgroundColor,
      darkColors.background
    );
  });

  it("exposes dark colors to ThemeProvider consumers after toggleTheme", () => {
    let latestSnapshot: ThemeSnapshot | undefined;

    act(() => {
      TestRenderer.create(
        <ThemeProvider initialMode="light">
          <ThemeProbe
            onSnapshot={(snapshot) => {
              latestSnapshot = snapshot;
            }}
          />
        </ThemeProvider>
      );
    });

    assert.ok(latestSnapshot);
    assert.equal(latestSnapshot.mode, "light");
    assert.equal(latestSnapshot.background, lightColors.background);
    assert.equal(latestSnapshot.appBackground, lightColors.background);

    act(() => {
      latestSnapshot?.toggleTheme();
    });

    assert.ok(latestSnapshot);
    assert.equal(latestSnapshot.mode, "dark");
    assert.equal(latestSnapshot.background, darkColors.background);
    assert.equal(latestSnapshot.appBackground, darkColors.background);
  });

  it("renders only context and children without a layout wrapper", () => {
    let latestSnapshot: ThemeSnapshot | undefined;
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider initialMode="light">
          <NullThemeProbe
            onSnapshot={(snapshot) => {
              latestSnapshot = snapshot;
            }}
          />
        </ThemeProvider>
      );
    });

    assert.ok(renderer);
    assert.ok(latestSnapshot);
    assert.equal(latestSnapshot.mode, "light");
    assert.equal(renderer.root.findAllByType("ScrollView").length, 0);
    assert.equal(renderer.root.findAllByType("View").length, 0);

    act(() => {
      latestSnapshot?.setMode("dark");
    });

    assert.ok(latestSnapshot);
    assert.equal(latestSnapshot.mode, "dark");
    assert.equal(latestSnapshot.background, darkColors.background);
  });
});
