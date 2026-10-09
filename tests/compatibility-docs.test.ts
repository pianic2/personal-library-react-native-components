import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test, { afterEach } from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const tmpDirs: string[] = [];

afterEach(() => {
  while (tmpDirs.length) fs.rmSync(tmpDirs.pop() as string, { recursive: true, force: true });
});

type Entry = Record<string, unknown>;
type Config = { schemaVersion: number; tiers: Record<string, string>; entries: Entry[]; [key: string]: unknown };

/** A copy of the files the generator reads, so tests can change config and docs freely. */
function makeProject(mutate?: (config: Config) => void) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "plrnui-compat-"));
  tmpDirs.push(tmp);
  const config: Config = JSON.parse(fs.readFileSync(path.join(root, "config/compatibility.json"), "utf8"));
  mutate?.(config);
  fs.cpSync(path.join(root, "scripts"), path.join(tmp, "scripts"), { recursive: true });
  fs.mkdirSync(path.join(tmp, "config"), { recursive: true });
  fs.mkdirSync(path.join(tmp, "docs"), { recursive: true });
  fs.writeFileSync(path.join(tmp, "config/compatibility.json"), JSON.stringify(config, null, 2));
  fs.copyFileSync(path.join(root, "package.json"), path.join(tmp, "package.json"));
  fs.copyFileSync(path.join(root, "docs/compatibility.md"), path.join(tmp, "docs/compatibility.md"));
  fs.copyFileSync(path.join(root, "docs/platform-support.md"), path.join(tmp, "docs/platform-support.md"));
  for (const entry of config.entries) {
    const evidence = entry.evidence;
    if (typeof evidence === "string" && fs.existsSync(path.join(root, evidence))) {
      fs.mkdirSync(path.dirname(path.join(tmp, evidence)), { recursive: true });
      fs.copyFileSync(path.join(root, evidence), path.join(tmp, evidence));
    }
  }
  return tmp;
}

function run(cwd: string, ...args: string[]) {
  return spawnSync(process.execPath, ["scripts/compatibility-docs.mjs", ...args], { cwd, encoding: "utf8" });
}

const baseEntry = (): Entry => ({
  expo: "57.0.21",
  rn: "0.86.3",
  react: "19.2.3",
  platform: "ios",
  runtime: "Expo Go",
  tier: "residual",
  lastVerified: "2026-09-09",
  evidence: "audit/release/plrnui-62-native-runtime-publication-closure.md",
});

test("compatibility docs check passes on governed output", () => {
  const result = spawnSync(process.execPath, ["scripts/compatibility-docs.mjs", "--check"], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("the current entry stays supported and is rendered in both docs", () => {
  const config: Config = JSON.parse(fs.readFileSync(path.join(root, "config/compatibility.json"), "utf8"));
  assert.equal(config.schemaVersion, 2);
  assert.deepEqual(
    config.entries.filter((entry) => entry.tier === "supported").map((entry) => [entry.expo, entry.rn, entry.react, entry.platform, entry.runtime]),
    [["57.0.21", "0.86.3", "19.2.3", "android", "Expo Go"]],
  );
  assert.match(fs.readFileSync(path.join(root, "docs/compatibility.md"), "utf8"), /\| Android \| Expo Go \| `57\.0\.21` \| `0\.86\.3` \| `19\.2\.3` \| supported \| 2026-09-09 \|/);
  assert.match(fs.readFileSync(path.join(root, "docs/platform-support.md"), "utf8"), /\| Android \| Expo Go \| `57\.0\.21` \| `0\.86\.3` \| `19\.2\.3` \| supported \| 2026-09-09 \|/);
});

test("compatibility docs check rejects peer drift", () => {
  const tmp = makeProject();
  const file = path.join(tmp, "docs/compatibility.md");
  fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace(">=0.86.0 <0.87.0", ">=0.85.0 <0.86.0"));
  const result = run(tmp, "--check");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /drifts from package\.json/);
});

test("compatibility docs check rejects drift in the platform-support block", () => {
  const tmp = makeProject();
  const file = path.join(tmp, "docs/platform-support.md");
  fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace("| supported |", "| residual |"));
  const result = run(tmp, "--check");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /platform-support\.md drifts/);
});

