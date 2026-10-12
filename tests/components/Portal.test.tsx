import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import TestRenderer, { act } from "react-test-renderer";
import { Modal as RNModal, Text, View } from "react-native";
import { ThemeProvider, useTheme } from "../../src";
import { ThemeScope } from "../../src/theme/ThemeScope.js";
import { darkColors, lightColors } from "../../src/tokens/colors.base.js";
import { zIndex } from "../../src/tokens/zIndex.base.js";
import {
  OverlayHost,
  Portal,
  createOverlayStore,
  useOverlay,
  useOverlayAnchor,
  useOverlayState,
  type AnchorHandle,
  type BackHandlerLike,
  type KeyEventTargetLike,
  type OverlayApi,
  type OverlayState,
} from "../../src/components/Portal/index.js";

const host = (name: string) => name as unknown as React.ElementType;
const flatten = (style: unknown): Record<string, any> => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));

/** Records console.error and console.warn while `fn` runs. */
function spyConsole<T>(fn: () => T): { result: T; errors: unknown[][]; warnings: unknown[][] } {
  const errors: unknown[][] = [];
  const warnings: unknown[][] = [];
  const e = console.error;
  const w = console.warn;
  // react-test-renderer itself prints a one-off deprecation notice; everything else counts.
  console.error = (...args: unknown[]) => void (String(args[0]).includes("react-test-renderer is deprecated") || errors.push(args));
  console.warn = (...args: unknown[]) => void (String(args[0]).includes("react-test-renderer is deprecated") || warnings.push(args));
  try {
    return { result: fn(), errors, warnings };
  } finally {
    console.error = e;
    console.warn = w;
  }
}

function create(ui: React.ReactElement): TestRenderer.ReactTestRenderer {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(ui);
  });
  return renderer;
}

const textsOf = (node: TestRenderer.ReactTestInstance) => node.findAll((n) => (n.type as unknown) === host("Text")).map((n) => String(n.props.children));
const allTexts = (r: TestRenderer.ReactTestRenderer) => textsOf(r.root);

/** A fake BackHandler that records its subscription. */
function fakeBackHandler() {
  let handler: (() => boolean | null | undefined) | undefined;
  let removed = 0;
  const backHandler: BackHandlerLike = {
    addEventListener(_event, h) {
      handler = h;
      return { remove: () => void (removed += 1, (handler = undefined)) };
    },
  };
  return { backHandler, press: () => handler?.(), removed: () => removed, subscribed: () => handler !== undefined };
}

function fakeKeyTarget() {
  let listener: ((event: { key?: string; preventDefault?: () => void }) => void) | undefined;
  const keyTarget: KeyEventTargetLike = {
    addEventListener: (_type, l) => void (listener = l),
    removeEventListener: (_type, l) => void (listener === l && (listener = undefined)),
  };
  return {
    keyTarget,
    key: (key: string) => {
      let prevented = false;
      listener?.({ key, preventDefault: () => void (prevented = true) });
      return prevented;
    },
    subscribed: () => listener !== undefined,
  };
}

