import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import TestRenderer, { act } from "react-test-renderer";

// @ts-expect-error the loader is plain JavaScript without declarations
import { loadMetas } from "../../scripts/lib/meta.mjs";
import { ThemeProvider } from "../../src";
import { fixtures, requireFixture } from "../helpers/fixtures";

const root = resolve(import.meta.dirname, "../..");
const names: string[] = loadMetas(root).map((entry: { dir: string }) => entry.dir);
const modes = ["light", "dark"] as const;

function render(element: React.ReactElement, mode: (typeof modes)[number]) {
  const errors: unknown[][] = [];
  const original = console.error;
  // react-test-renderer logs its own deprecation notice once per process; that notice is not a component error.
  console.error = (...args: unknown[]) => {
    if (!String(args[0]).includes("react-test-renderer is deprecated")) errors.push(args);
  };
  try {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<ThemeProvider initialMode={mode}>{element}</ThemeProvider>);
    });
    return { tree: renderer.toJSON(), errors };
  } finally {
    console.error = original;
  }
}

describe("PLRNUI-195 render matrix (component meta x light/dark)", () => {
  it("lists every component directory (meta entry) and every fixture belongs to one", () => {
    assert.equal(names.length, 36);
    assert.deepEqual(Object.keys(fixtures).sort(), [...names].sort());
  });

  it("the harness reports a console.error raised while rendering, and a component that renders nothing", () => {
    function Noisy() {
      console.error("boom");
      return null;
    }
    const { tree, errors } = render(<Noisy />, "light");
    assert.equal(tree, null);
    assert.deepEqual(errors, [["boom"]]);
  });

  it("fails with a clear message for a meta entry without a fixture", () => {
    assert.throws(() => requireFixture("Ghost"), /Component "Ghost" has a meta entry .* no render fixture: add "Ghost" to tests\/helpers\/fixtures\.tsx/);
  });

  for (const name of names) {
    for (const mode of modes) {
      it(`${name} renders under ThemeProvider (${mode}) without console.error`, () => {
        const { tree, errors } = render(requireFixture(name)(), mode);
        assert.ok(tree, `${name} rendered nothing`);
        assert.deepEqual(errors, []);
      });
    }
  }

  // Components that had no render test before this matrix (audit E1).
  for (const name of ["B", "P", "Small", "Quote", "TextGroup", "FormField"]) {
    it(`${name} is covered by the matrix in both modes`, () => {
      assert.ok(names.includes(name), `${name} is not a component directory`);
      for (const mode of modes) assert.ok(render(requireFixture(name)(), mode).tree);
    });
  }
});
