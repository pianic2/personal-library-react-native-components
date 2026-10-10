import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const script = join(root, "scripts/release-guard.mjs");
const realPkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const dirs: string[] = [];

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop() as string, { recursive: true, force: true });
});

type Json = Record<string, unknown>;
const identityWithShim = { current: realPkg.name, legacy: "@legacy/shim", shim: { enabled: true } };

function fixture(opts: { pkg?: Json; version?: string; identity?: Json; changelog?: string | null; evidence?: string[]; snapshotExit?: number } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "release-guard-"));
  dirs.push(dir);
  const version = opts.version ?? "1.0.0";
  const pkg: Json = { ...realPkg, version, publishConfig: { ...realPkg.publishConfig, tag: "latest" }, ...(opts.pkg ?? {}) };
  writeFileSync(join(dir, "package.json"), JSON.stringify(pkg));
  writeFileSync(join(dir, "package-lock.json"), JSON.stringify({ version: pkg.version, packages: { "": { version: pkg.version } } }));
  writeFileSync(join(dir, "identity.json"), JSON.stringify(opts.identity ?? identityWithShim));
  if (opts.changelog !== null) writeFileSync(join(dir, "CHANGELOG.md"), opts.changelog ?? `# Changelog\n\n## ${version}\n\n- First stable release\n`);
  mkdirSync(join(dir, "scripts"));
  writeFileSync(join(dir, "scripts/public-api-snapshot.mjs"), `process.exit(${opts.snapshotExit ?? 0});\n`);
  const evidenceDir = join(dir, "audit/release/evidence", version);
  mkdirSync(evidenceDir, { recursive: true });
  for (const file of opts.evidence ?? ["consumer-smoke.json", "expo-consumer-smoke.json"]) writeFileSync(join(evidenceDir, file), "{}");
  return dir;
}

function guard(dir: string, channel: string, extra: string[] = []) {
  return spawnSync(process.execPath, [script, "--channel", channel, "--root", dir, "--identity", join(dir, "identity.json"), ...extra], { encoding: "utf8" });
}

const shimPkg = (over: Json = {}): Json => ({
  name: "@legacy/shim",
  version: "1.0.0",
  license: "MIT",
  repository: realPkg.repository,
  publishConfig: { registry: "https://registry.npmjs.org/", access: "public", tag: "latest" },
  files: ["dist", "README.md", "LICENSE"],
  dependencies: { [realPkg.name]: "^1.0.0" },
  ...over,
});

describe("PLRNUI-124 release guard: rc channel", () => {
  it("still passes on the current tree, with and without the explicit channel", () => {
    for (const args of [[], ["--channel", "rc"]]) {
      const result = spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: "utf8" });
      assert.equal(result.status, 0, result.stderr);
      assert.match(result.stdout, /Release guard \(rc\) passed/);
    }
  });

  it("fails a stable version published with tag rc and an rc version published with tag latest", () => {
    const stableWithRc = guard(fixture({ version: "1.0.0", pkg: { publishConfig: { ...realPkg.publishConfig, tag: "rc" } } }), "rc");
    assert.equal(stableWithRc.status, 1);
    assert.match(stableWithRc.stderr, /version must be an RC prerelease/);
    const rcWithLatest = guard(fixture({ version: "1.0.0-rc.1" }), "rc");
    assert.equal(rcWithLatest.status, 1);
    assert.match(rcWithLatest.stderr, /RC must publish with dist-tag rc/);
  });
});

