import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

// License audit (PLRNUI-153): every package in package-lock.json and every vendored asset must carry an allowed license.
// Usage: license-check.mjs [--lockfile <file>] [--node-modules <dir>] [--assets <file>] [--notice <file>] [--self-test]
// Exit 0 ok, 1 license violations, 2 usage / unreadable or malformed input. Dependency-free and deterministic.
// Policy: docs/policies/licensing.md.

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// SPDX identifiers allowed for packages.
const ALLOWED = new Set(["MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC", "0BSD", "CC0-1.0", "BlueOak-1.0.0", "CC-BY-4.0"]);
// Vendored assets (fonts, icons) additionally allow the SIL Open Font License.
const ALLOWED_ASSET = new Set([...ALLOWED, "OFL-1.1"]);

// Packages whose license field is absent from the lockfile AND whose files are not installed.
// Each entry needs a reason. A prefix ending in "/" is a scope (every package below it); any other prefix is one
// package (exact key, or a path below it), so "node_modules/fsevents" does not cover "node_modules/fsevents-evil".
const EXCEPTIONS = [
  {
    prefix: "node_modules/@esbuild/",
    license: "MIT",
    reason: "esbuild platform binaries (optional, only the host platform is installed); published by the esbuild project, which is MIT",
  },
  {
    prefix: "node_modules/fsevents",
    license: "MIT",
    reason: "optional macOS-only file watcher; MIT; not installed on other platforms",
  },
];

class UsageError extends Error {}

function exceptionMatches(key, prefix) {
  return prefix.endsWith("/") ? key.startsWith(prefix) : key === prefix || key.startsWith(`${prefix}/`);
}

/** Evaluate an SPDX expression (AND binds tighter than OR). Unknown ids, WITH and syntax errors are not allowed. */
function spdxAllowed(expression, allowed) {
  const tokens = expression.match(/\(|\)|[^\s()]+/g);
  if (!tokens) return false;
  let pos = 0;
  const parseOr = () => {
    let result = parseAnd();
    while (tokens[pos] === "OR") {
      pos += 1;
      const rhs = parseAnd();
      result = result || rhs;
    }
    return result;
  };
  const parseAnd = () => {
    let result = parseTerm();
    while (tokens[pos] === "AND") {
      pos += 1;
      const rhs = parseTerm();
      result = result && rhs;
    }
    return result;
  };
  const parseTerm = () => {
    const token = tokens[pos];
    if (token === undefined || token === ")" || token === "AND" || token === "OR" || token === "WITH") throw new UsageError(`bad SPDX expression: ${expression}`);
    pos += 1;
    if (token === "(") {
      const inner = parseOr();
      if (tokens[pos] !== ")") throw new UsageError(`bad SPDX expression: ${expression}`);
      pos += 1;
      return inner;
    }
    if (tokens[pos] === "WITH") {
      pos += 2;
      return false; // license exceptions are not auto-approved
    }
    return allowed.has(token);
  };
  const value = parseOr();
  if (pos !== tokens.length) throw new UsageError(`bad SPDX expression: ${expression}`);
  return value;
}

/** license field as written in a lockfile / package.json: string, {type}, or legacy array. */
function normalizeLicense(value) {
  if (typeof value === "string" && value.trim() !== "") return value.trim();
  if (value && typeof value === "object" && !Array.isArray(value) && typeof value.type === "string") return value.type.trim();
  if (Array.isArray(value) && value.length > 0 && value.every((entry) => typeof entry?.type === "string")) {
    return value.map((entry) => entry.type.trim()).join(" OR ");
  }
  return null;
}

function readJson(path, what) {
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch (error) {
    throw new UsageError(`cannot read ${what} ${path}: ${error.message}`);
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new UsageError(`${what} ${path} is not valid JSON: ${error.message}`);
  }
}

