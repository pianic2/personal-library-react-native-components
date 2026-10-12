import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import TestRenderer, { act, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { Button, Heading, Spinner, ThemeProvider } from "../../src";
import { AsyncBoundary, EmptyState, ErrorState, LoadingState, Result } from "../../src/components/StateView/index.js";
import type { AsyncBoundaryProps, EmptyStateProps } from "../../src/components/StateView/index.js";
import { darkColors, lightColors } from "../../src/tokens/colors.base.js";

const noop = () => undefined;

function mount(element: React.ReactElement, mode: "light" | "dark" = "light"): ReactTestRenderer {
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(<ThemeProvider preference={mode}>{element}</ThemeProvider>);
  });
  return renderer;
}

const flatten = (style: unknown): Record<string, any> => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));
const host = (n: ReactTestInstance) => typeof n.type === "string";
const texts = (r: ReactTestRenderer | ReactTestInstance): string[] =>
  (("root" in r ? r.root : r) as ReactTestInstance)
    .findAll((n) => host(n) && (n.type as unknown) === "Text")
    .map((n) => [n.props.children].flat(Infinity).join(""));
const buttons = (r: ReactTestRenderer) => r.root.findAllByType(Button);
const press = (b: ReactTestInstance) => act(() => b.props.onPress());
const pressAsync = (b: ReactTestInstance) =>
  act(async () => {
    b.props.onPress(); // not awaited: a pending onRetry must not block the test
  });

describe("PLRNUI-412 EmptyState", () => {
  it("renders the title with Heading, centred in a flex 1 container, then description, then actions in that order", () => {
    const r = mount(<EmptyState title="No books" description="Add your first book" actionLabel="Add" onAction={noop} secondaryActionLabel="Import" onSecondaryAction={noop} testID="empty" />);
    assert.equal(r.root.findAllByType(Heading).length, 1);
    assert.equal(r.root.findByType(Heading).props.align, "center");
    const root = r.root.find((n) => host(n) && n.props.testID === "empty");
    const style = flatten(root.props.style);
    assert.equal(style.flex, 1);
    assert.equal(style.alignItems, "center");
    assert.equal(style.justifyContent, "center");
    const order = r.root.findAll((n) => (n.type === Heading || n.type === Button || (host(n) && (n.type as unknown) === "Text" && n.props.children === "Add your first book")) && true);
    const labels = order.map((n) => (n.type === Heading ? "title" : n.type === Button ? `button:${n.props.label}` : "description"));
    assert.deepEqual(labels.filter((l, i) => labels.indexOf(l) === i), ["title", "description", "button:Add", "button:Import"]);
  });

  it("actions are the library Button, located by element type, and call their handlers", () => {
    const calls: string[] = [];
    const r = mount(<EmptyState actionLabel="Add" onAction={() => calls.push("primary")} secondaryActionLabel="Import" onSecondaryAction={() => calls.push("secondary")} />);
    const found = buttons(r);
    assert.deepEqual(found.map((b) => [b.props.label, b.props.variant ?? "primary"]), [["Add", "primary"], ["Import", "secondary"]]);
    press(found[0]!);
    press(found[1]!);
    assert.deepEqual(calls, ["primary", "secondary"]);
  });

  it("presets: empty, no-results, offline; overrides win; no action without a handler; icon is decorative", () => {
    for (const [variant, title] of [["empty", "Nothing here yet"], ["no-results", "No results"], ["offline", "You are offline"]] as const) {
      assert.ok(texts(mount(<EmptyState variant={variant} />)).includes(title), variant);
    }
    const r = mount(<EmptyState title="Custom" description="Desc" actionLabel="Go" icon={<Spinner />} />);
    assert.ok(texts(r).includes("Custom"));
    assert.equal(buttons(r).length, 0, "an action label without a handler renders no button");
    const iconHost = r.root.findAll((n) => host(n) && n.props.accessibilityElementsHidden === true && n.props.importantForAccessibility === "no-hide-descendants");
    assert.equal(iconHost.length >= 1, true);
  });

  it("compact size is not flex 1 and uses a smaller heading", () => {
    const compact = mount(<EmptyState size="sm" testID="c" />);
    const style = flatten(compact.root.find((n) => host(n) && n.props.testID === "c").props.style);
    assert.equal(style.flex, undefined);
    assert.equal(compact.root.findByType(Heading).props.level, 5);
  });
});

