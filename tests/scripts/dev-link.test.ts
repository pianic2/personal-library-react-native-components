import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const cli = join(root, "scripts", "dev-link.mjs");
const run = (args: string[]) => spawnSync(process.execPath, [cli, ...args], { cwd: root, encoding: "utf8" });

function app(reactCopies: string[]) {
  const dir = mkdtempSync(join(tmpdir(), "plrnui-307-"));
  writeFileSync(join(dir, "package.json"), "{}");
  for (const copy of reactCopies) {
    mkdirSync(join(dir, copy), { recursive: true });
    writeFileSync(join(dir, copy, "package.json"), '{"name":"react"}');
  }
  return { dir, done: () => rmSync(dir, { recursive: true, force: true }) };
}

describe("PLRNUI-307 dev-link", () => {
  it("prints help and exits 0", () => {
    const result = run(["--help"]);
    assert.equal(result.status, 0);
    assert.match(result.stdout, /--target/);
  });

  it("requires --target", () => {
    assert.equal(run([]).status, 2);
  });

  it("refuses a target with a duplicated react", () => {
    const f = app(["node_modules/react", "node_modules/foo/node_modules/react"]);
    try {
      const result = run(["--target", f.dir, "--once"]);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /react is duplicated/);
    } finally {
      f.done();
    }
  });

  it("refuses a target without react", () => {
    const f = app([]);
    try {
      const result = run(["--target", f.dir, "--once"]);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /no react found/);
    } finally {
      f.done();
    }
  });
});
