#!/usr/bin/env node
// Loader and lint for component metadata (ADR 0016, PLRNUI-166): one src/components/<Name>/<Name>.meta.ts per component.
// Dependency-free apart from the repo's own `typescript` devDependency (used to read the .ts files, no type checking here).
// Library: import { loadMetas, lintMetas } from './meta.mjs'.
// CLI: node scripts/lib/meta.mjs [--lint | --strict | --json] [--root <dir>]
//   --lint    (default) structural lint; exit 0 ok, 1 findings
//   --strict  --lint plus the stricter content bar used by the maturity gate (see STRICT_RULES)
//   --json    print the entries as sorted JSON (exit 1 if the lint fails, nothing printed then)
// Exit 2 on usage errors, unreadable input or a meta file that cannot be evaluated.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { createContext, runInContext } from 'node:vm';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

export const STATUSES = ['prototype', 'demo', 'stable', 'production-ready', 'deprecated'];
export const KEYS = ['name', 'category', 'status', 'summary', 'whenToUse', 'whenNotToUse', 'composition', 'a11y', 'variants', 'states', 'platformNotes', 'examples'];
const SUMMARY_MAX = 140;

export class MetaError extends Error {}

const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const isText = (v) => typeof v === 'string' && v.trim().length > 0;
const isTextArray = (v) => Array.isArray(v) && v.every(isText);

