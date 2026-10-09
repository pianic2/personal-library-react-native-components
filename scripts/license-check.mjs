import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
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
// Each entry needs a reason; prefix matches the lockfile key.
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
function auditPackages(lockfile, nodeModulesRoot, exceptions = EXCEPTIONS) {
  validateExceptions(exceptions);
  if (!lockfile || typeof lockfile !== "object" || typeof lockfile.packages !== "object" || lockfile.packages === null) {
    throw new UsageError('lockfile must be an npm lockfile (v2/v3) with a "packages" object');
  }
  const violations = [];
  let checked = 0;
  for (const [key, entry] of Object.entries(lockfile.packages).sort(([a], [b]) => (a < b ? -1 : 1))) {
    if (key === "" || entry?.link) continue;
    checked += 1;
    let license = normalizeLicense(entry?.license);
    if (license === null && nodeModulesRoot) {
      const installed = join(nodeModulesRoot, "..", key, "package.json");
      if (existsSync(installed)) license = normalizeLicense(readJson(installed, "installed package.json").license);
    }
    if (license === null) {
      const exception = exceptions.find((candidate) => key.startsWith(candidate.prefix));
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
  return { violations, checked };
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
    if (!noticeText.includes(asset.path)) violations.push(`asset ${asset.path}: not listed in NOTICE`);
  });
  return violations;
}

function selfTest() {
  const lock = (packages) => ({ lockfileVersion: 3, packages: { "": { name: "root" }, ...packages } });
  const failures = [];
  const expect = (name, condition) => {
    if (!condition) failures.push(name);
  };
  const run = (packages, exceptions) => auditPackages(lock(packages), null, exceptions).violations;
  expect("MIT passes", run({ "node_modules/a": { license: "MIT" } }).length === 0);
  expect("GPL-3.0-only fails", run({ "node_modules/a": { license: "GPL-3.0-only" } }).length === 1);
  expect("AGPL fails", run({ "node_modules/a": { license: "AGPL-3.0-or-later" } }).length === 1);
  expect("MIT OR GPL passes (choice)", run({ "node_modules/a": { license: "(MIT OR GPL-3.0-only)" } }).length === 0);
  expect("MIT AND GPL fails", run({ "node_modules/a": { license: "(MIT AND GPL-3.0-only)" } }).length === 1);
  expect("WITH exception is not auto-approved", run({ "node_modules/a": { license: "GPL-2.0-only WITH Classpath-exception-2.0" } }).length === 1);
  expect("missing license fails", run({ "node_modules/a": {} }).length === 1);
  expect("legacy {type} license", run({ "node_modules/a": { license: { type: "ISC" } } }).length === 0);
  expect("exception with reason covers a missing license", run({ "node_modules/@x/y": {} }, [{ prefix: "node_modules/@x/", license: "MIT", reason: "test" }]).length === 0);
  let rejected = false;
  try {
    run({ "node_modules/a": { license: "MIT" } }, [{ prefix: "node_modules/@x/", license: "MIT", reason: " " }]);
  } catch (error) {
    rejected = error instanceof UsageError;
  }
  expect("exception without reason is rejected", rejected);
  expect("GPL asset fails", auditAssets([{ path: "assets/f.ttf", license: "GPL-3.0-only", source: "x" }], "assets/f.ttf").length === 1);
  expect("OFL asset passes when listed in NOTICE", auditAssets([{ path: "assets/f.ttf", license: "OFL-1.1", source: "x" }], "assets/f.ttf").length === 0);
  expect("asset missing from NOTICE fails", auditAssets([{ path: "assets/f.ttf", license: "OFL-1.1", source: "x" }], "nothing").length === 1);
  if (failures.length) {
    console.error(`license-check self-test failed: ${failures.join("; ")}`);
    return 1;
  }
  console.log("license-check self-test ok (14 fixture checks)");
  return 0;
}

function main(argv) {
  let lockfile = join(REPO_ROOT, "package-lock.json");
  let nodeModules = join(REPO_ROOT, "node_modules");
  let assetsFile = null;
  let noticeFile = join(REPO_ROOT, "NOTICE");
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--self-test") return selfTest();
    if (argv[i] === "--lockfile" && argv[i + 1]) lockfile = resolve(argv[(i += 1)]);
    else if (argv[i] === "--node-modules" && argv[i + 1]) nodeModules = resolve(argv[(i += 1)]);
    else if (argv[i] === "--assets" && argv[i + 1]) assetsFile = resolve(argv[(i += 1)]);
    else if (argv[i] === "--notice" && argv[i + 1]) noticeFile = resolve(argv[(i += 1)]);
    else throw new UsageError(`unknown or incomplete argument: ${argv[i]}`);
  }
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
