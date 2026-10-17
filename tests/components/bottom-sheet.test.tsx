import React, { useState } from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import TestRenderer, { act, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { Text, ThemeProvider } from "../../src";
import { BottomSheet, createPanResponderDriver, resolveSnap, resolveSnapHeights } from "../../src/components/BottomSheet/index.js";
import type { BottomSheetProps, DragCallbacks, GestureDriver } from "../../src/components/BottomSheet/index.js";
import { OverlayHost, type BackHandlerLike, type KeyEventTargetLike } from "../../src/components/Portal/index.js";

const WINDOW = 800; // useWindowDimensions() height of the test shim

const flatten = (style: unknown): Record<string, any> => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));

function fakeBackHandler() {
  let handler: (() => boolean | null | undefined) | undefined;
  const backHandler: BackHandlerLike = {
    addEventListener(_event, h) {
      handler = h;
      return { remove: () => void (handler = undefined) };
    },
  };
  return { backHandler, press: () => handler?.() };
}

function fakeKeyTarget() {
  let listener: ((event: { key?: string; preventDefault?: () => void }) => void) | undefined;
  const keyTarget: KeyEventTargetLike = {
    addEventListener: (_type, l) => void (listener = l),
    removeEventListener: (_type, l) => void (listener === l && (listener = undefined)),
  };
  return { keyTarget, key: (key: string) => listener?.({ key, preventDefault: () => undefined }) };
}

/** A gesture driver that hands the drag callbacks to the test. */
function fakeDriver() {
  const ref: { cb?: DragCallbacks } = {};
  const driver: GestureDriver = {
    createHandlers(cb) {
      ref.cb = cb;
      return { "data-fake-drag": true };
    },
  };
  return {
    driver,
    drag(dy: number, vy: number) {
      act(() => {
        ref.cb!.onStart();
        ref.cb!.onMove(dy);
        ref.cb!.onEnd(dy, vy);
      });
    },
  };
}

function setup(props: Partial<BottomSheetProps> & { children?: React.ReactNode } = {}) {
  const back = fakeBackHandler();
  const keys = fakeKeyTarget();
  const calls: boolean[] = [];
  let closeCalls = 0;
  let renderer!: ReactTestRenderer;
  const element = (
    <ThemeProvider preference="light">
      <OverlayHost backHandler={back.backHandler} keyTarget={keys.keyTarget}>
        <BottomSheet
          open
          testID="sheet"
          onOpenChange={(o) => calls.push(o)}
          onClose={() => void (closeCalls += 1)}
          {...props}
        >
          {props.children ?? <Text>Body</Text>}
        </BottomSheet>
      </OverlayHost>
    </ThemeProvider>
  );
  act(() => {
    renderer = TestRenderer.create(element);
  });
  return { renderer, back, keys, calls, closeCalls: () => closeCalls };
}

const sheet = (r: ReactTestRenderer) => r.root.findAll((n) => (n.type as unknown) === "View" && n.props.testID === "sheet")[0];
const backdrop = (r: ReactTestRenderer): ReactTestInstance =>
  r.root.findAll((n) => (n.type as unknown) === "Pressable" && n.props.accessibilityRole === "button")[0]!;
const handle = (r: ReactTestRenderer): ReactTestInstance => r.root.findAll((n) => n.props["data-fake-drag"] === true)[0]!;
const translateY = (r: ReactTestRenderer) => flatten(sheet(r)!.props.style).transform[0].translateY as number;

describe("resolveSnapHeights", () => {
  it("resolves pixels, percentages and measured content, ascending and clamped", () => {
    assert.deepEqual(resolveSnapHeights([300, "25%", "content"], 800, 150), [150, 200, 300]);
    assert.deepEqual(resolveSnapHeights([2000], 800), [800]);
  });
  it("drops invalid points and an unmeasured content", () => {
    assert.deepEqual(resolveSnapHeights([-5, Number.NaN, "content", "x%" as never, "50%"], 800), [400]);
  });
});

describe("resolveSnap", () => {
  const heights = [200, 400, 600];
  it("a slow release goes to the nearest snap", () => {
    assert.deepEqual(resolveSnap({ heights, currentHeight: 430, velocity: 0.1 }), { type: "snap", index: 1 });
    assert.deepEqual(resolveSnap({ heights, currentHeight: 520, velocity: -0.1 }), { type: "snap", index: 2 });
  });
  it("a fling up goes to the next higher snap even when another one is nearer", () => {
    assert.deepEqual(resolveSnap({ heights, currentHeight: 250, velocity: -1 }), { type: "snap", index: 1 });
  });
  it("a fling down goes to the next lower snap even when another one is nearer", () => {
    assert.deepEqual(resolveSnap({ heights, currentHeight: 550, velocity: 1 }), { type: "snap", index: 1 });
  });
  it("a fling up from the highest stays on it", () => {
    assert.deepEqual(resolveSnap({ heights, currentHeight: 600, velocity: -2 }), { type: "snap", index: 2 });
  });
  it("a fling down from the lowest dismisses", () => {
    assert.deepEqual(resolveSnap({ heights, currentHeight: 200, velocity: 0.9 }), { type: "dismiss" });
  });
  it("a slow release below half of the lowest snap dismisses, above it does not", () => {
    assert.deepEqual(resolveSnap({ heights, currentHeight: 99, velocity: 0 }), { type: "dismiss" });
    assert.deepEqual(resolveSnap({ heights, currentHeight: 101, velocity: 0 }), { type: "snap", index: 0 });
  });
  it("velocity just under the fling threshold is not a fling", () => {
    assert.deepEqual(resolveSnap({ heights, currentHeight: 390, velocity: -0.49 }), { type: "snap", index: 1 });
  });
  it("without snaps it dismisses", () => {
    assert.deepEqual(resolveSnap({ heights: [], currentHeight: 100, velocity: 0 }), { type: "dismiss" });
  });
});

