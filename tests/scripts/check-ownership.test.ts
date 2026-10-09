import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const SCRIPT = resolve("scripts/check-ownership.mjs");
let dir: string;
let fixtures: string; // backlog fixtures live outside the git work tree so they are never part of the diff

// Isolate from the developer's git setup (hooks, signing, GIT_DIR inherited from a hook).
const cleanEnv = () => {
  const env: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(process.env)) if (!key.startsWith("GIT_")) env[key] = value;
  return { ...env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_SYSTEM: "/dev/null" };
};
const git = (...args: string[]) => {
  const result = spawnSync("git", ["-c", "commit.gpgsign=false", "-c", "core.hooksPath=/dev/null", ...args], {
    cwd: dir,
    encoding: "utf8",
    env: cleanEnv(),
  });
  assert.equal(result.status, 0, result.stderr);
};
const write = (path: string, text = "x") => {
  mkdirSync(dirname(join(dir, path)), { recursive: true });
  writeFileSync(join(dir, path), text);
};
const commit = (message: string) => {
  git("add", "-A");
  git("commit", "-q", "-m", message);
};
const run = (...args: string[]) =>
  spawnSync("node", [SCRIPT, ...args, "--backlog-dir", join(fixtures, "backlog"), "--jira-map", join(fixtures, "jira-map.json")], {
    cwd: dir,
    encoding: "utf8",
    env: cleanEnv(),
  });

const setFilesTouched = (filesTouched: unknown, extra: Record<string, unknown> = {}) =>
  writeFileSync(join(fixtures, "backlog", "E99.json"), JSON.stringify([{ id: "E99-01", filesTouched, ...extra }]));

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "ownership-test-"));
  fixtures = mkdtempSync(join(tmpdir(), "ownership-fixtures-"));
  git("init", "-q", "-b", "main");
  git("config", "user.email", "t@example.com");
  git("config", "user.name", "t");
  mkdirSync(join(fixtures, "backlog"));
  setFilesTouched(["src/a.ts", "docs/**", "scripts/*.mjs"]);
  writeFileSync(join(fixtures, "jira-map.json"), JSON.stringify({ epics: {}, tickets: { "E99-01": "PLRNUI-9999" } }));
  write("README.md");
  write("src/b.ts");
  git("add", "-A");
  git("commit", "-q", "-m", "base");
  git("branch", "base");
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
  rmSync(fixtures, { recursive: true, force: true });
});

describe("PLRNUI-449 file-ownership guard", () => {
  it("exits 0 when the diff stays within filesTouched", () => {
    write("src/a.ts");
    write("docs/guide/x.md");
    write("scripts/tool.mjs");
    commit("change");
    const result = run("E99-01", "base");
    assert.equal(result.status, 0, result.stderr);
  });

  it("exits 1 and lists a file outside filesTouched", () => {
    write("src/a.ts");
    write("src/other.ts");
    commit("change");
    const result = run("E99-01", "base");
    assert.equal(result.status, 1);
    assert.match(result.stderr, /src\/other\.ts/);
    assert.doesNotMatch(result.stderr, /src\/a\.ts/);
  });

  it("counts deletions and both sides of a rename", () => {
    mkdirSync(join(dir, "docs"));
    git("mv", "src/b.ts", "docs/b.md");
    commit("rename out of the owned set");
    const outward = run("E99-01", "base");
    assert.equal(outward.status, 1);
    assert.match(outward.stderr, /src\/b\.ts/);
    assert.doesNotMatch(outward.stderr, /docs\/b\.md/);

    git("reset", "-q", "--hard", "base");
    write("docs/old.md");
    commit("add owned file");
    git("branch", "-f", "base2");
    git("mv", "docs/old.md", "src/new.ts");
    commit("rename into the unowned set");
    const inward = run("E99-01", "base2");
    assert.equal(inward.status, 1);
    assert.match(inward.stderr, /src\/new\.ts/);
    assert.doesNotMatch(inward.stderr, /docs\/old\.md/);
  });

  it("exits non-zero for an unknown ticket id", () => {
    write("src/a.ts");
    commit("change");
    const result = run("E99-77", "base");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /unknown ticket/);
  });

  it("resolves a Jira key and allows the STATE.md execution log row", () => {
    write("src/a.ts");
    write("audit/texo-v1/STATE.md");
    commit("change");
    assert.equal(run("PLRNUI-9999", "base").status, 0);
  });

  it("uses dir/** as a prefix match and * across slashes, like the backlog validator", () => {
    write("docs-extra/x.md");
    write("scripts/deep/tool.mjs");
    commit("change");
    const result = run("E99-01", "base");
    assert.equal(result.status, 1);
    assert.match(result.stderr, /docs-extra\/x\.md/);
    assert.doesNotMatch(result.stderr, /scripts\/deep\/tool\.mjs/);
  });

  it("fails closed on a missing base ref and on missing arguments", () => {
    assert.equal(run("E99-01", "no-such-ref").status, 2);
    assert.equal(spawnSync("node", [SCRIPT], { cwd: dir, encoding: "utf8" }).status, 2);
  });
});

