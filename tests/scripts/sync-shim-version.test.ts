import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const cli = join(root, "scripts", "sync-shim-version.mjs");
const run = (args: string[]) => spawnSync(process.execPath, [cli, ...args], { cwd: root, encoding: "utf8" });
const readJson = (file: string) => JSON.parse(readFileSync(file, "utf8"));

function fixture(version: unknown) {
  const dir = mkdtempSync(join(tmpdir(), "plrnui-113-"));
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "x", version }));
  return { dir, done: () => rmSync(dir, { recursive: true, force: true }), record: join(dir, ".changeset", "shim-version.json") };
}

describe("PLRNUI-113 sync-shim-version", () => {
  it("writes the package version into the record, deterministically", () => {
    const f = fixture("1.0.0-rc.3");
    try {
      const first = run(["--root", f.dir]);
      assert.equal(first.status, 0, first.stderr);
      assert.deepEqual(readJson(f.record), { version: "1.0.0-rc.3" });
      const text = readFileSync(f.record, "utf8");
      assert.equal(run(["--root", f.dir]).status, 0);
      assert.equal(readFileSync(f.record, "utf8"), text);
    } finally {
      f.done();
    }
  });

  it("--check passes when in lockstep, fails after a version bump or without a record, and never writes", () => {
    const f = fixture("0.1.0-rc.2");
    try {
      const missing = run(["--root", f.dir, "--check"]);
      assert.equal(missing.status, 1);
      assert.match(missing.stderr, /missing or does not match/);
      assert.equal(existsSync(f.record), false, "--check never writes");
      assert.equal(run(["--root", f.dir]).status, 0);
      assert.equal(run(["--root", f.dir, "--check"]).status, 0);
      writeFileSync(join(f.dir, "package.json"), JSON.stringify({ name: "x", version: "0.1.0-rc.3" })); // what `changeset version` does
      const stale = run(["--root", f.dir, "--check"]);
      assert.equal(stale.status, 1);
      assert.deepEqual(readJson(f.record), { version: "0.1.0-rc.2" }, "--check leaves the stale record alone");
      assert.equal(run(["--root", f.dir]).status, 0);
      assert.equal(run(["--root", f.dir, "--check"]).status, 0);
    } finally {
      f.done();
    }
  });

  it("fails closed with exit 2 on a missing or invalid package.json version and on bad arguments", () => {
    for (const version of [undefined, "", "1.0", "v1.0.0", 7]) {
      const f = fixture(version);
      try {
        const result = run(["--root", f.dir]);
        assert.equal(result.status, 2, `version ${JSON.stringify(version)}`);
        assert.match(result.stderr, /no valid semver version/);
        assert.equal(existsSync(f.record), false);
      } finally {
        f.done();
      }
    }
    const empty = mkdtempSync(join(tmpdir(), "plrnui-113-empty-"));
    try {
      const result = run(["--root", empty]);
      assert.equal(result.status, 2);
      assert.match(result.stderr, /cannot read/);
      mkdirSync(join(empty, ".changeset"));
      writeFileSync(join(empty, "package.json"), "{not json");
      assert.equal(run(["--root", empty]).status, 2);
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
    assert.equal(run(["--bogus"]).status, 2);
    assert.equal(run(["--root"]).status, 2);
    assert.equal(run(["--root", "--check"]).status, 2);
  });

  it("the committed record equals the package version and is the version the shim is generated with", () => {
    const pkg = readJson(join(root, "package.json"));
    const record = readJson(join(root, ".changeset", "shim-version.json"));
    assert.equal(record.version, pkg.version);
    assert.equal(run(["--check"]).status, 0);
    const out = mkdtempSync(join(tmpdir(), "plrnui-113-shim-"));
    try {
      const build = spawnSync(process.execPath, [join(root, "scripts", "build-shim.mjs"), "--out", join(out, "shim"), "--target-version", record.version], { cwd: root, encoding: "utf8" });
      assert.equal(build.status, 0, build.stderr + build.stdout);
      const shim = readJson(join(out, "shim", "package.json"));
      assert.equal(shim.version, pkg.version, "the generated shim has the version of package.json");
    } finally {
      rmSync(out, { recursive: true, force: true });
    }
  });
});

describe("PLRNUI-113 Changesets configuration", () => {
  const config = readJson(join(root, ".changeset", "config.json"));
  const pkg = readJson(join(root, "package.json"));

  it("publishes publicly from main, with no commit or auto-publish setting", () => {
    assert.equal(config.access, "public");
    assert.equal(config.baseBranch, "main");
    assert.equal(config.commit, false);
    assert.deepEqual(config.ignore, []);
  });

  it("is in pre-release mode with the rc tag", () => {
    const pre = readJson(join(root, ".changeset", "pre.json"));
    assert.equal(pre.mode, "pre");
    assert.equal(pre.tag, "rc");
  });

  it("wires the scripts, the devDependency and the lockstep check into release:check", () => {
    assert.equal(pkg.scripts.changeset, "changeset");
    assert.match(pkg.scripts["changeset:version"], /^changeset version && node scripts\/sync-shim-version\.mjs$/);
    assert.equal(pkg.scripts["shim:version:check"], "node scripts/sync-shim-version.mjs --check");
    assert.match(pkg.scripts["release:publish"], /^npm run release:check && changeset publish$/);
    assert.ok(pkg.devDependencies["@changesets/cli"]);
    assert.ok(pkg.scripts["release:check"].includes("npm run shim:version:check"));
    assert.equal(pkg.scripts.version, undefined, "a script named version would run on every `npm version`");
  });
});
