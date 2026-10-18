import React from "react";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import TestRenderer, { act } from "react-test-renderer";
import { Platform, Pressable } from "react-native";
import { Button, Text, ThemeProvider } from "../../src";
import { Popover } from "../../src/components/Popover/index.js";
import type { PopoverProps } from "../../src/components/Popover/index.js";
import { computePopoverPlacement } from "../../src/components/Popover/placement.js";
import { setModalAccessibilityHost } from "../../src/components/Modal/host.js";
import { OverlayHost, type BackHandlerLike, type KeyEventTargetLike } from "../../src/components/Portal/index.js";

const platform = Platform as { OS: string };
const originalOS = platform.OS;
afterEach(() => {
  platform.OS = originalOS;
});

const host = (name: string) => name as unknown as React.ElementType;
const flatten = (style: unknown): Record<string, any> => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));
const root = resolve(import.meta.dirname, "../..");

// Window of the test shim: 1280 x 800. A 40x20 trigger and a 100x50 content unless a test says otherwise.
const WINDOW = { width: 1280, height: 800 };
const CONTENT = { width: 100, height: 50 };

describe("PLRNUI-346 placement", () => {
  const anchor = { x: 600, y: 400, width: 40, height: 20 };
  const base = { anchor, content: CONTENT, window: WINDOW, gap: 8 };

  it("uses the preferred side when the content fits, centred on the trigger", () => {
    assert.deepEqual(computePopoverPlacement({ ...base, placement: "top" }), { x: 570, y: 342, placement: "top", flipped: false });
    assert.deepEqual(computePopoverPlacement({ ...base, placement: "bottom" }), { x: 570, y: 428, placement: "bottom", flipped: false });
    assert.deepEqual(computePopoverPlacement({ ...base, placement: "left" }), { x: 492, y: 385, placement: "left", flipped: false });
    assert.deepEqual(computePopoverPlacement({ ...base, placement: "right" }), { x: 648, y: 385, placement: "right", flipped: false });
  });

  it("flips top to bottom at the top edge, and bottom to top at the bottom edge", () => {
    const nearTop = computePopoverPlacement({ ...base, anchor: { ...anchor, y: 20 }, placement: "top" });
    assert.equal(nearTop.placement, "bottom");
    assert.equal(nearTop.flipped, true);
    assert.equal(nearTop.y, 48);
    const nearBottom = computePopoverPlacement({ ...base, anchor: { ...anchor, y: 770 }, placement: "bottom" });
    assert.equal(nearBottom.placement, "top");
    assert.equal(nearBottom.y, 712);
  });

  it("flips left to right at the left edge, and right to left at the right edge", () => {
    assert.equal(computePopoverPlacement({ ...base, anchor: { ...anchor, x: 10 }, placement: "left" }).placement, "right");
    const right = computePopoverPlacement({ ...base, anchor: { ...anchor, x: 1240 }, placement: "right" });
    assert.equal(right.placement, "left");
    assert.equal(right.x, 1132);
  });

  it("does not flip when the opposite side is no better", () => {
    // 60 px of room above and below, content 50 px high at gap 8: top fits, so nothing flips.
    const result = computePopoverPlacement({ ...base, anchor: { x: 600, y: 70, width: 40, height: 20 }, placement: "top" });
    assert.equal(result.placement, "top");
    assert.equal(result.flipped, false);
  });

  it("takes the side with more room when neither fits", () => {
    const tall = { width: 100, height: 900 };
    assert.equal(computePopoverPlacement({ ...base, content: tall, anchor: { ...anchor, y: 100 }, placement: "top" }).placement, "bottom");
    assert.equal(computePopoverPlacement({ ...base, content: tall, anchor: { ...anchor, y: 600 }, placement: "bottom" }).placement, "top");
  });

  it("shifts across the axis to stay inside the window", () => {
    assert.equal(computePopoverPlacement({ ...base, anchor: { ...anchor, x: 0 }, placement: "top" }).x, 0);
    assert.equal(computePopoverPlacement({ ...base, anchor: { ...anchor, x: 1270 }, placement: "bottom" }).x, 1180);
    assert.equal(computePopoverPlacement({ ...base, anchor: { ...anchor, y: 0 }, placement: "right" }).y, 0);
    assert.equal(computePopoverPlacement({ ...base, anchor: { ...anchor, y: 790 }, placement: "left" }).y, 750);
  });

  it("stays out of the safe-area insets and keeps the margin", () => {
    const insets = { top: 44, bottom: 34, left: 10, right: 20 };
    // Without insets there is room above (y 60 - 8 - 50 = 2 >= 0); the 44 px top inset takes it away, so it flips.
    const anchorHigh = { x: 600, y: 60, width: 40, height: 20 };
    assert.equal(computePopoverPlacement({ ...base, anchor: anchorHigh, placement: "top" }).placement, "top");
    const withInset = computePopoverPlacement({ ...base, anchor: anchorHigh, placement: "top", insets });
    assert.equal(withInset.placement, "bottom");
    // Shifted horizontally: the left inset (10) plus the margin (6).
    assert.equal(computePopoverPlacement({ ...base, anchor: { ...anchor, x: 0 }, placement: "top", insets, margin: 6 }).x, 16);
    // The right inset and margin bound the other side: 1280 - 20 - 6 - 100.
    assert.equal(computePopoverPlacement({ ...base, anchor: { ...anchor, x: 1270 }, placement: "top", insets, margin: 6 }).x, 1154);
  });

  it("puts the start edge inside the area when the content is larger than the window", () => {
    const huge = computePopoverPlacement({ ...base, content: { width: 2000, height: 50 }, placement: "top", margin: 4 });
    assert.equal(huge.x, 4);
  });
});

