import React from "react";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { Platform, Text, View } from "react-native";
import { act, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { ThemeProvider } from "../../src";
import { MotionProvider } from "../../src/motion/MotionProvider.js";
import type { MotionEngine } from "../../src/motion/engine.js";
import { Touchable } from "../../src/components/Touchable/index.js";
import type { TouchableProps } from "../../src/components/Touchable/index.js";
import { createMockAdapters, renderWithCapabilities, type MockAdapterSet } from "../../src/native/testing/index.js";
import { defaultTheme } from "../../src/theme/defaultTheme.js";

const globals = globalThis as { __DEV__?: boolean };
const platform = Platform as { OS: string };
const originalDev = globals.__DEV__;
const originalOS = platform.OS;
afterEach(() => {
  globals.__DEV__ = originalDev;
  platform.OS = originalOS;
});

const flatten = (style: unknown): Record<string, any> => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));

function mount(element: React.ReactElement, options: { mode?: "light" | "dark"; reduceMotion?: boolean; mocks?: MockAdapterSet } = {}) {
  const { mode = "light", reduceMotion = false, mocks = createMockAdapters() } = options;
  mocks.setAccessibility({ reduceMotion });
  return renderWithCapabilities(<ThemeProvider preference={mode}>{element}</ThemeProvider>, mocks);
}

const host = (n: ReactTestInstance, name: string): boolean => (n.type as unknown) === name;
const pressable = (r: ReactTestRenderer): ReactTestInstance => r.root.find((n) => host(n, "Pressable"));
const styleOf = (r: ReactTestRenderer) => flatten(pressable(r).props.style);
const event = (extra: object = {}) => ({ nativeEvent: {}, ...extra }) as never;

function press(r: ReactTestRenderer, handler: "onPress" | "onLongPress" = "onPress") {
  act(() => {
    pressable(r).props[handler]?.(event());
  });
}
function pressIn(r: ReactTestRenderer) {
  act(() => {
    pressable(r).props.onPressIn(event());
  });
}
function pressOut(r: ReactTestRenderer) {
  act(() => {
    pressable(r).props.onPressOut(event());
  });
}

const label = <Text>Go</Text>;

describe("PLRNUI-229 Touchable presses", () => {
  it("calls onPress and onLongPress when enabled", () => {
    const calls: string[] = [];
    const r = mount(<Touchable onPress={() => calls.push("press")} onLongPress={() => calls.push("long")}>{label}</Touchable>);
    press(r);
    press(r, "onLongPress");
    assert.deepEqual(calls, ["press", "long"]);
  });

  it("blocks onPress and onLongPress when disabled", () => {
    const calls: string[] = [];
    const r = mount(<Touchable disabled onPress={() => calls.push("press")} onLongPress={() => calls.push("long")}>{label}</Touchable>);
    press(r);
    press(r, "onLongPress");
    assert.deepEqual(calls, []);
  });

  it("blocks onPress and onLongPress while loading", () => {
    const calls: string[] = [];
    const r = mount(<Touchable loading onPress={() => calls.push("press")} onLongPress={() => calls.push("long")}>{label}</Touchable>);
    press(r);
    press(r, "onLongPress");
    assert.deepEqual(calls, []);
  });
});

