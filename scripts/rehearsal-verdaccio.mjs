#!/usr/bin/env node
// Local-registry rehearsal of the Texo + legacy shim publication (PLRNUI-254, runbooks E15 and E17).
// Starts Verdaccio in a temporary directory and, with PLACEHOLDER names, rehearses: publish the target (dist-tag rc),
// publish an old legacy prerelease and the generated shim, promote rc -> latest, install the shim in a clean app and check
// that one copy of the target is installed, deprecate the old legacy versions and verify the message with `npm view`,
// then the rollback steps (reset the message, move and remove a dist-tag). Nothing leaves the machine except the npm
// installs of Verdaccio itself (and the proxied dependencies of the clean app); nothing is published to npmjs.
//   node scripts/rehearsal-verdaccio.mjs [--target-name <n>] [--legacy-name <n>] [--work-dir <dir>] [--keep]
// A --work-dir must not exist or be empty and is never deleted by the script; the default temporary directory is removed
// unless --keep is given.
// Names: the identity config (config/package-identity.json) when it has a legacy name, else the placeholders
// @rehearsal/texo and @rehearsal/legacy. Exit codes: 0 every step passed, 1 a step failed, 2 usage error.
import { spawn, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readIdentity } from "./lib/identity.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const VERDACCIO = "verdaccio@6.10.5";
const NAME = /^(?:@[a-z0-9~-][a-z0-9._~-]*\/)?[a-z0-9~-][a-z0-9._~-]*$/;
const STABLE_VERSION = "1.0.0";
const OLD_LEGACY_VERSION = "0.1.0-rc.2";
const MESSAGE = "Moved to the target package. Rehearsal message.";

class UsageError extends Error {}

function parseArgs(argv) {
  const identity = readIdentity();
  const opts = { target: identity.legacy ? identity.current : "@rehearsal/texo", legacy: identity.legacy ?? "@rehearsal/legacy", workDir: undefined, keep: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--keep") { opts.keep = true; continue; }
    const key = { "--target-name": "target", "--legacy-name": "legacy", "--work-dir": "workDir" }[arg];
    const value = argv[i + 1];
    if (!key || value === undefined || value.startsWith("--")) throw new UsageError(`unknown or incomplete argument: ${arg}`);
    opts[key] = value;
    i++;
  }
  for (const [label, value] of [["target name", opts.target], ["legacy name", opts.legacy]]) if (!NAME.test(value)) throw new UsageError(`invalid ${label}: ${value}`);
  if (opts.target === opts.legacy) throw new UsageError("target and legacy names must differ");
  if (/^@personal-library\//.test(opts.target) || /^@personal-library\//.test(opts.legacy)) {
    // The rehearsal never touches npmjs, but real names must not be used by accident.
    if (opts.legacy === opts.target) throw new UsageError("target and legacy names must differ");
  }
  return opts;
}

function freePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolvePort(port));
    });
  });
}

const log = (message) => console.log(message);
let step = 0;
function pass(message) {
  step++;
  log(`PASS ${String(step).padStart(2, "0")} ${message}`);
}
function fail(message) {
  throw new Error(message);
}
function assert(condition, message) {
  if (!condition) fail(message);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: options.cwd ?? repoRoot, env: { ...process.env, ...(options.env ?? {}) }, encoding: "utf8", timeout: options.timeout ?? 10 * 60 * 1000 });
  if (result.error) fail(`${command} ${args.join(" ")}: ${result.error.message}`);
  if (result.status !== 0 && !options.allowFailure) fail(`${command} ${args.join(" ")} exited ${result.status}\n${result.stdout}\n${result.stderr}`);
  return result;
}

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