/** Fakes the host side of a React Native view: `measureInWindow` reports the given rectangle. */
function nodeMock(rect: { x: number; y: number; width: number; height: number } | null) {
  return (element: React.ReactElement) =>
    element.type === "View" && rect ? { measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => cb(rect.x, rect.y, rect.width, rect.height) } : null;
}

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

async function render(ui: React.ReactElement, rect: { x: number; y: number; width: number; height: number } | null = null) {
  let renderer!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(ui, { createNodeMock: nodeMock(rect) as never });
  });
  return renderer;
}

const content = (r: TestRenderer.ReactTestRenderer) => r.root.findAll((n) => (n.type as unknown) === host("View") && n.props.role === "dialog");
const texts = (r: TestRenderer.ReactTestRenderer) => r.root.findAll((n) => (n.type as unknown) === host("Text")).map((n) => String(n.props.children));
const backdrop = (r: TestRenderer.ReactTestRenderer) => r.root.findAll((n) => (n.type as unknown) === host("Pressable") && n.props.testID === "popover-backdrop");

function app(props: Partial<PopoverProps> = {}, hostProps: Partial<React.ComponentProps<typeof OverlayHost>> = {}) {
  return (
    <ThemeProvider>
      <OverlayHost {...hostProps}>
        <Popover renderTrigger={({ toggle }) => <Button label="Open" onPress={toggle} />} {...props}>
          <Text>Popover content</Text>
        </Popover>
      </OverlayHost>
    </ThemeProvider>
  );
}

const trigger = (r: TestRenderer.ReactTestRenderer) => r.root.findAll((n) => (n.type as unknown) === host("Pressable") && n.props.accessibilityLabel === "Open")[0]!;

const press = async (r: TestRenderer.ReactTestRenderer) => {
  await act(async () => {
    trigger(r).props.onPress();
  });
};

const layout = async (r: TestRenderer.ReactTestRenderer, width: number, height: number) => {
  await act(async () => {
    content(r)[0]!.props.onLayout({ nativeEvent: { layout: { x: 0, y: 0, width, height } } });
  });
};

