#!/usr/bin/env node
// Bundle-size harness (PLRNUI-208, E14-05). Bundles fixture entries with esbuild (already allowed in package.json
// allowScripts; resolved from node_modules, no new dependency) and reports minified + gzip size per entry.
// Metro does not tree-shake, so the cost of `import { Button } from root` versus a subpath/deep import is measured here
// with esbuild (which honours package.json "sideEffects": false) and compared with the budgets in config/size-limits.json.
//
// Budgets live ONLY in config/size-limits.json (a .size-limit.json file is rejected). Every key of config/exports.json
// "subpaths" must have an entry there. The source of a subpath is derived from its exports.json "import" condition
// (./dist/x/index.js -> src/x/index.ts|tsx, wildcard: some src/<dir>/<x>/index.ts|tsx), the same mapping as
// scripts/generate-exports.mjs. A subpath whose source does not exist must be "pending" (no bundle, no budget); one whose
// source exists must have an entry file and a budget, so --check fails as soon as a source appears without a budget.
// "./package.json" is a metadata file: {"metadata": true}. The "delta" key names the two fixtures compared in the report.
//
// Usage: node scripts/bundle-size.mjs [--check] [--json] [--limits <file>] [--root <dir>] [--metro-export <dir>]
//   (no flag)         print the table, exit 0
//   --check           fail (exit 1) when a gzip size exceeds its budget, when budgets are missing or stale, or on any error
//   --limits <file>   alternative budget file (used by tests; default config/size-limits.json)
//   --root <dir>      repository root to measure (used by tests; default: this repository)
//   --metro-export <dir>  report only: sizes of the bundles of an `expo export` output directory, for comparison
// Exit 0 ok, 1 check failed or unexpected input/error, 2 usage.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const EXTERNALS = ["react", "react/jsx-runtime", "react-native"];

export class UsageError extends Error {}

export function parseArgs(argv) {
  const opts = { check: false, json: false, limits: undefined, root: defaultRoot, metroExport: undefined };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--check") opts.check = true;
    else if (arg === "--json") opts.json = true;
    else if (arg === "--limits" || arg === "--metro-export" || arg === "--root") {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith("--")) throw new UsageError(`${arg} needs a value`);
      if (arg === "--limits") opts.limits = resolve(value);
      else if (arg === "--root") opts.root = resolve(value);
      else opts.metroExport = resolve(value);
      i += 1;
    } else throw new UsageError(`unknown argument: ${arg}`);
  }
  opts.limits ??= join(opts.root, "config/size-limits.json");
  return opts;
}

async function loadEsbuild() {
  try {
    return await import("esbuild");
  } catch (error) {
    throw new Error(`esbuild is not installed (run npm ci): ${error.message}`);
  }
}

/**
 * Bundles `contents` (a fixture entry module, resolved from the repository root) and returns sizes and the source
 * files that ended up in the bundle. Deterministic: same input, same output.
 * @param {string} contents fixture source
 * @param {{ ignoreAnnotations?: boolean, root?: string }} [options] ignoreAnnotations disables sideEffects handling (negative control)
 */
export async function bundleFixture(contents, options = {}) {
  const root = options.root ?? defaultRoot;
  const esbuild = await loadEsbuild();
  const result = await esbuild.build({
    absWorkingDir: root,
    stdin: { contents, resolveDir: root, sourcefile: "fixture.ts", loader: "ts" },
    bundle: true,
    write: false,
    metafile: true,
    format: "esm",
    platform: "neutral",
    mainFields: ["module", "main"],
    target: "es2022",
    jsx: "automatic",
    minify: true,
    treeShaking: true,
    ignoreAnnotations: options.ignoreAnnotations === true,
    external: EXTERNALS,
    legalComments: "none",
    logLevel: "silent",
  });
  if (result.outputFiles.length !== 1) throw new Error(`expected one output file, got ${result.outputFiles.length}`);
  const code = result.outputFiles[0].contents;
  // A module that tree-shaking removed still appears in metafile.inputs, with no bytes in the output.
  const [output] = Object.values(result.metafile.outputs);
  const inputs = Object.entries(output.inputs)
    .filter(([file, info]) => file !== "<stdin>" && info.bytesInOutput > 0)
    .map(([file]) => file)
    .sort();
  // Every module the fixture reached, including ones fully tree-shaken away (proves the fixture really imports the library).
  const reached = Object.keys(result.metafile.inputs).filter((file) => file !== "<stdin>").sort();
  return { bytes: code.length, gzip: gzipSync(code, { level: 9 }).length, inputs, reached, code: Buffer.from(code).toString("utf8") };
}

