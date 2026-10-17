#!/usr/bin/env node
// Theme contrast gate (PLRNUI-278): checks WCAG AA contrast of the semantic role pairs of every mode of a theme.
//
// Usage: validate-theme-contrast.mjs [--theme-file <json>] [--json]
//   (default)       the default theme, light and dark (roles from src/tokens/semantic.base.ts)
//   --theme-file    another theme: { "name": "...", "modes": { "light": <roles>, "dark": <roles> } } where <roles> has the
//                   shape of SemanticRoles (surface.0..3, onSurface, onSurfaceMuted, primary/secondary/error with
//                   main/on/container/onContainer, outline, focusRing). Colours may be #RGB(A), #RRGGBB(AA), rgb() or rgba().
//                   Waivers apply to the default theme only: a file theme must pass every pair.
//   --json          print the result as JSON instead of a table
// Exit 0: every pair passes or is waived. Exit 1: a pair fails (the table names it), or a waiver is stale (its pair now
// passes, so remove it). Exit 2: usage error or unreadable / malformed input (an unparseable colour included).
//
// The pair list (PAIRS) and the waivers (WAIVERS) are data. A preset adds its own pairs by extending PAIRS in a copy of
// this list; a waiver needs a reason and is printed on every run, never silent. Disabled states are exempt from WCAG and are
// not listed. Token values are not changed here: a failing pair is a finding for a separate fix ticket.
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const AA_TEXT = 4.5;
const AA_NON_TEXT = 3;

/** id, foreground role path, background role path, minimum ratio and what it protects. Paths are dotted keys of the roles. */
export const PAIRS = [
  ...[0, 1, 2, 3].map((tier) => ({ id: `onSurface/surface.${tier}`, fg: "onSurface", bg: `surface.${tier}`, min: AA_TEXT, kind: "text" })),
  ...[0, 1, 2, 3].map((tier) => ({ id: `onSurfaceMuted/surface.${tier}`, fg: "onSurfaceMuted", bg: `surface.${tier}`, min: AA_TEXT, kind: "text" })),
  { id: "onPrimary/primary", fg: "primary.on", bg: "primary.main", min: AA_TEXT, kind: "text" },
  { id: "onSecondary/secondary", fg: "secondary.on", bg: "secondary.main", min: AA_TEXT, kind: "text" },
  { id: "onError/error", fg: "error.on", bg: "error.main", min: AA_TEXT, kind: "text" },
  { id: "onContainer/container (primary)", fg: "primary.onContainer", bg: "primary.container", min: AA_TEXT, kind: "text" },
  { id: "onContainer/container (error)", fg: "error.onContainer", bg: "error.container", min: AA_TEXT, kind: "text" },
  { id: "outline/surface.0", fg: "outline", bg: "surface.0", min: AA_NON_TEXT, kind: "non-text" },
  { id: "outline/surface.1", fg: "outline", bg: "surface.1", min: AA_NON_TEXT, kind: "non-text" },
  { id: "focusRing/surface.0", fg: "focusRing", bg: "surface.0", min: AA_NON_TEXT, kind: "non-text" },
  { id: "focusRing/surface.1", fg: "focusRing", bg: "surface.1", min: AA_NON_TEXT, kind: "non-text" },
];

const OUTLINE_REASON =
  "known finding: the default outline role measures below 3:1 on the surfaces; changing token values is out of scope for PLRNUI-278, fix it in a separate ticket (then remove this waiver)";

/** Waivers of the default theme, keyed "mode pair-id". Each needs a reason; a waiver whose pair passes is reported as stale. */
export const WAIVERS = {
  "light outline/surface.0": OUTLINE_REASON,
  "light outline/surface.1": OUTLINE_REASON,
  "dark outline/surface.0": OUTLINE_REASON,
  "dark outline/surface.1": OUTLINE_REASON,
};

class InputError extends Error {}

function lookup(roles, path, where) {
  let value = roles;
  for (const key of path.split(".")) value = value?.[key];
  if (typeof value !== "string") throw new InputError(`${where}: missing colour role "${path}"`);
  return value;
}

/**
 * Evaluates `pairs` for each mode of `theme` ({ name, modes: { light, dark } }). Returns rows
 * { theme, mode, id, fg, bg, min, ratio, status } with status "pass", "fail" or "waived".
 * `contrast` is the module of src/theme/contrast.ts. Throws InputError for a missing role or an unparseable colour.
 */