describe("PLRNUI-224 overlay store", () => {
  const base = { hostId: "h" };

  it("registers entries on top, in mount order, with defaults", () => {
    const store = createOverlayStore();
    const a = store.register({ ...base, content: "a" });
    const b = store.register({ ...base, content: "b" });
    assert.deepEqual(store.getEntries().map((e) => e.id), [a, b]);
    assert.equal(store.getEntries()[0]!.dismissable, false);
    assert.equal(store.getEntries()[0]!.layer, "overlay");
    assert.equal(store.getEntries()[0]!.accessibilityViewIsModal, false);
    assert.equal(store.getEntries()[0]!.lockScroll, false);
  });

  it("orders by layer first and mount order second, whatever the registration order", () => {
    const store = createOverlayStore();
    const toast = store.register({ ...base, content: "toast", layer: "toast" });
    const modal = store.register({ ...base, content: "modal", layer: "modal" });
    const menu = store.register({ ...base, content: "menu" });
    const second = store.register({ ...base, content: "second", layer: "modal" });
    assert.deepEqual(store.getEntries().map((e) => e.id), [menu, modal, second, toast]);
  });

  it("an unknown layer falls back to overlay, also on update", () => {
    const store = createOverlayStore();
    const id = store.register({ ...base, content: "x", layer: "nope" as never });
    assert.equal(store.getEntries()[0]!.layer, "overlay");
    store.update(id, { layer: "toast" });
    assert.equal(store.getEntries()[0]!.layer, "toast");
    store.update(id, { layer: "bogus" as never });
    assert.equal(store.getEntries()[0]!.layer, "toast");
  });

  it("update changes an entry, ignores unknown ids and unchanged patches (no notification)", () => {
    const store = createOverlayStore();
    const id = store.register({ ...base, content: "a" });
    let notified = 0;
    store.subscribe(() => (notified += 1));
    store.update(id, { content: "b" });
    assert.equal(store.getEntries()[0]!.content, "b");
    assert.equal(notified, 1);
    const snapshot = store.getEntries();
    store.update(id, { content: "b" });
    store.update("missing", { content: "c" });
    assert.equal(notified, 1);
    assert.ok(store.getEntries() === snapshot);
  });

  it("unregister removes an entry, ignores unknown ids, and unsubscribe stops notifications", () => {
    const store = createOverlayStore();
    const id = store.register({ ...base, content: "a" });
    let notified = 0;
    const off = store.subscribe(() => (notified += 1));
    store.unregister("missing");
    assert.equal(notified, 0);
    store.unregister(id);
    assert.deepEqual(store.getEntries(), []);
    assert.equal(notified, 1);
    off();
    store.register({ ...base, content: "b" });
    assert.equal(notified, 1);
  });

  it("dismissTop calls onDismiss of the topmost dismissable entry only", () => {
    const store = createOverlayStore();
    const log: string[] = [];
    store.register({ ...base, content: "low", dismissable: true, onDismiss: () => log.push("low") });
    store.register({ ...base, content: "top", dismissable: true, onDismiss: () => log.push("top") });
    store.register({ ...base, content: "blocking" });
    assert.equal(store.dismissTop(), true);
    assert.deepEqual(log, ["top"]);
  });

  it("dismissTop reports false when nothing is dismissable, and tolerates a missing onDismiss", () => {
    const store = createOverlayStore();
    assert.equal(store.dismissTop(), false);
    store.register({ ...base, content: "a" });
    assert.equal(store.dismissTop(), false);
    store.register({ ...base, content: "b", dismissable: true });
    assert.equal(store.dismissTop(), true);
  });
});

