import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { register } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import TestRenderer, { act } from "react-test-renderer";

// Examples import the public package name; map it to src for the test run (same mapping as tsconfig.tests.json).
const root = resolve(import.meta.dirname, "../..");
const srcEntry = pathToFileURL(join(root, "src", "index.ts")).href;
register(
  `data:text/javascript,${encodeURIComponent(`
    export function resolve(specifier, context, nextResolve) {
      if (specifier === "@personal-library/react-native-components") {
        return { shortCircuit: true, url: ${JSON.stringify(srcEntry)} };
      }
      return nextResolve(specifier, context);
    }
  `)}`,
  import.meta.url,
);

// tsx applies tsconfig.json only to files matched by its "include" (src), so example files are compiled with the
// classic JSX transform and expect a global React. Provide it for the example imports.
(globalThis as { React?: typeof React }).React = React;

const examplesDir = join(root, "examples");
const exampleFiles = readdirSync(examplesDir).filter((name) => name.endsWith(".tsx")).sort();

// Naming convention (see README.md in this folder): each examples/*.tsx exports one or more components named
// <Something>Example that render without props.
describe("PLRNUI-185 examples render", () => {
  it("finds example files", () => {
    assert.ok(exampleFiles.length > 0, "examples/ must contain example files");
  });

  for (const file of exampleFiles) {
    it(`${file} exports at least one *Example component and renders it without error`, async () => {
      const module = (await import(pathToFileURL(join(examplesDir, file)).href)) as Record<string, unknown>;
      const components = Object.entries(module).filter(([name, value]) => name.endsWith("Example") && typeof value === "function");
      assert.ok(components.length > 0, `${file} must export a component whose name ends with "Example"`);
      for (const [name, Component] of components) {
        let renderer: TestRenderer.ReactTestRenderer | undefined;
        act(() => {
          renderer = TestRenderer.create(React.createElement(Component as React.ComponentType));
        });
        assert.ok(renderer?.toJSON(), `${name} rendered nothing`);
        act(() => renderer?.unmount());
      }
    });
  }

  it("an example with a bad import fails to load", async () => {
    const dir = mkdtempSync(join(tmpdir(), "bad-example-"));
    try {
      const file = join(dir, "bad.tsx");
      writeFileSync(file, 'import { Nope } from "@personal-library/react-native-components/does-not-exist";\nexport const BadExample = () => Nope;\n');
      await assert.rejects(import(pathToFileURL(file).href));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("an example with a bad import fails the tsconfig.tests.json type check", () => {
    const dir = mkdtempSync(join(root, ".tmp-bad-example-"));
    try {
      mkdirSync(join(dir, "examples"));
      writeFileSync(join(dir, "examples", "bad.tsx"), 'import { DoesNotExist } from "@personal-library/react-native-components";\nexport const BadExample = () => DoesNotExist;\n');
      writeFileSync(
        join(dir, "tsconfig.json"),
        JSON.stringify({ extends: "../tsconfig.tests.json", compilerOptions: { rootDir: ".." }, include: ["examples/**/*.tsx"] }),
      );
      const result = spawnSync(process.execPath, [join(root, "node_modules", "typescript", "bin", "tsc"), "-p", join(dir, "tsconfig.json"), "--noEmit"], { encoding: "utf8" });
      assert.notEqual(result.status, 0, "a bad import must fail type checking");
      assert.match(result.stdout, /DoesNotExist/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
