// Run with: node --test tests/scripts/promote-dist-tag.test.mjs  (plain Node, no network: npm is replaced by a fake)
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { checkTagRules, integrityOf, parseArgs, promote } from "../../scripts/promote-dist-tag.mjs";

const root = resolve(import.meta.dirname, "../..");
const cli = join(root, "scripts", "promote-dist-tag.mjs");

const sri = (text) => `sha512-${createHash("sha512").update(text).digest("base64")}`;
const GOOD = sri("the tarball CI built");
const OTHER = sri("a different tarball");

let dir;
let fakeNpm;
let statePath;
let callsPath;

/** A fake npm: `view <spec> <field> --json` answers from the state file, `dist-tag add` is recorded (or fails). */
before(() => {
  dir = mkdtempSync(join(tmpdir(), "plrnui-132-"));
  statePath = join(dir, "state.json");
  callsPath = join(dir, "calls.log");
  fakeNpm = join(dir, "npm");
  writeFileSync(
    fakeNpm,
    `#!/usr/bin/env node
const fs = require("fs");
const state = JSON.parse(fs.readFileSync(process.env.FAKE_NPM_STATE, "utf8"));
fs.appendFileSync(process.env.FAKE_NPM_CALLS, process.argv.slice(2).join(" ") + "\\n");
const [cmd, spec, field] = process.argv.slice(2);
if (cmd === "view") {
  const answer = state.view[spec + " " + field];
  if (answer === undefined) { console.error("npm error code E404"); process.exit(1); }
  process.stdout.write(JSON.stringify(answer));
} else if (cmd === "dist-tag") {
  if (state.failTag) { console.error("npm error code E403"); process.exit(1); }
} else { process.exit(9); }
`
  );
  chmodSync(fakeNpm, 0o755);
});
after(() => rmSync(dir, { recursive: true, force: true }));

function setState(view, extra = {}) {
  writeFileSync(statePath, JSON.stringify({ view, ...extra }));
  rmSync(callsPath, { force: true });
}
const calls = () => (existsSync(callsPath) ? readFileSync(callsPath, "utf8").trim().split("\n") : []);
const run = (args) =>
  spawnSync(process.execPath, [cli, ...args, "--npm", fakeNpm], { encoding: "utf8", env: { ...process.env, FAKE_NPM_STATE: statePath, FAKE_NPM_CALLS: callsPath } });

const PKG = "@scope/pkg";
const base = (extra = {}) => ({
  [`${PKG}@1.0.0 dist.integrity`]: GOOD,
  [`${PKG} dist-tags`]: { rc: "1.0.0-rc.3", latest: "0.9.0", next: "1.0.0-rc.3" },
  ...extra,
});

describe("PLRNUI-132 promote-dist-tag: promotion", () => {
  it("dry run verifies the integrity and prints the planned npm commands without changing anything", () => {
    setState(base());
    const result = run([PKG, "1.0.0", "latest", "--integrity", GOOD, "--dry-run"]);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /integrity ok/);
    assert.match(result.stdout, /would run \(promote\): npm dist-tag add @scope\/pkg@1\.0\.0 latest/);
    assert.match(result.stdout, /latest points at 0\.9\.0 now/);
    assert.match(result.stdout, /to undo: node scripts\/promote-dist-tag\.mjs @scope\/pkg 0\.9\.0 latest --rollback/);
    assert.ok(!calls().some((c) => c.startsWith("dist-tag")), "no dist-tag command was run");
  });

  it("moves the tag when the integrity matches", () => {
    setState(base());
    const result = run([PKG, "1.0.0", "latest", "--integrity", GOOD]);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(calls().filter((c) => c.startsWith("dist-tag")), [`dist-tag add ${PKG}@1.0.0 latest`]);
    assert.match(result.stdout, /done: latest -> @scope\/pkg@1\.0\.0/);
  });

  it("refuses on an integrity mismatch and never touches a tag (also in a real run)", () => {
    setState(base({ [`${PKG}@1.0.0 dist.integrity`]: OTHER }));
    for (const extra of [[], ["--dry-run"]]) {
      const result = run([PKG, "1.0.0", "latest", "--integrity", GOOD, ...extra]);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /integrity mismatch/);
    }
    assert.ok(!calls().some((c) => c.startsWith("dist-tag")));
  });

  it("computes the expected integrity from a tarball", () => {
    const tarball = join(dir, "pkg.tgz");
    writeFileSync(tarball, "the tarball CI built");
    assert.equal(integrityOf(tarball), GOOD);
    setState(base());
    assert.equal(run([PKG, "1.0.0", "latest", "--tarball", tarball, "--dry-run"]).status, 0);
    writeFileSync(tarball, "tampered");
    const result = run([PKG, "1.0.0", "latest", "--tarball", tarball, "--dry-run"]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /integrity mismatch/);
  });

  it("does nothing when the tag already points at the version", () => {
    setState(base({ [`${PKG} dist-tags`]: { latest: "1.0.0" } }));
    const result = run([PKG, "1.0.0", "latest", "--integrity", GOOD]);
    assert.equal(result.status, 0);
    assert.match(result.stdout, /nothing to do/);
    assert.ok(!calls().some((c) => c.startsWith("dist-tag")));
  });

  it("treats a failing npm dist-tag as a refusal (exit 1)", () => {
    setState(base(), { failTag: true });
    const result = run([PKG, "1.0.0", "latest", "--integrity", GOOD]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /dist-tag add .* failed/);
  });

  it("refuses when the version is not on the registry", () => {
    setState({ [`${PKG} dist-tags`]: {} });
    const result = run([PKG, "1.0.0", "next", "--integrity", GOOD]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /npm view .* failed/);
  });
});

