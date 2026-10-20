#!/usr/bin/env node
// Export-parity gate for the legacy shim (PLRNUI-142, ADR 0013): every subpath of the generated shim must expose exactly the
// exports of the target package, in both directions, for values (runtime) and for types (TypeScript API).
//   node scripts/check-shim-parity.mjs [--target-dir <dir> | --target-tarball <tgz>] [--shim-dir <dir>] [--legacy-name <n>] [--json]
//
// Without options it builds the target declarations and JS (tsconfig.build.json) into a temporary package, generates the shim
// with scripts/build-shim.mjs in preparatory mode (placeholder legacy name) and lays both out as node_modules/<name> packages
// (the "tarball alias"). Then, per subpath:
//   runtime  both specifiers are imported in plain Node with react-native stubbed by tests/shims/register-rn-stub.mjs and the
//            sorted Object.keys of the namespaces are compared;
//   types    the TypeScript checker lists the exports of both modules; names must be equal and every shim export must resolve
//            to the very same symbol as the target's (type identity, not only name equality).
// The report prints the counts per subpath and checks them against audit/api/snapshots/<subpath>.snapshot (value lines are
// runtime keys, "type" lines are type-only exports). Subpaths the shim lists that the target package.json does not export yet
// are skipped in preparatory mode (no legacy name in config/package-identity.json) and fail otherwise.
//   --target-dir      a built target package directory (package.json + dist) instead of building one
//   --target-tarball  a packed target (npm pack) to extract and use
//   --shim-dir        an already generated shim directory instead of generating one (used by the mutation tests)
//   --json            print the report as JSON
// Exit codes: 0 parity, 1 a difference, 2 usage or unreadable input.
import { spawnSync } from "node:child_process";
import { copyFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";
import { readIdentity } from "./lib/identity.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

class UsageError extends Error {}

function parseArgs(argv) {
  const opts = { json: false };
  const flags = { "--target-dir": "targetDir", "--target-tarball": "tarball", "--shim-dir": "shimDir", "--legacy-name": "legacy" };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--json") { opts.json = true; continue; }
    const key = flags[argv[i]];
    const value = argv[i + 1];
    if (!key || value === undefined || value.startsWith("--")) throw new UsageError(`unknown or incomplete argument: ${argv[i]}`);
    opts[key] = key === "legacy" ? value : resolve(process.cwd(), value);
    i++;
  }
  if (opts.targetDir && opts.tarball) throw new UsageError("--target-dir and --target-tarball are mutually exclusive");
  return opts;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...options });
  if (result.status !== 0) throw new UsageError(`${command} ${args.slice(0, 3).join(" ")} failed: ${(result.stderr || result.stdout || "").trim().slice(0, 800)}`);
  return result.stdout;
}

/** A node_modules folder that links every package of the repository's, so type and runtime resolution work from the temp tree. */
function linkedModules(temp) {
  const modules = join(temp, "node_modules");
  mkdirSync(modules, { recursive: true });
  const source = join(root, "node_modules");
  for (const name of readdirSync(source)) if (!name.startsWith("@personal-library") && !name.startsWith(".")) symlinkSync(join(source, name), join(modules, name));
  return modules;
}

function layoutTarget(modules, targetName, opts, temp) {
  const dir = join(modules, ...targetName.split("/"));
  mkdirSync(dirname(dir), { recursive: true });
  if (opts.targetDir) {
    cpSync(opts.targetDir, dir, { recursive: true }); // copied, not linked: Node resolves symlinks to real paths and would lose node_modules
  } else if (opts.tarball) {
    mkdirSync(dir, { recursive: true });
    run("tar", ["-xzf", opts.tarball, "-C", dir, "--strip-components=1"]);
  } else {
    mkdirSync(join(dir), { recursive: true });
    run(process.execPath, [join(root, "node_modules/typescript/bin/tsc"), "-p", join(root, "tsconfig.build.json"), "--outDir", join(dir, "dist")], { cwd: root });
    copyFileSync(join(root, "package.json"), join(dir, "package.json"));
  }
  if (!existsSync(join(dir, "package.json")) || !existsSync(join(dir, "dist"))) throw new UsageError(`the target package at ${dir} has no package.json or dist`);
  return dir;
}