describe("PLRNUI-224 Portal in an OverlayHost", () => {
  it("renders the children under the OverlayHost node, not where the Portal is written, and removes them with the host with no console.error", () => {
    const { result: renderer, errors, warnings } = spyConsole(() =>
      create(
        <ThemeProvider persistTheme={false}>
          <OverlayHost>
            <View testID="screen">
              <Text>Screen</Text>
              <Portal>
                <Text>Overlay</Text>
              </Portal>
            </View>
          </OverlayHost>
        </ThemeProvider>,
      ),
    );
    assert.deepEqual(errors, []);
    assert.deepEqual(warnings, []);
    const screen = renderer.root.findByProps({ testID: "screen" });
    assert.deepEqual(textsOf(screen), ["Screen"], "not inside the screen subtree");
    assert.deepEqual(allTexts(renderer).sort(), ["Overlay", "Screen"]);
    // the content sits under the host's layer, which is a sibling after the children
    const layers = renderer.root.findAll((n) => (n.type as unknown) === host("View") && n.props.pointerEvents === "box-none");
    assert.ok(layers.length >= 1 && textsOf(layers[0]!).includes("Overlay"));

    const after = spyConsole(() => act(() => renderer.update(<ThemeProvider persistTheme={false}>{null}</ThemeProvider>)));
    assert.deepEqual(after.errors, []);
    assert.deepEqual(allTexts(renderer), []);
  });

  it("unmounting only the Portal removes its content and leaves the host", () => {
    const tree = (show: boolean) => (
      <OverlayHost>
        <Text>Screen</Text>
        {show ? (
          <Portal>
            <Text>Overlay</Text>
          </Portal>
        ) : null}
      </OverlayHost>
    );
    const r = create(tree(true));
    assert.deepEqual(allTexts(r).sort(), ["Overlay", "Screen"]);
    act(() => r.update(tree(false)));
    assert.deepEqual(allTexts(r), ["Screen"]);
  });

  it("updates the content when the children change", () => {
    const tree = (label: string) => (
      <OverlayHost>
        <Portal>
          <Text>{label}</Text>
        </Portal>
      </OverlayHost>
    );
    const r = create(tree("one"));
    assert.deepEqual(allTexts(r), ["one"]);
    act(() => r.update(tree("two")));
    assert.deepEqual(allTexts(r), ["two"]);
  });

  it("stacks several portals in mount order, with increasing z-index", () => {
    const r = create(
      <OverlayHost>
        <Portal><Text>first</Text></Portal>
        <Portal><Text>second</Text></Portal>
        <Portal><Text>third</Text></Portal>
      </OverlayHost>,
    );
    assert.deepEqual(allTexts(r), ["first", "second", "third"]);
    const z = r.root.findAll((n) => (n.type as unknown) === host("View") && typeof flatten(n.props.style).zIndex === "number").map((n) => flatten(n.props.style).zIndex as number);
    assert.deepEqual(z, [...z].sort((a, b) => a - b));
    assert.equal(new Set(z).size, 3);
    assert.equal(z[0], zIndex.overlay);
  });

  it("keeps toasts above modals whatever the mount order", () => {
    const r = create(
      <OverlayHost>
        <Portal layer="toast"><Text>toast</Text></Portal>
        <Portal layer="modal"><Text>modal</Text></Portal>
      </OverlayHost>,
    );
    assert.deepEqual(allTexts(r), ["modal", "toast"]);
  });

  it("marks a layer accessibilityViewIsModal only when asked", () => {
    const r = create(
      <OverlayHost>
        <Portal accessibilityViewIsModal><Text>modal</Text></Portal>
        <Portal><Text>plain</Text></Portal>
      </OverlayHost>,
    );
    const flagged = r.root.findAll((n) => (n.type as unknown) === host("View") && n.props.accessibilityViewIsModal === true);
    assert.equal(flagged.length, 1);
    assert.deepEqual(textsOf(flagged[0]!), ["modal"]);
  });

  it("a prop removed from a Portal goes back to its default (layer, modal flag, scroll lock)", () => {
    const seen: OverlayState[] = [];
    function Probe() {
      seen.push(useOverlayState());
      return null;
    }
    const tree = (withProps: boolean) => (
      <OverlayHost>
        <Probe />
        <Portal {...(withProps ? { layer: "toast" as const, accessibilityViewIsModal: true, lockScroll: true } : {})}><Text>p</Text></Portal>
      </OverlayHost>
    );
    const r = create(tree(true));
    const zOf = () => r.root.findAll((n) => (n.type as unknown) === host("View") && typeof flatten(n.props.style).zIndex === "number").map((n) => flatten(n.props.style).zIndex as number);
    assert.deepEqual(zOf(), [zIndex.toast]);
    assert.equal(seen.at(-1)!.scrollLocked, true);
    assert.equal(r.root.findAll((n) => (n.type as unknown) === host("View") && n.props.accessibilityViewIsModal === true).length, 1);
    act(() => r.update(tree(false)));
    assert.deepEqual(zOf(), [zIndex.overlay]);
    assert.equal(seen.at(-1)!.scrollLocked, false);
    assert.equal(r.root.findAll((n) => (n.type as unknown) === host("View") && n.props.accessibilityViewIsModal === true).length, 0);
  });

  it("is safe in StrictMode: no duplicate or leaked entries", () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <React.StrictMode>
          <OverlayHost>
            <Portal><Text>once</Text></Portal>
          </OverlayHost>
        </React.StrictMode>,
        { unstable_isConcurrent: true } as never,
      );
    });
    assert.deepEqual(allTexts(renderer), ["once"]);
    act(() => renderer.update(<React.StrictMode><OverlayHost>{null}</OverlayHost></React.StrictMode>));
    assert.deepEqual(allTexts(renderer), []);
  });
});

