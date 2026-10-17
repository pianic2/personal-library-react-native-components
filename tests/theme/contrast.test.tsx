import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import * as contrast from "../../src/theme/contrast";
import { AA_NON_TEXT, AA_TEXT, compositeOver, contrastRatio, meetsContrast, parseColor, relativeLuminance } from "../../src/theme/contrast";
// @ts-expect-error the script is plain JavaScript without declarations
import { PAIRS, WAIVERS, evaluateTheme } from "../../scripts/validate-theme-contrast.mjs";
import { createSemanticRoles } from "../../src/tokens/semantic.base";

const root = resolve(import.meta.dirname, "../..");
const script = join(root, "scripts/validate-theme-contrast.mjs");

function run(args: string[] = []) {
  return spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: "utf8" });
}

function withThemeFile(theme: unknown, args: string[] = []) {
  const dir = mkdtempSync(join(tmpdir(), "contrast-"));
  try {
    const file = join(dir, "theme.json");
    writeFileSync(file, typeof theme === "string" ? theme : JSON.stringify(theme));
    return run(["--theme-file", file, ...args]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const roles = (mode: "light" | "dark") => JSON.parse(JSON.stringify(createSemanticRoles(mode)));

describe("PLRNUI-278 contrast util", () => {
  it("black on white is exactly 21 and #777 on white is about 4.48", () => {
    assert.equal(contrastRatio("#000", "#fff"), 21);
    assert.equal(contrastRatio("#000000", "#ffffff"), 21);
    assert.equal(contrastRatio("#fff", "#000"), 21, "the order of the colours does not matter");
    assert.equal(contrastRatio("#777", "#fff").toFixed(2), "4.48");
    assert.equal(contrastRatio("#777777", "#FFFFFF").toFixed(2), "4.48");
    assert.equal(contrastRatio("#123456", "#123456"), 1);
  });

  it("relative luminance of white is 1 and of black is 0", () => {
    assert.equal(relativeLuminance("#fff"), 1);
    assert.equal(relativeLuminance("#000"), 0);
  });

  it("handles 8 digit hex, 4 digit hex and rgba(): a translucent foreground is composited over the background", () => {
    // Black at alpha a over white is a grey of 255 * (1 - a), rounded to a whole channel before measuring.
    assert.equal(contrastRatio("#00000080", "#ffffff"), contrastRatio("#7F7F7F", "#ffffff")); // 128/255 -> 127
    assert.equal(contrastRatio("#0008", "#ffffff"), contrastRatio("#777777", "#ffffff")); // 136/255 -> 119
    assert.equal(contrastRatio("rgba(0, 0, 0, 0.5)", "#ffffff"), contrastRatio("#808080", "#ffffff")); // 127.5 -> 128
    assert.equal(contrastRatio("rgba(0 0 0 / 50%)", "#ffffff"), contrastRatio("#808080", "#ffffff"));
    assert.equal(contrastRatio("#000000ff", "#ffffffff"), 21);
    assert.equal(contrastRatio("rgb(0, 0, 0)", "rgb(255, 255, 255)"), 21);
    assert.equal(contrastRatio("rgba(0,0,0,1)", "rgba(255,255,255,1)"), 21);
  });

  it("a translucent background is composited over the backdrop (white by default)", () => {
    assert.equal(contrastRatio("#000", "rgba(255, 255, 255, 0.0)"), 21, "transparent over the white backdrop");
    assert.equal(contrastRatio("#fff", "rgba(0, 0, 0, 0.0)", "#000"), 21, "transparent over a black backdrop");
  });

  it("parseColor reads every supported form and rejects the others", () => {
    assert.deepEqual(parseColor("#0f0"), { r: 0, g: 255, b: 0, a: 1 });
    assert.deepEqual(parseColor(" #00ff0080 "), { r: 0, g: 255, b: 0, a: 128 / 255 });
    assert.deepEqual(parseColor("rgb(10, 20, 30)"), { r: 10, g: 20, b: 30, a: 1 });
    assert.deepEqual(parseColor("rgba(10%, 20%, 30%, 25%)"), { r: 25.5, g: 51, b: 76.5, a: 0.25 });
    for (const bad of ["", "red", "#12", "#12345", "#gggggg", "rgb(1, 2)", "rgba(1, 2, 3, 4, 5)", "hsl(0, 0%, 0%)", "rgb(a, b, c)", "rgb(255,,0,0)", "rgb(1 / 2 / 3 / 4)", "rgb(1,2/3,4)", "rgb(0 0 0 0.5)", "rgb(1, 2 3)", "rgba(1 2 3,)"]) {
      assert.equal(parseColor(bad), null, bad);
    }
    assert.equal(parseColor(42 as unknown as string), null);
  });

  it("an unparseable colour throws instead of passing silently", () => {
    assert.throws(() => contrastRatio("red", "#fff"), TypeError);
    assert.throws(() => contrastRatio("#000", "nope"), /background/);
  });

  it("compositeOver blends by alpha and meetsContrast compares with the minimum", () => {
    assert.deepEqual(compositeOver({ r: 0, g: 0, b: 0, a: 0.5 }, { r: 255, g: 255, b: 255, a: 1 }), { r: 127.5, g: 127.5, b: 127.5, a: 1 });
    assert.equal(AA_TEXT, 4.5);
    assert.equal(AA_NON_TEXT, 3);
    assert.ok(meetsContrast(4.5, AA_TEXT));
    assert.ok(!meetsContrast(4.49, AA_TEXT));
    assert.ok(!meetsContrast(Number.NaN, AA_NON_TEXT));
  });
});

describe("PLRNUI-278 validate-theme-contrast", () => {
  it("exits 0 for the default theme in both modes and prints the ratios, with the outline waivers reported", () => {
    const result = run();
    assert.equal(result.status, 0, result.stderr + result.stdout);
    assert.match(result.stdout, /default\s+light\s+onSurface\/surface\.0\s+#020408\s+#FFFFFF\s+20\.52\s+4\.5\s+PASS/);
    assert.match(result.stdout, /default\s+dark\s+onPrimary\/primary/);
    assert.match(result.stdout, /WAIVED light outline\/surface\.0 \(2\.56 < 3\): known finding/);
    assert.match(result.stdout, /0 failing/);
  });

  it("exits 1 and names the pair when a fixture theme has a failing pair (negative test)", () => {
    const light = roles("light");
    light.onSurface = "#BBBBBB"; // light grey text on white
    const result = withThemeFile({ name: "fixture", modes: { light, dark: roles("dark") } });
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stderr, /FAIL fixture light onSurface\/surface\.0: 1\.\d+ < 4\.5 \(#BBBBBB on #FFFFFF\)/);
  });

  it("a file theme gets no waivers: the default outline role fails there", () => {
    const result = withThemeFile({ name: "fixture", modes: { light: roles("light"), dark: roles("dark") } });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /FAIL fixture light outline\/surface\.0/);
    assert.match(result.stderr, /FAIL fixture dark outline\/surface\.1/);
  });

  it("a fixture theme that passes every pair exits 0, with 8 digit hex and rgba() colours", () => {
    const strong = (mode: "light" | "dark") => {
      const r = roles(mode);
      const ink = mode === "light" ? "#000000FF" : "rgba(255, 255, 255, 1)";
      r.outline = ink;
      r.focusRing = ink;
      return r;
    };
    const result = withThemeFile({ name: "strong", modes: { light: strong("light"), dark: strong("dark") } });
    assert.equal(result.status, 0, result.stderr + result.stdout);
  });

  it("--json prints the rows", () => {
    const result = run(["--json"]);
    assert.equal(result.status, 0);
    const parsed = JSON.parse(result.stdout) as { ok: boolean; rows: Array<{ status: string }> };
    assert.equal(parsed.ok, true);
    assert.equal(parsed.rows.filter((r) => r.status === "waived").length, 4);
  });

  it("exits 2 for bad input: unknown option, missing value, unreadable or malformed file, missing role, unparseable colour", () => {
    assert.equal(run(["--nope"]).status, 2);
    assert.equal(run(["--theme-file"]).status, 2);
    assert.equal(run(["--theme-file", "/nonexistent/theme.json"]).status, 2);
    assert.equal(withThemeFile("{ not json").status, 2);
    assert.equal(withThemeFile({ name: "x" }).status, 2);
    assert.equal(withThemeFile({ name: "x", modes: {} }).status, 2);
    const missing = roles("light");
    delete missing.focusRing;
    const noRole = withThemeFile({ name: "x", modes: { light: missing, dark: roles("dark") } });
    assert.equal(noRole.status, 2);
    assert.match(noRole.stderr, /missing colour role "focusRing"/);
    const bad = roles("light");
    bad.onSurface = "red";
    const unparseable = withThemeFile({ name: "x", modes: { light: bad, dark: roles("dark") } });
    assert.equal(unparseable.status, 2);
    assert.match(unparseable.stderr, /cannot parse/);
  });
});

type Row = { id: string; mode: string; status: string; ratio: number };
const defaultTheme = () => ({ name: "default", modes: { light: roles("light"), dark: roles("dark") } });
const statusOf = (rows: Row[], mode: string, id: string) => rows.find((r) => r.mode === mode && r.id === id)?.status;

describe("PLRNUI-278 waivers cover the documented finding only", () => {
  it("the default theme: the four outline pairs are waived, everything else passes, no waiver is unused", () => {
    const { rows, unusedWaivers } = evaluateTheme(defaultTheme(), contrast, PAIRS, WAIVERS) as { rows: Row[]; unusedWaivers: string[] };
    assert.deepEqual(unusedWaivers, []);
    assert.deepEqual(rows.filter((r) => r.status === "waived").map((r) => `${r.mode} ${r.id}`).sort(), Object.keys(WAIVERS).sort());
    assert.deepEqual(rows.filter((r) => r.status === "fail" || r.status === "stale-waiver"), []);
  });

  it("an outline that gets worse than the documented finding fails again, waiver or not", () => {
    const theme = defaultTheme();
    theme.modes.light.outline = "#C0C8D2"; // about 1.6 on white: below the waiver floor
    const { rows } = evaluateTheme(theme, contrast, PAIRS, WAIVERS) as { rows: Row[] };
    assert.equal(statusOf(rows, "light", "outline/surface.0"), "fail");
    assert.equal(statusOf(rows, "dark", "outline/surface.0"), "waived");
  });

  it("an outline that now passes makes its waiver stale (and the CLI treats that as a failure)", () => {
    const theme = defaultTheme();
    theme.modes.light.outline = "#000000";
    const { rows } = evaluateTheme(theme, contrast, PAIRS, WAIVERS) as { rows: Row[] };
    assert.equal(statusOf(rows, "light", "outline/surface.0"), "stale-waiver");
  });

  it("a waiver that matches no pair is reported as unused", () => {
    const { unusedWaivers } = evaluateTheme(defaultTheme(), contrast, PAIRS, { ...WAIVERS, "light nope/typo": { reason: "x", floor: 1 } }) as { unusedWaivers: string[] };
    assert.deepEqual(unusedWaivers, ["light nope/typo"]);
  });

  it("a translucent surface is rejected instead of being measured on the wrong backdrop", () => {
    const theme = defaultTheme();
    theme.modes.dark.surface[0] = "#FFFFFF40";
    assert.throws(() => evaluateTheme(theme, contrast, PAIRS, WAIVERS), /translucent/);
  });
});

describe("PLRNUI-278 validate-theme-contrast CLI hardening", () => {
  it("runs the checks when invoked through a symlink (the gate must not turn into a silent no-op)", () => {
    const dir = mkdtempSync(join(tmpdir(), "contrast-link-"));
    try {
      const link = join(dir, "validate.mjs");
      symlinkSync(script, link);
      const bad = roles("light");
      bad.onSurface = "#BBBBBB";
      const file = join(dir, "theme.json");
      writeFileSync(file, JSON.stringify({ name: "fixture", modes: { light: bad, dark: roles("dark") } }));
      const failing = spawnSync(process.execPath, [link, "--theme-file", file], { cwd: root, encoding: "utf8" });
      assert.equal(failing.status, 1, failing.stdout + failing.stderr);
      assert.match(failing.stderr, /FAIL fixture light onSurface\/surface\.0/);
      const plain = spawnSync(process.execPath, [link], { cwd: root, encoding: "utf8" });
      assert.equal(plain.status, 0, plain.stderr);
      assert.match(plain.stdout, /34 pair/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("a theme file needs both light and dark, and no other mode", () => {
    assert.equal(withThemeFile({ name: "x", modes: { light: roles("light") } }).status, 2);
    assert.equal(withThemeFile({ name: "x", modes: { dark: roles("dark") } }).status, 2);
    assert.equal(withThemeFile({ name: "x", modes: { light: roles("light"), dark: roles("dark"), foo: roles("dark") } }).status, 2);
  });

  it("a theme file can add pairs of its own, which are checked and named when they fail", () => {
    const strong = (mode: "light" | "dark") => {
      const r = roles(mode);
      r.outline = mode === "light" ? "#000000" : "#FFFFFF";
      r.focusRing = r.outline;
      return r;
    };
    const base = { name: "strong", modes: { light: strong("light"), dark: strong("dark") } };
    assert.equal(withThemeFile({ ...base, pairs: [{ id: "muted/surface.0 (12:1)", fg: "onSurfaceMuted", bg: "surface.0", min: 12 }] }).status, 1);
    const ok = withThemeFile({ ...base, pairs: [{ id: "onSurface/surface.0 (7:1)", fg: "onSurface", bg: "surface.0", min: 7 }] });
    assert.equal(ok.status, 0, ok.stderr + ok.stdout);
    const failing = withThemeFile({ ...base, pairs: [{ id: "muted/surface.0 (12:1)", fg: "onSurfaceMuted", bg: "surface.0", min: 12 }] });
    assert.match(failing.stderr, /FAIL strong light muted\/surface\.0 \(12:1\): 7\.58 < 12/);
    assert.equal(withThemeFile({ ...base, pairs: "nope" }).status, 2);
    assert.equal(withThemeFile({ ...base, pairs: [{ id: "x", fg: "onSurface", bg: "surface.0" }] }).status, 2);
  });

  it("--theme-file followed by an option is a usage error", () => {
    assert.equal(run(["--theme-file", "--json"]).status, 2);
  });
});
