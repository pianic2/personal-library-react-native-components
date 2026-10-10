#!/usr/bin/env node
// Generates the legacy shim package into dist-shim/ (PLRNUI-136, ADR 0013): a package that only re-exports the target.
//   node scripts/build-shim.mjs [--out dist-shim] [--target-tarball <tgz>] [--legacy-name <n>] [--target-name <n>]
//                               [--target-version <v>] [--adapters a,b] [--check]
// Names come from config/package-identity.json (target = current, legacy = legacy). While the identity has no legacy
// name the run is "preparatory": the legacy name is a placeholder and the target is the current package (use
// --target-tarball with the packed current package to take its version and adapters).
// --check builds twice into temporary directories, compares the sha256 of every file, and asserts the invariants:
//   generated JS/d.ts contain only export-from statements, package.json has exactly one dependency (^<major>.0.0, D10),
//   no scripts, the exports map mirrors config/exports.json, at most 2*N+3 files, no src/skills/ai/llms files.
// Exit codes: 0 ok, 1 an invariant failed, 2 usage or unreadable input.
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { readIdentity } from "./lib/identity.mjs";
import { renderPackageJson, renderReadme, renderReExport } from "./lib/shim-template.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PLACEHOLDER_LEGACY = "@legacy-placeholder/shim";
const NAME = /^(?:@[a-z0-9~-][a-z0-9._~-]*\/)?[a-z0-9~-][a-z0-9._~-]*$/;
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const FORBIDDEN_PATHS = /(^|\/)(src|skills|ai)(\/|$)|(^|\/)llms[^/]*\.txt$/;

class UsageError extends Error {}

function parseArgs(argv) {
  const opts = { out: "dist-shim", check: false };
  const flags = { "--out": "out", "--target-tarball": "tarball", "--legacy-name": "legacy", "--target-name": "target", "--target-version": "version", "--adapters": "adapters" };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--check") { opts.check = true; continue; }
    const key = flags[argv[i]];
    const value = argv[i + 1];
    if (!key || value === undefined || value.startsWith("--")) throw new UsageError(`unknown or incomplete argument: ${argv[i]}`);
    opts[key] = value;
    i++;
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

function tarball(file) {
  const path = resolve(process.cwd(), file);
  if (!existsSync(path)) throw new UsageError(`tarball not found: ${file}`);
  const read = spawnSync("tar", ["-xzOf", path, "package/package.json"], { encoding: "utf8" });
  if (read.status !== 0) throw new UsageError(`cannot read package.json from ${file}: ${read.stderr.trim() || "tar failed"}`);
  const list = spawnSync("tar", ["-tzf", path], { encoding: "utf8" });
  if (list.status !== 0) throw new UsageError(`cannot list ${file}`);
  const pkg = JSON.parse(read.stdout);
  const adapters = [...new Set(list.stdout.split("\n").map((l) => /^package\/dist\/adapters\/([^/]+)\/index\.js$/.exec(l)?.[1]).filter(Boolean))].sort();
  return { name: pkg.name, version: pkg.version, adapters };
}

function resolveInputs(opts) {
  const identity = readIdentity();
  const exportsConfig = readJson(join(root, "config/exports.json"));
  const repoPkg = readJson(join(root, "package.json"));
  const fromTarball = opts.tarball ? tarball(opts.tarball) : undefined;
  const target = opts.target ?? fromTarball?.name ?? identity.current;
  const legacy = opts.legacy ?? identity.legacy ?? PLACEHOLDER_LEGACY;
  const version = opts.version ?? fromTarball?.version ?? repoPkg.version;
  const adapters = opts.adapters !== undefined ? opts.adapters.split(",").filter(Boolean) : (fromTarball?.adapters ?? []);
  for (const [label, value] of [["target name", target], ["legacy name", legacy]]) if (!NAME.test(value)) throw new UsageError(`invalid ${label}: ${value}`);
  if (target === legacy) throw new UsageError("legacy and target names must differ");
  if (!SEMVER.test(version)) throw new UsageError(`invalid version: ${version}`);
  for (const adapter of adapters) if (!/^[a-z0-9][a-z0-9-]*$/.test(adapter)) throw new UsageError(`invalid adapter name: ${adapter}`);
  if (exportsConfig.schemaVersion !== 1 || typeof exportsConfig.subpaths !== "object") throw new UsageError("config/exports.json is not a valid export contract");

  const subpaths = [];
  for (const key of Object.keys(exportsConfig.subpaths)) {
    if (key === "./package.json") continue;
    if (key === ".") subpaths.push({ key, file: "index", specifier: target });
    else if (key.endsWith("/*")) {
      const base = key.slice(2, -2);
      for (const adapter of adapters) subpaths.push({ key: `./${base}/${adapter}`, file: `${base}/${adapter}/index`, specifier: `${target}/${base}/${adapter}` });
    } else subpaths.push({ key, file: `${key.slice(2)}/index`, specifier: `${target}${key.slice(1)}` });
  }
  return { target, legacy, version, subpaths, preparatory: identity.legacy === null && opts.legacy === undefined, repository: repoPkg.repository, license: repoPkg.license };
}

function write(file, content) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

export function build(out, inputs) {
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  write(join(out, "package.json"), renderPackageJson(inputs));
  write(join(out, "README.md"), renderReadme(inputs));
  copyFileSync(join(root, "LICENSE"), join(out, "LICENSE"));
  for (const subpath of inputs.subpaths) {
    const text = renderReExport(subpath.specifier);
    write(join(out, "dist", `${subpath.file}.js`), text);
    write(join(out, "dist", `${subpath.file}.d.ts`), text);
  }
}

function files(dir, base = dir) {
  const found = [];
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) found.push(...files(full, base));
    else found.push(relative(base, full).split("\\").join("/"));
  }
  return found;
}