export function evaluateTheme(theme, contrast, pairs = PAIRS, waivers = {}) {
  const rows = [];
  for (const [mode, roles] of Object.entries(theme.modes)) {
    for (const pair of pairs) {
      const where = `${theme.name} ${mode} ${pair.id}`;
      const fg = lookup(roles, pair.fg, where);
      const bg = lookup(roles, pair.bg, where);
      let ratio;
      try {
        ratio = contrast.contrastRatio(fg, bg);
      } catch (error) {
        throw new InputError(`${where}: ${error instanceof Error ? error.message : String(error)}`);
      }
      const passes = contrast.meetsContrast(ratio, pair.min);
      const waiver = waivers[`${mode} ${pair.id}`];
      rows.push({ theme: theme.name, mode, id: pair.id, fg, bg, min: pair.min, ratio, status: passes ? (waiver ? "stale-waiver" : "pass") : waiver ? "waived" : "fail", waiver });
    }
  }
  return rows;
}

function table(rows) {
  const head = ["theme", "mode", "pair", "fg", "bg", "ratio", "min", "status"];
  const body = rows.map((r) => [r.theme, r.mode, r.id, r.fg, r.bg, r.ratio.toFixed(2), String(r.min), r.status.toUpperCase()]);
  const widths = head.map((h, i) => Math.max(h.length, ...body.map((row) => row[i].length)));
  const line = (cells) => cells.map((c, i) => c.padEnd(widths[i])).join("  ").trimEnd();
  return [line(head), line(widths.map((w) => "-".repeat(w))), ...body.map(line)].join("\n");
}

function parseArgs(argv) {
  const options = { themeFile: null, json: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--json") options.json = true;
    else if (arg === "--theme-file") {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) throw new InputError("--theme-file needs a value");
      options.themeFile = value;
      i += 1;
    } else throw new InputError(`unknown argument ${arg}`);
  }
  return options;
}

async function loadContrast() {
  const { register } = await import("tsx/esm/api");
  const unregister = register();
  try {
    const contrast = await import(pathToFileURL(join(REPO_ROOT, "src/theme/contrast.ts")).href);
    const semantic = await import(pathToFileURL(join(REPO_ROOT, "src/tokens/semantic.base.ts")).href);
    return { contrast, semantic };
  } finally {
    await unregister();
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const { contrast, semantic } = await loadContrast();
  let theme;
  let waivers = {};
  if (options.themeFile) {
    let raw;
    try {
      raw = JSON.parse(readFileSync(resolve(options.themeFile), "utf8"));
    } catch (error) {
      throw new InputError(`cannot read ${options.themeFile}: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (!raw || typeof raw.name !== "string" || typeof raw.modes !== "object" || raw.modes === null || Object.keys(raw.modes).length === 0) {
      throw new InputError('theme file must be { "name": string, "modes": { "light"?: roles, "dark"?: roles } }');
    }
    theme = raw;
  } else {
    theme = { name: "default", modes: { light: semantic.createSemanticRoles("light"), dark: semantic.createSemanticRoles("dark") } };
    waivers = WAIVERS;
  }
  const rows = evaluateTheme(theme, contrast, PAIRS, waivers);
  const failed = rows.filter((r) => r.status === "fail" || r.status === "stale-waiver");
  if (options.json) console.log(JSON.stringify({ rows, ok: failed.length === 0 }, null, 2));
  else {
    console.log(table(rows));
    for (const r of rows.filter((x) => x.status === "waived")) console.log(`WAIVED ${r.mode} ${r.id} (${r.ratio.toFixed(2)} < ${r.min}): ${r.waiver}`);
    for (const r of rows.filter((x) => x.status === "stale-waiver")) console.error(`STALE WAIVER ${r.mode} ${r.id}: it now passes (${r.ratio.toFixed(2)}), remove the waiver`);
    for (const r of rows.filter((x) => x.status === "fail")) console.error(`FAIL ${r.theme} ${r.mode} ${r.id}: ${r.ratio.toFixed(2)} < ${r.min} (${r.fg} on ${r.bg})`);
    console.log(`${rows.length} pair(s), ${rows.filter((r) => r.status === "pass").length} pass, ${rows.filter((r) => r.status === "waived").length} waived, ${failed.length} failing`);
  }
  return failed.length === 0 ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then(
    (code) => {
      process.exitCode = code;
    },
    (error) => {
      console.error(`validate-theme-contrast: ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 2;
    },
  );
}
