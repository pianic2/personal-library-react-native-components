#!/usr/bin/env node
// Public API snapshots (PLRNUI-315).
//
// Two outputs:
//   audit/api/snapshots/<subpath>.snapshot   one per entry of package.json "exports" that has a "types" file. Built with
//                                            the TypeScript compiler API, so `export *`, renamed exports and re-exports are
//                                            expanded, and each line carries a hash of the export's shape. Lines:
//                                            `<kind> <name> <hash>` (kind: type | class | function | const | enum | namespace).
//   audit/api/public-root-api.snapshot       the legacy regex name list of src/index.ts, kept for the backward diff.
//
// The AUTHORITATIVE surface is the generated declaration files: the script emits the .d.ts of tsconfig.build.json (the build
// that is published) into a temporary directory and snapshots the "types" target of each exports entry from there, so what is
// recorded is what a consumer's compiler reads. It also verifies the package exports map against that emit (every "types"
// target must be emitted, every JS target must be an emitted module) and, as a PREFLIGHT, compares the export names of the
// source entry file with the declaration entry file (a mismatch means the declarations lost or gained an export).
// `--dist` snapshots the real ./dist folder instead of a temporary emit (use it on a built tree); `--packed` additionally runs
// `npm pack --dry-run` and verifies that the tarball would contain every exports target. The root is "root.snapshot";
// "./theme" is "theme.snapshot".
//
// Usage: node scripts/public-api-snapshot.mjs [--check] [--level names|shapes] [--dist] [--packed] [--root <dir>]
//   (no flag)  write the snapshots
//   --check    compare with the files on disk; exit 1 on drift, listing the changed lines
//   --level    shapes (default): the hash covers props / signatures. names: the hash column is omitted from the comparison,
//              so only added, removed or re-kinded exports count (a coarser level for noisy upgrades). It only changes
//              --check; the write run always emits the hashes.
// A type nested in a prop (`items: Foo[]`) prints by name: only a top-level alias is expanded, and exported types have their own line.
// Only `./dist/<x>.d.ts` type targets are supported. The hashes include the rendered form of inherited
// React / React Native types, so a bump of react-native, @types/react or typescript can change them (use --level names then).
//   --root     project root (default: the current directory); used by the tests.
// Exit 0 ok, 1 drift, 2 usage or input errors.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import ts from "typescript";

class UsageError extends Error {}

// Cannot find module (2307, 2792), no exported member (2305), untyped JS module (7016): each turns types into `any` or drops them.
const UNRESOLVED_CODES = [2305, 2307, 2792, 7016];

function parseArgs(argv) {
  const opts = { check: false, level: "shapes", root: process.cwd(), dist: false, packed: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--check") opts.check = true;
    else if (arg === "--dist") opts.dist = true;
    else if (arg === "--packed") {
      opts.packed = true;
      opts.dist = true;
    }
    else if (arg === "--level" || arg === "--root") {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith("--")) throw new UsageError(`${arg} needs a value`);
      i += 1;
      if (arg === "--level") {
        if (value !== "names" && value !== "shapes") throw new UsageError(`--level must be names or shapes (got ${value})`);
        opts.level = value;
      } else opts.root = path.resolve(value);
    } else throw new UsageError(`unknown argument: ${arg}`);
  }
  return opts;
}

/** The legacy name list: regexes over src/index.ts. Kept byte for byte so the old snapshot keeps diffing. */
function legacySnapshot(root) {
  const source = fs.readFileSync(path.join(root, "src/index.ts"), "utf8");
  const entries = [];
  for (const match of source.matchAll(/export\s+(type\s+)?\{([\s\S]*?)\}\s+from\s+["'][^"']+["'];/g)) {
    const kind = match[1] ? "type" : "value";
    for (const raw of match[2].split(",")) {
      const token = raw.trim();
      if (!token) continue;
      const name = token.split(/\s+as\s+/).at(-1)?.trim();
      if (name) entries.push(`${kind}:${name}`);
    }
  }
  for (const match of source.matchAll(/export\s+const\s+([A-Za-z0-9_]+)/g)) entries.push(`value:${match[1]}`);
  entries.sort();
  return { text: entries.join("\n") + "\n", count: entries.length };
}

/**
 * The exports map: `{ name, types }` for every key with a "types" file (types is a path relative to ./dist, without the
 * leading "./dist/"), and `files`, every file target of the map (types, import, default, react-native, ...).
 */