describe("PLRNUI-229 Touchable accessibility", () => {
  it("maps role to accessibilityRole, defaulting to button", () => {
    assert.equal(pressable(mount(<Touchable>{label}</Touchable>)).props.accessibilityRole, "button");
    for (const role of ["link", "tab", "checkbox", "radio", "switch", "menuitem"] as const) {
      assert.equal(pressable(mount(<Touchable role={role}>{label}</Touchable>)).props.accessibilityRole, role, role);
    }
  });

  it("accessibilityState reflects disabled, loading, selected and checked", () => {
    const base = pressable(mount(<Touchable>{label}</Touchable>)).props.accessibilityState;
    assert.deepEqual(base, { disabled: false });
    const full = pressable(mount(<Touchable disabled loading selected checked="mixed">{label}</Touchable>)).props.accessibilityState;
    assert.deepEqual(full, { disabled: true, busy: true, selected: true, checked: "mixed" });
    assert.deepEqual(pressable(mount(<Touchable loading>{label}</Touchable>)).props.accessibilityState, { disabled: false, busy: true });
    assert.deepEqual(pressable(mount(<Touchable selected={false} checked={false}>{label}</Touchable>)).props.accessibilityState, {
      disabled: false,
      selected: false,
      checked: false,
    });
  });

  it("passes accessibilityLabel, testID and hitSlop to the pressable", () => {
    const props = pressable(mount(<Touchable accessibilityLabel="Open" testID="t" hitSlop={{ top: 4, left: 4 }}>{label}</Touchable>)).props;
    assert.equal(props.accessibilityLabel, "Open");
    assert.equal(props.testID, "t");
    assert.deepEqual(props.hitSlop, { top: 4, left: 4 });
    assert.equal(pressable(mount(<Touchable hitSlop={8}>{label}</Touchable>)).props.hitSlop, 8);
    assert.equal("hitSlop" in pressable(mount(<Touchable>{label}</Touchable>)).props, false);
  });

  it("applies the minimum target, never below 44", () => {
    assert.deepEqual([styleOf(mount(<Touchable>{label}</Touchable>)).minHeight, styleOf(mount(<Touchable>{label}</Touchable>)).minWidth], [44, 44]);
    const big = styleOf(mount(<Touchable minTarget={56}>{label}</Touchable>));
    assert.deepEqual([big.minHeight, big.minWidth], [56, 56]);
    const small = styleOf(mount(<Touchable minTarget={20}>{label}</Touchable>));
    assert.deepEqual([small.minHeight, small.minWidth], [44, 44]);
    const nan = styleOf(mount(<Touchable minTarget={Number.NaN}>{label}</Touchable>));
    assert.deepEqual([nan.minHeight, nan.minWidth], [44, 44]);
  });

  it("dims a disabled Touchable with the button disabled opacity and leaves loading undimmed", () => {
    assert.equal(styleOf(mount(<Touchable disabled>{label}</Touchable>)).opacity, defaultTheme.components.button.opacity.disabled);
    assert.equal(styleOf(mount(<Touchable loading>{label}</Touchable>)).opacity, 1);
    const themed = styleOf(
      mount(<ThemeProvider themeOverrides={{ components: { button: { opacity: { disabled: 0.3 } } } }}><Touchable disabled>{label}</Touchable></ThemeProvider>)
    );
    assert.equal(themed.opacity, 0.3);
  });

  it("applies the user style after its own and calls a function style with the state", () => {
    assert.equal(styleOf(mount(<Touchable style={{ minWidth: 100 }}>{label}</Touchable>)).minWidth, 100);
    const seen: Array<{ pressed: boolean; focused: boolean; disabled: boolean }> = [];
    const r = mount(
      <Touchable
        style={(state) => {
          seen.push(state);
          return { backgroundColor: state.pressed ? "transparent" : undefined, margin: 3 };
        }}
      >
        {label}
      </Touchable>
    );
    assert.deepEqual(seen.at(-1), { pressed: false, focused: false, disabled: false });
    pressIn(r);
    assert.deepEqual(seen.at(-1), { pressed: true, focused: false, disabled: false });
    assert.equal(styleOf(r).margin, 3);
    assert.equal(seen.every((s) => s.disabled === false), true);
    mount(<Touchable disabled style={(s) => (seen.push(s), null)}>{label}</Touchable>);
    assert.equal(seen.at(-1)?.disabled, true);
  });
});

describe("PLRNUI-229 Touchable asChild", () => {
  it("forwards its props to the child instead of rendering a wrapper", () => {
    const calls: string[] = [];
    const r = mount(
      <Touchable asChild role="link" accessibilityLabel="Open" disabled={false} loading hitSlop={6} testID="slot" onPress={() => calls.push("press")} style={{ margin: 2 }}>
        <View testID="slot" style={{ padding: 1 }} />
      </Touchable>
    );
    assert.equal(r.root.findAll((n) => host(n, "Pressable")).length, 0);
    const child = r.root.find((n) => host(n, "View"));
    assert.equal(child.props.accessibilityRole, "link");
    assert.equal(child.props.accessibilityLabel, "Open");
    assert.deepEqual(child.props.accessibilityState, { disabled: false, busy: true });
    assert.equal(child.props.hitSlop, 6);
    const style = flatten(child.props.style);
    assert.equal(style.minHeight, 44);
    assert.equal(style.margin, 2);
    assert.equal(style.padding, 1);
    // the press is still blocked by loading
    act(() => child.props.onPress(event()));
    assert.deepEqual(calls, []);
  });

  it("presses through the child when enabled", () => {
    const calls: string[] = [];
    const r = mount(
      <Touchable asChild onPress={() => calls.push("press")}>
        <View />
      </Touchable>
    );
    act(() => r.root.find((n) => host(n, "View")).props.onPress(event()));
    assert.deepEqual(calls, ["press"]);
  });
});

