#!/usr/bin/env node
// Subpath resolution matrix (PLRNUI-313, E14-10): packs the library, installs the tarball into a throw-away consumer
// and checks that every subpath declared in config/exports.json resolves under the resolvers consumers use:
//   node       real Node ESM import (peers are stubbed, so only package resolution and ESM specifiers are exercised)
//   tsc-bundler  tsc --moduleResolution bundler
//   tsc-node16   tsc --module/--moduleResolution node16
//   metro      expo export (Metro) on an entry that imports the subpath
//   webpack5   webpack 5 with resolve.fullySpecified = true (package "type": "module")
// Output: markdown matrix on stdout, optional JSON/markdown files. Exit 0 all pass, 1 any failure, 2 usage error.
// Network use is limited to `npm install` of the consumer and its peers (the npm cache is honored, --prefer-offline).
//
// Usage: node scripts/subpath-resolution-smoke.mjs [options]
//   --package <spec>        package to install and resolve (default: the repo package name). Used by the shim (E15-06).
//   --tarball <file>        install this tarball instead of building and packing the repo
//   --config <file>         exports config listing the subpaths (default: config/exports.json)
//   --expect-all            require every config subpath (default: skip subpaths the repo has no source for yet)
//   --resolvers <a,b,...>   subset of: node,tsc-bundler,tsc-node16,metro,webpack5 (default: all)
//   --work-dir <dir>        scratch directory (default: <tmp>/plrnui-subpath-smoke)
//   --json <file>           write the matrix as JSON
//   --markdown <file>       write the matrix as markdown
//   --self-test             also prove the matrix catches a removed subpath export and a removed .js specifier
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ALL_RESOLVERS = ["node", "tsc-bundler", "tsc-node16", "metro", "webpack5"];
const INSTALL_TIMEOUT_MS = 10 * 60 * 1000;
const EXPORT_TIMEOUT_MS = 10 * 60 * 1000;

class UsageError extends Error {}

function parseArgs(argv) {
  const opts = {
    package: undefined,
    tarball: undefined,
    config: join(REPO_ROOT, "config", "exports.json"),
    expectAll: false,
    resolvers: ALL_RESOLVERS,
    workDir: join(tmpdir(), "plrnui-subpath-smoke"),
    json: undefined,
    markdown: undefined,
    selfTest: false,
  };
  const value = (i, flag) => {
    if (typeof argv[i + 1] !== "string" || argv[i + 1].startsWith("--")) throw new UsageError(`${flag} needs a value`);
    return argv[i + 1];
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--package") opts.package = value(i++, arg);
    else if (arg === "--tarball") opts.tarball = resolve(value(i++, arg));
    else if (arg === "--config") opts.config = resolve(value(i++, arg));
    else if (arg === "--expect-all") opts.expectAll = true;
    else if (arg === "--resolvers") opts.resolvers = value(i++, arg).split(",").filter(Boolean);
    else if (arg === "--work-dir") opts.workDir = resolve(value(i++, arg));
    else if (arg === "--json") opts.json = resolve(value(i++, arg));
    else if (arg === "--markdown") opts.markdown = resolve(value(i++, arg));
    else if (arg === "--self-test") opts.selfTest = true;
    else throw new UsageError(`unknown argument: ${arg}`);
  }
  const unknown = opts.resolvers.filter((r) => !ALL_RESOLVERS.includes(r));
  if (unknown.length > 0 || opts.resolvers.length === 0) throw new UsageError(`unknown resolver: ${unknown.join(", ") || "(none)"}`);
  return opts;
}

function run(command, args, { cwd = REPO_ROOT, env = {}, timeout, capture = true } = {}) {
  const result = spawnSync(command, args, {
    cwd,
    env: { ...process.env, ...env },
    encoding: "utf8",
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    timeout,
    maxBuffer: 64 * 1024 * 1024,
  });
  return { status: result.status ?? 1, stdout: result.stdout ?? "", stderr: result.stderr ?? "", error: result.error };
}

