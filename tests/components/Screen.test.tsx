import React from "react";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import * as ReactNative from "react-native";
import { installNativeHosts } from "../shims/react-native.js";
import TestRenderer, { act, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { ThemeProvider, useTheme } from "../../src";
import { Screen, useScreenInsets } from "../../src/components/Screen/index.js";
import { SafeAreaInsetsProvider } from "../../src/native/safe-area/index.js";
import type { SafeAreaAdapter } from "../../src/native/safe-area/index.js";
import type { KeyboardEventPayload, KeyboardHost } from "../../src/native/keyboard/index.js";
import { defaultTheme } from "../../src/theme/defaultTheme.js";

type Listener = (event: KeyboardEventPayload) => void;

function mockKeyboard() {
  const listeners = new Map<string, Set<Listener>>();
  const log = { dismissed: 0 };
  const keyboard: KeyboardHost = {
    addListener(event, listener) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(listener);
      return { remove: () => void listeners.get(event)!.delete(listener) };
    },
    dismiss() {
      log.dismissed++;
    },
  };
  const emit = (event: string, payload: KeyboardEventPayload = {}) => {
    for (const listener of [...(listeners.get(event) ?? [])]) listener(payload);
  };
  return { keyboard, log, emit };
}

// Recording stand-ins for host components the test shim does not provide.
const Avoiding = ({ children, ...props }: Record<string, any>) => React.createElement("KeyboardAvoidingView", props, children);
const Refresh = (props: Record<string, any>) => React.createElement("RefreshControl", props);
/** The `refreshControl` element handed to the ScrollView (the shim does not render it). */
const refreshControlOf = (r: ReactTestRenderer): React.ReactElement<Record<string, any>> | undefined => hostsOf(r, "ScrollView")[0]?.props.refreshControl;

const flatten = (style: unknown): Record<string, any> => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));
const INSETS = { top: 44, right: 3, bottom: 34, left: 5 };

function mount(element: React.ReactElement, { mode = "light", insets }: { mode?: "light" | "dark"; insets?: Partial<typeof INSETS> } = {}) {
  let renderer!: ReactTestRenderer;
  const tree = insets ? <SafeAreaInsetsProvider insets={insets}>{element}</SafeAreaInsetsProvider> : element;
  act(() => {
    renderer = TestRenderer.create(<ThemeProvider preference={mode}>{tree}</ThemeProvider>);
  });
  return renderer;
}

const byTestID = (r: ReactTestRenderer, testID: string) => r.root.find((n) => typeof n.type === "string" && n.props.testID === testID);
const hostsOf = (r: ReactTestRenderer, type: string): ReactTestInstance[] => r.root.findAll((n) => n.type === type);
const has = (node: ReactTestInstance, testID: string) => node.findAll((n) => typeof n.type === "string" && n.props.testID === testID).length > 0;

/** The frame is the host View that directly holds the header, the body and the footer. */
function frameStyle(r: ReactTestRenderer) {
  const header = byTestID(r, "header");
  let node: ReactTestInstance | null = header.parent;
  while (node && (node.type as unknown) !== "View") node = node.parent;
  return flatten(node!.props.style);
}

const slots = { header: <ReactNative.View testID="header" />, footer: <ReactNative.View testID="footer" />, testID: "screen" };
const platformOf = () => (ReactNative as unknown as { Platform: { OS: string } }).Platform;
type Installed = Parameters<typeof installNativeHosts>[0];
/** Installs react-native core stand-ins through the test shim (no public prop) and resets them after each test. */
const install = (hosts: Installed, os?: string) => {
  installNativeHosts(hosts);
  if (os) platformOf().OS = os;
};
const originalOS = platformOf().OS;
afterEach(() => {
  installNativeHosts({});
  platformOf().OS = originalOS;
});

