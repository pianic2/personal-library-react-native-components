import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { ThemeProvider, useTheme } from "../../src";
import { defineTheme } from "../../src/theme/defineTheme.js";
import { ThemeScope } from "../../src/theme/ThemeScope.js";
import type { ThemeMode } from "../../src/theme/types.js";

type Snapshot = ReturnType<typeof useTheme>;

function Probe({ into }: { into: { current?: Snapshot } }) {
  into.current = useTheme();
  return null;
}

function mount(props: Partial<React.ComponentProps<typeof ThemeProvider>>, systemScheme?: ThemeMode | null) {
  const into: { current?: Snapshot } = {};
  const tree = (scheme: ThemeMode | null | undefined) => (
    <ThemeProvider persistTheme={false} {...props} {...(scheme === undefined ? {} : { systemScheme: scheme })}>
      <Probe into={into} />
    </ThemeProvider>
  );
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(tree(systemScheme));
  });
  return { into, update: (scheme: ThemeMode | null) => act(() => renderer.update(tree(scheme))) };
}

describe("PLRNUI-193 system colour scheme", () => {
  it("preference system follows the colour scheme and updates when it changes", () => {
    const m = mount({ preference: "system" }, "dark");
    assert.equal(m.into.current?.preference, "system");
    assert.equal(m.into.current?.mode, "dark");
    assert.equal(m.into.current?.theme.mode, "dark");
    m.update("light");
    assert.equal(m.into.current?.mode, "light");
    assert.equal(m.into.current?.theme.mode, "light");
    m.update("dark");
    assert.equal(m.into.current?.mode, "dark");
  });

  it("an unknown system scheme (null, or none from the platform) resolves to light", () => {
    assert.equal(mount({ preference: "system" }, null).into.current?.mode, "light");
    // the test shim has no useColorScheme: the provider must still render and fall back to light
    assert.equal(mount({ preference: "system" }).into.current?.mode, "light");
  });

  it("an explicit preference ignores the system scheme", () => {
    assert.equal(mount({ preference: "light" }, "dark").into.current?.mode, "light");
    assert.equal(mount({ preference: "dark" }, "light").into.current?.mode, "dark");
  });

  it("preference wins over initialMode, and initialMode still works alone", () => {
    assert.equal(mount({ initialMode: "dark", preference: "light" }).into.current?.mode, "light");
    assert.equal(mount({ initialMode: "dark" }).into.current?.mode, "dark");
    assert.equal(mount({}).into.current?.mode, "light");
  });

  it("toggleTheme flips the resolved mode and pins it; setPreference('system') returns to following", () => {
    const m = mount({ preference: "system" }, "dark");
    act(() => m.into.current!.toggleTheme());
    assert.equal(m.into.current?.preference, "light");
    assert.equal(m.into.current?.mode, "light");
    m.update("light");
    act(() => m.into.current!.setPreference("system"));
    assert.equal(m.into.current?.preference, "system");
    m.update("dark");
    assert.equal(m.into.current?.mode, "dark");
  });

  it("setMode keeps working as before", () => {
    const m = mount({ initialMode: "light" });
    act(() => m.into.current!.setMode("dark"));
    assert.equal(m.into.current?.mode, "dark");
    assert.equal(m.into.current?.preference, "dark");
  });

  it("ready is true without persistence", () => {
    assert.equal(mount({}).into.current?.ready, true);
  });

  it("builds each mode from its side of a preset", () => {
    const preset = defineTheme({ light: { colors: { background: "#fafafa" } }, dark: { colors: { background: "#050505" } } });
    assert.equal(mount({ preset, preference: "light" }).into.current?.theme.colors.background, "#fafafa");
    assert.equal(mount({ preset, preference: "dark" }).into.current?.theme.colors.background, "#050505");
  });

  it("density sets theme.density.default and an unknown level is ignored", () => {
    assert.equal(mount({ density: "compact" }).into.current?.theme.density.default, "compact");
    assert.equal(mount({}).into.current?.theme.density.default, "regular");
    assert.equal(mount({ density: "huge" as never }).into.current?.theme.density.default, "regular");
  });
});