function runOrThrow(command, args, options) {
  const result = run(command, args, options);
  if (result.status !== 0) {
    throw new Error(`Command failed (${result.status}): ${[command, ...args].join(" ")}\n${result.stdout}\n${result.stderr}`);
  }
  return result;
}

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
const writeJson = (file, value) => writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
const firstLine = (text) => (text.split(/\r?\n/).find((line) => line.trim()) ?? "").trim().slice(0, 300);

// ---- subpath selection -------------------------------------------------------------------------------------------

function walkDist(dir, base = dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walkDist(full, base, out);
    else out.push(full.slice(base.length + 1));
  }
  return out;
}

// Subpaths the matrix must cover. Config subpaths the repo cannot emit yet (no source entry, see generate-exports.mjs)
// are reported as pending, not as failures, unless --expect-all is given. A "*" pattern expands to the concrete
// directories present in the installed package.
async function selectSubpaths(opts, packageDir) {
  const config = readJson(opts.config);
  const declared = Object.keys(config.subpaths ?? {});
  if (declared.length === 0) throw new UsageError(`${opts.config} declares no subpaths`);
  let emitted = new Set(declared);
  if (!opts.expectAll) {
    const { generate } = await import(pathToFileURL(join(REPO_ROOT, "scripts", "generate-exports.mjs")).href);
    emitted = new Set(Object.keys(generate(config, REPO_ROOT).fields.exports));
  }
  const rows = [];
  for (const key of declared) {
    if (!emitted.has(key)) {
      rows.push({ subpath: key, pending: "no source entry yet (not emitted by generate-exports)" });
      continue;
    }
    if (!key.includes("*")) {
      rows.push({ subpath: key });
      continue;
    }
    const target = config.subpaths[key]?.conditions?.import ?? "";
    const [head, tail] = target.replace(/^\.\//, "").split("*");
    const names = new Set();
    for (const file of walkDist(packageDir)) {
      if (file.startsWith(head) && file.endsWith(tail)) names.add(file.slice(head.length, file.length - tail.length));
    }
    if (names.size === 0) rows.push({ subpath: key, pending: "pattern matches no file in the package" });
    for (const name of [...names].sort()) rows.push({ subpath: key.replace("*", name), pattern: key });
  }
  const peers = new Set();
  for (const entry of Object.values(config.subpaths)) {
    for (const name of [...(entry.peers?.required ?? []), ...(entry.peers?.optional ?? [])]) peers.add(name);
  }
  return { rows, peers: [...peers].sort() };
}

const specifierFor = (packageName, subpath) => (subpath === "." ? packageName : `${packageName}/${subpath.replace(/^\.\//, "")}`);

// ---- resolvers ----------------------------------------------------------------------------------------------------
// Each resolver returns { [subpath]: { ok: boolean, detail?: string } } for the active rows.

const NODE_RUNNER = `
import { register } from "node:module";
import { readFileSync } from "node:fs";
const cfg = JSON.parse(readFileSync(process.argv[2], "utf8"));
register("./stub-hooks.mjs", import.meta.url, { data: cfg });
const results = {};
for (const { subpath, specifier } of cfg.targets) {
  try {
    if (specifier.endsWith(".json")) {
      const url = import.meta.resolve(specifier);
      if (!url.startsWith("file:")) throw new Error("resolved to " + url);
    } else {
      await import(specifier);
    }
    results[subpath] = { ok: true };
  } catch (error) {
    results[subpath] = { ok: false, detail: String(error?.code ?? "") + " " + String(error?.message ?? error).split("\\n")[0] };
  }
}
process.stdout.write("\\n@@RESULT@@" + JSON.stringify(results));
`;

// Peers (react, react-native, optional adapters) are replaced by callable deep proxies so importing the package under
// plain Node never executes Flow sources; package-internal specifiers are still resolved by Node itself.
const STUB_HOOKS = `
let cfg;
export function initialize(data) { cfg = data; }
const isPeer = (spec) => cfg.peers.some((p) => spec === p || spec.startsWith(p + "/"));
export function resolve(specifier, context, next) {
  if (isPeer(specifier)) return { url: "plrnui-stub:" + encodeURIComponent(specifier), shortCircuit: true };
  return next(specifier, context);
}
export function load(url, context, next) {
  if (!url.startsWith("plrnui-stub:")) return next(url, context);
  const specifier = decodeURIComponent(url.slice("plrnui-stub:".length));
  const names = cfg.names[specifier] ?? [];
  const source = [
    "const make = () => new Proxy(function () {}, { get: (_t, key) => (key === Symbol.toPrimitive ? () => 0 : key === 'then' ? undefined : make()), apply: () => make(), construct: () => make() });",
    "export default make();",
    ...names.map((name) => "export const " + name + " = make();"),
  ].join("\\n");
  return { format: "module", source, shortCircuit: true };
}
`;

// Named imports of peers found in the installed dist, so the stubs can satisfy static ESM named-import linking.
function collectPeerNames(packageDir, peers) {
  const names = Object.fromEntries(peers.map((p) => [p, new Set()]));
  for (const file of walkDist(join(packageDir, "dist"))) {
    if (!file.endsWith(".js")) continue;
    const text = readFileSync(join(packageDir, "dist", file), "utf8");
    for (const match of text.matchAll(/import\s+(?:[\w$]+\s*,\s*)?\{([^}]*)\}\s*from\s*["']([^"']+)["']/g)) {
      const peer = peers.find((p) => match[2] === p || match[2].startsWith(`${p}/`));
      if (!peer) continue;
      for (const part of match[1].split(",")) {
        const name = part.trim().split(/\s+as\s+/)[0].trim();
        if (/^[A-Za-z_$][\w$]*$/.test(name) && name !== "default") names[match[2]] = (names[match[2]] ?? new Set()).add(name);
      }
    }
  }
  return Object.fromEntries(Object.entries(names).map(([k, v]) => [k, [...v]]));
}

