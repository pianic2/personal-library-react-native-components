import React from "react";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import TestRenderer, { act } from "react-test-renderer";
import { Platform } from "react-native";
import { NavBar, NavProvider, ThemeProvider } from "../../src";
import { findActiveItem, isActive, isItemActive, useActiveItem, useIsActive, type NavAdapter, type NavProviderLegacyProps,type NavItem, useNav, useNavItems, useNavLogo, useNavPathname, useNavigate, useOptionalNav, type NavContextValue } from "../../src/components/NavContext/index.js";

const platform = Platform as { OS: string };
const originalOS = platform.OS;
const originalError = console.error;
afterEach(() => {
  platform.OS = originalOS;
  console.error = originalError;
});

const host = (name: string) => name as unknown as React.ElementType;
const root = resolve(import.meta.dirname, "../..");
const items = [
  { label: "Home", href: "/" },
  { label: "Library", href: "/library" },
];

function create(ui: React.ReactElement): TestRenderer.ReactTestRenderer {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(<ThemeProvider persistTheme={false}>{ui}</ThemeProvider>);
  });
  return renderer;
}

/** Renders `hook` under a NavProvider (or none) and returns what it produced. */
function probe<T>(hook: () => T, provider = true, props: Partial<NavProviderLegacyProps> = {}): T {
  let out!: T;
  function Probe() {
    out = hook();
    return null;
  }
  create(
    provider ? (
      <NavProvider items={items} pathname="/library" navigate={() => undefined} {...props}>
        <Probe />
      </NavProvider>
    ) : (
      <Probe />
    ),
  );
  return out;
}

describe("PLRNUI-222 NavContext hooks", () => {
  it("useNav returns the whole context value", () => {
    const navigate = () => undefined;
    const value = probe(() => useNav(), true, { navigate, logo: "logo" });
    assert.deepEqual(value.items, items);
    assert.equal(value.pathname, "/library");
    assert.equal(value.logo, "logo");
    assert.equal(value.navigate, navigate);
  });

  it("useNav throws outside NavProvider with an actionable message", () => {
    console.error = () => undefined; // React logs the error it rethrows
    assert.throws(() => probe(() => useNav(), false), /useNav must be used inside <NavProvider>/);
  });

  it("every other required hook throws outside NavProvider", () => {
    console.error = () => undefined;
    for (const hook of [useNavItems, useNavLogo, useNavPathname, useNavigate]) {
      assert.throws(() => probe(() => hook(), false), /<NavProvider>/, hook.name);
    }
  });

  it("useOptionalNav returns null outside NavProvider and the value inside", () => {
    assert.equal(probe(() => useOptionalNav(), false), null);
    assert.equal((probe(() => useOptionalNav()) as NavContextValue).pathname, "/library");
  });

  it("useNavItems, useNavLogo, useNavPathname and useNavigate read their slice", () => {
    const navigate = () => undefined;
    const seen = probe(() => ({ items: useNavItems(), logo: useNavLogo(), pathname: useNavPathname(), navigate: useNavigate() }), true, { logo: "L", navigate });
    assert.deepEqual(seen.items, items);
    assert.equal(seen.logo, "L");
    assert.equal(seen.pathname, "/library");
    assert.equal(seen.navigate, navigate);
  });

  it("useNavLogo is undefined without a logo", () => {
    assert.equal(probe(() => useNavLogo()), undefined);
  });

  it("the context value is stable across re-renders with the same props", () => {
    const navigate = () => undefined;
    const seen: NavContextValue[] = [];
    function Probe() {
      seen.push(useNav());
      return null;
    }
    // a fresh element tree each time, so the provider and the probe really re-render
    const ui = () => (
      <ThemeProvider persistTheme={false}>
        <NavProvider items={items} pathname="/" navigate={navigate}>
          <Probe />
        </NavProvider>
      </ThemeProvider>
    );
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(ui());
    });
    act(() => renderer.update(ui()));
    assert.ok(seen.length >= 2, "the probe rendered again");
    assert.ok(seen.every((v) => v === seen[0]));
  });

  it("a pathname change gives a new value", () => {
    const seen: string[] = [];
    function Probe() {
      seen.push(useNavPathname());
      return null;
    }
    const ui = (pathname: string) => (
      <ThemeProvider persistTheme={false}>
        <NavProvider items={items} pathname={pathname} navigate={() => undefined}>
          <Probe />
        </NavProvider>
      </ThemeProvider>
    );
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(ui("/"));
    });
    act(() => renderer.update(ui("/library")));
    assert.equal(seen.at(-1), "/library");
    assert.ok(seen.includes("/"));
  });
});