describe("PLRNUI-428 Screen", () => {
  describe("safe-area insets", () => {
    it("without a safe-area adapter every edge falls back to zero padding", () => {
      const r = mount(<Screen {...slots} />);
      const style = frameStyle(r);
      assert.deepEqual([style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft], [0, 0, 0, 0]);
    });

    it("with a mock safe-area adapter all four insets are applied by default", () => {
      const adapter: SafeAreaAdapter = { useInsets: () => INSETS };
      const r = mount(
        <SafeAreaInsetsProvider adapter={adapter}>
          <Screen {...slots} />
        </SafeAreaInsetsProvider>
      );
      const style = frameStyle(r);
      assert.deepEqual([style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft], [44, 3, 34, 5]);
    });

    it("edges selects which insets are applied", () => {
      const some = frameStyle(mount(<Screen {...slots} edges={["top", "left"]} />, { insets: INSETS }));
      assert.deepEqual([some.paddingTop, some.paddingRight, some.paddingBottom, some.paddingLeft], [44, 0, 0, 5]);
      const none = frameStyle(mount(<Screen {...slots} edges={[]} />, { insets: INSETS }));
      assert.deepEqual([none.paddingTop, none.paddingRight, none.paddingBottom, none.paddingLeft], [0, 0, 0, 0]);
    });

    it("useScreenInsets returns the applied insets, and zeros outside a Screen", () => {
      const seen: Record<string, unknown> = {};
      function Probe({ name }: { name: string }) {
        seen[name] = useScreenInsets();
        return null;
      }
      mount(
        <>
          <Screen edges={["top", "bottom"]}>
            <Probe name="inside" />
          </Screen>
          <Probe name="outside" />
        </>,
        { insets: INSETS }
      );
      assert.deepEqual(seen.inside, { top: 44, right: 0, bottom: 34, left: 0 });
      assert.deepEqual(seen.outside, { top: 0, right: 0, bottom: 0, left: 0 });
    });

    it("on web without an adapter the selected edges use CSS env() insets", () => {
      const platform = (ReactNative as unknown as { Platform: { OS: string } }).Platform;
      const before = platform.OS;
      platform.OS = "web";
      try {
        const style = frameStyle(mount(<Screen {...slots} edges={["top"]} />));
        assert.equal(style.paddingTop, "env(safe-area-inset-top)");
        assert.equal(style.paddingBottom, undefined);
      } finally {
        platform.OS = before;
      }
    });
  });

  describe("body", () => {
    it("scroll swaps the static View body for a ScrollView; header and footer stay outside it", () => {
      const staticTree = mount(
        <Screen {...slots}>
          <ReactNative.View testID="child" />
        </Screen>
      );
      assert.equal(hostsOf(staticTree, "ScrollView").length, 0);

      const scrolling = mount(
        <Screen scroll {...slots}>
          <ReactNative.View testID="child" />
        </Screen>
      );
      const [scrollView] = hostsOf(scrolling, "ScrollView");
      assert.ok(scrollView);
      assert.equal(has(scrollView!, "child"), true);
      assert.equal(has(scrollView!, "footer"), false);
      assert.equal(has(scrollView!, "header"), false);
      assert.equal(scrollView!.props.keyboardShouldPersistTaps, "handled");
    });

    it("renders header, body and footer in reading order", () => {
      const r = mount(
        <Screen scroll {...slots}>
          <ReactNative.View testID="child" />
        </Screen>
      );
      const order = r.root
        .findAll((n) => typeof n.type === "string" && ["header", "child", "footer"].includes(n.props.testID))
        .map((n) => n.props.testID);
      assert.deepEqual(order, ["header", "child", "footer"]);
    });

    it("padding applies to the body only, from theme.space", () => {
      const scrolling = mount(<Screen scroll padding="lg" {...slots} />);
      assert.equal(flatten(hostsOf(scrolling, "ScrollView")[0]!.props.contentContainerStyle).padding, defaultTheme.space.lg);
      assert.equal(frameStyle(scrolling).padding, undefined);
      assert.equal(flatten(byTestID(scrolling, "footer").props.style).padding, undefined);

      const body = mount(
        <Screen padding="sm" {...slots}>
          <ReactNative.View testID="child" />
        </Screen>
      );
      const bodyView = byTestID(body, "child").parent!;
      let node: ReactTestInstance | null = bodyView;
      while (node && (node.type as unknown) !== "View") node = node.parent;
      assert.equal(flatten(node!.props.style).padding, defaultTheme.space.sm);
    });

    it("bg is a theme color, background by default, in light and dark mode", () => {
      for (const mode of ["light", "dark"] as const) {
        let colors!: Record<string, string>;
        function Probe() {
          colors = useTheme().colors as unknown as Record<string, string>;
          return null;
        }
        const r = mount(
          <>
            <Probe />
            <Screen testID="plain" />
            <Screen testID="alt" bg="surface" />
          </>,
          { mode }
        );
        assert.equal(flatten(byTestID(r, "plain").props.style).backgroundColor, colors.background, mode);
        assert.equal(flatten(byTestID(r, "alt").props.style).backgroundColor, colors.surface, mode);
      }
    });
  });

  describe("keyboard", () => {
    it("the footer stays above the keyboard: avoidance is enabled and the bottom inset is dropped while it is open", () => {
      const kb = mockKeyboard();
      install({ keyboard: kb.keyboard, keyboardAvoidingView: Avoiding });
      const r = mount(<Screen {...slots} keyboardAvoiding />, { insets: INSETS });
      const kav = hostsOf(r, "KeyboardAvoidingView")[0]!;
      assert.equal(kav.props.enabled, true);
      assert.equal(has(kav, "footer"), true, "the footer is inside the avoiding view");
      assert.equal(frameStyle(r).paddingBottom, 34);

      act(() => kb.emit("keyboardDidShow", { endCoordinates: { height: 300 }, duration: 100 }));
      assert.equal(frameStyle(r).paddingBottom, 0);
      assert.equal(frameStyle(r).paddingTop, 44);

      act(() => kb.emit("keyboardDidHide"));
      assert.equal(frameStyle(r).paddingBottom, 34);
    });

    it("avoids with padding on iOS and height on Android", () => {
      for (const [platform, behavior] of [
        ["ios", "padding"],
        ["android", "height"],
      ] as const) {
        install({ keyboard: mockKeyboard().keyboard, keyboardAvoidingView: Avoiding }, platform);
        const r = mount(<Screen {...slots} keyboardAvoiding />);
        assert.equal(hostsOf(r, "KeyboardAvoidingView")[0]!.props.behavior, behavior, platform);
      }
    });

    it("without keyboardAvoiding avoidance is disabled and the bottom inset is kept", () => {
      const kb = mockKeyboard();
      install({ keyboard: kb.keyboard, keyboardAvoidingView: Avoiding });
      const r = mount(<Screen {...slots} />, { insets: INSETS });
      assert.equal(hostsOf(r, "KeyboardAvoidingView")[0]!.props.enabled, false);
      act(() => kb.emit("keyboardDidShow", { endCoordinates: { height: 300 } }));
      assert.equal(frameStyle(r).paddingBottom, 34);
    });

    it("dismissKeyboardOnTapOutside=true calls Keyboard.dismiss on a background press, false does not", () => {
      const kb = mockKeyboard();
      install({ keyboard: kb.keyboard });
      const on = mount(<Screen scroll dismissKeyboardOnTapOutside {...slots} />);
      const [pressable] = hostsOf(on, "Pressable");
      assert.ok(pressable, "a Pressable wraps the body");
      assert.equal(pressable!.props.disabled, false);
      act(() => pressable!.props.onPress());
      assert.equal(kb.log.dismissed, 1);

      const off = mount(<Screen scroll {...slots} />);
      assert.equal(hostsOf(off, "Pressable").length, 0);
      assert.equal(kb.log.dismissed, 1);
    });
  });

  describe("status bar and refresh", () => {
    it("the status bar follows the theme mode, and light/dark force the content style", () => {
      const seen: string[] = [];
      const statusBarComponent = ({ barStyle }: { barStyle: string }) => {
        seen.push(barStyle);
        return null;
      };
      install({ statusBar: statusBarComponent });
      mount(<Screen />, { mode: "light" });
      mount(<Screen />, { mode: "dark" });
      mount(<Screen statusBar="light" />, { mode: "light" });
      mount(<Screen statusBar="dark" />, { mode: "dark" });
      assert.deepEqual(seen, ["dark-content", "light-content", "light-content", "dark-content"]);
    });

    it("onRefresh adds a labelled refresh control to the scroll body; without it none is added", () => {
      const calls: string[] = [];
      install({ refreshControl: Refresh });
      const r = mount(<Screen scroll refreshing onRefresh={() => calls.push("refresh")} refreshAccessibilityLabel="Reload" />);
      const control = refreshControlOf(r)!;
      assert.equal(control.type, Refresh);
      assert.equal(control.props.refreshing, true);
      assert.equal(control.props.accessibilityLabel, "Reload");
      act(() => control.props.onRefresh());
      assert.deepEqual(calls, ["refresh"]);

      const defaulted = mount(<Screen scroll onRefresh={() => undefined} />);
      assert.equal(refreshControlOf(defaulted)!.props.accessibilityLabel, "Refresh");
      assert.equal(refreshControlOf(mount(<Screen scroll />)), undefined);
      assert.equal(refreshControlOf(mount(<Screen onRefresh={() => undefined} />)), undefined);
    });
  });

  it("renders in light and dark mode, static and scroll, with no console.error or console.warn", () => {
    const calls: unknown[][] = [];
    const { error, warn } = console;
    const record = (...args: unknown[]) => void (String(args[0]).includes("react-test-renderer is deprecated") || calls.push(args));
    console.error = record;
    console.warn = record;
    try {
      for (const mode of ["light", "dark"] as const) {
        for (const scroll of [false, true]) {
          const r = mount(<Screen scroll={scroll} padding="md" keyboardAvoiding dismissKeyboardOnTapOutside {...slots} />, { mode, insets: INSETS });
          act(() => r.unmount());
        }
      }
    } finally {
      console.error = error;
      console.warn = warn;
    }
    assert.deepEqual(calls, []);
  });

  it("uses no hardcoded colors", () => {
    const dir = new URL("../../src/components/Screen/", import.meta.url);
    for (const file of readdirSync(dir).filter((name) => name.endsWith(".tsx") || name === "index.ts")) {
      assert.doesNotMatch(readFileSync(new URL(file, dir), "utf8"), /#[0-9a-fA-F]{3,8}\b|rgba?\(/, file);
    }
  });
});