function resolveNode(ctx) {
  const dir = join(ctx.consumerDir, "node-check");
  mkdirSync(dir, { recursive: true });
  const cfgFile = join(dir, "config.json");
  writeFileSync(join(dir, "runner.mjs"), NODE_RUNNER);
  writeFileSync(join(dir, "stub-hooks.mjs"), STUB_HOOKS);
  writeJson(cfgFile, {
    peers: ctx.peers,
    names: collectPeerNames(ctx.packageDir, ctx.peers),
    targets: ctx.rows.map((row) => ({ subpath: row.subpath, specifier: specifierFor(ctx.packageName, row.subpath) })),
  });
  const result = run(process.execPath, [join(dir, "runner.mjs"), cfgFile], { cwd: ctx.consumerDir });
  const marker = result.stdout.lastIndexOf("@@RESULT@@");
  if (marker === -1) return failAll(ctx, `node runner crashed: ${firstLine(result.stderr) || firstLine(result.stdout)}`);
  return JSON.parse(result.stdout.slice(marker + "@@RESULT@@".length));
}

function failAll(ctx, detail) {
  return Object.fromEntries(ctx.rows.map((row) => [row.subpath, { ok: false, detail }]));
}

function resolveTsc(ctx, name, compilerOptions) {
  const dir = join(ctx.consumerDir, `tsc-${name}`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const files = new Map();
  const results = {};
  ctx.rows.forEach((row, index) => {
    if (row.subpath.endsWith(".json")) {
      results[row.subpath] = { ok: true, na: true, detail: "not a code subpath" };
      return;
    }
    const file = `s${index}.ts`;
    files.set(file, row.subpath);
    writeFileSync(join(dir, file), `import * as m from "${specifierFor(ctx.packageName, row.subpath)}";\nexport const probe: unknown = m;\n`);
  });
  writeJson(join(dir, "tsconfig.json"), {
    compilerOptions: {
      target: "ES2022",
      lib: ["ES2022"],
      jsx: "react-jsx",
      strict: true,
      noEmit: true,
      // Resolution is what is under test; peers' own declarations (react-native globals, optional peers) are not.
      skipLibCheck: true,
      types: [],
      ...compilerOptions,
    },
    include: [...files.keys()],
  });
  const tsc = join(ctx.consumerDir, "node_modules", "typescript", "bin", "tsc");
  const out = run(process.execPath, [tsc, "-p", join(dir, "tsconfig.json"), "--pretty", "false"], { cwd: dir });
  for (const subpath of files.values()) results[subpath] = { ok: true };
  const stray = [];
  for (const line of `${out.stdout}\n${out.stderr}`.split(/\r?\n/)) {
    const match = /^(?:.*[\\/])?(s\d+\.ts)\(\d+,\d+\): error (TS\d+): (.*)$/.exec(line);
    if (match && files.has(match[1])) results[files.get(match[1])] = { ok: false, detail: `${match[2]}: ${match[3]}`.slice(0, 300) };
    else if (/error TS\d+/.test(line)) stray.push(line.trim());
  }
  if (stray.length > 0 || (out.status !== 0 && !Object.values(results).some((r) => !r.ok))) {
    const detail = `tsc: ${stray[0] ?? firstLine(out.stderr) ?? `exit ${out.status}`}`.slice(0, 300);
    for (const subpath of files.values()) results[subpath] = { ok: false, detail };
  }
  return results;
}

const resolveTscBundler = (ctx) => resolveTsc(ctx, "bundler", { module: "ESNext", moduleResolution: "Bundler" });
const resolveTscNode16 = (ctx) => resolveTsc(ctx, "node16", { module: "Node16", moduleResolution: "Node16" });

function resolveMetro(ctx) {
  const dir = join(ctx.consumerDir, "metro-check");
  const exportOnce = (rows, label) => {
    const work = join(dir, label);
    rmSync(work, { recursive: true, force: true });
    mkdirSync(work, { recursive: true });
    writeFileSync(
      join(work, "index.js"),
      `${rows.map((row) => `require(${JSON.stringify(specifierFor(ctx.packageName, row.subpath))});`).join("\n")}\n`
    );
    writeJson(join(work, "package.json"), { name: `metro-${label}`, version: "0.0.0", main: "index.js" });
    writeJson(join(work, "app.json"), { expo: { name: label, slug: label, platforms: ["android"] } });
    // The entry lives under consumerDir/metro-check/<label>, so Metro walks up to consumerDir/node_modules.
    return run(
      process.execPath,
      [join(ctx.consumerDir, "node_modules", "expo", "bin", "cli"), "export", "--platform", "android", "--no-bytecode", "--no-minify", "--output-dir", join(work, "out")],
      { cwd: work, env: { CI: "1", EXPO_NO_TELEMETRY: "1", EXPO_NO_GIT_STATUS: "1", NODE_ENV: "production" }, timeout: EXPORT_TIMEOUT_MS }
    );
  };
  const all = exportOnce(ctx.rows, "all");
  if (all.status === 0) return Object.fromEntries(ctx.rows.map((row) => [row.subpath, { ok: true }]));
  // The combined bundle failed: attribute the failure per subpath with one export each.
  const results = {};
  for (const [index, row] of ctx.rows.entries()) {
    const single = exportOnce([row], `s${index}`);
    results[row.subpath] = single.status === 0 ? { ok: true } : { ok: false, detail: firstLine(`${single.stderr}\n${single.stdout}`.split(/\r?\n/).filter((l) => /Unable to resolve|error|Error/.test(l)).join("\n")) || `expo export exit ${single.status}` };
  }
  return results;
}

const WEBPACK_RUNNER = `
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const webpack = require("webpack");
const cfg = JSON.parse(readFileSync(process.argv[2], "utf8"));
const isPeer = (request) => cfg.peers.some((p) => request === p || request.startsWith(p + "/"));
const results = {};
for (const { subpath, specifier, entry } of cfg.targets) {
  const compiler = webpack({
    mode: "development",
    devtool: false,
    target: "web",
    context: cfg.dir,
    entry,
    output: { path: cfg.dir + "/out/" + Buffer.from(subpath).toString("hex"), filename: "bundle.js" },
    externals: [({ request }, callback) => (isPeer(request) ? callback(null, "commonjs " + request) : callback())],
    resolve: { fullySpecified: true },
    module: { rules: [{ test: /\\.m?js$/, resolve: { fullySpecified: true } }] },
    infrastructureLogging: { level: "none" },
    stats: "errors-only",
  });
  results[subpath] = await new Promise((done) => {
    compiler.run((error, stats) => {
      compiler.close(() => {});
      if (error) return done({ ok: false, detail: String(error.message).split("\\n")[0] });
      if (stats.hasErrors()) {
        const first = stats.toJson({ all: false, errors: true }).errors[0];
        return done({ ok: false, detail: String(first?.message ?? "webpack error").split("\\n").filter(Boolean).slice(0, 2).join(" ").slice(0, 300) });
      }
      done({ ok: true });
    });
  });
}
process.stdout.write("\\n@@RESULT@@" + JSON.stringify(results));
`;

function resolveWebpack(ctx) {
  const dir = join(ctx.consumerDir, "webpack-check");
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  writeJson(join(dir, "package.json"), { name: "webpack-check", version: "0.0.0", private: true, type: "module" });
  const targets = ctx.rows.map((row, index) => {
    const entry = `./entry-${index}.js`;
    const specifier = specifierFor(ctx.packageName, row.subpath);
    writeFileSync(join(dir, entry), `import * as m from ${JSON.stringify(specifier)};\nexport default m;\n`);
    return { subpath: row.subpath, specifier, entry };
  });
  writeFileSync(join(dir, "runner.mjs"), WEBPACK_RUNNER);
  writeJson(join(dir, "config.json"), { dir, peers: ctx.peers, targets });
  const result = run(process.execPath, [join(dir, "runner.mjs"), join(dir, "config.json")], { cwd: dir });
  const marker = result.stdout.lastIndexOf("@@RESULT@@");
  if (marker === -1) return failAll(ctx, `webpack runner crashed: ${firstLine(result.stderr) || firstLine(result.stdout)}`);
  return JSON.parse(result.stdout.slice(marker + "@@RESULT@@".length));
}

const RESOLVERS = {
  node: resolveNode,
  "tsc-bundler": resolveTscBundler,
  "tsc-node16": resolveTscNode16,
  metro: resolveMetro,
  webpack5: resolveWebpack,
};

function runMatrix(ctx, resolvers) {
  const matrix = {};
  for (const name of resolvers) {
    console.error(`[subpath-smoke] ${name} ...`);
    try {
      matrix[name] = RESOLVERS[name](ctx);
    } catch (error) {
      matrix[name] = failAll(ctx, `${name} crashed: ${firstLine(String(error.message))}`);
    }
  }
  return matrix;
}

// ---- reporting ----------------------------------------------------------------------------------------------------

function buildReport(opts, packageName, rows, matrix, resolvers) {
  const entries = rows.map((row) => {
    if (row.pending) return { subpath: row.subpath, pending: row.pending };
    const cells = {};
    for (const name of resolvers) {
      const cell = matrix[name]?.[row.subpath] ?? { ok: false, detail: "no result" };
      cells[name] = cell.na ? { status: "n/a", detail: cell.detail } : cell.ok ? { status: "pass" } : { status: "fail", detail: cell.detail };
    }
    return { subpath: row.subpath, cells };
  });
  const failures = entries.flatMap((e) => Object.entries(e.cells ?? {}).filter(([, c]) => c.status === "fail").map(([r, c]) => ({ subpath: e.subpath, resolver: r, detail: c.detail })));
  const covered = entries.filter((e) => e.cells).length;
  return { package: packageName, resolvers, covered, failures, ok: failures.length === 0 && covered > 0, entries };
}

function toMarkdown(report) {
  const head = `| subpath | ${report.resolvers.join(" | ")} |`;
  const lines = [`## Subpath resolution matrix: ${report.package}`, "", head, `|${"---|".repeat(report.resolvers.length + 1)}`];
  for (const entry of report.entries) {
    if (entry.pending) lines.push(`| \`${entry.subpath}\` | ${report.resolvers.map(() => "pending").join(" | ")} |`);
    else lines.push(`| \`${entry.subpath}\` | ${report.resolvers.map((r) => entry.cells[r].status).join(" | ")} |`);
  }
  for (const entry of report.entries.filter((e) => e.pending)) lines.push("", `pending \`${entry.subpath}\`: ${entry.pending}`);
  for (const f of report.failures) lines.push("", `FAIL \`${f.subpath}\` [${f.resolver}]: ${f.detail}`);
  lines.push("", report.ok ? `Result: PASS (${report.covered} subpaths x ${report.resolvers.length} resolvers)` : `Result: FAIL (${report.failures.length} failing cells, ${report.covered} subpaths covered)`);
  return `${lines.join("\n")}\n`;
}

// ---- self-test ----------------------------------------------------------------------------------------------------
// Mutates the installed copy and requires the matrix to notice: a subpath removed from package.json "exports", and a
// ".js" removed from a relative specifier inside dist.

function selfTest(ctx, resolvers) {
  const quick = resolvers.filter((r) => r !== "metro");
  const findings = [];
  const packageJsonFile = join(ctx.packageDir, "package.json");
  const original = readFileSync(packageJsonFile, "utf8");
  const pkg = JSON.parse(original);
  const victim = ctx.rows.find((row) => !row.pending && row.subpath !== "." && !row.subpath.endsWith(".json"));
  if (victim && pkg.exports?.[victim.subpath]) {
    const mutated = structuredClone(pkg);
    delete mutated.exports[victim.subpath];
    writeFileSync(packageJsonFile, JSON.stringify(mutated, null, 2));
    const matrix = runMatrix({ ...ctx, rows: [victim] }, quick);
    writeFileSync(packageJsonFile, original);
    const caught = quick.filter((r) => matrix[r]?.[victim.subpath]?.ok === false);
    findings.push({ mutation: `removed export ${victim.subpath}`, caught, ok: caught.length === quick.length });
  } else findings.push({ mutation: "removed export", caught: [], ok: false, detail: "no non-root subpath available to remove" });

  const mainTarget = join(ctx.packageDir, String(pkg.exports?.["."]?.import ?? "dist/index.js"));
  const source = readFileSync(mainTarget, "utf8");
  const specifier = /(from\s+["'])(\.{1,2}\/[^"']+)\.js(["'])/.exec(source);
  if (specifier) {
    writeFileSync(mainTarget, source.replace(specifier[0], `${specifier[1]}${specifier[2]}${specifier[3]}`));
    const root = ctx.rows.find((row) => row.subpath === ".") ?? ctx.rows[0];
    const matrix = runMatrix({ ...ctx, rows: [root] }, quick);
    writeFileSync(mainTarget, source);
    const caught = quick.filter((r) => matrix[r]?.[root.subpath]?.ok === false);
    // tsc tolerates extensionless relative imports inside declarations/bundler mode, so the ESM resolvers must catch it.
    const required = quick.filter((r) => r === "node" || r === "webpack5");
    findings.push({ mutation: `removed .js from ${specifier[2]} in ${pkg.exports["."].import}`, caught, ok: required.every((r) => caught.includes(r)) && caught.length > 0 });
  } else findings.push({ mutation: "removed .js specifier", caught: [], ok: false, detail: "no relative .js specifier in the root entry" });
  return findings;
}

// ---- main ---------------------------------------------------------------------------------------------------------

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const repoPackage = readJson(join(REPO_ROOT, "package.json"));
  const installSpec = opts.package ?? repoPackage.name;
  // The bare name (without a version or tag) is what consumers import.
  const packageName = installSpec.replace(/^(@?[^@]+)@.*$/, "$1");
  const usesRepoPackage = packageName === repoPackage.name;

  const consumerDir = join(opts.workDir, "consumer");
  rmSync(opts.workDir, { recursive: true, force: true });
  mkdirSync(consumerDir, { recursive: true });

  let dependency = installSpec;
  if (opts.tarball) {
    if (!existsSync(opts.tarball)) throw new UsageError(`tarball not found: ${opts.tarball}`);
    dependency = `file:${opts.tarball}`;
  } else if (usesRepoPackage) {
    console.error("[subpath-smoke] building and packing the repository ...");
    runOrThrow("npm", ["run", "build"], { timeout: INSTALL_TIMEOUT_MS });
    const artifacts = join(opts.workDir, "artifacts");
    mkdirSync(artifacts, { recursive: true });
    const packed = runOrThrow("npm", ["pack", "--json", "--pack-destination", artifacts]);
    // prepack scripts print before the JSON array, so parse from the last line that opens it.
    const jsonStart = packed.stdout.lastIndexOf("\n[");
    const filename = JSON.parse(packed.stdout.slice(jsonStart === -1 ? 0 : jsonStart + 1))[0].filename;
    dependency = `file:${join(artifacts, filename)}`;
  }

  writeJson(join(consumerDir, "package.json"), {
    name: "plrnui-subpath-smoke-consumer",
    version: "0.0.0",
    private: true,
    type: "module",
    dependencies: {
      [packageName]: dependency.startsWith("file:") ? dependency : installSpec.slice(packageName.length).replace(/^@/, "") || "latest",
      react: "19.2.3",
      "react-native": "0.86.3",
    },
    devDependencies: {
      "@types/react": "19.2.17",
      typescript: "6.0.3",
      webpack: "5.112.0",
      ...(opts.resolvers.includes("metro") ? { expo: "57.0.21", "react-dom": "19.2.3", "react-native-web": "0.21.2" } : {}),
    },
  });
  console.error("[subpath-smoke] installing the consumer (npm cache honored) ...");
  runOrThrow("npm", ["install", "--no-audit", "--no-fund", "--ignore-scripts", "--package-lock=false", "--prefer-offline"], {
    cwd: consumerDir,
    timeout: INSTALL_TIMEOUT_MS,
  });

  const packageDir = join(consumerDir, "node_modules", ...packageName.split("/"));
  if (!existsSync(join(packageDir, "package.json")) || !statSync(packageDir).isDirectory()) throw new Error(`${packageName} was not installed`);
  const { rows, peers } = await selectSubpaths(opts, packageDir);
  const ctx = { consumerDir, packageDir, packageName, peers, rows: rows.filter((row) => !row.pending) };
  const matrix = runMatrix(ctx, opts.resolvers);
  const report = buildReport(opts, packageName, rows, matrix, opts.resolvers);

  let selfTestFindings;
  if (opts.selfTest) {
    selfTestFindings = selfTest(ctx, opts.resolvers);
    report.selfTest = selfTestFindings;
    if (selfTestFindings.some((f) => !f.ok)) report.ok = false;
  }

  const markdown = toMarkdown(report);
  process.stdout.write(markdown);
  for (const f of selfTestFindings ?? []) process.stdout.write(`self-test: ${f.ok ? "caught" : "NOT CAUGHT"} ${f.mutation} (${f.caught.join(", ") || "none"})${f.detail ? ` ${f.detail}` : ""}\n`);
  if (opts.markdown) writeFileSync(opts.markdown, markdown);
  if (opts.json) writeJson(opts.json, report);
  process.exitCode = report.ok ? 0 : 1;
}

main().catch((error) => {
  console.error(error instanceof UsageError ? `usage error: ${error.message}` : error.stack ?? error);
  process.exitCode = error instanceof UsageError ? 2 : 1;
});
