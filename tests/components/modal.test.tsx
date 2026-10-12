import React, { createRef } from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import TestRenderer, { act, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { Text, ThemeProvider } from "../../src";
import { Modal, type ModalProps } from "../../src/components/Modal/index.js";
import { setModalAccessibilityHost, type ModalAccessibilityHost } from "../../src/components/Modal/host.js";
import { MotionProvider } from "../../src/motion/MotionProvider.js";
import type { MotionEngine, MotionHandle, MotionValue } from "../../src/motion/engine.js";
import { CapabilityProvider } from "../../src/native/core/index.js";
import { createMockAdapters } from "../../src/native/testing/index.js";
import { darkColors, lightColors } from "../../src/tokens/colors.base.js";
import { getAccessibleTree } from "../helpers/accessibility-tree";

const noop = () => undefined;

function mount(element: React.ReactElement, options: { preference?: "light" | "dark"; reduceMotion?: boolean; engine?: MotionEngine; motion?: "system" | "always" | "never" } = {}): ReactTestRenderer {
  const mocks = createMockAdapters();
  mocks.setAccessibility({ reduceMotion: options.reduceMotion ?? false });
  let renderer!: ReactTestRenderer;
  const tree = (
    <CapabilityProvider adapters={mocks.adapters}>
      <MotionProvider {...(options.engine ? { engine: options.engine } : {})} reduceMotion={options.motion ?? "system"}>
        <ThemeProvider preference={options.preference ?? "light"}>{element}</ThemeProvider>
      </MotionProvider>
    </CapabilityProvider>
  );
  act(() => {
    renderer = TestRenderer.create(tree);
  });
  return renderer;
}

const flatten = (style: unknown): Record<string, any> => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));
const isType = (n: ReactTestInstance, type: string): boolean => (n.type as unknown) === type;
const hostsOf = (r: ReactTestRenderer, type: string): ReactTestInstance[] => r.root.findAll((n) => isType(n, type));
const nativeModal = (r: ReactTestRenderer) => hostsOf(r, "Modal")[0]!;
const dialog = (r: ReactTestRenderer) => r.root.findAll((n) => typeof n.type === "string" && n.props.role === "dialog")[0]!;
const backdropButton = (r: ReactTestRenderer) =>
  r.root.findAll((n) => isType(n, "Pressable") && n.props.accessibilityRole === "button")[0];

/** An engine that records every timing/spring and finishes them only when `flush()` is called. */
function controlledEngine() {
  const pending: Array<() => void> = [];
  const timings: Array<{ to: number; duration: number }> = [];
  const make = (value: MotionValue, to: number): MotionHandle => ({
    start(onEnd) {
      pending.push(() => {
        value.setValue(to);
        onEnd?.({ finished: true });
      });
    },
    stop() {},
  });
  const engine: MotionEngine = {
    createValue(initial) {
      const v = { current: initial, setValue(next: number) { v.current = next; } };
      return v;
    },
    timing(value, to, config) {
      timings.push({ to, duration: config.duration });
      return make(value, to);
    },
    spring: (value, to) => make(value, to),
    loop: (handle) => handle,
    stop() {},
  };
  return {
    engine,
    timings,
    flush() {
      act(() => {
        while (pending.length > 0) pending.shift()!();
      });
    },
  };
}

describe("Modal dismissal", () => {
  it("calls onClose once for a backdrop press", () => {
    let closes = 0;
    const r = mount(<Modal visible onClose={() => (closes += 1)}><Text>Body</Text></Modal>);
    act(() => backdropButton(r)!.props.onPress());
    assert.equal(closes, 1);
  });

  it("calls onClose once for onRequestClose (Android back, Escape on web through React Native Web)", () => {
    let closes = 0;
    const r = mount(<Modal visible onClose={() => (closes += 1)}><Text>Body</Text></Modal>);
    act(() => nativeModal(r).props.onRequestClose());
    assert.equal(closes, 1);
  });

  it("ignores the backdrop when dismissOnBackdrop is false but still honours onRequestClose", () => {
    let closes = 0;
    const r = mount(<Modal visible dismissOnBackdrop={false} onClose={() => (closes += 1)}><Text>Body</Text></Modal>);
    assert.equal(backdropButton(r), undefined);
    assert.equal(r.root.findAll((n) => isType(n, "Pressable")).length, 0);
    act(() => nativeModal(r).props.onRequestClose());
    assert.equal(closes, 1);
  });

  it("does not call onClose by itself or when the content is pressed", () => {
    let closes = 0;
    const r = mount(<Modal visible onClose={() => (closes += 1)}><Text>Body</Text></Modal>);
    assert.equal(closes, 0);
    const pressables = r.root.findAll((n) => isType(n, "Pressable"));
    assert.equal(pressables.length, 1, "only the backdrop is pressable");
    assert.equal(dialog(r).findAll((n) => isType(n, "Pressable")).length, 0, "the dialog is not inside a pressable");
  });
});