describe("PLRNUI-412 ErrorState", () => {
  it("announces title and message politely with role alert", () => {
    const r = mount(<ErrorState title="Could not load" message="Check your connection" />);
    const alert = r.root.find((n) => host(n) && n.props.accessibilityRole === "alert");
    assert.equal(alert.props.accessibilityLiveRegion, "polite");
    assert.deepEqual(texts(alert), ["Could not load", "Check your connection"]);
  });

  it("onRetry fires once per press and the button is disabled while a promise is pending", async () => {
    let release!: () => void;
    let calls = 0;
    const onRetry = () => {
      calls += 1;
      return new Promise<void>((resolve) => (release = resolve));
    };
    const r = mount(<ErrorState onRetry={onRetry} />);
    const first = buttons(r)[0]!;
    assert.deepEqual([first.props.label, first.props.disabled], ["Retry", false]);
    await pressAsync(first);
    assert.equal(calls, 1);
    const during = buttons(r)[0]!;
    assert.deepEqual([during.props.label, during.props.disabled], ["Retrying…", true]);
    await pressAsync(during); // a second press while pending does nothing
    assert.equal(calls, 1);
    await act(async () => release());
    const after = buttons(r)[0]!;
    assert.deepEqual([after.props.label, after.props.disabled], ["Retry", false]);
    await pressAsync(after);
    assert.equal(calls, 2);
  });

  it("a synchronous onRetry fires once per press; a rejecting one re-enables the button", async () => {
    let calls = 0;
    const r = mount(<ErrorState onRetry={() => void (calls += 1)} />);
    await pressAsync(buttons(r)[0]!);
    await pressAsync(buttons(r)[0]!);
    assert.equal(calls, 2);
    const failing = mount(<ErrorState onRetry={() => Promise.reject(new Error("again"))} />);
    await pressAsync(buttons(failing)[0]!);
    assert.equal(buttons(failing)[0]!.props.disabled, false);
  });

  it("a controlled retrying prop disables the button and shows the retrying label", () => {
    const r = mount(<ErrorState onRetry={noop} retrying retryingLabel="Trying again" />);
    assert.deepEqual([buttons(r)[0]!.props.label, buttons(r)[0]!.props.disabled], ["Trying again", true]);
  });

  it("the technical detail is absent from the tree until 'Show details' is pressed, then hideable", () => {
    const r = mount(<ErrorState detail="ECONNRESET at socket" />);
    assert.ok(!texts(r).includes("ECONNRESET at socket"));
    const toggle = () => r.root.find((n) => host(n) && n.props.accessibilityRole === "button");
    assert.equal(toggle().props.accessibilityLabel, "Show details");
    assert.equal(toggle().props.accessibilityState.expanded, false);
    assert.ok(flatten(toggle().props.style).minHeight >= 44);
    act(() => toggle().props.onPress());
    assert.ok(texts(r).includes("ECONNRESET at socket"));
    assert.equal(toggle().props.accessibilityLabel, "Hide details");
    assert.equal(toggle().props.accessibilityState.expanded, true);
    act(() => toggle().props.onPress());
    assert.ok(!texts(r).includes("ECONNRESET at socket"));
  });

  it("the detail toggle can be controlled and reports changes", () => {
    const seen: boolean[] = [];
    const r = mount(<ErrorState detail="boom" open onOpenChange={(o) => seen.push(o)} />);
    assert.ok(texts(r).includes("boom"));
    act(() => r.root.find((n) => host(n) && n.props.accessibilityRole === "button").props.onPress());
    assert.deepEqual(seen, [false]);
    assert.ok(texts(r).includes("boom"), "controlled: stays open until the parent changes it");
    assert.ok(texts(mount(<ErrorState detail="shown" defaultOpen />)).includes("shown"));
  });

  it("no retry button without onRetry; no toggle without detail", () => {
    const r = mount(<ErrorState />);
    assert.equal(buttons(r).length, 0);
    assert.equal(r.root.findAll((n) => host(n) && n.props.accessibilityRole === "button").length, 0);
  });
});

