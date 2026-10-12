import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";

import {
  DismissKeyboardView,
  KeyboardAvoidingContainer,
  defaultAvoidingBehavior,
  dismissKeyboard,
  useKeyboard,
  useKeyboardVisible,
} from "../../../src/native/keyboard/index.js";
import type { KeyboardApi, KeyboardEventPayload, KeyboardHost } from "../../../src/native/keyboard/index.js";

type EventName = Parameters<KeyboardHost["addListener"]>[0];

function mockHost() {
  const listeners = new Map<EventName, Set<(e: KeyboardEventPayload) => void>>();
  const log = { added: [] as EventName[], removed: 0, dismissed: 0 };
  const host: KeyboardHost = {
    addListener(event, listener) {
      log.added.push(event);
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(listener);
      return {
        remove() {
          log.removed++;
          listeners.get(event)!.delete(listener);
        },
      };
    },
    dismiss() {
      log.dismissed++;
    },
  };
  const emit = (event: EventName, payload: KeyboardEventPayload = {}) => {
    for (const listener of [...(listeners.get(event) ?? [])]) listener(payload);
  };
  const count = () => [...listeners.values()].reduce((n, set) => n + set.size, 0);
  return { host, log, emit, count };
}

function Probe({ out, ...options }: { out: { api?: KeyboardApi; visible?: boolean } } & Parameters<typeof useKeyboard>[0]) {
  out.api = useKeyboard(options);
  out.visible = useKeyboardVisible(options);
  return null;
}

describe("useKeyboard", () => {
  it("selects keyboardWill* events on iOS and reflects show/hide with height and duration", () => {
    const m = mockHost();
    const out: { api?: KeyboardApi; visible?: boolean } = {};
    let r!: TestRenderer.ReactTestRenderer;
    act(() => {
      r = TestRenderer.create(<Probe out={out} host={m.host} platform="ios" />);
    });
    assert.deepEqual(m.log.added.slice(0, 2), ["keyboardWillShow", "keyboardWillHide"]);
    assert.deepEqual({ ...out.api, dismiss: undefined }, { visible: false, height: 0, duration: 0, dismiss: undefined });
    act(() => m.emit("keyboardWillShow", { duration: 250, endCoordinates: { height: 320 } }));
    assert.equal(out.api!.visible, true);
    assert.equal(out.api!.height, 320);
    assert.equal(out.api!.duration, 250);
    assert.equal(out.visible, true);
    act(() => m.emit("keyboardDidShow", { endCoordinates: { height: 1 } })); // wrong platform event: ignored
    assert.equal(out.api!.height, 320);
    act(() => m.emit("keyboardWillHide", { duration: 200 }));
    assert.deepEqual([out.api!.visible, out.api!.height, out.api!.duration], [false, 0, 200]);
    act(() => r.unmount());
  });

  it("selects keyboardDid* events on Android and on any non-iOS platform", () => {
    for (const platform of ["android", "web"]) {
      const m = mockHost();
      const out: { api?: KeyboardApi } = {};
      act(() => {
        TestRenderer.create(<Probe out={out} host={m.host} platform={platform} />);
      });
      assert.deepEqual(m.log.added.slice(0, 2), ["keyboardDidShow", "keyboardDidHide"]);
      act(() => m.emit("keyboardDidShow", { duration: 100, endCoordinates: { height: 280 } }));
      assert.equal(out.api!.height, 280);
      act(() => m.emit("keyboardWillShow", { endCoordinates: { height: 9 } }));
      assert.equal(out.api!.height, 280);
    }
  });

  it("sanitises missing or invalid payload fields to 0", () => {
    const m = mockHost();
    const out: { api?: KeyboardApi } = {};
    act(() => {
      TestRenderer.create(<Probe out={out} host={m.host} platform="android" />);
    });
    act(() => m.emit("keyboardDidShow", { duration: NaN, endCoordinates: { height: -5 } }));
    assert.deepEqual([out.api!.visible, out.api!.height, out.api!.duration], [true, 0, 0]);
    act(() => m.emit("keyboardDidShow"));
    assert.equal(out.api!.visible, true);
  });

  it("removes every listener on unmount (once per subscription) and resubscribes when the platform changes", () => {
    const m = mockHost();
    const out: { api?: KeyboardApi } = {};
    let r!: TestRenderer.ReactTestRenderer;
    act(() => {
      r = TestRenderer.create(<Probe out={out} host={m.host} platform="ios" />);
    });
    // The probe mounts two hooks (useKeyboard + useKeyboardVisible): 2 subscriptions each.
    assert.equal(m.count(), 4);
    act(() => r.update(<Probe out={out} host={m.host} platform="android" />));
    assert.equal(m.log.removed, 4);
    assert.equal(m.count(), 4);
    act(() => r.unmount());
    assert.equal(m.log.removed, 8);
    assert.equal(m.count(), 0);
    assert.equal(m.log.added.length, 8);
  });

  it("dismiss calls Keyboard.dismiss on the host and keeps a stable identity", () => {
    const m = mockHost();
    const out: { api?: KeyboardApi } = {};
    act(() => {
      TestRenderer.create(<Probe out={out} host={m.host} platform="ios" />);
    });
    const first = out.api!.dismiss;
    out.api!.dismiss();
    assert.equal(m.log.dismissed, 1);
    act(() => m.emit("keyboardWillShow", { endCoordinates: { height: 10 } }));
    assert.equal(out.api!.dismiss, first);
  });

  it("is inert with no keyboard host (web/SSR shim has none): visible false, dismiss no-op", () => {
    const out: { api?: KeyboardApi } = {};
    act(() => {
      TestRenderer.create(<Probe out={out} />);
    });
    assert.deepEqual([out.api!.visible, out.api!.height, out.api!.duration], [false, 0, 0]);
    assert.doesNotThrow(() => out.api!.dismiss());
    assert.doesNotThrow(() => dismissKeyboard());
  });

  it("dismissKeyboard swallows a throwing host", () => {
    const host: KeyboardHost = { addListener: () => ({ remove() {} }), dismiss: () => { throw new Error("no"); } };
    assert.doesNotThrow(() => dismissKeyboard(host));
  });
});

