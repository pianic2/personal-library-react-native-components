import React from "react";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { ThemeProvider } from "../../src";
import { MotionProvider } from "../../src/motion/MotionProvider.js";
import { Carousel, PageIndicator, Pager } from "../../src/components/Pager/index.js";
import { createBaseTheme } from "../../src/theme/defaultTheme.js";
import { renderWithMotion } from "../helpers/motion.js";

const WIDTH = 300;
const filterWarning = console.error;
beforeEach(() => {
  console.error = (...args: unknown[]) => {
    if (!String(args[0]).includes("react-test-renderer is deprecated")) filterWarning(...args);
  };
});
afterEach(() => {
  console.error = filterWarning;
  mock.timers.reset();
});

const flatten = (style: unknown): Record<string, any> => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));

function mount(element: React.ReactElement, mode: "light" | "dark" = "light"): ReactTestRenderer {
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(<ThemeProvider preference={mode}>{element}</ThemeProvider>);
  });
  return renderer;
}

const scroller = (r: ReactTestRenderer, id = "p"): ReactTestInstance =>
  r.root.findAll((n) => n.props.testID === id && typeof n.props.onMomentumScrollEnd === "function")[0]!;
const layout = (r: ReactTestRenderer, id = "p", width = WIDTH) => act(() => scroller(r, id).props.onLayout({ nativeEvent: { layout: { width, height: 100 } } }));
const settle = (r: ReactTestRenderer, x: number, id = "p") => act(() => scroller(r, id).props.onMomentumScrollEnd({ nativeEvent: { contentOffset: { x, y: 0 } } }));
const pageContent = (r: ReactTestRenderer, i: number, id = "p") => r.root.findAll((n) => n.props.testID === `${id}-page-${i}` && typeof n.type === "string")[0]!;
const rendered = (r: ReactTestRenderer, i: number, id = "p") => pageContent(r, i, id).children.length > 0;

function renderPageFactory(log: number[]) {
  return (i: number) => {
    log.push(i);
    return <React.Fragment>{`content-${i}`}</React.Fragment>;
  };
}

describe("PLRNUI-297 Pager lazy mounting", () => {
  it("with 100 pages only the current page and its neighbours are mounted", () => {
    const log: number[] = [];
    const r = mount(<Pager testID="p" count={100} defaultIndex={50} renderPage={renderPageFactory(log)} />);
    layout(r);
    const mounted = Array.from({ length: 100 }, (_, i) => i).filter((i) => rendered(r, i));
    assert.deepEqual(mounted, [49, 50, 51]);
    assert.ok(new Set(log).size === 3, `renderPage called for ${[...new Set(log)].join(",")}`);
  });

  it("the window follows the settled page", () => {
    const r = mount(<Pager testID="p" count={100} renderPage={renderPageFactory([])} />);
    layout(r);
    settle(r, WIDTH * 10);
    const mounted = Array.from({ length: 100 }, (_, i) => i).filter((i) => rendered(r, i));
    assert.deepEqual(mounted, [9, 10, 11]);
  });

  it("lazy={false} mounts every page", () => {
    const r = mount(<Pager testID="p" count={5} lazy={false} renderPage={renderPageFactory([])} />);
    layout(r);
    assert.deepEqual([0, 1, 2, 3, 4].filter((i) => rendered(r, i)), [0, 1, 2, 3, 4]);
  });
});

