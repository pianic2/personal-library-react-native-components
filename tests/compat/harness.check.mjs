#!/usr/bin/env node
// Proof that the compat suite is a real gate (PLRNUI-162). Runs the suite three times as child processes:
//   1. shim mode against the generated shim            -> must pass
//   2. control mode (legacy specifier -> built target) -> must pass
//   3. shim mode against a copy of the shim whose root re-exports lack one export (default Button) -> must FAIL
// Prerequisites: npm run build && node scripts/build-shim.mjs   (see README.md). Exit 0 only when 1 and 2 pass and 3 fails.
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const shimDir = resolve(root, process.env.COMPAT_SHIM_DIR ?? "dist-shim");
const omit = process.env.COMPAT_OMIT_EXPORT ?? "Button";
const target = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).name;

function fail(message) {
  console.error(`compat harness: ${message}`);
  process.exit(1);
}

function runSuite(env) {
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", "--import", "./tests/setup.ts", "--experimental-loader", "./tests/compat-loader.mjs", "--test", ...["accessibility", "render", "surface"].map((n) => `tests/compat/${n}.test.tsx`)],
    { cwd: root, env: { ...process.env, ...env }, encoding: "utf8" }
  );
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

if (!existsSync(join(shimDir, "package.json"))) fail(`${shimDir} is missing: run npm run build and node scripts/build-shim.mjs first`);

const shimRun = runSuite({ COMPAT_MODE: "shim" });
const controlRun = runSuite({ COMPAT_MODE: "target" });
const shimStatus = shimRun.status;
const controlStatus = controlRun.status;

// Export names of the built target, read in a child process with the react-native stub (dist imports react-native).
const listing = spawnSync(
  process.execPath,
  ["--import", "./tests/shims/register-rn-stub.mjs", "-e", `import(${JSON.stringify(pathToFileURL(join(root, "dist", "index.js")).href)}).then((m) => console.log(JSON.stringify(Object.keys(m))))`],
  { cwd: root, encoding: "utf8" }
);
if (listing.status !== 0) fail(`cannot read the built target (run npm run build): ${listing.stderr}`);
const exported = JSON.parse(listing.stdout.trim().split("\n").pop());
if (!exported.includes(omit)) fail(`the built target has no export "${omit}"`);
const broken = mkdtempSync(join(tmpdir(), "plrnui-162-"));
let brokenRun;
try {
  cpSync(shimDir, broken, { recursive: true });
  const names = exported.filter((name) => name !== omit);
  writeFileSync(join(broken, "dist", "index.js"), `export { ${names.join(", ")} } from "${target}";\n`);
  brokenRun = runSuite({ COMPAT_MODE: "shim", COMPAT_SHIM_DIR: broken });
} finally {
  rmSync(broken, { recursive: true, force: true });
}

const brokenStatus = brokenRun.status;
console.log(`shim mode: exit ${shimStatus}; control mode: exit ${controlStatus}; shim without "${omit}": exit ${brokenStatus}`);
if (shimStatus !== 0) fail("the suite must pass against the shim");
if (controlStatus !== 0) fail("the control run must pass against the target");
if (brokenStatus === null) fail("the broken-shim run was killed");
if (!brokenRun.output.includes(omit)) fail(`the broken-shim run did not fail because of "${omit}"`);
if (brokenStatus === 0) fail(`the suite must fail when the shim lacks "${omit}"`);
console.log("compat harness ok");