test("hand edits outside the generated block of platform-support.md are not drift", () => {
  const tmp = makeProject();
  const file = path.join(tmp, "docs/platform-support.md");
  fs.writeFileSync(file, `${fs.readFileSync(file, "utf8")}\nA hand-written note.\n`);
  assert.equal(run(tmp, "--check").status, 0);
});

test("an entry without evidence fails validation", () => {
  const tmp = makeProject((config) => {
    const entry = baseEntry();
    delete entry.evidence;
    config.entries.push(entry);
  });
  const result = run(tmp, "--check");
  assert.equal(result.status, 2);
  assert.match(result.stderr, /evidence is required/);
});

test("evidence must be an existing repo file or an https URL", () => {
  for (const evidence of ["audit/release/does-not-exist.md", "../outside.md", "http://example.com/x"]) {
    const tmp = makeProject((config) => config.entries.push({ ...baseEntry(), evidence }));
    const result = run(tmp, "--check");
    assert.equal(result.status, 2, evidence);
    assert.match(result.stderr, /neither an https URL nor an existing repo file/, evidence);
  }
  const url = makeProject((config) => config.entries.push({ ...baseEntry(), evidence: "https://example.com/report" }));
  assert.equal(run(url, "--check").status, 1, "valid new entry: docs only drift because they are not regenerated");
});

test("invalid entries are rejected", () => {
  const cases: Array<[string, (config: Config) => void, RegExp]> = [
    ["unknown tier", (c) => c.entries.push({ ...baseEntry(), tier: "gold" }), /unknown tier/],
    ["bad platform", (c) => c.entries.push({ ...baseEntry(), platform: "tv" }), /platform must be one of/],
    ["bad version", (c) => c.entries.push({ ...baseEntry(), rn: "0.86" }), /must be a version/],
    ["bad date", (c) => c.entries.push({ ...baseEntry(), lastVerified: "2026-13-40" }), /calendar date/],
    ["unknown key", (c) => c.entries.push({ ...baseEntry(), note: "x" }), /unknown key/],
    ["duplicate entry", (c) => c.entries.push({ ...c.entries[0] }), /duplicate entry/],
    ["no supported entry", (c) => { c.entries[0].tier = "residual"; }, /at least one entry must have tier "supported"/],
    ["schema version", (c) => { c.schemaVersion = 1; }, /unsupported schemaVersion/],
    ["empty entries", (c) => { c.entries = []; }, /entries must be a non-empty array/],
    ["empty tier description", (c) => { c.tiers.supported = " "; }, /needs a description/],
  ];
  for (const [name, mutate, message] of cases) {
    const result = run(makeProject(mutate), "--check");
    assert.equal(result.status, 2, name);
    assert.match(result.stderr, message, name);
  }
});

test("adding a valid entry and regenerating renders it in both docs and passes the check", () => {
  const tmp = makeProject((config) => config.entries.push(baseEntry()));
  assert.equal(run(tmp, "--check").status, 1, "docs are stale before regenerating");
  const write = run(tmp);
  assert.equal(write.status, 0, write.stderr);
  for (const doc of ["docs/compatibility.md", "docs/platform-support.md"]) {
    assert.match(fs.readFileSync(path.join(tmp, doc), "utf8"), /\| iOS \| Expo Go \| `57\.0\.21` \| `0\.86\.3` \| `19\.2\.3` \| residual \| 2026-09-09 \|/, doc);
  }
  assert.equal(run(tmp, "--check").status, 0);
});

test("missing generated block markers in platform-support.md is an error", () => {
  const tmp = makeProject();
  fs.writeFileSync(path.join(tmp, "docs/platform-support.md"), "# Platform Support\n");
  const result = run(tmp, "--check");
  assert.equal(result.status, 2);
  assert.match(result.stderr, /missing the generated block markers/);
});

test("an unknown argument is rejected", () => {
  const result = run(makeProject(), "--bogus");
  assert.equal(result.status, 2);
  assert.match(result.stderr, /unknown argument/);
});