describe("PLRNUI-297 Pager index", () => {
  it("onIndexChange fires once per settle, not on scroll events, and not again for the same page", () => {
    const calls: number[] = [];
    const r = mount(<Pager testID="p" count={5} onIndexChange={(i) => calls.push(i)} renderPage={renderPageFactory([])} />);
    layout(r);
    act(() => {
      for (const x of [10, 80, 150, 290]) scroller(r).props.onScroll?.({ nativeEvent: { contentOffset: { x, y: 0 } } });
    });
    assert.deepEqual(calls, []);
    settle(r, WIDTH);
    settle(r, WIDTH);
    settle(r, WIDTH + 2);
    assert.deepEqual(calls, [1]);
    settle(r, WIDTH * 3);
    assert.deepEqual(calls, [1, 3]);
  });

  it("controlled: a settle that the parent ignores is reported once, and the parent index is kept", () => {
    const calls: number[] = [];
    const r = mount(<Pager testID="p" count={5} index={0} onIndexChange={(i) => calls.push(i)} renderPage={renderPageFactory([])} />);
    layout(r);
    settle(r, WIDTH * 2);
    settle(r, WIDTH * 2);
    assert.deepEqual(calls, [2]);
    assert.equal(rendered(r, 0), true);
    assert.equal(rendered(r, 3), false);
  });

  it("controlled: changing index from the parent moves the window and does not call onIndexChange", () => {
    const calls: number[] = [];
    const ui = (index: number) => (
      <ThemeProvider preference="light">
        <Pager testID="p" count={10} index={index} onIndexChange={(i) => calls.push(i)} renderPage={renderPageFactory([])} />
      </ThemeProvider>
    );
    let r!: ReactTestRenderer;
    act(() => {
      r = TestRenderer.create(ui(0));
    });
    layout(r);
    act(() => r.update(ui(6)));
    assert.deepEqual([5, 6, 7].map((i) => rendered(r, i)), [true, true, true]);
    assert.equal(rendered(r, 0), false);
    assert.deepEqual(calls, []);
  });

  it("an out-of-range index is clamped", () => {
    const r = mount(<Pager testID="p" count={3} index={99} renderPage={renderPageFactory([])} />);
    layout(r);
    assert.deepEqual([0, 1, 2].map((i) => rendered(r, i)), [false, true, true]);
  });

  it("only the current page is exposed to assistive technology", () => {
    const r = mount(<Pager testID="p" count={3} defaultIndex={1} renderPage={renderPageFactory([])} />);
    layout(r);
    assert.deepEqual([0, 1, 2].map((i) => pageContent(r, i).props.accessibilityElementsHidden), [true, false, true]);
  });
});

describe("PLRNUI-297 PageIndicator", () => {
  it("exposes 'Page X of Y' as one labelled element and hides the dots", () => {
    const r = mount(<PageIndicator testID="pi" count={5} index={2} />);
    const root = r.root.findAll((n) => n.props.testID === "pi" && typeof n.type === "string")[0]!;
    assert.equal(root.props.accessibilityLabel, "Page 3 of 5");
    assert.equal(root.props.accessible, true);
    assert.deepEqual(root.props.accessibilityValue, { min: 1, max: 5, now: 3 });
    const dots = r.root.findAll((n) => typeof n.type === "string" && String(n.props.testID).startsWith("pi-dot-"));
    assert.equal(dots.length, 5);
    assert.ok(dots.every((d) => d.props.accessibilityElementsHidden === true));
  });

  it("the label follows the index and can be replaced", () => {
    const r = mount(<PageIndicator testID="pi" count={3} index={0} />);
    const label = () => r.root.findAll((n) => n.props.testID === "pi" && typeof n.type === "string")[0]!.props.accessibilityLabel;
    assert.equal(label(), "Page 1 of 3");
    act(() => r.update(<ThemeProvider preference="light"><PageIndicator testID="pi" count={3} index={2} accessibilityLabel="Slide 3" /></ThemeProvider>));
    assert.equal(label(), "Slide 3");
  });

  it("highlights the current dot with theme tokens in light and dark", () => {
    for (const mode of ["light", "dark"] as const) {
      const theme = createBaseTheme(mode);
      const r = mount(<PageIndicator testID="pi" count={3} index={1} size="md" />, mode);
      const bg = (i: number) => flatten(r.root.findAll((n) => typeof n.type === "string" && n.props.testID === `pi-dot-${i}`)[0]!.props.style);
      assert.equal(bg(1).backgroundColor, theme.semantic.action.primary, mode);
      assert.equal(bg(0).backgroundColor, theme.semantic.border.default, mode);
      assert.equal(bg(0).width, theme.space.md);
      assert.equal(bg(0).borderRadius, theme.radius.full);
    }
  });

  it("clamps an out-of-range index and survives a zero count", () => {
    const r = mount(<PageIndicator testID="pi" count={3} index={9} />);
    assert.equal(r.root.findAll((n) => n.props.testID === "pi" && typeof n.type === "string")[0]!.props.accessibilityLabel, "Page 3 of 3");
    assert.doesNotThrow(() => mount(<PageIndicator count={0} index={0} />));
  });
});

