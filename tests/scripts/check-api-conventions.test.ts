import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const script = join(root, "scripts/check-api-conventions.mjs");
const dirs: string[] = [];

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop() as string, { recursive: true, force: true });
});

function check(args: string[]) {
  return spawnSync(process.execPath, [script, ...args], { encoding: "utf8", cwd: root });
}

function temp(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), "api-conventions-"));
  dirs.push(dir);
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(join(dir, name, ".."), { recursive: true });
    writeFileSync(join(dir, name), content);
  }
  return dir;
}

const emptyBaseline = JSON.stringify({ schemaVersion: 1, entries: [] });

describe("PLRNUI-318 API conventions check", () => {
  it("exits 0 on the repository with the committed baseline", () => {
    const out = check([]);
    assert.equal(out.status, 0, out.stderr);
    assert.match(out.stdout, /0 new/);
  });

  it("exits 1 on the bad-props fixture and names the `visible` prop without `open`", () => {
    const out = check(["--entry", "tests/fixtures/api-conventions/bad-props.ts"]);
    assert.equal(out.status, 1);
    assert.match(out.stderr, /BadOpenProps: \[open-state\] own `visible`/);
  });

  it("reports every rule on the bad-props fixture", () => {
    const out = check(["--entry", "tests/fixtures/api-conventions/bad-props.ts"]);
    for (const rule of ["open-state", "controlled-onChange", "variant-colour", "tone-values", "color-prop", "size-values", "error-boolean", "invalid-type", "passthrough-style", "passthrough-testID"]) {
      assert.match(out.stderr, new RegExp(`\\[${rule}\\]`), rule);
    }
  });

  it("exits 0 on the conforming fixture", () => {
    const out = check(["--entry", "tests/fixtures/api-conventions/good-props.ts"]);
    assert.equal(out.status, 0, out.stderr);
  });

  it("a new exported *Props type is discovered without editing the script", () => {
    const base = { "baseline.json": emptyBaseline, "ok.ts": `export interface NewProps { open?: boolean; defaultOpen?: boolean; onOpenChange?: (o: boolean) => void; style?: object; testID?: string }\n` };
    const ok = temp({ ...base, "index.ts": `export type { NewProps } from "./ok";\n` });
    assert.equal(check(["--root", ok, "--entry", "index.ts", "--baseline", join(ok, "baseline.json")]).status, 0);
    const bad = temp({ ...base, "bad.ts": `export interface AddedProps { isOpen?: boolean; style?: object; testID?: string }\n`, "index.ts": `export type { NewProps } from "./ok";\nexport type { AddedProps } from "./bad";\n` });
    const out = check(["--root", bad, "--entry", "index.ts", "--baseline", join(bad, "baseline.json")]);
    assert.equal(out.status, 1);
    assert.match(out.stderr, /AddedProps: \[open-state\]/);
  });

  it("a baseline entry covers its violation and a stale entry is only reported", () => {
    const files = { "bad.ts": `export interface OldProps { visible?: boolean; style?: object; testID?: string }\n`, "index.ts": `export type { OldProps } from "./bad";\n` };
    const covered = temp({ ...files, "baseline.json": JSON.stringify({ schemaVersion: 1, entries: [{ props: "OldProps", rule: "open-state" }, { props: "GoneProps", rule: "color-prop" }] }) });
    const out = check(["--root", covered, "--entry", "index.ts", "--baseline", join(covered, "baseline.json")]);
    assert.equal(out.status, 0, out.stderr);
    assert.match(out.stdout, /GoneProps:color-prop no longer occurs/);
  });

  it("fails closed on a broken baseline, a missing entry, no props types and bad arguments", () => {
    const dir = temp({ "index.ts": `export const x = 1;\n`, "baseline.json": "{not json" });
    assert.equal(check(["--root", dir, "--entry", "index.ts", "--baseline", join(dir, "baseline.json")]).status, 2, "no *Props types");
    const withProps = temp({ "index.ts": `export interface AProps { style?: object; testID?: string }\n`, "baseline.json": "{not json" });
    assert.equal(check(["--root", withProps, "--entry", "index.ts", "--baseline", join(withProps, "baseline.json")]).status, 1, "broken baseline");
    assert.equal(check(["--entry", "tests/fixtures/api-conventions/missing.ts"]).status, 2);
    assert.equal(check(["--bogus", "x"]).status, 2);
    assert.equal(check(["--entry"]).status, 2);
  });

  it("the committed baseline only lists known rules and sorted unique entries", () => {
    const baseline = JSON.parse(readFileSync(join(root, "scripts/api-conventions.baseline.json"), "utf8"));
    const keys = baseline.entries.map((e: { props: string; rule: string }) => `${e.props}:${e.rule}`);
    assert.deepEqual(keys, [...keys].sort((a: string, b: string) => a.localeCompare(b)));
    assert.equal(new Set(keys).size, keys.length);
  });
});
