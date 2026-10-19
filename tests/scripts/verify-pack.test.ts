import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const script = join(root, "scripts/verify-pack.mjs");
const dirs: string[] = [];

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop() as string, { recursive: true, force: true });
});

type Json = Record<string, unknown>;

function fixture(opts: { pkg?: Json; extra?: Record<string, string>; omit?: string[] } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "verify-pack-fixture-"));
  dirs.push(dir);
  const pkg = {
    name: "@fixture/pack",
    version: "1.0.0",
    type: "module",
    main: "./dist/index.js",
    types: "./dist/index.d.ts",
    exports: { ".": { types: "./dist/index.d.ts", default: "./dist/index.js" }, "./package.json": "./package.json" },
    files: ["dist", "README.md", "LICENSE"],
    ...(opts.pkg ?? {}),
  };
  const files: Record<string, string> = {
    "package.json": JSON.stringify(pkg),
    "README.md": "# fixture\n",
    LICENSE: "MIT\n",
    "dist/index.js": "export {};\n",
    "dist/index.d.ts": "export {};\n",
    "src/index.ts": "export {};\n",
    ...(opts.extra ?? {}),
  };
  for (const name of opts.omit ?? []) delete files[name];
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, name)), { recursive: true });
    writeFileSync(join(dir, name), content);
  }
  return dir;
}

function verify(dir: string, extra: string[] = []) {
  return spawnSync(process.execPath, [script, "--dir", dir, ...extra], { encoding: "utf8" });
}

describe("PLRNUI-251 verify-pack", () => {
  it("passes on a clean package and lists tarball size and file count", () => {
    const result = verify(fixture());
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /tarball size: \d+ B/);
    assert.match(result.stdout, /unpacked size: \d+ B/);
    assert.match(result.stdout, /file count: 5 /);
    assert.match(result.stdout, /verify-pack passed/);
  });

  it("fails when src/ is added to files", () => {
    const result = verify(fixture({ pkg: { files: ["dist", "src", "README.md", "LICENSE"] } }));
    assert.equal(result.status, 1);
    assert.match(result.stderr, /forbidden content in tarball: src\/index\.ts/);
  });

  it("fails on files outside the whitelist and accepts a CHANGELOG", () => {
    const stray = verify(fixture({ pkg: { files: ["dist", "README.md", "LICENSE", "notes.txt"] }, extra: { "notes.txt": "x" } }));
    assert.equal(stray.status, 1);
    assert.match(stray.stderr, /outside the whitelist.*notes\.txt/);
    const changelog = verify(fixture({ pkg: { files: ["dist", "README.md", "LICENSE", "CHANGELOG.md"] }, extra: { "CHANGELOG.md": "# c\n" } }));
    assert.equal(changelog.status, 0, changelog.stderr);
  });

  it("fails when an exports target is missing from the tarball", () => {
    const result = verify(fixture({ omit: ["dist/index.d.ts"] }));
    assert.equal(result.status, 1);
    assert.match(result.stderr, /points to dist\/index\.d\.ts, which is not in the tarball/);
  });

  it("requires a match for wildcard export patterns", () => {
    const pkg = { exports: { ".": "./dist/index.js", "./adapters/*": "./dist/adapters/*/index.js" } };
    assert.equal(verify(fixture({ pkg })).status, 1);
    assert.equal(verify(fixture({ pkg, extra: { "dist/adapters/a/index.js": "export {};\n" } })).status, 0);
  });

  it("fails when README, LICENSE or dist are missing", () => {
    const result = verify(fixture({ omit: ["README.md", "LICENSE"] }));
    assert.equal(result.status, 1);
    assert.match(result.stderr, /README missing/);
    assert.match(result.stderr, /LICENSE missing/);
  });

  it("fails when a size budget is exceeded", () => {
    const unpacked = verify(fixture(), ["--max-unpacked-bytes", "10"]);
    assert.equal(unpacked.status, 1);
    assert.match(unpacked.stderr, /unpacked size \d+ B exceeds the budget of 10 B/);
    const packed = verify(fixture(), ["--max-packed-bytes", "10"]);
    assert.equal(packed.status, 1);
    assert.match(packed.stderr, /tarball size \d+ B exceeds the budget of 10 B/);
  });

  it("exits 2 on usage errors", () => {
    assert.equal(spawnSync(process.execPath, [script, "--bogus", "x"], { encoding: "utf8" }).status, 2);
    assert.equal(verify(join(tmpdir(), "verify-pack-does-not-exist")).status, 2);
    assert.equal(verify(fixture(), ["--max-packed-bytes", "abc"]).status, 2);
  });

  it("passes on the current tree (needs a built dist/)", { skip: existsSync(join(root, "dist/index.js")) ? false : "dist/ not built" }, () => {
    const result = spawnSync(process.execPath, [script], { cwd: root, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /file count: \d+/);
  });
});