describe("PLRNUI-297 Carousel", () => {
  const carousel = (props: Partial<React.ComponentProps<typeof Carousel>> = {}) => (
    <Carousel testID="c" count={4} renderPage={renderPageFactory([])} {...props} />
  );

  it("peek insets the pages and snaps by one page width", () => {
    const r = mount(carousel({ peek: 20 }));
    layout(r, "c");
    const s = scroller(r, "c");
    assert.equal(s.props.snapToInterval, WIDTH - 40);
    assert.equal(s.props.pagingEnabled, false);
    assert.equal(flatten(s.props.contentContainerStyle).paddingHorizontal, 20);
    assert.equal(flatten(pageContent(r, 0, "c").props.style).width, WIDTH - 40);
    settle(r, WIDTH - 40, "c");
    assert.equal(rendered(r, 1, "c"), true);
    assert.equal(rendered(r, 3, "c"), false);
  });

  it("without peek it pages like Pager", () => {
    const r = mount(carousel());
    layout(r, "c");
    assert.equal(scroller(r, "c").props.pagingEnabled, true);
  });

  it("autoplay advances after the interval, reports onIndexChange and stops on the last page", () => {
    mock.timers.enable({ apis: ["setTimeout"] });
    const calls: number[] = [];
    const r = mount(carousel({ autoplay: true, autoplayInterval: 1000, onIndexChange: (i) => calls.push(i) }));
    layout(r, "c");
    act(() => mock.timers.tick(999));
    assert.deepEqual(calls, []);
    act(() => mock.timers.tick(1));
    assert.deepEqual(calls, [1]);
    act(() => mock.timers.tick(1000));
    act(() => mock.timers.tick(1000));
    assert.deepEqual(calls, [1, 2, 3]);
    act(() => mock.timers.tick(10000));
    assert.deepEqual(calls, [1, 2, 3]);
  });

  it("autoplay is off without the prop", () => {
    mock.timers.enable({ apis: ["setTimeout"] });
    const calls: number[] = [];
    mount(carousel({ onIndexChange: (i) => calls.push(i) }));
    act(() => mock.timers.tick(60000));
    assert.deepEqual(calls, []);
  });

  it("autoplay pauses while the user touches and resumes after", () => {
    mock.timers.enable({ apis: ["setTimeout"] });
    const calls: number[] = [];
    const r = mount(carousel({ autoplay: true, autoplayInterval: 1000, onIndexChange: (i) => calls.push(i) }));
    layout(r, "c");
    act(() => scroller(r, "c").props.onTouchStart());
    act(() => mock.timers.tick(5000));
    assert.deepEqual(calls, []);
    act(() => scroller(r, "c").props.onTouchEnd());
    act(() => mock.timers.tick(1000));
    assert.deepEqual(calls, [1]);
  });

  it("autoplay is disabled when the system asks to reduce motion", () => {
    mock.timers.enable({ apis: ["setTimeout"] });
    const calls: number[] = [];
    const { renderer } = renderWithMotion(
      <ThemeProvider preference="light">{carousel({ autoplay: true, autoplayInterval: 1000, onIndexChange: (i) => calls.push(i) })}</ThemeProvider>,
      true
    );
    layout(renderer, "c");
    act(() => mock.timers.tick(10000));
    assert.deepEqual(calls, []);
  });

  it("autoplay is disabled by MotionProvider reduceMotion=always and enabled by never", () => {
    for (const [mode, expected] of [["always", []], ["never", [1]]] as const) {
      mock.timers.reset();
      mock.timers.enable({ apis: ["setTimeout"] });
      const calls: number[] = [];
      mount(
        <MotionProvider reduceMotion={mode}>{carousel({ autoplay: true, autoplayInterval: 1000, onIndexChange: (i) => calls.push(i) })}</MotionProvider>
      );
      act(() => mock.timers.tick(1000));
      assert.deepEqual(calls, expected, mode);
    }
  });

  it("clears the autoplay timer on unmount", () => {
    mock.timers.enable({ apis: ["setTimeout"] });
    const calls: number[] = [];
    const r = mount(carousel({ autoplay: true, autoplayInterval: 1000, onIndexChange: (i) => calls.push(i) }));
    act(() => r.unmount());
    act(() => mock.timers.tick(10000));
    assert.deepEqual(calls, []);
  });

  it("clears a pending timer when autoplay is switched off", () => {
    mock.timers.enable({ apis: ["setTimeout"] });
    const calls: number[] = [];
    const ui = (autoplay: boolean) => (
      <ThemeProvider preference="light">{carousel({ autoplay, autoplayInterval: 1000, onIndexChange: (i) => calls.push(i) })}</ThemeProvider>
    );
    let r!: ReactTestRenderer;
    act(() => {
      r = TestRenderer.create(ui(true));
    });
    act(() => r.update(ui(false)));
    act(() => mock.timers.tick(10000));
    assert.deepEqual(calls, []);
  });
});