describe("PLRNUI-193 ThemeScope", () => {
  function scoped(scope: React.ComponentProps<typeof ThemeScope>, providerProps: Partial<React.ComponentProps<typeof ThemeProvider>> = {}) {
    const outside: { current?: Snapshot } = {};
    const inside: { current?: Snapshot } = {};
    const nested: { current?: Snapshot } = {};
    act(() => {
      TestRenderer.create(
        <ThemeProvider persistTheme={false} {...providerProps}>
          <Probe into={outside} />
          <ThemeScope {...scope}>
            <Probe into={inside} />
            <ThemeScope preference="light">
              <Probe into={nested} />
            </ThemeScope>
          </ThemeScope>
        </ThemeProvider>
      );
    });
    return { outside, inside, nested };
  }

  it("a mode override affects only the descendants", () => {
    const { outside, inside } = scoped({ preference: "dark" }, { preference: "light" });
    assert.equal(outside.current?.mode, "light");
    assert.equal(inside.current?.mode, "dark");
    assert.notEqual(inside.current?.theme.colors.background, outside.current?.theme.colors.background);
  });

  it("themeOverrides apply inside only and stack on the enclosing overrides", () => {
    const { outside, inside } = scoped(
      { themeOverrides: { colors: { background: "#123456" } } },
      { themeOverrides: { colors: { textPrimary: "#654321" } } }
    );
    assert.notEqual(outside.current?.theme.colors.background, "#123456");
    assert.equal(inside.current?.theme.colors.background, "#123456");
    assert.equal(inside.current?.theme.colors.textPrimary, "#654321");
    assert.equal(outside.current?.theme.colors.textPrimary, "#654321");
  });

  it("scope with a system preference follows the enclosing system scheme, and a nested scope can pin back", () => {
    const { inside, nested } = scoped({ preference: "system" }, { preference: "light", systemScheme: "dark" });
    assert.equal(inside.current?.mode, "dark");
    assert.equal(nested.current?.mode, "light");
  });

  it("a scope without props inherits the enclosing theme object", () => {
    const { outside, inside } = scoped({});
    assert.ok(inside.current?.theme === outside.current?.theme);
  });

  it("the preset of a scope is built for the resolved mode; density is inherited unless given", () => {
    const preset = defineTheme({ dark: { colors: { background: "#010203" } } });
    const { inside } = scoped({ preset, preference: "dark" }, { density: "comfortable" });
    assert.equal(inside.current?.theme.colors.background, "#010203");
    assert.equal(inside.current?.theme.density.default, "comfortable");
    assert.equal(scoped({ density: "compact" }, { density: "comfortable" }).inside.current?.theme.density.default, "compact");
  });

  it("controls inside a scope act on the enclosing provider", () => {
    const outside: { current?: Snapshot } = {};
    const inside: { current?: Snapshot } = {};
    act(() => {
      TestRenderer.create(
        <ThemeProvider persistTheme={false} preference="light">
          <Probe into={outside} />
          <ThemeScope preference="dark">
            <Probe into={inside} />
          </ThemeScope>
        </ThemeProvider>
      );
    });
    act(() => inside.current!.setPreference("dark"));
    assert.equal(outside.current?.mode, "dark");
  });

  it("throws outside a ThemeProvider", () => {
    const originalError = console.error;
    console.error = () => undefined;
    try {
      assert.throws(() => {
        act(() => {
          TestRenderer.create(
            <ThemeScope preference="dark">
              <Probe into={{}} />
            </ThemeScope>
          );
        });
      }, /ThemeScope must be used inside ThemeProvider/);
    } finally {
      console.error = originalError;
    }
  });
});

describe("PLRNUI-193 no direct storage dependency", () => {
  it("nothing under src imports async-storage", () => {
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) walk(path);
        else if (/\.(ts|tsx)$/.test(name) && /async-storage/.test(readFileSync(path, "utf8").replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, ""))) hits.push(path);
      }
    };
    walk(join(import.meta.dirname, "../../src"));
    assert.deepEqual(hits, []);
  });
});
