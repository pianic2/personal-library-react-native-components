#!/usr/bin/env node
// Pack verification (PLRNUI-251). Packs a package directory for real (npm pack --json, scripts ignored) and asserts on
// the tarball itself, not on package.json alone:
//   - file whitelist: dist/**, package.json, README*, LICENSE*, CHANGELOG* and nothing else (no src, tests, audit, ...)
//   - required files: package.json, a README, a LICENSE and at least one file under dist/
//   - every target of exports, main, module, types, bin and typesVersions exists in the tarball (patterns need a match)
//   - packed and unpacked size under budget
// Source maps: dist/**/*.map are accepted. They are emitted next to the files they describe and reference src/, which is
// deliberately not shipped (consumers get the compiled output, maps only degrade to "source unavailable"); they are
// counted in the output. Maps outside dist/ are rejected by the whitelist.
// Budget: config/size-limits.json has gzip budgets only. An optional "pack": { maxUnpackedBytes, maxPackedBytes } section
// there wins over the defaults below; --max-unpacked-bytes / --max-packed-bytes win over both.
// Usage: node scripts/verify-pack.mjs [--dir <package dir>] [--max-unpacked-bytes <n>] [--max-packed-bytes <n>]
//   (default dir: repository root; for the legacy shim: --dir dist-shim). Exit codes: 0 pass, 1 check failed, 2 usage/pack error.
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_MAX_UNPACKED_BYTES = 2 * 1024 * 1024;
const DEFAULT_MAX_PACKED_BYTES = 640 * 1024;
const ALLOWED = /^(dist\/.+|package\.json|README(\.[A-Za-z]+)?|LICENSE(\.[A-Za-z]+)?|CHANGELOG(\.[A-Za-z]+)?)$/;
const FORBIDDEN_TOP = ["src", "tests", "test", "audit", "docs", "scripts", "config", "examples", "skills", "ai"];

class UsageError extends Error {}

function parseArgs(argv) {
  const opts = { dir: REPO_ROOT, maxUnpacked: undefined, maxPacked: undefined };
  const flags = { "--dir": "dir", "--max-unpacked-bytes": "maxUnpacked", "--max-packed-bytes": "maxPacked" };
  for (let i = 0; i < argv.length; i += 2) {
    const key = flags[argv[i]];
    const value = argv[i + 1];
    if (!key || value === undefined || value.startsWith("--")) throw new UsageError(`unknown or incomplete argument: ${argv[i]}`);
    opts[key] = value;
  }
  for (const key of ["maxUnpacked", "maxPacked"]) {
    if (opts[key] !== undefined && !/^[1-9]\d*$/.test(opts[key])) throw new UsageError("size limits must be positive integers");
    if (opts[key] !== undefined) opts[key] = Number(opts[key]);
  }
  opts.dir = resolve(opts.dir);
  return opts;
}

function budgets(opts) {
  let pack = {};
  const file = join(REPO_ROOT, "config", "size-limits.json");
  if (existsSync(file)) {
    try {
      pack = JSON.parse(readFileSync(file, "utf8")).pack ?? {};
    } catch (error) {
      throw new UsageError(`cannot read ${file}: ${error.message}`);
    }
  }
  return {
    unpacked: opts.maxUnpacked ?? pack.maxUnpackedBytes ?? DEFAULT_MAX_UNPACKED_BYTES,
    packed: opts.maxPacked ?? pack.maxPackedBytes ?? DEFAULT_MAX_PACKED_BYTES,
  };
}

function pack(dir) {
  if (!existsSync(join(dir, "package.json"))) throw new UsageError(`no package.json in ${dir}`);
  const out = mkdtempSync(join(tmpdir(), "verify-pack-"));
  try {
    const result = spawnSync("npm", ["pack", "--json", "--ignore-scripts", "--pack-destination", out], { cwd: dir, encoding: "utf8" });
    if (result.status !== 0) throw new UsageError(`npm pack failed: ${(result.stderr || result.stdout).trim().split("\n")[0]}`);
    let info;
    try {
      info = JSON.parse(result.stdout)[0];
    } catch {
      throw new UsageError("npm pack did not return JSON");
    }
    const tarball = join(out, info.filename.replace(/^@/, "").replace("/", "-"));
    const read = spawnSync("tar", ["-xzOf", tarball, "package/package.json"], { encoding: "utf8" });
    if (read.status !== 0) throw new UsageError(`cannot read package.json from the tarball: ${read.stderr.trim() || "tar failed"}`);
    return { info, manifest: JSON.parse(read.stdout) };
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
}

function targets(manifest) {
  const found = new Set();
  const add = (value) => {
    if (typeof value === "string") found.add(value.replace(/^\.\//, ""));
  };
  const walk = (value) => {
    if (typeof value === "string") add(value);
    else if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === "object") Object.values(value).forEach(walk);
  };
  walk(manifest.exports);
  walk(manifest.typesVersions);
  for (const field of ["main", "module", "types", "typings"]) add(manifest[field]);
  walk(typeof manifest.bin === "string" ? [manifest.bin] : manifest.bin);
  return [...found].filter((t) => t !== "" && !t.startsWith("*"));
}

function matcher(target) {
  if (!target.includes("*")) return (path) => path === target;
  const source = target.split("*").map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".+");
  const regex = new RegExp(`^${source}$`);
  return (path) => regex.test(path);
}

export function verify({ info, manifest }, limits) {
  const errors = [];
  const paths = info.files.map((f) => f.path);
  const have = new Set(paths);
  for (const path of paths) {
    if (ALLOWED.test(path)) continue;
    const top = path.split("/")[0];
    errors.push(FORBIDDEN_TOP.includes(top) ? `forbidden content in tarball: ${path} (${top}/ must not ship)` : `file outside the whitelist (dist, package.json, README, LICENSE, CHANGELOG): ${path}`);
  }
  if (!have.has("package.json")) errors.push("package.json missing from the tarball");
  if (!paths.some((p) => /^README(\.[A-Za-z]+)?$/.test(p))) errors.push("README missing from the tarball");
  if (!paths.some((p) => /^LICENSE(\.[A-Za-z]+)?$/.test(p))) errors.push("LICENSE missing from the tarball");
  if (!paths.some((p) => p.startsWith("dist/"))) errors.push("dist/ is empty or missing in the tarball (run the build first)");
  for (const target of targets(manifest)) {
    if (!paths.some(matcher(target))) errors.push(`package.json points to ${target}, which is not in the tarball`);
  }
  if (info.unpackedSize > limits.unpacked) errors.push(`unpacked size ${info.unpackedSize} B exceeds the budget of ${limits.unpacked} B`);
  if (info.size > limits.packed) errors.push(`tarball size ${info.size} B exceeds the budget of ${limits.packed} B`);
  return errors;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const limits = budgets(opts);
  const packed = pack(opts.dir);
  const errors = verify(packed, limits);
  const { info, manifest } = packed;
  const maps = info.files.filter((f) => f.path.endsWith(".map")).length;
  console.log(`verify-pack: ${manifest.name}@${manifest.version} (${opts.dir})`);
  console.log(`tarball size: ${info.size} B (budget ${limits.packed} B), unpacked size: ${info.unpackedSize} B (budget ${limits.unpacked} B)`);
  console.log(`file count: ${info.files.length} (source maps: ${maps})`);
  if (errors.length > 0) {
    console.error("verify-pack failed:");
    for (const error of errors) console.error(`- ${error}`);
    return 1;
  }
  console.log("verify-pack passed");
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(`verify-pack: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
  }
}
