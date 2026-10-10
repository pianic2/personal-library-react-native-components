import { lstatSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

// Template contract checker (PLRNUI-133). See templates/README.md for the contract.
// Usage: check-templates.mjs [--root <templates-dir>] [--package-json <file>]
// Exit 0 ok (an empty or missing-free templates dir passes), 1 contract violations, 2 usage/unreadable input.
// Dependency-free, deterministic (sorted traversal), fail-closed.

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
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

const SOURCE_EXT = /\.(?:[cm]?[jt]sx?|mdx)$/;
const FORBIDDEN_DIRS = new Set(["node_modules", ".expo", "dist", "build"]);

// Lists source files of a template; fails on symlinks and on build/dependency dirs (fail-closed, nothing is skipped silently).
function walk(dir, label, tplDir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const full = join(dir, entry.name);
    const where = `${label}/${relative(tplDir, full).split(sep).join("/")}`;
    if (lstatSync(full).isSymbolicLink()) fail(where, "symlinks are not allowed inside a template");
    else if (entry.isDirectory()) {
      if (FORBIDDEN_DIRS.has(entry.name)) fail(where, `directory "${entry.name}" must not be present in a template`);
      else walk(full, label, tplDir, out);
    } else if (entry.isFile() && SOURCE_EXT.test(entry.name)) out.push(full);
  }
  return out;
}

// Replaces comments with a space while respecting string and template literals.
function stripComments(text) {
  let out = "";
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    const n = text[i + 1];
    if (c === "/" && n === "/") {
      while (i < text.length && text[i] !== "\n") i += 1;
      out += " ";
    } else if (c === "/" && n === "*") {
      const end = text.indexOf("*/", i + 2);
      i = end === -1 ? text.length : end + 2;
      out += " ";
    } else if (c === "'" || c === '"' || c === "`") {
      let j = i + 1;
      while (j < text.length && text[j] !== c) j += text[j] === "\\" ? 2 : 1;
      out += text.slice(i, j + 1);
      i = j + 1;
    } else {
      out += c;
      i += 1;
    }
  }
  return out;
}