describe("PLRNUI-229 Touchable feedback", () => {
  it("asChild gives the child the pressed look", () => {
    const r = mount(
      <Touchable asChild>
        <View />
      </Touchable>
    );
    const child = () => r.root.find((n) => host(n, "View"));
    act(() => child().props.onPressIn(event()));
    assert.equal(flatten(child().props.style).opacity, 0.85);
    act(() => child().props.onPressOut(event()));
    assert.equal(flatten(child().props.style).opacity, 1);
  });

  const pressedStyle = (feedback: TouchableProps["feedback"], opts: Parameters<typeof mount>[1] = {}) => {
    const r = mount(<Touchable feedback={feedback}>{label}</Touchable>, opts);
    const rest = styleOf(r);
    pressIn(r);
    const down = styleOf(r);
    pressOut(r);
    return { rest, down, up: styleOf(r) };
  };

  it("opacity dims while pressed and restores on release", () => {
    const { rest, down, up } = pressedStyle("opacity");
    assert.equal(rest.opacity, 1);
    assert.equal(down.opacity, 0.85);
    assert.equal(down.transform, undefined);
    assert.equal(up.opacity, 1);
  });

  it("is the default feedback", () => {
    const r = mount(<Touchable>{label}</Touchable>);
    pressIn(r);
    assert.equal(styleOf(r).opacity, 0.85);
  });

  it("follows a themed pressed opacity below 1", () => {
    const r = mount(
      <ThemeProvider themeOverrides={{ components: { button: { opacity: { pressed: 0.6 } } } }}>
        <Touchable>{label}</Touchable>
      </ThemeProvider>
    );
    pressIn(r);
    assert.equal(styleOf(r).opacity, 0.6);
  });

  it("scale shrinks to the press scale token and keeps the opacity", () => {
    const { down, up } = pressedStyle("scale");
    assert.deepEqual(down.transform, [{ scale: defaultTheme.motion.scale.press }]);
    assert.equal(down.opacity, 1);
    assert.equal(up.transform, undefined);
  });

  it("scale only changes opacity under reduced motion", () => {
    const { down } = pressedStyle("scale", { reduceMotion: true });
    assert.equal(down.transform, undefined);
    assert.equal(down.opacity, 1);
  });

  it("none has no pressed change", () => {
    const { rest, down } = pressedStyle("none");
    assert.deepEqual(down, rest);
  });

  it("disabled and loading have no pressed change", () => {
    for (const props of [{ disabled: true }, { loading: true }]) {
      const r = mount(<Touchable {...props}>{label}</Touchable>);
      const rest = styleOf(r);
      pressIn(r);
      assert.deepEqual(styleOf(r), rest, JSON.stringify(props));
    }
  });

  it("ripple falls back to opacity off Android and has no android_ripple", () => {
    const r = mount(<Touchable feedback="ripple">{label}</Touchable>);
    assert.equal("android_ripple" in pressable(r).props, false);
    pressIn(r);
    assert.equal(styleOf(r).opacity, 0.85);
  });

  it("ripple on Android sets android_ripple from the state-layer colour and keeps the opacity", () => {
    platform.OS = "android";
    const r = mount(<Touchable feedback="ripple">{label}</Touchable>);
    assert.deepEqual(pressable(r).props.android_ripple, { color: defaultTheme.semantic.action.primaryActive, borderless: false });
    pressIn(r);
    assert.equal(styleOf(r).opacity, 1);
    const off = mount(<Touchable feedback="ripple" disabled>{label}</Touchable>);
    assert.equal("android_ripple" in pressable(off).props, false);
  });
});

describe("PLRNUI-229 Touchable drives usePressFeedback", () => {
  // The animated style needs `Animated`, which the test shim lacks: the hook is observed through the motion engine.
  function engineTargets(feedback: TouchableProps["feedback"], props: Partial<TouchableProps> = {}, reduceMotion = false): number[] {
    const targets: number[] = [];
    const engine: MotionEngine = {
      createValue: (initial) => ({ setValue() {}, initial }) as never,
      timing(_value, to) {
        return { start: () => void targets.push(to), stop() {} };
      },
      spring: () => {
        throw new Error("timing only");
      },
      loop: (handle) => handle,
      stop() {},
    };
    const r = mount(
      <MotionProvider engine={engine}>
        <Touchable feedback={feedback} {...props}>{label}</Touchable>
      </MotionProvider>,
      { reduceMotion }
    );
    pressIn(r);
    return targets;
  }

  it("opacity animates the opacity only", () => {
    assert.deepEqual(engineTargets("opacity"), [0.85]);
  });

  it("scale animates the press scale and keeps the opacity at 1", () => {
    assert.deepEqual(engineTargets("scale").sort(), [defaultTheme.motion.scale.press, 1].sort());
    assert.equal(engineTargets("scale", {}, true).includes(defaultTheme.motion.scale.press), false);
  });

  it("none, disabled and loading animate nothing", () => {
    assert.deepEqual(engineTargets("none"), []);
    assert.deepEqual(engineTargets("opacity", { disabled: true }), []);
    assert.deepEqual(engineTargets("opacity", { loading: true }), []);
  });
});

