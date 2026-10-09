import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
// @ts-expect-error plain ESM script without type declarations
import { validateCommitMessage } from "../../scripts/check-commit-msg.mjs";

const ok = (message: string) => validateCommitMessage(message).ok === true;

describe("PLRNUI-447 commit message convention", () => {
  it("accepts add|fix|chore(PLRNUI-n): message", () => {
    assert.ok(ok("add(PLRNUI-12): x"));
    assert.ok(ok("fix(PLRNUI-7): y\n\nCo-Authored-By: someone"));
    assert.ok(ok("chore(PLRNUI-457): z"));
  });

  it("rejects other subjects", () => {
    for (const message of ["feat: x", "add(PLRNUI-): x", "add(PLRNUI-12):x", "add(PLRNUI-12): ", "update(PLRNUI-1): x", "", " add(PLRNUI-1): x"]) {
      assert.equal(ok(message), false, message);
    }
  });

  it("only the first line counts", () => {
    assert.equal(ok("feat: x\nadd(PLRNUI-1): y"), false);
  });

  it("accepts git-generated merge commits", () => {
    assert.ok(ok("Merge remote-tracking branch 'origin/texo/v1' into texo/PLRNUI-1-x"));
    assert.ok(ok("Merge pull request #12 from pianic2/texo/PLRNUI-444-x"));
    assert.equal(ok("Merged something"), false);
  });

  it("commit-msg hook exits non-zero for a bad message file", () => {
    const run = (text: string) => {
      const file = `${process.env.TMPDIR ?? "/tmp"}/commit-msg-test-${process.pid}.txt`;
      return spawnSync("sh", ["-c", `printf '%s' "$1" > "${file}" && sh .githooks/commit-msg "${file}"`, "sh", text], { encoding: "utf8" });
    };
    assert.equal(run("feat: x").status, 1);
    assert.equal(run("add(PLRNUI-12): x").status, 0);
  });
});

describe("PLRNUI-447 pre-push guard", () => {
  const push = (remoteRef: string) =>
    spawnSync("sh", [".githooks/pre-push"], {
      input: `refs/heads/work abc123 ${remoteRef} def456\n`,
      encoding: "utf8",
    });

  it("exits non-zero for a push to refs/heads/main", () => {
    const result = push("refs/heads/main");
    assert.equal(result.status, 1);
    assert.match(result.stderr, /not allowed/);
  });

  it("refuses deleting main too", () => {
    const result = spawnSync("sh", [".githooks/pre-push"], { input: "(delete) 0000 refs/heads/main def456\n", encoding: "utf8" });
    assert.equal(result.status, 1);
  });

  it("allows other branches", () => {
    assert.equal(push("refs/heads/texo/PLRNUI-1-x").status, 0);
    assert.equal(push("refs/heads/mainline").status, 0);
  });
});

describe("PLRNUI-447 branching policy", () => {
  it("documents the branch pattern and the hooksPath command", () => {
    const doc = readFileSync("docs/policies/branching.md", "utf8");
    assert.ok(doc.includes("texo/PLRNUI-<n>-<slug>"));
    assert.ok(doc.includes("git config core.hooksPath .githooks"));
  });
});