export function componentDirs(root) {
  const base = join(root, 'src', 'components');
  if (!existsSync(base)) throw new MetaError(`missing directory ${base}`);
  return readdirSync(base, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort();
}

// Evaluates a meta file: transpile (no type check) to CommonJS and run it in a function scope with a private `exports`.
function evaluate(file) {
  const source = readFileSync(file, 'utf8');
  const { outputText, diagnostics } = ts.transpileModule(source, {
    reportDiagnostics: true,
    fileName: file,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  if (diagnostics && diagnostics.length > 0) throw new MetaError(`${file}: syntax error: ${ts.flattenDiagnosticMessageText(diagnostics[0].messageText, '\n')}`);
  // Defence in depth, not a security boundary (meta files are trusted in-repo code reviewed like any source file):
  // an empty context with a null-prototype global, and `module`/`exports` created inside it, so the file has no host
  // objects to reach `process` through. There is no `require`: only `import type` is allowed, which transpiles away.
  const context = createContext(Object.create(null), { microtaskMode: 'afterEvaluate' });
  let exported;
  try {
    const module = runInContext('({ exports: {} })', context);
    context.module = module;
    context.exports = module.exports;
    runInContext(outputText, context, { filename: file, timeout: 1000 });
    exported = module.exports.meta;
  } catch (error) {
    throw new MetaError(`${file}: cannot evaluate: ${error.message}`);
  }
  return exported;
}

/** Loads every component directory; entries carry `file` (repo-relative) and `meta` (undefined when the file is missing). */
export function loadMetas(root) {
  return componentDirs(root).map((dir) => {
    const rel = `src/components/${dir}/${dir}.meta.ts`;
    const file = join(root, rel);
    return { dir, file: rel, meta: existsSync(file) ? evaluate(file) : undefined };
  });
}

export function lintMetas(entries, { root, strict = false } = {}) {
  const errors = [];
  const fail = (entry, message) => errors.push(`${entry.file}: ${message}`);
  const names = new Set(entries.map((e) => e.dir));
  for (const entry of entries) {
    const meta = entry.meta;
    if (meta === undefined) {
      fail(entry, 'missing meta file or no exported `meta`');
      continue;
    }
    if (!isObject(meta)) {
      fail(entry, '`meta` must be an object');
      continue;
    }
    for (const key of Object.keys(meta)) if (!KEYS.includes(key)) fail(entry, `unknown key "${key}"`);
    for (const key of KEYS) if (!(key in meta)) fail(entry, `missing key "${key}"`);
    try {
      if (JSON.stringify(JSON.parse(JSON.stringify(meta))) !== JSON.stringify(meta)) fail(entry, 'meta is not JSON-serialisable');
    } catch {
      fail(entry, 'meta is not JSON-serialisable');
    }
    if (meta.name !== entry.dir) fail(entry, `name must equal the directory name "${entry.dir}" (got ${JSON.stringify(meta.name)})`);
    if (!isText(meta.category)) fail(entry, 'category must be a non-empty string');
    if (!STATUSES.includes(meta.status)) fail(entry, `status must be one of ${STATUSES.join(', ')}`);
    if (!isText(meta.summary) || meta.summary.length > SUMMARY_MAX) fail(entry, `summary must be 1..${SUMMARY_MAX} characters`);
    if (!isTextArray(meta.whenToUse)) fail(entry, 'whenToUse must be an array of non-empty strings');
    if (!Array.isArray(meta.whenNotToUse)) fail(entry, 'whenNotToUse must be an array');
    else
      for (const item of meta.whenNotToUse) {
        if (!isObject(item) || !isText(item.reason) || !isText(item.instead)) fail(entry, 'whenNotToUse items need non-empty reason and instead');
        else if (!names.has(item.instead)) fail(entry, `whenNotToUse.instead names a non-existent component "${item.instead}"`);
      }
    if (!isObject(meta.composition)) fail(entry, 'composition must be an object');
    else {
      for (const key of ['parents', 'children', 'pairsWith']) {
        const list = meta.composition[key];
        if (!isTextArray(list)) fail(entry, `composition.${key} must be an array of component names`);
        else for (const name of list) if (!names.has(name)) fail(entry, `composition.${key} names a non-existent component "${name}"`);
      }
      for (const key of Object.keys(meta.composition)) if (!['parents', 'children', 'pairsWith'].includes(key)) fail(entry, `unknown composition key "${key}"`);
    }
    if (!isTextArray(meta.a11y)) fail(entry, 'a11y must be an array of strings');
    if (!isTextArray(meta.platformNotes)) fail(entry, 'platformNotes must be an array of strings');
    if (!isObject(meta.variants) || !Object.values(meta.variants).every(isTextArray)) fail(entry, 'variants must map prop names to arrays of strings');
    if (!isTextArray(meta.states) || meta.states.length === 0) fail(entry, 'states must list at least one state');
    if (!Array.isArray(meta.examples) || meta.examples.length === 0) fail(entry, 'examples must list at least one example');
    else
      for (const example of meta.examples) {
        if (!isObject(example) || !isText(example.title) || (!isText(example.path) && !isText(example.code))) fail(entry, 'each example needs a title and a path or code');
        else if (isText(example.path) && root) {
          const target = resolve(root, example.path);
          const rel = relative(root, target);
          if (isAbsolute(example.path) || rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) fail(entry, `example path must stay inside the repository: ${example.path}`);
          else if (!existsSync(target)) fail(entry, `example path does not exist: ${example.path}`);
        }
      }
    if (strict) for (const rule of STRICT_RULES) rule.check(meta, (message) => fail(entry, `[strict] ${message}`));
  }
  return errors;
}

/** Stricter content bar; the maturity gate (E1-02) builds on it. */
export const STRICT_RULES = [
  { id: 'when-to-use', check: (meta, fail) => { if (Array.isArray(meta.whenToUse) && meta.whenToUse.length === 0) fail('whenToUse must list at least one case'); } },
  {
    id: 'promoted-evidence',
    check: (meta, fail) => {
      if (meta.status !== 'stable' && meta.status !== 'production-ready') return;
      if (Array.isArray(meta.a11y) && meta.a11y.length === 0) fail(`${meta.status} components must document accessibility`);
      if (Array.isArray(meta.examples) && !meta.examples.some((e) => isObject(e) && isText(e.path))) fail(`${meta.status} components need an example with a path`);
    },
  },
];

export function toJson(entries) {
  return `${JSON.stringify(entries.map((e) => ({ file: e.file, ...e.meta })), null, 2)}\n`;
}

function parseArgs(argv, defaultRoot) {
  const opts = { mode: 'lint', root: defaultRoot };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--lint' || arg === '--strict' || arg === '--json') opts.mode = arg.slice(2);
    else if (arg === '--root' && typeof argv[i + 1] === 'string') opts.root = resolve(argv[(i += 1)]);
    else throw new MetaError(`unknown or incomplete argument: ${arg}`);
  }
  return opts;
}

function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const opts = parseArgs(process.argv.slice(2), resolve(here, '..', '..'));
  if (!statSync(opts.root).isDirectory()) throw new MetaError(`not a directory: ${opts.root}`);
  const entries = loadMetas(opts.root);
  const errors = lintMetas(entries, { root: opts.root, strict: opts.mode === 'strict' });
  if (errors.length > 0) {
    console.error(errors.join('\n'));
    console.error(`${errors.length} metadata problem(s)`);
    return 1;
  }
  if (opts.mode === 'json') process.stdout.write(toJson(entries));
  else console.log(`metadata ok: ${entries.length} components`);
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(error instanceof MetaError ? error.message : `unexpected error: ${error.stack ?? error}`);
    process.exitCode = 2;
  }
}