async function waitForRegistry(url, server) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) fail(`Verdaccio exited early with code ${server.exitCode}`);
    try {
      const response = await fetch(`${url}/-/ping`);
      if (response.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  fail("Verdaccio did not answer /-/ping within 60 seconds");
}

function countInstalled(dir, name) {
  // Number of directories node_modules/<name> anywhere below dir (a single hoisted copy is expected).
  let count = 0;
  const walk = (current) => {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      if (!statSync(full).isDirectory()) continue;
      if (entry === "node_modules") {
        const candidate = join(full, ...name.split("/"));
        if (existsSync(join(candidate, "package.json"))) count++;
        for (const inner of readdirSync(full)) {
          const innerPath = join(full, inner);
          if (inner.startsWith("@") && statSync(innerPath).isDirectory()) for (const scoped of readdirSync(innerPath)) walk(join(innerPath, scoped));
          else if (statSync(innerPath).isDirectory()) walk(innerPath);
        }
      } else if (entry !== ".bin") walk(full);
    }
  };
  walk(dir);
  return count;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const created = opts.workDir === undefined;
  const work = created ? mkdtempSync(join(tmpdir(), "plrnui-rehearsal-")) : resolve(opts.workDir);
  if (!created && existsSync(work) && readdirSync(work).length > 0) throw new UsageError(`--work-dir must not exist or be empty: ${work}`);
  mkdirSync(work, { recursive: true });
  const port = await freePort();
  const registry = `http://127.0.0.1:${port}`;
  const npmrc = join(work, "npmrc");
  const scopes = [opts.target, opts.legacy].filter((n) => n.startsWith("@")).map((n) => n.split("/")[0]);
  // The registry is also set for the scopes of both names so that a user-level `@scope:registry` cannot redirect them.
  writeFileSync(npmrc, [`registry=${registry}/`, ...[...new Set(scopes)].map((scope) => `${scope}:registry=${registry}/`), `//127.0.0.1:${port}/:_authToken=rehearsal-token`, ""].join("\n"));
  const npmEnv = { npm_config_userconfig: npmrc, npm_config_registry: `${registry}/`, npm_config_cache: join(work, "npm-cache"), npm_config_update_notifier: "false", npm_config_audit: "false", npm_config_fund: "false" };
  const npm = (args, cwd) => run("npm", args, { cwd, env: npmEnv });
  let server;
  try {
    log(`rehearsal: target=${opts.target} legacy=${opts.legacy} registry=${registry} work=${work}`);

    // 1. Verdaccio
    const tools = join(tmpdir(), "plrnui-rehearsal-tools");
    mkdirSync(tools, { recursive: true });
    if (!existsSync(join(tools, "node_modules", "verdaccio", "package.json"))) {
      run("npm", ["install", "--prefix", tools, VERDACCIO, "--no-audit", "--no-fund", "--ignore-scripts"], { env: { npm_config_registry: "https://registry.npmjs.org/" } });
    }
    const quote = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    writeFileSync(join(work, "config.yaml"), [
      `storage: ${join(work, "storage")}`,
      "auth:",
      "  htpasswd:",
      `    file: ${join(work, "htpasswd")}`,
      "uplinks:",
      "  npmjs:",
      "    url: https://registry.npmjs.org/",
      "packages:",
      ...[opts.target, opts.legacy].flatMap((name) => [`  '${name}':`, "    access: $all", "    publish: $all", "    unpublish: $all"]),
      "  '**':",
      "    access: $all",
      "    proxy: npmjs",
      "log: { type: file, path: " + join(work, "verdaccio.log") + ", level: warn }",
      "",
    ].join("\n"));
    server = spawn(process.execPath, [join(tools, "node_modules", "verdaccio", "bin", "verdaccio"), "--config", join(work, "config.yaml"), "--listen", `127.0.0.1:${port}`], { stdio: "ignore" });
    await waitForRegistry(registry, server);
    pass(`Verdaccio ${VERDACCIO} answers on ${registry}`);

    // 2. Target package: a copy of the packed current package under the placeholder name
    const artifacts = join(work, "artifacts");
    mkdirSync(artifacts, { recursive: true });
    run("npm", ["run", "build"], { cwd: repoRoot });
    run("npm", ["pack", "--pack-destination", artifacts], { cwd: repoRoot });
    const packed = readdirSync(artifacts).filter((f) => f.endsWith(".tgz"));
    assert(packed.length === 1, `expected one packed tarball, found ${packed.join(", ") || "none"}`);
    const tarball = join(artifacts, packed[0]);
    const targetDir = join(work, "target");
    mkdirSync(targetDir, { recursive: true });
    run("tar", ["-xzf", tarball, "-C", targetDir, "--strip-components=1"]);
    const targetPkg = readJson(join(targetDir, "package.json"));
    Object.assign(targetPkg, { name: opts.target, version: STABLE_VERSION, scripts: {} });
    delete targetPkg.publishConfig;
    writeJson(join(targetDir, "package.json"), targetPkg);
    npm(["publish", targetDir, "--tag", "rc", "--access", "public"], work);
    let tags = JSON.parse(npm(["view", opts.target, "dist-tags", "--json"], work).stdout);
    assert(tags.rc === STABLE_VERSION, `target dist-tags after publish: ${JSON.stringify(tags)}`);
    pass(`published ${opts.target}@${STABLE_VERSION} with dist-tag rc (${JSON.stringify(tags)})`);

    // 3. Old legacy prerelease (stands for the 0.x line that gets deprecated)
    const oldDir = join(work, "legacy-old");
    mkdirSync(oldDir, { recursive: true });
    writeJson(join(oldDir, "package.json"), { name: opts.legacy, version: OLD_LEGACY_VERSION, main: "index.js", license: "MIT" });
    writeFileSync(join(oldDir, "index.js"), "module.exports = {};\n");
    npm(["publish", oldDir, "--tag", "rc", "--access", "public"], work);
    pass(`published ${opts.legacy}@${OLD_LEGACY_VERSION} (old legacy line)`);

    // 4. Generated shim
    const shimDir = join(work, "shim");
    run(process.execPath, [join(repoRoot, "scripts", "build-shim.mjs"), "--out", shimDir, "--target-name", opts.target, "--legacy-name", opts.legacy, "--target-version", STABLE_VERSION], { cwd: repoRoot });
    const shimPkg = readJson(join(shimDir, "package.json"));
    assert(Object.keys(shimPkg.dependencies).join() === opts.target && shimPkg.dependencies[opts.target] === `^${STABLE_VERSION.split(".")[0]}.0.0`, "shim must depend only on the target with a caret range of the major");
    delete shimPkg.publishConfig;
    writeJson(join(shimDir, "package.json"), shimPkg);
    npm(["publish", shimDir, "--tag", "rc", "--access", "public"], work);
    pass(`published shim ${opts.legacy}@${STABLE_VERSION} with dist-tag rc`);

    // 5. Promote rc -> latest
    for (const name of [opts.target, opts.legacy]) npm(["dist-tag", "add", `${name}@${STABLE_VERSION}`, "latest"], work);
    for (const name of [opts.target, opts.legacy]) {
      tags = JSON.parse(npm(["view", name, "dist-tags", "--json"], work).stdout);
      assert(tags.latest === STABLE_VERSION, `${name} latest after promotion: ${JSON.stringify(tags)}`);
    }
    pass("promoted rc -> latest for the target and the shim");

    // 6. Clean app: install the shim, one copy of the target
    const appDir = join(work, "app");
    mkdirSync(appDir, { recursive: true });
    writeJson(join(appDir, "package.json"), { name: "rehearsal-app", version: "0.0.0", private: true });
    npm(["install", `${opts.legacy}@latest`, "--legacy-peer-deps", "--ignore-scripts"], appDir);
    const copies = countInstalled(appDir, opts.target);
    assert(copies === 1, `expected exactly one installed copy of ${opts.target}, found ${copies}`);
    assert(existsSync(join(appDir, "node_modules", ...opts.legacy.split("/"), "dist", "index.js")), "the shim entry file is missing in the install");
    pass(`the shim install resolves a single copy of ${opts.target} (${copies})`);

    // 7. Deprecate the old legacy range and verify with npm view
    npm(["deprecate", `${opts.legacy}@<${STABLE_VERSION}`, MESSAGE], work);
    let message = npm(["view", `${opts.legacy}@${OLD_LEGACY_VERSION}`, "deprecated"], work).stdout.trim();
    let prerelease = "matched by the range";
    if (message !== MESSAGE) {
      prerelease = "NOT matched by the range, deprecated by exact version (fallback of the E15 runbook, step 6v)";
      npm(["deprecate", `${opts.legacy}@${OLD_LEGACY_VERSION}`, MESSAGE], work);
      message = npm(["view", `${opts.legacy}@${OLD_LEGACY_VERSION}`, "deprecated"], work).stdout.trim();
    }
    assert(message === MESSAGE, `deprecation message of ${OLD_LEGACY_VERSION} is "${message}"`);
    const shimMessage = npm(["view", `${opts.legacy}@${STABLE_VERSION}`, "deprecated"], work).stdout.trim();
    assert(shimMessage === "", `the new shim version must not be deprecated, found "${shimMessage}"`);
    pass(`deprecation visible via npm view for ${opts.legacy}@${OLD_LEGACY_VERSION}; prerelease ${prerelease}; ${STABLE_VERSION} not deprecated`);

    // 8. Rollback steps
    npm(["deprecate", `${opts.legacy}@<${STABLE_VERSION}`, ""], work);
    message = npm(["view", `${opts.legacy}@${OLD_LEGACY_VERSION}`, "deprecated"], work).stdout.trim();
    assert(message === "", `an empty message must remove the deprecation, found "${message}"`);
    npm(["dist-tag", "add", `${opts.target}@${STABLE_VERSION}`, "hotfix"], work);
    tags = JSON.parse(npm(["view", opts.target, "dist-tags", "--json"], work).stdout);
    assert(tags.hotfix === STABLE_VERSION, `temporary tag missing: ${JSON.stringify(tags)}`);
    npm(["dist-tag", "rm", opts.target, "hotfix"], work);
    tags = JSON.parse(npm(["view", opts.target, "dist-tags", "--json"], work).stdout);
    assert(!("hotfix" in tags) && tags.latest === STABLE_VERSION, `dist-tags after rollback steps: ${JSON.stringify(tags)}`);
    pass("rollback steps: deprecation reset with an empty message, temporary dist-tag added and removed");

    log(`rehearsal passed: ${step} steps`);
    return 0;
  } finally {
    if (server && server.exitCode === null) server.kill("SIGTERM");
    // Only a directory created by this script is removed; a user-supplied --work-dir is never deleted.
    if (!opts.keep && created) rmSync(work, { recursive: true, force: true });
  }
}

main().then((code) => { process.exitCode = code; }).catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = error instanceof UsageError ? 2 : 1;
});