function layoutShim(modules, legacyName, opts, temp) {
  const dir = join(modules, ...legacyName.split("/"));
  mkdirSync(dirname(dir), { recursive: true });
  if (opts.shimDir) cpSync(opts.shimDir, dir, { recursive: true });
  else {
    const args = [join(root, "scripts/build-shim.mjs"), "--out", dir];
    if (opts.legacy) args.push("--legacy-name", opts.legacy);
    if (opts.tarball) args.push("--target-tarball", opts.tarball);
    run(process.execPath, args, { cwd: temp });
  }
  return dir;
}

function snapshotCounts(name) {
  const file = join(root, "audit/api/snapshots", `${name}.snapshot`);
  if (!existsSync(file)) return undefined;
  const counts = { values: 0, types: 0 };
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const kind = line.split(" ")[0];
    if (!kind) continue;
    if (kind === "type") counts.types++;
    else counts.values++;
  }
  return counts;
}

const snapshotName = (key) => (key === "." ? "root" : key.slice(2).replace(/\//g, "__"));

function runtimeKeys(temp, specifiers) {
  const runner = join(temp, "parity-runner.mjs");
  const code = `const out = {}; for (const s of JSON.parse(process.argv[2])) { try { out[s] = Object.keys(await import(s)).sort(); } catch (error) { out[s] = { error: String(error?.message ?? error) }; } } console.log("PARITY:" + JSON.stringify(out));`;
  writeFileSync(runner, code);
  const stdout = run(process.execPath, ["--import", pathToFileURL(join(root, "tests/shims/register-rn-stub.mjs")).href, runner, JSON.stringify(specifiers)], { cwd: temp });
  return JSON.parse(stdout.split("\n").find((l) => l.startsWith("PARITY:")).slice("PARITY:".length));
}

function typeExports(temp, pairs) {
  const entry = join(temp, "parity-probe.ts");
  const text = pairs.map(([shim, target], i) => `import * as S${i} from ${JSON.stringify(shim)};\nimport * as T${i} from ${JSON.stringify(target)};\nexport { S${i}, T${i} };\n`).join("");
  const options = { noEmit: true, strict: true, skipLibCheck: true, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, target: ts.ScriptTarget.ES2022, customConditions: ["react-native"], types: [] };
  const host = ts.createCompilerHost(options);
  const original = host.getSourceFile.bind(host);
  host.getSourceFile = (file, ...rest) => (file === entry ? ts.createSourceFile(file, text, ts.ScriptTarget.ES2022, true) : original(file, ...rest));
  host.fileExists = ((exists) => (file) => file === entry || exists(file))(host.fileExists.bind(host));
  const program = ts.createProgram([entry], options, host);
  const checker = program.getTypeChecker();
  const probe = program.getSourceFile(entry);
  const moduleOf = (specifier) => {
    const declaration = probe.statements.find((s) => ts.isImportDeclaration(s) && s.moduleSpecifier.text === specifier);
    return declaration && checker.getSymbolAtLocation(declaration.moduleSpecifier);
  };
  const resolve = (symbol) => (symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol);
  const listing = (specifier) => {
    const symbol = moduleOf(specifier);
    if (!symbol) return { error: `cannot resolve ${specifier}` };
    return { symbols: new Map(checker.getExportsOfModule(symbol).map((s) => [s.getName(), resolve(s)])) };
  };
  return pairs.map(([shim, target]) => {
    const s = listing(shim);
    const t = listing(target);
    if (s.error || t.error) return { error: s.error ?? t.error };
    const isValue = (symbol) => (symbol.flags & ts.SymbolFlags.Value) !== 0;
    const missingInShim = [...t.symbols.keys()].filter((n) => !s.symbols.has(n)).sort();
    const extraInShim = [...s.symbols.keys()].filter((n) => !t.symbols.has(n)).sort();
    const notIdentical = [...s.symbols].filter(([n, symbol]) => t.symbols.has(n) && t.symbols.get(n) !== symbol).map(([n]) => n).sort();
    return { missingInShim, extraInShim, notIdentical, values: [...t.symbols.values()].filter(isValue).length, types: [...t.symbols.values()].filter((x) => !isValue(x)).length };
  });
}

export function check(opts = {}) {
  const identity = readIdentity();
  const preparatory = identity.legacy === null && opts.legacy === undefined;
  const legacyName = opts.legacy ?? identity.legacy ?? "@legacy-placeholder/shim";
  const temp = mkdtempSync(join(tmpdir(), "shim-parity-"));
  try {
    const modules = linkedModules(temp);
    const targetDir = layoutTarget(modules, identity.current, opts, temp);
    const shimDir = layoutShim(modules, legacyName, opts, temp);
    const targetPkg = JSON.parse(readFileSync(join(targetDir, "package.json"), "utf8"));
    const shimPkg = JSON.parse(readFileSync(join(shimDir, "package.json"), "utf8"));
    const keys = Object.keys(shimPkg.exports ?? {}).filter((k) => k !== "./package.json");
    const targetKeys = Object.keys(targetPkg.exports ?? {}).filter((k) => k !== "./package.json");
    const problems = [];
    for (const key of targetKeys) if (!keys.includes(key)) problems.push(`${key}: the target exports it but the shim does not`);
    const rows = [];
    const compared = keys.filter((k) => targetKeys.includes(k));
    for (const key of keys.filter((k) => !targetKeys.includes(k))) {
      if (preparatory) rows.push({ key, skipped: "the target package.json does not export it yet (preparatory run)" });
      else problems.push(`${key}: the shim exports it but the target does not`);
    }
    const specifier = (name, key) => (key === "." ? name : `${name}${key.slice(1)}`);
    const pairs = compared.map((key) => [specifier(legacyName, key), specifier(identity.current, key)]);
    const runtime = pairs.length ? runtimeKeys(temp, pairs.flat()) : {};
    const types = pairs.length ? typeExports(temp, pairs) : [];
    compared.forEach((key, i) => {
      const [shimSpec, targetSpec] = pairs[i];
      const row = { key, snapshot: snapshotName(key) };
      const s = runtime[shimSpec];
      const t = runtime[targetSpec];
      if (!Array.isArray(s) || !Array.isArray(t)) problems.push(`${key}: import failed: ${(s?.error ?? t?.error) ?? "unknown"}`);
      else {
        row.values = t.length;
        const missing = t.filter((n) => !s.includes(n));
        const extra = s.filter((n) => !t.includes(n));
        if (missing.length) problems.push(`${key}: values missing in the shim: ${missing.join(", ")}`);
        if (extra.length) problems.push(`${key}: values only in the shim: ${extra.join(", ")}`);
      }
      const ty = types[i];
      if (ty.error) problems.push(`${key}: ${ty.error}`);
      else {
        row.types = ty.types;
        if (ty.missingInShim.length) problems.push(`${key}: exports (types) missing in the shim: ${ty.missingInShim.join(", ")}`);
        if (ty.extraInShim.length) problems.push(`${key}: exports (types) only in the shim: ${ty.extraInShim.join(", ")}`);
        if (ty.notIdentical.length) problems.push(`${key}: exports that are not the target's symbol: ${ty.notIdentical.join(", ")}`);
      }
      const expected = snapshotCounts(row.snapshot);
      row.snapshotCounts = expected;
      if (!expected) row.note = `no audit/api/snapshots/${row.snapshot}.snapshot`;
      else if (row.values !== undefined && row.types !== undefined && (expected.values !== row.values || expected.types !== row.types)) {
        problems.push(`${key}: counts differ from audit/api/snapshots/${row.snapshot}.snapshot (snapshot ${expected.values} values, ${expected.types} types; found ${row.values} values, ${row.types} types)`);
      }
      rows.push(row);
    });
    return { preparatory, legacyName, target: identity.current, rows, problems };
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const report = check(opts);
  if (opts.json) console.log(JSON.stringify(report, null, 2));
  else {
    console.log(`shim parity: ${report.legacyName} vs ${report.target}${report.preparatory ? " (preparatory run)" : ""}`);
    for (const row of report.rows) {
      if (row.skipped) console.log(`  ${row.key}: skipped, ${row.skipped}`);
      else console.log(`  ${row.key}: ${row.values} values, ${row.types} types${row.snapshotCounts ? ` (snapshot ${row.snapshot}: ${row.snapshotCounts.values} values, ${row.snapshotCounts.types} types)` : ` (${row.note})`}`);
    }
    for (const problem of report.problems) console.error(`shim parity: ${problem}`);
    console.log(`shim parity: ${report.rows.filter((r) => !r.skipped).length} subpath(s) compared, ${report.problems.length} problem(s)`);
  }
  return report.problems.length > 0 ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(`check-shim-parity: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
  }
}
