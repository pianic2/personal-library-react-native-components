import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

// Template contract checker (PLRNUI-133). See templates/README.md for the contract.
// Usage: check-templates.mjs [--root <templates-dir>] [--package-json <file>]
// Exit 0 ok (an empty or missing-free templates dir passes), 1 contract violations, 2 usage/unreadable input.
// Dependency-free, deterministic (sorted traversal), fail-closed.

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_EXT = /\.(?:[cm]?[jt]sx?)$/;
const SKIP_DIRS = new Set(["node_modules", ".expo", "dist", "build"]);
const NAME_RE = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

function usage(message) {
  process.stderr.write(`check-templates: ${message}\n`);
  process.exit(2);
}

const args = process.argv.slice(2);
let root = join(REPO_ROOT, "templates");
let pkgFile = join(REPO_ROOT, "package.json");
for (let i = 0; i < args.length; i += 1) {
  const a = args[i];
  if (a === "--root" || a === "--package-json") {
    const v = args[i + 1];
    if (!v || v.startsWith("--")) usage(`${a} needs a value`);
    if (a === "--root") root = v;
    else pkgFile = v;
    i += 1;
  } else usage(`unknown argument ${a}`);
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    return { __error: error instanceof Error ? error.message : String(error) };
  }
}

function isDir(p) {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function isFile(p) {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
}

if (!isDir(root)) usage(`templates root not found: ${root}`);
if (!isFile(pkgFile)) usage(`package.json not found: ${pkgFile}`);
const libPkg = readJson(pkgFile);
if (libPkg.__error || typeof libPkg.name !== "string" || !libPkg.name) usage(`unreadable package name in ${pkgFile}`);
const LIB = libPkg.name;
const publicSubpaths = Object.keys(libPkg.exports ?? {})
  .filter((k) => k.startsWith("./") && k !== "./package.json")
  .map((k) => `${LIB}/${k.slice(2)}`);
const PUBLIC = new Set([LIB, ...publicSubpaths]);

const errors = [];
const fail = (where, message) => errors.push(`${where}: ${message}`);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(join(dir, entry.name), out);
    } else if (entry.isFile() && SOURCE_EXT.test(entry.name)) out.push(join(dir, entry.name));
  }
  return out;
}

const SPEC_RE = [
  /\b(?:import|export)\s[^'"`;]*?\bfrom\s*(['"])([^'"]+)\1/g,
  /\bimport\s*(['"])([^'"]+)\1/g,
  /\b(?:import|require)\s*\(\s*(['"])([^'"]+)\1\s*\)/g,
];

function checkSpecifiers(file, tplDir, label) {
  const text = readFileSync(file, "utf8");
  const specs = new Set();
  for (const re of SPEC_RE) for (const m of text.matchAll(re)) specs.add(m[2]);
  for (const spec of [...specs].sort()) {
    const where = `${label}/${relative(tplDir, file)}`;
    if (spec === LIB || spec.startsWith(`${LIB}/`)) {
      if (!PUBLIC.has(spec)) fail(where, `deep import "${spec}" is not a public entry point (allowed: ${[...PUBLIC].sort().join(", ")})`);
    } else if (spec.startsWith(".")) {
      const target = join(dirname(file), spec);
      const rel = relative(tplDir, target);
      if (rel.startsWith("..")) fail(where, `relative import "${spec}" escapes the template folder`);
    } else if (/(^|\/)(src|dist)(\/|$)/.test(spec)) {
      fail(where, `import "${spec}" reaches into library internals`);
    }
  }
}

const entries = readdirSync(root, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1));
let count = 0;
for (const entry of entries) {
  if (entry.name.startsWith("_") || entry.name.startsWith(".")) continue; // _contract and dotfiles are not templates
  const label = `templates/${entry.name}`;
  if (!entry.isDirectory()) {
    if (entry.name !== "README.md") fail(label, "unexpected file at templates root (only README.md, _*/ and template folders allowed)");
    continue;
  }
  count += 1;
  const dir = join(root, entry.name);
  if (!NAME_RE.test(entry.name)) fail(label, "folder name must be kebab-case (^[a-z][a-z0-9]*(-[a-z0-9]+)*$)");

  if (!isFile(join(dir, "README.md"))) fail(label, "missing README.md");
  else if (readFileSync(join(dir, "README.md"), "utf8").trim() === "") fail(label, "README.md is empty");

  if (!isDir(join(dir, "app"))) fail(label, "missing app/ directory");
  else if (walk(join(dir, "app")).length === 0) fail(label, "app/ contains no source files");

  if (!isFile(join(dir, "template.json"))) fail(label, "missing template.json");
  else {
    const t = readJson(join(dir, "template.json"));
    if (t.__error) fail(label, `template.json is not valid JSON (${t.__error})`);
    else {
      if (t.name !== entry.name) fail(label, `template.json "name" must equal the folder name "${entry.name}"`);
      for (const key of ["description", "version"]) {
        if (typeof t[key] !== "string" || t[key].trim() === "") fail(label, `template.json needs a non-empty string "${key}"`);
      }
      if (typeof t.version === "string" && !/^\d+\.\d+\.\d+$/.test(t.version)) fail(label, 'template.json "version" must be x.y.z');
    }
  }

  if (!isFile(join(dir, "package.json"))) fail(label, "missing package.json");
  else {
    const p = readJson(join(dir, "package.json"));
    if (p.__error) fail(label, `package.json is not valid JSON (${p.__error})`);
    else {
      if (typeof p.name !== "string" || p.name === "") fail(label, 'package.json needs a "name"');
      const deps = { ...p.dependencies, ...p.peerDependencies };
      if (typeof deps[LIB] !== "string") fail(label, `package.json must depend on ${LIB}`);
      if (p.dependencies && typeof p.dependencies[LIB] === "string" && /^(file|link|portal|workspace):/.test(p.dependencies[LIB])) {
        fail(label, `dependency on ${LIB} must be a published version range, not a local path`);
      }
    }
  }

  if (isDir(dir)) for (const file of walk(dir)) checkSpecifiers(file, dir, label);
}

if (errors.length) {
  for (const e of errors) process.stderr.write(`FAIL ${e}\n`);
  process.stderr.write(`check-templates: ${errors.length} violation(s) in ${count} template(s)\n`);
  process.exit(1);
}
process.stdout.write(`check-templates: ok (${count} template(s))\n`);
