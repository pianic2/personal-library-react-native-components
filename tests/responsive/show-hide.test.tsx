import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import TestRenderer, { act } from "react-test-renderer";
import type { Breakpoint } from "../../src/hooks/useBreakpoint.js";
import { Hide, Show, matchesCondition, type ShowProps } from "../../src/responsive/Show.js";
import { Responsive } from "../../src/responsive/Responsive.js";
import { withWindowSize } from "../helpers/dimensions.js";

function render(ui: React.ReactElement): TestRenderer.ReactTestRenderer {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(ui);
  });
  return renderer;
}

const text = (r: TestRenderer.ReactTestRenderer): string => JSON.stringify(r.toJSON());

function shown(width: number, props: Omit<ShowProps, "children">, Component: typeof Show = Show, height = 800): boolean {
  const r = render(withWindowSize(<Component {...props}><Marker /></Component>, { width, height }));
  return text(r).includes("marker");
}

function Marker() {
  return React.createElement("marker");
}

describe("PLRNUI-164 Show", () => {
  it("above='md' renders at 768 and not at 767", () => {
    assert.equal(shown(767, { above: "md" }), false);
    assert.equal(shown(768, { above: "md" }), true);
    assert.equal(shown(1500, { above: "md" }), true);
  });

  it("below='md' renders at 767 and not at 768", () => {
    assert.equal(shown(767, { below: "md" }), true);
    assert.equal(shown(768, { below: "md" }), false);
    assert.equal(shown(100, { below: "sm" }), true);
    assert.equal(shown(480, { below: "sm" }), false);
  });

  it("at / only match exactly one breakpoint or any of a list", () => {
    assert.equal(shown(800, { at: "md" }), true);
    assert.equal(shown(500, { at: "md" }), false);
    assert.equal(shown(1100, { at: "md" }), false);
    assert.equal(shown(800, { only: ["md", "lg"] }), true);
    assert.equal(shown(1100, { only: ["md", "lg"] }), true);
    assert.equal(shown(1300, { only: ["md", "lg"] }), false);
  });

  it("several conditions must all hold, and none at all shows always", () => {
    assert.equal(shown(900, { above: "md", below: "xl" }), true);
    assert.equal(shown(1300, { above: "md", below: "xl" }), false);
    assert.equal(shown(500, { above: "md", below: "xl" }), false);
    assert.equal(shown(10, {}), true);
  });

  it("sizeClass matches the width size class (600 / 840)", () => {
    assert.equal(shown(599, { sizeClass: "compact" }), true);
    assert.equal(shown(600, { sizeClass: "compact" }), false);
    assert.equal(shown(600, { sizeClass: "medium" }), true);
    assert.equal(shown(839, { sizeClass: ["compact", "medium"] }), true);
    assert.equal(shown(840, { sizeClass: ["compact", "medium"] }), false);
    assert.equal(shown(840, { sizeClass: "expanded" }), true);
  });

  it("the children are unmounted (not display none) when hidden", () => {
    const r = render(withWindowSize(<Show above="lg"><Marker /></Show>, { width: 400, height: 800 }));
    assert.equal(r.toJSON(), null);
    assert.equal(r.root.findAllByType(Marker).length, 0);
  });

  it("keepMounted keeps the children mounted and hides them with display none", () => {
    const hidden = render(withWindowSize(<Show above="lg" keepMounted><Marker /></Show>, { width: 400, height: 800 }));
    assert.equal(hidden.root.findAllByType(Marker).length, 1);
    assert.match(text(hidden), /"display":"none"/);
    const visible = render(withWindowSize(<Show above="lg" keepMounted><Marker /></Show>, { width: 1100, height: 800 }));
    assert.equal(visible.root.findAllByType(Marker).length, 1);
    assert.doesNotMatch(text(visible), /display/);
  });

  it("keepMounted keeps the same child instance across visible <-> hidden; without it the child remounts", () => {
    const counts = { mount: 0, unmount: 0 };
    function Counter() {
      React.useEffect(() => {
        counts.mount += 1;
        return () => {
          counts.unmount += 1;
        };
      }, []);
      return null;
    }
    const tree = (width: number, keepMounted: boolean) =>
      withWindowSize(<Show above="md" keepMounted={keepMounted}><Counter /></Show>, { width, height: 800 });
    const r = render(tree(500, true));
    act(() => r.update(tree(900, true)));
    act(() => r.update(tree(500, true)));
    assert.deepEqual(counts, { mount: 1, unmount: 0 });
    counts.mount = 0;
    counts.unmount = 0;
    const r2 = render(tree(500, false));
    act(() => r2.update(tree(900, false)));
    assert.deepEqual(counts, { mount: 1, unmount: 0 });
    act(() => r2.update(tree(500, false)));
    assert.deepEqual(counts, { mount: 1, unmount: 1 });
  });

  it("follows a window change", () => {
    const tree = (width: number) => withWindowSize(<Show above="md"><Marker /></Show>, { width, height: 800 });
    const r = render(tree(500));
    assert.equal(r.root.findAllByType(Marker).length, 0);
    act(() => r.update(tree(900)));
    assert.equal(r.root.findAllByType(Marker).length, 1);
    act(() => r.update(tree(500)));
    assert.equal(r.root.findAllByType(Marker).length, 0);
  });
});