const navBar = (layout?: "auto" | "top" | "bottom" | "sidebar", pathname = "/library") => (
  <NavBar items={items} pathname={pathname} navigate={() => undefined} layout={layout} />
);
const hasRole = (r: TestRenderer.ReactTestRenderer, role: string) => r.root.findAll((n) => n.type === host("View") && n.props.accessibilityRole === role).length > 0;
const pressables = (r: TestRenderer.ReactTestRenderer) => r.root.findAllByType(host("Pressable"));

describe("PLRNUI-222 NavBar layout", () => {
  it("auto picks the top bar on web", () => {
    platform.OS = "web";
    const r = create(navBar("auto"));
    assert.ok(r.root.findAll((n) => n.type === host("View") && n.props.role === "navigation").length > 0);
    assert.equal(hasRole(r, "tablist"), false, "no BottomBar tablist on web");
  });

  it("auto picks the bottom bar on native", () => {
    for (const os of ["ios", "android"]) {
      platform.OS = os;
      assert.equal(hasRole(create(navBar()), "tablist"), true, os);
    }
  });

  it("explicit layouts override the platform", () => {
    platform.OS = "web";
    assert.equal(hasRole(create(navBar("bottom")), "tablist"), true);
    platform.OS = "ios";
    assert.equal(hasRole(create(navBar("top")), "tablist"), false);
    assert.ok(pressables(create(navBar("top"))).length > 0);
  });

  it("exposes accessibilityState.selected=true on the current item and false on the others", () => {
    for (const layout of ["top", "bottom"] as const) {
      const r = create(navBar(layout, "/library"));
      assert.deepEqual(
        pressables(r).map((p) => p.props.accessibilityState.selected),
        [false, true],
        layout,
      );
    }
  });

  it("selects nothing when no item matches the pathname", () => {
    const r = create(navBar("bottom", "/unknown"));
    assert.deepEqual(pressables(r).map((p) => p.props.accessibilityState.selected), [false, false]);
  });

  it("provides the navigation context to custom children below the bars' Links", () => {
    let called = "";
    const r = create(<NavBar items={items} pathname="/" navigate={(href) => (called = href)} layout="bottom" />);
    act(() => {
      (pressables(r)[1]?.props.onPress as () => void)();
    });
    assert.equal(called, "/library");
  });
});

describe("PLRNUI-222 documentation", () => {
  it("nav-bar.md documents the auto layout rule and the hooks page lists every hook", () => {
    const navBarDoc = readFileSync(resolve(root, "docs/components/navigation/nav-bar.md"), "utf8");
    assert.match(navBarDoc, /layout="auto"/);
    assert.match(navBarDoc, /web/i);
    assert.match(navBarDoc, /selected/);
    const ctxDoc = readFileSync(resolve(root, "docs/components/navigation/nav-context.md"), "utf8");
    for (const name of ["useNav", "useNavItems", "useNavLogo", "useNavPathname", "useNavigate", "useOptionalNav"]) {
      assert.ok(ctxDoc.includes("`" + name + "()`"), name);
    }
  });
});

