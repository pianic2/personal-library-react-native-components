import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
// @ts-expect-error plain ESM script without type declarations
import { assertBundle, assertWebRender, defaultWorkDir, parseArgs } from "../../scripts/expo-consumer-smoke.mjs";

const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
  scripts?: Record<string, string>;
};

describe("PLRNUI-58 Expo consumer smoke command", () => {
  it("exposes a deterministic Expo consumer smoke npm script", () => {
    assert.equal(
      packageJson.scripts?.["consumer:expo"],
      "node scripts/expo-consumer-smoke.mjs"
    );
  });

  it("keeps Expo consumer validation on package root and Metro semantics", () => {
    const script = readFileSync("scripts/expo-consumer-smoke.mjs", "utf8");

    assert.match(script, /@personal-library\/react-native-components/);
    assert.match(script, /expo/);
    assert.match(script, /export/);
    assert.doesNotMatch(script, /\.\.\/src|\.\.\/\.\.\/src|from ["'][^"']*src\//);
    assert.doesNotMatch(script, /\.\.\/dist|\.\.\/\.\.\/dist|from ["'][^"']*dist\//);
    assert.doesNotMatch(script, /@aura\/ui|from ["']AURA["']/);
    assert.match(script, /throw new Error/);
    assert.doesNotMatch(script, /try\s*\{[\s\S]*catch\s*\([^)]*\)\s*\{[\s\S]*console\.(warn|log)/);
  });
});

function temp() {
  return mkdtempSync(join(tmpdir(), "expo-smoke-test-"));
}

describe("PLRNUI-119 Expo consumer smoke: platforms, bundles and work dir", () => {
  it("parses --platform and --work-dir, defaults to all three platforms and rejects bad input", () => {
    assert.deepEqual(parseArgs([]).platforms, ["web", "ios", "android"]);
    assert.deepEqual(parseArgs(["--platform", "ios"]).platforms, ["ios"]);
    assert.deepEqual(parseArgs(["--platform", "all"]).platforms, ["web", "ios", "android"]);
    assert.match(parseArgs(["--work-dir", "relative/dir"]).workDir, /relative\/dir$/);
    for (const bad of [["--platform", "windows"], ["--platform"], ["--bogus", "x"], ["--work-dir", "--platform"]]) {
      assert.throws(() => parseArgs(bad), /platform must be|unknown or incomplete/);
    }
  });

  it("the work dir default comes from os.tmpdir(), not a hardcoded /tmp path", () => {
    assert.equal(defaultWorkDir(), join(tmpdir(), "plrnui-64-expo-consumer"));
    const script = readFileSync("scripts/expo-consumer-smoke.mjs", "utf8");
    assert.doesNotMatch(script, /["'`]\/tmp\//);
  });

  it("exports all three platforms in the consumer steps", () => {
    const script = readFileSync("scripts/expo-consumer-smoke.mjs", "utf8");
    assert.match(script, /const PLATFORMS = \["web", "ios", "android"\]/);
    assert.match(script, /"expo", "export", "--platform", platform/);
  });

  it("the CLI exits 2 on bad arguments before doing any work", () => {
    for (const args of [["--platform", "windows"], ["--bogus"]]) {
      const result = spawnSync(process.execPath, ["scripts/expo-consumer-smoke.mjs", ...args], { encoding: "utf8" });
      assert.equal(result.status, 2, result.stderr);
    }
  });

  it("the CLI also runs, and fails on bad arguments, when invoked through a symlink", () => {
    const dir = temp();
    try {
      const link = join(dir, "smoke-link.mjs");
      symlinkSync(join(process.cwd(), "scripts/expo-consumer-smoke.mjs"), link);
      const result = spawnSync(process.execPath, [link, "--platform", "windows"], { encoding: "utf8" });
      assert.equal(result.status, 2, result.stderr);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("assertBundle accepts a non-empty bundle and rejects a missing, empty or wrong-type one", () => {
    const dir = temp();
    try {
      mkdirSync(join(dir, "ios/_expo"), { recursive: true });
      assert.throws(() => assertBundle(join(dir, "nope"), "ios"), /export directory missing/);
      assert.throws(() => assertBundle(join(dir, "ios"), "ios"), /no non-empty \.hbc bundle/);
      writeFileSync(join(dir, "ios/_expo/entry.hbc"), "");
      assert.throws(() => assertBundle(join(dir, "ios"), "ios"), /no non-empty \.hbc bundle/);
      writeFileSync(join(dir, "ios/_expo/entry.hbc"), "hermes bytes");
      assert.deepEqual(assertBundle(join(dir, "ios"), "ios").bytes, 12);
      assert.throws(() => assertBundle(join(dir, "ios"), "web"), /no non-empty \.js bundle/);
      writeFileSync(join(dir, "ios/_expo/other.js"), "console.log(1)");
      assert.equal(assertBundle(join(dir, "ios"), "web").bytes, 14);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("assertWebRender fetches the exported HTML and script and requires the app markers", async () => {
    const dir = temp();
    try {
      mkdirSync(join(dir, "_expo/static/js/web"), { recursive: true });
      writeFileSync(join(dir, "index.html"), '<html><body><div id="root"></div><script src="/_expo/static/js/web/entry.js" defer></script></body></html>');
      writeFileSync(join(dir, "_expo/static/js/web/entry.js"), 'render("Increment"); render("Toggle theme");');
      await assertWebRender(dir);
      writeFileSync(join(dir, "_expo/static/js/web/entry.js"), 'render("Increment");');
      await assert.rejects(() => assertWebRender(dir), /app marker "Toggle theme"/);
      writeFileSync(join(dir, "index.html"), "<html><body></body></html>");
      await assert.rejects(() => assertWebRender(dir), /references no script bundle/);
      writeFileSync(join(dir, "index.html"), '<html><body><script src="/missing.js"></script><div id="root"></div></body></html>');
      await assert.rejects(() => assertWebRender(dir), /returned 404/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