describe("PLRNUI-224 Back and Escape", () => {
  function Stack({ log, topDismissable = true }: { log: string[]; topDismissable?: boolean }) {
    return (
      <>
        <Portal dismissable onDismiss={() => log.push("bottom")}><Text>bottom</Text></Portal>
        <Portal dismissable={topDismissable} onDismiss={() => log.push("top")}><Text>top</Text></Portal>
      </>
    );
  }

  it("Android Back closes only the topmost dismissable overlay and reports it handled", () => {
    const back = fakeBackHandler();
    const log: string[] = [];
    create(<OverlayHost backHandler={back.backHandler}><Stack log={log} /></OverlayHost>);
    assert.equal(back.press(), true);
    assert.deepEqual(log, ["top"]);
    assert.equal(back.press(), true);
    assert.deepEqual(log, ["top", "top"], "the stack does not remove entries itself");
  });

  it("skips a non-dismissable overlay on top and closes the dismissable one below", () => {
    const back = fakeBackHandler();
    const log: string[] = [];
    create(<OverlayHost backHandler={back.backHandler}><Stack log={log} topDismissable={false} /></OverlayHost>);
    back.press();
    assert.deepEqual(log, ["bottom"]);
  });

  it("does not handle Back when nothing is dismissable (the app's own back handling runs)", () => {
    const back = fakeBackHandler();
    create(
      <OverlayHost backHandler={back.backHandler}>
        <Portal><Text>plain</Text></Portal>
      </OverlayHost>,
    );
    assert.equal(back.press(), false);
  });

  it("the web Escape key closes the topmost dismissable overlay and prevents the default; other keys do nothing", () => {
    const keys = fakeKeyTarget();
    const log: string[] = [];
    create(<OverlayHost keyTarget={keys.keyTarget}><Stack log={log} /></OverlayHost>);
    assert.equal(keys.key("Enter"), false);
    assert.deepEqual(log, []);
    assert.equal(keys.key("Escape"), true);
    assert.deepEqual(log, ["top"]);
  });

  it("Escape with nothing to close does not prevent the default", () => {
    const keys = fakeKeyTarget();
    create(<OverlayHost keyTarget={keys.keyTarget}><Text>none</Text></OverlayHost>);
    assert.equal(keys.key("Escape"), false);
  });

  it("unsubscribes from Back and Escape when the root host unmounts", () => {
    const back = fakeBackHandler();
    const keys = fakeKeyTarget();
    const r = create(<OverlayHost backHandler={back.backHandler} keyTarget={keys.keyTarget}><Text>x</Text></OverlayHost>);
    assert.ok(back.subscribed() && keys.subscribed());
    act(() => r.unmount());
    assert.equal(back.removed(), 1);
    assert.equal(back.subscribed() || keys.subscribed(), false);
  });

  it("calls the latest onDismiss without re-registering the portal", () => {
    const back = fakeBackHandler();
    const log: string[] = [];
    const tree = (tag: string) => (
      <OverlayHost backHandler={back.backHandler}>
        <Portal dismissable onDismiss={() => log.push(tag)}><Text>x</Text></Portal>
      </OverlayHost>
    );
    const r = create(tree("old"));
    act(() => r.update(tree("new")));
    back.press();
    assert.deepEqual(log, ["new"]);
  });

  it("reads React Native's BackHandler and the document when none is given, and survives their absence", () => {
    // the test shim has neither BackHandler nor a document: rendering must work
    const r = create(<OverlayHost><Portal dismissable><Text>x</Text></Portal></OverlayHost>);
    assert.deepEqual(allTexts(r), ["x"]);
    const original = (globalThis as { document?: unknown }).document;
    const added: string[] = [];
    (globalThis as { document?: unknown }).document = { addEventListener: (t: string) => void added.push(`add:${t}`), removeEventListener: (t: string) => void added.push(`remove:${t}`) };
    try {
      const withDoc = create(<OverlayHost><Text>y</Text></OverlayHost>);
      act(() => withDoc.unmount());
    } finally {
      (globalThis as { document?: unknown }).document = original;
    }
    assert.deepEqual(added, ["add:keydown", "remove:keydown"]);
  });
});

