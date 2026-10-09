import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const SCRIPT = resolve("scripts/check-ownership.mjs");
let dir: string;

const git = (...args: string[]) => {
  const result = spawnSync("git", args, { cwd: dir, encoding: "utf8" });
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
  spawnSync("node", [SCRIPT, ...args, "--backlog-dir", join(dir, "backlog"), "--jira-map", join(dir, "jira-map.json")], {
    cwd: dir,
    encoding: "utf8",
  });

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "ownership-test-"));
  git("init", "-q", "-b", "main");
  git("config", "user.email", "t@example.com");
  git("config", "user.name", "t");
  mkdirSync(join(dir, "backlog"));
  writeFileSync(
    join(dir, "backlog", "E99.json"),
    JSON.stringify([{ id: "E99-01", filesTouched: ["src/a.ts", "docs/**", "scripts/*.mjs"] }]),
  );
  writeFileSync(join(dir, "jira-map.json"), JSON.stringify({ epics: {}, tickets: { "E99-01": "PLRNUI-9999" } }));
  write("README.md");
  write("src/b.ts");
  git("add", "-A");
  git("commit", "-q", "-m", "base");
  git("branch", "base");
});

afterEach(() => rmSync(dir, { recursive: true, force: true }));

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
    commit("rename");
    const result = run("E99-01", "base");
    assert.equal(result.status, 1);
    assert.match(result.stderr, /src\/b\.ts/);
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