/** Reads and validates config/size-limits.json. Throws on any unexpected shape (fail closed). */
export function loadLimits(file) {
  let data;
  try {
    data = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    throw new Error(`cannot read budgets ${file}: ${error.message}`);
  }
  const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
  if (!isObject(data) || data.schemaVersion !== 1) throw new Error("size-limits.json: schemaVersion must be 1");
  if (!isObject(data.fixtures) || Object.keys(data.fixtures).length === 0) throw new Error("size-limits.json: fixtures missing");
  for (const [name, fixture] of Object.entries(data.fixtures)) {
    if (typeof fixture.source !== "string" || !Number.isInteger(fixture.maxGzipBytes) || fixture.maxGzipBytes <= 0)
      throw new Error(`size-limits.json: fixture "${name}" needs a source string and a positive integer maxGzipBytes`);
  }
  if (!isObject(data.subpaths)) throw new Error("size-limits.json: subpaths missing");
  for (const [name, entry] of Object.entries(data.subpaths)) {
    if (!isObject(entry)) throw new Error(`size-limits.json: subpath "${name}" must be an object`);
    if (entry.metadata === true) {
      if (entry.entry !== undefined || entry.maxGzipBytes !== undefined || entry.pending !== undefined) throw new Error(`size-limits.json: metadata subpath "${name}" must not have entry, maxGzipBytes or pending`);
    } else if (entry.pending === true) {
      if (entry.entry !== undefined || entry.maxGzipBytes !== undefined) throw new Error(`size-limits.json: pending subpath "${name}" must not have entry or maxGzipBytes`);
      if (typeof entry.note !== "string" || entry.note === "") throw new Error(`size-limits.json: pending subpath "${name}" needs a note`);
    } else if (typeof entry.entry !== "string" || !Number.isInteger(entry.maxGzipBytes) || entry.maxGzipBytes <= 0) {
      throw new Error(`size-limits.json: subpath "${name}" needs an entry file and a positive integer maxGzipBytes, or pending: true`);
    }
  }
  const delta = data.delta;
  if (!isObject(delta) || !(delta.root in data.fixtures) || !(delta.direct in data.fixtures))
    throw new Error("size-limits.json: delta must name two existing fixtures as { root, direct }");
  return data;
}

/** Source file for a subpath derived from its exports.json "import" condition (same mapping as generate-exports.mjs hasSource). */
export function derivedSource(root, importFile) {
  const rel = importFile.replace(/^\.\/dist\//, "").replace(/\.js$/, "");
  const candidates = (base) => [`${base}.ts`, `${base}.tsx`].filter((file) => existsSync(join(root, file)));
  if (!rel.includes("*")) return candidates(`src/${rel}`)[0];
  const [head, tail] = rel.split("*");
  const dir = join(root, "src", head);
  if (!existsSync(dir)) return undefined;
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory()) continue;
    const found = candidates(`src/${head}${entry.name}${tail}`)[0];
    if (found) return found;
  }
  return undefined;
}

/** Problems that make the budgets file inconsistent with the repository (stale or missing entries). */
export function consistencyProblems(limits, root = defaultRoot) {
  const problems = [];
  const exportsConfig = JSON.parse(readFileSync(join(root, "config/exports.json"), "utf8"));
  const wanted = Object.keys(exportsConfig.subpaths).sort();
  const have = Object.keys(limits.subpaths).sort();
  for (const key of wanted) if (!have.includes(key)) problems.push(`config/exports.json subpath "${key}" has no budget entry`);
  for (const key of have) if (!wanted.includes(key)) problems.push(`budget entry "${key}" is not a subpath of config/exports.json`);
  for (const [key, entry] of Object.entries(limits.subpaths)) {
    if (!wanted.includes(key)) continue;
    if (key === "./package.json" || entry.metadata === true) {
      if (key !== "./package.json" || entry.metadata !== true) problems.push(`subpath "${key}": only "./package.json" is a metadata entry, and it must be {"metadata": true}`);
      continue;
    }
    const importFile = exportsConfig.subpaths[key]?.conditions?.import;
    if (typeof importFile !== "string") {
      problems.push(`subpath "${key}": config/exports.json has no conditions.import`);
      continue;
    }
    const source = derivedSource(root, importFile);
    if (entry.pending === true) {
      if (source !== undefined) problems.push(`subpath "${key}" is pending but its source ${source} exists; give it an entry file and a budget`);
      continue;
    }
    if (source === undefined) problems.push(`subpath "${key}" has an entry and budget but no source for ${importFile}; mark it pending`);
    if (!existsSync(join(root, entry.entry))) problems.push(`subpath "${key}": entry file ${entry.entry} does not exist`);
  }
  if (existsSync(join(root, ".size-limit.json"))) problems.push(".size-limit.json exists; budgets are read only from config/size-limits.json");
  return problems;
}