describe("PLRNUI-224 nested host in a native-window surface", () => {
  // A stand-in for Modal: the test shim has no native windows, so a Modal host element containing an OverlayHost.
  function NativeWindow({ children }: { children?: React.ReactNode }) {
    return (
      <RNModal visible transparent>
        <OverlayHost>{children}</OverlayHost>
      </RNModal>
    );
  }

  it("a portal inside the window renders inside it, above the window content, and a portal outside stays in the root host", () => {
    const r = create(
      <OverlayHost>
        <Text>screen</Text>
        <Portal><Text>root overlay</Text></Portal>
        <NativeWindow>
          <Text>modal content</Text>
          <Portal layer="modal"><Text>select list</Text></Portal>
        </NativeWindow>
      </OverlayHost>,
    );
    const modal = r.root.findByType(RNModal as never);
    assert.deepEqual(textsOf(modal), ["modal content", "select list"], "inside the Modal's nested host, after the Modal content");
    assert.ok(!textsOf(modal).includes("root overlay"));
    assert.ok(allTexts(r).includes("root overlay"));
    const layer = modal.findAll((n) => (n.type as unknown) === host("View") && typeof flatten(n.props.style).zIndex === "number");
    assert.equal(layer.length, 1);
  });

  it("a toast shown while the window is open is rendered in the nested host, above the window content", () => {
    function Screen() {
      const overlay = useOverlay();
      const idRef = React.useRef<string | null>(null);
      return (
        <Text
          onPress={() => {
            idRef.current = overlay.open(<Text>saved</Text>, { layer: "toast" });
          }}
        >
          open toast
        </Text>
      );
    }
    const r = create(
      <OverlayHost>
        <NativeWindow>
          <Screen />
        </NativeWindow>
      </OverlayHost>,
    );
    act(() => r.root.findByProps({ children: "open toast" }).props.onPress());
    const modal = r.root.findByType(RNModal as never);
    assert.ok(textsOf(modal).includes("saved"));
    const toast = modal.findAll((n) => (n.type as unknown) === host("View") && flatten(n.props.style).zIndex >= zIndex.toast);
    assert.ok(toast.length >= 1, "the toast layer is above the modal layer");
  });

  it("Back closes the topmost dismissable overlay across hosts, then the one below", () => {
    const back = fakeBackHandler();
    const log: string[] = [];
    create(
      <OverlayHost backHandler={back.backHandler}>
        <Portal dismissable onDismiss={() => log.push("root")}><Text>root</Text></Portal>
        <NativeWindow>
          <Portal dismissable onDismiss={() => log.push("nested")}><Text>nested</Text></Portal>
        </NativeWindow>
      </OverlayHost>,
    );
    back.press();
    assert.deepEqual(log, ["nested"]);
  });

  it("only the root host subscribes to Back and to the Escape key", () => {
    const counts = { rootBack: 0, nestedBack: 0, rootKeys: 0, nestedKeys: 0 };
    const back = (key: "rootBack" | "nestedBack"): BackHandlerLike => ({ addEventListener: () => ((counts[key] += 1), { remove: () => undefined }) });
    const keys = (key: "rootKeys" | "nestedKeys"): KeyEventTargetLike => ({ addEventListener: () => void (counts[key] += 1), removeEventListener: () => undefined });
    create(
      <OverlayHost backHandler={back("rootBack")} keyTarget={keys("rootKeys")}>
        <RNModal visible transparent>
          <OverlayHost backHandler={back("nestedBack")} keyTarget={keys("nestedKeys")}>
            <Text>x</Text>
          </OverlayHost>
        </RNModal>
      </OverlayHost>,
    );
    assert.deepEqual(counts, { rootBack: 1, nestedBack: 0, rootKeys: 1, nestedKeys: 0 });
  });

  it("an overlay opened with useOverlay inside a window leaves the stack when the window closes (Back is not swallowed by a ghost)", () => {
    const back = fakeBackHandler();
    const log: string[] = [];
    const holder: { api?: OverlayApi } = {};
    function Opener() {
      holder.api = useOverlay();
      return null;
    }
    const tree = (open: boolean) => (
      <OverlayHost backHandler={back.backHandler}>
        <Text>screen</Text>
        {open ? <NativeWindow><Opener /></NativeWindow> : null}
      </OverlayHost>
    );
    const r = create(tree(true));
    act(() => void holder.api!.open(<Text>ghost</Text>, { dismissable: true, onDismiss: () => log.push("ghost") }));
    assert.ok(allTexts(r).includes("ghost"));
    act(() => r.update(tree(false)));
    assert.deepEqual(allTexts(r), ["screen"]);
    assert.equal(back.press(), false, "no dismissable overlay is left");
    assert.deepEqual(log, []);
  });

  it("closing the window removes the portals that were inside it", () => {
    const tree = (open: boolean) => (
      <OverlayHost>
        <Text>screen</Text>
        {open ? <NativeWindow><Portal><Text>inside</Text></Portal></NativeWindow> : null}
      </OverlayHost>
    );
    const r = create(tree(true));
    assert.ok(allTexts(r).includes("inside"));
    act(() => r.update(tree(false)));
    assert.deepEqual(allTexts(r), ["screen"]);
  });
});

