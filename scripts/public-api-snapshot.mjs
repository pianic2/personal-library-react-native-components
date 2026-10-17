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
// The entry file of a subpath is the source file behind its "types" target (./dist/x/index.d.ts -> src/x/index.ts), so the
// check needs no build. The root is "root.snapshot"; "./theme" is "theme.snapshot".
//
// Usage: node scripts/public-api-snapshot.mjs [--check] [--level names|shapes] [--root <dir>]
//   (no flag)  write the snapshots
//   --check    compare with the files on disk; exit 1 on drift, listing the changed lines
//   --level    shapes (default): the hash covers props / signatures. names: the hash column is omitted from the comparison,
//              so only added, removed or re-kinded exports count (a coarser level for noisy upgrades). It only changes
//              --check; the write run always emits the hashes.
// A type nested in a prop (`items: Foo[]`) prints by name: only a top-level alias is expanded, and exported types have their own line.
// Only `./dist/<x>.d.ts` -> `src/<x>.ts` type targets are supported. The hashes include the rendered form of inherited
// React / React Native types, so a bump of react-native, @types/react or typescript can change them (use --level names then).
//   --root     project root (default: the current directory); used by the tests.
// Exit 0 ok, 1 drift, 2 usage or input errors.
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import ts from "typescript";

class UsageError extends Error {}

function parseArgs(argv) {
  const opts = { check: false, level: "shapes", root: process.cwd() };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--check") opts.check = true;
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

/** `{ name, entry }` for every "exports" key with a "types" file that maps to an existing source file. */
function subpaths(root) {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const result = [];
  for (const [key, value] of Object.entries(pkg.exports ?? {})) {
    const types = value && typeof value === "object" ? value.types : undefined;
    if (typeof types !== "string") continue;
    const match = /^\.\/dist\/(.+)\.d\.ts$/.exec(types);
    if (!match) throw new UsageError(`exports["${key}"].types is not a ./dist/*.d.ts path: ${types}`);
    const entry = path.join(root, "src", `${match[1]}.ts`);
    if (!fs.existsSync(entry)) throw new UsageError(`exports["${key}"].types maps to ${path.relative(root, entry)}, which does not exist`);
    const name = key === "." ? "root" : key.slice(2).replace(/\//g, "__");
    result.push({ name, entry });
  }
  return result.sort((a, b) => a.name.localeCompare(b.name));
}

const hash = (text) => createHash("sha256").update(text).digest("hex").slice(0, 12);

function createProgram(root, entries) {
  const configPath = path.join(root, "tsconfig.json");
  let options = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.ReactJSX, strict: true, skipLibCheck: true, noEmit: true };
  if (fs.existsSync(configPath)) {
    const read = ts.readConfigFile(configPath, ts.sys.readFile);
    if (read.error) throw new UsageError(`cannot read tsconfig.json: ${ts.flattenDiagnosticMessageText(read.error.messageText, "\n")}`);
    options = { ...ts.parseJsonConfigFileContent(read.config, ts.sys, root).options, noEmit: true };
  }
  return ts.createProgram({ rootNames: entries, options });
}

/** Everything before this separator in a rendered type is project-relative; absolute paths would differ per machine. */
function clean(text, root) {
  return text.split(root).join("<root>").replace(/\s+/g, " ").trim();
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
    parts.push(...props.sort());
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

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const { root } = opts;
  const dir = path.join(root, "audit/api/snapshots");
  const targets = subpaths(root);
  if (targets.length === 0) throw new UsageError("package.json has no exports with a types file");
  const program = createProgram(root, targets.map((t) => t.entry));
  // An unresolved import turns its types into `any`; a snapshot written that way would silently weaken the gate.
  const unresolved = program.getSemanticDiagnostics().filter((d) => d.code === 2307 || d.code === 2792);
  if (unresolved.length > 0) {
    const first = unresolved[0];
    throw new UsageError(`${unresolved.length} unresolved module import(s), is npm ci done? First: ${ts.flattenDiagnosticMessageText(first.messageText, " ")}`);
  }
  const outputs = new Map(targets.map((t) => [path.join(dir, `${t.name}.snapshot`), snapshotOf(program, t.entry, root)]));
  const legacyTarget = path.join(root, "audit/api/public-root-api.snapshot");
  const legacy = legacySnapshot(root);

  if (!opts.check) {
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

  const problems = [];
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
    console.error("Public API snapshot drift detected (+ expected by the source, - found in the snapshot file):");
    for (const problem of problems) console.error(`  ${problem}`);
    console.error("Run npm run api:snapshot and review the explicit diff.");
    return 1;
  }
  const total = [...outputs.values()].reduce((n, text) => n + text.split("\n").filter(Boolean).length, 0);
  console.log(`Public API snapshot consistent (${outputs.size} subpath(s), ${total} exports, ${legacy.count} legacy root names, level ${opts.level}).`);
  return 0;
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
