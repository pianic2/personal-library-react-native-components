#!/usr/bin/env node
// Documentation checks for the public entry pages (PLRNUI-139):
//   1. language policy: no Italian stop-words in the prose (code blocks and inline code are ignored);
//   2. every ```ts / ```tsx block is type-checked against src/ with the TypeScript compiler API (the package name
//      resolves to src/index.ts);
//   3. the install matrix between the BEGIN/END GENERATED: install-matrix markers equals the one generated from
//      config/compatibility.json (no hand-typed versions).
// Usage: node scripts/check-doc-snippets.mjs [--write-matrix] [file...]
//   default files: docs/getting-started.md docs/index.md. --write-matrix rewrites the generated block (files without the
//   markers are skipped for the matrix check). Exit codes: 0 ok, 1 a check failed, 2 usage or unreadable input.
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_FILES = ["docs/getting-started.md", "docs/index.md"];
const PACKAGE_NAME = "@personal-library/react-native-components";
const BEGIN = "<!-- BEGIN GENERATED: install-matrix -->";
const END = "<!-- END GENERATED: install-matrix -->";
const ITALIAN = new RegExp("(?<![\\p{L}])(?:è|può|più|perché|quindi|anche|della|delle|degli|nella|nelle|sono|questo|questa|installazione|libreria|componenti|persistenza|navigazione|gestito|contesti|ancora|puo|possono|usabili|riferimento|candidato|nel|del|dei|gli|una|uno|con)(?![\\p{L}])", "giu");
const LANES = [
  { runtime: "Expo Go", platform: "android" },
  { runtime: "Expo Go", platform: "ios" },
  { runtime: "Expo dev client", platform: "android" },
  { runtime: "Expo dev client", platform: "ios" },
  { runtime: "Bare React Native", platform: "android" },
  { runtime: "Bare React Native", platform: "ios" },
];

class UsageError extends Error {}

function parseArgs(argv) {
  const opts = { writeMatrix: false, files: [] };
  for (const arg of argv) {
    if (arg === "--write-matrix") opts.writeMatrix = true;
    else if (arg.startsWith("--")) throw new UsageError(`unknown argument: ${arg}`);
    else opts.files.push(arg);
  }
  if (opts.files.length === 0) opts.files = DEFAULT_FILES;
  return opts;
}

function read(file) {
  const path = DEFAULT_FILES.includes(file) ? resolve(root, file) : resolve(process.cwd(), file);
  if (!existsSync(path)) throw new UsageError(`file not found: ${file}`);
  return { path, text: readFileSync(path, "utf8") };
}

export function renderMatrix(config) {
  const entries = config.entries;
  const baseline = entries.find((e) => e.tier === "supported");
  if (!baseline) throw new UsageError("config/compatibility.json has no supported entry");
  const rows = LANES.map((lane) => {
    const entry = entries.find((e) => e.runtime === lane.runtime && e.platform === lane.platform);
    const source = entry ?? baseline;
    return `| ${lane.runtime} | ${lane.platform} | ${entry ? entry.tier : "residual"} | ${lane.runtime.startsWith("Bare") ? "n/a" : source.expo} | ${source.rn} | ${source.react} | ${entry ? entry.lastVerified : "not validated"} |`;
  });
  return [
    "| Runtime | Platform | Tier | Expo SDK | React Native | React | Last verified |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...rows,
  ].join("\n");
}

function proseOf(text) {
  return text.replace(/^```[\s\S]*?^```/gm, "").replace(/`[^`\n]*`/g, "").replace(/<!--[\s\S]*?-->/g, "");
}

export function italianWords(text) {
  return [...new Set((proseOf(text).match(ITALIAN) ?? []).map((w) => w.toLowerCase()))];
}

export function codeBlocks(text) {
  const blocks = [];
  let open = null;
  text.split(/\r?\n/).forEach((line, index) => {
    const fence = /^```(\S*)/.exec(line);
    if (!open && fence) open = { lang: fence[1].toLowerCase(), start: index + 2, body: [] };
    else if (open && /^```\s*$/.test(line)) {
      if (open.lang === "ts" || open.lang === "tsx") blocks.push({ code: `${open.body.join("\n")}\n`, line: open.start, lang: open.lang });
      open = null;
    } else if (open) open.body.push(line);
  });
  if (open) throw new UsageError(`unterminated code fence starting at line ${open.start - 1}`);
  return blocks;
}

function typecheck(items) {
  const dir = mkdtempSync(join(tmpdir(), "doc-snippets-"));
  try {
    symlinkSync(join(root, "node_modules"), join(dir, "node_modules"));
    const names = [];
    for (const item of items) {
      const name = `snippet-${names.length + 1}.${item.lang}`;
      writeFileSync(join(dir, name), `${item.code}\nexport {};\n`);
      names.push({ name, origin: `${item.file}:${item.line}` });
    }
    const options = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.ReactJSX, strict: true, noEmit: true, skipLibCheck: true, baseUrl: dir, paths: { [PACKAGE_NAME]: [join(root, "src/index.ts")] } };
    const program = ts.createProgram(names.map((n) => join(dir, n.name)), options);
    const errors = [];
    for (const d of ts.getPreEmitDiagnostics(program)) {
      if (!d.file || !d.file.fileName.startsWith(dir)) continue;
      const { line } = d.file.getLineAndCharacterOfPosition(d.start ?? 0);
      const origin = names.find((n) => d.file.fileName.endsWith(n.name))?.origin ?? d.file.fileName;
      errors.push(`${origin} (block line ${line + 1}): ${ts.flattenDiagnosticMessageText(d.messageText, "\n")}`);
    }
    return errors;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const config = JSON.parse(readFileSync(join(root, "config/compatibility.json"), "utf8"));
  const matrix = renderMatrix(config);
  const failures = [];
  const snippets = [];
  for (const file of opts.files) {
    const { path, text } = read(file);
    const rel = relative(root, path);
    const words = italianWords(text);
    if (words.length > 0) failures.push(`${rel}: Italian words found (${words.join(", ")}); public docs are English`);
    for (const block of codeBlocks(text)) snippets.push({ ...block, file: rel });
    const begin = text.indexOf(BEGIN);
    const end = text.indexOf(END);
    if (begin === -1 && end === -1) continue;
    if (begin === -1 || end === -1 || end < begin || text.indexOf(BEGIN, begin + 1) !== -1) {
      failures.push(`${rel}: the install-matrix markers are missing, duplicated or out of order`);
      continue;
    }
    const expected = `${text.slice(0, begin + BEGIN.length)}\n${matrix}\n${text.slice(end)}`;
    if (opts.writeMatrix) writeFileSync(path, expected);
    else if (expected !== text) failures.push(`${rel}: the install matrix is out of date; run node scripts/check-doc-snippets.mjs --write-matrix`);
  }
  if (snippets.length > 0) failures.push(...typecheck(snippets));
  else failures.push("no ts/tsx snippet found in the checked files");
  for (const failure of failures) console.error(`check-doc-snippets: ${failure}`);
  console.log(`check-doc-snippets: ${opts.files.length} file(s), ${snippets.length} snippet(s), ${failures.length} problem(s)`);
  return failures.length > 0 ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(`check-doc-snippets: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
  }
}
