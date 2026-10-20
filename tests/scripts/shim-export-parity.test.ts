import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
// @ts-expect-error plain .mjs script without declarations
import { check } from "../../scripts/check-shim-parity.mjs";

// PLRNUI-142: the generated legacy shim must expose exactly the exports of the target, for values and for types.
// The target is built once into a temporary package; the shim is generated in preparatory mode and then mutated to prove
// that the gate fails when a re-export is deleted and when the shim adds one.

const root = resolve(import.meta.dirname, "../..");

interface Report {
  rows: { key: string; values?: number; types?: number; skipped?: string; snapshotCounts?: { values: number; types: number } }[];
  problems: string[];
}

function node(args: string[]): void {
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
}

/** Names of the root snapshot: value lines (runtime keys) or every line. */
function rootNames(valuesOnly: boolean): string[] {
  return readFileSync(join(root, "audit/api/snapshots/root.snapshot"), "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => line.split(" "))
    .filter(([kind]) => !valuesOnly || kind !== "type")
    .map(([, name]) => name);
}

describe("PLRNUI-142 shim export parity", () => {
  let temp = "";
  let targetDir = "";
  let shimDir = "";
  let pristine = "";

  const parity = (dir: string): Report => check({ targetDir, shimDir: dir });

  before(() => {
    temp = mkdtempSync(join(tmpdir(), "shim-parity-test-"));
    targetDir = join(temp, "target");
    node([join(root, "node_modules/typescript/bin/tsc"), "-p", join(root, "tsconfig.build.json"), "--outDir", join(targetDir, "dist")]);
    copyFileSync(join(root, "package.json"), join(targetDir, "package.json"));
    pristine = join(temp, "shim");
    node([join(root, "scripts/build-shim.mjs"), "--out", pristine]);
  });

  after(() => rmSync(temp, { recursive: true, force: true }));

  /** A fresh copy of the generated shim that the test may mutate. */
  function mutableShim(name: string): string {
    const dir = join(temp, name);
    const copy = spawnSync("cp", ["-r", pristine, dir]);
    assert.equal(copy.status, 0);
    return dir;
  }

  it("passes for the root and every exported subpath, with counts matching the API snapshots", () => {
    const report = parity(pristine);
    assert.deepEqual(report.problems, []);
    const compared = report.rows.filter((row) => !row.skipped);
    assert.deepEqual(compared.map((row) => row.key).sort(), [".", "./theme", "./tokens"]);
    for (const row of compared) {
      assert.ok(row.snapshotCounts, `${row.key} has a snapshot`);
      assert.equal(row.values, row.snapshotCounts.values, `${row.key} value count`);
      assert.equal(row.types, row.snapshotCounts.types, `${row.key} type count`);
    }
  });

  it("fails when one re-export is deleted from the generated shim (mutation check)", () => {
    const dir = mutableShim("shim-missing");
    const dropped = "Button";
    assert.ok(rootNames(true).includes(dropped));
    const without = (valuesOnly: boolean) => `export { ${rootNames(valuesOnly).filter((n) => n !== dropped).join(", ")} } from "@personal-library/react-native-components";\n`;
    writeFileSync(join(dir, "dist/index.js"), without(true));
    writeFileSync(join(dir, "dist/index.d.ts"), without(false));
    const report = parity(dir);
    assert.ok(report.problems.some((p) => p.startsWith(".: values missing in the shim") && p.includes(dropped)), report.problems.join("\n"));
    assert.ok(report.problems.some((p) => p.startsWith(".: exports (types) missing in the shim") && p.includes(dropped)), report.problems.join("\n"));
  });

  it("fails when only a type re-export is deleted", () => {
    const dir = mutableShim("shim-missing-type");
    const dropped = "ButtonProps";
    assert.ok(rootNames(false).includes(dropped));
    writeFileSync(join(dir, "dist/index.d.ts"), `export { ${rootNames(false).filter((n) => n !== dropped).join(", ")} } from "@personal-library/react-native-components";\n`);
    const report = parity(dir);
    assert.ok(report.problems.some((p) => p.includes("exports (types) missing in the shim") && p.includes(dropped)), report.problems.join("\n"));
  });

  it("fails when the shim adds an export of its own", () => {
    const dir = mutableShim("shim-extra");
    const js = join(dir, "dist/theme/index.js");
    const dts = join(dir, "dist/theme/index.d.ts");
    writeFileSync(js, `${readFileSync(js, "utf8")}export const extraOnlyInShim = 1;\n`);
    writeFileSync(dts, `${readFileSync(dts, "utf8")}export declare const extraOnlyInShim: 1;\n`);
    const report = parity(dir);
    assert.ok(report.problems.some((p) => p.startsWith("./theme: values only in the shim") && p.includes("extraOnlyInShim")), report.problems.join("\n"));
    assert.ok(report.problems.some((p) => p.startsWith("./theme: exports (types) only in the shim")), report.problems.join("\n"));
  });

  it("the CLI exits 1 on a difference and prints the report", () => {
    const dir = mutableShim("shim-cli");
    writeFileSync(join(dir, "dist/tokens/index.js"), `export { defaultThemeTokens } from "@personal-library/react-native-components";\n`);
    const result = spawnSync(process.execPath, [join(root, "scripts/check-shim-parity.mjs"), "--target-dir", targetDir, "--shim-dir", dir], { cwd: root, encoding: "utf8" });
    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stdout, /\.: (\d+) values, (\d+) types \(snapshot root: \1 values, \2 types\)/);
    assert.match(result.stderr, /\.\/tokens: values missing in the shim: createThemeTokens/);
  });
});