describe("PLRNUI-224 theme", () => {
  function Probe({ into }: { into: string[] }) {
    into.push(useTheme().mode);
    return null;
  }

  it("a Portal inside a ThemeScope receives the scoped theme, not the host's", () => {
    const seen: string[] = [];
    create(
      <ThemeProvider initialMode="light" persistTheme={false}>
        <OverlayHost>
          <ThemeScope preference="dark">
            <Portal><Probe into={seen} /></Portal>
          </ThemeScope>
        </OverlayHost>
      </ThemeProvider>,
    );
    assert.equal(seen.at(-1), "dark");
  });

  it("a Portal outside any scope sees the provider's theme; with no ThemeProvider it still renders", () => {
    const seen: string[] = [];
    create(<ThemeProvider initialMode="dark" persistTheme={false}><OverlayHost><Portal><Probe into={seen} /></Portal></OverlayHost></ThemeProvider>);
    assert.equal(seen.at(-1), "dark");
    const r = create(<OverlayHost><Portal><Text>no theme</Text></Portal></OverlayHost>);
    assert.deepEqual(allTexts(r), ["no theme"]);
  });

  for (const mode of ["light", "dark"] as const) {
    it(`renders under the ${mode} ThemeProvider with theme colors, no console.error or console.warn`, () => {
      function Card() {
        const { theme } = useTheme();
        return <View style={{ backgroundColor: theme.colors.surface }}><Text>card</Text></View>;
      }
      const { result: r, errors, warnings } = spyConsole(() =>
        create(
          <ThemeProvider initialMode={mode} persistTheme={false}>
            <OverlayHost><Portal layer="modal"><Card /></Portal></OverlayHost>
          </ThemeProvider>,
        ),
      );
      assert.deepEqual(errors, []);
      assert.deepEqual(warnings, []);
      const card = r.root.findAll((n) => (n.type as unknown) === host("View") && flatten(n.props.style).backgroundColor !== undefined);
      assert.equal(flatten(card[0]!.props.style).backgroundColor, (mode === "dark" ? darkColors : lightColors).surface);
    });
  }
});