describe("BottomSheet heights", () => {
  it("snap collapsed vs expanded (original API) use 35% and 70% of the window", () => {
    const collapsed = setup({ snap: "collapsed" });
    const expanded = setup({ snap: "expanded" });
    assert.equal(flatten(sheet(collapsed.renderer)!.props.style).height, WINDOW * 0.7);
    assert.equal(translateY(collapsed.renderer), WINDOW * 0.7 - WINDOW * 0.35);
    assert.equal(translateY(expanded.renderer), 0);
  });

  it("snapIndex picks the height of the snapPoints entry and follows the prop", () => {
    const r = setup({ snapPoints: [200, "50%", 600], snapIndex: 0 });
    assert.equal(translateY(r.renderer), 400);
    const pointsAt = (i: number) => (
      <ThemeProvider preference="light">
        <OverlayHost>
          <BottomSheet open testID="sheet" snapPoints={[200, "50%", 600]} snapIndex={i}>
            <Text>Body</Text>
          </BottomSheet>
        </OverlayHost>
      </ThemeProvider>
    );
    let renderer!: ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(pointsAt(1));
    });
    assert.equal(translateY(renderer), 200);
    act(() => renderer.update(pointsAt(2)));
    assert.equal(translateY(renderer), 0);
  });
});

describe("BottomSheet open state", () => {
  it("renders nothing when closed and supports defaultOpen and the visible alias", () => {
    const closed = setup({ open: false });
    assert.equal(sheet(closed.renderer), undefined);
    const dflt = setup({ open: undefined, defaultOpen: true });
    assert.ok(sheet(dflt.renderer));
    const legacy = setup({ open: undefined, visible: true });
    assert.ok(sheet(legacy.renderer));
  });

  it("uncontrolled: a dismissal closes the sheet", () => {
    const r = setup({ open: undefined, defaultOpen: true });
    act(() => void r.back.press());
    assert.equal(sheet(r.renderer), undefined);
    assert.deepEqual(r.calls, [false]);
  });
});

describe("BottomSheet dismissal paths call onOpenChange(false) exactly once", () => {
  it("Android hardwareBackPress (BackHandler mock)", () => {
    const r = setup();
    let handled: unknown;
    act(() => void (handled = r.back.press()));
    assert.equal(handled, true);
    assert.deepEqual(r.calls, [false]);
    assert.equal(r.closeCalls(), 1);
  });

  it("Escape keydown on web", () => {
    const r = setup();
    act(() => r.keys.key("Enter"));
    assert.deepEqual(r.calls, []);
    act(() => r.keys.key("Escape"));
    assert.deepEqual(r.calls, [false]);
    assert.equal(r.closeCalls(), 1);
  });

  it("backdrop press", () => {
    const r = setup();
    act(() => backdrop(r.renderer).props.onPress());
    assert.deepEqual(r.calls, [false]);
    assert.equal(r.closeCalls(), 1);
  });

  it("drag past the threshold", () => {
    const d = fakeDriver();
    const r = setup({ gestureDriver: d.driver, snapPoints: [400] });
    d.drag(300, 0); // 400 - 300 = 100 < 50% of 400
    assert.deepEqual(r.calls, [false]);
    assert.equal(r.closeCalls(), 1);
  });

  it("a short drag does not dismiss, and a fling down from the lowest snap does", () => {
    const d = fakeDriver();
    const r = setup({ gestureDriver: d.driver, snapPoints: [400] });
    d.drag(100, 0.1);
    assert.deepEqual(r.calls, []);
    d.drag(20, 1.2);
    assert.deepEqual(r.calls, [false]);
  });

  it("the sheet content and a disabled backdrop do not dismiss", () => {
    const r = setup({ dismissOnBackdrop: false });
    assert.equal(r.renderer.root.findAll((n) => (n.type as unknown) === "Pressable" && n.props.accessibilityRole === "button").length, 0);
    assert.deepEqual(r.calls, []);
  });

  it("a controlled sheet that stays open keeps its snap after a rejected dismissal", () => {
    const d = fakeDriver();
    const r = setup({ gestureDriver: d.driver, snapPoints: [400, 800], snapIndex: 1 });
    d.drag(700, 0);
    assert.deepEqual(r.calls, [false]);
    assert.equal(translateY(r.renderer), 0);
  });

  it("the screen-reader close action on the handle dismisses once", () => {
    const d = fakeDriver();
    const r = setup({ gestureDriver: d.driver, closeActionLabel: "Dismiss sheet" });
    const h = handle(r.renderer);
    assert.deepEqual(h.props.accessibilityActions, [{ name: "dismiss", label: "Dismiss sheet" }]);
    act(() => h.props.onAccessibilityAction({ nativeEvent: { actionName: "other" } }));
    assert.deepEqual(r.calls, []);
    act(() => h.props.onAccessibilityAction({ nativeEvent: { actionName: "dismiss" } }));
    assert.deepEqual(r.calls, [false]);
  });
});

