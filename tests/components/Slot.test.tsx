import React from "react";
import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";
import { Pressable, View } from "react-native";
import { Slot, mergeProps } from "../../src/components/Slot/index.js";
import { ThemeProvider } from "../../src/index.js";

const globals = globalThis as { __DEV__?: boolean };
const originalDev = globals.__DEV__;
afterEach(() => {
  globals.__DEV__ = originalDev;
});

function render(ui: React.ReactElement): TestRenderer.ReactTestRenderer {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    // host refs are null in the test renderer unless nodes are mocked
    renderer = TestRenderer.create(ui, { createNodeMock: () => ({ mock: true }) });
  });
  return renderer;
}

describe("PLRNUI-225 mergeProps", () => {
  it("concatenates styles with the child last and flattens nested arrays", () => {
    const merged = mergeProps({ style: [{ a: 1 }, [{ b: 2 }]] }, { style: [{ a: 3 }, null, false] });
    assert.deepEqual(merged.style, [{ a: 1 }, { b: 2 }, { a: 3 }]);
    assert.deepEqual(mergeProps({}, { style: { a: 1 } }).style, [{ a: 1 }]);
    assert.deepEqual(mergeProps({ style: { a: 1 } }, {}).style, { a: 1 });
  });

  it("chains handlers child first then slot, and keeps a single one as is", () => {
    const order: string[] = [];
    const merged = mergeProps({ onPress: (x: string) => order.push(`slot:${x}`) }, { onPress: (x: string) => order.push(`child:${x}`) });
    (merged.onPress as (x: string) => void)("e");
    assert.deepEqual(order, ["child:e", "slot:e"]);
    const only = () => undefined;
    assert.equal(mergeProps({ onPress: only }, {}).onPress, only);
    assert.equal(mergeProps({}, { onPress: only }).onPress, only);
  });

  it("accessibility props: child wins unless undefined, state and value merge per key", () => {
    const merged = mergeProps(
      { accessibilityRole: "button", accessibilityLabel: "slot", accessibilityHint: "hint", accessibilityState: { disabled: true, busy: true }, "aria-label": "slot aria" },
      { accessibilityRole: undefined, accessibilityLabel: "child", accessibilityState: { disabled: false }, "aria-label": undefined },
    );
    assert.equal(merged.accessibilityRole, "button");
    assert.equal(merged.accessibilityLabel, "child");
    assert.equal(merged.accessibilityHint, "hint");
    assert.deepEqual(merged.accessibilityState, { disabled: false, busy: true });
    assert.equal(merged["aria-label"], "slot aria");
    const sideOnly = mergeProps({}, { accessibilityRole: "link" });
    assert.equal(sideOnly.accessibilityRole, "link");
  });
});

describe("PLRNUI-225 Slot", () => {
  it("renders the child element itself with merged props and no wrapper", () => {
    const r = render(
      <Slot accessibilityRole="button" testID="slot" style={{ opacity: 0.5 }}>
        <View style={{ padding: 4 }} accessibilityState={{ selected: true }} />
      </Slot>,
    );
    const view = r.root.findByType(View);
    assert.equal(view.props.accessibilityRole, "button");
    assert.equal(view.props.testID, "slot");
    assert.deepEqual(view.props.style, [{ opacity: 0.5 }, { padding: 4 }]);
    assert.deepEqual(view.props.accessibilityState, { selected: true });
    assert.equal(r.root.findAllByType(View).length, 1);
  });

  it("runs the child handler and then the slot handler", () => {
    const order: string[] = [];
    const r = render(
      <Slot onPress={() => order.push("slot")}>
        <Pressable onPress={() => order.push("child")} />
      </Slot>,
    );
    act(() => r.root.findByType(Pressable).props.onPress());
    assert.deepEqual(order, ["child", "slot"]);
  });

  it("merges the slot ref and the child ref", () => {
    const slotRefs: unknown[] = [];
    const childRefs: unknown[] = [];
    const slotRef = (node: unknown): void => void slotRefs.push(node);
    const childRef = (node: unknown): void => void childRefs.push(node);
    const r = render(
      <Slot ref={slotRef}>
        <View ref={childRef} />
      </Slot>,
    );
    assert.equal(slotRefs.length >= 1 && slotRefs[0] !== null, true);
    assert.equal(childRefs.length >= 1 && childRefs[0] !== null, true);
    assert.equal(slotRefs[0], childRefs[0]);
    act(() => r.unmount());
    assert.equal(slotRefs[slotRefs.length - 1], null);
    assert.equal(childRefs[childRefs.length - 1], null);
  });

  it("merges object refs", () => {
    const slotRef = React.createRef<View>();
    const childRef = React.createRef<View>();
    render(
      <Slot ref={slotRef}>
        <View ref={childRef} />
      </Slot>,
    );
    assert.notEqual(slotRef.current, null);
    assert.equal(slotRef.current, childRef.current);
  });

  it("throws a descriptive error in __DEV__ for no, several or non-element children and Fragments", () => {
    globals.__DEV__ = true;
    const originalError = console.error;
    console.error = () => undefined; // React logs the thrown render error
    try {
      const bad: Array<[string, unknown, RegExp]> = [
        ["text", "hello", /not a React element/],
        ["none", undefined, /not a React element/],
        ["several", [<View key="a" />, <View key="b" />], /more than one child/],
        ["fragment", <></>, /Fragment/],
      ];
      for (const [label, children, message] of bad) {
        assert.throws(
          () => render(<Slot>{children as React.ReactElement}</Slot>),
          (error: Error) => /\[ui\/Slot\]/.test(error.message) && message.test(error.message),
          label,
        );
      }
    } finally {
      console.error = originalError;
    }
  });

  it("renders nothing for invalid children outside __DEV__", () => {
    globals.__DEV__ = false;
    const r = render(<Slot>{"hello" as unknown as React.ReactElement}</Slot>);
    assert.equal(r.toJSON(), null);
  });

  it("renders under ThemeProvider in light and dark without console output", () => {
    const calls: unknown[][] = [];
    const originalError = console.error;
    const originalWarn = console.warn;
    // react-test-renderer logs its own deprecation notice once per process; that notice is not a component error.
    console.error = (...args: unknown[]) => {
      if (!String(args[0]).includes("react-test-renderer is deprecated")) calls.push(args);
    };
    console.warn = (...args: unknown[]) => void calls.push(args);
    try {
      for (const mode of ["light", "dark"] as const) {
        const r = render(
          <ThemeProvider initialMode={mode} persistTheme={false}>
            <Slot accessibilityRole="button">
              <View />
            </Slot>
          </ThemeProvider>,
        );
        assert.equal(r.root.findByType(View).props.accessibilityRole, "button");
      }
    } finally {
      console.error = originalError;
      console.warn = originalWarn;
    }
    assert.deepEqual(calls, []);
  });
});