describe("Modal accessibility", () => {
  it("exposes a modal dialog with accessibilityViewIsModal, role and aria-modal", () => {
    const r = mount(<Modal visible onClose={noop} accessibilityLabel="Delete file"><Text>Body</Text></Modal>);
    const d = dialog(r);
    assert.equal(d.props.accessibilityViewIsModal, true);
    assert.equal(d.props["aria-modal"], true);
    assert.equal(d.props.role, "dialog");
    assert.equal(d.props.accessibilityLabel, "Delete file");
  });

  it("labels the dialog from the title and links the heading with aria-labelledby", () => {
    const r = mount(<Modal visible onClose={noop} title="Delete file"><Text>Body</Text></Modal>);
    const d = dialog(r);
    assert.equal(d.props.accessibilityLabel, "Delete file");
    const labelledBy = d.props["aria-labelledby"];
    assert.equal(typeof labelledBy, "string");
    const heading = r.root.findAll((n) => isType(n, "Text") && n.props.nativeID === labelledBy);
    assert.equal(heading.length, 1);
    assert.deepEqual(heading[0]!.children, ["Delete file"]);
  });

  it("lets accessibilityLabel win over the title and forwards accessibilityDescribedBy", () => {
    const r = mount(
      <Modal visible onClose={noop} title="Visible title" accessibilityLabel="Spoken name" accessibilityDescribedBy="body-id"><Text nativeID="body-id">Body</Text></Modal>
    );
    assert.equal(dialog(r).props.accessibilityLabel, "Spoken name");
    assert.equal(dialog(r).props["aria-describedby"], "body-id");
  });

  it("has no label, no aria-labelledby and no heading without a title or label", () => {
    const r = mount(<Modal visible onClose={noop}><Text>Body</Text></Modal>);
    assert.equal(dialog(r).props.accessibilityLabel, undefined);
    assert.equal(dialog(r).props["aria-labelledby"], undefined);
    assert.equal(hostsOf(r, "Text").length, 1);
  });

  it("gives the backdrop dismiss action a button role and a label (default and custom)", () => {
    const first = mount(<Modal visible onClose={noop}><Text>Body</Text></Modal>);
    assert.equal(backdropButton(first)!.props.accessibilityLabel, "Close dialog");
    const second = mount(<Modal visible onClose={noop} dismissLabel="Chiudi"><Text>Body</Text></Modal>);
    assert.equal(backdropButton(second)!.props.accessibilityLabel, "Chiudi");
  });

  it("keeps the dialog content its own element instead of grouping it inside the backdrop", () => {
    const r = mount(<Modal visible onClose={noop}><Text>Dialog body</Text></Modal>);
    const tree = getAccessibleTree(r);
    const body = tree.find((n) => n.type === "Text" && n.text === "Dialog body");
    assert.ok(body, "the body is reachable on its own");
    const backdrop = tree.find((n) => n.role === "button");
    assert.ok(backdrop, "the backdrop is a separate button element");
    assert.ok(!backdrop!.text.includes("Dialog body"), "the backdrop does not swallow the body text");
    assert.ok(tree.indexOf(backdrop!) < tree.indexOf(body!), "the backdrop comes first, the dialog last");
  });
});