describe("KeyboardAvoidingContainer", () => {
  function Recorder(props: Record<string, unknown>) {
    return React.createElement("Avoiding", props, props.children as React.ReactNode);
  }

  const render = (props: Record<string, unknown>) => {
    let r!: TestRenderer.ReactTestRenderer;
    act(() => {
      r = TestRenderer.create(
        <KeyboardAvoidingContainer component={Recorder as never} {...props}>
          <>{"child"}</>
        </KeyboardAvoidingContainer>
      );
    });
    return r.root.findByType("Avoiding" as never).props;
  };

  it("defaults behavior to padding on iOS and height on Android", () => {
    assert.equal(render({ platform: "ios" }).behavior, "padding");
    assert.equal(render({ platform: "android" }).behavior, "height");
    assert.equal(defaultAvoidingBehavior("web"), undefined);
    assert.equal(render({ platform: "web" }).behavior, undefined);
  });

  it("passes offset, enabled, explicit behavior and testID; fills the space", () => {
    const p = render({ platform: "ios", offset: 64, enabled: false, behavior: "position", testID: "kav" });
    assert.equal(p.keyboardVerticalOffset, 64);
    assert.equal(p.enabled, false);
    assert.equal(p.behavior, "position");
    assert.equal(p.testID, "kav");
    assert.deepEqual(p.style, [{ flex: 1 }, undefined]);
    assert.equal(render({ platform: "ios" }).keyboardVerticalOffset, 0);
  });

  it("falls back to the react-native View when KeyboardAvoidingView is missing and adds no accessibility role", () => {
    let r!: TestRenderer.ReactTestRenderer;
    act(() => {
      r = TestRenderer.create(<KeyboardAvoidingContainer platform="ios">{"x"}</KeyboardAvoidingContainer>);
    });
    const props = r.root.findByType("View" as never).props;
    assert.equal(props.accessibilityRole, undefined);
    assert.equal(props.behavior, "padding");
  });
});

describe("DismissKeyboardView", () => {
  it("calls Keyboard.dismiss on an outside press but not on a child press", () => {
    const m = mockHost();
    let childPressed = 0;
    let r!: TestRenderer.ReactTestRenderer;
    act(() => {
      r = TestRenderer.create(
        <DismissKeyboardView host={m.host} testID="outer">
          <ReactNativeChild onPress={() => childPressed++} />
        </DismissKeyboardView>
      );
    });
    const outer = r.root.find((n) => n.props.testID === "outer" && typeof n.type === "string");
    act(() => outer.props.onPress());
    assert.equal(m.log.dismissed, 1);
    // A child that handles its own press claims the responder: the wrapper's onPress is not invoked.
    const child = r.root.findByType("ChildButton" as never);
    act(() => child.props.onPress());
    assert.equal(childPressed, 1);
    assert.equal(m.log.dismissed, 1);
  });

  it("is non-accessible, adds no role, and can be disabled", () => {
    const m = mockHost();
    let r!: TestRenderer.ReactTestRenderer;
    act(() => {
      r = TestRenderer.create(
        <DismissKeyboardView host={m.host} enabled={false} testID="outer">
          {"x"}
        </DismissKeyboardView>
      );
    });
    const outer = r.root.find((n) => n.props.testID === "outer" && typeof n.type === "string");
    assert.equal(outer.props.accessible, false);
    assert.equal(outer.props.accessibilityRole, undefined);
    assert.equal(outer.props.disabled, true);
  });
});

function ReactNativeChild(props: { onPress: () => void }) {
  return React.createElement("ChildButton", props);
}
