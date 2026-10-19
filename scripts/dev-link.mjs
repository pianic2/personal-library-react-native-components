#!/usr/bin/env node
// Local development link (PLRNUI-307): rebuilds the library on change and copies dist into a consumer app's
// node_modules, so a real Expo/Metro app sees edits without packing a tarball. Copy mode only: `npm link` symlinks
// break Metro (symlinked package roots are not watched or resolved reliably) and pull a second copy of react.
//   node scripts/dev-link.mjs --target <consumer-app-dir> [--once]
//   --once   build once, sync and exit (no watch)
//   --help   print this text
// Exit codes: 0 ok, 1 build/sync failed or react is duplicated in the target, 2 usage error.
import { spawn, spawnSync } from "node:child_process";
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGE_NAME = "@personal-library/react-native-components";

export const HELP = `Usage: node scripts/dev-link.mjs --target <consumer-app-dir> [--once]

Runs "tsc -p tsconfig.build.json --watch" and, after every successful rebuild, copies dist/ and package.json into
<consumer-app-dir>/node_modules/${PACKAGE_NAME}. Refuses to run when the target has no react, or more than one
copy of react in its node_modules tree.

Options:
  --target <dir>  consumer app root (contains package.json and node_modules)
  --once          build once, sync and exit
  --help          show this help
`;

export class UsageError extends Error {}

export function parseArgs(argv) {
  const opts = { target: undefined, once: false, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") opts.help = true;
    else if (arg === "--once") opts.once = true;
    else if (arg === "--target") {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith("--")) throw new UsageError("--target needs a directory");
      opts.target = resolve(value);
      i += 1;
    } else throw new UsageError(`unknown argument: ${arg}`);
  }
  if (!opts.help && !opts.target) throw new UsageError("--target <consumer-app-dir> is required");
  return opts;
}

function packageDirs(nodeModules) {
  if (!existsSync(nodeModules)) return [];
  const dirs = [];
  for (const entry of readdirSync(nodeModules, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = join(nodeModules, entry.name);
    if (entry.name.startsWith("@")) {
      for (const scoped of readdirSync(full)) dirs.push(join(full, scoped));
    } else dirs.push(full);
  }
  return dirs;
}

/** Every directory in the node_modules tree (nested node_modules included) that holds a react package. */
export function findReactCopies(nodeModules, seen = new Set()) {
  const copies = [];
  const real = existsSync(nodeModules) ? resolve(nodeModules) : undefined;
  if (!real || seen.has(real)) return copies;
  seen.add(real);
  if (existsSync(join(nodeModules, "react", "package.json"))) copies.push(join(nodeModules, "react"));
  for (const dir of packageDirs(nodeModules)) {
    if (lstatSync(dir).isSymbolicLink()) continue;
    copies.push(...findReactCopies(join(dir, "node_modules"), seen));
  }
  return copies;
}

/** Throws unless the target app resolves exactly one react. */
export function assertSingleReact(target) {
  const copies = findReactCopies(join(target, "node_modules"));
  if (copies.length === 0) throw new Error(`no react found in ${join(target, "node_modules")}; install the consumer app dependencies first`);
  if (copies.length > 1) {
    throw new Error(`react is duplicated in the target app (${copies.length} copies):\n${copies.map((c) => `  ${c}`).join("\n")}\nA second react breaks hooks at runtime. Dedupe the consumer install (npm dedupe, align versions) and run again.`);
  }
}

export function sync(target, source = repoRoot) {
  const dist = join(source, "dist");
  if (!existsSync(join(dist, "index.js"))) throw new Error(`${dist}/index.js missing: the build did not emit`);
  const dest = join(target, "node_modules", ...PACKAGE_NAME.split("/"));
  mkdirSync(dirname(dest), { recursive: true });
  // A leftover symlink (npm link) must go: writing through it would modify the repository.
  if (existsSync(dest) && lstatSync(dest).isSymbolicLink()) rmSync(dest);
  rmSync(join(dest, "dist"), { recursive: true, force: true });
  cpSync(dist, join(dest, "dist"), { recursive: true });
  cpSync(join(source, "package.json"), join(dest, "package.json"));
  return dest;
}

export function metroSnippet() {
  return `// metro.config.js of the consumer app
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Resolve the package "exports" map (dist/index.js, ./theme, ./tokens).
config.resolver.unstable_enablePackageExports = true;
// Pin one copy of react and react-native for every module Metro bundles.
config.resolver.extraNodeModules = {
  react: path.resolve(__dirname, "node_modules/react"),
  "react-native": path.resolve(__dirname, "node_modules/react-native"),
};
// Needed only if you point Metro at a folder outside the app root (monorepo or symlink):
// config.watchFolders = [path.resolve(__dirname, "../shared")];

module.exports = config;
`;
}

function buildOnce() {
  const tsc = join(repoRoot, "node_modules", "typescript", "bin", "tsc");
  return spawnSync(process.execPath, [tsc, "-p", "tsconfig.build.json"], { cwd: repoRoot, stdio: "inherit" }).status === 0;
}

function main(argv) {
  let opts;
  try {
    opts = parseArgs(argv);
  } catch (error) {
    if (!(error instanceof UsageError)) throw error;
    console.error(`dev-link: ${error.message}\n\n${HELP}`);
    return 2;
  }
  if (opts.help) {
    console.log(HELP);
    return 0;
  }
  if (!existsSync(join(opts.target, "package.json"))) {
    console.error(`dev-link: ${opts.target} has no package.json`);
    return 2;
  }
  try {
    assertSingleReact(opts.target);
  } catch (error) {
    console.error(`dev-link: ${error.message}`);
    return 1;
  }
  const report = () => {
    try {
      console.log(`[dev-link] synced dist -> ${sync(opts.target)} at ${new Date().toISOString()}`);
      return true;
    } catch (error) {
      console.error(`[dev-link] sync failed: ${error.message}`);
      return false;
    }
  };
  console.log(`[dev-link] add this to the consumer app (first run only):\n\n${metroSnippet()}`);
  if (opts.once) return buildOnce() && report() ? 0 : 1;

  // tsc --watch prints "Found N errors. Watching for file changes." after every rebuild; sync only on 0 errors.
  const tsc = join(repoRoot, "node_modules", "typescript", "bin", "tsc");
  const child = spawn(process.execPath, [tsc, "-p", "tsconfig.build.json", "--watch", "--preserveWatchOutput", "--pretty", "false"], { cwd: repoRoot, stdio: ["ignore", "pipe", "inherit"] });
  let buffer = "";
  child.stdout.on("data", (chunk) => {
    process.stdout.write(chunk);
    buffer += chunk.toString();
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (/Found 0 errors\. Watching for file changes/.test(line)) report();
      else if (/Found [1-9]\d* errors?\./.test(line)) console.error("[dev-link] build has errors; dist not synced");
    }
  });
  for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill());
  return new Promise((done) => child.on("exit", (code) => done(code ?? 0)));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2));
}