describe("Modal screen-reader focus", () => {
  function withHost<T>(fn: (calls: Array<[string, unknown]>) => T): T {
    const calls: Array<[string, unknown]> = [];
    const host: ModalAccessibilityHost = {
      announce: (message) => void calls.push(["announce", message]),
      focus: (node) => void calls.push(["focus", node]),
    };
    const restore = setModalAccessibilityHost(host);
    try {
      return fn(calls);
    } finally {
      restore();
    }
  }

  it("announces the label once when the dialog opens, not on later renders, and not when closed", () => {
    withHost((calls) => {
      const r = mount(<Modal visible={false} onClose={noop} title="Delete file"><Text>Body</Text></Modal>);
      assert.deepEqual(calls, []);
      act(() => r.update(<ThemeProvider><Modal visible onClose={noop} title="Delete file"><Text>Body</Text></Modal></ThemeProvider>));
      assert.deepEqual(calls.filter((c) => c[0] === "announce"), [["announce", "Delete file"]]);
      act(() => r.update(<ThemeProvider><Modal visible onClose={noop} title="Delete file" size="lg"><Text>Body</Text></Modal></ThemeProvider>));
      assert.equal(calls.filter((c) => c[0] === "announce").length, 1);
    });
  });

  it("moves the focus to initialFocusRef on open and to restoreFocusRef on close", () => {
    withHost((calls) => {
      const initial = { current: { id: "first-field" } };
      const restore = { current: { id: "trigger" } };
      const element = (visible: boolean) => (
        <ThemeProvider>
          <Modal visible={visible} onClose={noop} animationType="none" initialFocusRef={initial} restoreFocusRef={restore}><Text>Body</Text></Modal>
        </ThemeProvider>
      );
      let r!: ReactTestRenderer;
      act(() => {
        r = TestRenderer.create(element(true));
      });
      assert.deepEqual(calls, [["focus", initial.current]]);
      act(() => r.update(element(false)));
      assert.deepEqual(calls.slice(1), [["focus", restore.current]]);
    });
  });

  it("does nothing when there is no label and no ref, and survives unset refs", () => {
    withHost((calls) => {
      const empty = createRef<unknown>();
      const r = mount(<Modal visible onClose={noop} initialFocusRef={empty} restoreFocusRef={empty}><Text>Body</Text></Modal>);
      assert.deepEqual(calls, [["focus", null]]);
      act(() => r.unmount());
    });
  });

  it("the default host never throws without AccessibilityInfo (SSR and the test shim)", () => {
    const r = mount(<Modal visible onClose={noop} title="Title"><Text>Body</Text></Modal>);
    act(() => r.unmount());
  });
});

describe("Modal animation", () => {
  it("animationType none follows visible immediately and runs no animation", () => {
    const { engine, timings } = controlledEngine();
    const element = (visible: boolean) => <Modal visible={visible} onClose={noop} animationType="none"><Text>Body</Text></Modal>;
    const r = mount(element(true), { engine });
    assert.equal(nativeModal(r).props.visible, true);
    act(() => r.update(<CapabilityProvider adapters={createMockAdapters().adapters}><MotionProvider engine={engine}><ThemeProvider>{element(false)}</ThemeProvider></MotionProvider></CapabilityProvider>));
    assert.equal(nativeModal(r).props.visible, false);
    assert.equal(timings.length, 0);
  });

  it("fade: animates in, and keeps the native modal open until the exit animation ends", () => {
    const { engine, timings, flush } = controlledEngine();
    const wrap = (visible: boolean) => (
      <CapabilityProvider adapters={createMockAdapters().adapters}>
        <MotionProvider engine={engine}>
          <ThemeProvider><Modal visible={visible} onClose={noop}><Text>Body</Text></Modal></ThemeProvider>
        </MotionProvider>
      </CapabilityProvider>
    );
    let r!: ReactTestRenderer;
    act(() => {
      r = TestRenderer.create(wrap(true));
    });
    assert.ok(timings.length > 0, "the enter animation runs through the motion engine");
    flush();
    assert.equal(nativeModal(r).props.visible, true);
    const before = timings.length;
    act(() => r.update(wrap(false)));
    assert.ok(timings.length > before, "the exit animation runs");
    assert.equal(nativeModal(r).props.visible, true, "still open while the exit runs");
    flush();
    assert.equal(nativeModal(r).props.visible, false, "closed once the exit ends");
    act(() => r.update(wrap(true)));
    assert.equal(nativeModal(r).props.visible, true, "reopens immediately");
  });

  it("slide animates through the same engine", () => {
    const { engine, timings } = controlledEngine();
    mount(<Modal visible onClose={noop} animationType="slide"><Text>Body</Text></Modal>, { engine });
    assert.ok(timings.length > 0);
  });

  it("under reduced motion (system setting mocked true) no animation is created and the modal closes at once", () => {
    const { engine, timings } = controlledEngine();
    const wrap = (visible: boolean) => (
      <CapabilityProvider adapters={reducedAdapters()}>
        <MotionProvider engine={engine}>
          <ThemeProvider><Modal visible={visible} onClose={noop}><Text>Body</Text></Modal></ThemeProvider>
        </MotionProvider>
      </CapabilityProvider>
    );
    let r!: ReactTestRenderer;
    act(() => {
      r = TestRenderer.create(wrap(true));
    });
    assert.equal(nativeModal(r).props.visible, true);
    act(() => r.update(wrap(false)));
    assert.equal(timings.length, 0, "engine.timing was never called");
    assert.equal(nativeModal(r).props.visible, false);
  });

  it("MotionProvider reduceMotion='always' also skips every animation", () => {
    const { engine, timings } = controlledEngine();
    const r = mount(<Modal visible onClose={noop}><Text>Body</Text></Modal>, { engine, motion: "always" });
    act(() => r.update(<CapabilityProvider adapters={createMockAdapters().adapters}><MotionProvider engine={engine} reduceMotion="always"><ThemeProvider><Modal visible={false} onClose={noop}><Text>Body</Text></Modal></ThemeProvider></MotionProvider></CapabilityProvider>));
    assert.equal(timings.length, 0);
    assert.equal(nativeModal(r).props.visible, false);
  });
});