// Expected values computed with Python fnmatch.fnmatchcase (the matcher of the backlog validator).
const PARITY: Array<[string, string, boolean]> = [["src/*.ts", "src/x/y.ts", true], ["src/?.ts", "src/a.ts", true], ["src/?.ts", "src/ab.ts", false], ["src/[ab].ts", "src/a.ts", true], ["src/[ab].ts", "src/c.ts", false], ["src/[!ab].ts", "src/c.ts", true], ["src/[!ab].ts", "src/a.ts", false], ["a.b", "aXb", false], ["a[b", "a[b", true], ["[*].ts", "..ts", false], ["[*].ts", "*.ts", true], ["src/[]a].ts", "src/].ts", true], ["docs-x/*", "docs-x/a/b", true], ["a+b", "a+b", true], ["a(b)", "a(b)", true], ["A.ts", "a.ts", false], ["*", "x/y/z", true]];

describe("PLRNUI-449 matcher parity with the backlog validator", () => {
  for (const [pattern, path, expected] of PARITY) {
    it(`${pattern} vs ${path} -> ${expected}`, () => {
      setFilesTouched([pattern]);
      write(path);
      commit("change");
      assert.equal(run("E99-01", "base").status, expected ? 0 : 1);
    });
  }
});

describe("PLRNUI-449 hardening", () => {
  it("matches an exact path that contains brackets (E11-03: apps/catalog/app/c/[name].tsx)", () => {
    setFilesTouched(["apps/catalog/app/c/[name].tsx"]);
    write("apps/catalog/app/c/[name].tsx");
    commit("change");
    assert.equal(run("E99-01", "base").status, 0);
    write("apps/catalog/app/c/other.tsx");
    commit("another file");
    assert.equal(run("E99-01", "base").status, 1);
  });

  it("rejects a base that looks like a git option (no fail-open)", () => {
    write("src/other.ts");
    commit("change");
    const result = run("E99-01", "--output=/dev/null");
    assert.equal(result.status, 2);
  });

  it("exits 2, not 1, on invalid backlog data", () => {
    write("src/a.ts");
    commit("change");
    setFilesTouched("src/a.ts");
    assert.equal(run("E99-01", "base").status, 2);
    setFilesTouched([]);
    assert.equal(run("E99-01", "base").status, 2);
    setFilesTouched(["src/a.ts"], { allowGenerated: "*" });
    assert.equal(run("E99-01", "base").status, 2);
  });

  it("honours allowGenerated and allows only STATE.md besides filesTouched", () => {
    write("src/a.ts");
    write("generated/out.txt");
    write("audit/texo-v1/OTHER.md");
    commit("change");
    setFilesTouched(["src/a.ts"], { allowGenerated: ["generated/**"] });
    const result = run("E99-01", "base");
    assert.equal(result.status, 1);
    assert.match(result.stderr, /audit\/texo-v1\/OTHER\.md/);
    assert.doesNotMatch(result.stderr, /generated\/out\.txt/);
  });

  it("handles non-ASCII paths without git quoting", () => {
    setFilesTouched(["src/café.ts"]);
    write("src/café.ts");
    commit("change");
    assert.equal(run("E99-01", "base").status, 0);
  });
});
