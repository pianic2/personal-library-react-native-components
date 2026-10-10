#!/usr/bin/env node
// Publication guard (PLRNUI-124). One guard, three channels:
//   --channel rc      X.Y.Z-rc.N, dist-tag rc (default; this is what `npm run release:guard` runs)
//   --channel latest  X.Y.Z (no prerelease), dist-tag latest, changelog entry for the version, clean public API
//                     snapshot, and consumer smoke evidence files
//   --channel shim    the legacy re-export package: stable version, dist-tag latest, exactly one dependency (the
//                     target, caret range ^<major>.0.0 per D10 / ADR 0013), no scripts, no peers, files whitelist
// Options (all optional): --root <dir> package directory to check (default: repository root),
//   --identity <file> package identity config (default config/package-identity.json),
//   --changelog <file> (default CHANGELOG.md in the root), --evidence-dir <dir> (default audit/release/evidence/<version>
//   in the root), --repository <url> canonical repository URL.
// Names come from scripts/lib/identity.mjs. Exit codes: 0 pass, 1 a check failed, 2 usage or unreadable input.
// Note: the ticket text asks for an exact target version in the shim; D10 and ADR 0013 (accepted decisions) say a
// caret range of the major, so an exact pin is rejected here.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_IDENTITY_FILE, readIdentity } from "./lib/identity.mjs";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CANONICAL_REPOSITORY = "git+https://github.com/pianic2/personal-library-react-native-components.git";
const CHANNELS = ["rc", "latest", "shim"];
const EVIDENCE_FILES = ["consumer-smoke.json", "expo-consumer-smoke.json"];
const STABLE = /^\d+\.\d+\.\d+$/;
const RC = /^\d+\.\d+\.\d+-rc\.\d+$/;

class UsageError extends Error {}

function parseArgs(argv) {
  const opts = { channel: "rc", root: REPO_ROOT, identity: DEFAULT_IDENTITY_FILE, repository: CANONICAL_REPOSITORY, changelog: undefined, evidenceDir: undefined };
  const flags = { "--channel": "channel", "--root": "root", "--identity": "identity", "--changelog": "changelog", "--evidence-dir": "evidenceDir", "--repository": "repository" };
  for (let i = 0; i < argv.length; i += 2) {
    const key = flags[argv[i]];
    const value = argv[i + 1];
    if (!key || value === undefined || value.startsWith("--")) throw new UsageError(`unknown or incomplete argument: ${argv[i]}`);
    opts[key] = value;
  }
  if (!CHANNELS.includes(opts.channel)) throw new UsageError(`--channel must be one of ${CHANNELS.join(", ")}`);
  opts.root = resolve(opts.root);
  return opts;
}

function readJson(file, label) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    throw new UsageError(`cannot read ${label} (${file}): ${error.message}`);
  }
}

function checkCommon(pkg, errors, check, opts) {
  check(pkg.license === "MIT", `license must be MIT, found ${pkg.license}`);
  check(pkg.repository?.type === "git", "repository.type must be git");
  check(pkg.repository?.url === opts.repository, "repository.url is not canonical");
  check(pkg.publishConfig?.registry === "https://registry.npmjs.org/", "publishConfig.registry must be npmjs");
  check(pkg.publishConfig?.access === "public", "scoped package must publish as public");
  const allowedFiles = new Set(["dist", "README.md", "LICENSE"]);
  check(Array.isArray(pkg.files), "files whitelist is required");
  for (const entry of pkg.files ?? []) check(allowedFiles.has(entry), `unexpected publish whitelist entry: ${entry}`);
  for (const required of allowedFiles) check(pkg.files?.includes(required), `missing publish whitelist entry: ${required}`);
}

function checkTexo(pkg, lock, errors, check, identity) {
  check(pkg.name === identity.current, `unexpected package name: ${pkg.name} (identity: ${identity.current})`);
  check(pkg.version !== "0.0.0", "0.0.0 is not publishable");
  check(lock.version === pkg.version, "package-lock top-level version does not match package.json");
  check(lock.packages?.[""]?.version === pkg.version, "package-lock root package version does not match package.json");
  check(pkg.engines?.node === ">=22.13.0", "Node engine baseline drifted");
  check(pkg.peerDependencies?.react === ">=19.2.3 <20.0.0", "React peer baseline drifted");
  check(pkg.peerDependencies?.["react-native"] === ">=0.86.0 <0.87.0", "React Native peer baseline drifted");
  check(!pkg.dependencies || Object.keys(pkg.dependencies).length === 0, "runtime dependencies require renewed native/dependency governance");
}

