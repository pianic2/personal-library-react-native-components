import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
// @ts-expect-error plain ESM script without type declarations
import { assertBundle, assertSingleCopies, assertWebRender, defaultWorkDir, parseArgs } from "../../scripts/expo-consumer-smoke.mjs";

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

describe("PLRNUI-170 Expo consumer smoke --via-shim", () => {
  const target = "@personal-library/react-native-components";

  it("parses --via-shim anywhere among the other flags and defaults to off", () => {
    assert.equal(parseArgs([]).viaShim, false);
    assert.equal(parseArgs(["--via-shim"]).viaShim, true);
    const both = parseArgs(["--platform", "web", "--via-shim", "--work-dir", "x"]);
    assert.deepEqual([both.viaShim, both.platforms, both.workDir.endsWith("/x")], [true, ["web"], true]);
    assert.deepEqual(parseArgs(["--via-shim", "--platform", "ios"]).platforms, ["ios"]);
  });

  it("reads the package name from the identity config, packs the shim and mixes imports", () => {
    const script = readFileSync("scripts/expo-consumer-smoke.mjs", "utf8");
    assert.match(script, /const packageName = currentPackageName\(\)/);
    assert.doesNotMatch(script, /const packageName = "/);
    assert.match(script, /"scripts\/build-shim\.mjs", "--out", shimDir, "--target-tarball", targetTarball/);
    assert.match(script, /import \{ ThemeProvider, useTheme \} from "\$\{packageName\}"/);
    assert.match(script, /overrides: \{ \[packageName\]: `\$\$\{packageName\}` \}/);
  });

  it("assertSingleCopies accepts deduped repeats of one copy and rejects a second path or version", () => {
    const node = (version: string, path: string, dependencies?: object) => ({ version, path, dependencies });
    const names = [target, "react"];
    const one = {
      dependencies: {
        [target]: node("1.0.0", "/c/node_modules/t"),
        react: node("19.2.3", "/c/node_modules/react"),
        shim: node("1.0.0", "/c/node_modules/shim", { [target]: node("1.0.0", "/c/node_modules/t"), react: node("19.2.3", "/c/node_modules/react") }),
      },
    };
    assert.equal(assertSingleCopies(one, names)[target].paths.size, 1);
    const nestedPath = { dependencies: { ...one.dependencies, shim: node("1.0.0", "/c/s", { [target]: node("1.0.0", "/c/s/node_modules/t") }) } };
    assert.throws(() => assertSingleCopies(nestedPath, names), /expected one copy of @personal-library\/react-native-components, found 2 path/);
    const otherVersion = { dependencies: { ...one.dependencies, shim: node("1.0.0", "/c/s", { react: node("19.0.0", "/c/s/node_modules/react") }) } };
    assert.throws(() => assertSingleCopies(otherVersion, names), /expected one copy of react/);
    assert.throws(() => assertSingleCopies({ dependencies: {} }, names), /found 0 path/);
  });
});