describe("PLRNUI-412 LoadingState and Result", () => {
  it("LoadingState names the spinner by its label and hides the visible duplicate", () => {
    const r = mount(<LoadingState label="Loading books" />);
    assert.equal(r.root.findByType(Spinner).props.accessibilityLabel, "Loading books");
    const hidden = r.root.find((n) => host(n) && n.props.accessibilityElementsHidden === true);
    assert.deepEqual(texts(hidden), ["Loading books"]);
    assert.equal(texts(mount(<LoadingState label="" />)).length, 0);
  });

  it("LoadingState variants: fullscreen fills, inline is a row", () => {
    const full = flatten(mount(<LoadingState testID="l" />).root.find((n) => host(n) && n.props.testID === "l").props.style);
    assert.equal(full.flex, 1);
    const inline = flatten(mount(<LoadingState variant="inline" testID="l" />).root.find((n) => host(n) && n.props.testID === "l").props.style);
    assert.equal(inline.flexDirection, "row");
  });

  it("Result presets have default titles; only the error status is an alert; the glyph is decorative", () => {
    const titles: Record<string, string> = { success: "Success", info: "For your information", warning: "Warning", error: "Something went wrong", "403": "Access denied", "404": "Page not found" };
    for (const [status, title] of Object.entries(titles)) {
      const r = mount(<Result status={status as never} testID="res" />);
      assert.ok(texts(r).includes(title), status);
      const root = r.root.find((n) => host(n) && n.props.testID === "res");
      assert.equal(root.props.accessibilityRole === "alert", status === "error", status);
      assert.ok(r.root.findAll((n) => host(n) && n.props.accessibilityElementsHidden === true).length >= 1);
    }
    const custom = mount(<Result title="Saved" description="All good" actions={<Button label="Done" />} icon={<Spinner />} />);
    assert.deepEqual(texts(custom).filter((t) => t === "Saved" || t === "All good"), ["Saved", "All good"]);
    assert.equal(buttons(custom).length, 1);
  });
});