function checkLatest(pkg, opts, check) {
  check(STABLE.test(pkg.version), `version must be a stable X.Y.Z without prerelease, found ${pkg.version}`);
  check(pkg.publishConfig?.tag === "latest", `stable release must publish with dist-tag latest, found ${pkg.publishConfig?.tag}`);
  const changelog = resolve(opts.root, opts.changelog ?? "CHANGELOG.md");
  if (!existsSync(changelog)) check(false, `changelog not found: ${changelog}`);
  else {
    const escaped = pkg.version.replace(/\./g, "\\.");
    check(new RegExp(`^#{1,3}\\s*\\[?v?${escaped}\\]?(\\s|$)`, "m").test(readFileSync(changelog, "utf8")), `changelog has no entry for ${pkg.version}`);
  }
  const snapshot = join(opts.root, "scripts", "public-api-snapshot.mjs");
  if (!existsSync(snapshot)) check(false, "scripts/public-api-snapshot.mjs not found, cannot verify the public API snapshot");
  else {
    const result = spawnSync(process.execPath, [snapshot, "--check"], { cwd: opts.root, encoding: "utf8" });
    check(result.status === 0, `public API snapshot is not clean: ${(result.stderr || result.stdout).trim().split("\n")[0]}`);
  }
  const evidence = resolve(opts.root, opts.evidenceDir ?? join("audit", "release", "evidence", pkg.version));
  for (const file of EVIDENCE_FILES) check(existsSync(join(evidence, file)), `missing consumer smoke evidence: ${join(evidence, file)}`);
}

function checkShim(pkg, errors, check, identity) {
  check(identity.legacy !== null && identity.shim.enabled === true, "identity config does not enable a legacy shim (legacy name and shim.enabled are required)");
  check(identity.legacy !== null && pkg.name === identity.legacy, `shim package name must be the legacy name ${identity.legacy}, found ${pkg.name}`);
  check(STABLE.test(pkg.version), `shim version must be a stable X.Y.Z, found ${pkg.version}`);
  check(pkg.publishConfig?.tag === "latest", `shim must publish with dist-tag latest, found ${pkg.publishConfig?.tag}`);
  const dependencies = pkg.dependencies ?? {};
  const names = Object.keys(dependencies);
  check(names.length === 1 && names[0] === identity.current, `shim must have exactly one dependency, the target ${identity.current}; found ${names.join(", ") || "none"}`);
  const major = String(pkg.version).split(".")[0];
  if (names.length === 1) check(dependencies[names[0]] === `^${major}.0.0`, `shim dependency range must be ^${major}.0.0 (caret of the major, D10), found ${dependencies[names[0]]}`);
  check(!pkg.scripts || Object.keys(pkg.scripts).length === 0, "shim must have no scripts (no postinstall or any other)");
  for (const field of ["peerDependencies", "optionalDependencies", "bundledDependencies", "bundleDependencies"]) {
    check(!(field in pkg) || pkg[field] === null || (typeof pkg[field] === "object" && Object.keys(pkg[field]).length === 0), `shim must not declare ${field}`);
  }
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const identity = readIdentity(isAbsolute(opts.identity) ? opts.identity : resolve(process.cwd(), opts.identity));
  const pkg = readJson(join(opts.root, "package.json"), "package.json");
  const errors = [];
  const check = (condition, message) => {
    if (!condition) errors.push(message);
  };
  checkCommon(pkg, errors, check, opts);
  if (opts.channel === "shim") {
    checkShim(pkg, errors, check, identity);
  } else {
    const lock = readJson(join(opts.root, "package-lock.json"), "package-lock.json");
    checkTexo(pkg, lock, errors, check, identity);
    if (opts.channel === "rc") {
      check(RC.test(pkg.version), `version must be an RC prerelease, found ${pkg.version}`);
      check(pkg.publishConfig?.tag === "rc", "RC must publish with dist-tag rc, never latest");
      check(pkg.publishConfig?.tag !== "latest", "latest dist-tag is forbidden for the first RC");
    } else {
      checkLatest(pkg, opts, check);
    }
  }

  if (errors.length > 0) {
    console.error(`Release guard (${opts.channel}) failed:`);
    for (const error of errors) console.error(`- ${error}`);
    return 1;
  }
  console.log(`Release guard (${opts.channel}) passed for ${pkg.name}@${pkg.version}`);
  console.log(`registry=${pkg.publishConfig.registry} access=${pkg.publishConfig.access} tag=${pkg.publishConfig.tag}`);
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`release-guard: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