function validateExceptions(exceptions) {
  for (const entry of exceptions) {
    for (const key of ["prefix", "license", "reason"]) {
      if (typeof entry?.[key] !== "string" || entry[key].trim() === "") throw new UsageError(`exception needs a non-empty "${key}" (every exception requires a reason)`);
    }
  }
}

/** Audit the packages of a lockfile. Returns violations and the number of packages checked. */
function auditPackages(lockfile, nodeModulesDir, exceptions = EXCEPTIONS) {
  validateExceptions(exceptions);
  if (!lockfile || typeof lockfile !== "object" || typeof lockfile.packages !== "object" || lockfile.packages === null) {
    throw new UsageError('lockfile must be an npm lockfile (v2/v3) with a "packages" object');
  }
  if (![2, 3].includes(lockfile.lockfileVersion)) throw new UsageError(`unsupported lockfileVersion: ${lockfile.lockfileVersion}`);
  const violations = [];
  let checked = 0;
  for (const [key, entry] of Object.entries(lockfile.packages).sort(([a], [b]) => (a < b ? -1 : 1))) {
    if (key === "" || entry?.link) continue;
    checked += 1;
    let license = normalizeLicense(entry?.license);
    let installed = false;
    if (nodeModulesDir) {
      // Installed copy: key "node_modules/a/node_modules/b" lives at <dir>/a/node_modules/b. The path must stay inside <dir>.
      const base = resolve(nodeModulesDir);
      const file = resolve(base, key.replace(/^node_modules\//, ""), "package.json");
      if (!key.startsWith("node_modules/") || !file.startsWith(base + sep)) {
        violations.push(`${key}: unexpected package path`);
        continue;
      }
      if (existsSync(file)) {
        installed = true;
        if (license === null) license = normalizeLicense(readJson(file, "installed package.json").license);
      }
    }
    if (license === null) {
      const exception = installed ? undefined : exceptions.find((candidate) => exceptionMatches(key, candidate.prefix));
      if (exception) {
        if (!ALLOWED.has(exception.license)) throw new UsageError(`exception for ${exception.prefix} names a license that is not allowed: ${exception.license}`);
        continue;
      }
      violations.push(`${key}: no license information`);
      continue;
    }
    let ok;
    try {
      ok = spdxAllowed(license, ALLOWED);
    } catch (error) {
      violations.push(`${key}: ${license} (${error.message})`);
      continue;
    }
    if (!ok) violations.push(`${key}: ${license}`);
  }
  if (checked === 0) throw new UsageError("lockfile lists no packages to check");
  return { violations, checked };
}

/** True when NOTICE mentions the path as a whole token (not as part of a longer path or name). */
function mentionsPath(text, path) {
  const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[\\s\`'"(\\[<])${escaped}($|[\\s\`'",.;:)\\]>])`, "m").test(text);
}

/** Audit vendored assets (fonts, icons) and make sure NOTICE mentions each one. */
function auditAssets(assets, noticeText) {
  if (!Array.isArray(assets)) throw new UsageError("assets file must be a JSON array");
  const violations = [];
  assets.forEach((asset, index) => {
    for (const key of ["path", "license", "source"]) {
      if (typeof asset?.[key] !== "string" || asset[key].trim() === "") throw new UsageError(`asset ${index} needs a non-empty string "${key}"`);
    }
    let ok;
    try {
      ok = spdxAllowed(asset.license, ALLOWED_ASSET);
    } catch (error) {
      throw new UsageError(`asset ${asset.path}: ${error.message}`);
    }
    if (!ok) violations.push(`asset ${asset.path}: ${asset.license}`);
    if (!mentionsPath(noticeText, asset.path)) violations.push(`asset ${asset.path}: not listed in NOTICE`);
  });
  return violations;
}

function selfTest() {
  const lock = (packages) => ({ lockfileVersion: 3, packages: { "": { name: "root" }, ...packages } });
  const failures = [];
  let count = 0;
  const expect = (name, condition) => {
    count += 1;
    if (!condition) failures.push(name);
  };
  const run = (packages, exceptions, dir = null) => auditPackages(lock(packages), dir, exceptions).violations;
  const throws = (fn) => {
    try {
      fn();
      return false;
    } catch (error) {
      return error instanceof UsageError;
    }
  };
  expect("MIT passes", run({ "node_modules/a": { license: "MIT" } }).length === 0);
  expect("GPL-3.0-only fails", run({ "node_modules/a": { license: "GPL-3.0-only" } }).length === 1);
  expect("AGPL fails", run({ "node_modules/a": { license: "AGPL-3.0-or-later" } }).length === 1);
  expect("MIT OR GPL passes (choice)", run({ "node_modules/a": { license: "(MIT OR GPL-3.0-only)" } }).length === 0);
  expect("MIT AND GPL fails", run({ "node_modules/a": { license: "(MIT AND GPL-3.0-only)" } }).length === 1);
  expect("AND binds tighter than OR", run({ "node_modules/a": { license: "GPL-3.0-only AND MIT OR MIT" } }).length === 0);
  expect("WITH exception is not auto-approved", run({ "node_modules/a": { license: "GPL-2.0-only WITH Classpath-exception-2.0" } }).length === 1);
  for (const bad of ["(MIT", "MIT)", "MIT OR", "MIT or GPL-3.0-only", "", "MIT AND OR MIT", "UNLICENSED", "SEE LICENSE IN LICENSE.md", "mit"]) {
    expect(`bad expression fails closed: ${JSON.stringify(bad)}`, run({ "node_modules/a": { license: bad } }).length === 1);
  }
  expect("numeric license fails", run({ "node_modules/a": { license: 7 } }).length === 1);
  expect("missing license fails", run({ "node_modules/a": {} }).length === 1);
  expect("legacy {type} license", run({ "node_modules/a": { license: { type: "ISC" } } }).length === 0);
  const scope = [{ prefix: "node_modules/@x/", license: "MIT", reason: "test scope" }];
  const single = [{ prefix: "node_modules/fsev", license: "MIT", reason: "test package" }];
  expect("scope exception covers a missing license", run({ "node_modules/@x/y": {} }, scope).length === 0);
  expect("package exception does not cover a longer name", run({ "node_modules/fsevents": {} }, single).length === 1);
  expect("package exception covers its exact key", run({ "node_modules/fsev": {} }, single).length === 0);
  expect("exception without reason is rejected", throws(() => run({ "node_modules/a": { license: "MIT" } }, [{ prefix: "node_modules/@x/", license: "MIT", reason: " " }])));
  expect("exception naming a disallowed license is rejected", throws(() => run({ "node_modules/@x/y": {} }, [{ prefix: "node_modules/@x/", license: "GPL-3.0-only", reason: "test" }])));
  expect("lockfile without packages is rejected", throws(() => auditPackages({ lockfileVersion: 3, packages: { "": {} } }, null)));
  expect("unknown lockfileVersion is rejected", throws(() => auditPackages({ lockfileVersion: 1, packages: { "node_modules/a": { license: "MIT" } } }, null)));
  expect("GPL asset fails", auditAssets([{ path: "assets/f.ttf", license: "GPL-3.0-only", source: "x" }], "assets/f.ttf").length === 1);
  expect("OFL asset passes when listed in NOTICE", auditAssets([{ path: "assets/f.ttf", license: "OFL-1.1", source: "x" }], "- assets/f.ttf (SIL OFL)").length === 0);
  expect("asset missing from NOTICE fails", auditAssets([{ path: "assets/f.ttf", license: "OFL-1.1", source: "x" }], "nothing").length === 1);
  expect("asset path must match as a whole token", auditAssets([{ path: "a.ttf", license: "OFL-1.1", source: "x" }], "assets/data.ttf").length === 1);

  // Installed-tree behavior and process-level exit codes, in a temporary directory.
  const dir = mkdtempSync(join(tmpdir(), "license-check-"));
  try {
    const nm = join(dir, "node_modules");
    mkdirSync(join(nm, "installed"), { recursive: true });
    writeFileSync(join(nm, "installed", "package.json"), JSON.stringify({ license: "GPL-3.0-only" }));
    expect("installed license is used when the lockfile has none", run({ "node_modules/installed": {} }, scope, nm).length === 1);
    expect("an exception never covers an installed package", run({ "node_modules/@x/y": {} }, scope, nm).length === 0 && (mkdirSync(join(nm, "@x", "y"), { recursive: true }), writeFileSync(join(nm, "@x", "y", "package.json"), "{}"), run({ "node_modules/@x/y": {} }, scope, nm).length === 1));
    expect("a path leaving node_modules is rejected", run({ "node_modules/../../outside": {} }, undefined, nm).length === 1);
    const notice = join(dir, "NOTICE");
    writeFileSync(notice, "notice");
    const exitCode = (packages) => {
      const file = join(dir, "lock.json");
      writeFileSync(file, JSON.stringify(lock(packages)));
      return spawnSync(process.execPath, [fileURLToPath(import.meta.url), "--lockfile", file, "--node-modules", nm, "--notice", notice], { encoding: "utf8" }).status;
    };
    expect("process exits 0 for an allowed lockfile", exitCode({ "node_modules/a": { license: "MIT" } }) === 0);
    expect("process exits 1 for a GPL dependency", exitCode({ "node_modules/a": { license: "GPL-3.0-only" } }) === 1);
    expect("process exits 2 for an empty lockfile", exitCode({}) === 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  if (failures.length) {
    console.error(`license-check self-test failed: ${failures.join("; ")}`);
    return 1;
  }
  console.log(`license-check self-test ok (${count} fixture checks)`);
  return 0;
}

function main(argv) {
  let lockfile = join(REPO_ROOT, "package-lock.json");
  let nodeModules = join(REPO_ROOT, "node_modules");
  let assetsFile = null;
  let noticeFile = join(REPO_ROOT, "NOTICE");
  let selfTestRequested = false;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--self-test") selfTestRequested = true;
    else if (argv[i] === "--lockfile" && argv[i + 1]) lockfile = resolve(argv[(i += 1)]);
    else if (argv[i] === "--node-modules" && argv[i + 1]) nodeModules = resolve(argv[(i += 1)]);
    else if (argv[i] === "--assets" && argv[i + 1]) assetsFile = resolve(argv[(i += 1)]);
    else if (argv[i] === "--notice" && argv[i + 1]) noticeFile = resolve(argv[(i += 1)]);
    else throw new UsageError(`unknown or incomplete argument: ${argv[i]}`);
  }
  if (selfTestRequested) return selfTest();
  if (assetsFile === null) {
    const fallback = join(REPO_ROOT, "assets", "licenses.json");
    if (existsSync(fallback)) assetsFile = fallback;
  }
  let noticeText;
  try {
    noticeText = readFileSync(noticeFile, "utf8");
  } catch (error) {
    throw new UsageError(`cannot read NOTICE ${noticeFile}: ${error.message}`);
  }
  const packages = auditPackages(readJson(lockfile, "lockfile"), nodeModules);
  const assetViolations = assetsFile ? auditAssets(readJson(assetsFile, "assets file"), noticeText) : [];
  const violations = [...packages.violations, ...assetViolations];
  for (const violation of violations) console.error(`license violation: ${violation}`);
  if (violations.length) {
    console.error(`license check failed: ${violations.length} violation(s) in ${packages.checked} package(s)`);
    return 1;
  }
  console.log(`license check ok (${packages.checked} packages${assetsFile ? ", assets listed in NOTICE" : ", no vendored assets"})`);
  return 0;
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  console.error(`license check error: ${error.message}`);
  process.exitCode = 2;
}