describe("PLRNUI-224 no host", () => {
  const withDev = <T,>(value: boolean, fn: () => T): T => {
    const g = globalThis as { __DEV__?: boolean };
    const previous = g.__DEV__;
    g.__DEV__ = value;
    try {
      return fn();
    } finally {
      g.__DEV__ = previous;
    }
  };

  it("falls back to a React Native Modal and warns in development", () => {
    const { result: r, warnings, errors } = withDev(true, () => spyConsole(() => create(<Portal dismissable onDismiss={() => undefined}><Text>fallback</Text></Portal>)));
    const modal = r.root.findByType(RNModal as never);
    assert.deepEqual(textsOf(modal), ["fallback"]);
    assert.equal(modal.props.visible, true);
    assert.equal(modal.props.transparent, true);
    assert.equal(typeof modal.props.onRequestClose, "function");
    assert.equal(warnings.length, 1);
    assert.match(String(warnings[0]![0]), /no OverlayHost/);
    assert.deepEqual(errors, []);
  });

  it("does not warn outside development, and a non-dismissable fallback ignores the back button", () => {
    const { result: r, warnings } = withDev(false, () => spyConsole(() => create(<Portal><Text>quiet</Text></Portal>)));
    assert.deepEqual(warnings, []);
    assert.equal(r.root.findByType(RNModal as never).props.onRequestClose, undefined);
  });

  it("useOverlay without a host opens nothing, returns null and warns in development", () => {
    let api!: OverlayApi;
    function Probe() {
      api = useOverlay();
      return null;
    }
    create(<Probe />);
    const { result, warnings } = withDev(true, () => spyConsole(() => api.open(<Text>x</Text>)));
    assert.equal(result, null);
    assert.equal(warnings.length, 1);
    assert.doesNotThrow(() => {
      api.update("x", null);
      api.close("x");
    });
    assert.equal(api.closeTop(), false);
  });
});

describe("PLRNUI-224 useOverlay", () => {
  function setup() {
    const holder: { api?: OverlayApi } = {};
    function Probe() {
      holder.api = useOverlay();
      return null;
    }
    const r = create(
      <ThemeProvider persistTheme={false}>
        <OverlayHost>
          <Probe />
        </OverlayHost>
      </ThemeProvider>,
    );
    return { r, api: () => holder.api! };
  }

  it("opens, updates and closes content, with the id it returns", () => {
    const { r, api } = setup();
    let id!: string | null;
    act(() => {
      id = api().open(<Text>one</Text>);
    });
    assert.ok(id);
    assert.deepEqual(allTexts(r), ["one"]);
    act(() => api().update(id!, <Text>two</Text>));
    assert.deepEqual(allTexts(r), ["two"]);
    act(() => api().close(id!));
    assert.deepEqual(allTexts(r), []);
  });

  it("closeTop closes the topmost overlay (dismissable or not) and reports whether one was closed", () => {
    const { r, api } = setup();
    assert.equal(api().closeTop(), false);
    act(() => {
      api().open(<Text>a</Text>);
      api().open(<Text>b</Text>);
    });
    let closed = false;
    act(() => void (closed = api().closeTop()));
    assert.equal(closed, true);
    assert.deepEqual(allTexts(r), ["a"]);
  });

  it("passes options (layer, dismissable) through, so Back can close it", () => {
    const back = fakeBackHandler();
    const holder: { api?: OverlayApi } = {};
    function Probe() {
      holder.api = useOverlay();
      return null;
    }
    create(<OverlayHost backHandler={back.backHandler}><Probe /></OverlayHost>);
    const log: string[] = [];
    act(() => void holder.api!.open(<Text>x</Text>, { dismissable: true, onDismiss: () => log.push("closed"), layer: "toast" }));
    back.press();
    assert.deepEqual(log, ["closed"]);
  });

  it("forwards the theme of the caller to the content", () => {
    const seen: string[] = [];
    function Content() {
      seen.push(useTheme().mode);
      return null;
    }
    const holder: { api?: OverlayApi } = {};
    function Caller() {
      holder.api = useOverlay();
      return null;
    }
    create(
      <ThemeProvider initialMode="light" persistTheme={false}>
        <OverlayHost>
          <ThemeScope preference="dark"><Caller /></ThemeScope>
        </OverlayHost>
      </ThemeProvider>,
    );
    act(() => void holder.api!.open(<Content />));
    assert.equal(seen.at(-1), "dark");
  });

  it("keeps the same api object while the host and theme are the same", () => {
    const apis: OverlayApi[] = [];
    function Probe(_props: { n: number }) {
      apis.push(useOverlay());
      return null;
    }
    const tree = (n: number) => <OverlayHost><Probe n={n} /></OverlayHost>;
    const r = create(tree(1));
    act(() => r.update(tree(2)));
    assert.ok(apis.length >= 2 && apis.every((a) => a === apis[0]));
  });
});

