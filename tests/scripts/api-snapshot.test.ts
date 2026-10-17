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

  it("detects a changed union alias member, and a prop that uses the alias", () => {
    const root = project({
      "src/modes.ts": 'export type Mode = "light" | "dark";\nexport interface ShellProps { mode: Mode }\n',
      "src/index.ts": 'export * from "./modes.js";\n',
    });
    run(root);
    write(root, "src/modes.ts", 'export type Mode = "light" | "dark" | "system";\nexport interface ShellProps { mode: Mode }\n');
    const check = run(root, "--check");
    assert.equal(check.code, 1);
    assert.match(check.err, /type Mode /);
    assert.match(check.err, /type ShellProps /);
  });

  it("covers generics, call and index signatures, readonly, enums, classes and dual type+value names", () => {
    const base: Record<string, string> = {
      "src/index.ts": 'export * from "./kinds.js";\n',
      "src/kinds.ts": [
        "export interface Box<T extends string> { readonly id: T; [key: string]: unknown }",
        "export interface Callable { (value: number): string }",
        "export enum Level { Low = 1, High = 2 }",
        "export class Store { size = 0; add(item: string): void {} }",
        "export const Both = 1;",
        "export type Both = number;",
        "",
      ].join("\n"),
    };
    const root = project(base);
    run(root);
    const kinds = snapshot(root).split("\n").filter(Boolean).map((l) => l.split(" ").slice(0, 2).join(" "));
    assert.deepEqual(kinds, ["const Both", "type Both", "type Box", "type Callable", "enum Level", "class Store"]);
    const edits: Array<[string, string]> = [
      ["T extends string", "T extends string | number"],
      ["readonly id: T", "id: T"],
      ["[key: string]: unknown", "[key: string]: string"],
      ["(value: number): string", "(value: number): number"],
      ["High = 2", "High = 3"],
      ["size = 0", "size = ''"],
    ];
    for (const [from, to] of edits) {
      write(root, "src/kinds.ts", base["src/kinds.ts"]!.replace(from, to));
      assert.equal(run(root, "--check").code, 1, `${from} -> ${to}`);
    }
  });

  it("detects a changed literal or primitive alias", () => {
    const root = project({ "src/index.ts": 'export type Single = "a";\nexport type Count = 1;\nexport type Flag = true;\n' });
    run(root);
    for (const edit of ['export type Single = "b";\nexport type Count = 1;\nexport type Flag = true;\n', 'export type Single = "a";\nexport type Count = 2;\nexport type Flag = true;\n', 'export type Single = "a";\nexport type Count = 1;\nexport type Flag = false;\n']) {
      write(root, "src/index.ts", edit);
      assert.equal(run(root, "--check").code, 1, edit);
    }
  });

  it("keeps overload order significant", () => {
    const root = project({
      "src/index.ts": 'export function pick(a: string): string;\nexport function pick(a: number): number;\nexport function pick(a: unknown): unknown { return a; }\n',
    });
    run(root);
    write(root, "src/index.ts", 'export function pick(a: number): number;\nexport function pick(a: string): string;\nexport function pick(a: unknown): unknown { return a; }\n');
    assert.equal(run(root, "--check").code, 1);
  });

  it("produces the same snapshot when the project is copied to another root", () => {
    const first = project();
    const second = project();
    run(first);
    run(second);
    assert.equal(snapshot(first), snapshot(second));
    assert.equal(snapshot(first, "theme"), snapshot(second, "theme"));
  });

  it("refuses to write when an import does not resolve", () => {
    const root = project({ "src/index.ts": 'import type { Missing } from "not-installed-package";\nexport type Wrapped = Missing;\n' });
    const result = run(root);
    assert.equal(result.code, 2);
    assert.match(result.err, /unresolved module/);
    assert.equal(existsSync(join(root, "audit/api/snapshots")), false);
  });

  /** Writes a hand-made ./dist that matches the fixture project (what a build would leave). */
  function writeDist(root: string, files: Record<string, string> = {}) {
    const defaults: Record<string, string> = {
      "dist/index.d.ts": 'export declare function makeWidget(id: string): { id: string };\nexport interface WidgetOptions { size: number }\nexport declare const internalName = 1;\nexport { internalName as PublicName };\nexport interface ButtonProps { label: string; onPress?: () => void }\nexport declare function Button(props: ButtonProps): string;\nexport declare const VERSION = "1";\n',
      "dist/index.js": "export {};\n",
      "dist/theme/index.d.ts": 'export declare const mode: "light" | "dark";\n',
      "dist/theme/index.js": "export {};\n",
    };
    for (const [file, text] of Object.entries({ ...defaults, ...files })) write(root, file, text);
  }

  it("--dist needs a built ./dist and exits 2 without it", () => {
    const root = project();
    const result = run(root, "--dist");
    assert.equal(result.code, 2);
    assert.match(result.err, /needs a built \.\/dist/);
  });

  it("--dist snapshots the real dist declarations, and --check --dist passes on the same tree", () => {
    const root = project();
    writeDist(root);
    assert.equal(run(root, "--dist").code, 0);
    const check = run(root, "--check", "--dist");
    assert.equal(check.code, 0, check.err);
    assert.match(check.out, /from \.\/dist/);
  });

  it("the preflight fails when the declarations and the source export different names", () => {
    const root = project();
    writeDist(root, { "dist/index.d.ts": 'export declare const VERSION = "1";\nexport declare const onlyInDeclarations = 1;\n' });
    const result = run(root, "--dist", "--check");
    assert.equal(result.code, 1);
    assert.match(result.err, /preflight: root: const onlyInDeclarations is in the declarations but not in the source/);
    assert.match(result.err, /preflight: root: function Button is in the source but not in the declarations/);
    assert.equal(run(root, "--dist").code, 1, "a write is refused too");
  });

  it("reports an exports target that is not under ./dist, or that the build does not produce", () => {
    const root = project();
    write(root, "package.json", JSON.stringify({ name: "fixture", exports: { ".": { types: "./dist/index.d.ts", import: "./lib/index.js", default: "./dist/missing.js" }, "./theme": { types: "./dist/theme/index.d.ts" } } }));
    const result = run(root, "--check");
    assert.equal(result.code, 1);
    assert.match(result.err, /exports target \.\/lib\/index\.js is not under \.\/dist\//);
    assert.match(result.err, /exports target \.\/dist\/missing\.js is not produced by the build/);
  });

  it("--packed checks the tarball contents: it passes with files: [dist] and fails when dist is not packed", () => {
    const root = project();
    write(root, "package.json", JSON.stringify({ name: "fixture", version: "1.0.0", files: ["dist"], exports: { ".": { types: "./dist/index.d.ts", import: "./dist/index.js" }, "./theme": { types: "./dist/theme/index.d.ts", import: "./dist/theme/index.js" } } }));
    writeDist(root);
    assert.equal(run(root, "--dist").code, 0);
    const ok = run(root, "--check", "--packed");
    assert.equal(ok.code, 0, ok.err);
    assert.match(ok.out, /packed tarball checked/);
    write(root, "package.json", JSON.stringify({ name: "fixture", version: "1.0.0", files: ["README.md"], exports: { ".": { types: "./dist/index.d.ts", import: "./dist/index.js" }, "./theme": { types: "./dist/theme/index.d.ts", import: "./dist/theme/index.js" } } }));
    write(root, "README.md", "x");
    const bad = run(root, "--check", "--packed");
    assert.equal(bad.code, 1);
    assert.match(bad.err, /would not be in the packed tarball/);
  });

  it("a real tsc build of the project gives the same snapshot as the temporary emit (dist and emit agree)", () => {
    const root = project();
    assert.equal(run(root).code, 0);
    const tsc = join(repo, "node_modules/typescript/bin/tsc");
    const build = spawnSync(process.execPath, [tsc, "-p", "tsconfig.json", "--noEmit", "false", "--outDir", "dist", "--declaration", "--declarationMap", "--sourceMap"], { cwd: root, encoding: "utf8" });
    assert.equal(build.status, 0, build.stdout + build.stderr);
    const check = run(root, "--check", "--dist");
    assert.equal(check.code, 0, check.err);
  });

  it("the emitted declarations are not left behind and nothing is written outside audit/api", () => {
    const root = project();
    run(root);
    assert.deepEqual(readdirSync(root).sort(), ["audit", "package.json", "src", "tsconfig.json"]);
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

  it("exits 2 on usage errors, and reports an exports types target that the build does not produce", () => {
    const root = project();
    assert.equal(run(root, "--bogus").code, 2);
    assert.equal(run(root, "--level", "everything").code, 2);
    assert.equal(run(root, "--level").code, 2);
    rmSync(join(root, "src/theme/index.ts"));
    const missing = run(root, "--check");
    assert.equal(missing.code, 1);
    assert.match(missing.err, /exports types target \.\/dist\/theme\/index\.d\.ts is not produced by the build/);
  });

  it("matches the committed snapshots of this repository", () => {
    const result = run(repo, "--check");
    assert.equal(result.code, 0, result.err);
    assert.match(result.out, /3 subpath/);
  });
});
