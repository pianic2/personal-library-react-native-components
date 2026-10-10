#!/usr/bin/env node
// Maturity gate (PLRNUI-174, ADR 0016): verifies the evidence behind each component's declared status.
// Reads component status ONLY through scripts/lib/meta.mjs. For every component it checks:
//   exported      a value is re-exported from src/components/<Name>/index.* by src/index.ts
//   propsType     a type named *Props (or *Value, the context-value contract of provider components such as NavContext)
//                 from the same directory is exported by src/index.ts
//   docsPage      docs/components/<category>/<kebab-name>.md exists
//   nav           mkdocs.yml nav lists that page
//   catalog       docs/components.md links that page
//   example       an examples/*.tsx file uses one of the component's own exported names (code only, comments ignored)
//   test          a tests/**/*.test.tsx file mentions one of the exported names
// Components with status demo, stable or production-ready must pass every check (exit 1 otherwise); `prototype` and
// `deprecated` components are reported but do not fail. A component directory without a valid meta file, or any meta
// lint problem, is a failure.
// Usage: node scripts/maturity-check.mjs [--root <dir>] [--json]     Exit 0 ok, 1 failures, 2 usage/unreadable input.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { MetaError, lintMetas, loadMetas } from './lib/meta.mjs';

export const CHECKS = ['exported', 'propsType', 'docsPage', 'nav', 'catalog', 'example', 'test'];
const MUST_PASS = new Set(['demo', 'stable', 'production-ready']);

class UsageError extends Error {}

export const kebab = (name) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

const read = (file) => readFileSync(file, 'utf8');
// Code only: block and line comments are dropped so a mention in a comment is not evidence.
const stripComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
// Lines of a YAML/Markdown file that are not YAML comments.
const yamlCode = (text) => text.split(/\r?\n/).filter((line) => !line.trim().startsWith('#')).join('\n');

function files(dir, pattern) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : files(path, pattern);
    return pattern.test(entry.name) ? [path] : [];
  });
}

/** Names re-exported by src/index.ts, grouped by component directory: { Dir: { values: [], types: [] } }. */
export function rootExports(root) {
  const file = join(root, 'src', 'index.ts');
  if (!existsSync(file)) throw new UsageError(`missing ${file}`);
  const source = ts.createSourceFile(file, read(file), ts.ScriptTarget.ES2022, true);
  const byDir = {};
  for (const statement of source.statements) {
    if (!ts.isExportDeclaration(statement) || !statement.moduleSpecifier || !statement.exportClause || !ts.isNamedExports(statement.exportClause)) continue;
    const match = /^\.\/components\/([^/]+)\//.exec(statement.moduleSpecifier.text);
    if (!match) continue;
    const entry = (byDir[match[1]] ??= { values: [], types: [] });
    for (const element of statement.exportClause.elements) (statement.isTypeOnly || element.isTypeOnly ? entry.types : entry.values).push(element.name.text);
  }
  return byDir;
}

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const mentions = (text, names) => names.some((name) => new RegExp(`\\b${escape(name)}\\b`).test(text));

export function checkComponents(root) {
  const entries = loadMetas(root);
  const problems = lintMetas(entries, { root });
  const exported = rootExports(root);
  const mkdocs = existsSync(join(root, 'mkdocs.yml')) ? yamlCode(read(join(root, 'mkdocs.yml'))) : '';
  const catalog = existsSync(join(root, 'docs', 'components.md')) ? read(join(root, 'docs', 'components.md')).replace(/<!--[\s\S]*?-->/g, '') : '';
  const exampleText = files(join(root, 'examples'), /\.tsx$/).map((f) => stripComments(read(f))).join('\n');
  const tests = files(join(root, 'tests'), /\.test\.tsx?$/).map((f) => stripComments(read(f)));
  const rows = [];
  for (const { dir, meta } of entries) {
    if (!meta) continue;
    const names = exported[dir]?.values ?? [];
    const page = `components/${String(meta.category)}/${kebab(dir)}.md`;
    const result = {
      exported: names.length > 0,
      propsType: (exported[dir]?.types ?? []).some((name) => /(Props|Value)$/.test(name)),
      docsPage: existsSync(join(root, 'docs', page)) && statSync(join(root, 'docs', page)).isFile(),
      nav: mkdocs.includes(page),
      catalog: catalog.includes(page),
      example: mentions(exampleText, names),
      test: tests.some((text) => mentions(text, names)),
    };
    const failed = CHECKS.filter((check) => !result[check]);
    rows.push({ name: dir, status: String(meta.status), enforced: MUST_PASS.has(meta.status), failed, ...result });
  }
  return { problems, rows };
}

function table(rows) {
  const header = ['component', 'status', ...CHECKS];
  const lines = rows.map((r) => [r.name, r.status, ...CHECKS.map((c) => (r[c] ? 'ok' : 'FAIL'))]);
  const widths = header.map((h, i) => Math.max(h.length, ...lines.map((l) => l[i].length)));
  const fmt = (cells) => cells.map((c, i) => c.padEnd(widths[i])).join('  ').trimEnd();
  return [fmt(header), ...lines.map(fmt)].join('\n');
}

function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  let root = resolve(here, '..');
  let json = false;
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--json') json = true;
    else if (argv[i] === '--root' && typeof argv[i + 1] === 'string' && !argv[i + 1].startsWith('--')) root = resolve(argv[(i += 1)]);
    else throw new UsageError(`unknown or incomplete argument: ${argv[i]}`);
  }
  if (!existsSync(root) || !statSync(root).isDirectory()) throw new UsageError(`not a directory: ${root}`);
  const { problems, rows } = checkComponents(root);
  const failing = rows.filter((r) => r.enforced && r.failed.length > 0);
  const code = problems.length > 0 || failing.length > 0 ? 1 : 0;
  if (json) {
    process.stdout.write(`${JSON.stringify({ ok: code === 0, problems, components: rows }, null, 2)}\n`);
  } else {
    console.log(table(rows));
    const notYet = rows.filter((r) => !r.enforced && r.failed.length > 0).length;
    console.log(`\n${rows.length} components; ${failing.length} enforced failure(s); ${notYet} not-yet-promoted component(s) with open checks`);
    for (const row of failing) console.error(`FAIL ${row.name} (${row.status}): ${row.failed.join(', ')}`);
    for (const problem of problems) console.error(`META ${problem}`);
  }
  return code;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(error instanceof UsageError || error instanceof MetaError ? error.message : `unexpected error: ${error.stack ?? error}`);
    process.exitCode = 2;
  }
}
