#!/usr/bin/env node
// Theme contrast gate (PLRNUI-278): checks WCAG AA contrast of the semantic role pairs of every mode of a theme.
//
// Usage: validate-theme-contrast.mjs [--theme-file <json>] [--json]
//   (default)       the default theme, light and dark (roles from src/tokens/semantic.base.ts)
//   --theme-file    another theme: { "name": "...", "modes": { "light": <roles>, "dark": <roles> }, "pairs"?: [...] } where
//                   <roles> has the shape of SemanticRoles (surface.0..3, onSurface, onSurfaceMuted, primary/secondary/error
//                   with main/on/container/onContainer, outline, focusRing). Both modes are required. Colours may be
//                   #RGB(A), #RRGGBB(AA), rgb() or rgba(); a background must be opaque. "pairs" adds pairs to the built-in
//                   list: { "id": string, "fg": role path, "bg": role path, "min": number }.
//                   Waivers apply to the default theme only: a file theme must pass every pair.
//   --json          print the result as JSON instead of a table
// Exit 0: every pair passes or is waived. Exit 1: a pair fails (the table names it), a waived pair got WORSE than its floor
// (the waiver covers only the documented finding), or a waiver is stale (its pair now passes) or dead (no such pair).
// Exit 2: usage error or unreadable / malformed input (an unparseable colour or a translucent background included).
//
// The pair list (PAIRS) and the waivers (WAIVERS) are data. A preset adds its own pairs by extending PAIRS in a copy of
// this list; a waiver needs a reason and is printed on every run, never silent. Disabled states are exempt from WCAG and are
// not listed. Token values are not changed here: a failing pair is a finding for a separate fix ticket.
import { readFileSync, realpathSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * id, foreground role path, background role path and kind: "text" (WCAG AA 4.5) or "non-text" (3). Paths are dotted keys of
 * the roles. The minimum comes from src/theme/contrast.ts (AA_TEXT, AA_NON_TEXT), the single source of the thresholds.
 */
export const PAIRS = [
  ...[0, 1, 2, 3].map((tier) => ({ id: `onSurface/surface.${tier}`, fg: "onSurface", bg: `surface.${tier}`, kind: "text" })),
  ...[0, 1, 2, 3].map((tier) => ({ id: `onSurfaceMuted/surface.${tier}`, fg: "onSurfaceMuted", bg: `surface.${tier}`, kind: "text" })),
  { id: "onPrimary/primary", fg: "primary.on", bg: "primary.main", kind: "text" },
  { id: "onSecondary/secondary", fg: "secondary.on", bg: "secondary.main", kind: "text" },
  { id: "onError/error", fg: "error.on", bg: "error.main", kind: "text" },
  { id: "onContainer/container (primary)", fg: "primary.onContainer", bg: "primary.container", kind: "text" },
  { id: "onContainer/container (error)", fg: "error.onContainer", bg: "error.container", kind: "text" },
  { id: "outline/surface.0", fg: "outline", bg: "surface.0", kind: "non-text" },
  { id: "outline/surface.1", fg: "outline", bg: "surface.1", kind: "non-text" },
  { id: "focusRing/surface.0", fg: "focusRing", bg: "surface.0", kind: "non-text" },
  { id: "focusRing/surface.1", fg: "focusRing", bg: "surface.1", kind: "non-text" },
];

const OUTLINE_REASON =
  "known finding: the default outline role measures 2.3 to 2.7 against the surfaces, below 3:1; changing token values is out of scope for PLRNUI-278, a separate token-fix ticket (no id yet, to be filed by the PO) removes this waiver";

/**
 * Waivers of the default theme, keyed "mode pair-id": { reason, floor }. A waiver covers a ratio between `floor` and the
 * minimum only; below `floor` the pair fails again (a regression of the documented finding is not covered). A waiver whose
 * pair now passes is stale and one whose key matches no pair is dead: both fail the run, so waivers cannot accumulate.
 */
export const WAIVERS = {
  "light outline/surface.0": { reason: OUTLINE_REASON, floor: 2.5 },
  "light outline/surface.1": { reason: OUTLINE_REASON, floor: 2.25 },
  "dark outline/surface.0": { reason: OUTLINE_REASON, floor: 2.6 },
  "dark outline/surface.1": { reason: OUTLINE_REASON, floor: 2.4 },
};

class InputError extends Error {}

function lookup(roles, path, where) {
  let value = roles;
  for (const key of path.split(".")) value = value?.[key];
  if (typeof value !== "string") throw new InputError(`${where}: missing colour role "${path}"`);
  return value;
}

/**
 * Evaluates `pairs` for each mode of `theme` ({ name, modes: { light, dark } }). Returns { rows, unusedWaivers }; a row is
 * { theme, mode, id, fg, bg, min, ratio, status, waiver } with status "pass", "fail", "waived" or "stale-waiver", and
 * `unusedWaivers` lists the waiver keys that matched no pair. `contrast` is the module of src/theme/contrast.ts.
 * Throws InputError for a missing role, an unparseable colour or a translucent background.
 */
export function evaluateTheme(theme, contrast, pairs = PAIRS, waivers = {}) {
  const rows = [];
  const used = new Set();
  const minimum = (pair) => (typeof pair.min === "number" ? pair.min : pair.kind === "non-text" ? contrast.AA_NON_TEXT : contrast.AA_TEXT);
  for (const [mode, roles] of Object.entries(theme.modes)) {
    for (const pair of pairs) {
      const where = `${theme.name} ${mode} ${pair.id}`;
      const fg = lookup(roles, pair.fg, where);
      const bg = lookup(roles, pair.bg, where);
      let ratio;
      try {
        const parsed = contrast.parseColor(bg);
        if (parsed && parsed.a < 1) throw new TypeError(`background "${bg}" is translucent; a surface must be opaque to be measured`);
        ratio = contrast.contrastRatio(fg, bg);
      } catch (error) {
        throw new InputError(`${where}: ${error instanceof Error ? error.message : String(error)}`);
      }
      const min = minimum(pair);
      const passes = contrast.meetsContrast(ratio, min);
      const key = `${mode} ${pair.id}`;
      const waiver = waivers[key];
      if (waiver) used.add(key);
      let status = "pass";
      if (!passes) status = waiver && ratio >= waiver.floor ? "waived" : "fail";
      else if (waiver) status = "stale-waiver";
      rows.push({ theme: theme.name, mode, id: pair.id, fg, bg, min, ratio, status, waiver: waiver?.reason, floor: waiver?.floor });
    }
  }
  return { rows, unusedWaivers: Object.keys(waivers).filter((key) => !used.has(key)) };
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
  let extraPairs = [];
  if (options.themeFile) {
    let raw;
    try {
      raw = JSON.parse(readFileSync(resolve(options.themeFile), "utf8"));
    } catch (error) {
      throw new InputError(`cannot read ${options.themeFile}: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (!raw || typeof raw.name !== "string" || typeof raw.modes !== "object" || raw.modes === null) {
      throw new InputError('theme file must be { "name": string, "modes": { "light": roles, "dark": roles }, "pairs"?: [...] }');
    }
    const modes = Object.keys(raw.modes).sort().join(",");
    if (modes !== "dark,light") throw new InputError(`theme file "modes" must have exactly light and dark, got ${modes || "none"}`);
    if (raw.pairs !== undefined) {
      if (!Array.isArray(raw.pairs)) throw new InputError('"pairs" must be an array');
      for (const pair of raw.pairs) {
        if (!pair || typeof pair.id !== "string" || typeof pair.fg !== "string" || typeof pair.bg !== "string" || typeof pair.min !== "number" || !(pair.min >= 1)) {
          throw new InputError('each pair must be { "id": string, "fg": string, "bg": string, "min": number >= 1 }');
        }
      }
      extraPairs = raw.pairs;
    }
    theme = raw;
  } else {
    theme = { name: "default", modes: { light: semantic.createSemanticRoles("light"), dark: semantic.createSemanticRoles("dark") } };
    waivers = WAIVERS;
  }
  const { rows, unusedWaivers } = evaluateTheme(theme, contrast, [...PAIRS, ...extraPairs], waivers);
  const failed = rows.filter((r) => r.status === "fail" || r.status === "stale-waiver");
  const problems = failed.length + unusedWaivers.length;
  if (options.json) console.log(JSON.stringify({ rows, unusedWaivers, ok: problems === 0 }, null, 2));
  else {
    console.log(table(rows));
    for (const r of rows.filter((x) => x.status === "waived")) console.log(`WAIVED ${r.mode} ${r.id} (${r.ratio.toFixed(2)} < ${r.min}): ${r.waiver}`);
    for (const r of rows.filter((x) => x.status === "stale-waiver")) console.error(`STALE WAIVER ${r.mode} ${r.id}: it now passes (${r.ratio.toFixed(2)}), remove the waiver`);
    for (const key of unusedWaivers) console.error(`DEAD WAIVER ${key}: no such pair, remove it`);
    for (const r of rows.filter((x) => x.status === "fail")) {
      const note = r.floor === undefined ? "" : ` (waiver floor ${r.floor}: the documented finding got worse)`;
      console.error(`FAIL ${r.theme} ${r.mode} ${r.id}: ${r.ratio.toFixed(2)} < ${r.min} (${r.fg} on ${r.bg})${note}`);
    }
    console.log(`${rows.length} pair(s), ${rows.filter((r) => r.status === "pass").length} pass, ${rows.filter((r) => r.status === "waived").length} waived, ${problems} failing`);
  }
  return problems === 0 ? 0 : 1;
}

// realpath on both sides: a symlinked invocation path must not turn the gate into a silent no-op.
const isCli = process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
if (isCli) {
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
