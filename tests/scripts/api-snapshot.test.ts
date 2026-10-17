import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const repo = resolve(import.meta.dirname, "../..");
const script = join(repo, "scripts/public-api-snapshot.mjs");
const dirs: string[] = [];

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop() as string, { recursive: true, force: true });
});

function write(root: string, file: string, text: string) {
  mkdirSync(dirname(join(root, file)), { recursive: true });
  writeFileSync(join(root, file), text);
}

/** A tiny project: root and theme subpaths, `export *`, a rename, a function and a const. */
function project(files: Record<string, string> = {}): string {
  const root = mkdtempSync(join(tmpdir(), "api-snapshot-"));
  dirs.push(root);
  write(root, "package.json", JSON.stringify({
    name: "fixture",
    exports: {
      ".": { types: "./dist/index.d.ts", import: "./dist/index.js" },
      "./theme": { types: "./dist/theme/index.d.ts", import: "./dist/theme/index.js" },
      "./package.json": "./package.json",
    },
  }));
  write(root, "tsconfig.json", JSON.stringify({ compilerOptions: { target: "ES2022", module: "ESNext", moduleResolution: "bundler", strict: true, noEmit: true, skipLibCheck: true }, include: ["src"] }));
  const defaults: Record<string, string> = {
    "src/index.ts": 'export * from "./widgets.js";\nexport { internalName as PublicName } from "./widgets.js";\nexport type { ButtonProps } from "./button.js";\nexport { Button } from "./button.js";\nexport const VERSION = "1";\n',
    "src/widgets.ts": "export function makeWidget(id: string): { id: string } { return { id }; }\nexport interface WidgetOptions { size: number }\nexport const internalName = 1;\n",
    "src/button.ts": "export interface ButtonProps { label: string; onPress?: () => void }\nexport function Button(props: ButtonProps): string { return props.label; }\n",
    "src/theme/index.ts": 'export const mode: "light" | "dark" = "light";\n',
  };
  for (const [file, text] of Object.entries({ ...defaults, ...files })) write(root, file, text);
  return root;
}

function run(root: string, ...args: string[]) {
  const result = spawnSync(process.execPath, [script, "--root", root, ...args], { encoding: "utf8" });
  return { code: result.status, out: result.stdout, err: result.stderr };
}

const snapshot = (root: string, name = "root") => readFileSync(join(root, "audit/api/snapshots", `${name}.snapshot`), "utf8");

describe("PLRNUI-315 per-subpath API snapshot", () => {
  it("writes one snapshot per exports entry with a types file, plus the legacy root list", () => {
    const root = project();
    assert.equal(run(root).code, 0);
    assert.deepEqual(readdirSync(join(root, "audit/api/snapshots")).sort(), ["root.snapshot", "theme.snapshot"]);
    assert.equal(existsSync(join(root, "audit/api/public-root-api.snapshot")), true);
    assert.match(snapshot(root, "theme"), /^const mode [0-9a-f]{12}\n$/);
  });

  it("expands export * and renamed re-exports, with kinds", () => {
    const root = project();
    run(root);
    const lines = snapshot(root).split("\n").filter(Boolean).map((l) => l.split(" ").slice(0, 2).join(" "));
    assert.deepEqual(lines, ["function Button", "type ButtonProps", "const PublicName", "const VERSION", "type WidgetOptions", "const internalName", "function makeWidget"]);
    // the legacy regex list does not see through `export *`
    const legacy = readFileSync(join(root, "audit/api/public-root-api.snapshot"), "utf8");
    assert.equal(legacy.includes("makeWidget"), false);
  });

  it("is stable: a second run leaves the files byte for byte the same", () => {
    const root = project();
    run(root);
    const first = ["root", "theme"].map((n) => snapshot(root, n));
    assert.equal(run(root).code, 0);
    assert.deepEqual(["root", "theme"].map((n) => snapshot(root, n)), first);
    assert.equal(run(root, "--check").code, 0);
  });

  it("adding a prop to ButtonProps changes the snapshot and --check fails", () => {
    const root = project();
    run(root);
    const before = snapshot(root);
    write(root, "src/button.ts", "export interface ButtonProps { label: string; onPress?: () => void; disabled?: boolean }\nexport function Button(props: ButtonProps): string { return props.label; }\n");
    const check = run(root, "--check");
    assert.equal(check.code, 1);
    assert.match(check.err, /root\.snapshot: [+-] type ButtonProps /);
    run(root);
    assert.notEqual(snapshot(root), before);
    assert.equal(run(root, "--check").code, 0);
  });

  it("detects a changed optionality, prop type and function signature", () => {
    const root = project();
    run(root);
    for (const edit of [
      "export interface ButtonProps { label: string; onPress: () => void }\nexport function Button(props: ButtonProps): string { return props.label; }\n",
      "export interface ButtonProps { label: number; onPress?: () => void }\nexport function Button(props: ButtonProps): string { return String(props.label); }\n",
      "export interface ButtonProps { label: string; onPress?: () => void }\nexport function Button(props: ButtonProps, extra?: number): string { return props.label + extra; }\n",
    ]) {
      write(root, "src/button.ts", edit);
      assert.equal(run(root, "--check").code, 1, edit);
    }
  });

  it("a removed or added export fails --check, and --level names ignores shape changes only", () => {
    const root = project();
    run(root);
    write(root, "src/button.ts", "export interface ButtonProps { label: string; onPress?: () => void; extra?: number }\nexport function Button(props: ButtonProps): string { return props.label; }\n");
    assert.equal(run(root, "--check").code, 1);
    assert.equal(run(root, "--check", "--level", "names").code, 0);
    write(root, "src/widgets.ts", "export interface WidgetOptions { size: number }\nexport const internalName = 1;\n");
    const removed = run(root, "--check", "--level", "names");
    assert.equal(removed.code, 1);
    assert.match(removed.err, /- function makeWidget/);
  });

  it("fails when a snapshot file is missing or stale, and the write run removes a stale one", () => {
    const root = project();
    run(root);
    rmSync(join(root, "audit/api/snapshots/theme.snapshot"));
    assert.match(run(root, "--check").err, /theme\.snapshot: missing/);
    run(root);
    write(root, "audit/api/snapshots/old.snapshot", "const x abc\n");
    assert.match(run(root, "--check").err, /old\.snapshot: stale/);
    assert.equal(run(root).code, 0);
    assert.equal(existsSync(join(root, "audit/api/snapshots/old.snapshot")), false);
  });

  it("fails when the legacy root list drifts", () => {
    const root = project();
    run(root);
    write(root, "audit/api/public-root-api.snapshot", "value:Nope\n");
    assert.match(run(root, "--check").err, /public-root-api\.snapshot/);
  });

  it("exits 2 on usage errors and on an exports types path with no source file", () => {
    const root = project();
    assert.equal(run(root, "--bogus").code, 2);
    assert.equal(run(root, "--level", "everything").code, 2);
    assert.equal(run(root, "--level").code, 2);
    rmSync(join(root, "src/theme/index.ts"));
    const missing = run(root, "--check");
    assert.equal(missing.code, 2);
    assert.match(missing.err, /does not exist/);
  });

  it("matches the committed snapshots of this repository", () => {
    const result = run(repo, "--check");
    assert.equal(result.code, 0, result.err);
    assert.match(result.out, /3 subpath/);
  });
});