function readExports(root) {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const subpaths = [];
  const files = new Set();
  const collect = (value) => {
    if (typeof value === "string") files.add(value);
    else if (value && typeof value === "object") Object.values(value).forEach(collect);
  };
  for (const [key, value] of Object.entries(pkg.exports ?? {})) {
    if (key !== "./package.json") collect(value);
    const types = value && typeof value === "object" ? value.types : undefined;
    if (typeof types !== "string") continue;
    const match = /^\.\/dist\/(.+\.d\.ts)$/.exec(types);
    if (!match) throw new UsageError(`exports["${key}"].types is not a ./dist/*.d.ts path: ${types}`);
    subpaths.push({ name: key === "." ? "root" : key.slice(2).replace(/\//g, "__"), types: match[1], source: match[1].replace(/\.d\.ts$/, ".ts") });
  }
  return { subpaths: subpaths.sort((a, b) => a.name.localeCompare(b.name)), files: [...files].sort() };
}

/**
 * Emits the declarations (and the JS file list) of the published build, tsconfig.build.json, into `outDir` using the compiler
 * API: nothing is written outside `outDir`, and only .d.ts files are written. Returns the set of emitted paths relative to
 * `outDir` (".js" and ".d.ts" files, no maps).
 */
function emitDeclarations(root, outDir) {
  const configPath = ["tsconfig.build.json", "tsconfig.json"].map((f) => path.join(root, f)).find((f) => fs.existsSync(f));
  if (!configPath) throw new UsageError("no tsconfig.build.json or tsconfig.json to emit declarations from");
  const read = ts.readConfigFile(configPath, ts.sys.readFile);
  if (read.error) throw new UsageError(`cannot read ${path.basename(configPath)}: ${ts.flattenDiagnosticMessageText(read.error.messageText, "\n")}`);
  const parsed = ts.parseJsonConfigFileContent(read.config, ts.sys, root);
  if (parsed.errors.length > 0) throw new UsageError(`${path.basename(configPath)}: ${ts.flattenDiagnosticMessageText(parsed.errors[0].messageText, " ")}`);
  const options = { ...parsed.options, declaration: true, declarationMap: false, sourceMap: false, noEmit: false, outDir };
  delete options.emitDeclarationOnly;
  const program = ts.createProgram({ rootNames: parsed.fileNames, options });
  const emitted = new Set();
  const result = program.emit(undefined, (fileName, text) => {
    const relative = path.relative(outDir, fileName).split(path.sep).join("/");
    if (relative.endsWith(".map")) return;
    emitted.add(relative);
    if (relative.endsWith(".d.ts")) {
      fs.mkdirSync(path.dirname(fileName), { recursive: true });
      fs.writeFileSync(fileName, text);
    }
  });
  if (result.emitSkipped) throw new UsageError("the declaration emit was skipped (compile errors?)");
  const emitErrors = result.diagnostics.filter((d) => d.category === ts.DiagnosticCategory.Error);
  if (emitErrors.length > 0) throw new UsageError(`declaration emit error: ${ts.flattenDiagnosticMessageText(emitErrors[0].messageText, " ")}`);
  return emitted;
}

function walkFiles(dir, base = dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walkFiles(full, base) : [path.relative(base, full).split(path.sep).join("/")];
  });
}

const hash = (text) => createHash("sha256").update(text).digest("hex").slice(0, 12);

function createProgram(root, entries, overrides = {}) {
  const configPath = path.join(root, "tsconfig.json");
  let options = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.ReactJSX, strict: true, skipLibCheck: true, noEmit: true };
  if (fs.existsSync(configPath)) {
    const read = ts.readConfigFile(configPath, ts.sys.readFile);
    if (read.error) throw new UsageError(`cannot read tsconfig.json: ${ts.flattenDiagnosticMessageText(read.error.messageText, "\n")}`);
    options = { ...ts.parseJsonConfigFileContent(read.config, ts.sys, root).options, noEmit: true };
  }
  return ts.createProgram({ rootNames: entries, options: { ...options, ...overrides } });
}

/** Everything before this separator in a rendered type is project-relative; absolute paths would differ per machine. */
let scrubRoots = [];
function clean(text) {
  let out = text;
  for (const [needle, token] of scrubRoots) out = out.split(needle).join(token);
  return out.replace(/\s+/g, " ").trim();
}