describe("PLRNUI-124 release guard: latest channel", () => {
  it("passes a complete stable fixture", () => {
    const result = guard(fixture(), "latest");
    assert.equal(result.status, 0, result.stderr);
  });

  it("fails a stable version with tag rc and an rc version with tag latest", () => {
    const stableWithRc = guard(fixture({ pkg: { publishConfig: { ...realPkg.publishConfig, tag: "rc" } } }), "latest");
    assert.equal(stableWithRc.status, 1);
    assert.match(stableWithRc.stderr, /dist-tag latest/);
    const rcWithLatest = guard(fixture({ version: "1.0.0-rc.1" }), "latest");
    assert.equal(rcWithLatest.status, 1);
    assert.match(rcWithLatest.stderr, /stable X\.Y\.Z/);
  });

  it("fails without a changelog entry, with a dirty API snapshot, and without consumer smoke evidence", () => {
    assert.match(guard(fixture({ changelog: "# Changelog\n\n## 0.9.0\n" }), "latest").stderr, /no entry for 1\.0\.0/);
    assert.match(guard(fixture({ changelog: null }), "latest").stderr, /changelog not found/);
    const dirty = guard(fixture({ snapshotExit: 1 }), "latest");
    assert.equal(dirty.status, 1);
    assert.match(dirty.stderr, /public API snapshot is not clean/);
    const noEvidence = guard(fixture({ evidence: ["consumer-smoke.json"] }), "latest");
    assert.equal(noEvidence.status, 1);
    assert.match(noEvidence.stderr, /missing consumer smoke evidence.*expo-consumer-smoke\.json/);
  });

  it("does not accept a changelog entry for a different version that merely contains the number", () => {
    assert.match(guard(fixture({ changelog: "# Changelog\n\n## 11.0.0\n\n## 1.0.01\n" }), "latest").stderr, /no entry for 1\.0\.0/);
  });

  it("still checks the shared metadata (license, repository, peers, dependencies)", () => {
    const result = guard(fixture({ pkg: { license: "ISC", dependencies: { left: "1.0.0" } } }), "latest");
    assert.equal(result.status, 1);
    assert.match(result.stderr, /license must be MIT/);
    assert.match(result.stderr, /runtime dependencies/);
  });
});

describe("PLRNUI-124 release guard: shim channel", () => {
  const shimFixture = (pkg: Json) => {
    const dir = fixture();
    writeFileSync(join(dir, "package.json"), JSON.stringify(pkg));
    return dir;
  };

  it("passes a conforming shim", () => {
    const result = guard(shimFixture(shimPkg()), "shim");
    assert.equal(result.status, 0, result.stderr);
  });

  it("fails if the shim has a second dependency or a postinstall", () => {
    const second = guard(shimFixture(shimPkg({ dependencies: { [realPkg.name]: "^1.0.0", extra: "1.0.0" } })), "shim");
    assert.equal(second.status, 1);
    assert.match(second.stderr, /exactly one dependency/);
    const post = guard(shimFixture(shimPkg({ scripts: { postinstall: "node x.js" } })), "shim");
    assert.equal(post.status, 1);
    assert.match(post.stderr, /no scripts/);
  });

  it("fails an exact pin, a wrong range major, the wrong target, peers and the wrong name", () => {
    assert.match(guard(shimFixture(shimPkg({ dependencies: { [realPkg.name]: "1.0.0" } })), "shim").stderr, /must be \^1\.0\.0/);
    assert.match(guard(shimFixture(shimPkg({ dependencies: { [realPkg.name]: "^2.0.0" } })), "shim").stderr, /must be \^1\.0\.0/);
    assert.match(guard(shimFixture(shimPkg({ dependencies: { other: "^1.0.0" } })), "shim").stderr, /exactly one dependency/);
    assert.match(guard(shimFixture(shimPkg({ peerDependencies: { react: "*" } })), "shim").stderr, /must not declare peerDependencies/);
    assert.match(guard(shimFixture(shimPkg({ name: "@legacy/other" })), "shim").stderr, /legacy name/);
    assert.match(guard(shimFixture(shimPkg({ bundledDependencies: true })), "shim").stderr, /must not declare bundledDependencies/);
  });

  it("fails when the identity config does not enable a shim", () => {
    const dir = fixture({ identity: { current: realPkg.name, legacy: null, shim: { enabled: false } } });
    writeFileSync(join(dir, "package.json"), JSON.stringify(shimPkg()));
    const result = guard(dir, "shim");
    assert.equal(result.status, 1);
    assert.match(result.stderr, /does not enable a legacy shim/);
  });
});

describe("PLRNUI-124 release guard: usage errors", () => {
  it("exits 2 on an unknown channel, an unknown flag, a missing value and unreadable input", () => {
    const dir = fixture();
    assert.equal(guard(dir, "beta").status, 2);
    assert.equal(spawnSync(process.execPath, [script, "--bogus", "x"], { encoding: "utf8" }).status, 2);
    assert.equal(spawnSync(process.execPath, [script, "--channel"], { encoding: "utf8" }).status, 2);
    assert.equal(guard(join(dir, "missing"), "rc").status, 2);
    writeFileSync(join(dir, "identity.json"), "{not json");
    assert.equal(guard(dir, "latest").status, 2);
  });
});
