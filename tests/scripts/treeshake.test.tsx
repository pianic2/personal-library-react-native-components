import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

// PLRNUI-208: bundle-size harness and tree-shaking assertions (esbuild, sideEffects:false).

const root = resolve(import.meta.dirname, "../..");
const run = (script: string, ...args: string[]) =>
  spawnSync("node", [join(root, "scripts", script), ...args], { encoding: "utf8", cwd: root });

describe("PLRNUI-208 tree-shaking", () => {
  it("bundling only Button excludes Modal source (sideEffects:false) and the negative control includes it", () => {
    const result = run("treeshake-check.mjs", "--json");
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const { failures } = JSON.parse(result.stdout) as { failures: string[] };
    assert.deepEqual(failures, []);
  });

  it("package.json keeps sideEffects:false", () => {
    assert.equal(JSON.parse(readFileSync(join(root, "package.json"), "utf8")).sideEffects, false);
  });
});

describe("PLRNUI-208 bundle-size", () => {
  const limitsFile = join(root, "config/size-limits.json");

  it("passes against the committed budgets and prints the root vs subpath delta", () => {
    const result = run("bundle-size.mjs", "--check");
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /root vs subpath delta/);
    assert.match(result.stdout, /bundle-size: ok/);
  });

  it("has a budget entry for every subpath of config/exports.json and no .size-limit.json", () => {
    const exportsConfig = JSON.parse(readFileSync(join(root, "config/exports.json"), "utf8"));
    const limits = JSON.parse(readFileSync(limitsFile, "utf8"));
    assert.deepEqual(Object.keys(limits.subpaths).sort(), Object.keys(exportsConfig.subpaths).sort());
    assert.equal(existsSync(join(root, ".size-limit.json")), false);
  });

  it("fails when a budget is lowered, when a subpath entry is missing and on unknown input", () => {
    const dir = mkdtempSync(join(tmpdir(), "size-limits-"));
    try {
      const limits = JSON.parse(readFileSync(limitsFile, "utf8"));
      const lowered = structuredClone(limits);
      lowered.fixtures["button-only"].maxGzipBytes = 100;
      lowered.subpaths["./tokens"].maxGzipBytes = 100;
      const loweredFile = join(dir, "lowered.json");
      writeFileSync(loweredFile, JSON.stringify(lowered));
      const over = run("bundle-size.mjs", "--check", "--limits", loweredFile);
      assert.equal(over.status, 1);
      assert.match(over.stderr, /button-only: \d+ B gzip exceeds budget 100 B/);
      assert.match(over.stderr, /\.\/tokens: \d+ B gzip exceeds budget 100 B/);

      const missing = structuredClone(limits);
      delete missing.subpaths["./theme"];
      const missingFile = join(dir, "missing.json");
      writeFileSync(missingFile, JSON.stringify(missing));
      const absent = run("bundle-size.mjs", "--check", "--limits", missingFile);
      assert.equal(absent.status, 1);
      assert.match(absent.stderr, /"\.\/theme" has no budget entry/);

      assert.equal(run("bundle-size.mjs", "--check", "--limits", join(dir, "nope.json")).status, 1);
      assert.equal(run("bundle-size.mjs", "--bogus").status, 2);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("fails when a pending entry has an existing source and passes when the source is missing", () => {
    const dir = mkdtempSync(join(tmpdir(), "size-limits-"));
    try {
      const limits = JSON.parse(readFileSync(limitsFile, "utf8"));
      limits.subpaths["./theme"] = { pending: true, note: "x" };
      const file = join(dir, "pending-theme.json");
      writeFileSync(file, JSON.stringify(limits));
      const result = run("bundle-size.mjs", "--check", "--limits", file);
      assert.equal(result.status, 1, result.stdout);
      assert.match(result.stderr, /"\.\/theme" is pending but its source src\/theme\/index\.ts exists/);

      const bogus = JSON.parse(readFileSync(limitsFile, "utf8"));
      bogus.subpaths["./testing"] = { entry: "src/theme/index.ts", maxGzipBytes: 5000 };
      const bogusFile = join(dir, "bogus.json");
      writeFileSync(bogusFile, JSON.stringify(bogus));
      const noSource = run("bundle-size.mjs", "--check", "--limits", bogusFile);
      assert.equal(noSource.status, 1);
      assert.match(noSource.stderr, /"\.\/testing" has an entry and budget but no source/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("fails as soon as a source appears for a pending subpath (temp root), and rejects fixtures that bundle nothing of src/", () => {
    const dir = mkdtempSync(join(tmpdir(), "size-root-"));
    try {
      mkdirSync(join(dir, "config"));
      mkdirSync(join(dir, "src"));
      writeFileSync(join(dir, "src/index.ts"), "export const a = 1;\n");
      const conditions = (name: string) => ({ conditions: { import: `./dist/${name}index.js` } });
      writeFileSync(join(dir, "config/exports.json"), JSON.stringify({ subpaths: { ".": conditions(""), "./extra": conditions("extra/") } }));
      const limits = {
        schemaVersion: 1,
        delta: { root: "a", direct: "a" },
        fixtures: { a: { source: 'import { a } from "./src/index.ts"; console.log(a);', maxGzipBytes: 500 } },
        subpaths: { ".": { entry: "src/index.ts", maxGzipBytes: 500 }, "./extra": { pending: true, note: "no source yet" } },
      };
      const limitsPath = join(dir, "config/size-limits.json");
      writeFileSync(limitsPath, JSON.stringify(limits));
      const before = run("bundle-size.mjs", "--check", "--root", dir);
      assert.equal(before.status, 0, before.stdout + before.stderr);

      mkdirSync(join(dir, "src/extra"));
      writeFileSync(join(dir, "src/extra/index.ts"), "export const b = 2;\n");
      const after = run("bundle-size.mjs", "--check", "--root", dir);
      assert.equal(after.status, 1);
      assert.match(after.stderr, /"\.\/extra" is pending but its source src\/extra\/index\.ts exists/);

      rmSync(join(dir, "src/extra"), { recursive: true });
      limits.fixtures.a.source = "// import { a } from './src/index.ts'\nconsole.log(1);";
      writeFileSync(limitsPath, JSON.stringify(limits));
      const empty = run("bundle-size.mjs", "--check", "--root", dir);
      assert.equal(empty.status, 1);
      assert.match(empty.stderr, /a: bundle is empty or contains no source file from src\//);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("requires the delta fixtures instead of silently dropping the delta line, and labels ./package.json as metadata", () => {
    const limits = JSON.parse(readFileSync(limitsFile, "utf8"));
    assert.deepEqual(limits.subpaths["./package.json"], { metadata: true });
    const ok = run("bundle-size.mjs");
    assert.match(ok.stdout, /\.\/package\.json\s+-\s+-\s+-\s+metadata file \(not bundled\)/);
    const dir = mkdtempSync(join(tmpdir(), "size-limits-"));
    try {
      delete limits.fixtures["root-button"];
      const file = join(dir, "no-delta.json");
      writeFileSync(file, JSON.stringify(limits));
      const result = run("bundle-size.mjs", "--limits", file);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /delta must name two existing fixtures/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