describe("PLRNUI-229 Touchable web focus ring", () => {
  const focus = (r: ReactTestRenderer, target?: unknown) =>
    act(() => {
      pressable(r).props.onFocus({ nativeEvent: { target } });
    });

  it("draws a ring in colors.primary for keyboard focus and removes it on blur", () => {
    platform.OS = "web";
    const r = mount(<Touchable>{label}</Touchable>);
    assert.equal(styleOf(r).outlineColor, undefined);
    focus(r, { matches: (selector: string) => selector === ":focus-visible" });
    const ring = styleOf(r);
    assert.equal(ring.outlineColor, defaultTheme.colors.primary);
    assert.equal(ring.outlineStyle, "solid");
    assert.equal(ring.outlineWidth, defaultTheme.borderWidth.thick);
    act(() => pressable(r).props.onBlur());
    assert.equal(styleOf(r).outlineColor, undefined);
  });

  it("uses the dark mode primary colour", () => {
    platform.OS = "web";
    const r = mount(<Touchable>{label}</Touchable>, { mode: "dark" });
    focus(r);
    assert.notEqual(styleOf(r).outlineColor, undefined);
    assert.notEqual(styleOf(r).outlineColor, defaultTheme.colors.primary);
  });

  it("shows the ring when the DOM target cannot tell, and not for pointer focus", () => {
    platform.OS = "web";
    const unknown = mount(<Touchable>{label}</Touchable>);
    focus(unknown, {});
    assert.equal(styleOf(unknown).outlineColor, defaultTheme.colors.primary);
    const pointer = mount(<Touchable>{label}</Touchable>);
    focus(pointer, { matches: () => false });
    assert.equal(styleOf(pointer).outlineColor, undefined);
  });

  it("draws no ring off web or while disabled", () => {
    const native = mount(<Touchable>{label}</Touchable>);
    focus(native);
    assert.equal(styleOf(native).outlineColor, undefined);
    platform.OS = "web";
    const disabled = mount(<Touchable disabled>{label}</Touchable>);
    focus(disabled);
    assert.equal(styleOf(disabled).outlineColor, undefined);
  });

  it("passes the focused state to a function style", () => {
    platform.OS = "web";
    let focused = false;
    const r = mount(<Touchable style={(s) => ((focused = s.focused), null)}>{label}</Touchable>);
    focus(r);
    assert.equal(focused, true);
  });
});

describe("PLRNUI-229 Touchable haptic", () => {
  const haptics = (m: MockAdapterSet) => m.callsOf("haptics", "impact").map((c) => c.args);

  it("triggers the haptics capability once per press with the configured level", () => {
    for (const level of ["light", "medium"] as const) {
      const mocks = createMockAdapters();
      const r = mount(<Touchable haptic={level}>{label}</Touchable>, { mocks });
      assert.deepEqual(haptics(mocks), []);
      press(r);
      assert.deepEqual(haptics(mocks), [[level]], level);
      press(r);
      assert.deepEqual(haptics(mocks), [[level], [level]], level);
    }
  });

  it("fires before onPress, also for a long press, and once per gesture", () => {
    const mocks = createMockAdapters();
    const order: string[] = [];
    const r = mount(
      <Touchable haptic="light" onPress={() => order.push(`press:${haptics(mocks).length}`)} onLongPress={() => order.push(`long:${haptics(mocks).length}`)}>
        {label}
      </Touchable>,
      { mocks }
    );
    press(r);
    press(r, "onLongPress");
    assert.deepEqual(order, ["press:1", "long:2"]);
  });

  it("never fires when disabled, loading or haptic is false or unset", () => {
    for (const props of [{ haptic: "light" as const, disabled: true }, { haptic: "medium" as const, loading: true }, { haptic: false as const }, {}]) {
      const mocks = createMockAdapters();
      const r = mount(<Touchable {...props} onPress={() => undefined} onLongPress={() => undefined}>{label}</Touchable>, { mocks });
      press(r);
      press(r, "onLongPress");
      assert.deepEqual(haptics(mocks), [], JSON.stringify(props));
    }
  });

  it("is a no-op, and still presses, without a haptics adapter", () => {
    const calls: string[] = [];
    const r = mount(<Touchable haptic="light" onPress={() => calls.push("press")}>{label}</Touchable>);
    press(r);
    assert.deepEqual(calls, ["press"]);
  });
});

