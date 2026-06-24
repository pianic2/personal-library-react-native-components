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
};

function ThemeProbe({
  onSnapshot,
}: {
  onSnapshot: (snapshot: ThemeSnapshot) => void;
}) {
  const { colors, mode, theme, toggleTheme } = useTheme();

  onSnapshot({
    mode,
    background: colors.background,
    appBackground: theme.globalStyles?.app?.backgroundColor,
    toggleTheme,
  });

  return null;
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
        <ThemeProvider initialMode="light" withScroll={false}>
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
});