describe("PLRNUI-429 isActive matching", () => {
  it("exact matches only the same path, ignoring query, hash and trailing slash", () => {
    assert.equal(isActive("/library", "/library"), true);
    assert.equal(isActive("/library", "/library/"), true);
    assert.equal(isActive("/library", "/library?tab=1#x"), true);
    assert.equal(isActive("/library", "/library/42"), false);
    assert.equal(isActive("/library", "/library/42", "exact"), false);
  });

  it("prefix matches nested paths on a segment boundary", () => {
    assert.equal(isActive("/library", "/library/42", "prefix"), true);
    assert.equal(isActive("/library", "/library", "prefix"), true);
    assert.equal(isActive("/library", "/library-x", "prefix"), false);
    assert.equal(isActive("/library", "/other", "prefix"), false);
  });

  it("the root href with prefix matches only the root", () => {
    assert.equal(isActive("/", "/", "prefix"), true);
    assert.equal(isActive("/", "/library", "prefix"), false);
  });

  it("isItemActive is true for a parent whose child matches", () => {
    const parent: NavItem = { label: "Lib", href: "/lib", children: [{ label: "Shelf", href: "/shelf/1" }] };
    assert.equal(isItemActive(parent, "/shelf/1"), true);
    assert.equal(isItemActive(parent, "/shelf/2"), false);
  });
});

describe("PLRNUI-429 useActiveItem", () => {
  const tree: NavItem[] = [
    { label: "Home", href: "/" },
    { label: "Library", href: "/library", activeMatch: "prefix", children: [{ label: "Shelves", href: "/library/shelves", activeMatch: "prefix", disabled: true }] },
  ];

  it("returns the most specific nested match", () => {
    assert.equal(findActiveItem(tree, "/library/shelves/3")?.label, "Shelves");
    assert.equal(findActiveItem(tree, "/library/other")?.label, "Library");
    assert.equal(findActiveItem(tree, "/nowhere"), undefined);
  });

  it("reads items and pathname from the provider", () => {
    assert.equal(probe(() => useActiveItem(), true, { items: tree, pathname: "/library/shelves" })?.label, "Shelves");
    assert.equal(probe(() => useIsActive(tree[1] as NavItem), true, { items: tree, pathname: "/library/shelves" }), true);
    assert.equal(probe(() => useIsActive(tree[0] as NavItem), true, { items: tree, pathname: "/library/shelves" }), false);
  });
});

function makeAdapter(initial: string) {
  let path = initial;
  const listeners = new Set<() => void>();
  const calls: string[] = [];
  const set = (next: string) => {
    path = next;
    listeners.forEach((l) => l());
  };
  const adapter: NavAdapter = {
    navigate: (href) => {
      calls.push("navigate:" + href);
      set(href);
    },
    replace: (href) => {
      calls.push("replace:" + href);
      set(href);
    },
    back: () => calls.push("back"),
    currentPath: () => path,
    subscribe: (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
  return { adapter, calls, set, listeners };
}

describe("PLRNUI-429 NavAdapter", () => {
  it("reads the pathname from the adapter and exposes navigate/replace/back", () => {
    const { adapter, calls } = makeAdapter("/library");
    let value!: NavContextValue;
    function Probe() {
      value = useNav();
      return null;
    }
    create(
      <NavProvider items={items} adapter={adapter}>
        <Probe />
      </NavProvider>,
    );
    assert.equal(value.pathname, "/library");
    value.navigate("/a");
    value.replace?.("/b");
    value.back?.();
    assert.deepEqual(calls, ["navigate:/a", "replace:/b", "back"]);
  });

  it("re-renders when the adapter path changes and unsubscribes on unmount", () => {
    const { adapter, set, listeners } = makeAdapter("/");
    const seen: string[] = [];
    function Probe() {
      seen.push(useNavPathname());
      return null;
    }
    const r = create(
      <NavProvider items={items} adapter={adapter}>
        <Probe />
      </NavProvider>,
    );
    assert.equal(listeners.size, 1);
    act(() => set("/library"));
    assert.equal(seen.at(-1), "/library");
    act(() => r.unmount());
    assert.equal(listeners.size, 0);
  });

  it("legacy usage keeps replace and back undefined", () => {
    const value = probe(() => useNav());
    assert.equal(value.replace, undefined);
    assert.equal(value.back, undefined);
  });

  it("core imports no router", () => {
    const src = readFileSync(resolve(root, "src/components/NavContext/NavContext.tsx"), "utf8");
    assert.doesNotMatch(src, /from\s+["'](expo-router|@react-navigation|react-router|next\/)/);
  });
});