describe("PLRNUI-346 Popover", () => {
  for (const os of ["ios", "android", "web"]) {
    it(`the trigger's toggle opens the content on ${os}, and again closes it`, async () => {
      platform.OS = os;
      const r = await render(app());
      assert.equal(content(r).length, 0);
      assert.ok(!texts(r).includes("Popover content"));
      await press(r);
      assert.equal(content(r).length, 1);
      assert.ok(texts(r).includes("Popover content"));
      await press(r);
      assert.equal(content(r).length, 0);
    });
  }

  it("renders the content through the OverlayHost, not inside the trigger's tree position", async () => {
    const r = await render(app());
    await press(r);
    // The content is a sibling of the page content in the host layer: its ancestors include the host's overlay layer, not the anchor View.
    const anchorView = r.root.findAll((n) => (n.type as unknown) === host("View") && n.props.collapsable === false)[0]!;
    assert.equal(anchorView.findAll((n) => n.props.role === "dialog").length, 0);
    assert.equal(content(r).length, 1);
  });

  it("the trigger exposes accessibilityState.expanded, false then true then false", async () => {
    const r = await render(
      <ThemeProvider>
        <OverlayHost>
          <Popover
            renderTrigger={({ toggle }) => (
              <Pressable accessibilityRole="button" accessibilityLabel="Open" accessibilityState={{ disabled: false }} onPress={toggle}>
                <Text>Open</Text>
              </Pressable>
            )}
          >
            <Text>Popover content</Text>
          </Popover>
        </OverlayHost>
      </ThemeProvider>,
    );
    const state = () => trigger(r).props;
    assert.equal(state().accessibilityState.expanded, false);
    assert.equal(state()["aria-expanded"], false);
    await press(r);
    assert.equal(state().accessibilityState.expanded, true);
    assert.equal(state()["aria-expanded"], true);
    // The trigger's own state survives next to `expanded`.
    assert.equal(state().accessibilityState.disabled, false);
    await press(r);
    assert.equal(state().accessibilityState.expanded, false);
  });

  it("also works for a trigger that is not a pressable element (expanded on a Text)", async () => {
    const r = await render(
      <ThemeProvider>
        <OverlayHost>
          <Popover renderTrigger={({ open }) => <Text>{open ? "on" : "off"}</Text>}>
            <Text>Body</Text>
          </Popover>
        </OverlayHost>
      </ThemeProvider>,
    );
    assert.equal(r.root.findByType(host("Text") as never).props.accessibilityState.expanded, false);
  });

  it("the content exposes an accessibilityActions dismiss entry that closes it", async () => {
    const r = await render(app());
    await press(r);
    const dialog = content(r)[0]!;
    assert.ok(dialog.props.accessibilityActions.some((a: { name: string }) => a.name === "dismiss"));
    await act(async () => {
      dialog.props.onAccessibilityAction({ nativeEvent: { actionName: "magicTap" } });
    });
    assert.equal(content(r).length, 1, "another action does not close it");
    await act(async () => {
      dialog.props.onAccessibilityAction({ nativeEvent: { actionName: "dismiss" } });
    });
    assert.equal(content(r).length, 0);
  });

  it("a backdrop press closes it; the backdrop is hidden from screen readers", async () => {
    const r = await render(app());
    await press(r);
    const [back] = backdrop(r);
    assert.ok(back);
    assert.equal(back.props.accessible, false);
    await act(async () => {
      back.props.onPress();
    });
    assert.equal(content(r).length, 0);
  });

  it("Escape (web) and Android Back close it through the host, with no BackHandler of its own", async () => {
    const keys = fakeKeyTarget();
    const back = fakeBackHandler();
    const r = await render(app({}, { keyTarget: keys.keyTarget, backHandler: back.backHandler }));
    await press(r);
    await act(async () => void keys.key("a"));
    assert.equal(content(r).length, 1);
    await act(async () => void keys.key("Escape"));
    assert.equal(content(r).length, 0);
    await press(r);
    await act(async () => void back.press());
    assert.equal(content(r).length, 0);
    const source = readFileSync(resolve(root, "src/components/Popover/Popover.tsx"), "utf8");
    assert.ok(!/BackHandler/.test(source.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, "")), "Popover subscribes to nothing itself");
  });

  it("renders no Pressable inside a Pressable", async () => {
    const r = await render(app());
    await press(r);
    const pressables = r.root.findAll((n) => (n.type as unknown) === host("Pressable"));
    assert.ok(pressables.length >= 2, "trigger and backdrop");
    for (const p of pressables) {
      assert.equal(p.findAll((n) => n !== p && (n.type as unknown) === host("Pressable")).length, 0);
    }
  });

  it("hides the content until it is measured, then places it from the trigger rectangle", async () => {
    const r = await render(app({ placement: "bottom" }), { x: 600, y: 400, width: 40, height: 20 });
    await press(r);
    // Trigger measured, size not yet known.
    assert.equal(flatten(content(r)[0]!.props.style).opacity, 0);
    await layout(r, 100, 50);
    const style = flatten(content(r)[0]!.props.style);
    assert.equal(style.opacity, 1);
    assert.equal(style.position, "absolute");
    // gap xs = 4: below the trigger (400 + 20 + 4) and centred (620 - 50).
    assert.equal(style.top, 424);
    assert.equal(style.left, 570);
  });

  it("flips to the other side when the trigger is at the window edge", async () => {
    const r = await render(app({ placement: "top" }), { x: 600, y: 10, width: 40, height: 20 });
    await press(r);
    await layout(r, 100, 50);
    // No room above: below the trigger, 10 + 20 + 4.
    assert.equal(flatten(content(r)[0]!.props.style).top, 34);
  });

  it("measures the trigger each time it opens", async () => {
    let calls = 0;
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(app(), {
        createNodeMock: ((el: React.ReactElement) =>
          el.type === "View" ? { measureInWindow: (cb: (...a: number[]) => void) => (calls += 1, cb(1, 2, 3, 4)) } : null) as never,
      });
    });
    assert.equal(calls, 0, "not before it opens");
    await press(renderer);
    assert.equal(calls, 1);
    await press(renderer);
    await press(renderer);
    assert.equal(calls, 2);
  });

  it("still opens when the trigger cannot be measured (test hosts without measureInWindow)", async () => {
    const r = await render(app(), null);
    await press(r);
    await layout(r, 100, 50);
    assert.equal(flatten(content(r)[0]!.props.style).opacity, 1);
  });

  it("gives the screen-reader focus back to the trigger when it closes", async () => {
    const focused: unknown[] = [];
    const restore = setModalAccessibilityHost({ announce: () => undefined, focus: (node) => void focused.push(node) });
    try {
      const r = await render(app(), { x: 0, y: 0, width: 10, height: 10 });
      assert.equal(focused.length, 0, "nothing on mount");
      await press(r);
      assert.equal(focused.length, 0, "nothing on open");
      await press(r);
      assert.equal(focused.length, 1);
      assert.ok(typeof (focused[0] as { measureInWindow?: unknown }).measureInWindow === "function", "the anchor node");
    } finally {
      restore();
    }
  });

  it("falls back to a React Native Modal, with a development warning, when there is no OverlayHost", async () => {
    const warnings: unknown[][] = [];
    const warn = console.warn;
    console.warn = (...args: unknown[]) => void warnings.push(args);
    const previousDev = (globalThis as { __DEV__?: boolean }).__DEV__;
    (globalThis as { __DEV__?: boolean }).__DEV__ = true;
    try {
      const r = await render(
        <ThemeProvider>
          <Popover renderTrigger={({ toggle }) => <Button label="Open" onPress={toggle} />}>
            <Text>Popover content</Text>
          </Popover>
        </ThemeProvider>,
      );
      await press(r);
      assert.equal(r.root.findAll((n) => (n.type as unknown) === host("Modal")).length, 1);
      assert.ok(texts(r).includes("Popover content"));
      assert.ok(warnings.some((w) => String(w[0]).includes("[Portal]")));
    } finally {
      console.warn = warn;
      (globalThis as { __DEV__?: boolean }).__DEV__ = previousDev;
    }
  });

  it("controlled open: follows `open`, reports changes through onOpenChange and does not change by itself", async () => {
    const changes: boolean[] = [];
    const r = await render(app({ open: false, onOpenChange: (o) => void changes.push(o) }));
    await press(r);
    assert.deepEqual(changes, [true]);
    assert.equal(content(r).length, 0, "the owner has not accepted the change");
    await act(async () => {
      r.update(app({ open: true, onOpenChange: (o) => void changes.push(o) }));
    });
    assert.equal(content(r).length, 1);
    await act(async () => {
      backdrop(r)[0]!.props.onPress();
    });
    assert.deepEqual(changes, [true, false]);
    assert.equal(content(r).length, 1, "still open until the owner closes it");
  });

  it("defaultOpen opens it at mount and onOpenChange reports the uncontrolled changes", async () => {
    const changes: boolean[] = [];
    const r = await render(app({ defaultOpen: true, onOpenChange: (o) => void changes.push(o) }));
    assert.equal(content(r).length, 1);
    await act(async () => {
      backdrop(r)[0]!.props.onPress();
    });
    assert.equal(content(r).length, 0);
    assert.deepEqual(changes, [false]);
  });

  it("passes style and testID to the root, and a derived testID to the content", async () => {
    const r = await render(app({ testID: "pop", style: { margin: 3 }, defaultOpen: true }));
    const rootView = r.root.findAll((n) => (n.type as unknown) === host("View") && n.props.testID === "pop")[0]!;
    assert.equal(flatten(rootView.props.style).margin, 3);
    assert.equal(flatten(rootView.props.style).alignSelf, "flex-start");
    assert.equal(content(r)[0]!.props.testID, "pop-content");
  });

  it("exports PopoverProps from the component index (compile-time) and documents the native behaviour", () => {
    const props: PopoverProps = { renderTrigger: () => null, children: null, placement: "left", gap: "md", open: true, defaultOpen: false, onOpenChange: () => undefined, style: {}, testID: "x" };
    assert.equal(props.placement, "left");
    const docs = readFileSync(resolve(root, "docs/components/overlay/popover.md"), "utf8");
    assert.match(docs, /OverlayHost/);
    assert.match(docs, /measureInWindow/);
    assert.match(docs, /iOS/);
    assert.ok(!/renders only the trigger|solo il trigger/i.test(docs), "the trigger-only fallback is gone from the docs");
    const index = readFileSync(resolve(root, "src/components/Popover/index.ts"), "utf8");
    assert.match(index, /export type \{ PopoverProps \}/);
  });
});
