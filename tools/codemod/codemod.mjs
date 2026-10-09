#!/usr/bin/env node
// Rewrites module specifiers from a legacy package name to a target name (and its subpaths 1:1).
// Uses the TypeScript parser only; no other runtime dependency.
// Usage: node tools/codemod/codemod.mjs [--write] [--check] [--mapping <file>] <file-or-dir>...
//   default is a dry run; --write rewrites files in place; --check exits 1 if any file would change.
// Exit codes: 0 ok, 1 --check found changes or a file could not be parsed/read, 2 usage or mapping error.
import { lstatSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const here = dirname(fileURLToPath(import.meta.url));
const EXTENSIONS = new Map([
  ['.ts', ts.ScriptKind.TS], ['.mts', ts.ScriptKind.TS], ['.cts', ts.ScriptKind.TS], ['.tsx', ts.ScriptKind.TSX],
  ['.js', ts.ScriptKind.JS], ['.mjs', ts.ScriptKind.JS], ['.cjs', ts.ScriptKind.JS], ['.jsx', ts.ScriptKind.JSX],
]);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist']);
const MOCK_OBJECTS = new Set(['jest', 'vi']);
const MOCK_METHODS = new Set(['mock', 'doMock', 'unmock', 'dontMock', 'requireActual', 'requireMock', 'createMockFromModule', 'importActual', 'importMock']);
const PACKAGE_NAME = /^(@[a-z0-9~-][a-z0-9._~-]*\/)?[a-z0-9~-][a-z0-9._~-]*$/;

export class UsageError extends Error {}

export function loadMapping(file = join(here, 'mapping.json')) {
  let raw;
  try {
    raw = JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    throw new UsageError(`cannot read mapping ${file}: ${error.message}`);
  }
  const { schemaVersion, from, to, ...rest } = raw ?? {};
  if (schemaVersion !== 1 || Object.keys(rest).length > 0) throw new UsageError('mapping: schemaVersion must be 1 and only schemaVersion, from, to are allowed');
  for (const [key, value] of Object.entries({ from, to })) {
    if (typeof value !== 'string' || !PACKAGE_NAME.test(value)) throw new UsageError(`mapping: ${key} must be a package name`);
  }
  // A result that matches the mapping again would not be idempotent.
  if (to === from || to.startsWith(`${from}/`) || from.startsWith(`${to}/`)) throw new UsageError('mapping: from and to must differ and must not nest');
  return { from, to };
}

function rewriteSpecifier(text, mapping) {
  if (text === mapping.from) return mapping.to;
  if (text.startsWith(`${mapping.from}/`)) return mapping.to + text.slice(mapping.from.length);
  return undefined;
}

function isSpecifierCall(node) {
  const callee = node.expression;
  if (callee.kind === ts.SyntaxKind.ImportKeyword) return true;
  if (ts.isIdentifier(callee) && callee.text === 'require') return true;
  if (ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression)) {
    if (callee.expression.text === 'require' && callee.name.text === 'resolve') return true;
    return MOCK_OBJECTS.has(callee.expression.text) && MOCK_METHODS.has(callee.name.text);
  }
  return false;
}

// Returns the source text with specifiers rewritten, and how many were rewritten.
export function transform(text, fileName, mapping) {
  const scriptKind = EXTENSIONS.get(extname(fileName));
  const source = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, scriptKind);
  const diagnostics = source.parseDiagnostics ?? [];
  if (diagnostics.length > 0) {
    const first = diagnostics[0];
    const { line } = source.getLineAndCharacterOfPosition(first.start ?? 0);
    throw new Error(`syntax error at line ${line + 1}: ${ts.flattenDiagnosticMessageText(first.messageText, '\n')}`);
  }
  const edits = [];
  const consider = (literal) => {
    if (!literal || !ts.isStringLiteral(literal)) return;
    const next = rewriteSpecifier(literal.text, mapping);
    if (next !== undefined) edits.push({ start: literal.getStart(source) + 1, end: literal.getEnd() - 1, next });
  };
  const visit = (node) => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) consider(node.moduleSpecifier);
    else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) consider(node.moduleReference.expression);
    else if (ts.isCallExpression(node) && isSpecifierCall(node)) consider(node.arguments[0]);
    else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) consider(node.argument.literal);
    else if (ts.isModuleDeclaration(node) && ts.isStringLiteral(node.name)) consider(node.name);
    ts.forEachChild(node, visit);
  };
  visit(source);
  let out = text;
  for (const edit of edits.sort((a, b) => b.start - a.start)) out = out.slice(0, edit.start) + edit.next + out.slice(edit.end);
  return { text: out, count: edits.length };
}

function collect(target, files) {
  const stat = lstatSync(target);
  if (stat.isSymbolicLink()) return;
  if (stat.isDirectory()) {
    for (const name of readdirSync(target).sort()) {
      if (!SKIP_DIRS.has(name)) collect(join(target, name), files);
    }
  } else if (stat.isFile() && EXTENSIONS.has(extname(target))) {
    files.push(target);
  }
}

export function run({ paths, write = false, mapping }) {
  const files = [];
  for (const target of paths) collect(resolve(target), files);
  const report = { scanned: files.length, changed: [], errors: [] };
  for (const file of files) {
    try {
      const original = readFileSync(file, 'utf8');
      const result = transform(original, file, mapping);
      if (result.count === 0) continue;
      report.changed.push({ file, count: result.count });
      if (write) writeFileSync(file, result.text);
    } catch (error) {
      report.errors.push({ file, message: error.message });
    }
  }
  return report;
}

function main(argv) {
  const opts = { write: false, check: false, mappingFile: undefined, paths: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--write') opts.write = true;
    else if (arg === '--check') opts.check = true;
    else if (arg === '--mapping') {
      opts.mappingFile = argv[++i];
      if (!opts.mappingFile) throw new UsageError('--mapping needs a file');
    } else if (arg.startsWith('--')) throw new UsageError(`unknown argument: ${arg}`);
    else opts.paths.push(arg);
  }
  if (opts.write && opts.check) throw new UsageError('--write and --check are mutually exclusive');
  if (opts.paths.length === 0) throw new UsageError('no file or directory given');
  const report = run({ paths: opts.paths, write: opts.write, mapping: loadMapping(opts.mappingFile) });
  const cwd = process.cwd();
  for (const { file, count } of report.changed) console.log(`${opts.write ? 'rewrote' : 'would rewrite'} ${relative(cwd, file)}: ${count} specifier(s)`);
  for (const { file, message } of report.errors) console.error(`error ${relative(cwd, file)}: ${message}`);
  console.log(`files scanned: ${report.scanned}, files changed: ${report.changed.length}${opts.write ? '' : ' (dry run)'}, errors: ${report.errors.length}`);
  if (report.errors.length > 0) return 1;
  if (opts.check && report.changed.length > 0) return 1;
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    console.error(`codemod: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
  }
}