describe("PLRNUI-164 Hide", () => {
  it("is the inverse of Show for the same condition", () => {
    for (const width of [100, 479, 480, 767, 768, 1023, 1024, 1279, 1280]) {
      for (const condition of [{ above: "md" }, { below: "lg" }, { at: "sm" }, { sizeClass: "medium" }] as Array<Omit<ShowProps, "children">>) {
        assert.notEqual(shown(width, condition, Show), shown(width, condition, Hide), `${width} ${JSON.stringify(condition)}`);
      }
    }
  });

  it("Hide above='md' hides at 768 and shows at 767; keepMounted hides with display none", () => {
    assert.equal(shown(767, { above: "md" }, Hide), true);
    assert.equal(shown(768, { above: "md" }, Hide), false);
    const r = render(withWindowSize(<Hide above="md" keepMounted><Marker /></Hide>, { width: 900, height: 800 }));
    assert.equal(r.root.findAllByType(Marker).length, 1);
    assert.match(text(r), /"display":"none"/);
  });
});

describe("PLRNUI-164 Responsive", () => {
  function pick(width: number, props: React.ComponentProps<typeof Responsive>): string {
    const r = render(withWindowSize(<Responsive {...props} />, { width, height: 800 }));
    return JSON.stringify(r.toJSON());
  }
  const node = (name: string) => React.createElement(name);

  it("picks the nearest smaller given breakpoint (mobile-first)", () => {
    const props = { base: node("phone"), md: node("tablet"), xl: node("desktop") };
    const table: Array<[number, Breakpoint, string]> = [
      [300, "base", "phone"],
      [500, "sm", "phone"],
      [800, "md", "tablet"],
      [1100, "lg", "tablet"],
      [1400, "xl", "desktop"],
    ];
    for (const [width, , expected] of table) assert.equal(pick(width, props), JSON.stringify({ type: expected, props: {}, children: null }), String(width));
  });

  it("renders nothing when no node at or below the current breakpoint is given", () => {
    assert.equal(pick(300, { md: node("tablet") }), "null");
    assert.equal(pick(800, { md: node("tablet") }), JSON.stringify({ type: "tablet", props: {}, children: null }));
  });

  it("mounts only the matching node", () => {
    const mounted: string[] = [];
    function Probe({ name }: { name: string }) {
      React.useEffect(() => {
        mounted.push(name);
      }, [name]);
      return null;
    }
    render(withWindowSize(<Responsive base={<Probe name="base" />} md={<Probe name="md" />} xl={<Probe name="xl" />} />, { width: 800, height: 800 }));
    assert.deepEqual(mounted, ["md"]);
  });

  it("a text node and a falsy base are handled", () => {
    assert.equal(pick(800, { base: "phone text", md: "tablet text" }), JSON.stringify("tablet text"));
    assert.equal(pick(300, { base: null, md: node("tablet") }), "null");
  });
});

describe("PLRNUI-164 pure rule", () => {
  it("matchesCondition is a conjunction of its parts", () => {
    assert.equal(matchesCondition("md", "medium", {}), true);
    assert.equal(matchesCondition("md", "medium", { above: "md", sizeClass: "medium" }), true);
    assert.equal(matchesCondition("md", "medium", { above: "md", sizeClass: "expanded" }), false);
    assert.equal(matchesCondition("base", "compact", { below: "base" }), false);
  });
});