describe("PLRNUI-132 promote-dist-tag: rollback", () => {
  it("restores the previous version on the tag with the same integrity check", () => {
    const previous = sri("previous tarball");
    setState(base({ [`${PKG}@0.9.0 dist.integrity`]: previous, [`${PKG} dist-tags`]: { latest: "1.0.0" } }));
    const result = run([PKG, "0.9.0", "latest", "--rollback", "--integrity", previous]);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(calls().filter((c) => c.startsWith("dist-tag")), [`dist-tag add ${PKG}@0.9.0 latest`]);
    assert.match(result.stdout, /\(rollback\)/);
    const refused = run([PKG, "0.9.0", "latest", "--rollback", "--integrity", GOOD]);
    assert.equal(refused.status, 1);
  });
});

describe("PLRNUI-132 promote-dist-tag: shim", () => {
  const shim = "@legacy/shim";
  const shimState = (targetLatest) => ({
    [`${shim}@1.0.0 dist.integrity`]: GOOD,
    [`${shim} dist-tags`]: { latest: "0.9.0" },
    [`${PKG} dist-tags`]: { latest: targetLatest },
  });

  it("is allowed to reach latest only after the target is latest at the same version", () => {
    setState(shimState("0.9.0"));
    const early = run([shim, "1.0.0", "latest", "--integrity", GOOD, "--shim-of", PKG]);
    assert.equal(early.status, 1);
    assert.match(early.stderr, /only after @scope\/pkg is latest at 1\.0\.0/);
    assert.ok(!calls().some((c) => c.startsWith("dist-tag")));
    setState(shimState("1.0.0"));
    const ok = run([shim, "1.0.0", "latest", "--integrity", GOOD, "--shim-of", PKG]);
    assert.equal(ok.status, 0, ok.stderr);
    assert.match(ok.stdout, /target ok/);
    assert.deepEqual(calls().filter((c) => c.startsWith("dist-tag")), [`dist-tag add ${shim}@1.0.0 latest`]);
  });

  it("is not blocked for the other tags", () => {
    setState({ ...shimState("0.9.0"), [`${shim}@1.0.0-rc.1 dist.integrity`]: GOOD, [`${shim} dist-tags`]: {} });
    assert.equal(run([shim, "1.0.0-rc.1", "rc", "--integrity", GOOD, "--shim-of", PKG, "--dry-run"]).status, 0);
  });
});

