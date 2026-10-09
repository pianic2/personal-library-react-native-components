import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
// @ts-expect-error plain ESM script without type declarations
import { extractProps, serialize } from "../../scripts/ai/lib/extract-props.mjs";

const root = resolve(import.meta.dirname, "../..");
const script = join(root, "scripts/ai/lib/extract-props.mjs");
const dirs: string[] = [];

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop() as string, { recursive: true, force: true });
});

function fixture(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), "extract-props-"));
  dirs.push(dir);
  symlinkSync(join(root, "node_modules"), join(dir, "node_modules"));
  mkdirSync(join(dir, "src"));
  for (const [name, content] of Object.entries(files)) writeFileSync(join(dir, "src", name), content);
  return dir;
}

const repo = extractProps({ root });

describe("PLRNUI-130 props extractor on the repo", () => {
  it("Button: variant and size unions in declaration order with their defaults", () => {
    const { props } = repo.components.Button;
    assert.deepEqual(props.variant.values, ["primary", "secondary", "ghost", "danger", "info"]);
    assert.equal(props.variant.default, "primary");
    assert.deepEqual(props.size.values, ["xs", "sm", "md", "lg"]);
    assert.equal(props.size.default, "md");
    assert.equal(props.disabled.default, false);
    assert.equal(props.variant.optional, true);
    assert.equal(repo.components.Button.propsType, "ButtonProps");
    assert.equal(repo.components.Button.propsTypeExported, true);
  });

  it("every PascalCase value export of the root API yields an entry or a documented skip", () => {
    const snapshot = readFileSync(join(root, "audit/api/public-root-api.snapshot"), "utf8").split("\n").filter(Boolean);
    const values = snapshot.filter((s) => s.startsWith("value:")).map((s) => s.slice(6)).filter((n) => /^[A-Z][a-z]/.test(n) || /^[A-Z]$/.test(n));
    assert.ok(values.length > 30);
    for (const name of values) {
      assert.ok(name in repo.components || name in repo.skipped, `${name} has neither an entry nor a skip`);
    }
  });

  it("components without an exported Props type are still extracted and flagged", () => {
    for (const name of ["Modal", "Select", "BottomSheet", "Popover", "Tooltip"]) {
      const entry = repo.components[name];
      assert.ok(entry, `${name} missing`);
      assert.equal(entry.propsTypeExported, false);
      assert.ok(Object.keys(entry.props).length > 0);
    }
  });

  it("two runs in separate processes give equal sha256 hashes", () => {
    const run = () => {
      const out = spawnSync(process.execPath, [script, "--root", root], { encoding: "utf8" });
      assert.equal(out.status, 0, out.stderr);
      return createHash("sha256").update(out.stdout).digest("hex");
    };
    assert.equal(run(), run());
  });

  it("output has sorted keys and no absolute paths", () => {
    const text = serialize(repo);
    assert.ok(!text.includes(root));
    const keys = Object.keys(JSON.parse(text).components);
    assert.deepEqual(keys, [...keys].sort());
  });
});

describe("PLRNUI-130 props extractor on fixtures", () => {
  it("resolves function, arrow, forwardRef and memo components, JSDoc and @default", () => {
    const dir = fixture({
      "index.ts": `export { A, B, C, D } from "./c"; export type { AProps } from "./c"; export const NOT_A_COMPONENT = "x"; export function useThing() { return 1; }`,
      "c.tsx": `
        import React, { forwardRef, memo } from "react";
        export interface AProps {
          /** The tone. */
          tone?: "calm" | "loud";
          /** @default 3 */
          count?: number;
          required: string;
        }
        export function A({ tone = "calm", required }: AProps) { return null; }
        export const B = ({ n = 2 }: { n?: number }) => null;
        export const C = forwardRef<unknown, { label?: string; mode?: "x" | "y" }>(({ mode = "y" }, _ref) => null);
        export const D = memo(({ flag = true }: { flag?: boolean }) => null);
      `,
    });
    const { components } = extractProps({ root: dir });
    assert.deepEqual(Object.keys(components).sort(), ["A", "B", "C", "D"]);
    assert.equal(components.A.props.tone.description, "The tone.");
    assert.equal(components.A.props.tone.default, "calm");
    assert.equal(components.A.props.count.default, "3");
    assert.equal(components.A.props.required.optional, false);
    assert.equal(components.B.props.n.default, 2);
    assert.equal(components.B.propsType, null);
    assert.deepEqual(components.C.props.mode.values, ["x", "y"]);
    assert.equal(components.C.props.mode.default, "y");
    assert.equal(components.D.props.flag.default, true);
  });

  it("non-literal defaults are reported as expressions", () => {
    const dir = fixture({
      "index.ts": `export { A } from "./c";`,
      "c.tsx": `const base = 4; export function A({ gap = base * 2 }: { gap?: number }) { return null; }`,
    });
    const { components } = extractProps({ root: dir });
    assert.equal(components.A.props.gap.defaultExpression, "base * 2");
    assert.equal("default" in components.A.props.gap, false);
  });

  it("fails closed on a broken tsconfig, an empty result, and a flag used as a value", () => {
    const broken = fixture({ "index.ts": `export { A } from "./c";`, "c.tsx": `export function A() { return null; }` });
    writeFileSync(join(broken, "tsconfig.json"), JSON.stringify({ extends: "./missing.json" }));
    assert.throws(() => extractProps({ root: broken }), /tsconfig\.json/);
    const empty = fixture({ "index.ts": `export const X = 1;` });
    assert.throws(() => extractProps({ root: empty }), /no components extracted/);
    const out = spawnSync(process.execPath, [script, "--root", "--entry", "x"], { encoding: "utf8" });
    assert.equal(out.status, 2);
  });

  it("skips non-object first parameters and class components visibly", () => {
    const dir = fixture({
      "index.ts": `export { Helper, Real, Klass } from "./c";`,
      "c.tsx": `import React from "react";
        export function Helper(a: number) { return a; }
        export function Real({ x = 1 }: { x?: number }) { return null; }
        export class Klass extends React.Component<{ y?: string }> { render() { return null; } }`,
    });
    const result = extractProps({ root: dir });
    assert.deepEqual(Object.keys(result.components), ["Real"]);
    assert.match(result.skipped.Helper, /not an object/);
    assert.match(result.skipped.Klass, /class/);
  });

  it("fails on a missing entry and on an unknown CLI argument", () => {
    assert.throws(() => extractProps({ root, entry: "src/nope.ts" }), /entry not found/);
    const out = spawnSync(process.execPath, [script, "--bogus", "x"], { encoding: "utf8" });
    assert.equal(out.status, 2);
  });
});