function reducedAdapters() {
  const mocks = createMockAdapters();
  mocks.setAccessibility({ reduceMotion: true });
  return mocks.adapters;
}

describe("Modal closing and animated layout", () => {
  const adapters = () => createMockAdapters().adapters;
  const wrap = (engine: MotionEngine, modal: React.ReactElement) => (
    <CapabilityProvider adapters={adapters()}>
      <MotionProvider engine={engine}>
        <ThemeProvider>{modal}</ThemeProvider>
      </MotionProvider>
    </CapabilityProvider>
  );

  it("restores the screen-reader focus only after the animated exit has finished", () => {
    const calls: Array<[string, unknown]> = [];
    const restoreHost = setModalAccessibilityHost({ announce: () => undefined, focus: (node) => void calls.push(["focus", node]) });
    try {
      const { engine, flush } = controlledEngine();
      const trigger = { current: { id: "trigger" } };
      const el = (visible: boolean) => wrap(engine, <Modal visible={visible} onClose={noop} restoreFocusRef={trigger}><Text>Body</Text></Modal>);
      let r!: ReactTestRenderer;
      act(() => {
        r = TestRenderer.create(el(true));
      });
      flush();
      const opened = calls.length;
      act(() => r.update(el(false)));
      assert.equal(calls.length, opened, "not restored while the exit runs and the native modal is open");
      flush();
      assert.deepEqual(calls.slice(opened), [["focus", trigger.current]]);
    } finally {
      restoreHost();
    }
  });

  it("ignores a second dismissal (Escape or back press) while the exit animation runs", () => {
    const { engine, flush } = controlledEngine();
    let closes = 0;
    const el = (visible: boolean) => wrap(engine, <Modal visible={visible} onClose={() => (closes += 1)}><Text>Body</Text></Modal>);
    let r!: ReactTestRenderer;
    act(() => {
      r = TestRenderer.create(el(true));
    });
    flush();
    act(() => nativeModal(r).props.onRequestClose());
    assert.equal(closes, 1);
    act(() => r.update(el(false)));
    assert.equal(nativeModal(r).props.visible, true, "still presented during the exit");
    act(() => nativeModal(r).props.onRequestClose());
    assert.equal(closes, 1, "the second request is ignored");
    flush();
  });

  it("does not leave an invisible native modal open after switching animationType from none to fade", () => {
    const { engine } = controlledEngine();
    const el = (visible: boolean, animationType: "none" | "fade") => wrap(engine, <Modal visible={visible} animationType={animationType} onClose={noop}><Text>Body</Text></Modal>);
    let r!: ReactTestRenderer;
    act(() => {
      r = TestRenderer.create(el(true, "none"));
    });
    act(() => r.update(el(false, "none")));
    assert.equal(nativeModal(r).props.visible, false);
    act(() => r.update(el(false, "fade")));
    assert.equal(nativeModal(r).props.visible, false, "stale state must not reopen the modal");
  });

  it("slide starts from a different place than fade", () => {
    const initials = (animationType: "fade" | "slide") => {
      const seen: number[] = [];
      const { engine } = controlledEngine();
      const recording: MotionEngine = { ...engine, createValue: (initial) => (seen.push(initial), engine.createValue(initial)) };
      mount(<Modal visible onClose={noop} animationType={animationType}><Text>Body</Text></Modal>, { engine: recording });
      return seen.join(",");
    };
    assert.notEqual(initials("slide"), initials("fade"));
  });

  it("keeps the overlay touch-through, the dialog wrapper dialog-sized and the backdrop full-screen when animated", () => {
    const { engine } = controlledEngine();
    for (const [size, width] of [["sm", 360], ["lg", 640]] as const) {
      const r = mount(<Modal visible onClose={noop} size={size}><Text>Body</Text></Modal>, { engine });
      const frame = hostsOf(r, "View").find((n) => flatten(n.props.style).justifyContent === "center")!;
      assert.equal(frame.props.pointerEvents, "box-none");
      const wrapper = frame.findAll((n) => isType(n, "View") && flatten(n.props.style).maxWidth === width);
      assert.ok(wrapper.length > 0, `the animated wrapper is limited to ${width}`);
      const fill = backdropButton(r)!.parent!;
      assert.ok(fill.findAll((n) => isType(n, "View") && flatten(n.props.style).position === "absolute").length > 0 || flatten(fill.props.style).position === "absolute", "the backdrop wrapper is absolute-fill");
    }
  });
});