describe("PLRNUI-132 promote-dist-tag: rules and usage", () => {
  it("applies the tag rules: latest is stable only, rc is rc only, next takes anything", () => {
    assert.throws(() => checkTagRules("1.0.0-rc.1", "latest"), /stable/);
    assert.throws(() => checkTagRules("1.0.0", "rc"), /release candidate/);
    assert.throws(() => checkTagRules("1.0.0-beta.1", "rc"), /release candidate/);
    for (const [version, tag] of [["1.0.0", "latest"], ["1.0.0-rc.2", "rc"], ["1.0.0-rc.2", "next"], ["1.0.0", "next"]]) assert.doesNotThrow(() => checkTagRules(version, tag));
    setState(base({ [`${PKG}@1.0.0-rc.3 dist.integrity`]: GOOD }));
    const result = run([PKG, "1.0.0-rc.3", "latest", "--integrity", GOOD]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /latest takes only a stable version/);
    assert.deepEqual(calls(), [], "the registry is not even queried");
  });

  it("exits 2 on bad usage and invalid input, and runs nothing", () => {
    setState(base());
    const bad = [
      [],
      [PKG, "1.0.0"],
      [PKG, "1.0.0", "beta", "--integrity", GOOD],
      ["Not A Name", "1.0.0", "latest", "--integrity", GOOD],
      [PKG, "1.0", "latest", "--integrity", GOOD],
      [PKG, "1.0.0", "latest"],
      [PKG, "1.0.0", "latest", "--integrity", GOOD, "--tarball", "x.tgz"],
      [PKG, "1.0.0", "latest", "--integrity", "sha1-abc"],
      [PKG, "1.0.0", "latest", "--integrity", GOOD, "--bogus"],
      [PKG, "1.0.0", "latest", "--integrity"],
      [PKG, "1.0.0", "latest", "--integrity", GOOD, "--shim-of", PKG],
      [PKG, "1.0.0", "latest", "--tarball", join(dir, "missing.tgz")],
    ];
    for (const args of bad) {
      const result = run(args);
      assert.equal(result.status, 2, `${args.join(" ")}: ${result.stderr}`);
    }
    assert.deepEqual(calls(), []);
  });

  it("parseArgs returns the parsed options and promote() reports the planned commands", () => {
    const parsed = parseArgs([PKG, "1.0.0", "next", "--integrity", GOOD, "--dry-run", "--npm", fakeNpm]);
    assert.equal(parsed.dryRun, true);
    assert.equal(parsed.tag, "next");
    setState(base());
    process.env.FAKE_NPM_STATE = statePath;
    process.env.FAKE_NPM_CALLS = callsPath;
    const lines = [];
    const commands = promote(parsed, (line) => lines.push(line));
    assert.deepEqual(commands, [["dist-tag", "add", `${PKG}@1.0.0`, "next"]]);
    assert.ok(lines.some((l) => l.startsWith("would run")));
  });
});

describe("PLRNUI-132 promote workflow", () => {
  const text = readFileSync(join(root, ".github", "workflows", "promote.yml"), "utf8");
  const code = text.split("\n").filter((line) => !line.trim().startsWith("#")).join("\n");
  const parts = text.slice(text.indexOf("\njobs:\n") + 6).split(/^  ([a-z][a-z0-9-]*):\s*$/m);
  const jobs = {};
  for (let i = 1; i < parts.length; i += 2) jobs[parts[i]] = parts[i + 1];

  it("is manual only, with a dry run by default, and read-only by default", () => {
    const header = text.slice(0, text.indexOf("\njobs:\n"));
    assert.match(header, /on:\n  workflow_dispatch:/);
    assert.doesNotMatch(header, /\n  (push|pull_request|pull_request_target|schedule):/);
    assert.match(header, /dry-run:\n[\s\S]*?type: boolean\n\s+default: true/);
    assert.match(header, /\npermissions:\n  contents: read\n/);
    assert.doesNotMatch(code, /id-token|contents: write/);
  });

  it("has verify, gates and promote, and only promote has the environment and the token", () => {
    assert.deepEqual(Object.keys(jobs), ["verify", "gates", "promote"]);
    assert.match(jobs.promote, /environment: npm-promote/);
    assert.match(jobs.promote, /NODE_AUTH_TOKEN: \$\{\{ secrets\.NPM_DIST_TAG_TOKEN \}\}/);
    for (const name of ["verify", "gates"]) assert.doesNotMatch(jobs[name], /secrets\.|environment:/, name);
    assert.equal([...code.matchAll(/secrets\./g)].length, 1);
  });

  it("runs the real promotion only from main, outside a dry run, after the gates passed or were skipped", () => {
    assert.match(jobs.promote, /!inputs\.dry-run/);
    assert.match(jobs.promote, /github\.ref == 'refs\/heads\/main'/);
    assert.match(jobs.promote, /needs\.verify\.result == 'success'/);
    assert.match(jobs.promote, /needs\.gates\.result == 'success' \|\| needs\.gates\.result == 'skipped'/);
    assert.match(jobs.verify, /promote-dist-tag\.mjs "\$\{args\[@\]\}" --dry-run/);
    assert.doesNotMatch(jobs.promote, /--dry-run/);
  });

  it("runs both consumer smokes and the API snapshot on the released commit, except for a rollback", () => {
    assert.match(jobs.gates, /if: \$\{\{ !inputs\.rollback \}\}/);
    assert.match(jobs.gates, /ref: v\$\{\{ inputs\.version \}\}/);
    for (const command of ["npm run consumer:smoke", "npm run consumer:expo", "npm run api:snapshot:check"]) assert.ok(jobs.gates.includes(command), command);
  });

  it("passes the inputs only through environment variables, with first-party actions only", () => {
    for (const [name, body] of Object.entries(jobs)) {
      for (const run of body.matchAll(/^\s+run:\s*(\|\n((?:\s{10,}.*\n?)+)|.*)/gm)) assert.doesNotMatch(run[0], /\$\{\{/, `${name} interpolates an expression into a script`);
    }
    for (const m of code.matchAll(/^\s*uses:\s*(\S+)/gm)) assert.match(m[1], /^actions\/[\w-]+@v\d+$/);
  });
});
