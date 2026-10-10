#!/usr/bin/env node
// Fails on relative module specifiers without an explicit extension (Node ESM and webpack 5 `fullySpecified`
// reject them) and on platform-suffixed source files (*.web.*, *.native.*, *.ios.*, *.android.*, decision D9).
// Usage: node scripts/check-esm-specifiers.mjs [dir...]   (default: src)
// Exit codes: 0 clean, 1 violations or unparsable files, 2 usage error.
import { existsSync, lstatSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$/;
const EXPLICIT = /\.(js|json|mjs|cjs)$/;
const PLATFORM_FILE = /\.(web|native|ios|android)\.[^./]+$/;

function collect(target, files) {
  const stat = lstatSync(target);
  if (stat.isSymbolicLink()) return;
  if (stat.isDirectory()) {
    for (const name of readdirSync(target).sort()) collect(join(target, name), files);
  } else files.push(target);
}

function specifiers(file, text) {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, /x$/.test(file) ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  if ((source.parseDiagnostics ?? []).length > 0) throw new Error('syntax error');
  const found = [];
  const consider = (literal) => {
    if (literal && ts.isStringLiteral(literal) && literal.text.startsWith('.')) {
      found.push({ text: literal.text, line: source.getLineAndCharacterOfPosition(literal.getStart(source)).line + 1 });
    }
  };
  const visit = (node) => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) consider(node.moduleSpecifier);
    else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) consider(node.moduleReference.expression);
    else if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === 'require'))) consider(node.arguments[0]);
    else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) consider(node.argument.literal);
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

export function check(dirs) {
  const files = [];
  for (const dir of dirs) {
    const path = resolve(root, dir);
    if (!existsSync(path)) throw new Error(`not found: ${dir}`);
    collect(path, files);
  }
  const problems = [];
  for (const file of files.sort()) {
    const rel = relative(root, file);
    if (PLATFORM_FILE.test(file)) problems.push(`${rel}: platform-suffixed source file (use Platform.OS / Platform.select)`);
    if (!SOURCE.test(file) || file.endsWith('.d.ts')) continue;
    try {
      for (const { text, line } of specifiers(file, readFileSync(file, 'utf8'))) {
        if (!EXPLICIT.test(text)) problems.push(`${rel}:${line}: relative specifier "${text}" has no explicit extension`);
      }
    } catch (error) {
      problems.push(`${rel}: ${error.message}`);
    }
  }
  return { scanned: files.length, problems };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.some((a) => a.startsWith('--'))) throw new Error(`unknown argument: ${args.find((a) => a.startsWith('--'))}`);
    const { scanned, problems } = check(args.length > 0 ? args : ['src']);
    for (const problem of problems) console.error(`check-esm-specifiers: ${problem}`);
    console.log(`check-esm-specifiers: ${scanned} file(s) scanned, ${problems.length} problem(s)`);
    process.exitCode = problems.length > 0 ? 1 : 0;
  } catch (error) {
    console.error(`check-esm-specifiers: ${error.message}`);
    process.exitCode = 2;
  }
}