function metroReport(dir) {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) throw new Error(`--metro-export: not a directory: ${dir}`);
  const rows = [];
  const walk = (current) => {
    for (const name of readdirSync(current).sort()) {
      const full = join(current, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(js|hbc)$/.test(name)) rows.push({ file: full.slice(dir.length + 1), bytes: statSync(full).size, gzip: gzipSync(readFileSync(full), { level: 9 }).length });
    }
  };
  walk(dir);
  if (rows.length === 0) throw new Error(`--metro-export: no .js/.hbc bundles under ${dir}`);
  return rows;
}

const pad = (text, width) => String(text).padEnd(width);
const num = (n) => String(n).padStart(8);

export async function measure(limits, root = defaultRoot) {
  const rows = [];
  const sane = (out) => out.bytes > 0 && out.reached.some((file) => file.startsWith("src/"));
  for (const [name, fixture] of Object.entries(limits.fixtures)) {
    const out = await bundleFixture(fixture.source, { root });
    rows.push({ kind: "fixture", name, bytes: out.bytes, gzip: out.gzip, budget: fixture.maxGzipBytes, sane: sane(out) });
  }
  for (const [name, entry] of Object.entries(limits.subpaths)) {
    if (entry.metadata === true) rows.push({ kind: "subpath", name, state: "metadata" });
    else if (entry.pending === true) rows.push({ kind: "subpath", name, state: "pending" });
    else {
      const out = await bundleFixture(`export * from ${JSON.stringify(`./${entry.entry}`)};`, { root });
      rows.push({ kind: "subpath", name, bytes: out.bytes, gzip: out.gzip, budget: entry.maxGzipBytes, sane: sane(out) });
    }
  }
  return rows;
}

export function renderTable(rows, delta) {
  const lines = [`${pad("entry", 34)}${num("min")}${num("gzip")}${num("budget")}  status`];
  for (const row of rows) {
    const label = `${row.kind === "subpath" ? "subpath " : ""}${row.name}`;
    if (row.state === "pending") lines.push(`${pad(label, 34)}${num("-")}${num("-")}${num("-")}  pending (source not present yet)`);
    else if (row.state === "metadata") lines.push(`${pad(label, 34)}${num("-")}${num("-")}${num("-")}  metadata file (not bundled)`);
    else lines.push(`${pad(label, 34)}${num(row.bytes)}${num(row.gzip)}${num(row.budget)}  ${row.gzip <= row.budget ? "ok" : "OVER BUDGET"}`);
  }
  const byName = Object.fromEntries(rows.map((r) => [r.name, r]));
  const rootRow = byName[delta.root];
  const directRow = byName[delta.direct];
  if (!rootRow || !directRow) throw new Error(`delta fixtures "${delta.root}" / "${delta.direct}" are missing from the measured rows`);
  lines.push("", `root vs subpath delta: ${delta.root} ${rootRow.gzip} B gzip, ${delta.direct} ${directRow.gzip} B gzip, delta ${rootRow.gzip - directRow.gzip} B`);
  return lines.join("\n");
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const limits = loadLimits(opts.limits);
  const problems = consistencyProblems(limits, opts.root);
  const rows = await measure(limits, opts.root);
  for (const row of rows) {
    if (row.state !== undefined) continue;
    if (!row.sane) problems.push(`${row.name}: bundle is empty or contains no source file from src/ (fixture does not import the library)`);
    if (row.gzip > row.budget) problems.push(`${row.name}: ${row.gzip} B gzip exceeds budget ${row.budget} B`);
  }
  if (opts.json) console.log(JSON.stringify({ rows, problems }, null, 2));
  else console.log(renderTable(rows, limits.delta));
  if (opts.metroExport) {
    console.log("\nMetro export (report only, not checked):");
    for (const m of metroReport(opts.metroExport)) console.log(`${pad(m.file, 60)}${num(m.bytes)}${num(m.gzip)} gzip`);
  } else if (!opts.json) {
    console.log("\nMetro export comparison: not run (pass --metro-export <expo export dir>; report only).");
  }
  if (problems.length > 0) {
    for (const problem of problems) console.error(`${opts.check ? "FAIL" : "warning"}: ${problem}`);
    if (opts.check) process.exitCode = 1;
  } else if (opts.check) console.log("\nbundle-size: ok");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`bundle-size: ${error.message}`);
    process.exitCode = error instanceof UsageError ? 2 : 1;
  });
}
