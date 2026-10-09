#!/usr/bin/env node
// Release gate for documents that still contain cutover placeholders such as <TEXO_PACKAGE>.
//   node scripts/check-doc-tokens.mjs [file...]     lists remaining tokens; exit 1 if any, 0 if none
//   node scripts/check-doc-tokens.mjs --typecheck [file...]
//       extracts every ```tsx block, replaces the placeholders with the current package name and type-checks
//       the blocks against src/ with the TypeScript compiler API; exit 0 if they compile, 1 if not
// Default file: docs/migration-to-texo.md. Exit 2 on usage errors or unreadable files.
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_FILES = ['docs/migration-to-texo.md'];
const TOKEN = /<[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+>/g;
const CURRENT_NAME = '@personal-library/react-native-components';

class UsageError extends Error {}

function parseArgs(argv) {
  const opts = { typecheck: false, files: [] };
  for (const arg of argv) {
    if (arg === '--typecheck') opts.typecheck = true;
    else if (arg.startsWith('--')) throw new UsageError(`unknown argument: ${arg}`);
    else opts.files.push(arg);
  }
  if (opts.files.length === 0) opts.files = DEFAULT_FILES;
  return opts;
}

function read(file) {
  const path = resolve(root, file);
  if (!existsSync(path)) throw new UsageError(`file not found: ${file}`);
  return { path, text: readFileSync(path, 'utf8') };
}

export function findTokens(text) {
  const found = [];
  text.split('\n').forEach((line, index) => {
    for (const match of line.matchAll(TOKEN)) found.push({ token: match[0], line: index + 1 });
  });
  return found;
}

export function tsxBlocks(text) {
  const blocks = [];
  const re = /^```tsx[^\n]*\n([\s\S]*?)^```/gm;
  for (const match of text.matchAll(re)) {
    blocks.push({ code: match[1], line: text.slice(0, match.index).split('\n').length + 1 });
  }
  return blocks;
}

function typecheck(files) {
  const dir = mkdtempSync(join(tmpdir(), 'doc-tokens-'));
  try {
    symlinkSync(join(root, 'node_modules'), join(dir, 'node_modules'));
    const sources = [];
    for (const file of files) {
      const { text } = read(file);
      tsxBlocks(text).forEach((block, index) => {
        const name = `block-${sources.length + 1}.tsx`;
        mkdirSync(dir, { recursive: true });
        // Each block is its own module so identical component names in different blocks do not clash.
        writeFileSync(join(dir, name), `${block.code.replace(TOKEN, CURRENT_NAME)}\nexport {};\n`);
        sources.push({ name, origin: `${file}:${block.line}` });
      });
    }
    if (sources.length === 0) throw new UsageError('no tsx block found');
    const options = {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      jsx: ts.JsxEmit.ReactJSX,
      strict: true,
      noEmit: true,
      skipLibCheck: true,
      baseUrl: dir,
      paths: { [CURRENT_NAME]: [join(root, 'src/index.ts')] },
    };
    const program = ts.createProgram(sources.map((s) => join(dir, s.name)), options);
    const diagnostics = ts.getPreEmitDiagnostics(program).filter((d) => d.file && d.file.fileName.startsWith(dir));
    for (const d of diagnostics) {
      const { line } = d.file.getLineAndCharacterOfPosition(d.start ?? 0);
      const source = sources.find((s) => d.file.fileName.endsWith(s.name));
      console.error(`${source?.origin ?? d.file.fileName} (block line ${line + 1}): ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`);
    }
    console.log(`${sources.length} tsx block(s) type-checked, ${diagnostics.length} error(s)`);
    return diagnostics.length === 0 ? 0 : 1;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.typecheck) return typecheck(opts.files);
  let total = 0;
  for (const file of opts.files) {
    const { path, text } = read(file);
    for (const { token, line } of findTokens(text)) {
      console.log(`${relative(root, path)}:${line}: ${token}`);
      total++;
    }
  }
  console.log(`${total} placeholder token(s) remaining`);
  return total > 0 ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(`check-doc-tokens: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
  }
}