function hashes(dir) {
  return Object.fromEntries(files(dir).map((f) => [f, createHash("sha256").update(readFileSync(join(dir, f))).digest("hex")]));
}

function onlyExportFrom(file, text) {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  if ((source.parseDiagnostics ?? []).length > 0) return `${file}: syntax error`;
  if (source.statements.length === 0) return `${file}: empty`;
  for (const statement of source.statements) {
    if (!(ts.isExportDeclaration(statement) && statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier))) return `${file}: contains something other than export-from (${ts.SyntaxKind[statement.kind]})`;
  }
  return undefined;
}

export function verify(dir, inputs) {
  const problems = [];
  const all = files(dir);
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  const major = inputs.version.split(".")[0];
  if (pkg.name !== inputs.legacy) problems.push(`package name must be ${inputs.legacy}`);
  if (pkg.version !== inputs.version) problems.push("shim version must equal the target version (lockstep)");
  const deps = Object.keys(pkg.dependencies ?? {});
  if (deps.length !== 1 || deps[0] !== inputs.target || pkg.dependencies[inputs.target] !== `^${major}.0.0`) problems.push(`dependencies must be exactly { ${inputs.target}: ^${major}.0.0 }`);
  if (pkg.scripts && Object.keys(pkg.scripts).length > 0) problems.push("scripts are not allowed");
  for (const field of ["peerDependencies", "optionalDependencies", "bundledDependencies", "bundleDependencies"]) if (field in pkg) problems.push(`${field} is not allowed`);
  const exportKeys = Object.keys(pkg.exports ?? {});
  const expectedKeys = [...inputs.subpaths.map((s) => s.key), "./package.json"];
  if (JSON.stringify(exportKeys) !== JSON.stringify(expectedKeys)) problems.push(`exports must mirror config/exports.json: expected ${expectedKeys.join(", ")}; found ${exportKeys.join(", ")}`);
  for (const subpath of inputs.subpaths) {
    const entry = pkg.exports?.[subpath.key];
    const js = `./dist/${subpath.file}.js`;
    if (!entry || entry["react-native"] !== js || entry.import !== js || entry.default !== js || entry.types !== `./dist/${subpath.file}.d.ts`) problems.push(`exports ${subpath.key} has the wrong conditions`);
  }
  for (const file of all) {
    if (FORBIDDEN_PATHS.test(file)) problems.push(`forbidden file in the shim: ${file}`);
    if (file.startsWith("dist/")) {
      const problem = onlyExportFrom(file, readFileSync(join(dir, file), "utf8"));
      if (problem) problems.push(problem);
    }
  }
  const limit = 2 * inputs.subpaths.length + 3;
  if (all.length > limit) problems.push(`${all.length} files exceed the limit of ${limit} (2*N+3)`);
  return problems;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const inputs = resolveInputs(opts);
  if (inputs.preparatory) console.log(`preparatory run: legacy name is the placeholder ${inputs.legacy}`);
  if (!opts.check) {
    const out = resolve(process.cwd(), opts.out);
    build(out, inputs);
    const problems = verify(out, inputs);
    for (const problem of problems) console.error(`build-shim: ${problem}`);
    console.log(`build-shim: ${files(out).length} file(s) written to ${relative(process.cwd(), out) || "."}, ${problems.length} problem(s)`);
    return problems.length > 0 ? 1 : 0;
  }
  const temp = mkdtempSync(join(tmpdir(), "build-shim-"));
  try {
    const a = join(temp, "a");
    const b = join(temp, "b");
    build(a, inputs);
    build(b, inputs);
    const problems = verify(a, inputs);
    const first = hashes(a);
    const second = hashes(b);
    if (JSON.stringify(first) !== JSON.stringify(second)) problems.push("two builds produced different files (not deterministic)");
    for (const problem of problems) console.error(`build-shim: ${problem}`);
    console.log(`build-shim --check: ${Object.keys(first).length} file(s), ${inputs.subpaths.length} subpath(s), ${problems.length} problem(s)`);
    return problems.length > 0 ? 1 : 0;
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(`build-shim: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
  }
}