describe("PLRNUI-229 Touchable dev warning and rendering", () => {
  const capture = (fn: () => void): unknown[][] => {
    const calls: unknown[][] = [];
    const { error, warn } = console;
    const record = (...args: unknown[]) => void (String(args[0]).includes("react-test-renderer is deprecated") || calls.push(args));
    console.error = record;
    console.warn = record;
    try {
      fn();
    } finally {
      console.error = error;
      console.warn = warn;
    }
    return calls;
  };

  it("warns once in development when there is no label and no text child", () => {
    globals.__DEV__ = true;
    const calls = capture(() => {
      const r = mount(<Touchable><View /></Touchable>);
      pressIn(r);
      pressOut(r);
    });
    assert.equal(calls.length, 1);
    assert.match(String(calls[0]?.[0]), /\[ui\/Touchable\].*accessibilityLabel/);
  });

  it("does not warn with a label, a text child, a nested text child or outside development", () => {
    globals.__DEV__ = true;
    const calls = capture(() => {
      mount(<Touchable accessibilityLabel="Open"><View /></Touchable>);
      mount(<Touchable>Plain</Touchable>);
      mount(<Touchable>{label}</Touchable>);
      mount(<Touchable><View><View><Text>Deep</Text></View></View></Touchable>);
      mount(<Touchable>{["a", 1]}</Touchable>);
    });
    assert.deepEqual(calls, []);
    globals.__DEV__ = false;
    assert.deepEqual(capture(() => void mount(<Touchable><View /></Touchable>)), []);
  });

  it("asChild counts the label or text of the child", () => {
    globals.__DEV__ = true;
    const calls = capture(() => {
      mount(<Touchable asChild><View accessibilityLabel="Child label" /></Touchable>);
      mount(<Touchable asChild><View><Text>Inner</Text></View></Touchable>);
    });
    assert.deepEqual(calls, []);
    assert.equal(capture(() => void mount(<Touchable asChild><View /></Touchable>)).length, 1);
  });

  it("an empty label or a blank text child still warns", () => {
    globals.__DEV__ = true;
    assert.equal(capture(() => void mount(<Touchable accessibilityLabel=""><View /></Touchable>)).length, 1);
    assert.equal(capture(() => void mount(<Touchable>{"  "}</Touchable>)).length, 1);
  });

  it("renders in light and dark mode with no console.error or console.warn", () => {
    globals.__DEV__ = true;
    const calls = capture(() => {
      for (const mode of ["light", "dark"] as const) {
        for (const feedback of ["opacity", "scale", "ripple", "none"] as const) {
          const r = mount(<Touchable feedback={feedback} haptic="light" onPress={() => undefined}>{label}</Touchable>, { mode });
          press(r);
          pressIn(r);
          pressOut(r);
        }
        mount(<Touchable disabled loading>{label}</Touchable>, { mode });
        mount(<Touchable asChild accessibilityLabel="x"><View /></Touchable>, { mode });
      }
    });
    assert.deepEqual(calls, []);
  });
});

describe("PLRNUI-229 Touchable source", () => {
  const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const full = join(dir, name);
      return statSync(full).isDirectory() ? walk(full) : [full];
    });

  it("uses no hardcoded colour", () => {
    assert.equal(/#[0-9a-fA-F]{3,8}\b/.test(read("../../src/components/Touchable/Touchable.tsx")), false);
  });

  // usePressFeedback.ts only mentions "PressableScale" in a comment (there is deliberately no such component).
  const stripComments = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

  it("consumes usePressFeedback and no other press component exists in src", () => {
    assert.match(read("../../src/components/Touchable/Touchable.tsx"), /from "..\/..\/motion\/usePressFeedback.js"/);
    const offenders = walk(new URL("../../src", import.meta.url).pathname).filter((f) => /PressableScale|HapticPressable/.test(stripComments(readFileSync(f, "utf8"))));
    assert.deepEqual(offenders, []);
  });

  it("TouchableProps accepts the documented props", () => {
    const props: TouchableProps = {
      onPress: () => undefined,
      onLongPress: () => undefined,
      disabled: false,
      loading: false,
      feedback: "ripple",
      minTarget: 48,
      hitSlop: { top: 2 },
      haptic: "medium",
      role: "menuitem",
      asChild: false,
      accessibilityLabel: "x",
      selected: true,
      checked: "mixed",
      style: () => null,
      testID: "x",
    };
    assert.equal(props.role, "menuitem");
  });
});
