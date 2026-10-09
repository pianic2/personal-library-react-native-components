import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const checkScript = join(root, "scripts/check-esm-specifiers.mjs");
const codemodScript = join(root, "scripts/codemods/add-js-extensions.mjs");
const dirs: string[] = [];

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop() as string, { recursive: true, force: true });
});

function project(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), "esm-specifiers-"));
  dirs.push(dir);
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(join(dir, name, ".."), { recursive: true });
    writeFileSync(join(dir, name), content);
  }
  return dir;
}

const run = (script: string, args: string[]) => spawnSync(process.execPath, [script, ...args], { encoding: "utf8", cwd: root });

describe("PLRNUI-201 check-esm-specifiers", () => {
  it("exits 0 on src", () => {
    const out = run(checkScript, []);
    assert.equal(out.status, 0, out.stderr);
  });

  it("exits 1 on a fixture containing import './Button'", () => {
    const dir = project({ "a.ts": `import { Button } from './Button';\nexport { Button };\n`, "Button.ts": "export const Button = 1;\n" });
    const out = run(checkScript, [dir]);
    assert.equal(out.status, 1);
    assert.match(out.stderr, /a\.ts:1: relative specifier "\.\/Button" has no explicit extension/);
  });

  it("flags directory specifiers, dynamic imports, re-exports and import types, and accepts explicit ones", () => {
    const bad = project({
      "a.ts": `export * from "./dir";\nexport const x = import("./lazy");\nexport type T = import("./types").T;\n`,
    });
    const out = run(checkScript, [bad]);
    assert.equal(out.status, 1);
    for (const spec of ["./dir", "./lazy", "./types"]) assert.match(out.stderr, new RegExp(`"\\${spec}"`));
    const good = project({ "a.ts": `export * from "./dir/index.js";\nimport data from "./data.json";\nexport { data };\nimport "react";\n` });
    assert.equal(run(checkScript, [good]).status, 0);
  });

  it("rejects platform-suffixed files (D9)", () => {
    for (const name of ["A.web.tsx", "A.native.ts", "A.ios.ts", "A.android.tsx"]) {
      const dir = project({ [name]: "export const a = 1;\n" });
      const out = run(checkScript, [dir]);
      assert.equal(out.status, 1, name);
      assert.match(out.stderr, /platform-suffixed/);
    }
  });

  it("fails closed on a syntax error, a missing directory and an unknown flag", () => {
    assert.equal(run(checkScript, [project({ "a.ts": "const = ;\n" })]).status, 1);
    assert.equal(run(checkScript, ["/nonexistent-dir"]).status, 2);
    assert.equal(run(checkScript, ["--bogus"]).status, 2);
  });
});

describe("PLRNUI-201 add-js-extensions codemod", () => {
  it("rewrites file and directory specifiers, is idempotent and fails on unresolvable ones", () => {
    const dir = project({
      "src/index.ts": `export { A } from "./A";\nexport { B } from "./b";\nexport type { C } from "./c.js";\n`,
      "src/A.tsx": "export const A = 1;\n",
      "src/b/index.ts": "export const B = 1;\n",
      "src/c.ts": "export type C = 1;\n",
    });
    const first = spawnSync(process.execPath, [codemodScript, "--write", join(dir, "src")], { encoding: "utf8" });
    assert.equal(first.status, 0, first.stderr);
    assert.equal(readFileSync(join(dir, "src/index.ts"), "utf8"), `export { A } from "./A.js";\nexport { B } from "./b/index.js";\nexport type { C } from "./c.js";\n`);
    const second = spawnSync(process.execPath, [codemodScript, join(dir, "src")], { encoding: "utf8" });
    assert.match(second.stdout, /would change: 0/);
    const broken = project({ "src/x.ts": `import "./missing";\n` });
    const out = spawnSync(process.execPath, [codemodScript, join(broken, "src")], { encoding: "utf8" });
    assert.equal(out.status, 1);
    assert.match(out.stderr, /cannot resolve \.\/missing/);
  });
});