const STATIC_RE = [
  /\b(?:import|export)\b[^'"`;]*?\bfrom\s*(['"`])([^'"`]*)\1/g,
  /\bimport\s*(['"`])([^'"`]*)\1/g,
];
const CALL_RE =
  /\b(?:import|require(?:\.resolve)?|jest\.(?:requireActual|requireMock|mock|doMock|unmock|dontMock|setMock|createMockFromModule)|vi\.(?:mock|doMock|importActual|importMock))\s*\(\s*(?:(['"`])([^'"`]*)\1\s*[,)]|([^\s]))/g;

function checkSpecifier(spec, file, tplDir, where) {
  const norm = spec.replace(/\\/g, "/");
  if (norm.startsWith("/") || /^[A-Za-z]:\//.test(norm) || /^file:/i.test(norm)) {
    fail(where, `absolute import "${spec}" is not allowed`);
  } else if (norm.startsWith(".")) {
    const rel = relative(tplDir, join(dirname(file), norm)).split(sep).join("/");
    if (rel === ".." || rel.startsWith("../")) fail(where, `relative import "${spec}" escapes the template folder`);
  } else if (norm === LIB || norm.startsWith(`${LIB}/`)) {
    if (!PUBLIC.has(norm)) fail(where, `deep import "${spec}" is not a public entry point (allowed: ${[...PUBLIC].sort().join(", ")})`);
  } else if (/(^|\/)(src|dist)(\/|$)/.test(norm)) {
    fail(where, `import "${spec}" reaches into library internals`);
  }
}

function checkSpecifiers(file, tplDir, label) {
  const text = stripComments(readFileSync(file, "utf8"));
  const where = `${label}/${relative(tplDir, file).split(sep).join("/")}`;
  const specs = new Set();
  for (const re of STATIC_RE) for (const m of text.matchAll(re)) specs.add(m[2]);
  for (const m of text.matchAll(CALL_RE)) {
    if (m[2] === undefined || m[2].includes("${")) fail(where, "dynamic import/require specifier cannot be verified");
    else specs.add(m[2]);
  }
  for (const spec of [...specs].sort()) checkSpecifier(spec, file, tplDir, where);
}

const COMPARATOR = /^(?:[\^~]|>=?|<=?|=)?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
function isSemverRange(value) {
  if (typeof value !== "string") return false;
  const sets = value.split("||").map((s) => s.trim());
  return sets.every((set) => set !== "" && set.split(/\s+/).every((c) => COMPARATOR.test(c)));
}

function checkLibraryVersions(label, p) {
  const sections = ["dependencies", "peerDependencies", "devDependencies", "optionalDependencies"];
  for (const section of sections) {
    const deps = p[section];
    if (deps === undefined) continue;
    if (typeof deps !== "object" || deps === null || Array.isArray(deps)) {
      fail(label, `package.json "${section}" must be an object`);
      continue;
    }
    for (const [key, value] of Object.entries(deps)) {
      if (key === LIB) {
        if (!isSemverRange(value)) fail(label, `${section}["${LIB}"] must be a semver range, got ${JSON.stringify(value)}`);
      } else if (typeof value === "string" && value.includes(LIB)) {
        fail(label, `${section}["${key}"] aliases ${LIB}; only a semver range under the real name is allowed`);
      }
    }
  }
  const visit = (node, where) => {
    if (typeof node !== "object" || node === null) return;
    for (const [key, value] of Object.entries(node)) {
      const isLib = key === LIB || key.endsWith(`>${LIB}`) || key.endsWith(`/${LIB}`);
      if (isLib && typeof value === "string" && !isSemverRange(value)) fail(label, `${where}["${key}"] must be a semver range, got ${JSON.stringify(value)}`);
      else if (typeof value === "string" && !isLib && value.includes(LIB)) fail(label, `${where}["${key}"] aliases ${LIB}`);
      else if (typeof value === "object" && value !== null) {
        if (isLib && typeof value["."] === "string" && !isSemverRange(value["."])) fail(label, `${where}["${key}"]["."] must be a semver range`);
        visit(value, `${where}["${key}"]`);
      }
    }
  };
  for (const field of ["overrides", "resolutions"]) visit(p[field], field);
  visit(p.pnpm, "pnpm");
}

const entries = readdirSync(root, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1));
let count = 0;
for (const entry of entries) {
  if (entry.name.startsWith("_") || entry.name.startsWith(".")) continue; // _contract and dotfiles are not templates
  const label = `templates/${entry.name}`;
  if (lstatSync(join(root, entry.name)).isSymbolicLink()) {
    fail(label, "symlinks are not allowed in the templates folder");
    continue;
  }
  if (!entry.isDirectory()) {
    if (entry.name !== "README.md") fail(label, "unexpected file at templates root (only README.md, _*/ and template folders allowed)");
    continue;
  }
  count += 1;
  const dir = join(root, entry.name);
  if (!NAME_RE.test(entry.name)) fail(label, "folder name must be kebab-case (^[a-z][a-z0-9]*(-[a-z0-9]+)*$)");

  // Walk first so symlinks and forbidden dirs are always reported.
  const sources = walk(dir, label, dir);

  if (!isFile(join(dir, "README.md"))) fail(label, "missing README.md");
  else if (readFileSync(join(dir, "README.md"), "utf8").trim() === "") fail(label, "README.md is empty");

  if (!isDir(join(dir, "app"))) fail(label, "missing app/ directory");
  else if (!sources.some((f) => f.startsWith(join(dir, "app") + sep))) {
    fail(label, "app/ contains no source files");
  }

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
      checkLibraryVersions(label, p);
    }
  }

  for (const file of sources) checkSpecifiers(file, dir, label);
}

if (errors.length) {
  for (const e of errors) process.stderr.write(`FAIL ${e}\n`);
  process.stderr.write(`check-templates: ${errors.length} violation(s) in ${count} template(s)\n`);
  process.exit(1);
}
process.stdout.write(`check-templates: ok (${count} template(s))\n`);
