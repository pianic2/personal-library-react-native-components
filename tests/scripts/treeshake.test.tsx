import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
      const loweredFile = join(dir, "lowered.json");
      writeFileSync(loweredFile, JSON.stringify(lowered));
      const over = run("bundle-size.mjs", "--check", "--limits", loweredFile);
      assert.equal(over.status, 1);
      assert.match(over.stderr, /button-only: \d+ B gzip exceeds budget 100 B/);

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
});