describe("BottomSheet snapping by drag", () => {
  it("reports the new snap index (uncontrolled) and moves the sheet", () => {
    const d = fakeDriver();
    const changes: number[] = [];
    const r = setup({ gestureDriver: d.driver, snapPoints: [200, 400, 600], defaultSnapIndex: 2, onSnapIndexChange: (i) => changes.push(i) });
    assert.equal(translateY(r.renderer), 0);
    d.drag(190, 0); // height 410 -> nearest 400
    assert.deepEqual(changes, [1]);
    assert.equal(translateY(r.renderer), 200);
    d.drag(0, 0.9); // fling down... from 400 to 200
    assert.deepEqual(changes, [1, 0]);
  });

  it("controlled: the sheet follows snapIndex, not the drag", () => {
    const d = fakeDriver();
    const changes: number[] = [];
    const r = setup({ gestureDriver: d.driver, snapPoints: [200, 600], snapIndex: 1, onSnapIndexChange: (i) => changes.push(i) });
    d.drag(400, 0);
    assert.deepEqual(changes, [0]);
    assert.equal(translateY(r.renderer), 0);
  });
});

describe("createPanResponderDriver", () => {
  it("maps grant, move and release/terminate onto the drag callbacks", () => {
    let config: Record<string, any> = {};
    const driver = createPanResponderDriver({
      create(c) {
        config = c;
        return { panHandlers: { marker: true } };
      },
    });
    const events: string[] = [];
    const handlers = driver.createHandlers({
      onStart: () => events.push("start"),
      onMove: (dy) => events.push(`move ${dy}`),
      onEnd: (dy, vy) => events.push(`end ${dy} ${vy}`),
    });
    assert.deepEqual(handlers, { marker: true });
    assert.equal(config.onStartShouldSetPanResponder(), true);
    assert.equal(config.onMoveShouldSetPanResponder({}, { dy: 1, vy: 0 }), false);
    assert.equal(config.onMoveShouldSetPanResponder({}, { dy: 5, vy: 0 }), true);
    assert.equal(config.onPanResponderTerminationRequest(), false);
    config.onPanResponderGrant();
    config.onPanResponderMove({}, { dy: 7, vy: 0 });
    config.onPanResponderRelease({}, { dy: 9, vy: 0.3 });
    config.onPanResponderTerminate({}, { dy: 3, vy: 0 });
    assert.deepEqual(events, ["start", "move 7", "end 9 0.3", "end 3 0"]);
  });
});

describe("BottomSheet accessibility and source", () => {
  it("is a modal dialog with a labelled backdrop button", () => {
    const r = setup({ accessibilityLabel: "Filters", dismissLabel: "Close filters" });
    const dialog = r.renderer.root.findAll((n) => typeof n.type === "string" && n.props.role === "dialog")[0]!;
    assert.equal(dialog.props["aria-modal"], true);
    assert.equal(dialog.props.accessibilityViewIsModal, true);
    assert.equal(dialog.props.accessibilityLabel, "Filters");
    assert.equal(backdrop(r.renderer).props.accessibilityLabel, "Close filters");
    const modalLayers = r.renderer.root.findAll((n) => (n.type as unknown) === "View" && n.props.accessibilityViewIsModal === true);
    assert.ok(modalLayers.length > 0);
  });

  it("works through a parent state (onOpenChange as setter)", () => {
    const back = fakeBackHandler();
    function App() {
      const [open, setOpen] = useState(true);
      return (
        <ThemeProvider preference="light">
          <OverlayHost backHandler={back.backHandler}>
            <BottomSheet open={open} onOpenChange={setOpen} testID="sheet">
              <Text>Body</Text>
            </BottomSheet>
          </OverlayHost>
        </ThemeProvider>
      );
    }
    let r!: ReactTestRenderer;
    act(() => {
      r = TestRenderer.create(<App />);
    });
    assert.ok(sheet(r));
    act(() => void back.press());
    assert.equal(sheet(r), undefined);
  });

  it("BottomSheet.tsx has no `as any` and does not subscribe to BackHandler itself", () => {
    const source = readFileSync(new URL("../../src/components/BottomSheet/BottomSheet.tsx", import.meta.url), "utf8");
    assert.ok(!/\bas any\b/.test(source));
    assert.ok(!source.includes("BackHandler"));
  });
});
