#!/usr/bin/env node
// Generates the package.json fields derived from config/exports.json (ADR 0009, PLRNUI-196):
// exports, typesVersions, sideEffects, main, module, types. No other field is rewritten.
// A subpath is emitted only when its source entry exists (./theme -> src/theme/index.ts), so package.json never
// points at files that no build can produce; adding a source entry makes --check fail until the script is re-run.
// Dependency-free and fail-closed: exit 0 ok, 1 drift or missing build output, 2 usage/unreadable input.
// Usage: node scripts/generate-exports.mjs [--check] [--verify-dist] [--root <dir>]
//   (default)      rewrite package.json
//   --check        exit 1 when package.json differs from the generated fields
//   --verify-dist  also require every export target (and .d.ts) to exist under <root> (run after npm run build)
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const CONDITIONS = ["types", "react-native", "import", "default"];

class UsageError extends Error {}

function parseArgs(argv) {
  const opts = { check: false, verifyDist: false, root: resolve(dirname(fileURLToPath(import.meta.url)), "..") };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--check") opts.check = true;
    else if (arg === "--verify-dist") opts.verifyDist = true;
    else if (arg === "--root" && typeof argv[i + 1] === "string") opts.root = resolve(argv[(i += 1)]);
    else throw new UsageError(`unknown or incomplete argument: ${arg}`);
  }
  return opts;
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    throw new UsageError(`cannot read ${file}: ${error.message}`);
  }
}

// ./dist/theme/index.js -> src/theme/index.ts ; ./dist/adapters/*/index.js -> a src/adapters/<x>/index.ts for some <x>.
function hasSource(root, distFile) {
  const rel = distFile.replace(/^\.\/dist\//, "").replace(/\.js$/, "");
  if (!rel.includes("*")) return existsSync(join(root, "src", `${rel}.ts`)) || existsSync(join(root, "src", `${rel}.tsx`));
  const [head, tail] = rel.split("*");
  const dir = join(root, "src", head);
  if (!existsSync(dir)) return false;
  return readdirSync(dir, { withFileTypes: true }).some(
    (entry) => entry.isDirectory() && (existsSync(join(dir, entry.name, `${tail.replace(/^\//, "")}.ts`)) || existsSync(join(dir, entry.name, `${tail.replace(/^\//, "")}.tsx`)))
  );
}

export function generate(config, root) {
  const exportsMap = {};
  const typesVersions = {};
  const skipped = [];
  if (typeof config.subpaths !== "object" || config.subpaths === null) throw new UsageError("config/exports.json must define subpaths");
  const subpaths = config.subpaths;
  for (const [key, entry] of Object.entries(subpaths)) {
    if (key === "./package.json") {
      exportsMap[key] = "./package.json";
      continue;
    }
    const conditions = entry?.conditions;
    if (!conditions || CONDITIONS.some((name) => typeof conditions[name] !== "string")) {
      throw new UsageError(`${key}: conditions must define ${CONDITIONS.join(", ")}`);
    }
    if (!hasSource(root, conditions.import)) {
      skipped.push(key);
      continue;
    }
    exportsMap[key] = Object.fromEntries(CONDITIONS.map((name) => [name, conditions[name]]));
    if (key !== ".") typesVersions[key.replace(/^\.\//, "")] = [conditions.types.replace(/^\.\//, "")];
  }
  const root_ = subpaths["."]?.conditions;
  if (!root_ || !exportsMap["."]) throw new UsageError("config must define an active '.' subpath");
  const sideEffects = Object.values(subpaths).every((e) => e?.sideEffects === undefined || e.sideEffects === false) ? false : null;
  if (sideEffects !== false) throw new UsageError("every subpath must declare sideEffects:false; list files explicitly before changing this");
  return {
    skipped,
    fields: {
      main: root_.import,
      module: root_.import,
      types: root_.types,
      exports: exportsMap,
      typesVersions: { "*": typesVersions },
      sideEffects,
    },
  };
}

// Replaces the generated fields in place (keeping the key order of package.json) and appends the missing ones after "types".
function apply(pkg, fields) {
  const out = {};
  const pending = Object.keys(fields).filter((k) => !(k in pkg));
  for (const [key, value] of Object.entries(pkg)) {
    out[key] = key in fields ? fields[key] : value;
    if (key === "types") for (const extra of pending) out[extra] = fields[extra];
  }
  for (const extra of pending) if (!(extra in out)) out[extra] = fields[extra];
  return out;
}

function targets(fields) {
  const files = new Set([fields.main, fields.module, fields.types]);
  for (const value of Object.values(fields.exports)) {
    if (typeof value === "string") files.add(value);
    else for (const file of Object.values(value)) files.add(file);
  }
  return [...files];
}

function verifyDist(root, fields) {
  const missing = [];
  for (const file of targets(fields)) {
    if (file === "./package.json") continue;
    if (file.includes("*")) {
      const [head, tail] = file.slice(2).split("*");
      const dir = join(root, head);
      const found = existsSync(dir) && readdirSync(dir, { withFileTypes: true }).some((e) => e.isDirectory() && existsSync(join(dir, e.name, tail)));
      if (!found) missing.push(file);
    } else if (!existsSync(join(root, file))) missing.push(file);
  }
  return missing;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const config = readJson(join(opts.root, "config", "exports.json"));
  const pkgPath = join(opts.root, "package.json");
  const pkg = readJson(pkgPath);
  const { fields, skipped } = generate(config, opts.root);
  const next = apply(pkg, fields);
  const rendered = `${JSON.stringify(next, null, 2)}\n`;
  const current = readFileSync(pkgPath, "utf8");
  let code = 0;
  if (opts.check) {
    if (rendered !== current) {
      const drift = Object.keys(fields).filter((key) => JSON.stringify(pkg[key]) !== JSON.stringify(fields[key]));
      console.error(`package.json is out of date with config/exports.json (fields: ${drift.join(", ") || "formatting"}); run node scripts/generate-exports.mjs`);
      code = 1;
    }
  } else if (rendered !== current) {
    writeFileSync(pkgPath, rendered);
    console.log("package.json updated");
  }
  if (opts.verifyDist) {
    const missing = verifyDist(opts.root, fields);
    if (missing.length > 0) {
      console.error(`export targets missing after build:\n${missing.map((f) => `- ${f}`).join("\n")}`);
      code = 1;
    }
  }
  if (code === 0) console.log(`exports ok: ${Object.keys(fields.exports).length} entries${skipped.length ? `; not emitted (no source yet): ${skipped.join(", ")}` : ""}`);
  return code;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(error instanceof UsageError ? error.message : `unexpected error: ${error.stack ?? error}`);
    process.exitCode = 2;
  }
}