function describeExport(checker, symbol, root) {
  const resolved = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  const flags = resolved.flags;
  const declaration = resolved.valueDeclaration ?? resolved.declarations?.[0];
  // InTypeAlias prints the definition of a top-level alias (a union of literals, a mapped type) instead of its bare name, so
  // changing the members of `type Mode = "a" | "b"` changes every hash that mentions it at the top level of a prop.
  const format = ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope | ts.TypeFormatFlags.InTypeAlias;
  const show = (type) => clean(checker.typeToString(type, declaration, format), root);
  const signaturesOf = (type, kind) => checker.getSignaturesOfType(type, kind).map((sig) => clean(checker.signatureToString(sig, declaration, format), root));
  const propsOf = (type) =>
    checker.getPropertiesOfType(type).map((prop) => {
      const propDecl = prop.valueDeclaration ?? prop.declarations?.[0] ?? declaration;
      const optional = prop.flags & ts.SymbolFlags.Optional ? "?" : "";
      const readonly = propDecl && (ts.getCombinedModifierFlags(propDecl) & ts.ModifierFlags.Readonly) !== 0 ? "readonly " : "";
      return `${readonly}${prop.getName()}${optional}: ${show(checker.getTypeOfSymbolAtLocation(prop, propDecl))}`;
    });
  const lines = [];

  if (flags & (ts.SymbolFlags.Interface | ts.SymbolFlags.TypeAlias)) {
    const type = checker.getDeclaredTypeOfSymbol(resolved);
    const parts = [];
    const typeParameters = (resolved.declarations ?? []).flatMap((d) => (ts.isInterfaceDeclaration(d) || ts.isTypeAliasDeclaration(d) ? (d.typeParameters ?? []).map((tp) => clean(tp.getText(), root)) : []));
    if (typeParameters.length > 0) parts.push(`<${typeParameters.join(", ")}>`);
    const props = propsOf(type);
    const primitive = (type.flags & (ts.TypeFlags.StringLike | ts.TypeFlags.NumberLike | ts.TypeFlags.BigIntLike | ts.TypeFlags.BooleanLike | ts.TypeFlags.ESSymbolLike)) !== 0;
    const objectLike = props.length > 0 && !type.isUnion() && !primitive;
    // A union, a mapped or conditional alias and an empty object are their definition; an object type is its members.
    if (!objectLike) {
      const alias = (resolved.declarations ?? []).find((d) => ts.isTypeAliasDeclaration(d));
      parts.push(alias ? `= ${clean(alias.type.getText(), root)}` : show(type));
    }
    parts.push(...signaturesOf(type, ts.SignatureKind.Call).map((sig) => `call ${sig}`));
    parts.push(...signaturesOf(type, ts.SignatureKind.Construct).map((sig) => `new ${sig}`));
    parts.push(...checker.getIndexInfosOfType(type).map((info) => `${info.isReadonly ? "readonly " : ""}[${show(info.keyType)}]: ${show(info.type)}`));
    // Only an object type is its members: the "members" of a union of literals are the apparent members of String (lib typings).
    if (objectLike) parts.push(...props.sort());
    lines.push(["type", parts.join("; ")]);
  }
  if (flags & ts.SymbolFlags.Class) {
    const instance = checker.getDeclaredTypeOfSymbol(resolved);
    const statics = checker.getTypeOfSymbolAtLocation(resolved, declaration);
    lines.push(["class", [show(statics), ...signaturesOf(statics, ts.SignatureKind.Construct).map((sig) => `new ${sig}`), ...propsOf(instance).sort()].join("; ")]);
  }
  if (flags & ts.SymbolFlags.Function) {
    // Overload order is part of the contract (the first matching overload wins), so it is kept.
    lines.push(["function", signaturesOf(checker.getTypeOfSymbolAtLocation(resolved, declaration), ts.SignatureKind.Call).join(" | ")]);
  }
  if (flags & ts.SymbolFlags.Enum) {
    const members = (resolved.exports ? [...resolved.exports.values()] : []).map((member) => `${member.getName()}=${String(checker.getConstantValue(member.valueDeclaration))}`).sort();
    lines.push(["enum", members.join(",")]);
  }
  if (flags & ts.SymbolFlags.Variable) {
    lines.push(["const", show(checker.getTypeOfSymbolAtLocation(resolved, declaration))]);
  }
  if (flags & ts.SymbolFlags.NamespaceModule && !(flags & (ts.SymbolFlags.Function | ts.SymbolFlags.Class | ts.SymbolFlags.Enum))) {
    const members = (resolved.exports ? [...resolved.exports.keys()] : []).sort().join(",");
    lines.push(["namespace", members]);
  }
  return lines;
}

