#!/usr/bin/env node
// Rewrites every relative module specifier under src/ to an explicit ESM specifier:
//   "./X"      -> "./X.js"        when ./X.ts or ./X.tsx exists
//   "./dir"    -> "./dir/index.js" when ./dir/index.ts or ./dir/index.tsx exists
// Specifiers that already end in .js/.json/.mjs/.cjs are left alone. Idempotent.
// Usage: node scripts/codemods/add-js-extensions.mjs [--write] [dir...]   (default dir: src; dry run unless --write)
// Exit codes: 0 ok, 1 a specifier cannot be resolved or a file cannot be parsed, 2 usage error.
import { existsSync, lstatSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SOURCE = /\.(ts|tsx)$/;
const EXPLICIT = /\.(js|json|mjs|cjs)$/;

export function resolveSpecifier(fromFile, specifier) {
  if (!specifier.startsWith('.') || EXPLICIT.test(specifier)) return specifier;
  const base = resolve(dirname(fromFile), specifier);
  for (const ext of ['.ts', '.tsx']) if (existsSync(base + ext) && statSync(base + ext).isFile()) return `${specifier}.js`;
  if (existsSync(base) && statSync(base).isDirectory()) {
    for (const ext of ['.ts', '.tsx']) if (existsSync(join(base, `index${ext}`))) return `${specifier.replace(/\/$/, '')}/index.js`;
  }
  return undefined;
}

export function rewrite(file, text) {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  if ((source.parseDiagnostics ?? []).length > 0) throw new Error('syntax error');
  const edits = [];
  const unresolved = [];
  const consider = (literal) => {
    if (!literal || !ts.isStringLiteral(literal) || !literal.text.startsWith('.')) return;
    const next = resolveSpecifier(file, literal.text);
    if (next === undefined) unresolved.push(literal.text);
    else if (next !== literal.text) edits.push({ start: literal.getStart(source) + 1, end: literal.getEnd() - 1, next });
  };
  const visit = (node) => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) consider(node.moduleSpecifier);
    else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) consider(node.moduleReference.expression);
    else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) consider(node.arguments[0]);
    else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) consider(node.argument.literal);
    ts.forEachChild(node, visit);
  };
  visit(source);
  let out = text;
  for (const edit of edits.sort((a, b) => b.start - a.start)) out = out.slice(0, edit.start) + edit.next + out.slice(edit.end);
  return { text: out, count: edits.length, unresolved };
}

function collect(target, files) {
  const stat = lstatSync(target);
  if (stat.isSymbolicLink()) return;
  if (stat.isDirectory()) {
    for (const name of readdirSync(target).sort()) collect(join(target, name), files);
  } else if (SOURCE.test(target) && !target.endsWith('.d.ts')) files.push(target);
}

function main(argv) {
  let write = false;
  const dirs = [];
  for (const arg of argv) {
    if (arg === '--write') write = true;
    else if (arg.startsWith('--')) throw new Error(`unknown argument: ${arg}`);
    else dirs.push(arg);
  }
  const files = [];
  for (const dir of dirs.length > 0 ? dirs : ['src']) {
    const path = resolve(root, dir);
    if (!existsSync(path)) throw new Error(`not found: ${dir}`);
    collect(path, files);
  }
  let changed = 0;
  let failed = 0;
  for (const file of files) {
    try {
      const result = rewrite(file, readFileSync(file, 'utf8'));
      for (const spec of result.unresolved) {
        console.error(`${relative(root, file)}: cannot resolve ${spec}`);
        failed++;
      }
      if (result.count > 0) {
        changed++;
        if (write) writeFileSync(file, result.text);
      }
    } catch (error) {
      console.error(`${relative(root, file)}: ${error.message}`);
      failed++;
    }
  }
  console.log(`files scanned: ${files.length}, ${write ? 'rewritten' : 'would change'}: ${changed}, errors: ${failed}`);
  return failed > 0 ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    console.error(`add-js-extensions: ${error.message}`);
    process.exitCode = 2;
  }
}
