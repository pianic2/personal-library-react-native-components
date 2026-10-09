import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const SCRIPT = resolve("scripts/ticket-prompt.mjs");
let dir: string;

const TEMPLATE = [
  "Execute Jira {ticket}. Owned files: {owned_files}",
  "ADRs to read: {adr_ids}.",
  "Class: component. Do the work.",
  "Validation: {validation}",
  "Stop rule: {stop_rule}",
  "Evidence: {evidence}",
  "",
].join("\n");

const ticket = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  title: `Title of ${id}`,
  labels: ["texo-v1", "theme"],
  problem: `Problem of ${id}`,
  scope: [`scope line of ${id}`],
  acceptance: [`acceptance of ${id}`],
  validation: ["npm run typecheck", "npm test"],
  evidence: ["Output of the validation commands"],
  dependencies: [],
  filesTouched: [`src/${id}.ts`],
  size: "S",
  wave: 1,
  ...extra,
});

const writeBacklog = (tickets: Array<Record<string, unknown>>) => {
  writeFileSync(join(dir, "backlog", "E99.json"), JSON.stringify(tickets));
  writeFileSync(join(dir, "backlog", "_index.json"), JSON.stringify(tickets.map((t) => ({ id: t.id }))));
  const keys = Object.fromEntries(tickets.map((t, i) => [t.id as string, `PLRNUI-${9000 + i}`]));
  writeFileSync(join(dir, "jira-map.json"), JSON.stringify({ epics: {}, tickets: keys }));
};

const run = (...args: string[]) =>
  spawnSync(
    "node",
    [SCRIPT, ...args, "--backlog-dir", join(dir, "backlog"), "--jira-map", join(dir, "jira-map.json"), "--references-dir", join(dir, "references")],
    { encoding: "utf8" },
  );

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "ticket-prompt-test-"));
  mkdirSync(join(dir, "backlog"));
  mkdirSync(join(dir, "references"));
  writeFileSync(join(dir, "references", "component.md"), TEMPLATE);
  writeFileSync(join(dir, "references", "class-map.json"), JSON.stringify({ ignore: [], map: { theme: "component" } }));
  writeBacklog([
    ticket("E99-01", { dependencies: ["E99-02"], scope: ["uses ADR 0014 and ADR-R7", "again ADR 0014"], filesTouched: ["src/a.ts", "tests/a.test.ts"] }),
    ticket("E99-02", { problem: "SECRET problem of the dependency", filesTouched: ["src/secret-other.ts"] }),
  ]);
});

afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("PLRNUI-448 ticket prompt", () => {
  it("renders the same prompt for a Jira key and for the local id", () => {
    const byKey = run("PLRNUI-9000");
    const byId = run("E99-01");
    assert.equal(byKey.status, 0, byKey.stderr);
    assert.equal(byKey.stdout, byId.stdout);
    assert.match(byKey.stdout, /^# PLRNUI-9000 \(E99-01\) Title of E99-01/);
    assert.match(byKey.stdout, /Execute Jira PLRNUI-9000\. Owned files: src\/a\.ts, tests\/a\.test\.ts/);
    assert.match(byKey.stdout, /Validation: npm run typecheck; npm test/);
    assert.match(byKey.stderr, /estimated tokens \(characters \/ 4\): \d+/);
  });

  it("is deterministic: same input, same sha256", () => {
    const hash = (text: string) => createHash("sha256").update(text).digest("hex");
    assert.equal(hash(run("PLRNUI-9000").stdout), hash(run("PLRNUI-9000").stdout));
    assert.notEqual(hash(run("PLRNUI-9000").stdout), hash(run("PLRNUI-9001").stdout));
  });

  it("exits non-zero with a clear message for an unknown key", () => {
    const result = run("PLRNUI-1");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /unknown ticket: PLRNUI-1/);
    assert.equal(run().status, 2);
  });

  it("lists exactly the owned files and the ADRs named in the ticket, nothing from other tickets", () => {
    const out = run("E99-01").stdout;
    assert.match(out, /Owned files: src\/a\.ts, tests\/a\.test\.ts\n/);
    assert.match(out, /ADRs to read: ADR 0014, ADR R7\.\n/);
    assert.doesNotMatch(out, /secret-other\.ts/);
    assert.doesNotMatch(out, /SECRET problem/);
    assert.match(run("E99-02").stdout, /ADRs to read: none\./);
  });

  it("tells the session to ask the PO when no label maps to a class, and still succeeds", () => {
    writeBacklog([ticket("E99-01", { labels: ["texo-v1", "e7"] })]);
    const result = run("E99-01");
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Class: UNMAPPED\. .* stop and ask the PO/);
    assert.doesNotMatch(result.stdout, /Class: component/);
  });

  it("warns when a prompt is over the 2000 token budget", () => {
    writeBacklog([ticket("E99-01", { problem: "x".repeat(9000) })]);
    const result = run("E99-01");
    assert.equal(result.status, 0);
    assert.match(result.stderr, /OVER the 2000 budget/);
  });

  it("--all reports the share within budget and fails below 95 percent", () => {
    const small = Array.from({ length: 19 }, (_, i) => ticket(`E99-${String(i + 10)}`));
    writeBacklog([...small, ticket("E99-99", { problem: "x".repeat(9000) })]);
    const ok = run("--all");
    assert.equal(ok.status, 0, ok.stderr);
    assert.match(ok.stdout, /rendered 20\/20 tickets; 95\.0% within 2000/);
    assert.match(ok.stdout, /over budget, consider splitting: E99-99\(/);

    writeBacklog([...small.slice(0, 8), ticket("E99-98", { problem: "x".repeat(9000) }), ticket("E99-99", { problem: "x".repeat(9000) })]);
    const bad = run("--all");
    assert.equal(bad.status, 1);
    assert.match(bad.stdout, /80\.0% within 2000/);
  });

  it("--all fails when an indexed ticket cannot be rendered", () => {
    writeFileSync(join(dir, "backlog", "_index.json"), JSON.stringify([{ id: "E99-01" }, { id: "E99-77" }]));
    const result = run("--all");
    assert.equal(result.status, 1);
    assert.match(result.stderr, /failed to render: E99-77/);
  });

  it("copies ticket text literally: replacement patterns and braces are not interpreted", () => {
    writeBacklog([ticket("E99-01", { problem: "uses $& and $1 and {ticket} and {owned_files}" })]);
    const out = run("E99-01").stdout;
    assert.match(out, /Problem: uses \$& and \$1 and \{ticket\} and \{owned_files\}/);
  });

  it("fails closed when a mapped label points to a missing template, and on bad options or ticket data", () => {
    writeFileSync(join(dir, "references", "class-map.json"), JSON.stringify({ ignore: [], map: { theme: "ghost" } }));
    assert.equal(run("E99-01").status, 2);
    assert.equal(spawnSync("node", [SCRIPT, "E99-01", "--backlog-dir"], { encoding: "utf8" }).status, 2);
    assert.equal(run("--all", "E99-01").status, 2);
    writeFileSync(join(dir, "references", "class-map.json"), JSON.stringify({ ignore: [], map: { theme: "component" } }));
    writeBacklog([ticket("E99-01", { filesTouched: [] })]);
    const result = run("E99-01");
    assert.equal(result.status, 2);
    assert.match(result.stderr, /unknown ticket/);
  });

  it("an unmapped ticket needs a template that can carry the UNMAPPED marker", () => {
    writeBacklog([ticket("E99-01", { labels: ["e7"] })]);
    writeFileSync(join(dir, "references", "component.md"), "No class line here {ticket}\n");
    assert.equal(run("E99-01").status, 2);
  });

  it("--all lists tickets without a class mapping", () => {
    writeBacklog([ticket("E99-01", { labels: ["e7"] }), ticket("E99-02")]);
    const result = run("--all");
    assert.equal(result.status, 0);
    assert.match(result.stdout, /no class mapping .*: E99-01/);
  });

  it("fails closed when templates are missing", () => {
    rmSync(join(dir, "references"), { recursive: true });
    assert.equal(run("E99-01").status, 2);
  });
});

describe("PLRNUI-448 on the real backlog", () => {
  it("renders every ticket of _index.json with at least 95 percent within budget", () => {
    const result = spawnSync("node", [SCRIPT, "--all"], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const match = /rendered (\d+)\/(\d+) tickets; ([\d.]+)% within 2000/.exec(result.stdout);
    assert.ok(match, result.stdout);
    assert.equal(match[1], match[2]);
    assert.ok(Number(match[3]) >= 95);
  });
});