describe("PLRNUI-224 useOverlayState", () => {
  it("counts the open overlays and reports a scroll lock only while one asks for it", () => {
    const seen: OverlayState[] = [];
    function Probe() {
      seen.push(useOverlayState());
      return null;
    }
    const tree = (locked: boolean, show: boolean) => (
      <OverlayHost>
        <Probe />
        {show ? <Portal lockScroll={locked}><Text>x</Text></Portal> : null}
        <Portal><Text>plain</Text></Portal>
      </OverlayHost>
    );
    const r = create(tree(false, false));
    assert.deepEqual(seen.at(-1), { count: 1, scrollLocked: false });
    act(() => r.update(tree(true, true)));
    assert.deepEqual(seen.at(-1), { count: 2, scrollLocked: true });
    act(() => r.update(tree(false, false)));
    assert.deepEqual(seen.at(-1), { count: 1, scrollLocked: false });
  });

  it("outside a host there are no overlays", () => {
    let state!: OverlayState;
    function Probe() {
      state = useOverlayState();
      return null;
    }
    create(<Probe />);
    assert.deepEqual(state, { count: 0, scrollLocked: false });
  });
});

describe("PLRNUI-224 useOverlayAnchor", () => {
  function setup(node: AnchorHandle | null) {
    const holder: { anchor?: ReturnType<typeof useOverlayAnchor> } = {};
    function Probe() {
      const ref = React.useRef<AnchorHandle | null>(node);
      holder.anchor = useOverlayAnchor(ref);
      return null;
    }
    const r = create(<Probe />);
    return { r, holder };
  }

  it("measures the element in window coordinates and keeps the rectangle", async () => {
    const { holder } = setup({ measureInWindow: (cb) => cb(10, 20, 100, 40) });
    assert.equal(holder.anchor!.rect, null);
    let measured: unknown;
    await act(async () => {
      measured = await holder.anchor!.measure();
    });
    assert.deepEqual(measured, { x: 10, y: 20, width: 100, height: 40 });
    assert.deepEqual(holder.anchor!.rect, { x: 10, y: 20, width: 100, height: 40 });
  });

  it("keeps the same rect object when a new measurement is equal", async () => {
    const { holder } = setup({ measureInWindow: (cb) => cb(1, 2, 3, 4) });
    await act(async () => void (await holder.anchor!.measure()));
    const first = holder.anchor!.rect;
    await act(async () => void (await holder.anchor!.measure()));
    assert.ok(holder.anchor!.rect === first);
  });

  it("resolves null for an empty ref or an element that cannot be measured", async () => {
    for (const node of [null, {} as AnchorHandle]) {
      const { holder } = setup(node);
      assert.equal(await holder.anchor!.measure(), null);
      assert.equal(holder.anchor!.rect, null);
    }
  });

  it("does not set state after unmount", async () => {
    let callback: ((x: number, y: number, w: number, h: number) => void) | undefined;
    const { r, holder } = setup({ measureInWindow: (cb) => void (callback = cb) });
    const pending = holder.anchor!.measure();
    act(() => r.unmount());
    const { errors } = spyConsole(() => callback?.(1, 2, 3, 4));
    assert.deepEqual(await pending, { x: 1, y: 2, width: 3, height: 4 });
    assert.deepEqual(errors, []);
  });
});

describe("PLRNUI-224 sources", () => {
  const dir = join(import.meta.dirname, "../../src/components/Portal");

  it("use no hard-coded colors", () => {
    for (const file of readdirSync(dir).filter((f) => /\.(ts|tsx)$/.test(f))) {
      assert.equal(/#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(readFileSync(join(dir, file), "utf8")), false, file);
    }
  });

  it("the store and the context import no React Native module", () => {
    for (const file of ["overlayStore.ts", "context.ts", "useOverlay.ts", "useOverlayAnchor.ts"]) {
      assert.equal(/from\s+["']react-native["']/.test(readFileSync(join(dir, file), "utf8")), false, file);
    }
  });
});