describe("Modal layout and theme", () => {
  it("uses the theme backdrop color, in both modes, and no literal rgba", () => {
    const light = mount(<Modal visible onClose={noop} animationType="none"><Text>Body</Text></Modal>, { preference: "light" });
    assert.equal(flatten(backdropButton(light)!.props.style).backgroundColor, lightColors.backdrop);
    const dark = mount(<Modal visible onClose={noop} animationType="none"><Text>Body</Text></Modal>, { preference: "dark" });
    assert.equal(flatten(backdropButton(dark)!.props.style).backgroundColor, darkColors.backdrop);
    assert.equal(nativeModal(dark).props.style, undefined, "the native modal carries no hardcoded background");
    const source = readFileSync(new URL("../../src/components/Modal/Modal.tsx", import.meta.url), "utf8");
    assert.doesNotMatch(source, /rgba?\(|#[0-9a-fA-F]{3,8}\b/);
  });

  it("maps size to the maximum width of the dialog", () => {
    for (const [size, width] of [["sm", 360], ["md", 480], ["lg", 640]] as const) {
      const r = mount(<Modal visible onClose={noop} animationType="none" size={size}><Text>Body</Text></Modal>);
      assert.equal(flatten(dialog(r).props.style).maxWidth, width);
    }
    const byDefault = mount(<Modal visible onClose={noop} animationType="none"><Text>Body</Text></Modal>);
    assert.equal(flatten(dialog(byDefault).props.style).maxWidth, 480);
  });

  it("adds the safe-area insets to the overlay padding and defaults them to zero", () => {
    const overlay = (r: ReactTestRenderer) => hostsOf(r, "View").find((n) => flatten(n.props.style).justifyContent === "center")!;
    const plain = mount(<Modal visible onClose={noop} animationType="none"><Text>Body</Text></Modal>);
    const base = flatten(overlay(plain).props.style);
    assert.equal(base.paddingTop, base.padding);
    assert.equal(base.paddingLeft, base.padding);
    const inset = mount(<Modal visible onClose={noop} animationType="none" insets={{ top: 44, bottom: 34, left: 10, right: 12 }}><Text>Body</Text></Modal>);
    const style = flatten(overlay(inset).props.style);
    assert.equal(style.paddingTop, base.padding + 44);
    assert.equal(style.paddingBottom, base.padding + 34);
    assert.equal(style.paddingLeft, base.padding + 10);
    assert.equal(style.paddingRight, base.padding + 12);
  });

  it("avoidKeyboard falls back to a plain View where KeyboardAvoidingView does not exist", () => {
    const r = mount(<Modal visible onClose={noop} animationType="none" avoidKeyboard><Text>Body</Text></Modal>);
    assert.equal(hostsOf(r, "Text").length, 1);
    assert.equal(dialog(r).props.accessibilityViewIsModal, true);
  });

  it("renders the children and closes the native modal when not visible", () => {
    const open = mount(<Modal visible onClose={noop} animationType="none"><Text>Body</Text></Modal>);
    assert.equal(nativeModal(open).props.visible, true);
    assert.equal(nativeModal(open).props.transparent, true);
    const closed = mount(<Modal visible={false} onClose={noop}><Text>Body</Text></Modal>);
    assert.equal(nativeModal(closed).props.visible, false);
  });
});

describe("Modal API compatibility", () => {
  it("accepts exactly the previous props (type-level, checked by tsc -p tsconfig.tests.json)", () => {
    const previous: ModalProps = { visible: true, onClose: noop, children: null, size: "lg", dismissOnBackdrop: false };
    const r = mount(<Modal {...previous} />);
    assert.equal(nativeModal(r).props.visible, true);
  });
});