describe("PLRNUI-412 AsyncBoundary", () => {
  const render = (props: Partial<AsyncBoundaryProps<string[]>> & { status: AsyncBoundaryProps<string[]>["status"] }) =>
    mount(<AsyncBoundary<string[]> {...props}>{(rows) => <Heading level={4}>{rows.join(",")}</Heading>}</AsyncBoundary>);

  it("renders the correct view for each status", () => {
    assert.equal(render({ status: "loading" }).root.findAllByType(Spinner).length, 1);
    assert.equal(render({ status: "idle" }).root.findAllByType(Spinner).length, 1, "idle shows the loading state");
    const error = render({ status: "error", error: new Error("boom") });
    assert.ok(texts(error).includes("Something went wrong"));
    assert.equal(error.root.findAllByType(Spinner).length, 0);
    assert.ok(texts(render({ status: "success", data: [] })).includes("Nothing here yet"));
    assert.ok(texts(render({ status: "success", data: null })).includes("Nothing here yet"));
    assert.deepEqual(texts(render({ status: "success", data: ["a", "b"] })), ["a,b"]);
  });

  it("fires the retry callback from the error view, with the error message only behind the details toggle", async () => {
    let calls = 0;
    const r = render({ status: "error", error: new Error("socket closed"), onRetry: () => void (calls += 1) });
    assert.ok(!texts(r).includes("socket closed"));
    await pressAsync(buttons(r)[0]!);
    assert.equal(calls, 1);
    act(() => r.root.find((n) => host(n) && n.props.accessibilityLabel === "Show details").props.onPress());
    assert.ok(texts(r).includes("socket closed"));
  });

  it("supports a custom isEmpty, custom loading/empty/error nodes and prop objects", () => {
    assert.deepEqual(texts(render({ status: "success", data: ["x"], isEmpty: (d) => d?.[0] === "x", empty: { title: "Custom empty", variant: "no-results" } satisfies EmptyStateProps })).includes("Custom empty"), true);
    assert.ok(texts(render({ status: "loading", loading: <Heading level={4}>Please wait</Heading> })).includes("Please wait"));
    assert.ok(texts(render({ status: "success", data: [], empty: <Heading level={4}>No rows</Heading> })).includes("No rows"));
    assert.ok(texts(render({ status: "error", errorView: <Heading level={4}>Broken</Heading> })).includes("Broken"));
    assert.ok(texts(render({ status: "error", errorView: { title: "Props error", variant: "inline" } })).includes("Props error"));
    assert.ok(texts(render({ status: "error", error: "plain string", errorView: { defaultOpen: true } })).includes("plain string"));
  });

  it("never calls children with missing data, even when a custom isEmpty says false", () => {
    let calls = 0;
    const r = mount(
      <AsyncBoundary<string[]> status="success" data={undefined} isEmpty={() => false}>
        {(rows) => (calls++, <Heading level={4}>{rows.join(",")}</Heading>)}
      </AsyncBoundary>
    );
    assert.equal(calls, 0);
    assert.ok(texts(r).includes("Nothing here yet"));
  });

  it("caller props in errorView win over the defaults derived from the error and onRetry", async () => {
    const own: string[] = [];
    const r = mount(
      <AsyncBoundary<string[]> status="error" error={new Error("from error")} onRetry={() => void own.push("boundary")} errorView={{ detail: "from props", onRetry: () => void own.push("props"), defaultOpen: true }}>
        {() => null}
      </AsyncBoundary>
    );
    assert.ok(texts(r).includes("from props"));
    assert.ok(!texts(r).includes("from error"));
    await pressAsync(buttons(r)[0]!);
    assert.deepEqual(own, ["props"]);
  });

  it("keeps the state view filling its container when wrapped by style or testID", () => {
    const r = mount(
      <AsyncBoundary<string[]> status="loading" testID="b" style={{ margin: 2 }}>
        {() => null}
      </AsyncBoundary>
    );
    const wrapper = flatten(r.root.find((n) => host(n) && n.props.testID === "b").props.style);
    assert.deepEqual([wrapper.flex, wrapper.margin], [1, 2]);
  });

  it("a retry that settles after unmount does not touch state", async () => {
    let release!: () => void;
    const r = mount(<ErrorState onRetry={() => new Promise<void>((resolve) => (release = resolve))} />);
    await pressAsync(buttons(r)[0]!);
    act(() => r.unmount());
    await act(async () => release());
  });

  it("the error Result is one accessible alert group; the other statuses are not", () => {
    const err = mount(<Result status="error" testID="x" />).root.find((n) => host(n) && n.props.testID === "x");
    assert.deepEqual([err.props.accessible, err.props.accessibilityRole], [true, "alert"]);
    const ok = mount(<Result status="success" testID="x" />).root.find((n) => host(n) && n.props.testID === "x");
    assert.equal(ok.props.accessible, false);
  });

  it("wraps in a View only when style or testID is given", () => {
    const wrapped = render({ status: "success", data: ["a"], testID: "boundary", style: { margin: 2 } });
    assert.equal(wrapped.root.findAll((n) => host(n) && n.props.testID === "boundary").length, 1);
    const bare = render({ status: "success", data: ["a"] });
    assert.equal(bare.root.findAll((n) => host(n) && n.props.testID === "boundary").length, 0);
  });
});

describe("PLRNUI-412 theming", () => {
  it("renders every part under light and dark ThemeProvider with token colours only", () => {
    for (const mode of ["light", "dark"] as const) {
      const colors = mode === "light" ? lightColors : darkColors;
      const r = mount(
        <>
          <ErrorState title="E" message="m" detail="d" onRetry={noop} testID="e" />
          <Result status="success" />
          <EmptyState actionLabel="A" onAction={noop} />
          <LoadingState />
        </>,
        mode
      );
      const allowed = new Set<string>([...Object.values(colors), "transparent"]);
      for (const n of r.root.findAll(host)) {
        const style = flatten(n.props.style);
        for (const key of ["color", "backgroundColor", "borderColor"]) if (typeof style[key] === "string") assert.ok(allowed.has(style[key]), `${mode} ${key}=${style[key]}`);
      }
      assert.ok(r.root.findAllByType(Heading).length >= 3, "titles are Headings in every part");
    }
  });

  it("the source has no hardcoded colours", () => {
    const source = readFileSync("src/components/StateView/StateView.tsx", "utf8");
    assert.doesNotMatch(source, /#[0-9a-fA-F]{3,8}\b/);
    assert.doesNotMatch(source, /rgba?\(|hsla?\(/);
    assert.doesNotMatch(source, /["'`](red|white|black|blue|green|gray|grey|yellow|orange|purple|pink|transparent)["'`]/i, "no named colours");
  });
});