/** The snapshot of one entry file: sorted `kind name hash` lines. */
function snapshotOf(program, entry, root) {
  const checker = program.getTypeChecker();
  const file = program.getSourceFile(entry);
  if (!file) throw new UsageError(`cannot load ${path.relative(root, entry)}`);
  const moduleSymbol = checker.getSymbolAtLocation(file);
  if (!moduleSymbol) throw new UsageError(`${path.relative(root, entry)} is not a module`);
  const rows = [];
  for (const symbol of checker.getExportsOfModule(moduleSymbol)) {
    for (const [kind, shape] of describeExport(checker, symbol, root)) rows.push({ kind, name: symbol.getName(), hash: hash(shape) });
  }
  rows.sort((a, b) => (a.name === b.name ? a.kind.localeCompare(b.kind) : a.name < b.name ? -1 : 1));
  return rows.map((row) => `${row.kind} ${row.name} ${row.hash}`).join("\n") + (rows.length > 0 ? "\n" : "");
}

/** The comparable form of a snapshot at a level: names drops the hash column. */
function atLevel(text, level) {
  const lines = text.split("\n").filter(Boolean);
  return new Set(level === "names" ? lines.map((line) => line.split(" ").slice(0, 2).join(" ")) : lines);
}

/** `kind name` pairs of a snapshot text, for the preflight comparison. */
const namesOf = (text) => new Set(text.split("\n").filter(Boolean).map((line) => line.split(" ").slice(0, 2).join(" ")));

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const { root } = opts;
  const dir = path.join(root, "audit/api/snapshots");
  const { subpaths, files } = readExports(root);
  if (subpaths.length === 0) throw new UsageError("package.json has no exports with a types file");

  // A run that was killed leaves its temporary emit behind; remove stale ones first.
  for (const name of fs.readdirSync(root)) if (name.startsWith(".api-snapshot-")) fs.rmSync(path.join(root, name), { recursive: true, force: true });

  // Declarations: a temporary emit of the published build, or the real ./dist with --dist. The temporary directory is inside
  // the project so the declarations resolve react / react-native from the project's node_modules.
  const tmp = opts.dist ? undefined : fs.mkdtempSync(path.join(root, ".api-snapshot-"));
  try {
    const declRoot = opts.dist ? path.join(root, "dist") : tmp;
    if (opts.dist && !fs.existsSync(declRoot)) throw new UsageError("--dist needs a built ./dist (run npm run build first)");
    const produced = opts.dist ? new Set(walkFiles(declRoot).filter((f) => !f.endsWith(".map"))) : emitDeclarations(root, tmp);
    // The declaration root is scrubbed under one token so the temporary emit and a real ./dist render identically.
    scrubRoots = [[declRoot, "<decl>"], [root, "<root>"]];

    const structure = [];
    for (const target of files) {
      const match = /^\.\/dist\/(.+)$/.exec(target);
      if (!match) {
        structure.push(`exports target ${target} is not under ./dist/`);
        continue;
      }
      if (!produced.has(match[1])) structure.push(`exports target ${target} is not produced by the build`);
    }
    if (opts.packed) {
      let listed;
      try {
        const out = execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
        listed = new Set(JSON.parse(out)[0].files.map((f) => f.path));
      } catch (error) {
        throw new UsageError(`npm pack --dry-run failed: ${error.message}`);
      }
      for (const target of files) if (!listed.has(target.replace(/^\.\//, ""))) structure.push(`exports target ${target} would not be in the packed tarball`);
    }

    const entries = subpaths.map((t) => ({ ...t, entry: path.join(declRoot, t.types) }));
    const missing = entries.filter((t) => !fs.existsSync(t.entry));
    for (const t of missing) structure.push(`exports types target ./dist/${t.types} is not produced by the build`);
    const present = entries.filter((t) => fs.existsSync(t.entry));

    // skipLibCheck would also skip the diagnostics of our own .d.ts files, so it is off here; only the declaration files under
    // the declaration root are asked for diagnostics (not node_modules).
    const program = createProgram(root, present.map((t) => t.entry), { skipLibCheck: false });
    // An unresolved import turns its types into `any`; a snapshot written that way would silently weaken the gate.
    const unresolved = program
      .getSourceFiles()
      .filter((f) => f.isDeclarationFile && path.resolve(f.fileName).startsWith(`${path.resolve(declRoot)}${path.sep}`))
      .flatMap((f) => program.getSemanticDiagnostics(f))
      .filter((d) => UNRESOLVED_CODES.includes(d.code));
    if (unresolved.length > 0) {
      throw new UsageError(`${unresolved.length} unresolved module import(s), is npm ci done? First: ${ts.flattenDiagnosticMessageText(unresolved[0].messageText, " ")}`);
    }
    const outputs = new Map(present.map((t) => [path.join(dir, `${t.name}.snapshot`), snapshotOf(program, t.entry, root)]));

    // Preflight: the export names of the source entry file must equal those of the declarations.
    const preflight = [];
    const withSource = present.filter((t) => fs.existsSync(path.join(root, "src", t.source)));
    if (withSource.length > 0) {
      scrubRoots = [[root, "<root>"]];
      const sourceProgram = createProgram(root, withSource.map((t) => path.join(root, "src", t.source)));
      for (const t of withSource) {
        const fromSource = namesOf(snapshotOf(sourceProgram, path.join(root, "src", t.source), root));
        const fromDecl = namesOf(outputs.get(path.join(dir, `${t.name}.snapshot`)));
        for (const name of fromSource) if (!fromDecl.has(name)) preflight.push(`${t.name}: ${name} is in the source but not in the declarations`);
        for (const name of fromDecl) if (!fromSource.has(name)) preflight.push(`${t.name}: ${name} is in the declarations but not in the source`);
      }
    }

    const legacyTarget = path.join(root, "audit/api/public-root-api.snapshot");
    const legacy = legacySnapshot(root);

    if (!opts.check) {
      if (structure.length > 0 || preflight.length > 0) {
        console.error("Refusing to write snapshots:");
        for (const problem of [...structure, ...preflight]) console.error(`  ${problem}`);
        return 1;
      }
      fs.mkdirSync(dir, { recursive: true });
      for (const file of fs.existsSync(dir) ? fs.readdirSync(dir) : []) {
        const full = path.join(dir, file);
        if (file.endsWith(".snapshot") && !outputs.has(full)) fs.rmSync(full);
      }
      for (const [file, text] of outputs) fs.writeFileSync(file, text);
      fs.writeFileSync(legacyTarget, legacy.text);
      console.log(`Wrote ${outputs.size} subpath snapshot(s) to audit/api/snapshots and ${legacy.count} root exports to audit/api/public-root-api.snapshot`);
      return 0;
    }

    const problems = [...structure, ...preflight.map((p) => `preflight: ${p}`)];
    for (const [file, expected] of outputs) {
      const rel = path.relative(root, file);
      if (!fs.existsSync(file)) {
        problems.push(`${rel}: missing`);
        continue;
      }
      const actual = atLevel(fs.readFileSync(file, "utf8"), opts.level);
      const wanted = atLevel(expected, opts.level);
      for (const line of wanted) if (!actual.has(line)) problems.push(`${rel}: + ${line}`);
      for (const line of actual) if (!wanted.has(line)) problems.push(`${rel}: - ${line}`);
    }
    if (fs.existsSync(dir)) {
      for (const file of fs.readdirSync(dir)) {
        if (file.endsWith(".snapshot") && !outputs.has(path.join(dir, file))) problems.push(`audit/api/snapshots/${file}: stale (no matching subpath)`);
      }
    }
    const legacyActual = fs.existsSync(legacyTarget) ? fs.readFileSync(legacyTarget, "utf8") : "";
    if (legacyActual !== legacy.text) problems.push("audit/api/public-root-api.snapshot: differs from src/index.ts");

    if (problems.length > 0) {
      console.error("Public API snapshot drift detected (+ expected by the declarations, - found in the snapshot file):");
      for (const problem of problems) console.error(`  ${problem}`);
      console.error("Run npm run api:snapshot and review the explicit diff.");
      return 1;
    }
    const total = [...outputs.values()].reduce((n, text) => n + text.split("\n").filter(Boolean).length, 0);
    console.log(`Public API snapshot consistent (${outputs.size} subpath(s), ${total} exports from ${opts.dist ? "./dist" : "the emitted declarations"}${opts.packed ? ", packed tarball checked" : ""}, ${legacy.count} legacy root names, level ${opts.level}).`);
    return 0;
  } finally {
    if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
  }
}

try {
  process.exitCode = main();
} catch (error) {
  if (error instanceof UsageError) {
    console.error(`public-api-snapshot: ${error.message}`);
    process.exitCode = 2;
  } else {
    console.error(error);
    process.exitCode = 2;
  }
}
